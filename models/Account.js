const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    numero: {
        type: Number,
        required: [true, "Le numéro de compte est requis."],
        min: [10000000, "Le numéro doit être au moins 8 chiffres (selon SYSCOHADA)."],
        max: [99999999, "Le numéro ne doit pas dépasser 8 chiffres."],
    },
    intitule: {
        type: String,
        required: [true, "L'intitulé du compte est requis."],
        trim: true,
    },
    // Type de compte pour les rapports (Classe 1, Classe 6, etc.)
    classe: {
        type: Number,
        min: 1,
        max: 9,
    },
    // Lié à l'entreprise pour l'isolation sécurisée
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    // MOCK pour les soldes initiaux (à utiliser seulement à l'initialisation)
    soldeInitial: {
        debit: { type: Number, default: 0 },
        credit: { type: Number, default: 0 },
    }
}, { timestamps: true });

// Index composé CRITIQUE: Le numéro de compte doit être unique PAR entreprise.
AccountSchema.index({ companyId: 1, numero: 1 }, { unique: true });

module.exports = mongoose.model('Account', AccountSchema);
