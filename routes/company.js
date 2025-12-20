const express = require('express');
const router = express.Router();

// Route de test pour vérifier la connectivité du module Company
router.get('/status', (req, res) => {
    res.json({ 
        status: "success", 
        message: "Module Company opérationnel" 
    });
});

// @placeholder : Ajoutez ici vos futures routes (ex: /list, /update)

module.exports = router;