/**
 * Sistema de Carregamento de Notícias - Supabase
 * Portal Paranavaí News
 */

class NoticiasSupabase {
    constructor() {
        this.apiUrl = '/api/noticias-supabase';
        this.cacheKey = 'noticias_principais';
        this.cacheTime = 30 * 60 * 1000; // 30 minutos
        this.container = null;
        this.loading = null;
        this.disclaimer = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.container = document.querySelector('.news-grid, .news-grid-simple');
        this.loading = document.getElementById('loading-noticias');
        this.disclaimer = document.querySelector('.disclaimer-categoria');
        
        if (!this.container) {
            console.warn('Container de notícias não encontrado');
            return;
        }

        this.carregarNoticias();
    }

    async carregarNoticias() {
        try {
            console.log('🚀 Carregando notícias do Supabase...');
            
            // Mostrar loading se existir
            if (this.loading) {
                this.loading.style.display = 'block';
            }

            // Verificar cache primeiro
            const cache = this.obterCache();
            if (cache && this.cacheValido(cache)) {
                console.log('📂 Usando notícias do cache');
                this.exibirNoticias(cache.noticias);
                this.atualizarStatus('cache');
                return cache.noticias;
            }

            // Buscar da API Supabase
            const response = await fetch(this.apiUrl);
            const data = await response.json();

            if (data.success) {
                console.log(`✅ ${data.noticias.length} notícias carregadas do Supabase`);
                
                // Salvar no cache
                this.salvarCache(data);
                
                // Exibir notícias
                this.exibirNoticias(data.noticias);
                
                // Atualizar status
                this.atualizarStatus('supabase', data.estatisticas);
                
                return data.noticias;
            } else {
                throw new Error(data.error || 'Erro ao carregar notícias');
            }

        } catch (error) {
            console.error('❌ Erro ao carregar notícias:', error);
            this.carregarNoticiasFallback();
            this.atualizarStatus('error', null, error.message);
            return [];
        }
    }

    obterCache() {
        try {
            const cache = localStorage.getItem(this.cacheKey);
            return cache ? JSON.parse(cache) : null;
        } catch {
            return null;
        }
    }

    cacheValido(cache) {
        if (!cache || !cache.timestamp) return false;
        return (Date.now() - cache.timestamp) < this.cacheTime;
    }

    salvarCache(data) {
        const cache = {
            ...data,
            timestamp: Date.now()
        };
        localStorage.setItem(this.cacheKey, JSON.stringify(cache));
    }

    exibirNoticias(noticias) {
        if (!this.container) return;

        // Esconder loading
        if (this.loading) {
            this.loading.style.display = 'none';
        }

        // Se não há notícias, exibir notícias de exemplo
        if (!noticias || noticias.length === 0) {
            this.carregarNoticiasFallback();
            return;
        }

        // Limpar container
        this.container.innerHTML = '';

        // Criar cards de notícias
        noticias.forEach((noticia, index) => {
            const card = this.criarCardNoticia(noticia, index);
            this.container.appendChild(card);
        });

        // Animar cards
        this.animarCards();
    }

    criarCardNoticia(noticia, index) {
        const article = document.createElement('article');
        article.className = 'news-card-simple';
        article.dataset.index = index;

        const fonte = noticia.fonte || 'Portal Paranavaí News';
        const corFonte = noticia.corFonte || '#1e4a73';
        const data = noticia.data || 'Hoje';
        const categoria = noticia.categoria || 'Geral';

        article.innerHTML = `
            <div class="news-content">
                <div class="news-header">
                    <span class="category-badge" style="background: ${corFonte}">${categoria}</span>
                    <span class="date"><i class="fas fa-calendar"></i> ${data}</span>
                </div>
                <h3><a href="${noticia.link}" target="_blank" rel="noopener noreferrer">${noticia.titulo}</a></h3>
                <p>${noticia.resumo}</p>
                <div class="news-meta">
                    <span class="source" style="color: ${corFonte}">
                        <i class="fas fa-globe"></i> ${fonte}
                    </span>
                    <a href="${noticia.link}" class="read-more-link" target="_blank" rel="noopener noreferrer">
                        <i class="fas fa-external-link-alt"></i> Leia mais
                    </a>
                </div>
            </div>
        `;

        return article;
    }

    carregarNoticiasFallback() {
        console.log('🔄 Carregando notícias de exemplo...');

        const noticiasExemplo = [
            {
                titulo: "Deputado Leônidas apresenta projetos em defesa do SUS no Paraná",
                resumo: "O deputado estadual Leônidas Fávero Neto (Cidadania) protocolou na Assembleia Legislativa do Paraná importantes projetos voltados ao fortalecimento da saúde pública na região noroeste do estado.",
                link: "https://doutorleonidaspr.com.br/",
                fonte: "Assembleia Legislativa PR",
                corFonte: "#1e4a73",
                categoria: "Política",
                data: "Hoje"
            },
            {
                titulo: "Nova ala do Hospital Regional será inaugurada em março",
                resumo: "Investimentos na infraestrutura de saúde pública beneficiarão toda a região noroeste do Paraná com novos leitos e equipamentos modernos para atendimento especializado.",
                link: "#",
                fonte: "SUS Paraná",
                corFonte: "#d32f2f",
                categoria: "Saúde",
                data: "Ontem"
            },
            {
                titulo: "Safra de soja bate recorde histórico na região",
                resumo: "Produtores rurais da região de Paranavaí comemoram os números excepcionais da safra 2024/2025, com aumento significativo na produtividade e qualidade dos grãos.",
                link: "#",
                fonte: "Agro Paraná",
                corFonte: "#2e7d32",
                categoria: "Agronegócio",
                data: "2 dias atrás"
            },
            {
                titulo: "Festival de inverno atrai turistas à região",
                resumo: "Eventos culturais e gastronômicos movimentam o turismo regional e fortalecem a economia local durante a temporada de inverno, com programação diversificada.",
                link: "#",
                fonte: "Turismo Paraná",
                corFonte: "#f57c00",
                categoria: "Turismo",
                data: "3 dias atrás"
            }
        ];

        this.exibirNoticias(noticiasExemplo);
    }

    animarCards() {
        const cards = document.querySelectorAll('.news-card-simple');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    atualizarStatus(tipo, estatisticas = null, erro = null) {
        // Remover disclaimer antigo se existir
        const disclaimerExistente = document.querySelector('.supabase-status');
        if (disclaimerExistente) {
            disclaimerExistente.remove();
        }

        const statusDiv = document.createElement('div');
        statusDiv.className = 'supabase-status';

        let html = '';
        let style = '';

        switch (tipo) {
            case 'supabase':
                const stats = estatisticas || {};
                html = `
                    <i class="fas fa-database"></i>
                    <strong>✅ Sistema Supabase ativo!</strong>
                    Notícias sendo coletadas automaticamente. 
                    Portais: ${stats.totalPortais || 0} | 
                    Aprovadas: ${stats.noticiasAprovadas || 0} | 
                    Coletadas: ${stats.noticiasColetadas || 0}
                `;
                style = 'background: #d4edda; color: #155724; border-color: #c3e6cb;';
                break;
                
            case 'cache':
                html = `
                    <i class="fas fa-clock"></i>
                    <strong>📂 Cache local:</strong>
                    Exibindo notícias salvas. Atualização automática a cada 30 minutos.
                `;
                style = 'background: #fff3cd; color: #856404; border-color: #ffeaa7;';
                break;
                
            case 'error':
            default:
                html = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>⚠️ Modo exemplo:</strong>
                    Exibindo notícias de demonstração. ${erro ? 'Erro: ' + erro : 'Sistema em manutenção.'}
                `;
                style = 'background: #f8d7da; color: #721c24; border-color: #f5c6cb;';
                break;
        }

        statusDiv.innerHTML = html;
        statusDiv.style.cssText = `
            padding: 1rem;
            margin: 1rem 0;
            border: 1px solid;
            border-radius: 8px;
            font-size: 0.9rem;
            text-align: center;
            ${style}
        `;

        // Inserir antes do container de notícias
        if (this.container) {
            this.container.parentNode.insertBefore(statusDiv, this.container);
        }
    }

    // Método público para forçar atualização
    async forcarAtualizacao() {
        console.log('🔄 Forçando atualização das notícias...');
        
        // Limpar cache
        localStorage.removeItem(this.cacheKey);
        
        // Mostrar loading
        if (this.loading) {
            this.loading.style.display = 'block';
        }
        
        // Recarregar
        return await this.carregarNoticias();
    }

    // Método para adicionar notícia manualmente (para admin)
    adicionarNoticia(dadosNoticia) {
        if (!dadosNoticia.titulo || !dadosNoticia.resumo) {
            console.error('Dados da notícia incompletos');
            return false;
        }

        const cache = this.obterCache();
        const noticias = cache ? cache.noticias : [];
        
        noticias.unshift(dadosNoticia);
        
        this.salvarCache({
            success: true,
            noticias: noticias.slice(0, 20),
            ultimaAtualizacao: new Date()
        });
        
        this.exibirNoticias(noticias.slice(0, 20));
        return true;
    }
}

// Inicializar automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    if (window.noticiasSupabase) return; // Evitar múltiplas inicializações
    
    window.noticiasSupabase = new NoticiasSupabase();
});

// Funções globais de conveniência
window.recarregarNoticias = function() {
    if (window.noticiasSupabase) {
        return window.noticiasSupabase.forcarAtualizacao();
    }
};

window.adicionarNoticiaSupabase = function(titulo, resumo, link, fonte, categoria) {
    if (window.noticiasSupabase) {
        return window.noticiasSupabase.adicionarNoticia({
            titulo,
            resumo,
            link,
            fonte,
            categoria
        });
    }
};

console.log('✅ Sistema de Notícias Supabase carregado com sucesso!');
