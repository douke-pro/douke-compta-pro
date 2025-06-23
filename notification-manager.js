// =============================================================================
// DOUKÈ Compta Pro - Gestionnaire de notifications v3.1
// =============================================================================

class NotificationManager {
    constructor() {
        this.container = document.getElementById('notificationsContainer');
        this.notifications = new Map();
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        
        console.log('📢 NotificationManager initialisé');
    }

    show(type, title, message, duration = null) {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const notificationDuration = duration !== null ? duration : this.defaultDuration;
        
        // Limiter le nombre de notifications
        if (this.notifications.size >= this.maxNotifications) {
            const oldestNotification = this.notifications.keys().next().value;
            this.hide(oldestNotification);
        }
        
        const notification = document.createElement('div');
        notification.className = `notification bg-white dark:bg-gray-800 border-l-4 rounded-lg shadow-lg p-4 mb-4 ${this.getTypeClasses(type)}`;
        notification.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="${this.getTypeIcon(type)} text-lg"></i>
                </div>
                <div class="ml-3 flex-1">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">${this.escapeHtml(title)}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${this.escapeHtml(message)}</p>
                    <div class="mt-2 text-xs text-gray-500">
                        ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <button onclick="window.NotificationManagerInstance.hide('${id}')" 
                        class="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            ${notificationDuration > 0 ? `
            <div class="mt-2">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div class="bg-current h-1 rounded-full transition-all duration-${notificationDuration} ease-linear" 
                         style="width: 100%;" id="progress-${id}"></div>
                </div>
            </div>
            ` : ''}
        `;

        this.container.appendChild(notification);
        this.notifications.set(id, {
            element: notification,
            type: type,
            timestamp: Date.now()
        });

        // Animation d'entrée
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Démarrer la barre de progression
        if (notificationDuration > 0) {
            setTimeout(() => {
                const progressBar = document.getElementById(`progress-${id}`);
                if (progressBar) {
                    progressBar.style.width = '0%';
                }
            }, 100);
        }

        // Auto-hide
        if (notificationDuration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, notificationDuration);
        }

        // Émettre un événement
        this.emitNotificationEvent('show', { id, type, title, message });

        return id;
    }

    hide(id) {
        const notificationData = this.notifications.get(id);
        if (notificationData) {
            const notification = notificationData.element;
            notification.classList.remove('show');
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications.delete(id);
                this.emitNotificationEvent('hide', { id });
            }, 300);
        }
    }

    hideAll() {
        for (const [id] of this.notifications) {
            this.hide(id);
        }
    }

    getTypeClasses(type) {
        const classes = {
            success: 'border-success text-success',
            error: 'border-danger text-danger',
            warning: 'border-warning text-warning',
            info: 'border-info text-info'
        };
        return classes[type] || classes.info;
    }

    getTypeIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    emitNotificationEvent(action, data) {
        window.dispatchEvent(new CustomEvent('notification', {
            detail: { action, ...data }
        }));
    }

    // Méthodes de convenance
    success(title, message, duration) {
        return this.show('success', title, message, duration);
    }

    error(title, message, duration) {
        return this.show('error', title, message, duration);
    }

    warning(title, message, duration) {
        return this.show('warning', title, message, duration);
    }

    info(title, message, duration) {
        return this.show('info', title, message, duration);
    }

    // Notifications persistantes (ne disparaissent pas automatiquement)
    persistent(type, title, message) {
        return this.show(type, title, message, 0);
    }

    // Notification avec action
    withAction(type, title, message, actionText, actionCallback) {
        const id = this.show(type, title, message, 0);
        const notification = this.notifications.get(id);
        
        if (notification) {
            const actionButton = document.createElement('button');
            actionButton.className = 'mt-2 text-xs bg-current text-white px-2 py-1 rounded hover:opacity-80 transition-opacity';
            actionButton.textContent = actionText;
            actionButton.onclick = () => {
                actionCallback();
                this.hide(id);
            };
            
            notification.element.querySelector('.ml-3').appendChild(actionButton);
        }
        
        return id;
    }

    // Obtenir les statistiques
    getStats() {
        const stats = { success: 0, error: 0, warning: 0, info: 0 };
        
        for (const [, data] of this.notifications) {
            stats[data.type] = (stats[data.type] || 0) + 1;
        }
        
        return {
            total: this.notifications.size,
            byType: stats,
            maxAllowed: this.maxNotifications
        };
    }
}

// Instance globale
window.NotificationManagerInstance = null;

// Fonction d'initialisation
function initializeNotificationManager() {
    if (!window.NotificationManagerInstance) {
        window.NotificationManagerInstance = new NotificationManager();
    }
    return window.NotificationManagerInstance;
}

// Export de la classe
window.NotificationManager = NotificationManager;

console.log('📦 Module NotificationManager chargé');
