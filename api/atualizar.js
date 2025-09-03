// Esta função será executada automaticamente pela API de notícias
// quando necessário, então apenas retorna uma resposta de sucesso

export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        // Para o Vercel, redirecionamos para a API de notícias que fará a atualização automática
        const baseUrl = req.headers['x-forwarded-proto'] 
            ? `${req.headers['x-forwarded-proto']}://${req.headers.host}` 
            : `https://${req.headers.host}`;
        
        // Fazer uma requisição para a API de notícias para forçar atualização
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${baseUrl}/api/noticias`);
        const data = await response.json();
        
        return res.status(200).json({
            success: true,
            message: 'Atualização solicitada com sucesso',
            data: data
        });
    } catch (error) {
        console.error('Erro na API de atualização:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
