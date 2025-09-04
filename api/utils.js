/**
 * API Utilitária Consolidada
 * Portal Paranavaí News
 * 
 * Combina funcionalidades simples que não precisam de APIs separadas:
 * - Lista de portais parceiros
 * - Estatísticas básicas
 * - Atualização de cache
 */

// Lista de portais parceiros
const PORTAIS_PARCEIROS = [
    {
        nome: "Paraná Portal",
        url: "https://www.paranaportal.com",
        logo: "https://www.paranaportal.com/wp-content/uploads/2023/01/logo-parana-portal.png",
        cor: "#1e4a73"
    },
    {
        nome: "Portal Paranavaí",
        url: "https://www.portalparanavai.com.br",
        logo: "https://via.placeholder.com/150x50/2c5f8a/ffffff?text=Portal+Paranavai",
        cor: "#2c5f8a"
    },
    {
        nome: "Bing News Paraná",
        url: "https://www.bing.com",
        logo: "https://www.bing.com/sa/simg/favicon-trans-bg-blue-mg.ico",
        cor: "#0078d4"
    },
    {
        nome: "Noroeste Online",
        url: "https://www.noroesteonline.com",
        logo: "https://via.placeholder.com/150x50/2e7d32/ffffff?text=Noroeste+Online",
        cor: "#2e7d32"
    },
    {
        nome: "Bem Paraná",
        url: "https://www.bemparana.com.br",
        logo: "https://www.bemparana.com.br/wp-content/themes/bemparana/assets/images/logo.png",
        cor: "#ff6900"
    }
];

module.exports = async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const action = url.searchParams.get('action') || url.pathname.split('/').pop();
        
        switch (action) {
            case 'portais':
                return handlePortais(req, res);
            case 'stats':
            case 'estatisticas':
                return handleEstatisticas(req, res);
            case 'update':
            case 'atualizar':
                return handleAtualizar(req, res);
            case 'info':
                return handleInfo(req, res);
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Ação não reconhecida',
                    actions: ['portais', 'stats', 'update', 'info']
                });
        }
    } catch (error) {
        console.error('Erro na API utils:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Handler para lista de portais
async function handlePortais(req, res) {
    return res.status(200).json({
        success: true,
        portais: PORTAIS_PARCEIROS,
        total: PORTAIS_PARCEIROS.length
    });
}

// Handler para estatísticas
async function handleEstatisticas(req, res) {
    try {
        // Buscar dados da API de notícias
        const baseUrl = req.headers['x-forwarded-proto'] 
            ? `${req.headers['x-forwarded-proto']}://${req.headers.host}` 
            : `https://${req.headers.host}`;
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${baseUrl}/api/noticias`);
        const data = await response.json();
        
        if (data.success) {
            return res.status(200).json({
                success: true,
                stats: {
                    totalNoticias: data.noticias?.length || 0,
                    totalPortais: PORTAIS_PARCEIROS.length,
                    ultimaAtualizacao: data.ultimaAtualizacao,
                    categorias: data.noticias ? [...new Set(data.noticias.map(n => n.fonte))].length : 0,
                    portaisAtivos: PORTAIS_PARCEIROS.filter(p => p.cor).length
                }
            });
        } else {
            return res.status(200).json({
                success: true,
                stats: {
                    totalNoticias: 0,
                    totalPortais: PORTAIS_PARCEIROS.length,
                    ultimaAtualizacao: null,
                    categorias: 0,
                    portaisAtivos: PORTAIS_PARCEIROS.length
                }
            });
        }
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        return res.status(200).json({
            success: true,
            stats: {
                totalNoticias: 0,
                totalPortais: PORTAIS_PARCEIROS.length,
                ultimaAtualizacao: null,
                categorias: 0,
                portaisAtivos: PORTAIS_PARCEIROS.length
            }
        });
    }
}

// Handler para forçar atualização
async function handleAtualizar(req, res) {
    try {
        // Para o Vercel, redirecionamos para a API de notícias que fará a atualização automática
        const baseUrl = req.headers['x-forwarded-proto'] 
            ? `${req.headers['x-forwarded-proto']}://${req.headers.host}` 
            : `https://${req.headers.host}`;
        
        // Fazer uma requisição para a API de notícias para forçar atualização
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${baseUrl}/api/noticias?refresh=true`);
        const data = await response.json();
        
        return res.status(200).json({
            success: true,
            message: 'Atualização solicitada com sucesso',
            timestamp: new Date().toISOString(),
            data: {
                noticias: data.noticias?.length || 0,
                portais: PORTAIS_PARCEIROS.length,
                ultimaAtualizacao: data.ultimaAtualizacao
            }
        });
    } catch (error) {
        console.error('Erro na atualização:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

// Handler para informações do sistema
async function handleInfo(req, res) {
    return res.status(200).json({
        success: true,
        info: {
            nome: "Portal Paranavaí News - API Utils",
            versao: "1.0.0",
            endpoints: [
                {
                    endpoint: "/api/utils?action=portais",
                    description: "Lista de portais parceiros",
                    method: "GET"
                },
                {
                    endpoint: "/api/utils?action=stats",
                    description: "Estatísticas do sistema",
                    method: "GET"
                },
                {
                    endpoint: "/api/utils?action=update",
                    description: "Forçar atualização de notícias",
                    method: "GET/POST"
                },
                {
                    endpoint: "/api/utils?action=info",
                    description: "Informações da API",
                    method: "GET"
                }
            ],
            timestamp: new Date().toISOString(),
            status: "ativo"
        }
    });
}
