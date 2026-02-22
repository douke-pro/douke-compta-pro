// ============================================
// SERVICE : Extraction Données Odoo
// Description : Extraction et calcul des données comptables depuis Odoo 19
// Normes : SYSCOHADA, SYCEBNL, PCG
// ============================================

const { odooExecuteKw } = require('./odooService');
const ADMIN_UID = parseInt(process.env.ODOO_ADMIN_UID, 10);

/**
 * ============================================
 * MAPPING DES COMPTES SYSCOHADA RÉVISÉ
 * Référence : Guide d'application SYSCOHADA pages 345-396
 * ============================================
 */
const SYSCOHADA_ACCOUNTS = {
    // ACTIF - BILAN
    ACTIF: {
        // ACTIF IMMOBILISÉ (Classe 2)
        IMMOBILISATIONS_INCORPORELLES: {
            codes: ['201', '202', '203', '204', '205', '206', '207', '208'],
            label: 'Immobilisations incorporelles'
        },
        IMMOBILISATIONS_CORPORELLES: {
            codes: ['211', '212', '213', '214', '215', '218', '221', '222', '223', '224', '225', '226', '228', '231', '232', '233', '234', '235', '237', '238', '241', '244', '245', '246'],
            label: 'Immobilisations corporelles'
        },
        AVANCES_ACOMPTES_IMMOBILISATIONS: {
            codes: ['251', '252', '253'],
            label: 'Avances et acomptes versés sur immobilisations'
        },
        IMMOBILISATIONS_FINANCIERES: {
            codes: ['26', '271', '272', '273', '274', '275', '276', '277'],
            label: 'Immobilisations financières'
        },
        
        // ACTIF CIRCULANT (Classes 3, 4, 5)
        STOCKS: {
            codes: ['31', '32', '33', '34', '35', '36', '37', '38'],
            label: 'Stocks et en-cours'
        },
        CREANCES_CLIENTS: {
            codes: ['411', '4111', '4112', '4116', '4117', '4118', '412', '413', '414', '415', '416', '417', '418'],
            label: 'Clients et comptes rattachés'
        },
        AUTRES_CREANCES: {
            codes: ['421', '422', '425', '428', '431', '438', '441', '442', '443', '444', '445', '446', '447', '448', '451', '452', '453', '454', '455', '456', '458'],
            label: 'Autres créances'
        },
        
        // TRÉSORERIE-ACTIF (Classe 5)
        DISPONIBILITES: {
            codes: ['521', '522', '523', '524', '525', '526', '527', '528', '531', '532', '541', '542', '561', '562', '571', '572'],
            label: 'Trésorerie-Actif'
        }
    },
    
    // PASSIF - BILAN
    PASSIF: {
        // CAPITAUX PROPRES ET RESSOURCES ASSIMILÉES (Classe 1)
        CAPITAL: {
            codes: ['101', '1011', '1012', '1013', '1014', '102', '103', '104', '105', '106', '108', '109'],
            label: 'Capital et primes'
        },
        RESERVES: {
            codes: ['111', '112', '113', '114', '115', '116', '117', '118', '119'],
            label: 'Réserves'
        },
        REPORT_A_NOUVEAU: {
            codes: ['121', '129'],
            label: 'Report à nouveau'
        },
        RESULTAT_NET_EXERCICE: {
            codes: ['130', '131'],
            label: 'Résultat net de l\'exercice'
        },
        SUBVENTIONS_INVESTISSEMENT: {
            codes: ['141', '142', '143', '144', '145', '146', '148'],
            label: 'Subventions d\'investissement'
        },
        PROVISIONS_REGLEMENTEES: {
            codes: ['151', '152', '153', '154', '155', '156', '157', '158'],
            label: 'Provisions réglementées'
        },
        EMPRUNTS_DETTES_ASSIMILEES: {
            codes: ['161', '162', '163', '164', '165', '166', '167', '168', '171', '172', '173', '174', '175', '176', '177', '178', '181', '182', '183', '184', '185', '186', '187', '188'],
            label: 'Emprunts et dettes assimilées'
        },
        
        // DETTES FINANCIÈRES ET RESSOURCES ASSIMILÉES (suite Classe 1)
        DETTES_FINANCIERES_DIVERSES: {
            codes: ['191', '192', '193', '194', '195', '196', '197', '198'],
            label: 'Dettes financières diverses'
        },
        
        // PASSIF CIRCULANT (Classes 4)
        DETTES_FOURNISSEURS: {
            codes: ['401', '4011', '4012', '4016', '4017', '4018', '402', '403', '404', '405', '408'],
            label: 'Fournisseurs et comptes rattachés'
        },
        DETTES_FISCALES_SOCIALES: {
            codes: ['421', '422', '423', '424', '425', '426', '427', '428', '431', '432', '433', '438', '441', '442', '443', '444', '445', '446', '447', '448'],
            label: 'Dettes fiscales et sociales'
        },
        AUTRES_DETTES: {
            codes: ['451', '452', '453', '454', '455', '456', '457', '458', '471', '472', '473', '474', '475', '476', '477', '478'],
            label: 'Autres dettes'
        },
        
        // TRÉSORERIE-PASSIF (Classe 5)
        TRESORERIE_PASSIF: {
            codes: ['561', '562', '564', '565', '566'],
            label: 'Trésorerie-Passif'
        }
    },
    
    // COMPTE DE RÉSULTAT
    CHARGES: {
        // CHARGES D'EXPLOITATION (Classe 6)
        ACHATS_MARCHANDISES: {
            codes: ['601', '602', '6031', '6032', '6033'],
            label: 'Achats de marchandises'
        },
        VARIATION_STOCKS_MARCHANDISES: {
            codes: ['6031'],
            label: 'Variation des stocks de marchandises'
        },
        ACHATS_MATIERES_FOURNITURES: {
            codes: ['604', '605', '608'],
            label: 'Achats de matières premières et fournitures'
        },
        AUTRES_ACHATS: {
            codes: ['606', '607', '608'],
            label: 'Autres achats'
        },
        TRANSPORTS: {
            codes: ['61', '611', '612', '613', '614', '616', '618'],
            label: 'Transports'
        },
        SERVICES_EXTERIEURS_A: {
            codes: ['621', '622', '623', '624', '625', '626', '627', '628'],
            label: 'Services extérieurs A'
        },
        SERVICES_EXTERIEURS_B: {
            codes: ['631', '632', '633', '634', '635', '636', '637', '638'],
            label: 'Services extérieurs B'
        },
        IMPOTS_TAXES: {
            codes: ['641', '642', '643', '644', '645', '646', '647', '648'],
            label: 'Impôts et taxes'
        },
        AUTRES_CHARGES: {
            codes: ['651', '652', '653', '654', '658'],
            label: 'Autres charges'
        },
        CHARGES_PERSONNEL: {
            codes: ['661', '662', '663', '664', '665', '666', '667', '668'],
            label: 'Charges de personnel'
        },
        DOTATIONS_AMORTISSEMENTS: {
            codes: ['681', '6811', '6812', '6813', '6814', '6815', '6816'],
            label: 'Dotations aux amortissements'
        },
        DOTATIONS_PROVISIONS: {
            codes: ['691', '6911', '6912', '6913', '6914', '6915', '6916', '6917', '6918'],
            label: 'Dotations aux provisions'
        },
        
        // CHARGES FINANCIÈRES (Classe 67)
        CHARGES_FINANCIERES: {
            codes: ['671', '672', '673', '674', '675', '676', '677', '678'],
            label: 'Charges financières et assimilées'
        },
        
        // CHARGES HAO (Hors Activités Ordinaires)
        CHARGES_HAO: {
            codes: ['811', '812', '813', '814', '816', '818', '821', '822', '831', '832', '835', '836', '841', '845', '846', '848', '851', '852', '853', '854', '855', '858'],
            label: 'Charges HAO'
        },
        
        // PARTICIPATION ET IMPÔTS
        PARTICIPATION_SALARIES: {
            codes: ['87'],
            label: 'Participation des salariés'
        },
        IMPOTS_BENEFICES: {
            codes: ['891', '892', '893', '899'],
            label: 'Impôts sur le résultat'
        }
    },
    
    PRODUITS: {
        // PRODUITS D'EXPLOITATION (Classe 7)
        VENTES_MARCHANDISES: {
            codes: ['701', '702', '703', '704', '705', '706'],
            label: 'Ventes de marchandises'
        },
        VENTES_PRODUITS_FINIS: {
            codes: ['711', '712', '713', '714', '715', '716'],
            label: 'Ventes de produits finis'
        },
        VENTES_PRODUITS_INTERMEDIAIRES: {
            codes: ['721', '722', '723', '724'],
            label: 'Ventes de produits intermédiaires'
        },
        TRAVAUX_SERVICES_VENDUS: {
            codes: ['73', '731', '732', '733', '734', '735', '736', '737', '738'],
            label: 'Travaux, services vendus'
        },
        PRODUCTION_IMMOBILISEE: {
            codes: ['741', '742', '743', '744'],
            label: 'Production immobilisée'
        },
        SUBVENTIONS_EXPLOITATION: {
            codes: ['751', '752', '753', '754', '758'],
            label: 'Subventions d\'exploitation'
        },
        AUTRES_PRODUITS: {
            codes: ['754', '758'],
            label: 'Autres produits'
        },
        REPRISES_PROVISIONS: {
            codes: ['791', '7911', '7912', '7913', '7914', '7915', '7916', '7917', '7918'],
            label: 'Reprises de provisions'
        },
        TRANSFERTS_CHARGES: {
            codes: ['781', '782', '783', '784', '785', '786', '787', '788'],
            label: 'Transferts de charges'
        },
        
        // PRODUITS FINANCIERS (Classe 77)
        PRODUITS_FINANCIERS: {
            codes: ['771', '772', '773', '774', '775', '776', '777', '778'],
            label: 'Revenus financiers et assimilés'
        },
        
        // PRODUITS HAO
        PRODUITS_HAO: {
            codes: ['811', '812', '813', '814', '815', '816', '817', '818', '821', '822', '845', '846', '848', '865', '866', '868'],
            label: 'Produits HAO'
        }
    }
};

/**
 * ============================================
 * MAPPING DES COMPTES SYCEBNL (Entités à But Non Lucratif)
 * Référence : Guide SYCEBNL
 * ============================================
 */
const SYCEBNL_ACCOUNTS = {
    // Structure similaire à SYSCOHADA mais adaptée aux EBNL
    ACTIF: {
        IMMOBILISATIONS_INCORPORELLES: {
            codes: ['201', '202', '203', '204', '205', '206', '207', '208'],
            label: 'Immobilisations incorporelles'
        },
        IMMOBILISATIONS_CORPORELLES: {
            codes: ['21', '22', '23', '24'],
            label: 'Immobilisations corporelles'
        },
        STOCKS: {
            codes: ['31', '32', '33', '34', '35', '36', '37', '38'],
            label: 'Stocks'
        },
        CREANCES: {
            codes: ['41', '42', '43', '44', '45', '46', '47'],
            label: 'Créances'
        },
        DISPONIBILITES: {
            codes: ['51', '52', '53', '54', '55', '56', '57'],
            label: 'Disponibilités'
        }
    },
    
    PASSIF: {
        FONDS_ASSOCIATIFS: {
            codes: ['101', '102', '103', '104', '105', '106'],
            label: 'Fonds associatifs sans droit de reprise'
        },
        FONDS_AVEC_DROIT_REPRISE: {
            codes: ['111', '112', '113'],
            label: 'Fonds avec droit de reprise'
        },
        ECARTS_REEVALUATION: {
            codes: ['121', '122'],
            label: 'Écarts de réévaluation'
        },
        RESERVES: {
            codes: ['131', '132', '133', '134', '135', '136'],
            label: 'Réserves'
        },
        REPORT_A_NOUVEAU: {
            codes: ['141'],
            label: 'Report à nouveau'
        },
        RESULTAT_NET: {
            codes: ['151'],
            label: 'Résultat net de l\'exercice'
        },
        SUBVENTIONS_INVESTISSEMENT: {
            codes: ['161', '162', '163'],
            label: 'Subventions d\'investissement'
        },
        PROVISIONS_REGLEMENTEES: {
            codes: ['171', '172', '173'],
            label: 'Provisions réglementées'
        },
        DETTES_FINANCIERES: {
            codes: ['16', '17', '18', '19'],
            label: 'Dettes financières'
        },
        DETTES_FOURNISSEURS: {
            codes: ['401', '402', '403', '404', '405'],
            label: 'Dettes fournisseurs'
        },
        AUTRES_DETTES: {
            codes: ['42', '43', '44', '45', '46', '47'],
            label: 'Autres dettes'
        }
    },
    
    // Compte de résultat EBNL
    EMPLOIS: {
        EMPLOIS_MISSION_SOCIALE: {
            codes: ['601', '602', '603', '604', '605', '606', '607', '608', '61', '62', '63', '64', '65', '66'],
            label: 'Emplois de la mission sociale'
        },
        EMPLOIS_RECHERCHE_FONDS: {
            codes: ['671', '672', '673'],
            label: 'Emplois de recherche de fonds'
        },
        EMPLOIS_FONCTIONNEMENT: {
            codes: ['681', '682', '683', '684', '685'],
            label: 'Emplois de fonctionnement'
        },
        CHARGES_FINANCIERES: {
            codes: ['691', '692', '693'],
            label: 'Charges financières'
        },
        CHARGES_EXCEPTIONNELLES: {
            codes: ['81', '82', '83', '84', '85'],
            label: 'Charges exceptionnelles'
        }
    },
    
    RESSOURCES: {
        COTISATIONS: {
            codes: ['701', '702', '703'],
            label: 'Cotisations'
        },
        DONS_MANUELS: {
            codes: ['711', '712', '713'],
            label: 'Dons manuels'
        },
        SUBVENTIONS_FONCTIONNEMENT: {
            codes: ['721', '722', '723', '724'],
            label: 'Subventions de fonctionnement'
        },
        VENTES_PRESTATIONS: {
            codes: ['731', '732', '733', '734', '735'],
            label: 'Ventes et prestations de services'
        },
        PRODUITS_FINANCIERS: {
            codes: ['741', '742', '743'],
            label: 'Produits financiers'
        },
        PRODUITS_EXCEPTIONNELS: {
            codes: ['81', '82', '83', '84', '85'],
            label: 'Produits exceptionnels'
        }
    }
};

/**
 * ============================================
 * MAPPING PCG FRANÇAIS (Plan Comptable Général)
 * Référence : PCG 2025
 * ============================================
 */
const PCG_ACCOUNTS = {
    ACTIF: {
        IMMOBILISATIONS_INCORPORELLES: {
            codes: ['201', '203', '205', '206', '207', '208'],
            label: 'Immobilisations incorporelles'
        },
        IMMOBILISATIONS_CORPORELLES: {
            codes: ['211', '212', '213', '214', '215', '218'],
            label: 'Immobilisations corporelles'
        },
        IMMOBILISATIONS_FINANCIERES: {
            codes: ['261', '266', '267', '268', '269', '271', '272', '273', '274', '275', '276', '277', '279'],
            label: 'Immobilisations financières'
        },
        STOCKS: {
            codes: ['31', '32', '33', '34', '35', '37'],
            label: 'Stocks et en-cours'
        },
        CREANCES_EXPLOITATION: {
            codes: ['409', '411', '413', '416', '417', '418'],
            label: 'Créances d\'exploitation'
        },
        AUTRES_CREANCES: {
            codes: ['425', '427', '4282', '431', '437', '4386', '441', '443', '444', '445', '446', '447', '448', '450', '451', '455', '456', '458'],
            label: 'Autres créances'
        },
        VALEURS_MOBILIERES_PLACEMENT: {
            codes: ['50', '501', '502', '503', '504', '505', '506', '507', '508', '509'],
            label: 'Valeurs mobilières de placement'
        },
        DISPONIBILITES: {
            codes: ['511', '512', '514', '515', '516', '517', '518', '519', '53'],
            label: 'Disponibilités'
        }
    },
    
    PASSIF: {
        CAPITAL: {
            codes: ['101', '1012', '1013', '1016', '1017', '1018'],
            label: 'Capital social'
        },
        PRIMES: {
            codes: ['1041', '1042', '1043', '1044'],
            label: 'Primes liées au capital'
        },
        RESERVES: {
            codes: ['1061', '1062', '1063', '1064', '1068'],
            label: 'Réserves'
        },
        REPORT_A_NOUVEAU: {
            codes: ['110', '119'],
            label: 'Report à nouveau'
        },
        RESULTAT_EXERCICE: {
            codes: ['120', '129'],
            label: 'Résultat de l\'exercice'
        },
        SUBVENTIONS_INVESTISSEMENT: {
            codes: ['131', '138'],
            label: 'Subventions d\'investissement'
        },
        PROVISIONS_REGLEMENTEES: {
            codes: ['142', '143', '144', '145', '146'],
            label: 'Provisions réglementées'
        },
        PROVISIONS_RISQUES_CHARGES: {
            codes: ['151', '153', '155', '156', '157', '158'],
            label: 'Provisions pour risques et charges'
        },
        EMPRUNTS_OBLIGATAIRES: {
            codes: ['161', '163', '164', '165', '166', '167', '168', '169'],
            label: 'Emprunts obligataires convertibles'
        },
        AUTRES_EMPRUNTS: {
            codes: ['164', '165', '166', '167', '168'],
            label: 'Autres emprunts et dettes assimilées'
        },
        DETTES_FOURNISSEURS: {
            codes: ['401', '403', '404', '405', '408'],
            label: 'Dettes fournisseurs et comptes rattachés'
        },
        DETTES_FISCALES_SOCIALES: {
            codes: ['421', '422', '424', '425', '426', '427', '428', '431', '437', '4386', '441', '442', '443', '444', '445', '446', '447', '448'],
            label: 'Dettes fiscales et sociales'
        },
        AUTRES_DETTES: {
            codes: ['451', '455', '456', '457', '458', '462', '464', '465', '467', '468'],
            label: 'Autres dettes'
        },
        CONCOURS_BANCAIRES: {
            codes: ['519'],
            label: 'Concours bancaires courants'
        }
    },
    
    CHARGES: {
        ACHATS: {
            codes: ['601', '602', '603', '604', '605', '606', '607', '608', '609'],
            label: 'Achats'
        },
        SERVICES_EXTERIEURS: {
            codes: ['61', '62'],
            label: 'Services extérieurs'
        },
        IMPOTS_TAXES: {
            codes: ['63'],
            label: 'Impôts, taxes et versements assimilés'
        },
        CHARGES_PERSONNEL: {
            codes: ['641', '644', '645', '646', '647', '648'],
            label: 'Charges de personnel'
        },
        AUTRES_CHARGES_GESTION: {
            codes: ['651', '653', '654', '655', '658'],
            label: 'Autres charges de gestion courante'
        },
        CHARGES_FINANCIERES: {
            codes: ['661', '664', '665', '666', '667', '668'],
            label: 'Charges financières'
        },
        CHARGES_EXCEPTIONNELLES: {
            codes: ['671', '672', '675', '678'],
            label: 'Charges exceptionnelles'
        },
        DOTATIONS_AMORTISSEMENTS: {
            codes: ['681'],
            label: 'Dotations aux amortissements et aux provisions'
        },
        IMPOTS_BENEFICES: {
            codes: ['695', '696', '697', '698', '699'],
            label: 'Impôts sur les bénéfices'
        }
    },
    
    PRODUITS: {
        VENTES: {
            codes: ['701', '702', '703', '704', '705', '706', '707', '708', '709'],
            label: 'Ventes de produits fabriqués, prestations de services, marchandises'
        },
        PRODUCTION_STOCKEE: {
            codes: ['713', '714', '715'],
            label: 'Variation des stocks'
        },
        PRODUCTION_IMMOBILISEE: {
            codes: ['721', '722'],
            label: 'Production immobilisée'
        },
        SUBVENTIONS_EXPLOITATION: {
            codes: ['74'],
            label: 'Subventions d\'exploitation'
        },
        AUTRES_PRODUITS_GESTION: {
            codes: ['751', '752', '753', '754', '755', '758'],
            label: 'Autres produits de gestion courante'
        },
        PRODUITS_FINANCIERS: {
            codes: ['761', '762', '763', '764', '765', '766', '767', '768'],
            label: 'Produits financiers'
        },
        PRODUITS_EXCEPTIONNELS: {
            codes: ['771', '772', '775', '777', '778'],
            label: 'Produits exceptionnels'
        },
        REPRISES_PROVISIONS: {
            codes: ['781', '786', '787'],
            label: 'Reprises sur amortissements et provisions'
        }
    }
};

/**
 * ============================================
 * FONCTIONS UTILITAIRES
 * ============================================
 */

/**
 * Récupérer la configuration des comptes selon le système comptable
 */
function getAccountsConfig(accountingSystem) {
    if (accountingSystem.startsWith('SYSCOHADA')) {
        return SYSCOHADA_ACCOUNTS;
    } else if (accountingSystem.startsWith('SYCEBNL')) {
        return SYCEBNL_ACCOUNTS;
    } else if (accountingSystem === 'PCG_FRENCH') {
        return PCG_ACCOUNTS;
    }
    throw new Error(`Système comptable non supporté: ${accountingSystem}`);
}

/**
 * Vérifier si un code de compte correspond à une catégorie
 */
function matchesAccountCode(accountCode, categoryCodes) {
    return categoryCodes.some(code => accountCode.startsWith(code));
}

/**
 * Calculer le solde d'une liste de lignes comptables
 */
function calculateBalance(lines) {
    return lines.reduce((sum, line) => {
        return sum + (line.debit || 0) - (line.credit || 0);
    }, 0);
}

/**
 * Grouper les lignes par catégorie de compte
 */
function groupLinesByCategory(lines, categories) {
    const grouped = {};
    
    for (const [categoryKey, categoryConfig] of Object.entries(categories)) {
        grouped[categoryKey] = {
            label: categoryConfig.label,
            codes: categoryConfig.codes,
            lines: lines.filter(line => 
                matchesAccountCode(line.account_code, categoryConfig.codes)
            ),
            balance: 0
        };
        
        grouped[categoryKey].balance = calculateBalance(grouped[categoryKey].lines);
    }
    
    return grouped;
}

/**
 * ============================================
 * SERVICE PRINCIPAL
 * ============================================
 */

class OdooReportsService {
    
    /**
     * Extraire toutes les données financières depuis Odoo
     */
    async extractFinancialData(companyId, periodStart, periodEnd, accountingSystem) {
        try {
            console.log(`[OdooReportsService] Extraction données pour entreprise ${companyId}`);
            console.log(`[OdooReportsService] Période: ${periodStart} - ${periodEnd}`);
            console.log(`[OdooReportsService] Système: ${accountingSystem}`);
            
            // 1. Récupérer les informations de l'entreprise
            const companyInfo = await this.getCompanyInfo(companyId);
            
            // 2. Récupérer toutes les écritures comptables de la période
            const accountMoves = await this.getAccountMoves(companyId, periodStart, periodEnd);
            
            // 3. Récupérer toutes les lignes d'écritures
            const accountMoveLines = await this.getAccountMoveLines(accountMoves);
            
            // 4. Récupérer le plan comptable
            const chartOfAccounts = await this.getChartOfAccounts(companyId);
            
            // 5. Enrichir les lignes avec les infos des comptes
            const enrichedLines = this.enrichMoveLinesWithAccounts(accountMoveLines, chartOfAccounts);
            
            // 6. Calculer le bilan
            const bilanData = await this.calculateBilan(enrichedLines, accountingSystem);
            
            // 7. Calculer le compte de résultat
            const compteResultatData = await this.calculateCompteResultat(enrichedLines, accountingSystem);
            
            // 8. Calculer les flux de trésorerie (TFT)
            const tftData = await this.calculateTableauFluxTresorerie(enrichedLines, accountingSystem);
            
            // 9. Préparer les données pour les annexes
            const annexesData = await this.prepareAnnexesData(
                enrichedLines, 
                companyInfo, 
                accountingSystem,
                periodStart,
                periodEnd
            );
            
            // 10. Retourner toutes les données structurées
            return {
                company: companyInfo,
                period: {
                    start: periodStart,
                    end: periodEnd
                },
                accounting_system: accountingSystem,
                bilan: bilanData,
                compte_resultat: compteResultatData,
                tableau_flux_tresorerie: tftData,
                annexes: annexesData,
                raw_data: {
                    moves: accountMoves,
                    move_lines: enrichedLines,
                    chart_of_accounts: chartOfAccounts
                }
            };
            
        } catch (error) {
            console.error('[OdooReportsService] Erreur extraction:', error);
            throw new Error(`Erreur lors de l'extraction des données Odoo: ${error.message}`);
        }
    }
    
    /**
     * Récupérer les informations de l'entreprise
     */
    async getCompanyInfo(companyId) {
        try {
            const companies = await odoo.execute_kw(
                'res.company',
                'search_read',
                [[['id', '=', companyId]]],
                {
                    fields: [
                        'name', 
                        'street', 
                        'city', 
                        'zip', 
                        'country_id', 
                        'phone', 
                        'email', 
                        'website',
                        'vat',
                        'company_registry',
                        'currency_id'
                    ]
                }
            );
            
            if (!companies || companies.length === 0) {
                throw new Error(`Entreprise ${companyId} introuvable dans Odoo`);
            }
            
            return companies[0];
            
        } catch (error) {
            throw new Error(`Erreur récupération entreprise: ${error.message}`);
        }
    }
    
    /**
     * Récupérer les écritures comptables de la période
     */
    async getAccountMoves(companyId, periodStart, periodEnd) {
        try {
            const moves = await odoo.execute_kw(
                'account.move',
                'search_read',
                [[
                    ['company_id', '=', companyId],
                    ['date', '>=', periodStart],
                    ['date', '<=', periodEnd],
                    ['state', '=', 'posted'] // Seulement les écritures validées
                ]],
                {
                    fields: [
                        'id',
                        'name',
                        'date',
                        'ref',
                        'journal_id',
                        'move_type',
                        'state',
                        'amount_total',
                        'line_ids'
                    ]
                }
            );
            
            console.log(`[OdooReportsService] ${moves.length} écritures comptables trouvées`);
            return moves;
            
        } catch (error) {
            throw new Error(`Erreur récupération écritures: ${error.message}`);
        }
    }
    
    /**
     * Récupérer toutes les lignes d'écritures
     */
    async getAccountMoveLines(accountMoves) {
        try {
            // Extraire tous les IDs de lignes
            const lineIds = accountMoves.flatMap(move => move.line_ids || []);
            
            if (lineIds.length === 0) {
                return [];
            }
            
            const lines = await odoo.execute_kw(
                'account.move.line',
                'search_read',
                [[['id', 'in', lineIds]]],
                {
                    fields: [
                        'id',
                        'move_id',
                        'account_id',
                        'name',
                        'debit',
                        'credit',
                        'balance',
                        'date',
                        'partner_id',
                        'product_id',
                        'quantity',
                        'price_unit',
                        'tax_ids',
                        'analytic_account_id',
                        'journal_id'
                    ]
                }
            );
            
            console.log(`[OdooReportsService] ${lines.length} lignes d'écritures trouvées`);
            return lines;
            
        } catch (error) {
            throw new Error(`Erreur récupération lignes: ${error.message}`);
        }
    }
    
    /**
     * Récupérer le plan comptable
     */
    async getChartOfAccounts(companyId) {
        try {
            const accounts = await odoo.execute_kw(
                'account.account',
                'search_read',
                [[['company_id', '=', companyId]]],
                {
                    fields: [
                        'id',
                        'code',
                        'name',
                        'user_type_id',
                        'reconcile',
                        'deprecated',
                        'group_id'
                    ]
                }
            );
            
            console.log(`[OdooReportsService] ${accounts.length} comptes trouvés dans le plan comptable`);
            return accounts;
            
        } catch (error) {
            throw new Error(`Erreur récupération plan comptable: ${error.message}`);
        }
    }
    
    /**
     * Enrichir les lignes avec les informations des comptes
     */
    enrichMoveLinesWithAccounts(moveLines, chartOfAccounts) {
        const accountsMap = new Map(
            chartOfAccounts.map(account => [account.id, account])
        );
        
        return moveLines.map(line => {
            const account = accountsMap.get(line.account_id[0]);
            
            return {
                ...line,
                account_code: account ? account.code : 'UNKNOWN',
                account_name: account ? account.name : 'Compte inconnu',
                account_type: account ? account.user_type_id[1] : null
            };
        });
    }
    
    /**
     * Calculer le BILAN
     */
    async calculateBilan(enrichedLines, accountingSystem) {
        try {
            const accountsConfig = getAccountsConfig(accountingSystem);
            
            // Grouper l'actif
            const actif = groupLinesByCategory(enrichedLines, accountsConfig.ACTIF);
            
            // Grouper le passif
            const passif = groupLinesByCategory(enrichedLines, accountsConfig.PASSIF);
            
            // Calculer les totaux
            const totalActif = Object.values(actif).reduce((sum, cat) => sum + Math.abs(cat.balance), 0);
            const totalPassif = Object.values(passif).reduce((sum, cat) => sum + Math.abs(cat.balance), 0);
            
            return {
                actif,
                passif,
                totaux: {
                    actif: totalActif,
                    passif: totalPassif,
                    difference: totalActif - totalPassif
                }
            };
            
        } catch (error) {
            throw new Error(`Erreur calcul bilan: ${error.message}`);
        }
    }
    
    /**
     * Calculer le COMPTE DE RÉSULTAT
     */
    async calculateCompteResultat(enrichedLines, accountingSystem) {
        try {
            const accountsConfig = getAccountsConfig(accountingSystem);
            
            // Pour SYCEBNL, utiliser EMPLOIS/RESSOURCES au lieu de CHARGES/PRODUITS
            const isEBNL = accountingSystem.startsWith('SYCEBNL');
            
            const chargesKey = isEBNL ? 'EMPLOIS' : 'CHARGES';
            const produitsKey = isEBNL ? 'RESSOURCES' : 'PRODUITS';
            
            // Grouper les charges/emplois
            const charges = groupLinesByCategory(enrichedLines, accountsConfig[chargesKey]);
            
            // Grouper les produits/ressources
            const produits = groupLinesByCategory(enrichedLines, accountsConfig[produitsKey]);
            
            // Calculer les totaux
            const totalCharges = Object.values(charges).reduce((sum, cat) => sum + Math.abs(cat.balance), 0);
            const totalProduits = Object.values(produits).reduce((sum, cat) => sum + Math.abs(cat.balance), 0);
            const resultat = totalProduits - totalCharges;
            
            return {
                charges,
                produits,
                totaux: {
                    charges: totalCharges,
                    produits: totalProduits,
                    resultat: resultat,
                    resultat_label: resultat >= 0 ? 'Bénéfice' : 'Perte'
                }
            };
            
        } catch (error) {
            throw new Error(`Erreur calcul compte de résultat: ${error.message}`);
        }
    }
    
    /**
     * Calculer le TABLEAU DES FLUX DE TRÉSORERIE (Méthode indirecte)
     */
    async calculateTableauFluxTresorerie(enrichedLines, accountingSystem) {
        try {
            // Flux de trésorerie - Activités opérationnelles
            const fluxOperationnels = this.calculateFluxOperationnels(enrichedLines);
            
            // Flux de trésorerie - Activités d'investissement
            const fluxInvestissement = this.calculateFluxInvestissement(enrichedLines);
            
            // Flux de trésorerie - Activités de financement
            const fluxFinancement = this.calculateFluxFinancement(enrichedLines);
            
            // Variation nette de trésorerie
            const variationNette = fluxOperationnels + fluxInvestissement + fluxFinancement;
            
            // Trésorerie initiale et finale
            const tresorerie = this.calculateTresorerie(enrichedLines);
            
            return {
                flux_operationnels: fluxOperationnels,
                flux_investissement: fluxInvestissement,
                flux_financement: fluxFinancement,
                variation_nette: variationNette,
                tresorerie_initiale: tresorerie.initiale,
                tresorerie_finale: tresorerie.finale,
                verification: Math.abs((tresorerie.finale - tresorerie.initiale) - variationNette) < 0.01
            };
            
        } catch (error) {
            throw new Error(`Erreur calcul TFT: ${error.message}`);
        }
    }
    
    /**
     * Calculer les flux opérationnels
     */
    calculateFluxOperationnels(enrichedLines) {
        // Comptes de classe 6 et 7 (exploitation)
        const operationalLines = enrichedLines.filter(line => 
            line.account_code.startsWith('6') || line.account_code.startsWith('7')
        );
        
        return calculateBalance(operationalLines);
    }
    
    /**
     * Calculer les flux d'investissement
     */
    calculateFluxInvestissement(enrichedLines) {
        // Comptes d'immobilisations (classe 2)
        const investmentLines = enrichedLines.filter(line => 
            line.account_code.startsWith('2')
        );
        
        return calculateBalance(investmentLines);
    }
    
    /**
     * Calculer les flux de financement
     */
    calculateFluxFinancement(enrichedLines) {
        // Comptes de capitaux et dettes financières (classe 1)
        const financingLines = enrichedLines.filter(line => 
            line.account_code.startsWith('1')
        );
        
        return calculateBalance(financingLines);
    }
    
    /**
     * Calculer la trésorerie initiale et finale
     */
    calculateTresorerie(enrichedLines) {
        // Comptes de trésorerie (51, 52, 53, 54, 55, 56, 57)
        const tresorerieLines = enrichedLines.filter(line => 
            ['51', '52', '53', '54', '55', '56', '57'].some(code => line.account_code.startsWith(code))
        );
        
        // Pour une version simplifiée, on prend le solde final
        // Dans une vraie implémentation, il faudrait comparer début/fin de période
        const solde = calculateBalance(tresorerieLines);
        
        return {
            initiale: 0, // À améliorer : récupérer le solde d'ouverture
            finale: solde
        };
    }
    
    /**
     * Préparer les données pour les ANNEXES
     */
    async prepareAnnexesData(enrichedLines, companyInfo, accountingSystem, periodStart, periodEnd) {
        try {
            return {
                // Note 1 : Principes et méthodes comptables
                principes_comptables: {
                    systeme: accountingSystem,
                    exercice: `Du ${periodStart} au ${periodEnd}`,
                    devise: companyInfo.currency_id ? companyInfo.currency_id[1] : 'XOF',
                    methode_amortissement: 'Linéaire',
                    methode_evaluation_stocks: 'FIFO'
                },
                
                // Note 2 : État des immobilisations
                immobilisations: await this.getImmobilisationsDetails(enrichedLines),
                
                // Note 3 : État des amortissements
                amortissements: await this.getAmortissementsDetails(enrichedLines),
                
                // Note 4 : État des provisions
                provisions: await this.getProvisionsDetails(enrichedLines),
                
                // Note 5 : État des créances et dettes
                creances_dettes: await this.getCreancesDetails(enrichedLines),
                
                // Note 6 : Tableau de variation des capitaux propres (TAFIRE)
                variation_capitaux: await this.getVariationCapitaux(enrichedLines)
            };
            
        } catch (error) {
            console.error('[OdooReportsService] Erreur préparation annexes:', error);
            return {};
        }
    }
    
    /**
     * Détails des immobilisations
     */
    async getImmobilisationsDetails(enrichedLines) {
        const immoLines = enrichedLines.filter(line => line.account_code.startsWith('2'));
        
        const details = {};
        immoLines.forEach(line => {
            const category = line.account_code.substring(0, 2);
            if (!details[category]) {
                details[category] = {
                    code: category,
                    valeur_brute: 0,
                    acquisitions: 0,
                    cessions: 0
                };
            }
            details[category].valeur_brute += Math.abs(line.balance);
        });
        
        return Object.values(details);
    }
    
    /**
     * Détails des amortissements
     */
    async getAmortissementsDetails(enrichedLines) {
        const amortLines = enrichedLines.filter(line => 
            line.account_code.startsWith('28') || line.account_code.startsWith('68')
        );
        
        return {
            dotations_exercice: calculateBalance(amortLines.filter(l => l.account_code.startsWith('68'))),
            cumul: calculateBalance(amortLines.filter(l => l.account_code.startsWith('28')))
        };
    }
    
    /**
     * Détails des provisions
     */
    async getProvisionsDetails(enrichedLines) {
        const provisionLines = enrichedLines.filter(line => 
            line.account_code.startsWith('19') || line.account_code.startsWith('29') || 
            line.account_code.startsWith('39') || line.account_code.startsWith('49') ||
            line.account_code.startsWith('59') || line.account_code.startsWith('69')
        );
        
        return {
            dotations: calculateBalance(provisionLines.filter(l => l.account_code.startsWith('69'))),
            reprises: calculateBalance(provisionLines.filter(l => l.account_code.startsWith('79'))),
            solde: calculateBalance(provisionLines)
        };
    }
    
    /**
     * Détails des créances et dettes
     */
    async getCreancesDetails(enrichedLines) {
        const creances = enrichedLines.filter(line => line.account_code.startsWith('4') && line.balance > 0);
        const dettes = enrichedLines.filter(line => line.account_code.startsWith('4') && line.balance < 0);
        
        return {
            creances: {
                moins_1_an: calculateBalance(creances),
                plus_1_an: 0 // À améliorer avec analyse d'échéance
            },
            dettes: {
                moins_1_an: Math.abs(calculateBalance(dettes)),
                plus_1_an: 0 // À améliorer avec analyse d'échéance
            }
        };
    }
    
    /**
     * Tableau de variation des capitaux propres
     */
    async getVariationCapitaux(enrichedLines) {
        const capitauxLines = enrichedLines.filter(line => line.account_code.startsWith('1'));
        
        return {
            solde_debut: 0, // À améliorer : récupérer N-1
            augmentations: calculateBalance(capitauxLines.filter(l => l.credit > 0)),
            diminutions: Math.abs(calculateBalance(capitauxLines.filter(l => l.debit > 0))),
            solde_fin: calculateBalance(capitauxLines)
        };
    }
}

// Export du service
module.exports = new OdooReportsService();
