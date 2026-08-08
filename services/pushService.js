// =============================================================================
// FICHIER : services/pushService.js
// Envoi des notifications push (Web Push API)
// =============================================================================
const webpush = require('web-push');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:contact@doukegf.bj',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn('⚠️ [pushService] Clés VAPID absentes — les push ne fonctionneront pas.');
}

/**
 * Envoie un push à une souscription unique.
 * Retourne { success, error?, statusCode? } — ne throw jamais (usage en Promise.all).
 */
async function sendPushToSubscription(subscription, payload) {
    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message, statusCode: err.statusCode };
    }
}

module.exports = { sendPushToSubscription, webpush };
