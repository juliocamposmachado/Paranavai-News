const axios = require('axios');
const cheerio = require('cheerio');
const { supabase } = require('../utils/supabase');

// Cache simples em memória
let cache = {
  noticias: [],
  ultimaAtualizacao: null
};

// Função para buscar portais ativos no banco
async function buscarPortaisAtivos() {
  try {
    const { data, error } = await supabase
      .from('portais')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar portais:', error);
      // Fallback para portais hardcoded se necessário
      return getDefaultPortals();
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao conectar com Supabase:', error);
    return getDefaultPortals();
  }
}

// Portais padrão (fallback)
function getDefaultPortals() {
  return [
    {
      nome: "Paraná Portal",
      url: "https://www.paranaportal.com",
      busca: "https://www.paranaportal.com/?s=Paranavai",
      logo: "https://www.paranaportal.com/wp-content/uploads/2023/01/logo-parana-portal.png",
      cor: "#1e4a73",
      config: {
        selector: {
          artigos: "article",
          titulo: "h2 a, h3 a",
          resumo: ".excerpt, p",
          link: "h2 a, h3 a",
          imagem: "img",
          data: ".date, time"
        }
      }
    },
    {
      nome: "Bem Paraná",
      url: "https://www.bemparana.com.br",
      busca: "https://www.bemparana.com.br/?s=paranavai",
      logo: "https://www.bemparana.com.br/wp-content/themes/bemparana/assets/images/logo.png",
      cor: "#ff6900",
      config: {
        selector: {
          artigos: "article, .post, .entry",
          titulo: "h2 a, h3 a, .entry-title a",
          resumo: ".excerpt, .entry-summary, p",
          link: "h2 a, h3 a, .entry-title a",
          imagem: ".wp-post-image, img",
          data: ".date, .entry-date, time"
        }
      }
    }
  ];
}

// Função para salvar notícia coletada no banco
async function salvarNoticia(noticiaData) {
  try {
    // Verificar se a notícia já existe (por título ou link)
    const { data: existing, error: searchError } = await supabase
      .from('noticias')
      .select('id')
      .or(`titulo.eq.${noticiaData.titulo},link.eq.${noticiaData.link}`)
      .limit(1);
    
    if (searchError) {
      console.error('Erro ao verificar notícia existente:', searchError);
      return null;
    }
    
    if (existing && existing.length > 0) {
      // Notícia já existe, apenas atualizar views se necessário
      return existing[0];
    }
    
    // Inserir nova notícia
    const { data, error } = await supabase
      .from('noticias')
      .insert([{
        titulo: noticiaData.titulo,
        resumo: noticiaData.resumo,
        link: noticiaData.link,
        imagem: noticiaData.imagem,
        fonte: noticiaData.fonte,
        status: 'coletada', // Status específico para notícias coletadas
        aprovada: false, // Precisam ser aprovadas manualmente
        data_publicacao: new Date(),
        meta_dados: {
          corFonte: noticiaData.corFonte,
          logoFonte: noticiaData.logoFonte,
          tipoFonte: noticiaData.tipoFonte || 'scraping'
        }
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao salvar notícia:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao salvar notícia:', error);
    return null;
  }
}

// Função para buscar notícias aprovadas do banco
async function buscarNoticiasAprovadas() {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .select(`
        *,
        categoria:categoria_id(nome, cor),
        portal:portal_id(nome, logo, cor)
      `)
      .eq('aprovada', true)
      .eq('status', 'publicada')
      .order('data_publicacao', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Erro ao buscar notícias aprovadas:', error);
      return [];
    }
    
    // Converter para formato compatível com o frontend
    return (data || []).map(noticia => ({
      titulo: noticia.titulo,
      resumo: noticia.resumo,
      link: noticia.link,
      imagem: noticia.imagem,
      data: noticia.data_publicacao,
      fonte: noticia.fonte,
      corFonte: noticia.meta_dados?.corFonte || '#1e4a73',
      logoFonte: noticia.meta_dados?.logoFonte || '',
      categoria: noticia.categoria?.nome || '',
      likes: noticia.likes || 0,
      views: noticia.views || 0
    }));
  } catch (error) {
    console.error('Erro ao buscar notícias aprovadas:', error);
    return [];
  }
}

// Função para fazer scraping de um portal
async function scrapearPortal(portal) {
  try {
    console.log(`🔍 Buscando notícias de: ${portal.nome}`);
    
    const selector = portal.config?.selector || portal.selector;
    if (!selector) {
      console.error(`Configuração de seletores não encontrada para ${portal.nome}`);
      return [];
    }
    
    const response = await axios.get(portal.busca, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const noticias = [];
    
    $(selector.artigos).slice(0, 5).each((index, element) => {
      const $el = $(element);
      
      const titulo = $el.find(selector.titulo).first().text().trim();
      const resumo = $el.find(selector.resumo).first().text().trim().substring(0, 150);
      const link = $el.find(selector.link).first().attr('href');
      const imagem = $el.find(selector.imagem).first().attr('src');
      const data = $el.find(selector.data).first().text().trim();
      
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
        
        const noticiaData = {
          titulo: titulo,
          resumo: resumo || titulo.substring(0, 100) + '...',
          link: linkCompleto,
          imagem: imagemCompleta || `https://via.placeholder.com/400x300/1e4a73/ffffff?text=${encodeURIComponent(portal.nome)}`,
          data: data || 'Hoje',
          fonte: portal.nome,
          corFonte: portal.cor,
          logoFonte: portal.logo
        };
        
        noticias.push(noticiaData);
        
        // Salvar no banco de dados (async, não bloquear)
        salvarNoticia(noticiaData).catch(err => 
          console.error(`Erro ao salvar notícia de ${portal.nome}:`, err.message)
        );
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
  
  // Buscar portais ativos no banco
  const portais = await buscarPortaisAtivos();
  console.log(`📋 ${portais.length} portais ativos encontrados`);
  
  const todasNoticias = [];
  
  for (const portal of portais) {
    const noticias = await scrapearPortal(portal);
    todasNoticias.push(...noticias);
    
    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Embaralhar notícias para variedade
  todasNoticias.sort(() => Math.random() - 0.5);
  
  cache.noticias = todasNoticias.slice(0, 15);
  cache.ultimaAtualizacao = new Date();
  
  console.log(`✅ Total de ${cache.noticias.length} notícias coletadas`);
  
  return cache.noticias;
}

// Função principal da API
module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Buscar notícias aprovadas do banco
    const noticiasAprovadas = await buscarNoticiasAprovadas();
    
    // Se cache é muito antigo (mais de 30 minutos), atualizar notícias coletadas
    const agora = new Date();
    const ultimaAtualizacao = cache.ultimaAtualizacao ? new Date(cache.ultimaAtualizacao) : null;
    const diferenca = ultimaAtualizacao ? agora - ultimaAtualizacao : Infinity;
    
    if (!ultimaAtualizacao || diferenca > 30 * 60 * 1000) { // 30 minutos
      console.log('🔄 Cache expirado, coletando notícias...');
      await coletarTodasNoticias();
    }
    
    // Combinar notícias aprovadas + coletadas
    const todasNoticias = [...noticiasAprovadas, ...cache.noticias];
    
    return res.status(200).json({
      success: true,
      noticias: todasNoticias.slice(0, 20),
      ultimaAtualizacao: cache.ultimaAtualizacao,
      estatisticas: {
        noticiasAprovadas: noticiasAprovadas.length,
        noticiasColetadas: cache.noticias.length,
        totalPortais: (await buscarPortaisAtivos()).length
      }
    });
    
  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
