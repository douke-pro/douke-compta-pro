const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // Indispensable pour les chemins
require('dotenv').config();

const authRoutes = require('./routes/auth');      
const companyRoutes = require('./routes/company'); 
const accountingRoutes = require('./routes/accounting'); // On garde notre ajout Syscohada

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CONFIGURATION CORS AMÉLIORÉE
app.use(cors({
    origin: [process.env.FRONTEND_URL, /https:\/\/[a-zA-Z0-9-]+\.app\.github\.dev$/, "http://localhost:3000"],
    credentials: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization', 'x-odoo-password'],
}));

app.use(bodyParser.json()); 

// 2. SERVIR LES FICHIERS STATIQUES (La clé du problème)
// Cela dit à Express que si un fichier est demandé, il faut le chercher dans le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// 3. ROUTES API
app.use('/api/auth', authRoutes); 
app.use('/api/companies', companyRoutes);
app.use('/api/accounting', accountingRoutes);

// 4. ROUTAGE FRONT-END (Le correctif radical)
// On remplace le res.send() par l'envoi du fichier index.html
app.get('(.*)', (req, res) => {
    // Si la requête ne commence pas par /api, on envoie l'interface
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

app.listen(PORT, () => {
    console.log("=================================================");
    console.log("   🚀 DOUKÈ PRO v1.5 : INTERFACE & API ACTIVES");
    console.log(`   🌐 URL : http://localhost:${PORT}`);
    console.log("=================================================");
});
