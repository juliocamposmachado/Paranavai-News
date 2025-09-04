/**
 * Handler de API Administrativa para Vercel Functions
 * Portal Paranavaí News - Dashboard
 */

// Dados em memória (em produção, usar banco de dados)
let pendingContent = [
    {
        id: 'demo_1',
        titulo: 'Nova investimento em infraestrutura para Paranavaí',
        resumo: 'Governo anuncia recursos para melhorias na infraestrutura urbana da cidade.',
        fonte: 'Bem Paraná',
        link: 'https://www.bemparana.com.br/noticia/exemplo1',
        imagem: 'https://via.placeholder.com/400x300/1e4a73/ffffff?text=Infraestrutura',
        data: new Date().toISOString(),
        status: 'pending'
    }
];

let approvedContent = [];
let rejectedContent = [];

// Headers CORS
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Função principal
export default function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
    });

    const { method, url } = req;
    const path = url.replace('/api/admin', '');

    console.log(`API Admin: ${method} ${path}`);

    try {
        // Roteamento simples
        if (method === 'POST' && path === '/login') {
            return handleLogin(req, res);
        }
        
        // Middleware de autenticação simples para outras rotas
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.includes('Bearer admin_token')) {
            return res.status(401).json({ error: 'Token de acesso requerido' });
        }

        if (method === 'GET' && path === '/pending') {
            return handleGetPending(req, res);
        }

        if (method === 'POST' && path.startsWith('/approve/')) {
            const id = path.replace('/approve/', '');
            return handleApprove(req, res, id);
        }

        if (method === 'POST' && path.startsWith('/reject/')) {
            const id = path.replace('/reject/', '');
            return handleReject(req, res, id);
        }

        if (method === 'GET' && path === '/approved') {
            return handleGetApproved(req, res);
        }

        if (method === 'GET' && path === '/rejected') {
            return handleGetRejected(req, res);
        }

        if (method === 'GET' && path === '/stats') {
            return handleGetStats(req, res);
        }

        // Rota não encontrada
        return res.status(404).json({ 
            error: 'Endpoint não encontrado',
            path: path
        });

    } catch (error) {
        console.error('Erro na API:', error);
        return res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: error.message 
        });
    }
}

// Handlers específicos
function handleLogin(req, res) {
    const { username, password } = req.body || {};
    
    if (username === 'Matheus' && password === 'Admin78451200') {
        return res.json({
            success: true,
            token: 'admin_token',
            user: {
                username,
                permissions: ['read', 'approve', 'reject'],
                loginTime: new Date().toISOString()
            }
        });
    }
    
    return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
    });
}

function handleGetPending(req, res) {
    return res.json({
        success: true,
        items: pendingContent,
        count: pendingContent.length
    });
}

function handleApprove(req, res, id) {
    const itemIndex = pendingContent.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Item não encontrado' });
    }
    
    // Move item para aprovados
    const item = pendingContent.splice(itemIndex, 1)[0];
    item.status = 'approved';
    item.dataAprovacao = new Date().toISOString();
    item.approvedBy = 'Matheus';
    
    approvedContent.unshift(item);
    
    return res.json({
        success: true,
        message: 'Item aprovado com sucesso',
        item
    });
}

function handleReject(req, res, id) {
    const { reason = '' } = req.body || {};
    const itemIndex = pendingContent.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Item não encontrado' });
    }
    
    // Move item para rejeitados
    const item = pendingContent.splice(itemIndex, 1)[0];
    item.status = 'rejected';
    item.dataRejeicao = new Date().toISOString();
    item.motivoRejeicao = reason;
    item.rejectedBy = 'Matheus';
    
    rejectedContent.unshift(item);
    
    return res.json({
        success: true,
        message: 'Item rejeitado',
        item
    });
}

function handleGetApproved(req, res) {
    return res.json({
        success: true,
        items: approvedContent,
        count: approvedContent.length
    });
}

function handleGetRejected(req, res) {
    return res.json({
        success: true,
        items: rejectedContent,
        count: rejectedContent.length
    });
}

function handleGetStats(req, res) {
    const totalNews = pendingContent.length + approvedContent.length + rejectedContent.length;
    const approvalRate = totalNews > 0 ? Math.round((approvedContent.length / totalNews) * 100) : 0;
    
    return res.json({
        success: true,
        stats: {
            totalNews,
            pending: pendingContent.length,
            approved: approvedContent.length,
            rejected: rejectedContent.length,
            approvalRate
        }
    });
}
