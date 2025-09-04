// Cache de notícias aprovadas (em memória para simplicidade)
let approvedNewsCache = [];

// Função principal da API
module.exports = async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        switch (req.method) {
            case 'GET':
                // Retornar todas as notícias aprovadas
                return res.status(200).json({
                    success: true,
                    noticias: approvedNewsCache,
                    total: approvedNewsCache.length,
                    ultimaAtualizacao: new Date()
                });
                
            case 'POST':
                // Adicionar nova notícia aprovada
                const novaNoticia = req.body;
                
                if (!novaNoticia || !novaNoticia.title || !novaNoticia.excerpt) {
                    return res.status(400).json({
                        success: false,
                        error: 'Dados da notícia inválidos'
                    });
                }
                
                // Converter para formato compatível com a página principal
                const noticiaFormatada = {
                    titulo: novaNoticia.title,
                    resumo: novaNoticia.excerpt,
                    link: novaNoticia.link || '#',
                    imagem: novaNoticia.image || `https://via.placeholder.com/400x300/1e4a73/ffffff?text=${encodeURIComponent(novaNoticia.source || 'Portal')}`,
                    data: formatDateForDisplay(novaNoticia.date || new Date()),
                    fonte: novaNoticia.source || 'Portal Paranavaí',
                    corFonte: getSourceColor(novaNoticia.source),
                    logoFonte: getSourceLogo(novaNoticia.source),
                    aprovadaEm: new Date().toISOString(),
                    aprovadaPor: novaNoticia.approvedBy || 'Admin',
                    id: novaNoticia.id || Date.now()
                };
                
                // Adicionar no início da lista (mais recente primeiro)
                approvedNewsCache.unshift(noticiaFormatada);
                
                // Limitar a 20 notícias aprovadas
                if (approvedNewsCache.length > 20) {
                    approvedNewsCache = approvedNewsCache.slice(0, 20);
                }
                
                console.log(`✅ Nova notícia aprovada: "${noticiaFormatada.titulo}"`);
                
                return res.status(200).json({
                    success: true,
                    message: 'Notícia aprovada e adicionada com sucesso',
                    noticia: noticiaFormatada,
                    total: approvedNewsCache.length
                });
                
            case 'DELETE':
                // Remover notícia aprovada
                const { id } = req.body;
                
                if (!id) {
                    return res.status(400).json({
                        success: false,
                        error: 'ID da notícia é obrigatório'
                    });
                }
                
                const index = approvedNewsCache.findIndex(n => n.id == id);
                if (index === -1) {
                    return res.status(404).json({
                        success: false,
                        error: 'Notícia não encontrada'
                    });
                }
                
                const removida = approvedNewsCache.splice(index, 1)[0];
                
                return res.status(200).json({
                    success: true,
                    message: 'Notícia removida com sucesso',
                    noticiaRemovida: removida,
                    total: approvedNewsCache.length
                });
                
            default:
                return res.status(405).json({
                    success: false,
                    error: 'Método não permitido'
                });
        }
    } catch (error) {
        console.error('Erro na API de notícias aprovadas:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Função auxiliar para formatar data
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Hoje';
    } else if (diffDays === 2) {
        return 'Ontem';
    } else if (diffDays <= 7) {
        return `${diffDays - 1} dias atrás`;
    } else {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

// Função auxiliar para cor da fonte
function getSourceColor(source) {
    const cores = {
        'Bem Paraná': '#ff6900',
        'Paraná Portal': '#1e4a73',
        'Portal Regional': '#2c5f8a',
        'Saúde Paraná': '#d32f2f',
        'Turismo PR': '#ff9800',
        'Noroeste Online': '#2e7d32',
        'Bing News Paraná': '#0078d4'
    };
    
    return cores[source] || '#1e4a73';
}

// Função auxiliar para logo da fonte
function getSourceLogo(source) {
    const logos = {
        'Bem Paraná': 'https://www.bemparana.com.br/wp-content/themes/bemparana/assets/images/logo.png',
        'Paraná Portal': 'https://www.paranaportal.com/wp-content/uploads/2023/01/logo-parana-portal.png',
        'Bing News Paraná': 'https://www.bing.com/sa/simg/favicon-trans-bg-blue-mg.ico'
    };
    
    return logos[source] || `https://via.placeholder.com/150x50/1e4a73/ffffff?text=${encodeURIComponent(source || 'Portal')}`;
}
