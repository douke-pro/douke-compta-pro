const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Imports des routes (Vérifiez que ces fichiers existent bien dans /routes)
const authRoutes = require('./routes/auth');      
const companyRoutes = require('./routes/company'); 

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// 1. Servir les fichiers statiques en priorité
app.use(express.static(path.join(__dirname, 'public')));

// 2. Routes API
app.use('/api/auth', authRoutes); 
app.use('/api/companies', companyRoutes);

// 3. LE FIX RADICAL : Middleware de secours au lieu d'une route '*'
// Si aucune route n'a répondu et que ce n'est pas une requête API, on envoie l'index.html
app.use((req, res) => {
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).json({ error: "Route API non trouvée" });
    }
});

app.listen(PORT, () => {
    console.log("=================================================");
    console.log("🚀 DOUKÈ SYSTEM ONLINE - MODE COMPATIBILITÉ V5");
    console.log("=================================================");
});
