/**
 * Processador de Conteúdo Automático
 * Move notícias coletadas para fila de aprovação administrativa
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ContentProcessor {
    constructor() {
        this.noticiasFile = path.join(__dirname, 'cache/noticias.json');
        this.pendingFile = path.join(__dirname, 'cache/pending_content.json');
        this.processedIdsFile = path.join(__dirname, 'cache/processed_ids.json');
        
        this.processedIds = new Set();
        this.loadProcessedIds();
        
        // Processar automaticamente a cada 5 minutos
        setInterval(() => {
            this.processNewContent();
        }, 5 * 60 * 1000);
        
        console.log('🔄 Content Processor iniciado - processando a cada 5 minutos');
    }
    
    async loadProcessedIds() {
        try {
            const data = await fs.readFile(this.processedIdsFile, 'utf8');
            const ids = JSON.parse(data).ids || [];
            this.processedIds = new Set(ids);
            console.log(`📋 Carregados ${ids.length} IDs já processados`);
        } catch (error) {
            console.log('📄 Arquivo de IDs processados não encontrado, criando novo');
            this.processedIds = new Set();
        }
    }
    
    async saveProcessedIds() {
        const data = {
            ids: Array.from(this.processedIds),
            lastUpdate: new Date().toISOString()
        };
        await fs.writeFile(this.processedIdsFile, JSON.stringify(data, null, 2));
    }
    
    async processNewContent() {
        try {
            console.log('🔍 Verificando novas notícias...');
            
            // Carregar notícias coletadas
            const noticias = await this.loadNoticias();
            if (!noticias || noticias.length === 0) {
                console.log('📭 Nenhuma notícia encontrada');
                return;
            }
            
            // Filtrar apenas notícias não processadas
            const newItems = noticias.filter(noticia => {
                const id = this.generateItemId(noticia);
                return !this.processedIds.has(id);
            });
            
            if (newItems.length === 0) {
                console.log('✅ Todas as notícias já foram processadas');
                return;
            }
            
            console.log(`📥 Encontradas ${newItems.length} novas notícias para processar`);
            
            // Processar cada item
            let processed = 0;
            for (const item of newItems) {
                try {
                    await this.addToPendingQueue(item);
                    
                    const id = this.generateItemId(item);
                    this.processedIds.add(id);
                    processed++;
                    
                } catch (error) {
                    console.error(`❌ Erro ao processar item "${item.titulo}":`, error.message);
                }
            }
            
            if (processed > 0) {
                await this.saveProcessedIds();
                console.log(`✅ ${processed} itens adicionados à fila de aprovação`);
            }
            
        } catch (error) {
            console.error('💥 Erro no processamento automático:', error);
        }
    }
    
    async loadNoticias() {
        try {
            const data = await fs.readFile(this.noticiasFile, 'utf8');
            return JSON.parse(data).noticias || [];
        } catch (error) {
            return [];
        }
    }
    
    async addToPendingQueue(item) {
        // Carregar fila pendente atual
        let pendingItems = [];
        try {
            const data = await fs.readFile(this.pendingFile, 'utf8');
            pendingItems = JSON.parse(data).items || [];
        } catch (error) {
            // Arquivo não existe, será criado
        }
        
        // Converter formato da notícia para formato de aprovação
        const pendingItem = {
            id: crypto.randomBytes(16).toString('hex'),
            titulo: item.titulo,
            resumo: item.resumo,
            fonte: item.fonte,
            link: item.link,
            imagem: item.imagem,
            data: new Date().toISOString(),
            status: 'pending',
            addedBy: 'auto_processor',
            originalData: item.data,
            tipoFonte: item.tipoFonte || 'unknown',
            autoProcessed: true
        };
        
        // Adicionar no início da lista
        pendingItems.unshift(pendingItem);
        
        // Manter apenas os últimos 200 itens na fila
        pendingItems = pendingItems.slice(0, 200);
        
        // Salvar
        const data = {
            items: pendingItems,
            lastUpdate: new Date().toISOString(),
            autoProcessorInfo: {
                totalProcessed: pendingItems.filter(item => item.autoProcessed).length,
                lastProcessed: new Date().toISOString()
            }
        };
        
        await fs.writeFile(this.pendingFile, JSON.stringify(data, null, 2));
        
        console.log(`➕ Adicionado: "${item.titulo}" (${item.fonte})`);
    }
    
    generateItemId(item) {
        // Gerar ID único baseado no título e fonte
        const content = `${item.titulo}|${item.fonte}|${item.link}`;
        return crypto.createHash('md5').update(content).digest('hex');
    }
    
    // Método para limpar IDs processados antigos (manter apenas últimos 1000)
    async cleanupProcessedIds() {
        const ids = Array.from(this.processedIds);
        if (ids.length > 1000) {
            this.processedIds = new Set(ids.slice(-1000));
            await this.saveProcessedIds();
            console.log(`🧹 Limpeza: mantidos últimos 1000 IDs processados`);
        }
    }
    
    // Método manual para forçar processamento
    async forceProcess() {
        console.log('🚀 Processamento manual iniciado...');
        await this.processNewContent();
    }
    
    // Estatísticas
    async getStats() {
        const noticias = await this.loadNoticias();
        
        let pendingItems = [];
        try {
            const data = await fs.readFile(this.pendingFile, 'utf8');
            pendingItems = JSON.parse(data).items || [];
        } catch (error) {
            pendingItems = [];
        }
        
        const autoProcessed = pendingItems.filter(item => item.autoProcessed).length;
        
        return {
            totalNoticias: noticias.length,
            totalProcessed: this.processedIds.size,
            pendingItems: pendingItems.length,
            autoProcessedInQueue: autoProcessed,
            lastCheck: new Date().toISOString()
        };
    }
}

// Se executado diretamente
if (require.main === module) {
    const processor = new ContentProcessor();
    
    // Processar imediatamente na inicialização
    setTimeout(() => {
        processor.forceProcess();
    }, 2000);
    
    // Handler para encerramento gracioso
    process.on('SIGINT', async () => {
        console.log('\n🛑 Encerrando Content Processor...');
        await processor.saveProcessedIds();
        process.exit(0);
    });
    
    // Manter o processo ativo
    setInterval(() => {
        // Limpeza periódica (uma vez por hora)
        processor.cleanupProcessedIds();
    }, 60 * 60 * 1000);
}

module.exports = ContentProcessor;
