/**
 * Newsletter Form Handler
 * Portal Paranavaí News
 * 
 * Gerencia o formulário de newsletter com validações,
 * envio para API e feedback visual para o usuário
 */

class NewsletterManager {
    constructor() {
        this.form = null;
        this.submitButton = null;
        this.messageElement = null;
        this.apiEndpoint = '/api/newsletter';
        this.isSubmitting = false;
        
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupForm();
            this.setupEventListeners();
            this.setupInputMasks();
        });
    }

    setupForm() {
        this.form = document.getElementById('newsletter-form');
        this.submitButton = document.getElementById('newsletter-btn');
        this.messageElement = document.getElementById('newsletter-message');
        
        if (!this.form || !this.submitButton || !this.messageElement) {
            console.warn('Newsletter: Elementos do formulário não encontrados');
            return;
        }
        
        console.log('✅ Newsletter: Formulário inicializado');
    }

    setupEventListeners() {
        if (!this.form) return;

        // Submit do formulário
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Validação em tempo real
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });

        // Formatação do WhatsApp
        const whatsappInput = document.getElementById('whatsapp');
        if (whatsappInput) {
            whatsappInput.addEventListener('input', (e) => {
                this.formatWhatsApp(e.target);
            });
        }
    }

    setupInputMasks() {
        // Máscara para WhatsApp
        const whatsappInput = document.getElementById('whatsapp');
        if (whatsappInput) {
            whatsappInput.setAttribute('placeholder', '(44) 99999-9999');
        }
    }

    async handleSubmit() {
        if (this.isSubmitting) return;

        const formData = this.getFormData();
        
        // Validar formulário
        if (!this.validateForm(formData)) {
            return;
        }

        this.setSubmittingState(true);
        
        try {
            const response = await this.submitToAPI(formData);
            
            if (response.success) {
                this.showSuccess(response.message);
                this.resetForm();
                this.trackConversion();
            } else {
                this.showError(response.error || 'Erro ao processar cadastro');
            }
            
        } catch (error) {
            console.error('Newsletter: Erro no envio:', error);
            this.showError('Erro de conexão. Tente novamente.');
        } finally {
            this.setSubmittingState(false);
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        return {
            nome: formData.get('nome')?.trim() || '',
            email: formData.get('email')?.trim().toLowerCase() || '',
            whatsapp: formData.get('whatsapp')?.trim() || ''
        };
    }

    validateForm(data) {
        let isValid = true;
        
        // Validar nome
        if (!data.nome || data.nome.length < 2) {
            this.setFieldError('nome', 'Nome deve ter pelo menos 2 caracteres');
            isValid = false;
        }

        // Validar email
        if (!data.email || !this.isValidEmail(data.email)) {
            this.setFieldError('email', 'Digite um email válido');
            isValid = false;
        }

        // Validar WhatsApp (opcional)
        if (data.whatsapp && !this.isValidWhatsApp(data.whatsapp)) {
            this.setFieldError('whatsapp', 'WhatsApp deve conter apenas números');
            isValid = false;
        }

        return isValid;
    }

    validateField(input) {
        const value = input.value.trim();
        const fieldName = input.name;
        
        switch (fieldName) {
            case 'nome':
                if (!value || value.length < 2) {
                    this.setFieldError('nome', 'Nome deve ter pelo menos 2 caracteres');
                    return false;
                }
                break;
                
            case 'email':
                if (!value || !this.isValidEmail(value)) {
                    this.setFieldError('email', 'Digite um email válido');
                    return false;
                }
                break;
                
            case 'whatsapp':
                if (value && !this.isValidWhatsApp(value)) {
                    this.setFieldError('whatsapp', 'WhatsApp deve conter apenas números');
                    return false;
                }
                break;
        }
        
        this.clearFieldError(input);
        return true;
    }

    async submitToAPI(data) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    // Utilidades de validação
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidWhatsApp(whatsapp) {
        // Remove tudo que não é número
        const numbers = whatsapp.replace(/\D/g, '');
        // Verifica se tem entre 10 e 15 dígitos
        return numbers.length >= 10 && numbers.length <= 15;
    }

    formatWhatsApp(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value.length <= 2) {
                value = `(${value}`;
            } else if (value.length <= 7) {
                value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
            } else if (value.length <= 11) {
                value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
            } else {
                value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
            }
        }
        
        input.value = value;
    }

    // Estados visuais
    setSubmittingState(isSubmitting) {
        this.isSubmitting = isSubmitting;
        
        if (isSubmitting) {
            this.submitButton.disabled = true;
            this.submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
            this.form.classList.add('submitting');
        } else {
            this.submitButton.disabled = false;
            this.submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Cadastrar';
            this.form.classList.remove('submitting');
        }
    }

    showSuccess(message) {
        this.messageElement.className = 'form-message success';
        this.messageElement.innerHTML = `
            <div class="message-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        this.messageElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideMessage();
        }, 5000);
    }

    showError(message) {
        this.messageElement.className = 'form-message error';
        this.messageElement.innerHTML = `
            <div class="message-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
        this.messageElement.style.display = 'block';
        
        // Auto-hide after 7 seconds
        setTimeout(() => {
            this.hideMessage();
        }, 7000);
    }

    hideMessage() {
        if (this.messageElement) {
            this.messageElement.style.display = 'none';
        }
    }

    setFieldError(fieldName, message) {
        const input = document.getElementById(fieldName);
        const formGroup = input?.closest('.form-group');
        
        if (!input || !formGroup) return;
        
        // Remove error anterior
        this.clearFieldError(input);
        
        // Adiciona nova mensagem de erro
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        formGroup.classList.add('has-error');
        formGroup.appendChild(errorElement);
        
        input.focus();
    }

    clearFieldError(input) {
        const formGroup = input?.closest('.form-group');
        if (!formGroup) return;
        
        formGroup.classList.remove('has-error');
        const existingError = formGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    resetForm() {
        if (!this.form) return;
        
        this.form.reset();
        
        // Limpar erros de campo
        const formGroups = this.form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('has-error');
            const errorElement = group.querySelector('.field-error');
            if (errorElement) {
                errorElement.remove();
            }
        });
        
        this.hideMessage();
    }

    // Analytics/Tracking
    trackConversion() {
        try {
            // Google Analytics 4
            if (typeof gtag !== 'undefined') {
                gtag('event', 'newsletter_signup', {
                    event_category: 'Newsletter',
                    event_label: 'Portal Newsletter'
                });
            }
            
            // Facebook Pixel
            if (typeof fbq !== 'undefined') {
                fbq('track', 'Subscribe', {
                    content_name: 'Portal Newsletter'
                });
            }
            
            console.log('📊 Newsletter: Conversão registrada');
        } catch (error) {
            console.warn('Newsletter: Erro no tracking:', error);
        }
    }
}

// Inicializar o gerenciador de newsletter
const newsletterManager = new NewsletterManager();

// Exportar para uso global se necessário
window.NewsletterManager = NewsletterManager;
