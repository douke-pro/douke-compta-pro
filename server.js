const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');      
const companyRoutes = require('./routes/company'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "*", credentials: true }));
app.use(bodyParser.json()); 

// Dossier statique
app.use(express.static(path.join(__dirname, 'public')));

// API
app.use('/api/auth', authRoutes); 
app.use('/api/companies', companyRoutes);

// LE FIX RÉEL : Utilisation du wildcard compatible Express 5
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log("🚀 DOUKÈ SYSTEM OPERATIONAL");
});
