/**
 * Sistema de Busca de Notícias por Categoria
 * Portal Paranavaí News
 */

class CategoriaNoticias {
    constructor(categoria) {
        this.categoria = categoria;
        this.apiUrl = '/api';
        this.cacheLocal = `noticias_${categoria}`;
        this.tempoCache = 30 * 60 * 1000; // 30 minutos
        this.container = null;
        this.loading = null;
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
        this.container = document.getElementById('noticias-categoria');
        this.loading = document.getElementById('loading-categoria');
        
        if (!this.container) {
            console.warn('Container de notícias da categoria não encontrado');
            return;
        }

        this.carregarNoticias();
    }

    async carregarNoticias() {
        try {
            // Verificar cache local primeiro
            const cache = this.obterCache();
            if (cache && this.cacheValido(cache)) {
                console.log(`📂 Usando notícias de ${this.categoria} do cache local`);
                this.exibirNoticias(cache.noticias);
                return cache.noticias;
            }

            // Buscar da API Supabase
            console.log(`🌐 Buscando notícias aprovadas de ${this.categoria} do Supabase...`);
            const response = await fetch(`${this.apiUrl}/categoria?categoria=${this.categoria}`);
            const data = await response.json();

            if (data.success) {
                this.salvarCache(data);
                this.exibirNoticias(data.noticias);
                return data.noticias;
            } else {
                throw new Error(data.error || 'Erro desconhecido');
            }

        } catch (error) {
            console.error(`❌ Erro ao carregar notícias de ${this.categoria}:`, error);
            this.carregarNoticiasFallback();
            return [];
        }
    }

    carregarNoticiasFallback() {
        console.log(`🔄 Carregando notícias de exemplo para ${this.categoria}...`);
        
        // Notícias de exemplo baseadas na categoria
        const noticiasPorCategoria = {
            politica: [
                {
                    titulo: "Deputado Leônidas apresenta projetos em defesa do SUS no Paraná",
                    resumo: "O deputado estadual Leônidas Fávero Neto (Cidadania) protocolou na Assembleia Legislativa do Paraná importantes projetos voltados ao fortalecimento da saúde pública na região...",
                    link: "https://doutorleonidaspr.com.br/",
                    data: "Hoje",
                    fonte: "Assembleia Legislativa PR",
                    corFonte: "#1e4a73"
                },
                {
                    titulo: "Assembleia aprova orçamento com foco em infraestrutura regional",
                    resumo: "Nova distribuição de recursos contempla obras importantes para o noroeste paranaense, incluindo hospitais e estradas rurais...",
                    link: "#",
                    data: "Ontem",
                    fonte: "Paraná Portal",
                    corFonte: "#2c5f8a"
                },
                {
                    titulo: "Câmara Municipal discute melhorias no transporte público",
                    resumo: "Vereadores analisam proposta para renovação da frota e ampliação das linhas de ônibus urbano em Paranavaí...",
                    link: "#",
                    data: "2 dias atrás",
                    fonte: "Folha de Paranavaí",
                    corFonte: "#ff9800"
                },
                {
                    titulo: "Região garante R$ 15 milhões em recursos federais",
                    resumo: "Emendas parlamentares direcionadas para obras de saneamento e melhoria da educação básica nos municípios da região...",
                    link: "#",
                    data: "3 dias atrás",
                    fonte: "Bem Paraná",
                    corFonte: "#ff6900"
                },
                {
                    titulo: "Lei de incentivo ao desenvolvimento industrial é sancionada",
                    resumo: "Nova legislação oferece benefícios fiscais para empresas que se instalarem na região noroeste do Paraná...",
                    link: "#",
                    data: "4 dias atrás",
                    fonte: "Noroeste Online",
                    corFonte: "#2e7d32"
                }
            ],
            saude: [
                {
                    titulo: "Nova ala do Hospital Regional será inaugurada em março",
                    resumo: "Investimentos na infraestrutura de saúde pública beneficiarão toda a região noroeste do Paraná com novos leitos e equipamentos modernos...",
                    link: "#",
                    data: "Hoje",
                    fonte: "SUS Paraná",
                    corFonte: "#d32f2f"
                },
                {
                    titulo: "Programa de vacinação atinge 95% da população regional",
                    resumo: "Campanha de imunização supera metas estabelecidas pelo Ministério da Saúde para a região de Paranavaí...",
                    link: "#",
                    data: "Ontem",
                    fonte: "Bem Paraná",
                    corFonte: "#ff6900"
                },
                {
                    titulo: "Equipamentos de última geração chegam ao hospital",
                    resumo: "Investimento milionário moderniza atendimento médico com tomógrafo e ressonância magnética de alta definição...",
                    link: "#",
                    data: "2 dias atrás",
                    fonte: "Folha de Paranavaí",
                    corFonte: "#ff9800"
                },
                {
                    titulo: "Posto de saúde da Vila Rica é ampliado",
                    resumo: "Reforma e ampliação do posto beneficiará mais de 5 mil moradores da região com novos consultórios e farmácia básica...",
                    link: "#",
                    data: "3 dias atrás",
                    fonte: "Paraná Portal",
                    corFonte: "#1e4a73"
                },
                {
                    titulo: "Médicos especialistas chegam à região através de residência",
                    resumo: "Programa de residência médica regional atrai profissionais especializados para atender a demanda local...",
                    link: "#",
                    data: "5 dias atrás",
                    fonte: "Noroeste Online",
                    corFonte: "#2e7d32"
                }
            ],
            agronegocio: [
                {
                    titulo: "Safra de soja bate recorde histórico na região noroeste",
                    resumo: "Produtores rurais comemoram os números excepcionais da safra 2024/2025 com aumento de 18% na produtividade...",
                    link: "#",
                    data: "Hoje",
                    fonte: "Agro Paraná",
                    corFonte: "#2e7d32"
                },
                {
                    titulo: "Programa de irrigação beneficia pequenos produtores",
                    resumo: "Projeto piloto demonstra resultados positivos na produtividade agrícola com economia de água de 40%...",
                    link: "#",
                    data: "Ontem",
                    fonte: "Rural Notícias",
                    corFonte: "#4caf50"
                },
                {
                    titulo: "Exportações do agronegócio paranaense crescem 12%",
                    resumo: "Estado se consolida como um dos maiores exportadores agrícolas do Brasil com foco em soja, milho e carne...",
                    link: "#",
                    data: "2 dias atrás",
                    fonte: "Bem Paraná",
                    corFonte: "#ff6900"
                },
                {
                    titulo: "Nova cooperativa é fundada em Paranavaí",
                    resumo: "Cooperativa agrícola reunirá mais de 200 pequenos produtores para fortalecer a comercialização conjunta...",
                    link: "#",
                    data: "4 dias atrás",
                    fonte: "Folha Rural",
                    corFonte: "#8bc34a"
                },
                {
                    titulo: "Tecnologia digital revoluciona a agricultura regional",
                    resumo: "Drones e sensores inteligentes ajudam produtores a otimizar plantio e reduzir uso de defensivos...",
                    link: "#",
                    data: "1 semana atrás",
                    fonte: "Tech Agro",
                    corFonte: "#009688"
                }
            ],
            turismo: [
                {
                    titulo: "Festival de inverno atrai milhares de turistas à região",
                    resumo: "Eventos culturais e gastronômicos movimentam o turismo regional e fortalecem a economia local durante a temporada...",
                    link: "#",
                    data: "Hoje",
                    fonte: "Turismo Paraná",
                    corFonte: "#f57c00"
                },
                {
                    titulo: "Rota turística rural conecta 10 propriedades da região",
                    resumo: "Nova iniciativa promove agroturismo e permite aos visitantes conhecer a produção local e a cultura rural...",
                    link: "#",
                    data: "Ontem",
                    fonte: "Bem Paraná",
                    corFonte: "#ff6900"
                },
                {
                    titulo: "Parque ecológico recebe investimentos para expansão",
                    resumo: "Ampliação das trilhas e construção de centro de visitantes atrairá mais turistas interessados no ecoturismo...",
                    link: "#",
                    data: "3 dias atrás",
                    fonte: "Eco Turismo PR",
                    corFonte: "#4caf50"
                },
                {
                    titulo: "Hotel fazenda conquista certificação internacional",
                    resumo: "Propriedade rural se torna referência em turismo sustentável e hospitalidade rural na região noroeste...",
                    link: "#",
                    data: "5 dias atrás",
                    fonte: "Hospitality News",
                    corFonte: "#795548"
                },
                {
                    titulo: "Festival gastronômico celebra culinária regional",
                    resumo: "Evento anual destaca pratos típicos e produtos locais, atraindo visitantes de todo o estado do Paraná...",
                    link: "#",
                    data: "1 semana atrás",
                    fonte: "Gastronomia PR",
                    corFonte: "#e91e63"
                }
            ]
        };

        const noticias = noticiasPorCategoria[this.categoria] || [];
        this.exibirNoticias(noticias);
        
        // Atualizar disclaimer
        this.atualizarDisclaimer();
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
        if (!this.container) return;

        // Esconder loading
        if (this.loading) {
            this.loading.style.display = 'none';
        }

        // Limpar container
        this.container.innerHTML = '';
        this.container.style.display = 'block';

        if (noticias.length === 0) {
            this.exibirMensagemVazia();
            return;
        }

        noticias.forEach((noticia, index) => {
            const card = this.criarCardNoticia(noticia, index);
            this.container.appendChild(card);
        });

        // Adicionar contador de notícias
        this.adicionarContadorNoticias(noticias);
        
        // Atualizar informação de última atualização
        this.atualizarUltimaAtualizacao();
        
        // Animar entrada dos cards
        this.animarCards();
    }

    criarCardNoticia(noticia, index) {
        const item = document.createElement('article');
        item.className = 'news-item-simple categoria-item';
        item.setAttribute('data-fonte', noticia.fonte);
        item.setAttribute('data-index', index);

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

    exibirMensagemVazia() {
        this.container.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-newspaper"></i>
                <h3>Nenhuma notícia encontrada</h3>
                <p>Não foram encontradas notícias para a categoria ${this.getCategoriaTexto()} no momento.</p>
                <button onclick="categoriaNoticias.carregarNoticias()" class="btn-retry">
                    <i class="fas fa-refresh"></i> Tentar novamente
                </button>
            </div>
        `;
    }

    adicionarContadorNoticias(noticias) {
        // Remover contador anterior se existir
        const contadorExistente = document.querySelector('.categoria-contador');
        if (contadorExistente) {
            contadorExistente.remove();
        }
        
        const contador = document.createElement('div');
        contador.className = 'categoria-contador';
        contador.innerHTML = `
            <div class="contador-info">
                <i class="fas fa-list"></i>
                <span>${noticias.length} notícias encontradas sobre ${this.getCategoriaTexto()}</span>
                <small>Atualizado automaticamente a cada 30 minutos</small>
            </div>
        `;
        
        if (this.container) {
            this.container.insertAdjacentElement('beforebegin', contador);
        }
    }

    atualizarUltimaAtualizacao() {
        const lastUpdate = document.getElementById('last-update-categoria');
        if (lastUpdate) {
            const agora = new Date();
            const horaFormatada = agora.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            lastUpdate.textContent = `Última atualização: Hoje às ${horaFormatada}`;
        }
    }

    atualizarDisclaimer() {
        const disclaimer = document.querySelector('.disclaimer-categoria');
        if (disclaimer) {
            disclaimer.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <strong>API não configurada:</strong> Execute o backend (npm start na pasta backend) para 
                coletar notícias reais de ${this.getCategoriaTexto()} dos portais parceiros.
            `;
            disclaimer.style.background = '#f8d7da';
            disclaimer.style.color = '#721c24';
            disclaimer.style.borderColor = '#f5c6cb';
        }
    }

    animarCards() {
        const cards = document.querySelectorAll('.categoria-item');
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
            console.log(`🔄 Forçando atualização das notícias de ${this.categoria}...`);
            
            // Mostrar loading
            if (this.loading) this.loading.style.display = 'block';
            if (this.container) this.container.style.display = 'none';
            
            // Limpar cache local
            localStorage.removeItem(this.cacheLocal);
            
            // Recarregar notícias
            await this.carregarNoticias();
            
        } catch (error) {
            console.error('❌ Erro ao forçar atualização:', error);
        }
    }

    getCategoriaTexto() {
        const categorias = {
            'politica': 'Política',
            'saude': 'Saúde',
            'agronegocio': 'Agronegócio',
            'turismo': 'Turismo',
            'economia': 'Economia',
            'educacao': 'Educação',
            'cultura': 'Cultura',
            'esporte': 'Esporte'
        };
        return categorias[this.categoria] || this.categoria;
    }

    // Método público para adicionar notícias manualmente
    adicionarNoticia(dadosNoticia) {
        if (!dadosNoticia.titulo || !dadosNoticia.resumo) {
            console.error('Dados da notícia incompletos');
            return false;
        }

        const noticiaCompleta = {
            titulo: dadosNoticia.titulo,
            resumo: dadosNoticia.resumo,
            link: dadosNoticia.link || '#',
            data: dadosNoticia.data || 'Hoje',
            fonte: dadosNoticia.fonte || 'Portal Paranavaí News',
            corFonte: dadosNoticia.corFonte || '#1e4a73'
        };

        // Buscar notícias atuais do cache ou criar array vazio
        const cache = this.obterCache();
        const noticiasAtuais = cache ? cache.noticias : [];
        
        // Adicionar nova notícia no início
        noticiasAtuais.unshift(noticiaCompleta);
        
        // Limitar a 20 notícias
        const noticiasLimitadas = noticiasAtuais.slice(0, 20);
        
        // Salvar no cache
        this.salvarCache({
            success: true,
            noticias: noticiasLimitadas,
            categoria: this.categoria
        });
        
        // Re-exibir notícias
        this.exibirNoticias(noticiasLimitadas);
        
        return true;
    }
}

// Função global para inicializar em cada página
window.inicializarCategoriaNoticias = function(categoria) {
    window.categoriaNoticias = new CategoriaNoticias(categoria);
    return window.categoriaNoticias;
};

// Função global para forçar atualização
window.forcarAtualizacaoCategoria = function() {
    if (window.categoriaNoticias) {
        window.categoriaNoticias.forcarAtualizacao();
    }
};

console.log('✅ Sistema de Notícias por Categoria carregado com sucesso!');
