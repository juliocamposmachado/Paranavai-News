// Integração com API de Notícias Parceiras
class NoticiasParcerias {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.cacheLocal = 'noticias_parceiros';
        this.tempoCache = 30 * 60 * 1000; // 30 minutos
    }

    async carregarNoticias() {
        try {
            // Verificar cache local primeiro
            const cache = this.obterCache();
            if (cache && this.cacheValido(cache)) {
                console.log('📂 Usando notícias do cache local');
                this.exibirNoticias(cache.noticias);
                return cache.noticias;
            }

            // Buscar da API
            console.log('🌐 Buscando notícias da API...');
            const response = await fetch(`${this.apiUrl}/noticias`);
            const data = await response.json();

            if (data.success) {
                this.salvarCache(data);
                this.exibirNoticias(data.noticias);
                return data.noticias;
            } else {
                throw new Error(data.error || 'Erro desconhecido');
            }

        } catch (error) {
            console.error('❌ Erro ao carregar notícias:', error);
            // Não exibir mensagem de erro aqui, deixar o fallback do index.html funcionar
            return [];
        }
    }

    obterCache() {
        try {
            const cache = localStorage.getItem(this.cacheLocal);
            return cache ? JSON.parse(cache) : null;
        } catch {
            return null;
        }
    }

    cacheValido(cache) {
        if (!cache || !cache.timestamp) return false;
        const agora = Date.now();
        return (agora - cache.timestamp) < this.tempoCache;
    }

    salvarCache(data) {
        const cache = {
            ...data,
            timestamp: Date.now()
        };
        localStorage.setItem(this.cacheLocal, JSON.stringify(cache));
    }

    exibirNoticias(noticias) {
        const container = document.getElementById('noticias-parceiros');
        const loading = document.getElementById('loading-parceiros');
        
        if (!container) {
            console.warn('Container de notícias parceiros não encontrado');
            return;
        }

        // Esconder loading
        if (loading) {
            loading.style.display = 'none';
        }

        // Limpar container
        container.innerHTML = '';
        container.style.display = 'grid';

        noticias.forEach(noticia => {
            const card = this.criarCardNoticia(noticia);
            container.appendChild(card);
        });

        // Adicionar contador de fontes
        this.adicionarContadorFontes(noticias);
        
        // Atualizar informação de última atualização
        this.atualizarUltimaAtualizacao();
        
        // Animar entrada dos cards
        this.animarCards();
    }

    criarCardNoticia(noticia) {
        const item = document.createElement('article');
        item.className = 'news-item-simple parceiro-item';
        item.setAttribute('data-fonte', noticia.fonte);

        item.innerHTML = `
            <div class="news-item-content">
                <div class="news-header">
                    <span class="fonte-tag" style="background: ${noticia.corFonte || '#1e4a73'}">
                        <i class="fas fa-globe"></i> ${noticia.fonte}
                    </span>
                    <span class="data-tag">
                        <i class="fas fa-calendar-alt"></i> ${noticia.data}
                    </span>
                </div>
                <h3 class="news-title">
                    <a href="${noticia.link}" target="_blank" rel="noopener noreferrer">${noticia.titulo}</a>
                </h3>
                <p class="news-summary">${noticia.resumo}</p>
                <div class="news-actions">
                    <a href="${noticia.link}" target="_blank" rel="noopener noreferrer" class="btn-read-article">
                        <i class="fas fa-external-link-alt"></i> Ler matéria completa
                    </a>
                </div>
            </div>
        `;

        return item;
    }
            if (!e.target.closest('a')) {
                const link = card.querySelector('h3 a');
                if (link) {
                    window.open(link.href, '_blank');
                }
            }
        });

        return card;
    }

    adicionarContadorFontes(noticias) {
        const fontes = [...new Set(noticias.map(n => n.fonte))];
        const container = document.getElementById('noticias-parceiros');
        
        // Remover contador anterior se existir
        const contadorExistente = document.querySelector('.fontes-contador');
        if (contadorExistente) {
            contadorExistente.remove();
        }
        
        const contador = document.createElement('div');
        contador.className = 'fontes-contador';
        contador.innerHTML = `
            <div class="contador-info">
                <i class="fas fa-globe"></i>
                <span>Notícias de ${fontes.length} portais parceiros</span>
                <small>Atualizado automaticamente</small>
            </div>
        `;
        
        if (container) {
            container.insertAdjacentElement('beforebegin', contador);
        }
    }

    atualizarUltimaAtualizacao() {
        const lastUpdate = document.getElementById('last-update');
        if (lastUpdate) {
            const agora = new Date();
            const horaFormatada = agora.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            lastUpdate.textContent = `Última atualização: Hoje às ${horaFormatada}`;
        }
    }

    animarCards() {
        const cards = document.querySelectorAll('.parceiro-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    async forcarAtualizacao() {
        try {
            console.log('🔄 Forçando atualização das notícias...');
            
            // Mostrar loading
            const loading = document.getElementById('loading-parceiros');
            const container = document.getElementById('noticias-parceiros');
            
            if (loading) loading.style.display = 'block';
            if (container) container.style.display = 'none';
            
            // Limpar cache local
            localStorage.removeItem(this.cacheLocal);
            
            // Tentar API first
            try {
                const response = await fetch(`${this.apiUrl}/atualizar`, { 
                    method: 'POST',
                    timeout: 5000 
                });
                const data = await response.json();
                
                if (data.success) {
                    console.log('✅ Notícias atualizadas via API');
                    await this.carregarNoticias();
                    return;
                }
            } catch (apiError) {
                console.log('🔄 API indisponível, tentando scraper local...');
            }
            
            // Fallback: carregar do cache/scraper local se disponível
            await this.carregarNoticias();
            
        } catch (error) {
            console.error('❌ Erro ao forçar atualização:', error);
            
            // Esconder loading em caso de erro
            const loading = document.getElementById('loading-parceiros');
            if (loading) loading.style.display = 'none';
        }
    }

    // Método para carregar notícias do arquivo local (fallback)
    async carregarNoticiasFallback() {
        try {
            const response = await fetch('cache/noticias_parceiros.json');
            if (response.ok) {
                const data = await response.json();
                console.log('📂 Carregando notícias do arquivo local');
                this.exibirNoticias(data.noticias || []);
                return data.noticias || [];
            }
        } catch (error) {
            console.log('📭 Arquivo local de notícias não encontrado');
        }
        return [];
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    window.noticiasParcerias = new NoticiasParcerias();
    
    // Carregar notícias automaticamente
    window.noticiasParcerias.carregarNoticias();
    
    // Atualizar a cada 15 minutos se a página estiver ativa
    setInterval(() => {
        if (!document.hidden) {
            window.noticiasParcerias.carregarNoticias();
        }
    }, 15 * 60 * 1000);
    
    // Recarregar quando a página voltar ao foco
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // Verificar se faz mais de 10 minutos que não atualiza
            const cache = window.noticiasParcerias.obterCache();
            if (!cache || (Date.now() - cache.timestamp) > 10 * 60 * 1000) {
                window.noticiasParcerias.carregarNoticias();
            }
        }
    });
});

// Expor globalmente para debug
window.NoticiasParcerias = NoticiasParcerias;
