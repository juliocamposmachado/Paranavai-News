// Portal Paranavaí News - JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    mobileMenuToggle.addEventListener('click', function() {
        mainNav.classList.toggle('active');
    });

    // Smooth Scrolling para links internos
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Newsletter Form
    const newsletterForm = document.querySelector('.newsletter-form');
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailInput = this.querySelector('input[type="email"]');
        const email = emailInput.value;
        
        if (email) {
            // Simular envio do email
            showNotification('Obrigado! Você foi cadastrado com sucesso em nossa newsletter.', 'success');
            emailInput.value = '';
        }
    });

    // Sistema de Notificações
    function showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
                <button class="close-notification">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Adicionar estilos da notificação
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    z-index: 10000;
                    max-width: 400px;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                    border-left: 4px solid #1e4a73;
                }
                
                .notification.success {
                    border-left-color: #2e7d32;
                }
                
                .notification.show {
                    transform: translateX(0);
                }
                
                .notification-content {
                    padding: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .notification-content i {
                    color: #1e4a73;
                    font-size: 1.2rem;
                }
                
                .notification.success .notification-content i {
                    color: #2e7d32;
                }
                
                .close-notification {
                    background: none;
                    border: none;
                    cursor: pointer;
                    margin-left: auto;
                    color: #999;
                    font-size: 1rem;
                }
                
                .close-notification:hover {
                    color: #333;
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Adicionar ao DOM
        document.body.appendChild(notification);
        
        // Mostrar notificação
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Evento de fechamento
        notification.querySelector('.close-notification').addEventListener('click', function() {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        });
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }

    // Sistema de Filtro de Notícias (para futuras implementações)
    function filterNews(category) {
        const newsCards = document.querySelectorAll('.news-card');
        
        newsCards.forEach(card => {
            const cardCategory = card.querySelector('.category');
            if (category === 'all' || (cardCategory && cardCategory.textContent.toLowerCase() === category.toLowerCase())) {
                card.style.display = 'block';
                card.style.animation = 'fadeInUp 0.6s ease';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Adicionar funcionalidade de busca
    function createSearchFunction() {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Buscar notícias...';
        searchInput.className = 'search-input';
        
        // Adicionar ao header
        const headerContainer = document.querySelector('.header .container');
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.appendChild(searchInput);
        
        // Estilos para a busca
        const searchStyles = document.createElement('style');
        searchStyles.textContent = `
            .search-container {
                display: none;
            }
            
            .search-input {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 20px;
                outline: none;
                width: 250px;
                font-size: 0.9rem;
            }
            
            @media (min-width: 769px) {
                .search-container {
                    display: block;
                }
            }
        `;
        document.head.appendChild(searchStyles);
        
        headerContainer.appendChild(searchContainer);
    }

    // Inicializar busca
    createSearchFunction();

    // Lazy Loading para imagens
    const images = document.querySelectorAll('img');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.src || img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    // Scroll to top button
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    scrollTopBtn.className = 'scroll-top-btn';
    
    const scrollTopStyles = document.createElement('style');
    scrollTopStyles.textContent = `
        .scroll-top-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #1e4a73;
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .scroll-top-btn.visible {
            opacity: 1;
            visibility: visible;
        }
        
        .scroll-top-btn:hover {
            background: #ffeb3b;
            color: #1e4a73;
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(scrollTopStyles);
    document.body.appendChild(scrollTopBtn);
    
    // Mostrar/esconder botão de scroll
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });
    
    // Funcionalidade do botão scroll to top
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Animações on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar elementos para animação
    const animateElements = document.querySelectorAll('.news-card, .category-card, .team-member');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Funcionalidade para atualizar data/hora
    function updateDateTime() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        const dateString = now.toLocaleDateString('pt-BR', options);
        
        // Criar elemento de data se não existir
        let dateElement = document.querySelector('.current-date');
        if (!dateElement) {
            dateElement = document.createElement('div');
            dateElement.className = 'current-date';
            dateElement.style.cssText = `
                text-align: center;
                padding: 1rem 0;
                background: #f8f9fa;
                border-bottom: 1px solid #e0e0e0;
                color: #666;
                font-size: 0.9rem;
                text-transform: capitalize;
            `;
            
            const header = document.querySelector('.header');
            header.insertAdjacentElement('afterend', dateElement);
        }
        
        dateElement.textContent = dateString;
    }

    // Atualizar data
    updateDateTime();

    // Sistema de tema claro/escuro (para futuras implementações)
    function initThemeToggle() {
        const themeToggle = document.createElement('button');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggle.className = 'theme-toggle';
        themeToggle.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            background: #1e4a73;
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(themeToggle);
        
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            const icon = this.querySelector('i');
            
            if (document.body.classList.contains('dark-theme')) {
                icon.className = 'fas fa-sun';
                localStorage.setItem('theme', 'dark');
            } else {
                icon.className = 'fas fa-moon';
                localStorage.setItem('theme', 'light');
            }
        });
        
        // Carregar tema salvo
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.querySelector('i').className = 'fas fa-sun';
        }
    }

    // Inicializar toggle de tema
    initThemeToggle();

    // Contador de visitantes (simulado)
    function updateVisitorCount() {
        let count = localStorage.getItem('visitorCount') || 0;
        count = parseInt(count) + 1;
        localStorage.setItem('visitorCount', count);
        
        const counterElement = document.createElement('div');
        counterElement.className = 'visitor-counter';
        counterElement.innerHTML = `
            <small style="color: #888; font-size: 0.8rem;">
                <i class="fas fa-eye"></i> Visitantes: ${count.toLocaleString('pt-BR')}
            </small>
        `;
        counterElement.style.cssText = `
            text-align: center;
            padding: 0.5rem;
            background: #f8f9fa;
            border-top: 1px solid #e0e0e0;
        `;
        
        const footer = document.querySelector('.footer');
        footer.insertAdjacentElement('afterend', counterElement);
    }

    // Atualizar contador
    updateVisitorCount();

    // Funcionalidade de compartilhamento social
    function addSocialSharing() {
        const newsCards = document.querySelectorAll('.news-card');
        
        newsCards.forEach(card => {
            const shareBtn = document.createElement('button');
            shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
            shareBtn.className = 'share-btn';
            shareBtn.style.cssText = `
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: rgba(255,255,255,0.9);
                border: none;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                cursor: pointer;
                color: #1e4a73;
                transition: all 0.3s ease;
            `;
            
            const newsImage = card.querySelector('.news-image');
            if (newsImage) {
                newsImage.style.position = 'relative';
                newsImage.appendChild(shareBtn);
                
                shareBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const title = card.querySelector('h3').textContent;
                    const url = window.location.href;
                    
                    if (navigator.share) {
                        navigator.share({
                            title: title,
                            url: url
                        });
                    } else {
                        // Fallback para navegadores sem suporte
                        navigator.clipboard.writeText(`${title} - ${url}`);
                        showNotification('Link copiado para a área de transferência!', 'success');
                    }
                });
            }
        });
    }

    // Adicionar botões de compartilhamento
    addSocialSharing();

    // Funcionalidade de pesquisa (básica)
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const newsCards = document.querySelectorAll('.news-card');
            
            newsCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const content = card.querySelector('p').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || content.includes(searchTerm)) {
                    card.style.display = 'block';
                } else if (searchTerm.length > 2) {
                    card.style.display = 'none';
                } else {
                    card.style.display = 'block';
                }
            });
        });
    }

    // Analytics básico
    function trackPageView() {
        const pageData = {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        console.log('Page view tracked:', pageData);
        
        // Em uma implementação real, isso seria enviado para um serviço de analytics
        // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(pageData) });
    }

    // Rastrear visualização da página
    trackPageView();

    // Funcionalidade de modo de leitura
    function initReadingMode() {
        const readingModeBtn = document.createElement('button');
        readingModeBtn.innerHTML = '<i class="fas fa-book-open"></i>';
        readingModeBtn.className = 'reading-mode-btn';
        readingModeBtn.title = 'Modo de leitura';
        readingModeBtn.style.cssText = `
            position: fixed;
            top: 160px;
            right: 30px;
            background: #1e4a73;
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(readingModeBtn);
        
        readingModeBtn.addEventListener('click', function() {
            document.body.classList.toggle('reading-mode');
            
            if (document.body.classList.contains('reading-mode')) {
                this.innerHTML = '<i class="fas fa-eye"></i>';
                this.title = 'Modo normal';
                showNotification('Modo de leitura ativado', 'info');
            } else {
                this.innerHTML = '<i class="fas fa-book-open"></i>';
                this.title = 'Modo de leitura';
                showNotification('Modo normal ativado', 'info');
            }
        });
        
        // Estilos do modo de leitura
        const readingModeStyles = document.createElement('style');
        readingModeStyles.textContent = `
            body.reading-mode {
                background: #fafafa !important;
            }
            
            body.reading-mode .header,
            body.reading-mode .hero-banner,
            body.reading-mode .newsletter-section,
            body.reading-mode .footer {
                display: none !important;
            }
            
            body.reading-mode .featured-news {
                padding-top: 2rem !important;
            }
            
            body.reading-mode .news-card {
                max-width: 800px !important;
                margin: 0 auto 2rem !important;
            }
        `;
        document.head.appendChild(readingModeStyles);
    }

    // Inicializar modo de leitura
    initReadingMode();

    console.log('Portal Paranavaí News carregado com sucesso!');
});

// Funcões utilitárias globais
window.PortalParanavai = {
    // Função para adicionar nova notícia dinamicamente
    addNews: function(newsData) {
        const newsGrid = document.querySelector('.news-grid');
        const newsCard = document.createElement('article');
        newsCard.className = 'news-card';
        newsCard.innerHTML = `
            <div class="news-image">
                <img src="${newsData.image}" alt="${newsData.title}">
                <span class="category">${newsData.category}</span>
            </div>
            <div class="news-content">
                <h3>${newsData.title}</h3>
                <p>${newsData.content}</p>
                <div class="news-meta">
                    <span class="date"><i class="fas fa-calendar"></i> ${newsData.date}</span>
                    <span class="author"><i class="fas fa-user"></i> ${newsData.author || 'Redação'}</span>
                </div>
            </div>
        `;
        
        newsGrid.appendChild(newsCard);
        
        // Adicionar animação
        newsCard.style.opacity = '0';
        newsCard.style.transform = 'translateY(30px)';
        newsCard.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        
        setTimeout(() => {
            newsCard.style.opacity = '1';
            newsCard.style.transform = 'translateY(0)';
        }, 100);
    },
    
    // Função para mostrar notificação
    showNotification: function(message, type = 'info') {
        // Esta função já está definida acima, mas exposta globalmente
        const event = new CustomEvent('showNotification', { 
            detail: { message, type } 
        });
        document.dispatchEvent(event);
    }
};
