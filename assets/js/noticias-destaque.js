/**
 * Sistema de Gerenciamento de Notícias em Destaque
 * Portal Paranavaí News
 */

class NoticiasDestaque {
    constructor() {
        this.container = null;
        this.noticias = [];
        this.init();
    }

    init() {
        // Aguardar carregamento do DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.container = document.querySelector('.news-grid-simple');
        if (!this.container) {
            console.warn('Container de notícias em destaque não encontrado');
            return;
        }
        
        // Carregar notícias padrão se não houver nenhuma
        if (this.container.children.length === 0) {
            this.carregarNoticiasPadrao();
        }
    }

    carregarNoticiasPadrao() {
        const noticiasPadrao = [
            {
                titulo: "Deputado Leônidas apresenta projetos em defesa do SUS no Paraná",
                resumo: "O deputado estadual Leônidas Fávero Neto (Cidadania) protocolou na Assembleia Legislativa do Paraná importantes projetos voltados ao fortalecimento da saúde pública na região...",
                categoria: "politica",
                categoriaTexto: "Política",
                data: "Hoje",
                autor: "Redação",
                link: "pages/politica.html",
                destaque: true
            },
            {
                titulo: "Safra do milho supera expectativas na região de Paranavaí",
                resumo: "Produtores rurais da região celebram os resultados da safra de milho 2024/2025, que superou as expectativas iniciais...",
                categoria: "agronegocio",
                categoriaTexto: "Agronegócio",
                data: "Ontem",
                autor: "Redação",
                link: "#",
                destaque: false
            },
            {
                titulo: "Nova ala do Hospital Regional será inaugurada em março",
                resumo: "Investimentos na infraestrutura de saúde pública beneficiarão toda a região noroeste do Paraná...",
                categoria: "saude",
                categoriaTexto: "Saúde",
                data: "2 dias atrás",
                autor: "Redação",
                link: "#",
                destaque: false
            },
            {
                titulo: "Festival de inverno atrai milhares de turistas à região",
                resumo: "Eventos culturais e gastronômicos movimentam o turismo regional e fortalecem a economia local durante a temporada de inverno...",
                categoria: "turismo",
                categoriaTexto: "Turismo",
                data: "3 dias atrás",
                autor: "Redação",
                link: "#",
                destaque: false
            }
        ];

        this.noticias = noticiasPadrao;
        this.renderizarNoticias();
    }

    adicionarNoticia(noticia) {
        // Validar dados da notícia
        if (!noticia.titulo || !noticia.resumo || !noticia.categoria) {
            console.error('Dados da notícia incompletos');
            return false;
        }

        // Adicionar dados padrão se não fornecidos
        const noticiaCompleta = {
            titulo: noticia.titulo,
            resumo: noticia.resumo,
            categoria: noticia.categoria,
            categoriaTexto: noticia.categoriaTexto || this.getCategoriaTexto(noticia.categoria),
            data: noticia.data || 'Hoje',
            autor: noticia.autor || 'Redação',
            link: noticia.link || '#',
            destaque: noticia.destaque || false
        };

        // Adicionar no início da lista
        this.noticias.unshift(noticiaCompleta);
        
        // Manter apenas as 6 notícias mais recentes
        if (this.noticias.length > 6) {
            this.noticias = this.noticias.slice(0, 6);
        }

        this.renderizarNoticias();
        return true;
    }

    removerNoticia(index) {
        if (index >= 0 && index < this.noticias.length) {
            this.noticias.splice(index, 1);
            this.renderizarNoticias();
            return true;
        }
        return false;
    }

    renderizarNoticias() {
        if (!this.container) return;

        this.container.innerHTML = '';

        this.noticias.forEach((noticia, index) => {
            const card = this.criarCardNoticia(noticia, index);
            this.container.appendChild(card);
        });
    }

    criarCardNoticia(noticia, index) {
        const article = document.createElement('article');
        article.className = `news-card-simple${noticia.destaque ? ' featured' : ''}`;
        article.dataset.index = index;

        article.innerHTML = `
            <div class="news-content">
                <div class="news-header">
                    <span class="category-badge ${noticia.categoria}">${noticia.categoriaTexto}</span>
                    <span class="date"><i class="fas fa-calendar"></i> ${noticia.data}</span>
                </div>
                <h3><a href="${noticia.link}" target="_blank">${noticia.titulo}</a></h3>
                <p>${noticia.resumo}</p>
                <div class="news-meta">
                    <span class="author"><i class="fas fa-user"></i> ${noticia.autor}</span>
                    <a href="${noticia.link}" class="read-more-link">
                        <i class="fas fa-arrow-right"></i> Leia mais
                    </a>
                </div>
            </div>
        `;

        return article;
    }

    getCategoriaTexto(categoria) {
        const categorias = {
            'politica': 'Política',
            'agronegocio': 'Agronegócio',
            'saude': 'Saúde',
            'turismo': 'Turismo',
            'economia': 'Economia',
            'educacao': 'Educação',
            'cultura': 'Cultura',
            'esporte': 'Esporte'
        };
        return categorias[categoria] || 'Geral';
    }

    // Método para adicionar notícia via interface (pode ser chamado externamente)
    adicionarNoticiaForm(dadosNoticia) {
        console.log('Adicionando nova notícia:', dadosNoticia);
        return this.adicionarNoticia(dadosNoticia);
    }

    // Método para obter todas as notícias
    obterNoticias() {
        return [...this.noticias];
    }

    // Método para limpar todas as notícias
    limparNoticias() {
        this.noticias = [];
        this.renderizarNoticias();
    }

    // Método para definir notícia como destaque
    definirDestaque(index) {
        // Remover destaque de todas as notícias
        this.noticias.forEach(noticia => {
            noticia.destaque = false;
        });

        // Definir nova notícia em destaque
        if (index >= 0 && index < this.noticias.length) {
            this.noticias[index].destaque = true;
            this.renderizarNoticias();
            return true;
        }
        return false;
    }
}

// Inicializar quando o script for carregado
const gerenciadorNoticias = new NoticiasDestaque();

// Expor globalmente para facilitar uso
window.NoticiasDestaque = NoticiasDestaque;
window.gerenciadorNoticias = gerenciadorNoticias;

// Função auxiliar para adicionar notícias facilmente
window.adicionarNoticia = function(titulo, resumo, categoria, link = '#', destaque = false) {
    return gerenciadorNoticias.adicionarNoticia({
        titulo: titulo,
        resumo: resumo,
        categoria: categoria,
        link: link,
        destaque: destaque
    });
};

// Função para definir uma notícia como destaque
window.definirComoDestaque = function(index) {
    return gerenciadorNoticias.definirDestaque(index);
};

console.log('✅ Sistema de Notícias em Destaque carregado com sucesso!');
