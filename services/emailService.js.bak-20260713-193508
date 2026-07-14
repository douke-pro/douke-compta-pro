// =============================================================================
// FICHIER : services/emailService.js
// Description : Service d'envoi d'emails — Resend + domaine doukegf.bj
// Version : V1.0
// Usage : Importé depuis authController.js ou tout autre controller
// =============================================================================

const { Resend } = require('resend');

// Initialisation du client Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Adresse expéditrice officielle — jamais modifiée
const FROM_ADDRESS = 'DOUKÈ Compta Pro <contact@doukegf.bj>';

// =============================================================================
// HELPER : Template HTML de base (cohérent avec l'identité DOUKÈ)
// =============================================================================
function buildBaseHTML(content) {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOUKÈ Compta Pro</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f9; font-family:Arial,sans-serif;">

    <div style="max-width:600px; margin:30px auto;">

        <!-- EN-TÊTE -->
        <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);
                    padding:35px 30px; text-align:center;
                    border-radius:8px 8px 0 0;">
            <h1 style="color:#ffffff; margin:0; font-size:28px;
                       font-weight:900; letter-spacing:2px;">
                DOUKÈ
            </h1>
            <p style="color:#a0aec0; margin:6px 0 0 0; font-size:13px;
                      letter-spacing:1px;">
                COMPTA PRO — SYSCOHADA Révisé
            </p>
        </div>

        <!-- CORPS -->
        <div style="background-color:#ffffff; padding:40px 35px;
                    border-left:1px solid #e2e8f0;
                    border-right:1px solid #e2e8f0;">
            ${content}
        </div>

        <!-- PIED DE PAGE -->
        <div style="background-color:#f7fafc; padding:20px 30px;
                    text-align:center; border-radius:0 0 8px 8px;
                    border:1px solid #e2e8f0; border-top:none;">
            <p style="font-size:12px; color:#718096; margin:0 0 4px 0;
                      font-weight:bold;">
                DOUKÈ Compta Pro
            </p>
            <p style="font-size:12px; color:#a0aec0; margin:0;">
                Plateforme comptable SYSCOHADA Révisé
            </p>
            <p style="font-size:11px; color:#cbd5e0; margin:10px 0 0 0;">
                contact@doukegf.bj — doukegf.bj
            </p>
        </div>

    </div>
</body>
</html>
    `.trim();
}

// =============================================================================
// 1. EMAIL DE BIENVENUE — Nouvel utilisateur créé par l'admin
// =============================================================================
exports.sendWelcomeEmail = async ({
    toEmail,
    toName,
    companyName,
    tempPassword,
    role
}) => {
    const roleLabels = {
        'ADMIN'      : 'Administrateur',
        'COMPTABLE'  : 'Comptable',
        'CAISSIER'   : 'Caissier',
        'SUPERVISEUR': 'Superviseur'
    };

    const roleLabel = roleLabels[role] || role || 'Utilisateur';

    const content = `
        <p style="font-size:15px; color:#2d3748; margin:0 0 12px 0;">
            Bonjour <strong>${toName}</strong>,
        </p>

        <p style="font-size:15px; color:#4a5568; line-height:1.7; margin:0 0 20px 0;">
            Votre compte <strong>DOUKÈ Compta Pro</strong> a été créé pour
            <strong>${companyName}</strong>. Vous pouvez dès maintenant
            vous connecter à la plateforme.
        </p>

        <!-- INFORMATIONS DE CONNEXION -->
        <div style="background-color:#f8fafc; border:1px solid #e2e8f0;
                    border-radius:8px; padding:20px 25px; margin:25px 0;">
            <p style="font-size:13px; font-weight:bold; color:#4a5568;
                      margin:0 0 15px 0; text-transform:uppercase;
                      letter-spacing:0.5px;">
                Vos informations de connexion
            </p>
            <table style="width:100%; border-collapse:collapse;">
                <tr>
                    <td style="font-size:13px; color:#718096;
                               padding:6px 0; width:40%;">
                        Adresse e-mail :
                    </td>
                    <td style="font-size:13px; color:#2d3748;
                               font-weight:bold; padding:6px 0;">
                        ${toEmail}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:6px 0;">
                        Mot de passe temporaire :
                    </td>
                    <td style="font-size:13px; color:#4f46e5;
                               font-weight:bold; padding:6px 0;
                               font-family:monospace; font-size:15px;">
                        ${tempPassword}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:6px 0;">
                        Profil :
                    </td>
                    <td style="font-size:13px; color:#2d3748;
                               font-weight:bold; padding:6px 0;">
                        ${roleLabel}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:6px 0;">
                        Entreprise :
                    </td>
                    <td style="font-size:13px; color:#2d3748;
                               font-weight:bold; padding:6px 0;">
                        ${companyName}
                    </td>
                </tr>
            </table>
        </div>

        <!-- BOUTON CONNEXION -->
        <div style="text-align:center; margin:35px 0;">
            <a href="https://douke-compta-pro.onrender.com"
               style="background:linear-gradient(135deg,#4f46e5,#7c3aed);
                      color:#ffffff; padding:16px 40px;
                      text-decoration:none; border-radius:8px;
                      font-size:16px; font-weight:bold;
                      display:inline-block; letter-spacing:0.5px;">
                Accéder à DOUKÈ Compta Pro
            </a>
        </div>

        <!-- AVERTISSEMENT SÉCURITÉ -->
        <div style="background-color:#fffbeb; border-left:4px solid #f59e0b;
                    border-radius:4px; padding:14px 18px; margin:25px 0;">
            <p style="font-size:13px; color:#92400e; margin:0; line-height:1.6;">
                🔒 <strong>Sécurité :</strong> Changez votre mot de passe dès
                votre première connexion. Ne communiquez jamais votre mot de
                passe à quiconque.
            </p>
        </div>

        <p style="font-size:13px; color:#718096; margin:20px 0 0 0;">
            En cas de problème, contactez votre administrateur ou écrivez-nous
            à <a href="mailto:contact@doukegf.bj"
                 style="color:#4f46e5;">contact@doukegf.bj</a>.
        </p>
    `;

    try {
        const result = await resend.emails.send({
            from    : FROM_ADDRESS,
            to      : toEmail,
            subject : `Votre accès à DOUKÈ Compta Pro — ${companyName}`,
            html    : buildBaseHTML(content)
        });

        console.log(`✅ [emailService] Welcome email envoyé à ${toEmail} — ID: ${result.data?.id}`);
        return { success: true, id: result.data?.id };

    } catch (err) {
        console.error(`🚨 [emailService] Échec envoi welcome email à ${toEmail}:`, err.message);
        // Ne pas faire échouer la création de l'utilisateur si l'email échoue
        return { success: false, error: err.message };
    }
};

// =============================================================================
// 2. EMAIL DE RÉINITIALISATION DE MOT DE PASSE
// =============================================================================
exports.sendPasswordResetEmail = async ({
    toEmail,
    toName,
    resetToken,
    companyName
}) => {
    // Le lien pointe vers ton app — pas vers Odoo
    const resetLink = `https://douke-compta-pro.onrender.com/reset-password?token=${resetToken}`;

    const content = `
        <p style="font-size:15px; color:#2d3748; margin:0 0 12px 0;">
            Bonjour <strong>${toName}</strong>,
        </p>

        <p style="font-size:15px; color:#4a5568; line-height:1.7; margin:0 0 25px 0;">
            Vous avez demandé la réinitialisation de votre mot de passe
            sur <strong>DOUKÈ Compta Pro</strong>.
            Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.
        </p>

        <!-- BOUTON RESET -->
        <div style="text-align:center; margin:35px 0;">
            <a href="${resetLink}"
               style="background:linear-gradient(135deg,#dc2626,#b91c1c);
                      color:#ffffff; padding:16px 40px;
                      text-decoration:none; border-radius:8px;
                      font-size:16px; font-weight:bold;
                      display:inline-block;">
                Réinitialiser mon mot de passe
            </a>
        </div>

        <!-- AVERTISSEMENT -->
        <div style="background-color:#fef2f2; border-left:4px solid #dc2626;
                    border-radius:4px; padding:14px 18px; margin:25px 0;">
            <p style="font-size:13px; color:#991b1b; margin:0; line-height:1.6;">
                ⚠️ Ce lien est valable <strong>1 heure</strong> et à usage unique.
                Si vous n'êtes pas à l'origine de cette demande,
                ignorez ce message — votre compte reste sécurisé.
            </p>
        </div>

        <p style="font-size:12px; color:#a0aec0; margin:20px 0 5px 0;">
            Si le bouton ne fonctionne pas, copiez ce lien :
        </p>
        <p style="font-size:12px; color:#4f46e5;
                  word-break:break-all; margin:0;">
            ${resetLink}
        </p>
    `;

    try {
        const result = await resend.emails.send({
            from    : FROM_ADDRESS,
            to      : toEmail,
            subject : 'Réinitialisation de votre mot de passe — DOUKÈ Compta Pro',
            html    : buildBaseHTML(content)
        });

        console.log(`✅ [emailService] Reset email envoyé à ${toEmail} — ID: ${result.data?.id}`);
        return { success: true, id: result.data?.id };

    } catch (err) {
        console.error(`🚨 [emailService] Échec envoi reset email à ${toEmail}:`, err.message);
        return { success: false, error: err.message };
    }
};

// =============================================================================
// 3. EMAIL DE NOTIFICATION ADMIN — Nouvelle connexion
// =============================================================================
exports.sendNewLoginNotification = async ({
    adminEmail,
    adminName,
    userName,
    userEmail,
    companyName,
    ipAddress,
    loginAt
}) => {
    const dateFormatted = new Date(loginAt).toLocaleString('fr-FR', {
        timeZone     : 'Africa/Porto-Novo',
        day          : '2-digit',
        month        : '2-digit',
        year         : 'numeric',
        hour         : '2-digit',
        minute       : '2-digit'
    });

    const content = `
        <p style="font-size:15px; color:#2d3748; margin:0 0 12px 0;">
            Bonjour <strong>${adminName}</strong>,
        </p>

        <p style="font-size:15px; color:#4a5568; line-height:1.7; margin:0 0 20px 0;">
            Une nouvelle connexion a été enregistrée sur
            <strong>DOUKÈ Compta Pro</strong> pour l'entreprise
            <strong>${companyName}</strong>.
        </p>

        <div style="background-color:#f8fafc; border:1px solid #e2e8f0;
                    border-radius:8px; padding:20px 25px; margin:20px 0;">
            <p style="font-size:13px; font-weight:bold; color:#4a5568;
                      margin:0 0 15px 0; text-transform:uppercase;
                      letter-spacing:0.5px;">
                Détails de la connexion
            </p>
            <table style="width:100%; border-collapse:collapse;">
                <tr>
                    <td style="font-size:13px; color:#718096;
                               padding:6px 0; width:40%;">Utilisateur :</td>
                    <td style="font-size:13px; color:#2d3748;
                               font-weight:bold; padding:6px 0;">
                        ${userName}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:6px 0;">
                        Email :
                    </td>
                    <td style="font-size:13px; color:#2d3748; padding:6px 0;">
                        ${userEmail}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:6px 0;">
                        Date et heure :
                    </td>
                    <td style="font-size:13px; color:#2d3748; padding:6px 0;">
                        ${dateFormatted} (heure de Cotonou)
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:6px 0;">
                        Adresse IP :
                    </td>
                    <td style="font-size:13px; color:#2d3748;
                               font-family:monospace; padding:6px 0;">
                        ${ipAddress || 'Non disponible'}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:6px 0;">
                        Entreprise :
                    </td>
                    <td style="font-size:13px; color:#2d3748; padding:6px 0;">
                        ${companyName}
                    </td>
                </tr>
            </table>
        </div>

        <div style="background-color:#fffbeb; border-left:4px solid #f59e0b;
                    border-radius:4px; padding:14px 18px; margin:20px 0;">
            <p style="font-size:13px; color:#92400e; margin:0; line-height:1.6;">
                Si cette connexion ne vous semble pas normale,
                connectez-vous immédiatement et vérifiez les accès de vos utilisateurs.
            </p>
        </div>
    `;

    try {
        const result = await resend.emails.send({
            from    : FROM_ADDRESS,
            to      : adminEmail,
            subject : `🔔 Nouvelle connexion — ${userName} sur ${companyName}`,
            html    : buildBaseHTML(content)
        });

        console.log(`✅ [emailService] Login notification envoyée à ${adminEmail}`);
        return { success: true, id: result.data?.id };

    } catch (err) {
        console.error(`🚨 [emailService] Échec notification login:`, err.message);
        return { success: false, error: err.message };
    }
};

// =============================================================================
// 4. EMAIL DE CONFIRMATION DE CLÔTURE FISCALE
// =============================================================================
exports.sendClosingConfirmationEmail = async ({
    toEmail,
    toName,
    companyName,
    fiscalYear,
    resultAmount,
    resultType,
    moveName,
    lockDate
}) => {
    const amountFormatted = parseFloat(resultAmount).toLocaleString('fr-FR');
    const isProfit        = resultType === 'profit';

    const content = `
        <p style="font-size:15px; color:#2d3748; margin:0 0 12px 0;">
            Bonjour <strong>${toName}</strong>,
        </p>

        <p style="font-size:15px; color:#4a5568; line-height:1.7; margin:0 0 20px 0;">
            La clôture de l'exercice fiscal <strong>${fiscalYear}</strong>
            de <strong>${companyName}</strong> a été finalisée avec succès.
        </p>

        <div style="background-color:#f0fdf4; border:1px solid #86efac;
                    border-radius:8px; padding:20px 25px; margin:20px 0;">
            <p style="font-size:13px; font-weight:bold; color:#166534;
                      margin:0 0 15px 0; text-transform:uppercase;
                      letter-spacing:0.5px;">
                Résumé de la clôture
            </p>
            <table style="width:100%; border-collapse:collapse;">
                <tr>
                    <td style="font-size:13px; color:#718096;
                               padding:6px 0; width:45%;">Exercice :</td>
                    <td style="font-size:13px; color:#2d3748;
                               font-weight:bold; padding:6px 0;">
                        ${fiscalYear}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:6px 0;">
                        Résultat :
                    </td>
                    <td style="font-size:13px; font-weight:bold; padding:6px 0;
                               color:${isProfit ? '#16a34a' : '#dc2626'};">
                        ${isProfit ? 'Bénéfice' : 'Perte'} —
                        ${amountFormatted} XOF
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:6px 0;">
                        Écriture Odoo :
                    </td>
                    <td style="font-size:13px; color:#2d3748;
                               font-family:monospace; padding:6px 0;">
                        ${moveName}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:6px 0;">
                        Lock Date appliqué :
                    </td>
                    <td style="font-size:13px; color:#2d3748; padding:6px 0;">
                        ${lockDate}
                    </td>
                </tr>
            </table>
        </div>

        <div style="background-color:#f0f9ff; border-left:4px solid #0ea5e9;
                    border-radius:4px; padding:14px 18px; margin:20px 0;">
            <p style="font-size:13px; color:#0c4a6e; margin:0; line-height:1.6;">
                ✅ La période est verrouillée. Aucune écriture ne peut être
                créée ou modifiée sur l'exercice ${fiscalYear}.
                La piste d'audit complète est disponible dans DOUKÈ Compta Pro.
            </p>
        </div>
    `;

    try {
        const result = await resend.emails.send({
            from    : FROM_ADDRESS,
            to      : toEmail,
            subject : `✅ Clôture exercice ${fiscalYear} finalisée — ${companyName}`,
            html    : buildBaseHTML(content)
        });

        console.log(`✅ [emailService] Closing confirmation envoyée à ${toEmail}`);
        return { success: true, id: result.data?.id };

    } catch (err) {
        console.error(`🚨 [emailService] Échec confirmation clôture:`, err.message);
        return { success: false, error: err.message };
    }
};

// =============================================================================
// À AJOUTER dans services/emailService.js
// Collez ces deux fonctions AVANT la ligne : module.exports = exports;
// =============================================================================

// =============================================================================
// 5. EMAIL ADMIN — Nouvelle demande d'états financiers
// Appelé depuis : reportsController.js → createRequest → setImmediate
// =============================================================================
exports.sendNewReportRequestEmail = async ({
    adminEmail,
    adminName,
    requesterName,
    requesterEmail,
    requestId,
    companyId,
    accountingSystem,
    periodStart,
    periodEnd
}) => {
    const systemLabels = {
        'SYSCOHADA_NORMAL':  'SYSCOHADA Normal',
        'SYSCOHADA_MINIMAL': 'SYSCOHADA Minimal',
        'SYCEBNL_NORMAL':    'SYCEBNL Normal',
        'SYCEBNL_ALLEGE':    'SYCEBNL Allégé',
        'PCG_FRENCH':        'PCG Français'
    };

    const systemLabel     = systemLabels[accountingSystem] || accountingSystem;
    const requestIdPadded = String(requestId).padStart(5, '0');

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Non spécifiée';
        try {
            return new Date(dateStr).toLocaleDateString('fr-FR', {
                day: '2-digit', month: 'long', year: 'numeric'
            });
        } catch { return dateStr; }
    };

    const content = `
        <p style="font-size:15px; color:#2d3748; margin:0 0 12px 0;">
            Bonjour <strong>${adminName}</strong>,
        </p>

        <p style="font-size:15px; color:#4a5568; line-height:1.7; margin:0 0 20px 0;">
            Une nouvelle demande d'états financiers vient d'être soumise sur
            <strong>DOUKÈ Compta Pro</strong> et attend votre traitement.
        </p>

        <!-- DÉTAILS DE LA DEMANDE -->
        <div style="background-color:#f8fafc; border:1px solid #e2e8f0;
                    border-radius:8px; padding:20px 25px; margin:20px 0;">
            <p style="font-size:13px; font-weight:bold; color:#4a5568;
                      margin:0 0 15px 0; text-transform:uppercase;
                      letter-spacing:0.5px;">
                Détails de la demande #${requestIdPadded}
            </p>
            <table style="width:100%; border-collapse:collapse;">
                <tr>
                    <td style="font-size:13px; color:#718096; padding:7px 0; width:45%;">
                        Demandé par :
                    </td>
                    <td style="font-size:13px; color:#2d3748; font-weight:bold; padding:7px 0;">
                        ${requesterName}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:7px 0;">
                        Email :
                    </td>
                    <td style="font-size:13px; color:#2d3748; padding:7px 0;">
                        ${requesterEmail}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:7px 0;">
                        Système comptable :
                    </td>
                    <td style="font-size:13px; color:#2d3748; font-weight:bold; padding:7px 0;">
                        ${systemLabel}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:7px 0;">
                        Période :
                    </td>
                    <td style="font-size:13px; color:#2d3748; padding:7px 0;">
                        Du ${formatDate(periodStart)} au ${formatDate(periodEnd)}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:7px 0;">
                        Entreprise (ID) :
                    </td>
                    <td style="font-size:13px; color:#2d3748; padding:7px 0;">
                        ${companyId}
                    </td>
                </tr>
            </table>
        </div>

        <!-- BOUTON ACTION -->
        <div style="text-align:center; margin:30px 0;">
            <a href="https://douke-compta-pro.onrender.com"
               style="background:linear-gradient(135deg,#f59e0b,#d97706);
                      color:#ffffff; padding:14px 36px;
                      text-decoration:none; border-radius:8px;
                      font-size:15px; font-weight:bold;
                      display:inline-block; letter-spacing:0.5px;">
                ✏️ Traiter la Demande #${requestIdPadded}
            </a>
        </div>

        <!-- NOTE -->
        <div style="background-color:#fffbeb; border-left:4px solid #f59e0b;
                    border-radius:4px; padding:14px 18px; margin:20px 0;">
            <p style="font-size:13px; color:#92400e; margin:0; line-height:1.6;">
                📋 <strong>Action requise :</strong> Connectez-vous à DOUKÈ Compta Pro,
                accédez aux demandes en attente et traitez cette demande dans les
                <strong>48 heures ouvrées</strong>.
            </p>
        </div>
    `;

    try {
        const result = await resend.emails.send({
            from   : FROM_ADDRESS,
            to     : adminEmail,
            subject: `📋 Nouvelle demande #${requestIdPadded} — ${requesterName} | DOUKÈ Compta Pro`,
            html   : buildBaseHTML(content)
        });

        console.log(`✅ [emailService] sendNewReportRequestEmail envoyé à ${adminEmail} — ID: ${result.data?.id}`);
        return { success: true, id: result.data?.id };

    } catch (err) {
        console.error(`🚨 [emailService] Échec sendNewReportRequestEmail:`, err.message);
        return { success: false, error: err.message };
    }
};

// =============================================================================
// 6. EMAIL CLIENT — Rapport prêt ou envoyé
// Appelé depuis : reportsController.js → generateReports et sendReportsToUser
// =============================================================================
exports.sendReportReadyEmail = async ({
    userEmail,
    userName,
    requestId,
    status
}) => {
    if (!userEmail) {
        console.warn('⚠️ [emailService] sendReportReadyEmail: userEmail manquant — ignoré');
        return { success: false, error: 'userEmail manquant' };
    }

    const requestIdPadded = String(requestId).padStart(5, '0');

    const statusConfig = {
        generated: {
            subject : `⚙️ Vos états financiers sont générés — Demande #${requestIdPadded}`,
            title   : 'Vos États Financiers ont été Générés',
            message : 'Votre demande d\'états financiers a été traitée et les rapports ont été générés. Ils sont en cours de validation par votre collaborateur avant envoi.',
            color   : '#7c3aed',
            icon    : '⚙️',
            badge   : 'En cours de validation',
            badgeBg : '#f3e8ff',
            badgeColor: '#6b21a8'
        },
        sent: {
            subject : `✅ Vos états financiers sont disponibles — Demande #${requestIdPadded}`,
            title   : 'Vos États Financiers sont Disponibles',
            message : 'Votre demande d\'états financiers a été traitée, validée et vos documents sont maintenant disponibles. Connectez-vous à DOUKÈ Compta Pro pour les télécharger.',
            color   : '#059669',
            icon    : '✅',
            badge   : 'Disponible au téléchargement',
            badgeBg : '#f0fdf4',
            badgeColor: '#166534'
        }
    };

    const config = statusConfig[status] || statusConfig['sent'];

    const content = `
        <p style="font-size:15px; color:#2d3748; margin:0 0 12px 0;">
            Bonjour <strong>${userName || 'Cher client'}</strong>,
        </p>

        <p style="font-size:15px; color:#4a5568; line-height:1.7; margin:0 0 20px 0;">
            ${config.message}
        </p>

        <!-- BADGE STATUT -->
        <div style="text-align:center; margin:20px 0;">
            <span style="display:inline-block; background:${config.badgeBg};
                         color:${config.badgeColor}; padding:10px 24px;
                         border-radius:999px; font-size:14px; font-weight:bold;
                         border:1px solid ${config.badgeColor}30;">
                ${config.icon} ${config.badge}
            </span>
        </div>

        <!-- INFOS DEMANDE -->
        <div style="background-color:#f8fafc; border:1px solid #e2e8f0;
                    border-radius:8px; padding:18px 24px; margin:20px 0;">
            <table style="width:100%; border-collapse:collapse;">
                <tr>
                    <td style="font-size:13px; color:#718096; padding:6px 0; width:45%;">
                        Numéro de demande :
                    </td>
                    <td style="font-size:13px; color:#2d3748; font-weight:bold;
                               font-family:monospace; padding:6px 0;">
                        #${requestIdPadded}
                    </td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#718096; padding:6px 0;">
                        Statut :
                    </td>
                    <td style="font-size:13px; font-weight:bold; padding:6px 0;
                               color:${config.color};">
                        ${config.badge}
                    </td>
                </tr>
            </table>
        </div>

        ${status === 'sent' ? `
        <!-- BOUTON TÉLÉCHARGEMENT -->
        <div style="text-align:center; margin:30px 0;">
            <a href="https://douke-compta-pro.onrender.com"
               style="background:linear-gradient(135deg,#059669,#047857);
                      color:#ffffff; padding:14px 36px;
                      text-decoration:none; border-radius:8px;
                      font-size:15px; font-weight:bold;
                      display:inline-block; letter-spacing:0.5px;">
                📥 Télécharger mes Documents
            </a>
        </div>
        ` : `
        <!-- MESSAGE PATIENCE -->
        <div style="text-align:center; margin:30px 0;">
            <a href="https://douke-compta-pro.onrender.com"
               style="background:linear-gradient(135deg,#7c3aed,#6d28d9);
                      color:#ffffff; padding:14px 36px;
                      text-decoration:none; border-radius:8px;
                      font-size:15px; font-weight:bold;
                      display:inline-block; letter-spacing:0.5px;">
                👁️ Suivre ma Demande
            </a>
        </div>
        `}

        <!-- NOTE SÉCURITÉ -->
        <div style="background-color:#f0f9ff; border-left:4px solid #0ea5e9;
                    border-radius:4px; padding:14px 18px; margin:20px 0;">
            <p style="font-size:13px; color:#0c4a6e; margin:0; line-height:1.6;">
                🔒 <strong>Confidentialité :</strong> Vos états financiers sont
                strictement confidentiels et accessibles uniquement depuis votre
                compte sécurisé DOUKÈ Compta Pro.
            </p>
        </div>

        <p style="font-size:13px; color:#718096; margin:20px 0 0 0;">
            Pour toute question, contactez-nous à
            <a href="mailto:contact@doukegf.bj"
               style="color:#4f46e5;">contact@doukegf.bj</a>.
        </p>
    `;

    try {
        const result = await resend.emails.send({
            from   : FROM_ADDRESS,
            to     : userEmail,
            subject: config.subject,
            html   : buildBaseHTML(content)
        });

        console.log(`✅ [emailService] sendReportReadyEmail (${status}) envoyé à ${userEmail} — ID: ${result.data?.id}`);
        return { success: true, id: result.data?.id };

    } catch (err) {
        console.error(`🚨 [emailService] Échec sendReportReadyEmail:`, err.message);
        return { success: false, error: err.message };
    }
};

module.exports = exports;
