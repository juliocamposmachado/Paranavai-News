/**
 * Sistema de Atualização Automática
 * Verifica periodicamente por notícias aprovadas
 * Portal Paranavaí News
 */

class AutoRefreshSystem {
    constructor() {
        this.intervalos = new Map();
        this.lastCheckTimes = new Map();
        this.apiUrl = '/api';
        this.intervaloVerificacao = 2 * 60 * 1000; // 2 minutos
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
        console.log('🔄 Sistema de auto-refresh inicializado');
        
        // Verificar qual página estamos
        this.detectarPagina();
        
        // Iniciar verificação periódica
        this.iniciarVerificacao();
        
        // Listener para mudanças de visibilidade da página
        this.configurarVisibilityAPI();
    }

    detectarPagina() {
        const path = window.location.pathname;
        
        if (path.includes('politica.html')) {
            this.configurarCategoria('politica');
        } else if (path.includes('saude.html')) {
            this.configurarCategoria('saude');
        } else if (path.includes('agronegocio.html')) {
            this.configurarCategoria('agronegocio');
        } else if (path.includes('turismo.html')) {
            this.configurarCategoria('turismo');
        } else if (path === '/' || path.includes('index.html') || path === '') {
            this.configurarPaginaPrincipal();
        }
    }

    configurarCategoria(categoria) {
        console.log(`📋 Configurando auto-refresh para categoria: ${categoria}`);
        this.categoria = categoria;
        this.tipo = 'categoria';
        
        // Salvar timestamp da última verificação
        const lastCheck = localStorage.getItem(`lastCheck_${categoria}`);
        this.lastCheckTimes.set(categoria, lastCheck || Date.now());
    }

    configurarPaginaPrincipal() {
        console.log('🏠 Configurando auto-refresh para página principal');
        this.tipo = 'principal';
        
        const lastCheck = localStorage.getItem('lastCheck_principal');
        this.lastCheckTimes.set('principal', lastCheck || Date.now());
    }

    iniciarVerificacao() {
        // Verificar imediatamente
        this.verificarAtualizacoes();
        
        // Configurar intervalo
        const intervalId = setInterval(() => {
            this.verificarAtualizacoes();
        }, this.intervaloVerificacao);
        
        this.intervalos.set('main', intervalId);
        
        console.log(`⏰ Verificação automática configurada: ${this.intervaloVerificacao / 1000}s`);
    }

    async verificarAtualizacoes() {
        try {
            if (this.tipo === 'categoria' && this.categoria) {
                await this.verificarNoticiasCategoria(this.categoria);
            } else if (this.tipo === 'principal') {
                await this.verificarNoticiasPrincipal();
            }
        } catch (error) {
            console.error('Erro na verificação de atualizações:', error);
        }
    }

    async verificarNoticiasCategoria(categoria) {
        try {
            const response = await fetch(`${this.apiUrl}/categoria?categoria=${categoria}`);
            const data = await response.json();
            
            if (data.success && data.noticias.length > 0) {
                const lastCheck = this.lastCheckTimes.get(categoria);
                const novasNoticias = this.verificarNoticiasNovas(data.noticias, lastCheck);
                
                if (novasNoticias.length > 0) {
                    console.log(`🆕 ${novasNoticias.length} notícias novas em ${categoria}`);
                    this.notificarNovasNoticias(novasNoticias, categoria);
                    this.atualizarPaginaCategoria(categoria, data.noticias);
                }
                
                // Atualizar timestamp
                this.lastCheckTimes.set(categoria, Date.now());
                localStorage.setItem(`lastCheck_${categoria}`, Date.now().toString());
            }
        } catch (error) {
            console.error(`Erro ao verificar categoria ${categoria}:`, error);
        }
    }

    async verificarNoticiasPrincipal() {
        try {
            const response = await fetch(`${this.apiUrl}/noticias-supabase`);
            const data = await response.json();
            
            if (data.success && data.noticias.length > 0) {
                const lastCheck = this.lastCheckTimes.get('principal');
                const novasNoticias = this.verificarNoticiasNovas(data.noticias, lastCheck);
                
                if (novasNoticias.length > 0) {
                    console.log(`🆕 ${novasNoticias.length} notícias novas na página principal`);
                    this.notificarNovasNoticias(novasNoticias, 'principal');
                    this.atualizarPaginaPrincipal(data.noticias);
                }
                
                // Atualizar timestamp
                this.lastCheckTimes.set('principal', Date.now());
                localStorage.setItem('lastCheck_principal', Date.now().toString());
            }
        } catch (error) {
            console.error('Erro ao verificar página principal:', error);
        }
    }

    verificarNoticiasNovas(noticias, lastCheckTimestamp) {
        if (!lastCheckTimestamp) return [];
        
        const lastCheck = parseInt(lastCheckTimestamp);
        const agora = Date.now();
        
        // Considerar notícias dos últimos 10 minutos como possivelmente novas
        const janelaTempo = 10 * 60 * 1000;
        
        return noticias.filter(noticia => {
            // Se a notícia tem um ID, podemos usar cache mais inteligente
            if (noticia.id) {
                const cacheKey = `noticia_vista_${noticia.id}`;
                const jaVista = localStorage.getItem(cacheKey);
                
                if (!jaVista) {
                    localStorage.setItem(cacheKey, 'true');
                    return (agora - lastCheck) < janelaTempo;
                }
                return false;
            }
            
            // Fallback: usar horário da última verificação
            return (agora - lastCheck) < janelaTempo;
        });
    }

    notificarNovasNoticias(novasNoticias, tipo) {
        // Criar notificação discreta
        const notificationDiv = document.createElement('div');
        notificationDiv.className = 'auto-refresh-notification';
        notificationDiv.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-newspaper"></i>
                <span>${novasNoticias.length} nova(s) notícia(s) ${tipo !== 'principal' ? `em ${this.getCategoriaTexto(tipo)}` : 'disponível(eis)'}</span>
                <button class="refresh-now-btn" onclick="autoRefresh.atualizarAgora()">
                    <i class="fas fa-sync"></i> Atualizar
                </button>
                <button class="close-notification" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Adicionar estilos se não existirem
        if (!document.querySelector('#auto-refresh-styles')) {
            const styles = document.createElement('style');
            styles.id = 'auto-refresh-styles';
            styles.textContent = `
                .auto-refresh-notification {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                    max-width: 350px;
                }
                
                .auto-refresh-notification .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                }
                
                .auto-refresh-notification .refresh-now-btn,
                .auto-refresh-notification .close-notification {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 0.4rem 0.8rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    margin-left: 0.5rem;
                    transition: background 0.2s ease;
                }
                
                .auto-refresh-notification .refresh-now-btn:hover,
                .auto-refresh-notification .close-notification:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @media (max-width: 768px) {
                    .auto-refresh-notification {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Remover notificações anteriores
        const existing = document.querySelectorAll('.auto-refresh-notification');
        existing.forEach(el => el.remove());
        
        // Adicionar nova notificação
        document.body.appendChild(notificationDiv);
        
        // Auto-remover após 15 segundos
        setTimeout(() => {
            if (document.body.contains(notificationDiv)) {
                notificationDiv.remove();
            }
        }, 15000);
    }

    atualizarPaginaCategoria(categoria, noticias) {
        // Atualizar o sistema de categoria se existir
        if (window.categoriaNoticias) {
            // Limpar cache para forçar atualização
            localStorage.removeItem(`noticias_${categoria}`);
            
            // Atualizar visualmente (sem recarregar a página)
            setTimeout(() => {
                window.categoriaNoticias.forcarAtualizacao();
            }, 1000);
        }
    }

    atualizarPaginaPrincipal(noticias) {
        // Atualizar o sistema principal se existir
        if (window.noticiasSupabase) {
            // Limpar cache para forçar atualização
            localStorage.removeItem('noticias_principais');
            
            // Atualizar visualmente
            setTimeout(() => {
                window.noticiasSupabase.forcarAtualizacao();
            }, 1000);
        }
    }

    atualizarAgora() {
        console.log('🔄 Atualizando manualmente...');
        
        // Remover notificações
        document.querySelectorAll('.auto-refresh-notification').forEach(el => el.remove());
        
        // Forçar atualização imediata
        if (this.tipo === 'categoria' && window.categoriaNoticias) {
            window.categoriaNoticias.forcarAtualizacao();
        } else if (this.tipo === 'principal' && window.noticiasSupabase) {
            window.noticiasSupabase.forcarAtualizacao();
        }
    }

    configurarVisibilityAPI() {
        // Pausar/retomar verificações quando a página não está visível
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('⏸️ Página oculta - pausando verificações');
                this.pausarVerificacoes();
            } else {
                console.log('▶️ Página visível - retomando verificações');
                this.retomarVerificacoes();
            }
        });
    }

    pausarVerificacoes() {
        this.intervalos.forEach((intervalId, key) => {
            clearInterval(intervalId);
        });
        this.intervalos.clear();
    }

    retomarVerificacoes() {
        // Verificar imediatamente ao voltar
        this.verificarAtualizacoes();
        
        // Reiniciar intervalo
        this.iniciarVerificacao();
    }

    getCategoriaTexto(categoria) {
        const categorias = {
            'politica': 'Política',
            'saude': 'Saúde', 
            'agronegocio': 'Agronegócio',
            'turismo': 'Turismo',
            'principal': 'Página Principal'
        };
        return categorias[categoria] || categoria;
    }

    // Método para parar completamente o auto-refresh
    parar() {
        this.pausarVerificacoes();
        console.log('⏹️ Auto-refresh parado');
    }
}

// Inicializar automaticamente
document.addEventListener('DOMContentLoaded', function() {
    if (window.autoRefresh) return; // Evitar múltiplas inicializações
    
    window.autoRefresh = new AutoRefreshSystem();
});

// Função global para controle manual
window.controlarAutoRefresh = {
    parar: () => window.autoRefresh?.parar(),
    atualizarAgora: () => window.autoRefresh?.atualizarAgora()
};

console.log('✅ Sistema de Auto-Refresh carregado com sucesso!');
