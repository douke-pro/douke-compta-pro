// Dossier : config/db.js
const mongoose = require('mongoose');
require('dotenv').config(); 

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        
        console.log(`\n✅ MongoDB Connecté: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Erreur de connexion MongoDB: ${error.message}`);
        process.exit(1); 
    }
};

module.exports = connectDB;
