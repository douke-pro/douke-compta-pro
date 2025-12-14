const mongoose = require('mongoose');
require('dotenv').config(); // Chargement des variables d'environnement

const connectDB = async () => {
    try {
        // La chaîne de connexion sera dans votre fichier .env (ex: MONGODB_URI)
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        
        console.log(`\n✅ MongoDB Connecté: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Erreur de connexion MongoDB: ${error.message}`);
        // Arrêter l'application en cas d'échec critique de connexion
        process.exit(1); 
    }
};

module.exports = connectDB;
