const { supabase } = require('../utils/supabase');

// Função para buscar notícias por categoria
async function buscarNoticiasPorCategoria(categoria) {
  try {
    const { data, error } = await supabase
      .from('noticias')
      .select(`
        *,
        categoria:categoria_id(nome, slug, cor),
        portal:portal_id(nome, logo, cor)
      `)
      .eq('aprovada', true)
      .eq('status', 'publicada')
      .order('data_publicacao', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Erro ao buscar notícias por categoria:', error);
      return [];
    }
    
    // Filtrar por categoria se especificada
    let noticias = data || [];
    
    if (categoria && categoria !== 'todas') {
      noticias = noticias.filter(noticia => {
        // Filtrar por categoria usando diferentes critérios
        const categoriaNoticia = noticia.categoria?.slug || '';
        const tituloLower = noticia.titulo.toLowerCase();
        const resumoLower = (noticia.resumo || '').toLowerCase();
        
        // Mapear categorias para termos de busca
        const termosCategoria = {
          'politica': ['política', 'politica', 'deputado', 'vereador', 'prefeito', 'governo', 'assembleia', 'câmara', 'leonidas', 'leônidas'],
          'saude': ['saúde', 'saude', 'hospital', 'sus', 'medicina', 'médico', 'medicamento', 'vacina', 'posto de saúde'],
          'agronegocio': ['agronegócio', 'agronegocio', 'agricultura', 'pecuária', 'safra', 'soja', 'milho', 'produtores', 'rural', 'cooperativa'],
          'turismo': ['turismo', 'turística', 'festival', 'evento', 'cultura', 'hotel', 'visitantes', 'atrações']
        };
        
        // Verificar se é da categoria correta
        if (categoriaNoticia === categoria) {
          return true;
        }
        
        // Se não tem categoria definida, usar análise de conteúdo
        const termos = termosCategoria[categoria] || [];
        return termos.some(termo => 
          tituloLower.includes(termo) || resumoLower.includes(termo)
        );
      });
    }
    
    // Converter para formato compatível com o frontend
    return noticias.map(noticia => ({
      id: noticia.id,
      titulo: noticia.titulo,
      resumo: noticia.resumo,
      conteudo: noticia.conteudo,
      link: noticia.link,
      imagem: noticia.imagem,
      data: formatarData(noticia.data_publicacao),
      fonte: noticia.fonte || noticia.portal?.nome || 'Portal Paranavaí News',
      corFonte: noticia.meta_dados?.corFonte || noticia.portal?.cor || '#1e4a73',
      logoFonte: noticia.meta_dados?.logoFonte || noticia.portal?.logo || '',
      categoria: noticia.categoria?.nome || 'Geral',
      categoriaSlug: noticia.categoria?.slug || 'geral',
      autor: noticia.autor || 'Redação',
      views: noticia.views || 0,
      likes: noticia.likes || 0,
      destaque: noticia.destaque || false
    }));
    
  } catch (error) {
    console.error('Erro ao buscar notícias por categoria:', error);
    return [];
  }
}

// Função para buscar estatísticas de notícias por categoria
async function buscarEstatisticasCategoria(categoria) {
  try {
    let query = supabase
      .from('noticias')
      .select('*', { count: 'exact', head: true })
      .eq('aprovada', true)
      .eq('status', 'publicada');
    
    // Se categoria específica, filtrar
    if (categoria && categoria !== 'todas') {
      // Para simplificar, vamos contar todas e filtrar no frontend por enquanto
      // Em produção, seria melhor ter um campo categoria_computed
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { total: 0, categoria: categoria };
    }
    
    return {
      total: count || 0,
      categoria: categoria,
      ultimaAtualizacao: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return { total: 0, categoria: categoria };
  }
}

// Função para formatar data
function formatarData(dataISO) {
  if (!dataISO) return 'Hoje';
  
  const data = new Date(dataISO);
  const agora = new Date();
  const diffMs = agora - data;
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDias === 0) return 'Hoje';
  if (diffDias === 1) return 'Ontem';
  if (diffDias < 7) return `${diffDias} dias atrás`;
  if (diffDias < 30) return `${Math.floor(diffDias / 7)} semanas atrás`;
  
  return data.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

// Handler principal da API
module.exports = async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }
  
  try {
    // Extrair categoria da URL
    const categoria = req.query.categoria || req.query.cat;
    
    if (!categoria) {
      return res.status(400).json({
        success: false,
        error: 'Categoria não especificada'
      });
    }
    
    console.log(`🔍 Buscando notícias para categoria: ${categoria}`);
    
    // Buscar notícias e estatísticas em paralelo
    const [noticias, estatisticas] = await Promise.all([
      buscarNoticiasPorCategoria(categoria),
      buscarEstatisticasCategoria(categoria)
    ]);
    
    console.log(`✅ ${noticias.length} notícias encontradas para ${categoria}`);
    
    return res.status(200).json({
      success: true,
      categoria: categoria,
      noticias: noticias,
      total: noticias.length,
      estatisticas: estatisticas,
      ultimaAtualizacao: new Date().toISOString(),
      fonte: 'supabase'
    });
    
  } catch (error) {
    console.error('Erro na API de categoria:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};
