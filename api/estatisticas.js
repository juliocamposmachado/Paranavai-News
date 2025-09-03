export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
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
                    totalPortais: data.totalPortais || 4,
                    ultimaAtualizacao: data.ultimaAtualizacao,
                    categorias: data.noticias ? [...new Set(data.noticias.map(n => n.fonte))].length : 0
                }
            });
        } else {
            return res.status(200).json({
                success: true,
                stats: {
                    totalNoticias: 0,
                    totalPortais: 4,
                    ultimaAtualizacao: null,
                    categorias: 0
                }
            });
        }
    } catch (error) {
        console.error('Erro na API de estatísticas:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
