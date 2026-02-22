// =============================================================================
// FICHIER : services/notifications.js
// Description : Service de notifications interne via Odoo mail.message
// Architecture : Cohérente avec notificationsController.js (V26)
// Utilisé par : controllers/reportsController.js
// =============================================================================

const { odooExecuteKw, ADMIN_UID_INT } = require('./odooService');

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

// =============================================================================
// FONCTION PRINCIPALE
// =============================================================================

/**
 * Envoyer une notification à un utilisateur via Odoo mail.message
 *
 * @param {Object} params
 * @param {number} params.userId   - ID Odoo de l'utilisateur destinataire
 * @param {string} params.type     - Type de notification
 * @param {string} params.title    - Titre
 * @param {string} params.message  - Corps du message
 * @param {string} params.link     - Lien relatif (ex: '/reports/42')
 *
 * @returns {Promise<{success: boolean, messageId?: number, error?: string}>}
 */
exports.send = async ({ userId, type, title, message, link }) => {
    try {
        console.log(`📬 [notifications.send] userId:${userId} | type:${type} | title:"${title}"`);

        // 1. Récupérer le partner destinataire
        const recipientData = await getPartnerIdFromUserId(userId);

        if (!recipientData) {
            console.warn(`⚠️ [notifications.send] Destinataire introuvable pour userId:${userId} — ignorée`);
            return { success: false, error: `Destinataire userId:${userId} introuvable` };
        }

        const { partnerId, name, email } = recipientData;
        console.log(`👤 [notifications.send] Destinataire: ${name} (partner:${partnerId}, email:${email})`);

        // 2. Récupérer le partner expéditeur système
        const senderPartnerId = await getSystemPartnerId();

        if (!senderPartnerId) {
            console.warn('⚠️ [notifications.send] Expéditeur système introuvable — ignorée');
            return { success: false, error: 'Expéditeur système introuvable' };
        }

        // 3. Construire le corps HTML
        const htmlBody = buildEmailBody(type, title, message, link);

        // 4. Créer le message Odoo (mail.message)
        const messageId = await odooExecuteKw({
            uid: ADMIN_UID_INT,
            model: 'mail.message',
            method: 'create',
            args: [{
                message_type: 'notification',
                subtype_id: 1,
                subject: title,
                body: htmlBody,
                author_id: senderPartnerId,
                needaction: true,
                record_name: `Notification - ${type}`,
                partner_ids: [[6, 0, [partnerId]]]
            }],
            kwargs: {}
        });

        console.log(`✅ [notifications.send] mail.message créé: ID ${messageId}`);

        // 5. Créer la notification Odoo (mail.notification) pour la boîte de réception
        try {
            const notifId = await odooExecuteKw({
                uid: ADMIN_UID_INT,
                model: 'mail.notification',
                method: 'create',
                args: [{
                    mail_message_id: messageId,
                    res_partner_id: partnerId,
                    notification_type: 'inbox',
                    is_read: false,
                    notification_status: 'sent'
                }],
                kwargs: {}
            });

            console.log(`✅ [notifications.send] mail.notification créée: ID ${notifId}`);

        } catch (notifError) {
            // Ne pas bloquer si la notification inbox échoue — le message existe déjà
            console.warn(`⚠️ [notifications.send] Erreur mail.notification:`, notifError.message);
        }

        console.log(`✅ [notifications.send] Succès pour userId:${userId}`);
        return { success: true, messageId };

    } catch (error) {
        // Ne jamais faire crasher l'appelant
        // reportsController appelle send() dans des setImmediate() et flux critiques
        console.error(`❌ [notifications.send] Erreur:`, error.message);
        console.error('Stack:', error.stack);
        return { success: false, error: error.message };
    }
};
