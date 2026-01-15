/**
 * Exécute une méthode de modèle Odoo (execute_kw) via JSON-RPC.
 */
exports.odooExecuteKw = async (params) => {
    // 1. Extraction sécurisée des paramètres
    const { uid, model, method, args = [], kwargs = {} } = params;
    
    // 2. Définition de finalUid (C'est ici que se trouvait l'erreur)
    // On utilise l'UID fourni, sinon l'UID Admin exporté, sinon 2 par défaut.
    const finalUid = parseInt(uid || exports.ADMIN_UID_INT || 2, 10);
    
    // 3. Récupération des secrets depuis la config
    const db = ODOO_DB;
    const password = process.env.ODOO_API_KEY;

    if (!db || !password) {
        throw new Error("Configuration Odoo incomplète (DB ou API_KEY manquante).");
    }

    // 4. Construction du Payload
    const payload = {
        jsonrpc: "2.0",
        method: "call",
        params: {
            service: "object",
            method: "execute_kw",
            // L'ordre Odoo est STRICT : [db, uid, password, model, method, args, kwargs]
            args: [db, finalUid, password, model, method, args, kwargs],
            kwargs: {} // Laisser vide pour le wrapper RPC
        },
        id: new Date().getTime(),
    };

    // 5. Appel de la fonction de base (déclarée plus haut dans votre fichier)
    return executeJsonRpc('/jsonrpc', payload);
};
