const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, "Le nom de l'entreprise est requis."],
        unique: true,
        trim: true,
    },
    systemeComptable: {
        type: String,
        enum: ['normal', 'minimal'], // SYSCOHADA Normal ou Minimal
        default: 'normal',
    },
    devise: {
        type: String,
        default: 'XOF', // Franc CFA, utilisé dans la zone UEMOA/CEMAC
    },
    dateDebutExercice: {
        type: Date,
        required: [true, "La date de début d'exercice est requise."],
        default: Date.now,
    },
    statut: {
        type: String,
        enum: ['Actif', 'Suspendu', 'Fermé'],
        default: 'Actif',
    },
    // Le créateur de l'entreprise (pour le contrôle d'accès initial)
    administrateurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

// Index unique pour améliorer les performances de recherche par nom
CompanySchema.index({ nom: 1 });

module.exports = mongoose.model('Company', CompanySchema);
