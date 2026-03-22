// =============================================================================
// FICHIER : services/emailService.js
// Description : Service d'envoi d'emails automatiques
// ✅ FIX : transporter.verify() entouré d'un timeout court (5s max)
//          pour ne pas bloquer ni polluer les logs au démarrage
// =============================================================================

const nodemailer = require('nodemailer');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // ✅ Timeout court pour éviter de bloquer le démarrage du serveur
    connectionTimeout: 5000,   // 5 secondes max pour la connexion
    greetingTimeout:   3000,
    socketTimeout:     5000,
});

// ✅ Vérification SMTP uniquement si les variables sont définies
// Évite un timeout de 30s au démarrage si SMTP n'est pas configuré
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter.verify(function (error, success) {
        if (error) {
            console.warn('⚠️ [emailService] SMTP non disponible (emails désactivés):', error.code || error.message);
        } else {
            console.log('✅ [emailService] Service email opérationnel');
        }
    });
} else {
    console.log('ℹ️ [emailService] SMTP non configuré — emails désactivés (SMTP_USER/SMTP_PASS manquants)');
}

/**
 * Vérifie si le service email est configuré et disponible
 */
const isEmailConfigured = () => {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
};

/**
 * Envoie un email de bienvenue au nouvel utilisateur
 */
exports.sendWelcomeEmail = async (userEmail, userName, companyName) => {
    // ✅ Vérification préalable — ne tente pas si SMTP non configuré
    if (!isEmailConfigured()) {
        console.log(`ℹ️ [emailService] Email de bienvenue ignoré (SMTP non configuré) pour ${userEmail}`);
        return { success: false, error: 'SMTP non configuré' };
    }

    try {
        console.log(`📧 Envoi email de bienvenue à ${userEmail}...`);

        // Calculer la date d'expiration (15 jours)
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 15);
        const formattedDate = expirationDate.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur DOUKÈ Compta Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f7f7f9;">
    <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #5D5CDE 0%, #1E40AF 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px;">Bienvenue sur DOUKÈ !</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Votre système comptable professionnel</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px; font-weight: 600;">
                Bonjour ${userName} 👋
            </p>

            <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 25px;">
                Félicitations ! Votre instance <strong style="color: #5D5CDE;">${companyName}</strong> a été créée avec succès. 
                Vous pouvez dès maintenant accéder à toutes les fonctionnalités de DOUKÈ Compta Pro.
            </p>

            <!-- Période d'essai -->
            <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                <div style="font-size: 48px; font-weight: 900; color: white; margin-bottom: 10px;">15 JOURS</div>
                <div style="color: rgba(255,255,255,0.95); font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                    D'ESSAI GRATUIT
                </div>
                <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 15px;">
                    Jusqu'au <strong>${formattedDate}</strong>
                </div>
            </div>

            <!-- Fonctionnalités -->
            <div style="margin: 30px 0;">
                <h3 style="color: #1f2937; font-size: 18px; font-weight: 700; margin: 0 0 20px;">
                    🚀 Ce que vous pouvez faire dès maintenant :
                </h3>
                <div style="margin-bottom: 15px; padding-left: 25px; position: relative;">
                    <span style="position: absolute; left: 0; color: #10B981; font-weight: bold;">✓</span>
                    <span style="color: #4b5563; font-size: 15px;">Gérer vos comptes conformément au SYSCOHADA</span>
                </div>
                <div style="margin-bottom: 15px; padding-left: 25px; position: relative;">
                    <span style="position: absolute; left: 0; color: #10B981; font-weight: bold;">✓</span>
                    <span style="color: #4b5563; font-size: 15px;">Créer des écritures comptables automatiquement</span>
                </div>
                <div style="margin-bottom: 15px; padding-left: 25px; position: relative;">
                    <span style="position: absolute; left: 0; color: #10B981; font-weight: bold;">✓</span>
                    <span style="color: #4b5563; font-size: 15px;">Générer des rapports financiers professionnels</span>
                </div>
                <div style="margin-bottom: 15px; padding-left: 25px; position: relative;">
                    <span style="position: absolute; left: 0; color: #10B981; font-weight: bold;">✓</span>
                    <span style="color: #4b5563; font-size: 15px;">Suivre votre trésorerie en temps réel</span>
                </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://douke-compta.onrender.com'}" 
                   style="display: inline-block; background: linear-gradient(135deg, #5D5CDE 0%, #1E40AF 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px;">
                    🚀 ACCÉDER À MON TABLEAU DE BORD
                </a>
            </div>

            <!-- Support -->
            <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin-top: 30px;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; font-weight: 600;">💬 Besoin d'aide ?</p>
                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                    Notre équipe support est disponible du lundi au vendredi de 8h à 18h (GMT+1).<br>
                    📧 Email : <a href="mailto:support@douke.pro" style="color: #5D5CDE; text-decoration: none;">support@douke.pro</a>
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px; font-size: 20px; font-weight: 900; color: #5D5CDE;">DOUKÈ</p>
            <p style="margin: 0 0 5px; font-size: 12px; color: #6b7280;">Compta Pro — Solution Comptable Professionnelle</p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">© ${new Date().getFullYear()} DOUKÈ. Tous droits réservés.</p>
        </div>
    </div>
</body>
</html>`;

        const info = await transporter.sendMail({
            from:    `"DOUKÈ Compta Pro" <${process.env.SMTP_USER || 'noreply@douke.pro'}>`,
            to:      userEmail,
            subject: '🎉 Bienvenue sur DOUKÈ Compta Pro - 15 jours gratuits !',
            html:    htmlContent,
            text:    `Bienvenue sur DOUKÈ Compta Pro !\n\nBonjour ${userName},\nVotre instance "${companyName}" a été créée avec succès.\n\nPériode d'essai : 15 jours jusqu'au ${formattedDate}\n\nAccédez à votre tableau de bord : ${process.env.FRONTEND_URL || 'https://douke-compta.onrender.com'}\n\nBesoin d'aide ? support@douke.pro`,
        });

        console.log(`✅ [emailService] Email envoyé: ${info.messageId}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ [emailService] Erreur envoi email:', error.message);
        // Ne jamais bloquer l'inscription si l'email échoue
        return { success: false, error: error.message };
    }
};

/**
 * Rappel d'expiration (à implémenter avec un cron job)
 */
exports.sendExpirationReminderEmail = async (userEmail, userName, daysRemaining) => {
    console.log(`📧 [emailService] [TODO] Rappel expiration pour ${userEmail} (${daysRemaining} jours restants)`);
};

module.exports = exports;
