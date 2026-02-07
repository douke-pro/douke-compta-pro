// =============================================================================
// FICHIER : services/emailService.js
// Description : Service d'envoi d'emails automatiques
// =============================================================================

const nodemailer = require('nodemailer');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true pour le port 465, false pour les autres ports
    auth: {
        user: process.env.SMTP_USER, // Votre email d'envoi
        pass: process.env.SMTP_PASS, // Votre mot de passe ou App Password
    },
});

// Vérifier la configuration au démarrage
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Configuration email invalide:', error);
    } else {
        console.log('✅ Service email opérationnel');
    }
});

/**
 * Envoie un email de bienvenue au nouvel utilisateur
 */
exports.sendWelcomeEmail = async (userEmail, userName, companyName) => {
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

        // Template HTML de l'email
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
            <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🎉</span>
            </div>
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

                <div style="margin-bottom: 15px; padding-left: 25px; position: relative;">
                    <span style="position: absolute; left: 0; color: #10B981; font-weight: bold;">✓</span>
                    <span style="color: #4b5563; font-size: 15px;">Accéder à votre tableau de bord analytique</span>
                </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0 30px;">
                <a href="${process.env.FRONTEND_URL || 'https://douke-compta.onrender.com'}" 
                   style="display: inline-block; background: linear-gradient(135deg, #5D5CDE 0%, #1E40AF 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(93, 92, 222, 0.3);">
                    🚀 ACCÉDER À MON TABLEAU DE BORD
                </a>
            </div>

            <!-- Support -->
            <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin-top: 30px;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; font-weight: 600;">
                    💬 Besoin d'aide ?
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                    Notre équipe support est disponible du lundi au vendredi de 8h à 18h (GMT+1).<br>
                    📧 Email : <a href="mailto:support@douke.pro" style="color: #5D5CDE; text-decoration: none;">support@douke.pro</a>
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 10px; font-size: 20px; font-weight: 900; color: #5D5CDE;">DOUKÈ</p>
            <p style="margin: 0 0 5px; font-size: 12px; color: #6b7280;">Compta Pro v1.4 - Solution Comptable Professionnelle</p>
            <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                © ${new Date().getFullYear()} DOUKÈ. Tous droits réservés.
            </p>
        </div>
    </div>
</body>
</html>
        `;

        // Envoi de l'email
        const info = await transporter.sendMail({
            from: `"DOUKÈ Compta Pro" <${process.env.SMTP_USER || 'noreply@douke.pro'}>`,
            to: userEmail,
            subject: '🎉 Bienvenue sur DOUKÈ Compta Pro - 15 jours gratuits !',
            html: htmlContent,
            text: `
Bienvenue sur DOUKÈ Compta Pro !

Bonjour ${userName},

Votre instance "${companyName}" a été créée avec succès.

🎁 PÉRIODE D'ESSAI GRATUITE : 15 JOURS
Profitez de toutes les fonctionnalités jusqu'au ${formattedDate}

Accédez à votre tableau de bord : ${process.env.FRONTEND_URL || 'https://douke-compta.onrender.com'}

Besoin d'aide ? Contactez-nous : support@douke.pro

Cordialement,
L'équipe DOUKÈ
            `.trim(),
        });

        console.log(`✅ Email envoyé avec succès: ${info.messageId}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Erreur envoi email:', error.message);
        // Ne pas bloquer l'inscription si l'email échoue
        return { success: false, error: error.message };
    }
};

/**
 * Envoie un email de rappel d'expiration (7 jours avant)
 */
exports.sendExpirationReminderEmail = async (userEmail, userName, daysRemaining) => {
    // TODO: Implémenter plus tard avec un cron job
    console.log(`📧 [TODO] Rappel expiration pour ${userEmail} (${daysRemaining} jours restants)`);
};

module.exports = exports;
