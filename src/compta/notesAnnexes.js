'use strict';

/**
 * ================================================================
 * GÉNÉRATEUR DES NOTES ANNEXES SYSCOHADA — VERSION CORRIGÉE
 * ================================================================
 * L'ancienne version de ce fichier générait un texte générique
 * simulé ("Contenu détaillé de la note...") pour seulement 9 des
 * 35 notes officielles, avec des titres non conformes au modèle DGI.
 *
 * Cette version :
 *  1. Couvre les 35 notes officielles (+ sous-notes A/B/C/D/E),
 *     à partir du catalogue structurel exact (`notesAnnexesData.js`).
 *  2. Restitue pour chaque note son titre officiel et la liste
 *     exacte de ses lignes/rubriques, dans l'ordre du modèle DGI.
 *  3. Pré-remplit automatiquement les montants pour les notes qui
 *     peuvent être déduites directement des états déjà calculés
 *     (ex : Note 13 Capital, Note 21 Chiffre d'affaires...) — les
 *     autres notes restent éditables par l'utilisateur (informations
 *     qualitatives, tableaux de mouvements détaillés nécessitant des
 *     données non disponibles dans la seule balance générale).
 * ================================================================
 */

const { NOTES_CATALOGUE, ORDRE_NOTES } = require('./notesAnnexesData');

/**
 * Notes pour lesquelles un pré-remplissage automatique simple est
 * possible directement depuis les lignes déjà calculées du Bilan /
 * Compte de Résultat (mapping note officielle <-> refs de l'état).
 * Les autres notes restent des tableaux/canevas vides à compléter
 * (comme dans le modèle Excel officiel, qui attend une saisie
 * manuelle pour beaucoup de rubriques : mouvements de l'exercice,
 * informations qualitatives, engagements hors bilan, etc.)
 */
const AUTO_FILL_SOURCE = {
    '4':  { source: 'actif',  refs: ['AQ', 'AR', 'AS'] },           // Immobilisations financières
    '5':  { source: 'actif',  refs: ['BA'] },                        // Actif circulant HAO
    '6':  { source: 'actif',  refs: ['BB'] },                        // Stocks et en cours
    '7':  { source: 'actif',  refs: ['BI'] },                        // Clients
    '8':  { source: 'actif',  refs: ['BJ'] },                        // Autres créances
    '9':  { source: 'actif',  refs: ['BQ'] },                        // Titres de placement
    '10': { source: 'actif',  refs: ['BR'] },                        // Valeurs à encaisser
    '11': { source: 'actif',  refs: ['BS'] },                        // Disponibilités
    '13': { source: 'passif', refs: ['CA', 'CB'] },                  // Capital
    '14': { source: 'passif', refs: ['CD', 'CE', 'CF', 'CG', 'CH'] },// Primes et réserves
    '15A':{ source: 'passif', refs: ['CL', 'CM'] },                  // Subventions / provisions réglementées
    '16A':{ source: 'passif', refs: ['DA', 'DB', 'DC'] },            // Dettes financières
    '17': { source: 'passif', refs: ['DJ'] },                        // Fournisseurs d'exploitation
    '18': { source: 'passif', refs: ['DK'] },                        // Dettes fiscales et sociales
    '19': { source: 'passif', refs: ['DM', 'DN'] },                  // Autres dettes
    '20': { source: 'passif', refs: ['DQ', 'DR'] },                  // Banques, crédits
    '21': { source: 'resultat', refs: ['TA', 'TB', 'TC', 'TD', 'TE', 'TF', 'TG', 'TH'] }, // CA et autres produits
    '22': { source: 'resultat', refs: ['RA', 'RC', 'RE'] },          // Achats
    '23': { source: 'resultat', refs: ['RG'] },                      // Transports
    '24': { source: 'resultat', refs: ['RH'] },                      // Services extérieurs
    '25': { source: 'resultat', refs: ['RI'] },                      // Impôts et taxes
    '26': { source: 'resultat', refs: ['RJ'] },                      // Autres charges
    '27A':{ source: 'resultat', refs: ['RK'] },                      // Charges de personnel
    '29': { source: 'resultat', refs: ['TK', 'RM'] },                // Charges et revenus financiers
    '30': { source: 'resultat', refs: ['TO', 'RP', 'RQ'] },          // Autres charges et produits HAO
};

function extraireMontants(etats, def) {
    const { source, refs } = def;
    const collection = etats[source] || [];
    const out = {};
    for (const ref of refs) {
        const ligne = collection.find(l => l.ref === ref);
        if (ligne) {
            out[ref] = {
                libelle: ligne.libelle,
                montant: ligne.net !== undefined ? ligne.net : (ligne.montant_n !== undefined ? ligne.montant_n : 0),
            };
        }
    }
    return out;
}

/**
 * Construit une note unique à partir du catalogue officiel.
 * @param {string} code - code de la note ("1", "3A", "16B BIS"...)
 * @param {Object} etats - { actif, passif, resultat } déjà calculés (via syscohadaMapper)
 * @param {Object} config - configuration entreprise/exercice
 */
function construireNote(code, etats, config) {
    const def = NOTES_CATALOGUE[code];
    if (!def) {
        throw new Error(`Note ${code} inconnue dans le catalogue SYSCOHADA.`);
    }

    const note = {
        code: def.code,
        titre: def.titre,
        lignes: def.lignes.map(libelle => ({ libelle, montant_n: null, montant_n1: null })),
        montantsAutomatiques: null,
        saisieLibre: !AUTO_FILL_SOURCE[code], // notes purement qualitatives/mouvements -> saisie manuelle attendue
    };

    const autoFill = AUTO_FILL_SOURCE[code];
    if (autoFill && etats) {
        note.montantsAutomatiques = extraireMontants(etats, autoFill);
    }

    return note;
}

/**
 * Génère l'ensemble des notes annexes conformément au SYSCOHADA révisé.
 * @param {Object} etats - { actif, passif, resultat } (sorties de computeActif/computePassif/computeResultat)
 * @param {Object} config - { systeme: 'NORMAL' | 'MINIMAL', exercice, entrepriseId }
 * @returns {Object} { systeme, notes: [...], nombreTotal }
 */
function genererNotesAnnexes(etats, config) {
    if (!config || !config.systeme) {
        throw new Error("Notes Annexes: configuration manquante (systeme requis).");
    }

    if (config.systeme === 'NORMAL') {
        const notes = ORDRE_NOTES.map(code => construireNote(code, etats, config));
        return { systeme: 'NORMAL', notes, nombreTotal: notes.length };
    }

    if (config.systeme === 'MINIMAL') {
        // Le système minimal de trésorerie (SMT) utilise un jeu de notes réduit.
        // Les notes structurelles les plus significatives sont conservées.
        const codesMinimal = ['1', '2', '3A', '3C', '6', '7', '8', '13', '14', '17', '18', '21', '22'];
        const notes = codesMinimal.map(code => construireNote(code, etats, config));
        return { systeme: 'MINIMAL', notes, nombreTotal: notes.length };
    }

    throw new Error(`Notes Annexes: le système '${config.systeme}' n'est pas pris en charge.`);
}

module.exports = { genererNotesAnnexes, construireNote };

