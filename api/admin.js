/**
 * API Administrativa - Portal Paranavaí News
 * Endpoints para gerenciamento de conteúdo
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// Caminhos dos arquivos de dados
const PENDING_FILE = path.join(__dirname, '../backend/cache/pending_content.json');
const APPROVED_FILE = path.join(__dirname, '../backend/cache/approved_content.json');
const REJECTED_FILE = path.join(__dirname, '../backend/cache/rejected_content.json');
const NOTICIAS_FILE = path.join(__dirname, '../backend/cache/noticias.json');

// Middleware de autenticação simples
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificação simples do token (em produção, use JWT)
    if (token !== 'admin_matheus_token') {
        return res.status(401).json({ error: 'Token inválido' });
    }
    
    next();
};

// ===== AUTENTICAÇÃO =====

// Login administrativo
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validar credenciais
        if (username === 'Matheus' && password === 'Admin78451200') {
            const token = 'admin_matheus_token'; // Em produção, gerar JWT
            
            res.json({
                success: true,
                token: token,
                user: {
                    username: username,
                    permissions: ['read', 'approve', 'reject'],
                    loginTime: new Date().toISOString()
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Credenciais inválidas'
            });
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ===== CONTEÚDO PENDENTE =====

// Listar conteúdo pendente
router.get('/pending', authenticateAdmin, async (req, res) => {
    try {
        let pendingContent = [];
        
        try {
            const data = await fs.readFile(PENDING_FILE, 'utf8');
            pendingContent = JSON.parse(data).items || [];
        } catch (error) {
            // Se não existe, criar arquivo com conteúdo de exemplo
            pendingContent = await createExamplePendingContent();
            await savePendingContent(pendingContent);
        }
        
        res.json({
            success: true,
            items: pendingContent,
            count: pendingContent.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar conteúdo pendente:', error);
        res.status(500).json({ error: 'Erro ao carregar conteúdo pendente' });
    }
});

// Adicionar novo conteúdo pendente
router.post('/pending', authenticateAdmin, async (req, res) => {
    try {
        const { titulo, resumo, fonte, link, imagem } = req.body;
        
        const newItem = {
            id: generateId(),
            titulo,
            resumo,
            fonte,
            link,
            imagem: imagem || 'https://via.placeholder.com/400x300/1e4a73/ffffff?text=News',
            data: new Date().toISOString(),
            status: 'pending',
            addedBy: 'system'
        };
        
        const pendingContent = await loadPendingContent();
        pendingContent.unshift(newItem);
        await savePendingContent(pendingContent);
        
        res.json({
            success: true,
            item: newItem,
            message: 'Item adicionado à fila de aprovação'
        });
        
    } catch (error) {
        console.error('Erro ao adicionar conteúdo pendente:', error);
        res.status(500).json({ error: 'Erro ao adicionar conteúdo' });
    }
});

// ===== APROVAÇÃO/REJEIÇÃO =====

// Aprovar conteúdo
router.post('/approve/:id', authenticateAdmin, async (req, res) => {
    try {
        const itemId = req.params.id;
        const { publishNow = true } = req.body;
        
        const pendingContent = await loadPendingContent();
        const itemIndex = pendingContent.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }
        
        // Remover da lista pendente
        const item = pendingContent.splice(itemIndex, 1)[0];
        
        // Atualizar status
        item.status = 'approved';
        item.dataAprovacao = new Date().toISOString();
        item.approvedBy = 'Matheus';
        
        // Salvar nas listas apropriadas
        await savePendingContent(pendingContent);
        
        const approvedContent = await loadApprovedContent();
        approvedContent.unshift(item);
        await saveApprovedContent(approvedContent);
        
        // Se publicar agora, adicionar às notícias públicas
        if (publishNow) {
            await publishToPublicFeed(item);
        }
        
        res.json({
            success: true,
            item: item,
            message: publishNow ? 'Item aprovado e publicado' : 'Item aprovado'
        });
        
    } catch (error) {
        console.error('Erro ao aprovar item:', error);
        res.status(500).json({ error: 'Erro ao aprovar item' });
    }
});

// Rejeitar conteúdo
router.post('/reject/:id', authenticateAdmin, async (req, res) => {
    try {
        const itemId = req.params.id;
        const { reason = '' } = req.body;
        
        const pendingContent = await loadPendingContent();
        const itemIndex = pendingContent.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }
        
        // Remover da lista pendente
        const item = pendingContent.splice(itemIndex, 1)[0];
        
        // Atualizar status
        item.status = 'rejected';
        item.dataRejeicao = new Date().toISOString();
        item.motivoRejeicao = reason;
        item.rejectedBy = 'Matheus';
        
        // Salvar nas listas apropriadas
        await savePendingContent(pendingContent);
        
        const rejectedContent = await loadRejectedContent();
        rejectedContent.unshift(item);
        await saveRejectedContent(rejectedContent);
        
        res.json({
            success: true,
            item: item,
            message: 'Item rejeitado'
        });
        
    } catch (error) {
        console.error('Erro ao rejeitar item:', error);
        res.status(500).json({ error: 'Erro ao rejeitar item' });
    }
});

// ===== CONTEÚDO APROVADO =====

// Listar conteúdo aprovado
router.get('/approved', authenticateAdmin, async (req, res) => {
    try {
        const { filter = 'all', limit = 50 } = req.query;
        
        let approvedContent = await loadApprovedContent();
        
        // Aplicar filtros
        if (filter !== 'all') {
            const now = new Date();
            let cutoffDate;
            
            switch (filter) {
                case 'today':
                    cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
            }
            
            if (cutoffDate) {
                approvedContent = approvedContent.filter(item => 
                    new Date(item.dataAprovacao) >= cutoffDate
                );
            }
        }
        
        // Limitar resultados
        approvedContent = approvedContent.slice(0, parseInt(limit));
        
        res.json({
            success: true,
            items: approvedContent,
            count: approvedContent.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar conteúdo aprovado:', error);
        res.status(500).json({ error: 'Erro ao carregar conteúdo aprovado' });
    }
});

// Despublicar conteúdo
router.post('/unpublish/:id', authenticateAdmin, async (req, res) => {
    try {
        const itemId = req.params.id;
        
        const approvedContent = await loadApprovedContent();
        const item = approvedContent.find(item => item.id === itemId);
        
        if (!item) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }
        
        // Remover do feed público
        await removeFromPublicFeed(itemId);
        
        res.json({
            success: true,
            message: 'Item despublicado com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao despublicar item:', error);
        res.status(500).json({ error: 'Erro ao despublicar item' });
    }
});

// ===== CONTEÚDO REJEITADO =====

// Listar conteúdo rejeitado
router.get('/rejected', authenticateAdmin, async (req, res) => {
    try {
        const rejectedContent = await loadRejectedContent();
        
        res.json({
            success: true,
            items: rejectedContent,
            count: rejectedContent.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar conteúdo rejeitado:', error);
        res.status(500).json({ error: 'Erro ao carregar conteúdo rejeitado' });
    }
});

// Reconsiderar item rejeitado
router.post('/reconsider/:id', authenticateAdmin, async (req, res) => {
    try {
        const itemId = req.params.id;
        
        const rejectedContent = await loadRejectedContent();
        const itemIndex = rejectedContent.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item não encontrado' });
        }
        
        // Remover da lista rejeitada
        const item = rejectedContent.splice(itemIndex, 1)[0];
        
        // Restaurar para pendente
        item.status = 'pending';
        delete item.dataRejeicao;
        delete item.motivoRejeicao;
        delete item.rejectedBy;
        item.reconsideradoEm = new Date().toISOString();
        
        // Salvar nas listas apropriadas
        await saveRejectedContent(rejectedContent);
        
        const pendingContent = await loadPendingContent();
        pendingContent.unshift(item);
        await savePendingContent(pendingContent);
        
        res.json({
            success: true,
            item: item,
            message: 'Item movido de volta para pendente'
        });
        
    } catch (error) {
        console.error('Erro ao reconsiderar item:', error);
        res.status(500).json({ error: 'Erro ao reconsiderar item' });
    }
});

// ===== ESTATÍSTICAS =====

// Estatísticas gerais
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const [pendingContent, approvedContent, rejectedContent] = await Promise.all([
            loadPendingContent(),
            loadApprovedContent(),
            loadRejectedContent()
        ]);
        
        const totalNews = pendingContent.length + approvedContent.length + rejectedContent.length;
        const approvalRate = totalNews > 0 ? Math.round((approvedContent.length / totalNews) * 100) : 0;
        
        // Estatísticas dos últimos 7 dias
        const last7Days = [];
        const now = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            
            const approved = approvedContent.filter(item => {
                const itemDate = new Date(item.dataAprovacao);
                return itemDate >= dayStart && itemDate < dayEnd;
            }).length;
            
            const rejected = rejectedContent.filter(item => {
                const itemDate = new Date(item.dataRejeicao);
                return itemDate >= dayStart && itemDate < dayEnd;
            }).length;
            
            last7Days.push({
                date: date.toISOString().split('T')[0],
                approved,
                rejected,
                total: approved + rejected
            });
        }
        
        res.json({
            success: true,
            stats: {
                totalNews,
                pending: pendingContent.length,
                approved: approvedContent.length,
                rejected: rejectedContent.length,
                approvalRate,
                last7Days
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao carregar estatísticas' });
    }
});

// ===== FUNÇÕES AUXILIARES =====

async function loadPendingContent() {
    try {
        const data = await fs.readFile(PENDING_FILE, 'utf8');
        return JSON.parse(data).items || [];
    } catch (error) {
        return [];
    }
}

async function savePendingContent(items) {
    const data = {
        items,
        lastUpdate: new Date().toISOString()
    };
    await fs.writeFile(PENDING_FILE, JSON.stringify(data, null, 2));
}

async function loadApprovedContent() {
    try {
        const data = await fs.readFile(APPROVED_FILE, 'utf8');
        return JSON.parse(data).items || [];
    } catch (error) {
        return [];
    }
}

async function saveApprovedContent(items) {
    const data = {
        items,
        lastUpdate: new Date().toISOString()
    };
    await fs.writeFile(APPROVED_FILE, JSON.stringify(data, null, 2));
}

async function loadRejectedContent() {
    try {
        const data = await fs.readFile(REJECTED_FILE, 'utf8');
        return JSON.parse(data).items || [];
    } catch (error) {
        return [];
    }
}

async function saveRejectedContent(items) {
    const data = {
        items,
        lastUpdate: new Date().toISOString()
    };
    await fs.writeFile(REJECTED_FILE, JSON.stringify(data, null, 2));
}

async function publishToPublicFeed(item) {
    try {
        // Carregar notícias públicas
        let noticias = [];
        try {
            const data = await fs.readFile(NOTICIAS_FILE, 'utf8');
            noticias = JSON.parse(data).noticias || [];
        } catch (error) {
            noticias = [];
        }
        
        // Converter formato para o feed público
        const publicItem = {
            titulo: item.titulo,
            resumo: item.resumo,
            link: item.link,
            imagem: item.imagem,
            data: item.dataAprovacao,
            fonte: item.fonte,
            corFonte: '#1e4a73',
            logoFonte: 'assets/images/favicon.ico',
            tipoFonte: 'approved_content'
        };
        
        // Adicionar no início da lista
        noticias.unshift(publicItem);
        
        // Manter apenas os últimos 100 itens
        noticias = noticias.slice(0, 100);
        
        // Salvar
        const publicData = {
            noticias,
            ultimaAtualizacao: new Date().toISOString()
        };
        
        await fs.writeFile(NOTICIAS_FILE, JSON.stringify(publicData, null, 2));
        
    } catch (error) {
        console.error('Erro ao publicar no feed público:', error);
    }
}

async function removeFromPublicFeed(itemId) {
    try {
        const data = await fs.readFile(NOTICIAS_FILE, 'utf8');
        let publicData = JSON.parse(data);
        
        // Filtrar para remover o item (comparar por título, já que ID pode ser diferente)
        const approvedContent = await loadApprovedContent();
        const item = approvedContent.find(item => item.id === itemId);
        
        if (item) {
            publicData.noticias = publicData.noticias.filter(noticia => 
                noticia.titulo !== item.titulo
            );
            
            publicData.ultimaAtualizacao = new Date().toISOString();
            await fs.writeFile(NOTICIAS_FILE, JSON.stringify(publicData, null, 2));
        }
        
    } catch (error) {
        console.error('Erro ao remover do feed público:', error);
    }
}

async function createExamplePendingContent() {
    return [
        {
            id: generateId(),
            titulo: 'Novo investimento em infraestrutura para Paranavaí',
            resumo: 'Governo anuncia recursos para melhorias na infraestrutura urbana da cidade, incluindo pavimentação e saneamento básico.',
            fonte: 'Bem Paraná',
            link: 'https://www.bemparana.com.br/noticia/exemplo1',
            imagem: 'https://via.placeholder.com/400x300/1e4a73/ffffff?text=Infraestrutura',
            data: new Date().toISOString(),
            status: 'pending',
            addedBy: 'system'
        }
    ];
}

function generateId() {
    return crypto.randomBytes(16).toString('hex');
}

// Garantir que os diretórios existam
async function ensureDirectories() {
    const cacheDir = path.join(__dirname, '../backend/cache');
    try {
        await fs.mkdir(cacheDir, { recursive: true });
    } catch (error) {
        // Diretório já existe
    }
}

// Inicializar
ensureDirectories();

module.exports = router;
