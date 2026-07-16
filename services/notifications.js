// =============================================================================
// FICHIER : services/notifications.js
// Description : Service de notifications interne via Odoo mail.message
// Architecture : Cohérente avec notificationsController.js (V26)
// Utilisé par : controllers/reportsController.js
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('./odooService');
const pool = require('./dbService');

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Récupérer le partner_id Odoo d'un utilisateur à partir de son odooUid
 */
const getPartnerIdFromUserId = async (userId) => {
    try {
        const userData = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'read',
            args: [[userId], ['partner_id', 'name', 'email']],
            kwargs: {}
        });

        if (!userData || userData.length === 0 || !userData[0].partner_id) {
            console.warn(`⚠️ [notifications] Partner non trouvé pour userId: ${userId}`);
            return null;
        }

        return {
            partnerId: userData[0].partner_id[0],
            name: userData[0].name,
            email: userData[0].email
        };

    } catch (error) {
        console.warn(`⚠️ [notifications] Erreur récupération partner pour userId ${userId}:`, error.message);
        return null;
    }
};

/**
 * Récupérer le partner_id de l'expéditeur système (ADMIN_UID_INT)
 */
const getSystemPartnerId = async () => {
    try {
        const senderData = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'res.users',
            method: 'read',
            args: [[ADMIN_UID_INT], ['partner_id']],
            kwargs: {}
        });

        if (!senderData || senderData.length === 0 || !senderData[0].partner_id) {
            console.warn('⚠️ [notifications] Partner système introuvable');
            return null;
        }

        return senderData[0].partner_id[0];

    } catch (error) {
        console.warn('⚠️ [notifications] Erreur récupération partner système:', error.message);
        return null;
    }
};

/**
 * Construire le corps HTML du message selon le type de notification
 */
const buildEmailBody = (type, title, message, link) => {
    const typeLabels = {
        'financial_report_request':     '📋 Nouvelle demande',
        'financial_report_generated':   '⚙️ Rapport généré',
        'financial_report_ready':       '✅ Rapport disponible',
        'financial_report_regenerated': '🔄 Rapport mis à jour',
    };

    const typeColors = {
        'financial_report_request':     '#2563eb',
        'financial_report_generated':   '#7c3aed',
        'financial_report_ready':       '#059669',
        'financial_report_regenerated': '#d97706',
    };

    const typeLabel = typeLabels[type] || 'ℹ️ Notification';
    const color = typeColors[type] || '#2563eb';
    const appUrl = process.env.FRONTEND_URL || 'https://douke-compta.onrender.com';
    const fullLink = link ? `${appUrl}${link}` : appUrl;
    const pool = require('./dbService');
    
    return `
<div style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb; border-radius: 8px; max-width: 600px;">
    <div style="background: ${color}; padding: 15px 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px;">
        <h3 style="color: white; margin: 0; font-size: 16px; font-weight: 700;">${typeLabel}</h3>
    </div>
    <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px;">${title}</h4>
    <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 14px;">${message}</p>
    <div style="text-align: center; margin: 20px 0;">
        <a href="${fullLink}"
           style="display: inline-block; background: ${color}; color: white; text-decoration: none;
                  padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Voir les détails →
        </a>
    </div>
    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; font-size: 11px; margin: 0; text-align: center;">
        DOUKÈ Compta Pro — Notification automatique
    </p>
</div>`.trim();
};

/**
 * Envoyer une notification interne à un utilisateur
 *
 * @param {number} userId    - odooUid de l'utilisateur destinataire
 * @param {number} companyId - ID de l'entreprise (optionnel)
 * @param {string} type      - Type de notification
 * @param {string} title     - Titre court
 * @param {string} message   - Corps du message
 * @param {string} link      - Lien relatif optionnel (ex: '/reports/42')
 */
exports.send = async ({ userId, companyId, type, title, message, link }) => {
    try {
        console.log(`📬 [notifications.send] userId:${userId} | companyId:${companyId} | type:${type} | title:"${title}"`);

        if (!userId || !companyId || !title || !message) {
            console.warn('⚠️ [notifications.send] Paramètres manquants (userId, companyId, title, message requis) — ignorée');
            return { success: false, error: 'userId, companyId, title et message requis' };
        }

        // ✅ FIX : 'link' n'existe pas en colonne — intégré directement dans le message
        const fullMessage = link
            ? `${message}\n\n🔗 ${(process.env.FRONTEND_URL || 'https://douke-compta-pro.onrender.com')}${link}`
            : message;

        const result = await pool.queryWithRetry(
            `INSERT INTO app_notifications
             (recipient_uid, company_id, type, title, message, is_read, created_at)
             VALUES ($1, $2, $3, $4, $5, FALSE, NOW())
             RETURNING id`,
            [
                parseInt(userId),
                parseInt(companyId),
                type    || 'info',
                title,
                fullMessage
            ]
        );

        const notifId = result.rows[0]?.id;
        console.log(`✅ [notifications.send] Notification ${notifId} créée pour recipient_uid:${userId}`);
        return { success: true, notificationId: notifId };

    } catch (error) {
        console.error(`❌ [notifications.send] Erreur:`, error.message);
        return { success: false, error: error.message };
    }
};
