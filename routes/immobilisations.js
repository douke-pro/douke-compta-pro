// =============================================================================
// FICHIER : routes/immobilisations.js
// Description : Routes pour le module Immobilisations (SYSCOHADA)
// =============================================================================

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * GET /api/accounting/immobilisations/stats
 * Récupérer les statistiques des immobilisations pour une entreprise
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const { companyId } = req.query;
        
        console.log('📊 [getImmobilisationsStats] Company ID:', companyId);
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID requis'
            });
        }
        
        // ⚠️ VERSION 1.0 - DONNÉES PAR DÉFAUT
        // TODO V2.0 : Récupérer les vraies données depuis Odoo
        // Endpoint Odoo suggéré : account.asset.asset (comptes 20-28)
        
        const stats = {
            total: 0,
            valeur_brute: 0,
            amortissements: 0,
            valeur_nette: 0
        };
        
        console.log('✅ [getImmobilisationsStats] Stats retournées:', stats);
        
        res.json({
            status: 'success',
            data: stats
        });
        
    } catch (error) {
        console.error('❌ [getImmobilisationsStats] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
});

/**
 * GET /api/accounting/immobilisations/list
 * Liste des immobilisations (placeholder V2.0)
 */
router.get('/list', authenticateToken, async (req, res) => {
    try {
        const { companyId } = req.query;
        
        if (!companyId) {
            return res.status(400).json({
                status: 'error',
                message: 'Company ID requis'
            });
        }
        
        // Placeholder pour V2.0
        res.json({
            status: 'success',
            data: [],
            message: 'Fonctionnalité disponible en V2.0 (Q2 2026)'
        });
        
    } catch (error) {
        console.error('❌ [getImmobilisationsList] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur serveur',
            error: error.message
        });
    }
});

/**
 * POST /api/accounting/immobilisations/create
 * Créer une nouvelle immobilisation (placeholder V2.0)
 */
router.post('/create', authenticateToken, async (req, res) => {
    try {
        // Placeholder pour V2.0
        res.json({
            status: 'info',
            message: 'Fonctionnalité disponible en V2.0 (Q2 2026)'
        });
        
    } catch (error) {
        console.error('❌ [createImmobilisation] Erreur:', error);
        res.status(500).json({
            status: 'error',
            message: 'Erreur serveur',
            error: error.message
        });
    }
});

module.exports = router;
