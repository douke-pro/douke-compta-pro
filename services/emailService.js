// =============================================================================
// FICHIER : services/emailService.js
// Version : V3.0 - RESEND API
// Date : 2026-03-23
// INSTALLATION : npm install resend
// CONFIG : RESEND_API_KEY=re_xxxx dans les variables Render
// =============================================================================

let resendClient = null;

const getResendClient = () => {
    if (resendClient) return resendClient;
    if (!process.env.RESEND_API_KEY) return null;
    try {
        const { Resend } = require('resend');
        resendClient = new Resend(process.env.RESEND_API_KEY);
        return resendClient;
    } catch (err) {
        console.warn('⚠️ [emailService] Resend non dispo (npm install resend?):', err.message);
        return null;
    }
};

if (process.env.RESEND_API_KEY) {
    getResendClient();
    console.log('✅ [emailService] Resend prêt');
} else {
    console.log('ℹ️ [emailService] RESEND_API_KEY manquante — emails désactivés');
}

const sendEmail = async ({ to, subject, html, text }) => {
    const client = getResendClient();
    if (!client) {
        console.log(`ℹ️ [emailService] Email ignoré (non configuré) → ${to}`);
        return { success: false, error: 'Resend non configuré' };
    }
    try {
        const from = process.env.EMAIL_FROM || 'DOUKÈ Compta Pro <noreply@douke.pro>';
        const { data, error } = await client.emails.send({ from, to, subject, html, text });
        if (error) {
            console.error('❌ [emailService] Erreur Resend:', error.message);
            return { success: false, error: error.message };
        }
        console.log(`✅ [emailService] Email envoyé → ${to} | ID: ${data.id}`);
        return { success: true, id: data.id };
    } catch (err) {
        console.error('❌ [emailService] Exception:', err.message);
        return { success: false, error: err.message };
    }
};

exports.sendNewReportRequestEmail = async ({ adminEmail, adminName, requesterName, requesterEmail, requestId, companyId, accountingSystem, periodStart, periodEnd }) => {
    return sendEmail({
        to: adminEmail,
        subject: `📋 Nouvelle demande d'états financiers — #${requestId}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#5D5CDE,#1E40AF);padding:25px;border-radius:8px 8px 0 0;text-align:center;">
                <h2 style="color:white;margin:0;">📋 Nouvelle demande d'états financiers</h2>
            </div>
            <div style="background:white;padding:25px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
                <p>Bonjour <strong>${adminName || 'Administrateur'}</strong>,</p>
                <p><strong>${requesterName}</strong> (${requesterEmail}) a soumis une demande.</p>
                <table style="width:100%;border-collapse:collapse;margin:15px 0;">
                    <tr style="background:#f3f4f6;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">ID</td><td style="padding:8px;border:1px solid #e5e7eb;">#${requestId}</td></tr>
                    <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Système</td><td style="padding:8px;border:1px solid #e5e7eb;">${accountingSystem}</td></tr>
                    <tr style="background:#f3f4f6;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">Période</td><td style="padding:8px;border:1px solid #e5e7eb;">${periodStart} → ${periodEnd}</td></tr>
                </table>
                <div style="text-align:center;margin:20px 0;">
                    <a href="${process.env.FRONTEND_URL || 'https://douke-compta-pro.onrender.com'}" style="background:#5D5CDE;color:white;padding:12px 25px;border-radius:8px;text-decoration:none;font-weight:bold;">Traiter la demande →</a>
                </div>
            </div>
        </div>`,
        text: `Nouvelle demande #${requestId} de ${requesterName} (${requesterEmail})\nSystème: ${accountingSystem}\nPériode: ${periodStart} → ${periodEnd}`
    });
};

exports.sendReportReadyEmail = async ({ userEmail, userName, requestId, status }) => {
    const labels = {
        generated: 'vos états financiers ont été générés et sont en attente de validation',
        validated:  'vos états financiers ont été validés',
        sent:       'vos états financiers sont disponibles au téléchargement'
    };
    const label = labels[status] || 'votre demande a été mise à jour';

    return sendEmail({
        to: userEmail,
        subject: `📊 Mise à jour demande #${requestId}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#10B981,#059669);padding:25px;border-radius:8px 8px 0 0;text-align:center;">
                <h2 style="color:white;margin:0;">📊 Mise à jour de votre demande</h2>
            </div>
            <div style="background:white;padding:25px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
                <p>Bonjour <strong>${userName}</strong>,</p>
                <p>Pour votre demande <strong>#${requestId}</strong>, ${label}.</p>
                <div style="text-align:center;margin:20px 0;">
                    <a href="${process.env.FRONTEND_URL || 'https://douke-compta-pro.onrender.com'}" style="background:#10B981;color:white;padding:12px 25px;border-radius:8px;text-decoration:none;font-weight:bold;">Voir mes états financiers →</a>
                </div>
            </div>
        </div>`,
        text: `Demande #${requestId} — ${label}`
    });
};

exports.sendWelcomeEmail = async (userEmail, userName, companyName) => {
    const exp = new Date();
    exp.setDate(exp.getDate() + 15);
    const expStr = exp.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    return sendEmail({
        to: userEmail,
        subject: '🎉 Bienvenue sur DOUKÈ Compta Pro — 15 jours gratuits !',
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#5D5CDE,#1E40AF);padding:30px;text-align:center;border-radius:8px 8px 0 0;">
                <h1 style="color:white;margin:0;">Bienvenue sur DOUKÈ !</h1>
            </div>
            <div style="background:white;padding:25px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
                <p>Bonjour <strong>${userName}</strong> 👋</p>
                <p>Votre instance <strong style="color:#5D5CDE;">${companyName}</strong> a été créée avec succès.</p>
                <div style="background:#10B981;border-radius:8px;padding:15px;text-align:center;margin:20px 0;">
                    <div style="font-size:36px;font-weight:900;color:white;">15 JOURS GRATUITS</div>
                    <div style="color:rgba(255,255,255,0.9);margin-top:5px;">jusqu'au <strong>${expStr}</strong></div>
                </div>
                <div style="text-align:center;">
                    <a href="${process.env.FRONTEND_URL || 'https://douke-compta-pro.onrender.com'}" style="background:#5D5CDE;color:white;padding:12px 25px;border-radius:8px;text-decoration:none;font-weight:bold;">🚀 Accéder au tableau de bord</a>
                </div>
            </div>
        </div>`,
        text: `Bienvenue ${userName} ! Votre instance "${companyName}" est prête. 15 jours gratuits jusqu'au ${expStr}.`
    });
};

exports.sendExpirationReminderEmail = async (userEmail, userName, daysRemaining) => {
    console.log(`ℹ️ [emailService] [TODO] Rappel expiration ${userEmail} (${daysRemaining}j)`);
};

module.exports = exports;
