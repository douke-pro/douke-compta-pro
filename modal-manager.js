// =============================================================================
// DOUKÈ Compta Pro - Gestionnaire de modales v3.1
// =============================================================================

class ModalManager {
    constructor() {
        this.container = document.getElementById('modalContainer');
        this.currentModal = null;
        this.modalStack = [];
        this.escapeKeyHandler = this.handleEscapeKey.bind(this);
        
        console.log('🗂️ ModalManager initialisé');
    }

    show(title, content, options = {}) {
        // Options par défaut
        const defaultOptions = {
            size: 'medium', // small, medium, large, full
            closeOnBackdrop: true,
            closeOnEscape: true,
            showCloseButton: true,
            actions: null,
            className: '',
            persistent: false
        };
        
        const config = { ...defaultOptions, ...options };
        
        // Fermer la modale actuelle si elle existe
        if (this.currentModal && !config.persistent) {
            this.hide();
        }

        const modalId = Date.now().toString();
        
        // Créer le backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.onclick = () => {
            if (config.closeOnBackdrop) {
                this.hide();
            }
        };

        // Créer la modale
        const modal = document.createElement('div');
        modal.className = `modal bg-white dark:bg-gray-800 rounded-xl shadow-2xl ${this.getSizeClasses(config.size)} ${config.className}`;
        modal.innerHTML = `
            <div class="modal-content">
                <div class="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${this.escapeHtml(title)}</h3>
                    ${config.showCloseButton ? `
                    <button onclick="window.ModalManagerInstance.hide()" 
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                    ` : ''}
                </div>
                <div class="modal-body p-6">
                    ${content}
                </div>
                ${config.actions ? `
                <div class="flex justify-end space-x-4 p-6 pt-0 border-t border-gray-200 dark:border-gray-700">
                    ${config.actions}
                </div>
                ` : ''}
            </div>
        `;

        // Ajouter au DOM
        this.container.appendChild(backdrop);
        this.container.appendChild(modal);

        // Animation d'entrée
        setTimeout(() => {
            backdrop.classList.add('show');
            modal.classList.add('show');
        }, 10);

        // Gérer l'échappement clavier
        if (config.closeOnEscape) {
            document.addEventListener('keydown', this.escapeKeyHandler);
        }

        // Stocker la référence
        const modalData = {
            id: modalId,
            backdrop,
            modal,
            config,
            title
        };

        this.currentModal = modalData;
        this.modalStack.push(modalData);

        // Émettre un événement
        this.emitModalEvent('show', { id: modalId, title });

        // Focus management
        this.manageFocus(modal);

        return modal;
    }

    hide() {
        if (this.currentModal) {
            const { backdrop, modal, config } = this.currentModal;
            
            // Animation de sortie
            backdrop.classList.remove('show');
            modal.classList.remove('show');

            setTimeout(() => {
                if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
                if (modal.parentNode) modal.parentNode.removeChild(modal);
            }, 300);

            // Retirer l'écouteur d'échappement
            if (config.closeOnEscape) {
                document.removeEventListener('keydown', this.escapeKeyHandler);
            }

            const modalId = this.currentModal.id;
            
            // Supprimer de la pile
            this.modalStack = this.modalStack.filter(m => m.id !== modalId);
            this.currentModal = this.modalStack.length > 0 ? this.modalStack[this.modalStack.length - 1] : null;

            // Émettre un événement
            this.emitModalEvent('hide', { id: modalId });

            // Restaurer le focus
            this.restoreFocus();
        }
    }

    hideAll() {
        while (this.modalStack.length > 0) {
            this.hide();
        }
    }

    confirm(title, message, onConfirm, onCancel = null) {
        const actions = `
            <button onclick="window.ModalManagerInstance.hide(); ${onCancel ? onCancel.toString() + '()' : ''}" 
                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Annuler
            </button>
            <button onclick="window.ModalManagerInstance.hide(); (${onConfirm.toString()})()" 
                    class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                Confirmer
            </button>
        `;

        return this.show(title, `
            <div class="text-center py-4">
                <i class="fas fa-question-circle text-4xl text-warning mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">${this.escapeHtml(message)}</p>
            </div>
        `, {
            actions,
            closeOnBackdrop: false,
            size: 'small'
        });
    }

    alert(title, message, onOk = null) {
        const actions = `
            <button onclick="window.ModalManagerInstance.hide(); ${onOk ? onOk.toString() + '()' : ''}" 
                    class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                OK
            </button>
        `;

        return this.show(title, `
            <div class="text-center py-4">
                <i class="fas fa-info-circle text-4xl text-info mb-4"></i>
                <p class="text-gray-600 dark:text-gray-400 text-lg">${this.escapeHtml(message)}</p>
            </div>
        `, {
            actions,
            closeOnBackdrop: false,
            size: 'small'
        });
    }

    loading(title = 'Chargement', message = 'Veuillez patienter...') {
        return this.show(title, `
            <div class="text-center py-8">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-gray-600 dark:text-gray-400">${this.escapeHtml(message)}</p>
            </div>
        `, {
            closeOnBackdrop: false,
            closeOnEscape: false,
            showCloseButton: false,
            size: 'small'
        });
    }

    getSizeClasses(size) {
        const sizes = {
            small: 'max-w-md',
            medium: 'max-w-2xl',
            large: 'max-w-4xl',
            full: 'max-w-7xl'
        };
        return sizes[size] || sizes.medium;
    }

    handleEscapeKey(event) {
        if (event.key === 'Escape' && this.currentModal) {
            this.hide();
        }
    }

    manageFocus(modal) {
        // Sauvegarder l'élément actuellement focalisé
        this.previousActiveElement = document.activeElement;
        
        // Focuser le premier élément focalisable dans la modale
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }

        // Gérer le piégeage du focus
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.trapFocus(e, focusableElements);
            }
        });
    }

    trapFocus(event, focusableElements) {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    }

    restoreFocus() {
        if (this.previousActiveElement && this.modalStack.length === 0) {
            this.previousActiveElement.focus();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    emitModalEvent(action, data) {
        window.dispatchEvent(new CustomEvent('modal', {
            detail: { action, ...data }
        }));
    }

    // Méthodes utilitaires
    isOpen() {
        return this.currentModal !== null;
    }

    getCurrentModal() {
        return this.currentModal;
    }

    getModalStack() {
        return [...this.modalStack];
    }
}

// Instance globale
window.ModalManagerInstance = null;

// Fonction d'initialisation
function initializeModalManager() {
    if (!window.ModalManagerInstance) {
        window.ModalManagerInstance = new ModalManager();
    }
    return window.ModalManagerInstance;
}

// Export de la classe
window.ModalManager = ModalManager;

console.log('📦 Module ModalManager chargé');
