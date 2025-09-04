/**
 * Servidor Integrado - Portal Paranavaí News
 * Inclui API pública e dashboard administrativa
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

// APIs
const adminAPI = require('./api/admin');
const ContentProcessor = require('./backend/content_processor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname));

// ===== API ADMINISTRATIVA =====
app.use('/api/admin', adminAPI);

// ===== API PÚBLICA EXISTENTE =====

// Configuração dos portais de notícias (com Bem Paraná otimizado)
const PORTAIS = [
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
    },
    {
        nome: "RIC Mais",
        url: "https://ricmais.com.br",
        busca: "https://ricmais.com.br/busca/?q=paranavai",
        logo: "https://ricmais.com.br/wp-content/themes/ricmais/assets/images/logo-ricmais.svg",
        cor: "#e31e24",
        selector: {
            artigos: "article, .post-item",
            titulo: "h2 a, .post-title a",
            resumo: ".post-excerpt, .excerpt",
            link: "h2 a, .post-title a",
            imagem: ".post-thumbnail img, .featured-image img",
            data: ".post-date, .date"
        }
    },
    {
        nome: "G1 Paraná",
        url: "https://g1.globo.com/pr/parana/",
        busca: "https://g1.globo.com/busca/?q=paranavai&order=recent&species=notícias&from=0&size=20",
        logo: "https://s2.glbimg.com/YfV-sWaJTqHBhDKoEjP2H4s3ZBs=/0x0:153x153/150x150/s.glbimg.com/en/ho/f/original/2015/05/21/g1_logo_150x150.png",
        cor: "#c4170c",
        selector: {
            artigos: ".widget--info, article",
            titulo: "h2 a, .widget--info__title a",
            resumo: ".widget--info__description, .summary",
            link: ".widget--info__title a, h2 a",
            imagem: ".widget--info__media img, img",
            data: ".widget--info__meta time, time"
        }
    }
];

// Cache de notícias
const CACHE_FILE = path.join(__dirname, 'backend/cache/noticias.json');
let noticiasCache = [];
let ultimaAtualizacao = null;

// Carregar cache inicial
async function carregarCache() {
    try {
        const data = await fs.readFile(CACHE_FILE, 'utf8');
        const cacheData = JSON.parse(data);
        noticiasCache = cacheData.noticias || [];
        ultimaAtualizacao = cacheData.ultimaAtualizacao || null;
        console.log(`📄 Cache carregado: ${noticiasCache.length} notícias`);
    } catch (error) {
        console.log('📄 Cache não encontrado, será criado');
        noticiasCache = [];
        ultimaAtualizacao = null;
    }
}

// Salvar cache
async function salvarCache() {
    const cacheData = {
        noticias: noticiasCache,
        ultimaAtualizacao: new Date().toISOString()
    };
    await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2));
}

// API: Obter notícias
app.get('/api/noticias', async (req, res) => {
    try {
        const { limite = 20, fonte = 'todas' } = req.query;
        
        let noticias = noticiasCache;
        
        // Filtrar por fonte se especificado
        if (fonte !== 'todas') {
            noticias = noticias.filter(noticia => 
                noticia.fonte.toLowerCase().includes(fonte.toLowerCase())
            );
        }
        
        // Limitar resultados
        noticias = noticias.slice(0, parseInt(limite));
        
        res.json({
            success: true,
            noticias: noticias,
            total: noticias.length,
            ultimaAtualizacao: ultimaAtualizacao
        });
    } catch (error) {
        console.error('Erro na API de notícias:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// API: Obter portais configurados
app.get('/api/portais', (req, res) => {
    const portaisInfo = PORTAIS.map(portal => ({
        nome: portal.nome,
        url: portal.url,
        logo: portal.logo,
        cor: portal.cor
    }));
    
    res.json({
        success: true,
        portais: portaisInfo,
        total: portaisInfo.length
    });
});

// API: Estatísticas
app.get('/api/estatisticas', async (req, res) => {
    try {
        const totalNoticias = noticiasCache.length;
        const fontes = {};
        
        noticiasCache.forEach(noticia => {
            fontes[noticia.fonte] = (fontes[noticia.fonte] || 0) + 1;
        });
        
        res.json({
            success: true,
            estatisticas: {
                totalNoticias,
                ultimaAtualizacao,
                fontes,
                portaisConfigurados: PORTAIS.length
            }
        });
    } catch (error) {
        console.error('Erro na API de estatísticas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        });
    }
});

// API: Atualizar notícias manualmente
app.post('/api/atualizar', async (req, res) => {
    try {
        console.log('🔄 Atualização manual solicitada...');
        
        // Aqui você pode chamar o sistema de coleta de notícias
        // Por enquanto, retornamos sucesso
        
        res.json({
            success: true,
            message: 'Atualização iniciada',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Erro na atualização manual:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao iniciar atualização' 
        });
    }
});

// ===== ROTAS DA DASHBOARD =====

// Rota principal da dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/index.html'));
});

// ===== ROTAS PÚBLICAS =====

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware para páginas não encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado',
        message: `${req.method} ${req.originalUrl} não está disponível`
    });
});

// Middleware para tratamento de erros
app.use((error, req, res, next) => {
    console.error('Erro no servidor:', error);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
    });
});

// Inicializar servidor
async function iniciarServidor() {
    try {
        // Carregar cache de notícias
        await carregarCache();
        
        // Iniciar Content Processor
        const contentProcessor = new ContentProcessor();
        
        // Fazer disponível globalmente para a API admin
        app.locals.contentProcessor = contentProcessor;
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor iniciado em http://localhost:${PORT}`);
            console.log(`🔧 Dashboard administrativa: http://localhost:${PORT}/admin`);
            console.log(`📊 API pública: http://localhost:${PORT}/api/noticias`);
            console.log(`⚙️  API administrativa: http://localhost:${PORT}/api/admin`);
            
            // Exibir credenciais da dashboard
            console.log('\n🔐 Credenciais da Dashboard:');
            console.log('   👤 Usuário: Matheus');
            console.log('   🔑 Senha: Admin78451200');
            
            // Status inicial
            console.log(`\n📈 Status inicial:`);
            console.log(`   📰 ${noticiasCache.length} notícias no cache`);
            console.log(`   🔄 Content Processor ativo`);
        });
        
    } catch (error) {
        console.error('💥 Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Inicializar
iniciarServidor();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Encerrando servidor...');
    process.exit(0);
});

module.exports = app;
