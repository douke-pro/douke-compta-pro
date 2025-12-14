// Dossier : models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    utilisateurNom: {
        type: String,
        required: [true, "Le nom est requis."],
    },
    email: {
        type: String,
        required: [true, 'L\'email est requis.'],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Le mot de passe est requis.'],
        select: false, // Ne jamais renvoyer le hash dans les requêtes par défaut
    },
    utilisateurRole: {
        type: String,
        enum: ['ADMIN', 'COLLABORATEUR', 'USER', 'CAISSIER'],
        default: 'USER',
    },
    entrepriseContextId: {
        type: String, // Temporairement String jusqu'à création du modèle Company
        default: null,
    },
    entreprisesAccessibles: [{ 
        type: String, // Temporairement String
    }],
    multiEntreprise: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

// --- MIDDLEWARE Mongoose : Hachage du mot de passe avant l'enregistrement ---
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// --- MÉTHODE Mongoose : Vérification du mot de passe (login) ---
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
