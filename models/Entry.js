const mongoose = require('mongoose');

const EntrySchema = new mongoose.Schema({
    // 1. Contexte et Traçabilité (Sécurité)
    companyId: { // Isolation des données
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    journalCode: { // Code du journal (ex: JA, JV, CA)
        type: String,
        required: [true, "Le code journal est requis."],
        trim: true,
    },
    date: {
        type: Date,
        required: [true, "La date de l'écriture est requise."],
    },
    pieceRef: { // Référence de la pièce comptable
        type: String,
        trim: true,
    },
    // 2. Lignes d'Écriture (Débit/Crédit)
    lignes: [{
        compteNumero: { // Compte comptable concerné
            type: Number,
            required: true,
        },
        libelle: {
            type: String,
            required: true,
            trim: true,
        },
        debit: {
            type: Number,
            default: 0,
        },
        credit: {
            type: Number,
            default: 0,
        }
    }],
    // 3. Statut et Workflow (Infaillibilité)
    status: {
        type: String,
        enum: ['en attente', 'validé', 'annulé'],
        default: 'en attente', // Nécessite une validation avant d'affecter les balances
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    validatedBy: { // Utilisateur qui a validé l'écriture
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    }
}, { timestamps: true });

// --- MIDDLEWARE DE VÉRIFICATION AVANT ENREGISTREMENT ---
// CRITIQUE : Assure que Débit = Crédit sur chaque écriture.
EntrySchema.pre('save', function(next) {
    let totalDebit = 0;
    let totalCredit = 0;

    this.lignes.forEach(ligne => {
        totalDebit += ligne.debit;
        totalCredit += ligne.credit;
    });

    // Tolérance infime pour les erreurs d'arrondi
    if (Math.abs(totalDebit - totalCredit) > 0.001) { 
        throw new Error(`Déséquilibre comptable. Débit (${totalDebit}) ≠ Crédit (${totalCredit}). L'écriture est rejetée.`);
    }
    next();
});

// Index pour les rapports (filtre par entreprise et date)
EntrySchema.index({ companyId: 1, date: -1 }); 

module.exports = mongoose.model('Entry', EntrySchema);
