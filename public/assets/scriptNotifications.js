// =============================================================================
// MODULE NOTIFICATIONS - FONCTIONS COMPLÈTES
// =============================================================================

window.toggleNotifications = function() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    if (dropdown.classList.contains('hidden')) {
        loadNotifications();
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
};

async function loadNotifications() {
    console.log('📧 [loadNotifications] Chargement des notifications...');

    const listContainer = document.getElementById('notification-list');
    if (!listContainer) return;

    listContainer.innerHTML = `
        <div class="p-8 text-center">
            <div class="loading-spinner mx-auto"></div>
            <p class="mt-3 text-xs text-gray-500">Chargement...</p>
        </div>
    `;

    try {
        const response = await apiFetch(`notifications?companyId=${appState.currentCompanyId}`, {
            method: 'GET'
        });

        const notifications = response.data || [];

        const notificationsHTML = notifications.map(notif => {
            const icon = getNotificationIcon(notif.type);
            const timeAgo = formatTimeAgo(notif.created_at);
            const unreadClass = notif.read ? '' : 'unread';

            const isRecent = (new Date() - new Date(notif.created_at)) < 5 * 60 * 1000;
            const newBadge = (isRecent && !notif.read)
                ? '<span style="background: #EF4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; margin-left: 8px;">NEW</span>'
                : '';

            return `
    <div class="notification-item ${unreadClass}"
         style="padding: 16px; border-bottom: 1px solid #E5E7EB; cursor: pointer; position: relative;"
         onclick="markAsRead('${notif.id}')">
        <button onclick="deleteNotification('${notif.id}', event)"
                style="position: absolute; top: 8px; right: 8px; background: none; border: none;
                       cursor: pointer; color: #9CA3AF; font-size: 13px; padding: 4px; line-height: 1;"
                title="Supprimer cette notification">
            <i class="fas fa-trash-alt"></i>
        </button>
        <div style="display: flex; align-items: start; gap: 12px; padding-right: 24px;">
            <i class="${icon}"
               style="color: ${notif.read ? '#9CA3AF' : '#10B981'}; font-size: 18px; margin-top: 2px;"></i>
            <div style="flex: 1;">
                <p style="font-weight: bold; font-size: 13px; color: ${notif.read ? '#6B7280' : '#111827'}; margin-bottom: 4px;">
                    ${notif.title}${newBadge}
                </p>
                <p style="font-size: 11px; color: #6B7280; margin-bottom: 8px;">
                    ${notif.message}
                </p>
                <p style="font-size: 10px; color: #9CA3AF;">
                    <i class="fas fa-clock" style="margin-right: 4px;"></i>${timeAgo}
                </p>
            </div>
        </div>
    </div>
`;
        }).join('');

        listContainer.innerHTML = notificationsHTML || '<div class="p-8 text-center text-xs text-gray-400">Aucune notification</div>';
        updateNotificationCount(response.unread_count || 0);

    } catch (error) {
        console.error('🚨 [loadNotifications] Erreur:', error);
        listContainer.innerHTML = '<div class="p-8 text-center text-xs text-red-400">Erreur de chargement</div>';
    }
}

window.markAsRead = async function(notificationId) {
    console.log('✅ [markAsRead] Notification', notificationId, 'marquée comme lue');

    try {
        const response = await apiFetch(`notifications/${notificationId}/read`, {
            method: 'PATCH'
        });

        if (response.status === 'success') {
            console.log('✅ [markAsRead] Notification marquée avec succès');
            loadNotifications();
        }

    } catch (error) {
        console.error('🚨 [markAsRead] Erreur:', error);
        NotificationManager.show(`Erreur : ${error.message}`, 'error');
    }
};

function updateNotificationCount(count) {
    const badge = document.getElementById('notification-count');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function getNotificationIcon(type) {
    const icons = {
        'info': 'fas fa-info-circle',
        'alert': 'fas fa-exclamation-triangle',
        'reminder': 'fas fa-bell',
        'invoice': 'fas fa-file-invoice',
        'report': 'fas fa-chart-bar',
        'odoo': 'fas fa-cog'
    };
    return icons[type] || 'fas fa-bell';
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `Il y a ${Math.floor(diffInSeconds / 86400)}j`;

    return past.toLocaleDateString('fr-FR');
}

window.deleteNotification = async function(notificationId, event) {
    if (event) event.stopPropagation();

    try {
        const response = await apiFetch(`notifications/${notificationId}`, {
            method: 'DELETE'
        });

        if (response.status === 'success') {
            console.log('✅ [deleteNotification] Notification supprimée:', notificationId);
            loadNotifications();
        }

    } catch (error) {
        console.error('🚨 [deleteNotification] Erreur:', error);
    }
};
