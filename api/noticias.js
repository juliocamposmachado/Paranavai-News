const axios = require('axios');
const cheerio = require('cheerio');

// Lista de portais parceiros
const PORTAIS_PARCEIROS = [
    {
        nome: "Paraná Portal",
        url: "https://www.paranaportal.com",
        busca: "https://www.paranaportal.com/?s=Paranavai",
        logo: "https://www.paranaportal.com/wp-content/uploads/2023/01/logo-parana-portal.png",
        cor: "#1e4a73",
        selector: {
            artigos: "article",
            titulo: "h2 a, h3 a",
            resumo: ".excerpt, p",
            link: "h2 a, h3 a",
            imagem: "img",
            data: ".date, time"
        }
    },
    {
        nome: "Portal Paranavaí",
        url: "https://www.portalparanavai.com.br",
        busca: "https://www.portalparanavai.com.br",
        logo: "https://via.placeholder.com/150x50/2c5f8a/ffffff?text=Portal+Paranavai",
        cor: "#2c5f8a",
        selector: {
            artigos: ".post, article",
            titulo: "h2 a, h1 a",
            resumo: ".excerpt, .summary",
            link: "h2 a, h1 a",
            imagem: ".post-thumbnail img, .featured-image img",
            data: ".post-date, .date"
        }
    },
    {
        nome: "Bing News Paraná",
        url: "https://www.bing.com",
        busca: "https://www.bing.com/news/search?q=portal+noticias+parana+paranavaí&qpvt=portal+noticias+parana&FORM=EWRE",
        logo: "https://www.bing.com/sa/simg/favicon-trans-bg-blue-mg.ico",
        cor: "#0078d4",
        selector: {
            artigos: ".news-card, .newsitem, [data-module='NewsArticle']",
            titulo: "h3 a, h4 a, .title a",
            resumo: ".snippet, .caption, .description",
            link: "h3 a, h4 a, .title a",
            imagem: ".newsimg img, .img img, .media img",
            data: ".source .timestamp, .published, time"
        },
        tipo: "bing_news"
    },
    {
        nome: "Noroeste Online",
        url: "https://www.noroesteonline.com",
        busca: "https://www.noroesteonline.com/",
        logo: "https://via.placeholder.com/150x50/2e7d32/ffffff?text=Noroeste+Online",
        cor: "#2e7d32",
        selector: {
            artigos: ".post-item, article, .news",
            titulo: ".post-title a, h2 a, .headline a",
            resumo: ".post-excerpt, .excerpt, .lead",
            link: ".post-title a, h2 a, .headline a",
            imagem: ".post-thumb img, .thumbnail img",
            data: ".post-date, .timestamp"
        }
    },
    {
        nome: "Bem Paraná",
        url: "https://www.bemparana.com.br",
        busca: "https://www.bemparana.com.br/?s=paranavai",
        logo: "https://www.bemparana.com.br/wp-content/themes/bemparana/assets/images/logo.png",
        cor: "#ff6900",
        selector: {
            artigos: "article, .post, .entry",
            titulo: "h2 a, h3 a, .entry-title a",
            resumo: ".excerpt, .entry-summary, p",
            link: "h2 a, h3 a, .entry-title a",
            imagem: ".wp-post-image, img",
            data: ".date, .entry-date, time"
        }
    }
];

// Cache simples em memória (para Vercel, pode usar Vercel KV ou outra solução)
let cache = {
    noticias: [],
    ultimaAtualizacao: null
};

// Função específica para scraping do Bing News
async function scrapearBingNews(portal) {
    try {
        console.log(`🔍 Buscando notícias de: ${portal.nome} (Bing News)`);
        
        const response = await axios.get(portal.busca, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Referer': 'https://www.bing.com/'
            }
        });
        
        const $ = cheerio.load(response.data);
        const noticias = [];
        
        // Seletores específicos do Bing News
        let newsCards = $('.news-card, .newsitem, [data-module="NewsArticle"]').slice(0, 4);
        
        // Fallback se não encontrar
        if (newsCards.length === 0) {
            newsCards = $('article, .b_algo, .news').slice(0, 4);
        }
        
        newsCards.each((index, element) => {
            const $el = $(element);
            
            // Título (múltiplas tentativas)
            let titulo = $el.find('h3 a').first().text().trim() ||
                        $el.find('h4 a').first().text().trim() ||
                        $el.find('.title a').first().text().trim() ||
                        $el.find('a[href*="http"]').first().text().trim();
            
            // Link
            let link = $el.find('h3 a').first().attr('href') ||
                      $el.find('h4 a').first().attr('href') ||
                      $el.find('.title a').first().attr('href') ||
                      $el.find('a[href*="http"]').first().attr('href');
            
            // Resumo
            let resumo = $el.find('.snippet').first().text().trim() ||
                        $el.find('.caption').first().text().trim() ||
                        $el.find('.description').first().text().trim() ||
                        $el.find('p').first().text().trim();
            
            // Imagem
            let imagem = $el.find('.newsimg img').first().attr('src') ||
                        $el.find('.img img').first().attr('src') ||
                        $el.find('img').first().attr('src');
            
            // Data
            let data = $el.find('.source .timestamp').first().text().trim() ||
                      $el.find('.published').first().text().trim() ||
                      $el.find('time').first().text().trim() ||
                      $el.find('.cite').first().text().trim() ||
                      'Recente';
            
            // Validar e filtrar notícias relevantes
            if (titulo && link && titulo.length > 10) {
                const tituloLower = titulo.toLowerCase();
                const resumoLower = (resumo || '').toLowerCase();
                
                // Filtrar apenas notícias relacionadas ao Paraná/Paranavaí
                const termosRelevantes = ['paraná', 'parana', 'paranavaí', 'paranavai', 'noroeste', 'maringá', 'londrina'];
                const isRelevante = termosRelevantes.some(termo => 
                    tituloLower.includes(termo) || resumoLower.includes(termo)
                );
                
                if (isRelevante) {
                    // Normalizar URLs
                    if (link.startsWith('//')) {
                        link = 'https:' + link;
                    } else if (!link.startsWith('http')) {
                        link = 'https://www.bing.com' + link;
                    }
                    
                    // Validar e normalizar imagem
                    if (imagem) {
                        if (imagem.startsWith('//')) {
                            imagem = 'https:' + imagem;
                        } else if (imagem.startsWith('/')) {
                            imagem = 'https://www.bing.com' + imagem;
                        }
                        // Verificar se é uma extensão de imagem válida
                        if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].some(ext => imagem.toLowerCase().includes(ext))) {
                            imagem = null;
                        }
                    }
                    
                    noticias.push({
                        titulo: titulo,
                        resumo: resumo ? resumo.substring(0, 150) + '...' : titulo.substring(0, 100) + '...',
                        link: link,
                        imagem: imagem || `https://via.placeholder.com/400x300/0078d4/ffffff?text=Bing+News`,
                        data: data,
                        fonte: portal.nome,
                        corFonte: portal.cor,
                        logoFonte: portal.logo,
                        tipoFonte: 'bing_news'
                    });
                }
            }
        });
        
        console.log(`✅ ${noticias.length} notícias relevantes coletadas do Bing News`);
        return noticias;
        
    } catch (error) {
        console.error(`❌ Erro ao buscar Bing News:`, error.message);
        return [];
    }
}

// Função para fazer scraping de um portal
async function scrapearPortal(portal) {
    try {
        // Verificar se é Bing News (tratamento especial)
        if (portal.tipo === 'bing_news') {
            return await scrapearBingNews(portal);
        }
        
        console.log(`🔍 Buscando notícias de: ${portal.nome}`);
        
        const response = await axios.get(portal.busca, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const noticias = [];
        
        $(portal.selector.artigos).slice(0, 5).each((index, element) => {
            const $el = $(element);
            
            const titulo = $el.find(portal.selector.titulo).first().text().trim();
            const resumo = $el.find(portal.selector.resumo).first().text().trim().substring(0, 150);
            const link = $el.find(portal.selector.link).first().attr('href');
            const imagem = $el.find(portal.selector.imagem).first().attr('src');
            const data = $el.find(portal.selector.data).first().text().trim();
            
            if (titulo && link) {
                let linkCompleto = link;
                if (!link.startsWith('http')) {
                    try {
                        linkCompleto = new URL(link, portal.url).href;
                    } catch (e) {
                        linkCompleto = portal.url + link;
                    }
                }
                
                let imagemCompleta = imagem;
                if (imagem && !imagem.startsWith('http')) {
                    try {
                        imagemCompleta = new URL(imagem, portal.url).href;
                    } catch (e) {
                        imagemCompleta = portal.url + imagem;
                    }
                }
                
                noticias.push({
                    titulo: titulo,
                    resumo: resumo || titulo.substring(0, 100) + '...',
                    link: linkCompleto,
                    imagem: imagemCompleta || `https://via.placeholder.com/400x300/1e4a73/ffffff?text=${encodeURIComponent(portal.nome)}`,
                    data: data || 'Hoje',
                    fonte: portal.nome,
                    corFonte: portal.cor,
                    logoFonte: portal.logo
                });
            }
        });
        
        console.log(`✅ ${noticias.length} notícias coletadas de ${portal.nome}`);
        return noticias;
        
    } catch (error) {
        console.error(`❌ Erro ao buscar ${portal.nome}:`, error.message);
        return [];
    }
}

// Função para coletar todas as notícias
async function coletarTodasNoticias() {
    console.log('🚀 Iniciando coleta de notícias...');
    
    const todasNoticias = [];
    
    for (const portal of PORTAIS_PARCEIROS) {
        const noticias = await scrapearPortal(portal);
        todasNoticias.push(...noticias);
        
        // Pausa entre requests para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Embaralhar notícias para variedade
    todasNoticias.sort(() => Math.random() - 0.5);
    
    cache.noticias = todasNoticias.slice(0, 20); // Limitar a 20 notícias
    cache.ultimaAtualizacao = new Date();
    
    console.log(`✅ Total de ${cache.noticias.length} notícias coletadas`);
    
    return cache.noticias;
}

// Função principal da API Serverless
module.exports = async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        // Se cache é muito antigo (mais de 30 minutos), atualizar
        const agora = new Date();
        const ultimaAtualizacao = cache.ultimaAtualizacao ? new Date(cache.ultimaAtualizacao) : null;
        const diferenca = ultimaAtualizacao ? agora - ultimaAtualizacao : Infinity;
        
        if (!ultimaAtualizacao || diferenca > 30 * 60 * 1000) { // 30 minutos
            console.log('🔄 Cache expirado, coletando notícias...');
            await coletarTodasNoticias();
        }
        
        return res.status(200).json({
            success: true,
            noticias: cache.noticias,
            ultimaAtualizacao: cache.ultimaAtualizacao,
            totalPortais: PORTAIS_PARCEIROS.length
        });
    } catch (error) {
        console.error('Erro na API:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
