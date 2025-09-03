const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../'));

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
        logo: "assets/images/parceiros/portal-paranavai.png",
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
        nome: "Noroeste Online",
        url: "https://www.noroesteonline.com",
        busca: "https://www.noroesteonline.com/",
        logo: "assets/images/parceiros/noroeste-online.png",
        cor: "#2e7d32",
        selector: {
            artigos: ".post-item, article",
            titulo: ".post-title a, h2 a",
            resumo: ".post-excerpt, .excerpt",
            link: ".post-title a, h2 a",
            imagem: ".post-thumb img",
            data: ".post-date"
        }
    },
    {
        nome: "Folha de Paranavaí",
        url: "https://www.folhadeparanavai.com.br",
        busca: "https://www.folhadeparanavai.com.br",
        logo: "assets/images/parceiros/folha-paranavai.png",
        cor: "#ff9800",
        selector: {
            artigos: ".news-item, article",
            titulo: ".news-title a, h2 a",
            resumo: ".news-summary",
            link: ".news-title a, h2 a",
            imagem: ".news-image img",
            data: ".news-date"
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
    }
,
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

// Cache para armazenar notícias
let cacheBots = {
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
            const resumo = $el.find(portal.selector.resumo).first().text().trim().substring(0, 200);
            let link = $el.find(portal.selector.link).first().attr('href');
            const imagem = $el.find(portal.selector.imagem).first().attr('src');
            const data = $el.find(portal.selector.data).first().text().trim();
            
            if (titulo && link) {
                // Garantir que o link seja completo e acessível
                let linkCompleto = link;
                if (!link.startsWith('http')) {
                    if (link.startsWith('/')) {
                        linkCompleto = portal.url + link;
                    } else {
                        linkCompleto = portal.url + '/' + link;
                    }
                }
                
                // Normalizar URL para evitar problemas
                try {
                    linkCompleto = new URL(linkCompleto).href;
                } catch (e) {
                    // Se não conseguir criar URL válida, usar URL do portal
                    linkCompleto = portal.url;
                }
                
                let imagemCompleta = imagem;
                if (imagem && !imagem.startsWith('http')) {
                    if (imagem.startsWith('/')) {
                        imagemCompleta = portal.url + imagem;
                    } else {
                        imagemCompleta = portal.url + '/' + imagem;
                    }
                }
                
                noticias.push({
                    titulo: titulo,
                    resumo: resumo || titulo.substring(0, 150) + '...',
                    link: linkCompleto,
                    imagem: imagemCompleta || `https://via.placeholder.com/400x300/1e4a73/ffffff?text=${encodeURIComponent(portal.nome)}`,
                    data: data || 'Hoje',
                    fonte: portal.nome,
                    corFonte: portal.cor,
                    logoFonte: portal.logo,
                    urlOriginal: linkCompleto // Link específico da notícia
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
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Embaralhar notícias para variedade
    todasNoticias.sort(() => Math.random() - 0.5);
    
    cacheBots.noticias = todasNoticias.slice(0, 20); // Limitar a 20 notícias
    cacheBots.ultimaAtualizacao = new Date();
    
    console.log(`✅ Total de ${cacheBots.noticias.length} notícias coletadas`);
    
    // Salvar em arquivo para persistência
    await salvarCache();
    
    return cacheBots.noticias;
}

// Salvar cache em arquivo
async function salvarCache() {
    try {
        const cacheDir = path.join(__dirname, 'cache');
        await fs.mkdir(cacheDir, { recursive: true });
        
        await fs.writeFile(
            path.join(cacheDir, 'noticias.json'), 
            JSON.stringify(cacheBots, null, 2)
        );
    } catch (error) {
        console.error('Erro ao salvar cache:', error);
    }
}

// Carregar cache do arquivo
async function carregarCache() {
    try {
        const cacheFile = path.join(__dirname, 'cache', 'noticias.json');
        const data = await fs.readFile(cacheFile, 'utf8');
        cacheBots = JSON.parse(data);
        console.log('📂 Cache carregado do arquivo');
    } catch (error) {
        console.log('📭 Nenhum cache encontrado, iniciando novo');
    }
}

// Rotas da API

// GET /api/noticias - Obter todas as notícias
app.get('/api/noticias', async (req, res) => {
    try {
        // Se cache é muito antigo (mais de 30 minutos), atualizar
        const agora = new Date();
        const ultimaAtualizacao = cacheBots.ultimaAtualizacao ? new Date(cacheBots.ultimaAtualizacao) : null;
        const diferenca = ultimaAtualizacao ? agora - ultimaAtualizacao : Infinity;
        
        if (!ultimaAtualizacao || diferenca > 30 * 60 * 1000) { // 30 minutos
            console.log('🔄 Cache expirado, coletando notícias...');
            await coletarTodasNoticias();
        }
        
        res.json({
            success: true,
            noticias: cacheBots.noticias,
            ultimaAtualizacao: cacheBots.ultimaAtualizacao,
            totalPortais: PORTAIS_PARCEIROS.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/atualizar - Forçar atualização das notícias
app.post('/api/atualizar', async (req, res) => {
    try {
        console.log('🔄 Atualização forçada solicitada...');
        await coletarTodasNoticias();
        
        res.json({
            success: true,
            message: 'Notícias atualizadas com sucesso',
            total: cacheBots.noticias.length,
            ultimaAtualizacao: cacheBots.ultimaAtualizacao
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/portais - Listar portais parceiros
app.get('/api/portais', (req, res) => {
    res.json({
        success: true,
        portais: PORTAIS_PARCEIROS.map(portal => ({
            nome: portal.nome,
            url: portal.url,
            logo: portal.logo,
            cor: portal.cor
        }))
    });
});

// GET /api/estatisticas - Estatísticas do portal
app.get('/api/estatisticas', (req, res) => {
    res.json({
        success: true,
        stats: {
            totalNoticias: cacheBots.noticias.length,
            totalPortais: PORTAIS_PARCEIROS.length,
            ultimaAtualizacao: cacheBots.ultimaAtualizacao,
            categorias: [...new Set(cacheBots.noticias.map(n => n.fonte))].length
        }
    });
});

// Middleware de error handling
app.use((error, req, res, next) => {
    console.error('Erro na API:', error);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
    });
});

// Inicializar servidor
async function iniciarServidor() {
    // Carregar cache existente
    await carregarCache();
    
    // Se não há cache, fazer primeira coleta
    if (!cacheBots.noticias || cacheBots.noticias.length === 0) {
        console.log('🔄 Primeira execução - coletando notícias...');
        await coletarTodasNoticias();
    }
    
    // Agendar atualização automática a cada 30 minutos
    setInterval(async () => {
        console.log('⏰ Atualização automática programada...');
        await coletarTodasNoticias();
    }, 30 * 60 * 1000);
    
    app.listen(PORT, () => {
        console.log(`🚀 Portal Paranavaí News API rodando em http://localhost:${PORT}`);
        console.log(`📡 Endpoints disponíveis:`);
        console.log(`   GET  /api/noticias - Obter notícias`);
        console.log(`   POST /api/atualizar - Forçar atualização`);
        console.log(`   GET  /api/portais - Listar portais parceiros`);
        console.log(`   GET  /api/estatisticas - Ver estatísticas`);
    });
}

iniciarServidor().catch(console.error);
