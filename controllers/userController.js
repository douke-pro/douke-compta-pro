// =============================================================================
// FICHIER : controllers/userController.js
// Description : Récupération des données de session après l'authentification
// =============================================================================

/**
 * Retourne les données de l'utilisateur (issues du JWT) et le dossier actif
 * @route GET /api/user/session-data
 */
exports.getSessionData = async (req, res) => {
    // Les données de l'utilisateur et de la compagnie sélectionnée sont dans req.user
    // grâce au middleware `protect`.

    if (!req.user || !req.user.odooUid) {
        return res.status(401).json({ error: "Session non initialisée." });
    }

    // Dans une application réelle, vous pourriez faire un appel Odoo ici 
    // pour récupérer le nom complet de la compagnie sélectionnée.

    res.status(200).json({
        status: 'success',
        message: 'Données de session récupérées.',
        // Retourne les données du JWT pour que le front-end puisse afficher le tableau de bord
        session: {
            odooUid: req.user.odooUid,
            email: req.user.email,
            role: req.user.role,
            // ATTENTION : Ces champs ne sont pas définis dans middleware/auth.js (4/6).
            // Ils doivent être ajoutés au middleware pour être transmis ici.
            selectedCompanyId: req.user.selectedCompanyId, 
            systeme: req.user.systeme,
        },
        dashboardData: {
             // ... Données de stub pour le tableau de bord
        }
    });
};
