/**
 * Logique de simulation du contenu détaillé d'une Note Annexe.
 * En production, cette fonction irait chercher le contenu et les données spécifiques dans la base de données.
 * @param {number} numero - Numéro de la note selon le SYSCOHADA.
 * @param {string} titre - Titre de la note.
 * @param {Object} data - Données comptables et configuration.
 * @returns {Object} La structure de la note avec son titre et son contenu simulé.
 */
function creerNote(numero, titre, data) {
    let contenu = "Contenu détaillé de la note. ";
    
    // Ajout d'une logique de contenu basée sur le numéro de note le plus courant
    if (numero === 1) {
        contenu += `Cette note décrit les principes et méthodes comptables utilisés par l'entreprise (Système: ${data.config.systeme}).`;
    } else if (numero === 4) {
        contenu += `Tableau de variation des immobilisations corporelles pour l'exercice ${data.config.exercice}.`;
    } else if (numero === 12) {
        contenu += `Détail de la dette financière à la clôture.`;
    }
    
    return {
        numero: numero,
        titre: titre,
        contenu: contenu, // Doit être remplacé par un tableau structuré de données
        conforme: true,
    };
}


/**
 * Génère la liste des Notes Annexes. Le nombre et le type varient selon le système.
 * * @param {Object} dataComptable - Les comptes (Classes 1 à 8) et les montants.
 * @param {Object} config - La configuration (doit contenir config.systeme).
 * @returns {Array} Une liste d'objets structurés représentant les Notes Annexes.
 */
function genererNotesAnnexes(dataComptable, config) {
    const data = { dataComptable, config };
    const notes = [];

    // --- NOTES COMMUNES OU FONDAMENTALES ---
    notes.push(creerNote(1, "Principes et méthodes comptables", data));
    notes.push(creerNote(2, "Capital social", data));
    notes[1].contenu += ` (Capital déclaré : ${dataComptable.capital_social || 'N/A'}).`; // Exemple d'intégration de donnée

    if (config.systeme === 'NORMAL') {
        // --- SYSTÈME NORMAL : LISTE COMPLÈTE (Simulons les 15 premières notes importantes) ---
        notes.push(creerNote(3, "Créances et dettes", data));
        notes.push(creerNote(4, "Immobilisations et Amortissements", data));
        notes.push(creerNote(5, "État des provisions", data));
        notes.push(creerNote(6, "Variation des stocks", data));
        notes.push(creerNote(7, "Détail du Compte de Résultat (Par nature)", data));
        notes.push(creerNote(8, "Engagements hors bilan", data)); // Liaison avec la Classe 0 ou 9
        notes.push(creerNote(9, "Subventions reçues", data));
        notes.push(creerNote(10, "Opérations avec les parties liées", data));
        notes.push(creerNote(11, "Flux de trésorerie (Détails)", data));
        // ... Jusqu'à 40 notes ou plus selon l'activité et le modèle SYSCOHADA choisi
        
        return { systeme: 'NORMAL', notes: notes, nombreTotal: notes.length };
        
    } else if (config.systeme === 'MINIMAL') {
        // --- SYSTÈME MINIMAL : LISTE RÉDUITE ---
        notes.push(creerNote(3, "Créances et dettes agrégées", data));
        notes.push(creerNote(4, "État global des immobilisations", data));
        
        return { systeme: 'MINIMAL', notes: notes, nombreTotal: notes.length };
    } else {
        throw new Error(`Notes Annexes: Le système '${config.systeme}' n'est pas pris en charge.`);
    }
}

module.exports = { genererNotesAnnexes };
