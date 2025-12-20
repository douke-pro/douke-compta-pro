const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');      
const companyRoutes = require('./routes/company'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [process.env.FRONTEND_URL, /https:\/\/[a-zA-Z0-9-]+\.app\.github\.dev$/],
    credentials: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json()); 

app.use('/api/auth', authRoutes); 
app.use('/api/companies', companyRoutes);

app.get('/', (req, res) => {
    res.send("<h1>🚀 DOUKE Compta Pro API est en ligne !</h1>");
});

app.listen(PORT, () => {
    console.log("=================================================");
    console.log("  DOUKE Compta Pro opérationnel sur le port " + PORT);
    console.log("  Backend : Odoo Cloud");
    console.log("=================================================");
});
