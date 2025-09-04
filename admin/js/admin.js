/**
 * Dashboard Administrativa - JavaScript
 * Portal Paranavaí News
 */

class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'pending';
        this.pendingItems = [];
        this.approvedItems = [];
        this.rejectedItems = [];
        this.selectedItem = null;
        this.contactsData = [];
        this.analysisData = {};
        this.selectedContact = null;
        
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.loadInitialData();
        
        // Auto-refresh a cada 30 segundos
        setInterval(() => {
            if (this.currentUser && this.currentSection === 'pending') {
                this.loadPendingContent();
            }
        }, 30000);
    }

    // ===== AUTENTICAÇÃO =====
    checkAuth() {
        const savedUser = sessionStorage.getItem('admin_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    bindEvents() {
        // Login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Navigation
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchSection(e.target.dataset.section || e.target.closest('.nav-btn').dataset.section));
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshCurrentSection());
        }

        // Modal events
        const modal = document.getElementById('previewModal');
        const modalCloses = document.querySelectorAll('.modal-close');
        modalCloses.forEach(close => {
            close.addEventListener('click', () => this.closeModal());
        });

        // Click outside modal to close
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }

        // Modal action buttons
        const approveBtn = document.getElementById('approveBtn');
        const rejectBtn = document.getElementById('rejectBtn');
        
        if (approveBtn) {
            approveBtn.addEventListener('click', () => this.approveItem());
        }
        
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => this.rejectItem());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        // Validação das credenciais
        if (username === 'Matheus' && password === 'Admin78451200') {
            const user = {
                username: username,
                loginTime: new Date().toISOString(),
                permissions: ['read', 'approve', 'reject']
            };
            
            sessionStorage.setItem('admin_user', JSON.stringify(user));
            this.currentUser = user;
            
            this.showToast('Login realizado com sucesso!', 'success');
            this.showDashboard();
        } else {
            errorDiv.style.display = 'block';
            this.showToast('Credenciais inválidas!', 'error');
            
            // Limpar erro após 3 segundos
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    }

    handleLogout() {
        sessionStorage.removeItem('admin_user');
        this.currentUser = null;
        this.showLogin();
        this.showToast('Logout realizado com sucesso!', 'success');
    }

    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('dashboardScreen').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboardScreen').style.display = 'block';
        this.loadDashboardData();
    }

    // ===== NAVEGAÇÃO =====
    switchSection(section) {
        this.currentSection = section;
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Update content sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
            sec.style.display = 'none';
        });
        
        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
        }
        
        // Load section data
        this.loadSectionData(section);
    }

    async loadSectionData(section) {
        this.showLoading(true);
        
        switch (section) {
            case 'pending':
                await this.loadPendingContent();
                break;
            case 'approved':
                await this.loadApprovedContent();
                break;
            case 'rejected':
                await this.loadRejectedContent();
                break;
            case 'contacts':
                await this.loadContacts();
                break;
            case 'analysis':
                await this.loadAnalysis();
                break;
            case 'stats':
                await this.loadStatistics();
                break;
        }
        
        this.showLoading(false);
    }

    // ===== CARREGAMENTO DE DADOS =====
    async loadInitialData() {
        if (!this.currentUser) return;
        
        await this.loadDashboardData();
    }

    async loadDashboardData() {
        await Promise.all([
            this.loadPendingContent(),
            this.loadApprovedContent(),
            this.loadRejectedContent(),
            this.updateCounts()
        ]);
    }

    async loadPendingContent() {
        try {
            // Simular carregamento de conteúdo pendente
            // Em produção, isso seria uma chamada para a API
            const response = await this.fetchWithFallback('/api/admin-handler/pending');
            
            if (response && response.items) {
                this.pendingItems = response.items;
            } else {
                // Dados de exemplo para demonstração
                this.pendingItems = await this.getExamplePendingContent();
            }
            
            this.renderPendingContent();
            this.updateCounts();
            
        } catch (error) {
            console.error('Erro ao carregar conteúdo pendente:', error);
            this.pendingItems = await this.getExamplePendingContent();
            this.renderPendingContent();
        }
    }

    async loadApprovedContent() {
        try {
        const response = await this.fetchWithFallback('/api/admin-handler/approved');
            
            if (response && response.items) {
                this.approvedItems = response.items;
            } else {
                this.approvedItems = this.getExampleApprovedContent();
            }
            
            this.renderApprovedContent();
            
        } catch (error) {
            console.error('Erro ao carregar conteúdo aprovado:', error);
            this.approvedItems = this.getExampleApprovedContent();
            this.renderApprovedContent();
        }
    }

    async loadRejectedContent() {
        try {
            const response = await this.fetchWithFallback('/api/admin-handler/rejected');
            
            if (response && response.items) {
                this.rejectedItems = response.items;
            } else {
                this.rejectedItems = this.getExampleRejectedContent();
            }
            
            this.renderRejectedContent();
            
        } catch (error) {
            console.error('Erro ao carregar conteúdo rejeitado:', error);
            this.rejectedItems = this.getExampleRejectedContent();
            this.renderRejectedContent();
        }
    }

    // ===== RENDERIZAÇÃO =====
    renderPendingContent() {
        const container = document.getElementById('pendingContent');
        if (!container) return;

        if (this.pendingItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>Nenhum conteúdo pendente</h3>
                    <p>Todos os itens foram processados!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.pendingItems.map(item => `
            <div class="content-item" data-id="${item.id}">
                <div class="content-status status-pending">Pendente</div>
                <h3 class="content-title">${item.titulo}</h3>
                <p class="content-excerpt">${item.resumo}</p>
                <div class="content-meta">
                    <span class="content-source">${item.fonte}</span>
                    <span class="content-date">${this.formatDate(item.data)}</span>
                </div>
                <div class="content-actions">
                    <button class="btn btn-primary" onclick="admin.previewItem('${item.id}')">
                        <i class="fas fa-eye"></i>
                        Visualizar
                    </button>
                    <button class="btn btn-approve" onclick="admin.quickApprove('${item.id}')">
                        <i class="fas fa-check"></i>
                        Aprovar
                    </button>
                    <button class="btn btn-reject" onclick="admin.quickReject('${item.id}')">
                        <i class="fas fa-times"></i>
                        Rejeitar
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderApprovedContent() {
        const container = document.getElementById('approvedContent');
        if (!container) return;

        container.innerHTML = this.approvedItems.map(item => `
            <div class="content-item" data-id="${item.id}">
                <div class="content-status status-approved">Aprovado</div>
                <h3 class="content-title">${item.titulo}</h3>
                <p class="content-excerpt">${item.resumo}</p>
                <div class="content-meta">
                    <span class="content-source">${item.fonte}</span>
                    <span class="content-date">${this.formatDate(item.dataAprovacao)}</span>
                </div>
                <div class="content-actions">
                    <button class="btn btn-primary" onclick="admin.previewItem('${item.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalhes
                    </button>
                    <button class="btn btn-secondary" onclick="admin.unpublishItem('${item.id}')">
                        <i class="fas fa-undo"></i>
                        Despublicar
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderRejectedContent() {
        const container = document.getElementById('rejectedContent');
        if (!container) return;

        container.innerHTML = this.rejectedItems.map(item => `
            <div class="content-item" data-id="${item.id}">
                <div class="content-status status-rejected">Rejeitado</div>
                <h3 class="content-title">${item.titulo}</h3>
                <p class="content-excerpt">${item.resumo}</p>
                <div class="content-meta">
                    <span class="content-source">${item.fonte}</span>
                    <span class="content-date">${this.formatDate(item.dataRejeicao)}</span>
                </div>
                <div class="content-actions">
                    <button class="btn btn-primary" onclick="admin.previewItem('${item.id}')">
                        <i class="fas fa-eye"></i>
                        Ver Detalhes
                    </button>
                    <button class="btn btn-approve" onclick="admin.reconsiderItem('${item.id}')">
                        <i class="fas fa-redo"></i>
                        Reconsiderar
                    </button>
                </div>
            </div>
        `).join('');
    }

    // ===== AÇÕES DE CONTEÚDO =====
    async quickApprove(itemId) {
        const item = this.findItemById(itemId);
        if (!item) return;

        const confirmed = confirm(`Aprovar "${item.titulo}"?`);
        if (!confirmed) return;

        await this.approveItemById(itemId);
    }

    async quickReject(itemId) {
        const item = this.findItemById(itemId);
        if (!item) return;

        const reason = prompt(`Motivo da rejeição de "${item.titulo}":`);
        if (reason === null) return;

        await this.rejectItemById(itemId, reason);
    }

    previewItem(itemId) {
        const item = this.findItemById(itemId);
        if (!item) return;

        this.selectedItem = item;
        this.showPreviewModal(item);
    }

    showPreviewModal(item) {
        const modal = document.getElementById('previewModal');
        const content = document.getElementById('previewContent');
        
        content.innerHTML = `
            <div class="preview-item">
                <div class="preview-header">
                    <h2>${item.titulo}</h2>
                    <div class="preview-meta">
                        <span class="source">${item.fonte}</span>
                        <span class="date">${this.formatDate(item.data)}</span>
                    </div>
                </div>
                <div class="preview-image">
                    <img src="${item.imagem}" alt="${item.titulo}" style="max-width: 100%; height: auto; border-radius: 8px;">
                </div>
                <div class="preview-content">
                    <p class="lead">${item.resumo}</p>
                    <div class="preview-link">
                        <strong>Link original:</strong> 
                        <a href="${item.link}" target="_blank">${item.link}</a>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
    }

    closeModal() {
        document.getElementById('previewModal').style.display = 'none';
        this.selectedItem = null;
    }

    async approveItem() {
        if (!this.selectedItem) return;
        
        await this.approveItemById(this.selectedItem.id);
        this.closeModal();
    }

    async rejectItem() {
        if (!this.selectedItem) return;
        
        const reason = prompt('Motivo da rejeição (opcional):');
        if (reason === null) return;
        
        await this.rejectItemById(this.selectedItem.id, reason);
        this.closeModal();
    }

    async approveItemById(itemId) {
        try {
            this.showLoading(true);
            
            // Simular aprovação (em produção seria uma chamada à API)
            const response = await this.simulateApiCall('/api/admin-handler/approve/' + itemId, { itemId });
            
            if (response.success) {
                // Mover item de pendente para aprovado
                const itemIndex = this.pendingItems.findIndex(item => item.id === itemId);
                if (itemIndex !== -1) {
                    const item = this.pendingItems.splice(itemIndex, 1)[0];
                    item.status = 'approved';
                    item.dataAprovacao = new Date().toISOString();
                    this.approvedItems.unshift(item);
                }
                
                this.showToast('Item aprovado com sucesso!', 'success');
                this.refreshCurrentSection();
            }
            
        } catch (error) {
            console.error('Erro ao aprovar item:', error);
            this.showToast('Erro ao aprovar item', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async rejectItemById(itemId, reason = '') {
        try {
            this.showLoading(true);
            
            const response = await this.simulateApiCall('/api/admin-handler/reject/' + itemId, { itemId, reason });
            
            if (response.success) {
                // Mover item de pendente para rejeitado
                const itemIndex = this.pendingItems.findIndex(item => item.id === itemId);
                if (itemIndex !== -1) {
                    const item = this.pendingItems.splice(itemIndex, 1)[0];
                    item.status = 'rejected';
                    item.dataRejeicao = new Date().toISOString();
                    item.motivoRejeicao = reason;
                    this.rejectedItems.unshift(item);
                }
                
                this.showToast('Item rejeitado com sucesso!', 'success');
                this.refreshCurrentSection();
            }
            
        } catch (error) {
            console.error('Erro ao rejeitar item:', error);
            this.showToast('Erro ao rejeitar item', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // ===== ESTATÍSTICAS =====
    async loadStatistics() {
        const totalNews = this.pendingItems.length + this.approvedItems.length + this.rejectedItems.length;
        const totalApproved = this.approvedItems.length;
        const totalRejected = this.rejectedItems.length;
        const approvalRate = totalNews > 0 ? Math.round((totalApproved / totalNews) * 100) : 0;

        document.getElementById('totalNews').textContent = totalNews;
        document.getElementById('totalApproved').textContent = totalApproved;
        document.getElementById('totalRejected').textContent = totalRejected;
        document.getElementById('approvalRate').textContent = `${approvalRate}%`;
    }

    // ===== UTILITÁRIOS =====
    updateCounts() {
        document.getElementById('pendingCount').textContent = this.pendingItems.length;
        document.getElementById('approvedCount').textContent = this.approvedItems.length;
        document.getElementById('rejectedCount').textContent = this.rejectedItems.length;
    }

    refreshCurrentSection() {
        this.loadSectionData(this.currentSection);
    }

    findItemById(id) {
        return [...this.pendingItems, ...this.approvedItems, ...this.rejectedItems]
            .find(item => item.id === id);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'check' : type === 'error' ? 'times' : 'info';
        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // ===== API HELPERS =====
    async fetchWithFallback(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('API não disponível, usando dados de exemplo');
        }
        return null;
    }

    async simulateApiCall(endpoint, data) {
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, data };
    }

    // ===== DADOS DE EXEMPLO =====
    async getExamplePendingContent() {
        return [
            {
                id: 'pending_1',
                titulo: 'Nova investimento em infraestrutura para Paranavaí',
                resumo: 'Governo anuncia recursos para melhorias na infraestrutura urbana da cidade, incluindo pavimentação e saneamento básico.',
                fonte: 'Bem Paraná',
                link: 'https://www.bemparana.com.br/noticia/exemplo1',
                imagem: 'https://via.placeholder.com/400x300/1e4a73/ffffff?text=Infraestrutura',
                data: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                status: 'pending'
            },
            {
                id: 'pending_2',
                titulo: 'Deputado Leônidas apresenta projeto para o agronegócio',
                resumo: 'Novo projeto de lei visa beneficiar pequenos produtores rurais da região com linhas de crédito especiais.',
                fonte: 'Portal Regional',
                link: 'https://www.exemplo.com/noticia2',
                imagem: 'https://via.placeholder.com/400x300/2e7d32/ffffff?text=Agronegócio',
                data: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                status: 'pending'
            },
            {
                id: 'pending_3',
                titulo: 'Campanha de vacinação ampliada na região',
                resumo: 'Secretaria de Saúde anuncia ampliação dos pontos de vacinação contra gripe e COVID-19 em Paranavaí.',
                fonte: 'Saúde Paraná',
                link: 'https://www.exemplo.com/noticia3',
                imagem: 'https://via.placeholder.com/400x300/d32f2f/ffffff?text=Saúde',
                data: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                status: 'pending'
            }
        ];
    }

    getExampleApprovedContent() {
        return [
            {
                id: 'approved_1',
                titulo: 'Festival de Turismo Rural movimenta economia local',
                resumo: 'Evento atrai milhares de visitantes e impulsiona setor turístico da região.',
                fonte: 'Turismo PR',
                link: 'https://www.exemplo.com/aprovada1',
                imagem: 'https://via.placeholder.com/400x300/ff9800/ffffff?text=Turismo',
                data: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                dataAprovacao: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                status: 'approved'
            }
        ];
    }

    getExampleRejectedContent() {
        return [
            {
                id: 'rejected_1',
                titulo: 'Notícia sem fonte verificada',
                resumo: 'Conteúdo que não passou na verificação de autenticidade.',
                fonte: 'Fonte Duvidosa',
                link: 'https://www.exemplo.com/rejeitada1',
                imagem: 'https://via.placeholder.com/400x300/666/ffffff?text=Rejeitado',
                data: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
                dataRejeicao: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                motivoRejeicao: 'Fonte não confiável',
                status: 'rejected'
            }
        ];
    }
}

// Inicializar dashboard quando a página carregar
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new AdminDashboard();
});

    // ===== SEÇÃO DE CONTATOS =====
    async loadContacts() {
        try {
            const response = await this.fetchWithFallback('/api/contacts?action=list');
            
            if (response && response.success) {
                this.contactsData = response.data;
            } else {
                this.contactsData = this.getExampleContacts();
            }
            
            this.renderContacts();
            this.bindContactsEvents();
            this.updateContactsCount();
            
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
            this.contactsData = this.getExampleContacts();
            this.renderContacts();
        }
    }

    bindContactsEvents() {
        // Sync contacts button
        const syncBtn = document.getElementById('syncContactsBtn');
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncContacts());
        }

        // Add contact button
        const addBtn = document.getElementById('addContactBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showContactModal());
        }

        // Search and filters
        const searchInput = document.getElementById('contactSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterContacts(e.target.value));
        }

        const cityFilter = document.getElementById('cityFilter');
        if (cityFilter) {
            cityFilter.addEventListener('change', () => this.applyContactsFilters());
        }

        const positionFilter = document.getElementById('positionFilter');
        if (positionFilter) {
            positionFilter.addEventListener('change', () => this.applyContactsFilters());
        }

        // Modal events
        const contactModal = document.getElementById('contactModal');
        const contactModalCloses = contactModal?.querySelectorAll('.modal-close');
        contactModalCloses?.forEach(close => {
            close.addEventListener('click', () => this.closeContactModal());
        });

        // Save contact button
        const saveBtn = document.getElementById('saveContactBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveContact());
        }
    }

    renderContacts(contactsToRender = null) {
        const container = document.getElementById('contactsGrid');
        if (!container) return;

        const contacts = contactsToRender || this.contactsData;

        if (contacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-address-book" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>Nenhum contato encontrado</h3>
                    <p>Use os filtros para refinar sua busca ou adicione novos contatos.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = contacts.map(contact => `
            <div class="contact-card" data-id="${contact.id}" onclick="admin.viewContact('${contact.id}')">
                <div class="contact-header">
                    <div class="contact-avatar">
                        ${contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="contact-info">
                        <h3>${contact.name}</h3>
                        <p>${this.getPositionLabel(contact.position)} - ${contact.city}</p>
                    </div>
                    ${contact.party ? `<div class="contact-badge">${contact.party}</div>` : ''}
                </div>
                <div class="contact-details">
                    ${contact.phone ? `
                        <div class="contact-detail">
                            <i class="fas fa-phone"></i>
                            <span>${contact.phone}</span>
                        </div>
                    ` : ''}
                    ${contact.email ? `
                        <div class="contact-detail">
                            <i class="fas fa-envelope"></i>
                            <span>${contact.email}</span>
                        </div>
                    ` : ''}
                    ${contact.office ? `
                        <div class="contact-detail">
                            <i class="fas fa-building"></i>
                            <span>${contact.office}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="contact-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); admin.editContact('${contact.id}')">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); admin.callContact('${contact.phone}')">
                        <i class="fas fa-phone"></i>
                        Ligar
                    </button>
                </div>
            </div>
        `).join('');
    }

    async syncContacts() {
        try {
            this.showLoading(true);
            const response = await this.fetchWithFallback('/api/contacts?action=sync');
            
            if (response && response.success) {
                this.showToast(response.message, 'success');
                await this.loadContacts();
            } else {
                this.showToast('Sincronização simulada com sucesso!', 'success');
                // Simular adição de novos contatos
                this.contactsData.push(...this.getNewContactsExample());
                this.renderContacts();
            }
        } catch (error) {
            this.showToast('Erro na sincronização', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // ===== SEÇÃO DE ANÁLISE =====
    async loadAnalysis() {
        try {
            this.bindAnalysisEvents();
            await Promise.all([
                this.loadAnalysisReports(),
                this.loadDataSources(),
                this.loadPowerBIStatus()
            ]);
        } catch (error) {
            console.error('Erro ao carregar análise:', error);
        }
    }

    bindAnalysisEvents() {
        // Tab navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchAnalysisTab(e.target.dataset.tab));
        });

        // Refresh analysis button
        const refreshBtn = document.getElementById('refreshAnalysisBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAnalysisData());
        }

        // Export data button
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAnalysisData());
        }
    }

    switchAnalysisTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        const targetTab = document.getElementById(`${tabName}Tab`);
        if (targetTab) {
            targetTab.classList.add('active');
            targetTab.style.display = 'block';
        }

        // Load tab-specific data
        this.loadAnalysisTabData(tabName);
    }

    async loadAnalysisTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                await this.loadPowerBIEmbed();
                break;
            case 'reports':
                await this.loadAnalysisReports();
                break;
            case 'data-sources':
                await this.loadDataSources();
                break;
        }
    }

    async loadPowerBIEmbed() {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.getElementById('powerbiStatus');
        
        // Simular conexão com PowerBI
        setTimeout(() => {
            if (statusIndicator && statusText) {
                statusIndicator.classList.add('connected');
                statusText.textContent = 'Conectado ao PowerBI';
            }
        }, 2000);
    }

    async loadAnalysisReports() {
        try {
            const response = await this.fetchWithFallback('/api/analysis?action=reports');
            
            let reports;
            if (response && response.success) {
                reports = response.data;
            } else {
                reports = this.getExampleReports();
            }

            this.renderAnalysisReports(reports);
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
        }
    }

    renderAnalysisReports(reports) {
        const container = document.querySelector('.reports-grid');
        if (!container) return;

        container.innerHTML = reports.map(report => `
            <div class="report-card" onclick="admin.openReport('${report.id}')">
                <div class="report-header">
                    <h4>${report.name}</h4>
                    <span class="report-status status-${report.status}">${report.status}</span>
                </div>
                <p class="report-description">${report.description}</p>
                <div class="report-metrics">
                    ${Object.entries(report.metrics || {}).slice(0, 2).map(([key, value]) => `
                        <div class="metric">
                            <strong>${value}</strong>
                            <span>${this.getMetricLabel(key)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="report-footer">
                    <small>Atualizado: ${this.formatDate(report.lastUpdate)}</small>
                </div>
            </div>
        `).join('');
    }

    async loadDataSources() {
        try {
            const response = await this.fetchWithFallback('/api/analysis?action=data-sources');
            
            let dataSources;
            if (response && response.success) {
                dataSources = response.data;
            } else {
                dataSources = this.getExampleDataSources();
            }

            this.renderDataSources(dataSources);
        } catch (error) {
            console.error('Erro ao carregar fontes de dados:', error);
        }
    }

    renderDataSources(dataSources) {
        const container = document.querySelector('.data-sources-list');
        if (!container) return;

        container.innerHTML = dataSources.map(source => `
            <div class="data-source-item">
                <div class="data-source-info">
                    <div class="data-source-icon">
                        <i class="${source.icon}"></i>
                    </div>
                    <div class="data-source-details">
                        <h4>${source.name}</h4>
                        <p>${source.description}</p>
                    </div>
                </div>
                <div class="data-source-status">
                    <span class="status-indicator ${source.status}"></span>
                    <div class="status-info">
                        <strong>${this.getStatusLabel(source.status)}</strong>
                        <small>Último sync: ${this.formatDate(source.lastSync)}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ===== UTILITÁRIOS PARA CONTATOS =====
    getPositionLabel(position) {
        const labels = {
            'prefeito': 'Prefeito',
            'deputado': 'Deputado Estadual',
            'senador': 'Senador',
            'vereador': 'Vereador',
            'secretario': 'Secretário',
            'assessor': 'Assessor'
        };
        return labels[position] || position;
    }

    getMetricLabel(key) {
        const labels = {
            'totalViews': 'Visualizações',
            'avgEngagement': 'Engajamento',
            'uniqueVisitors': 'Visitantes',
            'pageViews': 'Páginas Vistas'
        };
        return labels[key] || key;
    }

    getStatusLabel(status) {
        const labels = {
            'connected': 'Conectado',
            'warning': 'Atenção',
            'error': 'Erro',
            'active': 'Ativo'
        };
        return labels[status] || status;
    }

    updateContactsCount() {
        const countElement = document.getElementById('contactsCount');
        if (countElement) {
            countElement.textContent = this.contactsData.length;
        }
    }

    applyContactsFilters() {
        const search = document.getElementById('contactSearch')?.value?.toLowerCase() || '';
        const cityFilter = document.getElementById('cityFilter')?.value || 'all';
        const positionFilter = document.getElementById('positionFilter')?.value || 'all';

        let filteredContacts = this.contactsData;

        if (search) {
            filteredContacts = filteredContacts.filter(contact => 
                contact.name.toLowerCase().includes(search) ||
                contact.city.toLowerCase().includes(search) ||
                contact.position.toLowerCase().includes(search)
            );
        }

        if (cityFilter !== 'all') {
            filteredContacts = filteredContacts.filter(contact => 
                contact.city.toLowerCase() === cityFilter.toLowerCase()
            );
        }

        if (positionFilter !== 'all') {
            filteredContacts = filteredContacts.filter(contact => 
                contact.position === positionFilter
            );
        }

        this.renderContacts(filteredContacts);
    }

    // ===== DADOS DE EXEMPLO =====
    getExampleContacts() {
        return [
            {
                id: 'dr-leonidas',
                name: 'Dr. Leônidas',
                position: 'prefeito',
                party: '',
                city: 'Paranavaí',
                phone: '(44) 3482-8600',
                mobile: '',
                email: 'gabinete@paranavai.pr.gov.br',
                office: 'Av. Getúlio Vargas, 102 - Centro',
                notes: 'Prefeito de Paranavaí',
                verified: true
            },
            {
                id: 'rafael-greca',
                name: 'Rafael Greca',
                position: 'prefeito',
                party: 'PMN',
                city: 'Curitiba',
                phone: '(41) 3350-8000',
                email: 'gabinete@curitiba.pr.gov.br',
                office: 'Av. Cândido de Abreu, 817 - Centro Cívico',
                verified: true
            },
            {
                id: 'flavio-arns',
                name: 'Flávio Arns',
                position: 'senador',
                party: 'PODEMOS',
                city: 'Curitiba',
                phone: '(41) 3330-1500',
                email: 'sen.flavioarns@senado.leg.br',
                office: 'Senado Federal - Brasília',
                verified: true
            }
        ];
    }

    getExampleReports() {
        return [
            {
                id: 'news-analytics',
                name: 'Análise de Notícias',
                description: 'Métricas de performance das notícias do portal',
                status: 'active',
                lastUpdate: new Date().toISOString(),
                metrics: { totalViews: 15420, avgEngagement: 78.5 }
            },
            {
                id: 'traffic-report',
                name: 'Relatório de Tráfego',
                description: 'Análise de visitantes e comportamento',
                status: 'active',
                lastUpdate: new Date().toISOString(),
                metrics: { uniqueVisitors: 8930, pageViews: 23450 }
            }
        ];
    }

    getExampleDataSources() {
        return [
            {
                id: 'google-analytics',
                name: 'Google Analytics',
                description: 'Dados de tráfego e comportamento do website',
                icon: 'fas fa-chart-line',
                status: 'connected',
                lastSync: new Date().toISOString()
            },
            {
                id: 'social-media',
                name: 'Redes Sociais',
                description: 'APIs do Facebook, Instagram e Twitter',
                icon: 'fas fa-share-alt',
                status: 'connected',
                lastSync: new Date().toISOString()
            }
        ];
    }
}

// Inicializar dashboard quando a página carregar
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new AdminDashboard();
});

// Tornar algumas funções globais para uso inline
window.admin = {
    previewItem: (id) => admin.previewItem(id),
    quickApprove: (id) => admin.quickApprove(id),
    quickReject: (id) => admin.quickReject(id),
    unpublishItem: (id) => admin.unpublishItem(id),
    reconsiderItem: (id) => admin.reconsiderItem(id),
    viewContact: (id) => admin.viewContact && admin.viewContact(id),
    editContact: (id) => admin.editContact && admin.editContact(id),
    callContact: (phone) => admin.callContact && admin.callContact(phone),
    openReport: (id) => admin.openReport && admin.openReport(id)
};
