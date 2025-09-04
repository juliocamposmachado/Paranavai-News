/**
 * API Handler para Análise e Integração PowerBI
 * Compatível com Vercel Serverless Functions
 */

const fs = require('fs').promises;
const path = require('path');

// Simula base de dados para análises
let analysisData = {
    reports: [],
    dataSources: [],
    dashboards: [],
    metrics: {}
};

const ANALYSIS_FILE = '/tmp/analysis.json';

// Carrega dados de análise
async function loadAnalysisData() {
    try {
        const data = await fs.readFile(ANALYSIS_FILE, 'utf8');
        analysisData = JSON.parse(data);
    } catch (error) {
        // Se não existir, inicia com dados padrão
        analysisData = await getDefaultAnalysisData();
        await saveAnalysisData();
    }
    return analysisData;
}

// Salva dados de análise
async function saveAnalysisData() {
    try {
        await fs.writeFile(ANALYSIS_FILE, JSON.stringify(analysisData, null, 2));
    } catch (error) {
        console.error('Erro ao salvar dados de análise:', error);
    }
}

// Dados padrão de análise
async function getDefaultAnalysisData() {
    return {
        reports: [
            {
                id: 'news-analytics',
                name: 'Análise de Notícias',
                description: 'Métricas de performance e engajamento das notícias do portal',
                type: 'dashboard',
                status: 'active',
                lastUpdate: new Date().toISOString(),
                metrics: {
                    totalViews: 15420,
                    avgEngagement: 78.5,
                    topCategories: ['Política', 'Economia', 'Sociedade']
                }
            },
            {
                id: 'traffic-report',
                name: 'Relatório de Tráfego',
                description: 'Análise de visitantes e comportamento no site',
                type: 'report',
                status: 'active',
                lastUpdate: new Date().toISOString(),
                metrics: {
                    uniqueVisitors: 8930,
                    pageViews: 23450,
                    bounceRate: 34.2,
                    avgSessionDuration: '2m 45s'
                }
            },
            {
                id: 'content-performance',
                name: 'Performance de Conteúdo',
                description: 'Análise de performance individual dos artigos',
                type: 'analysis',
                status: 'active',
                lastUpdate: new Date().toISOString(),
                metrics: {
                    totalArticles: 156,
                    avgReadTime: '3m 12s',
                    shareRate: 12.8,
                    commentsRate: 5.4
                }
            },
            {
                id: 'social-media',
                name: 'Redes Sociais',
                description: 'Métricas de engajamento nas redes sociais',
                type: 'social',
                status: 'active',
                lastUpdate: new Date().toISOString(),
                metrics: {
                    totalFollowers: 12500,
                    engagementRate: 6.8,
                    shareCount: 890,
                    mentionCount: 234
                }
            }
        ],
        dataSources: [
            {
                id: 'website-analytics',
                name: 'Google Analytics',
                type: 'web-analytics',
                status: 'connected',
                description: 'Dados de tráfego e comportamento do website',
                icon: 'fas fa-chart-line',
                lastSync: new Date().toISOString(),
                recordCount: 50000
            },
            {
                id: 'social-apis',
                name: 'APIs de Redes Sociais',
                type: 'social-media',
                status: 'connected',
                description: 'Dados de engajamento do Facebook, Instagram e Twitter',
                icon: 'fas fa-share-alt',
                lastSync: new Date().toISOString(),
                recordCount: 8500
            },
            {
                id: 'cms-database',
                name: 'Banco de Dados do Portal',
                type: 'database',
                status: 'connected',
                description: 'Dados internos de notícias, usuários e comentários',
                icon: 'fas fa-database',
                lastSync: new Date().toISOString(),
                recordCount: 25000
            },
            {
                id: 'external-feeds',
                name: 'Feeds Externos',
                type: 'rss-feeds',
                status: 'warning',
                description: 'Dados de fontes externas de notícias',
                icon: 'fas fa-rss',
                lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24h ago
                recordCount: 12000
            }
        ],
        dashboards: [
            {
                id: 'main-dashboard',
                name: 'Dashboard Principal',
                description: 'Visão geral dos principais KPIs do portal',
                type: 'overview',
                embedUrl: null, // URL do PowerBI seria inserida aqui
                isPublic: true,
                lastUpdate: new Date().toISOString()
            }
        ],
        metrics: {
            summary: {
                totalViews: 45890,
                totalUsers: 12450,
                totalArticles: 234,
                avgEngagement: 7.2
            },
            trends: {
                daily: [
                    { date: '2024-01-01', views: 1250, users: 890 },
                    { date: '2024-01-02', views: 1430, users: 1020 },
                    { date: '2024-01-03', views: 1180, users: 850 },
                    { date: '2024-01-04', views: 1560, users: 1100 },
                    { date: '2024-01-05', views: 1820, users: 1280 },
                    { date: '2024-01-06', views: 1990, users: 1450 },
                    { date: '2024-01-07', views: 2100, users: 1520 }
                ]
            }
        }
    };
}

// Handler principal da API
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { method } = req;
        const url = new URL(req.url, `http://${req.headers.host}`);
        const action = url.searchParams.get('action') || url.pathname.split('/').pop();

        // Carrega dados de análise
        await loadAnalysisData();

        switch (method) {
            case 'GET':
                return handleGet(req, res, action);
            case 'POST':
                return handlePost(req, res, action);
            case 'PUT':
                return handlePut(req, res, action);
            case 'DELETE':
                return handleDelete(req, res, action);
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Analysis API Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

// Handle GET requests
async function handleGet(req, res, action) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get('id');

    switch (action) {
        case 'reports':
            return res.json({
                success: true,
                data: analysisData.reports,
                total: analysisData.reports.length
            });

        case 'data-sources':
            return res.json({
                success: true,
                data: analysisData.dataSources,
                total: analysisData.dataSources.length
            });

        case 'dashboards':
            return res.json({
                success: true,
                data: analysisData.dashboards,
                total: analysisData.dashboards.length
            });

        case 'metrics':
            return res.json({
                success: true,
                data: analysisData.metrics
            });

        case 'summary':
            const summary = {
                totalReports: analysisData.reports.length,
                activeDashboards: analysisData.dashboards.filter(d => d.isPublic).length,
                connectedSources: analysisData.dataSources.filter(d => d.status === 'connected').length,
                totalMetrics: analysisData.metrics.summary
            };

            return res.json({
                success: true,
                data: summary
            });

        case 'powerbi-status':
            // Simula status de conexão com PowerBI
            const powerbiStatus = {
                connected: true,
                status: 'active',
                lastSync: new Date().toISOString(),
                workspaces: 1,
                reports: analysisData.reports.length,
                datasets: analysisData.dataSources.length
            };

            return res.json({
                success: true,
                data: powerbiStatus
            });

        case 'export':
            const exportType = url.searchParams.get('type') || 'json';
            const data = {
                exportDate: new Date().toISOString(),
                reports: analysisData.reports,
                dataSources: analysisData.dataSources,
                metrics: analysisData.metrics
            };

            if (exportType === 'csv') {
                // Converter para CSV seria implementado aqui
                return res.setHeader('Content-Type', 'text/csv').send('CSV data would be here');
            }

            return res.json({
                success: true,
                data: data
            });

        case 'report':
            if (!id) {
                return res.status(400).json({ error: 'Report ID is required' });
            }
            
            const report = analysisData.reports.find(r => r.id === id);
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }

            return res.json({
                success: true,
                data: report
            });

        default:
            return res.status(400).json({ error: 'Invalid action' });
    }
}

// Handle POST requests
async function handlePost(req, res, action) {
    const body = req.body;

    switch (action) {
        case 'sync-powerbi':
            // Simula sincronização com PowerBI
            const syncResult = {
                success: true,
                timestamp: new Date().toISOString(),
                reports: analysisData.reports.length,
                dataSources: analysisData.dataSources.length,
                message: 'PowerBI data synchronized successfully'
            };

            // Atualiza timestamps
            analysisData.reports.forEach(report => {
                report.lastUpdate = new Date().toISOString();
            });

            analysisData.dataSources.forEach(source => {
                source.lastSync = new Date().toISOString();
            });

            await saveAnalysisData();

            return res.json({
                success: true,
                data: syncResult
            });

        case 'create-report':
            if (!body.name || !body.type) {
                return res.status(400).json({ error: 'Name and type are required' });
            }

            const newReport = {
                id: generateId(body.name),
                name: body.name,
                description: body.description || '',
                type: body.type,
                status: 'active',
                lastUpdate: new Date().toISOString(),
                metrics: body.metrics || {}
            };

            analysisData.reports.push(newReport);
            await saveAnalysisData();

            return res.status(201).json({
                success: true,
                message: 'Report created successfully',
                data: newReport
            });

        case 'refresh-data':
            // Simula atualização de dados
            const refreshResult = {
                success: true,
                timestamp: new Date().toISOString(),
                updatedSources: analysisData.dataSources.length,
                message: 'Data sources refreshed successfully'
            };

            // Simula novos dados
            analysisData.metrics.summary.totalViews += Math.floor(Math.random() * 1000);
            analysisData.metrics.summary.totalUsers += Math.floor(Math.random() * 100);

            await saveAnalysisData();

            return res.json({
                success: true,
                data: refreshResult
            });

        default:
            return res.status(400).json({ error: 'Invalid action for POST' });
    }
}

// Handle PUT requests
async function handlePut(req, res, action) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get('id');
    const body = req.body;

    if (action === 'update-report') {
        if (!id) {
            return res.status(400).json({ error: 'Report ID is required' });
        }

        const reportIndex = analysisData.reports.findIndex(r => r.id === id);
        if (reportIndex === -1) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const updatedReport = {
            ...analysisData.reports[reportIndex],
            ...body,
            lastUpdate: new Date().toISOString()
        };

        analysisData.reports[reportIndex] = updatedReport;
        await saveAnalysisData();

        return res.json({
            success: true,
            message: 'Report updated successfully',
            data: updatedReport
        });
    }

    return res.status(400).json({ error: 'Invalid action for PUT' });
}

// Handle DELETE requests
async function handleDelete(req, res, action) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get('id');

    if (action === 'delete-report') {
        if (!id) {
            return res.status(400).json({ error: 'Report ID is required' });
        }

        const reportIndex = analysisData.reports.findIndex(r => r.id === id);
        if (reportIndex === -1) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const deletedReport = analysisData.reports.splice(reportIndex, 1)[0];
        await saveAnalysisData();

        return res.json({
            success: true,
            message: 'Report deleted successfully',
            data: deletedReport
        });
    }

    return res.status(400).json({ error: 'Invalid action for DELETE' });
}

// Utility functions
function generateId(name) {
    return name.toLowerCase()
               .replace(/\s+/g, '-')
               .replace(/[^\w-]/g, '')
               .substring(0, 50) + '-' + Date.now();
}
