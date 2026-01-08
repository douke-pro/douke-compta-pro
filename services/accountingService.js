// =============================================================================
// FICHIER : services/accountingService.js (NOUVEAU - Logique Métier Odoo Comptable)
// OBJECTIF : Isoler les appels complexes aux modèles de reporting Odoo.
// =============================================================================

const { odooExecuteKw } = require('./odooService');

// Modèle de rapport Odoo standard pour la Balance de Vérification
const ODOO_REPORT_MODEL = 'account.report';

/**
 * 📊 Récupère la Balance de Vérification à 6 Colonnes (SYSCOHADA) en utilisant le moteur de rapport Odoo.
 * @param {number} odooUid - UID Odoo (Admin ou Utilisateur)
 * @param {number} companyId - ID de la Société Légale (Cloisonnement)
 * @param {string} date_from - Date de début (AAAA-MM-JJ)
 * @param {string} date_to - Date de fin (AAAA-MM-JJ)
 * @returns {Promise<Object>} Les lignes de la Balance générée par Odoo
 */
exports.getSyscohadaBalance = async (odooUid, companyId, date_from, date_to) => {
    // 1. Définition des options du rapport Odoo (Critique pour le moteur de rapport)
    const options = {
        date: {
            date_from: date_from,
            date_to: date_to,
            filter: 'custom',
        },
        company_ids: [companyId], // Filtre crucial pour le moteur de rapport
        initial_balance: true, // Nécessaire pour les 6 colonnes (Soldes antérieurs)
        unfold_all: true,
    };

    try {
        // 2. Chercher l'ID du rapport de Balance de Vérification (Trial Balance)
        const reportDef = await odooExecuteKw({
            uid: odooUid,
            model: ODOO_REPORT_MODEL,
            method: 'search_read',
            // On cherche un rapport dont le nom contient 'Balance' ou 'Trial'
            args: [[['name', 'ilike', 'Balance']]], 
            kwargs: { fields: ['id', 'name'], context: { company_id: companyId } }
        });
        
        if (!reportDef || reportDef.length === 0) {
            throw new Error("Rapport de Balance introuvable dans Odoo (Modele account.report). Veuillez vérifier son installation.");
        }
        
        const reportId = reportDef[0].id;
        
        // 3. Exécuter le rapport
        const result = await odooExecuteKw({
            uid: odooUid,
            model: ODOO_REPORT_MODEL,
            method: 'get_full_informations', 
            args: [reportId, options], 
            // 🔒 Context de sécurité et de travail (Sécurité Multicompany)
            kwargs: { context: { company_id: companyId, allowed_company_ids: [companyId] } } 
        });
        
        return result; 

    } catch (error) {
        console.error("Erreur d'exécution du rapport de Balance :", error.message);
        throw new Error(`Erreur lors de l'exécution de la Balance SYSCOHADA : ${error.message}`);
    }
}

/**
 * 📚 Récupère les lignes du Grand Livre (General Ledger) pour une période.
 * @param {number} odooUid - UID Odoo (Admin ou Utilisateur)
 * @param {number} companyId - ID de la Société Légale (Cloisonnement)
 * @param {string} date_from - Date de début
 * @param {string} date_to - Date de fin
 * @param {number[]} journal_ids - IDs des journaux (optionnel)
 * @returns {Promise<Array>} Les lignes du Grand Livre
 */
exports.getGeneralLedgerLines = async (odooUid, companyId, date_from, date_to, journal_ids = []) => {
    let domain = [
        ['company_id', 'in', [companyId]], // 🔑 FILTRE LÉGAL CRITIQUE
        ['date', '>=', date_from],
        ['date', '<=', date_to],
        ['parent_state', '=', 'posted']
    ];

    if (journal_ids.length > 0) {
        domain.push(['journal_id', 'in', journal_ids]);
    }

    try {
        const lines = await odooExecuteKw({
            uid: odooUid, // UID Admin ou Utilisateur
            model: 'account.move.line',
            method: 'search_read',
            args: [domain],
            kwargs: {
                fields: [
                    'date', 'ref', 'move_name', 'account_id', 'partner_id', 
                    'name', 'debit', 'credit', 'balance', 'analytic_distribution'
                ],
                order: 'account_id asc, date asc, move_name asc',
                context: { company_id: companyId } // Contexte de travail
            }
        });
        
        return lines;
        
    } catch (error) {
        console.error("Erreur de récupération du Grand Livre :", error.message);
        throw new Error(`Échec de la communication Odoo pour le Grand Livre : ${error.message}`);
    }
}
