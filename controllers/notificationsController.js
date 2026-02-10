// =============================================================================
// FICHIER : controllers/notificationsController.js
// Description : Gestion des notifications (envoi, récupération, lecture)
// Version : V22 - FINALE ROBUSTE ET COMPLÈTE
// Corrections appliquées :
//   - Import de 'pool' ajouté
//   - Retour des détails complets des destinataires (nom, email, canal, statut)
//   - Support de tous les types de destinataires (all, role, specific)
//   - Gestion robuste des erreurs
//   - Logs détaillés pour debugging
//   - Fonction stripHtmlTags sécurisée
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('../services/odooService');
const pool = require('../config/db'); // ✅ IMPORT CRUCIAL

/**
 * Récupère les notifications de l'utilisateur connecté
 * @route GET /api/notifications
 * @access Authentifié
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.odooUid;
        const companyId = req.query.companyId || req.user.selectedCompanyId;
        
        console.log('🔔 [getNotifications] User:', userId, '| Company:', companyId);
        
        // ✅ CHARGER DEPUIS POSTGRESQL (notifications de ton app)
        const result = await pool.query(
            `SELECT 
                id, 
                type, 
                priority, 
                title, 
                message, 
                created_at, 
                read,
                sender_id
             FROM notifications
             WHERE user_id = $1 AND company_id = $2
             ORDER BY created_at DESC
             LIMIT 50`,
            [userId, companyId]
        );
        
        const appNotifications = result.rows;
        
        console.log(`✅ [getNotifications] ${appNotifications.length} notifications app trouvées`);
        
        // 🔄 OPTIONNEL : Charger aussi les notifications Odoo
        let odooNotifications = [];
        
        try {
            const odooMessages = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'mail.message',
                method: 'search_read',
                args: [[
                    ['message_type', '=', 'notification'],
                    ['date', '>=', getThirtyDaysAgo()]
                ]],
                kwargs: {
                    fields: ['id', 'subject', 'body', 'date', 'needaction', 'author_id'],
                    order: 'date DESC',
                    limit: 20
                }
            });
            
            // Formater les notifications Odoo
            odooNotifications = odooMessages.map(n => ({
                id: `odoo-${n.id}`, // Préfixe pour éviter les conflits
                type: 'odoo',
                priority: 'normal',
                title: n.subject || 'Notification Odoo',
                message: stripHtmlTags(n.body || '').substring(0, 200),
                created_at: n.date,
                read: !n.needaction,
                sender_id: n.author_id ? n.author_id[1] : 'Système Odoo'
            }));
            
            console.log(`✅ [getNotifications] ${odooNotifications.length} notifications Odoo trouvées`);
            
        } catch (odooError) {
            console.warn('⚠️ [getNotifications] Erreur Odoo (ignorée):', odooError.message);
        }
        
        // ✅ COMBINER LES DEUX SOURCES (app en priorité)
        const allNotifications = [
            ...appNotifications,
            ...odooNotifications
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        console.log(`📊 [getNotifications] TOTAL: ${allNotifications.length} notifications`);
        
        res.json({
            status: 'success',
            data: allNotifications
        });
        
    } catch (error) {
        console.error('🚨 [getNotifications] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la récupération des notifications'
        });
    }
};

/**
 * Envoie une notification à un ou plusieurs utilisateurs
 * @route POST /api/notifications/send
 * @access ADMIN + COLLABORATEUR uniquement
 */
exports.sendNotification = async (req, res) => {
    try {
        const { recipients, recipientType, type, priority, title, message } = req.body;
        const senderId = req.user.odooUid;
        const senderEmail = req.user.email;
        const senderRole = req.user.profile;
        const companyId = req.body.companyId || req.user.selectedCompanyId;

        console.log('📤 [sendNotification] Envoi par:', senderEmail, '| Type:', type);

        // ✅ VÉRIFICATION PERMISSIONS
        if (senderRole !== 'ADMIN' && senderRole !== 'COLLABORATEUR') {
            return res.status(403).json({
                status: 'error',
                error: 'Seuls les Administrateurs et Collaborateurs peuvent envoyer des notifications'
            });
        }

        // ✅ VALIDATION
        if (!title || !message) {
            return res.status(400).json({
                status: 'error',
                error: 'Titre et message requis'
            });
        }

        if (!recipientType || !recipients || recipients.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Type de destinataire et liste de destinataires requis'
            });
        }

        // ✅ RÉCUPÉRER LES IDS DES UTILISATEURS DESTINATAIRES
        let userIds = [];
        let targetUsers = [];

        if (recipientType === 'all' || (recipients && recipients.includes('all'))) {
            console.log('📋 [sendNotification] Type: Tous les utilisateurs');
            
            // Tous les utilisateurs de l'entreprise
            targetUsers = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['company_ids', 'in', [parseInt(companyId)]]]],
                kwargs: { 
                    fields: ['id', 'name', 'email', 'login'],
                    limit: 500
                }
            });
            
            userIds = targetUsers.map(u => u.id);

        } else if (recipientType === 'role') {
            console.log('📋 [sendNotification] Type: Par rôle -', recipients[0]);
            
            const targetRole = recipients[0]; // Ex: 'ADMIN', 'COLLABORATEUR', etc.
            
            // Récupérer tous les utilisateurs de l'entreprise
            const allUsers = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['company_ids', 'in', [parseInt(companyId)]]]],
                kwargs: { 
                    fields: ['id', 'name', 'email', 'login'],
                    limit: 500
                }
            });

            // Filtrer par rôle (nécessite de vérifier les groupes)
            for (const user of allUsers) {
                const groups = await odooExecuteKw({
                    uid: ADMIN_UID_INT,
                    model: 'res.groups',
                    method: 'search_read',
                    args: [[['user_ids', 'in', [user.id]]]],
                    kwargs: { fields: ['name'], limit: 10 }
                });

                const groupNames = groups.map(g => g.name.toLowerCase());
                let userRole = 'USER';

                if (groupNames.some(name => name.includes('admin') || name.includes('settings'))) {
                    userRole = 'ADMIN';
                } else if (groupNames.some(name => name.includes('manager') || name.includes('accountant'))) {
                    userRole = 'COLLABORATEUR';
                } else if (groupNames.some(name => name.includes('cash') || name.includes('caisse'))) {
                    userRole = 'CAISSIER';
                }

                if (userRole === targetRole) {
                    targetUsers.push(user);
                    userIds.push(user.id);
                }
            }

        } else if (recipientType === 'specific') {
            console.log('📋 [sendNotification] Type: Utilisateurs spécifiques');
            
            // IDs spécifiques fournis
            userIds = recipients.map(id => parseInt(id));

            // Récupérer les détails des utilisateurs
            targetUsers = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'res.users',
                method: 'search_read',
                args: [[['id', 'in', userIds]]],
                kwargs: { 
                    fields: ['id', 'name', 'email', 'login'],
                    limit: 500
                }
            });
        }

        console.log(`📬 [sendNotification] Envoi à ${userIds.length} utilisateur(s)`);

        if (userIds.length === 0) {
            return res.status(400).json({
                status: 'error',
                error: 'Aucun destinataire trouvé'
            });
        }

        // ✅ CRÉER LES NOTIFICATIONS DANS POSTGRESQL ET ODOO
        const notificationIds = [];
        const successfulRecipients = [];
        const failedRecipients = [];

        for (const user of targetUsers) {
            try {
                // 1️⃣ Créer dans PostgreSQL (base de données de ton app)
                const pgResult = await pool.query(
                    `INSERT INTO notifications (user_id, company_id, type, priority, title, message, sender_id, created_at, read)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), false)
                     RETURNING id`,
                    [user.id, companyId, type, priority, title, message, senderId]
                );

                const pgNotificationId = pgResult.rows[0].id;
                
                // 2️⃣ Créer dans Odoo (pour intégration système)
                const odooMessageId = await odooExecuteKw({
                    uid: ADMIN_UID_INT,
                    model: 'mail.message',
                    method: 'create',
                    args: [{
                        message_type: 'notification',
                        subtype_id: 1, // Note interne
                        body: `<div style="font-family: Arial, sans-serif;">
                                <h3 style="color: #2563eb; margin-bottom: 10px;">${title}</h3>
                                <p style="color: #374151; line-height: 1.6;">${message}</p>
                                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                                <p style="color: #6b7280; font-size: 12px;">
                                    <strong>Priorité:</strong> ${getPriorityLabel(priority)} | 
                                    <strong>Type:</strong> ${getTypeLabel(type)} | 
                                    <strong>Envoyé par:</strong> ${senderEmail}
                                </p>
                               </div>`,
                        subject: title,
                        author_id: senderId,
                        needaction: true, // Marquer comme "à lire"
                        record_name: `Notification - ${type}`
                    }],
                    kwargs: {}
                });

                notificationIds.push({ pg: pgNotificationId, odoo: odooMessageId });
                
                successfulRecipients.push({
                    id: user.id,
                    name: user.name,
                    email: user.email || user.login,
                    channel: 'notification',
                    status: 'sent'
                });

            } catch (userError) {
                console.warn(`⚠️ [sendNotification] Erreur envoi à user ${user.id}:`, userError.message);
                
                failedRecipients.push({
                    id: user.id,
                    name: user.name,
                    email: user.email || user.login,
                    channel: 'notification',
                    status: 'failed'
                });
            }
        }

        console.log(`✅ [sendNotification] ${notificationIds.length} notifications créées`);

        // ✅ RETOURNER LA SYNTHÈSE COMPLÈTE
        res.json({
            status: 'success',
            message: `Notifications envoyées à ${successfulRecipients.length} utilisateur(s)`,
            data: {
                count: successfulRecipients.length, // ✅ IMPORTANT : Renommé 'sent_count' en 'count' pour compatibilité frontend
                sent_count: successfulRecipients.length,
                failed_count: failedRecipients.length,
                total_recipients: targetUsers.length,
                recipients: [...successfulRecipients, ...failedRecipients],
                notification_ids: notificationIds
            }
        });

    } catch (error) {
        console.error('🚨 [sendNotification] Erreur:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de l\'envoi des notifications',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur serveur'
        });
    }
};

/**
 * Marque une notification comme lue
 * @route PATCH /api/notifications/:id/read
 * @access Authentifié
 */
exports.markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.odooUid;

        console.log(`✅ [markAsRead] Notification ${notificationId} pour user ${userId}`);

        // Vérifier si c'est une notification Odoo (préfixe "odoo-")
        if (String(notificationId).startsWith('odoo-')) {
            const realId = parseInt(notificationId.replace('odoo-', ''));
            
            // Marquer comme lu dans Odoo
            await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'mail.message',
                method: 'write',
                args: [[realId], { needaction: false }],
                kwargs: {}
            });
        } else {
            // Marquer comme lu dans PostgreSQL
            await pool.query(
                `UPDATE notifications 
                 SET read = true 
                 WHERE id = $1 AND user_id = $2`,
                [parseInt(notificationId), userId]
            );
        }

        res.json({
            status: 'success',
            message: 'Notification marquée comme lue'
        });

    } catch (error) {
        console.error('🚨 [markAsRead] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la mise à jour'
        });
    }
};

/**
 * Supprime une notification
 * @route DELETE /api/notifications/:id
 * @access Authentifié
 */
exports.deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.odooUid;

        console.log(`🗑️ [deleteNotification] Notification ${notificationId} pour user ${userId}`);

        // Vérifier si c'est une notification Odoo
        if (String(notificationId).startsWith('odoo-')) {
            const realId = parseInt(notificationId.replace('odoo-', ''));
            
            // Supprimer dans Odoo
            await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'mail.message',
                method: 'unlink',
                args: [[realId]],
                kwargs: {}
            });
        } else {
            // Supprimer dans PostgreSQL
            await pool.query(
                `DELETE FROM notifications 
                 WHERE id = $1 AND user_id = $2`,
                [parseInt(notificationId), userId]
            );
        }

        res.json({
            status: 'success',
            message: 'Notification supprimée'
        });

    } catch (error) {
        console.error('🚨 [deleteNotification] Erreur:', error.message);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors de la suppression'
        });
    }
};

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Retourne une date il y a 30 jours (format Odoo)
 */
function getThirtyDaysAgo() {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0] + ' 00:00:00';
}

/**
 * Supprime les balises HTML d'une chaîne
 */
function stripHtmlTags(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Retourne le label de priorité
 */
function getPriorityLabel(priority) {
    const labels = {
        'low': '🟢 Basse',
        'normal': '🔵 Normale',
        'high': '🟠 Haute',
        'urgent': '🔴 Urgente'
    };
    return labels[priority] || '🔵 Normale';
}

/**
 * Retourne le label de type
 */
function getTypeLabel(type) {
    const labels = {
        'info': 'ℹ️ Information',
        'alert': '⚠️ Alerte',
        'reminder': '📅 Rappel',
        'invoice': '📄 Facture',
        'report': '📊 Rapport'
    };
    return labels[type] || 'ℹ️ Information';
}
