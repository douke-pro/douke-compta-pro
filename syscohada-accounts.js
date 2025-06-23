<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOUKÈ Compta Pro - Plan Comptable SYSCOHADA Révisé v3.1</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto p-4">
        <h1 class="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">
            📊 Plan Comptable SYSCOHADA Révisé - 9 Classes
        </h1>
        <div id="accountsList" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p class="text-center text-gray-600 dark:text-gray-400">Chargement du plan comptable...</p>
        </div>
    </div>

    <script>
        // =============================================================================
        // DOUKÈ Compta Pro - Plan Comptable SYSCOHADA Révisé v3.1
        // =============================================================================

        const SYSCOHADA_ACCOUNTS = [
        // CLASSE 1 - COMPTES DE RESSOURCES DURABLES
        // Capitaux propres et ressources assimilées
        { code: "101000", name: "Capital social", category: "Capital", type: "Passif", nature: "Credit", class: 1 },
        { code: "102000", name: "Capital non appelé", category: "Capital", type: "Actif", nature: "Debit", class: 1 },
        { code: "103000", name: "Primes liées au capital social", category: "Primes", type: "Passif", nature: "Credit", class: 1 },
        { code: "104000", name: "Primes de fusion", category: "Primes", type: "Passif", nature: "Credit", class: 1 },
        { code: "105000", name: "Écarts de réévaluation", category: "Réserves", type: "Passif", nature: "Credit", class: 1 },
        { code: "106000", name: "Réserves", category: "Réserves", type: "Passif", nature: "Credit", class: 1 },
        { code: "110000", name: "Report à nouveau créditeur", category: "Report à nouveau", type: "Passif", nature: "Credit", class: 1 },
        { code: "119000", name: "Report à nouveau débiteur", category: "Report à nouveau", type: "Actif", nature: "Debit", class: 1 },
        { code: "120000", name: "Résultat de l'exercice (bénéfice)", category: "Résultat", type: "Passif", nature: "Credit", class: 1 },
        { code: "129000", name: "Résultat de l'exercice (perte)", category: "Résultat", type: "Actif", nature: "Debit", class: 1 },
        { code: "131000", name: "Subventions d'équipement", category: "Subventions", type: "Passif", nature: "Credit", class: 1 },
        { code: "138000", name: "Autres subventions d'investissement", category: "Subventions", type: "Passif", nature: "Credit", class: 1 },
        { code: "141000", name: "Provisions réglementées", category: "Provisions", type: "Passif", nature: "Credit", class: 1 },
        { code: "151000", name: "Provisions pour risques", category: "Provisions pour risques et charges", type: "Passif", nature: "Credit", class: 1 },
        { code: "158000", name: "Provisions pour charges", category: "Provisions pour risques et charges", type: "Passif", nature: "Credit", class: 1 },
        { code: "161000", name: "Emprunts obligataires", category: "Dettes financières", type: "Passif", nature: "Credit", class: 1 },
        { code: "162000", name: "Emprunts et dettes auprès des établissements de crédit", category: "Dettes financières", type: "Passif", nature: "Credit", class: 1 },
        { code: "163000", name: "Avances reçues de l'État", category: "Dettes financières", type: "Passif", nature: "Credit", class: 1 },
        { code: "164000", name: "Avances reçues et comptes courants bloqués", category: "Dettes financières", type: "Passif", nature: "Credit", class: 1 },
        { code: "165000", name: "Dépôts et cautionnements reçus", category: "Dettes financières", type: "Passif", nature: "Credit", class: 1 },
        { code: "166000", name: "Intérêts courus", category: "Dettes financières", type: "Passif", nature: "Credit", class: 1 },
        { code: "167000", name: "Emprunts et dettes assortis de conditions particulières", category: "Dettes financières", type: "Passif", nature: "Credit", class: 1 },
        { code: "168000", name: "Autres emprunts et dettes financières", category: "Dettes financières", type: "Passif", nature: "Credit", class: 1 },

        // CLASSE 2 - COMPTES D'ACTIF IMMOBILISÉ
        // Immobilisations incorporelles
        { code: "201000", name: "Frais de développement", category: "Immobilisations incorporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "203000", name: "Frais de recherche et développement", category: "Immobilisations incorporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "204000", name: "Logiciels", category: "Immobilisations incorporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "205000", name: "Concessions et droits similaires", category: "Immobilisations incorporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "206000", name: "Droit au bail", category: "Immobilisations incorporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "207000", name: "Fonds commercial", category: "Immobilisations incorporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "208000", name: "Autres immobilisations incorporelles", category: "Immobilisations incorporelles", type: "Actif", nature: "Debit", class: 2 },

        // Immobilisations corporelles
        { code: "211000", name: "Terrains", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "212000", name: "Agencements et aménagements de terrains", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "213000", name: "Constructions", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "214000", name: "Agencements et aménagements de constructions", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "215000", name: "Installations techniques", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "218000", name: "Autres installations", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "221000", name: "Matériels", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "222000", name: "Matériels et outillages industriels", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "223000", name: "Matériels et outillages agricoles", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "224000", name: "Matériel de transport", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "228000", name: "Autres matériels", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "231000", name: "Agencements, installations et aménagements du matériel", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "238000", name: "Avances et acomptes versés sur immobilisations", category: "Immobilisations corporelles", type: "Actif", nature: "Debit", class: 2 },
        { code: "241000", name: "Immobilisations corporelles en cours", category: "Immobilisations en cours", type: "Actif", nature: "Debit", class: 2 },
        { code: "245000", name: "Immobilisations incorporelles en cours", category: "Immobilisations en cours", type: "Actif", nature: "Debit", class: 2 },

        // Immobilisations financières
        { code: "251000", name: "Titres de participation", category: "Immobilisations financières", type: "Actif", nature: "Debit", class: 2 },
        { code: "261000", name: "Titres immobilisés", category: "Immobilisations financières", type: "Actif", nature: "Debit", class: 2 },
        { code: "271000", name: "Prêts et créances sur l'État", category: "Immobilisations financières", type: "Actif", nature: "Debit", class: 2 },
        { code: "272000", name: "Prêts et créances sur les organismes internationaux", category: "Immobilisations financières", type: "Actif", nature: "Debit", class: 2 },
        { code: "273000", name: "Prêts et créances sur les collectivités publiques", category: "Immobilisations financières", type: "Actif", nature: "Debit", class: 2 },
        { code: "274000", name: "Prêts", category: "Immobilisations financières", type: "Actif", nature: "Debit", class: 2 },
        { code: "275000", name: "Dépôts et cautionnements versés", category: "Immobilisations financières", type: "Actif", nature: "Debit", class: 2 },
        { code: "276000", name: "Autres créances immobilisées", category: "Immobilisations financières", type: "Actif", nature: "Debit", class: 2 },

        // Amortissements des immobilisations
        { code: "281000", name: "Amortissements des immobilisations incorporelles", category: "Amortissements", type: "Passif", nature: "Credit", class: 2 },
        { code: "282000", name: "Amortissements des terrains", category: "Amortissements", type: "Passif", nature: "Credit", class: 2 },
        { code: "283000", name: "Amortissements des constructions", category: "Amortissements", type: "Passif", nature: "Credit", class: 2 },
        { code: "284000", name: "Amortissements des installations", category: "Amortissements", type: "Passif", nature: "Credit", class: 2 },
        { code: "285000", name: "Amortissements du matériel", category: "Amortissements", type: "Passif", nature: "Credit", class: 2 },

        // CLASSE 3 - COMPTES DE STOCKS
        { code: "311000", name: "Marchandises A", category: "Marchandises", type: "Actif", nature: "Debit", class: 3 },
        { code: "312000", name: "Marchandises B", category: "Marchandises", type: "Actif", nature: "Debit", class: 3 },
        { code: "318000", name: "Autres marchandises", category: "Marchandises", type: "Actif", nature: "Debit", class: 3 },
        { code: "321000", name: "Matières premières", category: "Matières et fournitures", type: "Actif", nature: "Debit", class: 3 },
        { code: "322000", name: "Matières et fournitures consommables", category: "Matières et fournitures", type: "Actif", nature: "Debit", class: 3 },
        { code: "323000", name: "Emballages", category: "Matières et fournitures", type: "Actif", nature: "Debit", class: 3 },
        { code: "331000", name: "Produits en cours", category: "En-cours", type: "Actif", nature: "Debit", class: 3 },
        { code: "335000", name: "Travaux en cours", category: "En-cours", type: "Actif", nature: "Debit", class: 3 },
        { code: "341000", name: "Études en cours", category: "En-cours", type: "Actif", nature: "Debit", class: 3 },
        { code: "351000", name: "Produits intermédiaires", category: "Produits", type: "Actif", nature: "Debit", class: 3 },
        { code: "352000", name: "Produits finis", category: "Produits", type: "Actif", nature: "Debit", class: 3 },
        { code: "358000", name: "Produits résiduels", category: "Produits", type: "Actif", nature: "Debit", class: 3 },

        // CLASSE 4 - COMPTES DE TIERS
        // Fournisseurs et comptes rattachés
        { code: "401000", name: "Fournisseurs, dettes en compte", category: "Fournisseurs", type: "Passif", nature: "Credit", class: 4 },
        { code: "402000", name: "Fournisseurs, effets à payer", category: "Fournisseurs", type: "Passif", nature: "Credit", class: 4 },
        { code: "403000", name: "Fournisseurs, retenues de garantie", category: "Fournisseurs", type: "Passif", nature: "Credit", class: 4 },
        { code: "408000", name: "Fournisseurs, factures non parvenues", category: "Fournisseurs", type: "Passif", nature: "Credit", class: 4 },
        { code: "409000", name: "Fournisseurs débiteurs", category: "Fournisseurs", type: "Actif", nature: "Debit", class: 4 },

        // Clients et comptes rattachés
        { code: "411000", name: "Clients", category: "Clients", type: "Actif", nature: "Debit", class: 4 },
        { code: "412000", name: "Clients, effets à recevoir", category: "Clients", type: "Actif", nature: "Debit", class: 4 },
        { code: "413000", name: "Clients retenues de garantie", category: "Clients", type: "Actif", nature: "Debit", class: 4 },
        { code: "414000", name: "Clients douteux", category: "Clients", type: "Actif", nature: "Debit", class: 4 },
        { code: "418000", name: "Clients, produits non encore facturés", category: "Clients", type: "Actif", nature: "Debit", class: 4 },
        { code: "419000", name: "Clients créditeurs", category: "Clients", type: "Passif", nature: "Credit", class: 4 },

        // Personnel
        { code: "421000", name: "Personnel, rémunérations dues", category: "Personnel", type: "Passif", nature: "Credit", class: 4 },
        { code: "422000", name: "Personnel, œuvres sociales", category: "Personnel", type: "Passif", nature: "Credit", class: 4 },
        { code: "423000", name: "Personnel, oppositions", category: "Personnel", type: "Passif", nature: "Credit", class: 4 },
        { code: "424000", name: "Personnel, avances et acomptes", category: "Personnel", type: "Actif", nature: "Debit", class: 4 },
        { code: "425000", name: "Personnel, avances pour congés à payer", category: "Personnel", type: "Passif", nature: "Credit", class: 4 },
        { code: "428000", name: "Personnel, charges à payer et produits à recevoir", category: "Personnel", type: "Passif", nature: "Credit", class: 4 },

        // Organismes sociaux
        { code: "431000", name: "Sécurité sociale", category: "Organismes sociaux", type: "Passif", nature: "Credit", class: 4 },
        { code: "432000", name: "Autres organismes sociaux", category: "Organismes sociaux", type: "Passif", nature: "Credit", class: 4 },
        { code: "438000", name: "Organismes sociaux, charges à payer et produits à recevoir", category: "Organismes sociaux", type: "Passif", nature: "Credit", class: 4 },

        // État et collectivités publiques
        { code: "441000", name: "État, subventions à recevoir", category: "État", type: "Actif", nature: "Debit", class: 4 },
        { code: "442000", name: "État, impôts et taxes recouvrables sur des tiers", category: "État", type: "Actif", nature: "Debit", class: 4 },
        { code: "443000", name: "État, TVA facturée", category: "État", type: "Passif", nature: "Credit", class: 4 },
        { code: "444000", name: "État, TVA due ou crédit de TVA", category: "État", type: "Passif", nature: "Credit", class: 4 },
        { code: "445000", name: "État, TVA récupérable", category: "État", type: "Actif", nature: "Debit", class: 4 },
        { code: "446000", name: "État, autres impôts et taxes", category: "État", type: "Passif", nature: "Credit", class: 4 },
        { code: "447000", name: "État, impôts retenus à la source", category: "État", type: "Passif", nature: "Credit", class: 4 },
        { code: "448000", name: "État, charges à payer et produits à recevoir", category: "État", type: "Passif", nature: "Credit", class: 4 },
        { code: "449000", name: "État, créances et dettes diverses", category: "État", type: "Actif", nature: "Debit", class: 4 },

        // Associés
        { code: "451000", name: "Associés, comptes courants", category: "Associés", type: "Passif", nature: "Credit", class: 4 },
        { code: "452000", name: "Associés, comptes courants", category: "Associés", type: "Actif", nature: "Debit", class: 4 },
        { code: "453000", name: "Associés, opérations sur le capital", category: "Associés", type: "Actif", nature: "Debit", class: 4 },
        { code: "454000", name: "Associés, dividendes à payer", category: "Associés", type: "Passif", nature: "Credit", class: 4 },
        { code: "458000", name: "Associés, charges à payer et produits à recevoir", category: "Associés", type: "Passif", nature: "Credit", class: 4 },

        // Débiteurs et créditeurs divers
        { code: "461000", name: "Créances sur cessions d'immobilisations", category: "Divers", type: "Actif", nature: "Debit", class: 4 },
        { code: "462000", name: "Créances sur cessions de valeurs mobilières de placement", category: "Divers", type: "Actif", nature: "Debit", class: 4 },
        { code: "463000", name: "Dettes sur acquisitions de valeurs mobilières de placement", category: "Divers", type: "Passif", nature: "Credit", class: 4 },
        { code: "464000", name: "Dettes sur acquisitions d'immobilisations", category: "Divers", type: "Passif", nature: "Credit", class: 4 },
        { code: "465000", name: "Créances sur l'État", category: "Divers", type: "Actif", nature: "Debit", class: 4 },
        { code: "466000", name: "Diverses charges à payer", category: "Divers", type: "Passif", nature: "Credit", class: 4 },
        { code: "467000", name: "Divers produits à recevoir", category: "Divers", type: "Actif", nature: "Debit", class: 4 },
        { code: "471000", name: "Comptes transitoires ou d'attente débiteurs", category: "Comptes transitoires", type: "Actif", nature: "Debit", class: 4 },
        { code: "472000", name: "Comptes transitoires ou d'attente créditeurs", category: "Comptes transitoires", type: "Passif", nature: "Credit", class: 4 },
        { code: "481000", name: "Charges à répartir sur plusieurs exercices", category: "Comptes de régularisation", type: "Actif", nature: "Debit", class: 4 },
        { code: "486000", name: "Charges constatées d'avance", category: "Comptes de régularisation", type: "Actif", nature: "Debit", class: 4 },
        { code: "487000", name: "Produits constatés d'avance", category: "Comptes de régularisation", type: "Passif", nature: "Credit", class: 4 },

        // CLASSE 5 - COMPTES FINANCIERS
        // Titres de placement
        { code: "501000", name: "Titres du trésor et bons de caisse à court terme", category: "Titres de placement", type: "Actif", nature: "Debit", class: 5 },
        { code: "502000", name: "Actions", category: "Titres de placement", type: "Actif", nature: "Debit", class: 5 },
        { code: "503000", name: "Obligations", category: "Titres de placement", type: "Actif", nature: "Debit", class: 5 },
        { code: "504000", name: "Bons de souscription d'actions", category: "Titres de placement", type: "Actif", nature: "Debit", class: 5 },
        { code: "505000", name: "Bons de souscription d'obligations", category: "Titres de placement", type: "Actif", nature: "Debit", class: 5 },
        { code: "508000", name: "Autres valeurs mobilières de placement", category: "Titres de placement", type: "Actif", nature: "Debit", class: 5 },

        // Valeurs à l'encaissement
        { code: "511000", name: "Chèques à encaisser", category: "Valeurs à l'encaissement", type: "Actif", nature: "Debit", class: 5 },
        { code: "512000", name: "Effets à l'encaissement", category: "Valeurs à l'encaissement", type: "Actif", nature: "Debit", class: 5 },
        { code: "513000", name: "Effets à l'escompte", category: "Valeurs à l'encaissement", type: "Actif", nature: "Debit", class: 5 },
        { code: "514000", name: "Chèques postaux", category: "Valeurs à l'encaissement", type: "Actif", nature: "Debit", class: 5 },

        // Banques, établissements financiers et assimilés
        { code: "521000", name: "Banques locales", category: "Banques", type: "Actif", nature: "Debit", class: 5 },
        { code: "522000", name: "Banques autres États de l'UEMOA", category: "Banques", type: "Actif", nature: "Debit", class: 5 },
        { code: "523000", name: "Banques autres États de la zone franc", category: "Banques", type: "Actif", nature: "Debit", class: 5 },
        { code: "524000", name: "Banques hors zone franc", category: "Banques", type: "Actif", nature: "Debit", class: 5 },
        { code: "526000", name: "Banques, intérêts courus", category: "Banques", type: "Actif", nature: "Debit", class: 5 },
        { code: "527000", name: "Centres de chèques postaux", category: "Banques", type: "Actif", nature: "Debit", class: 5 },
        { code: "531000", name: "Caisse siège social", category: "Caisses", type: "Actif", nature: "Debit", class: 5 },
        { code: "532000", name: "Caisse succursale (ou usine) A", category: "Caisses", type: "Actif", nature: "Debit", class: 5 },
        { code: "533000", name: "Caisse succursale (ou usine) B", category: "Caisses", type: "Actif", nature: "Debit", class: 5 },
        { code: "538000", name: "Autres caisses", category: "Caisses", type: "Actif", nature: "Debit", class: 5 },

        // Régies d'avance et accréditifs
        { code: "541000", name: "Régies d'avances", category: "Régies", type: "Actif", nature: "Debit", class: 5 },
        { code: "542000", name: "Accréditifs", category: "Régies", type: "Actif", nature: "Debit", class: 5 },

        // Virements de fonds
        { code: "580000", name: "Virements de fonds", category: "Virements", type: "Actif", nature: "Debit", class: 5 },
        { code: "581000", name: "Chèques émis non encore présentés", category: "Virements", type: "Passif", nature: "Credit", class: 5 },

        // CLASSE 6 - COMPTES DE CHARGES
        // Achats et variations de stocks
        { code: "601000", name: "Achats de marchandises", category: "Achats", type: "Charge", nature: "Debit", class: 6 },
        { code: "602000", name: "Achats de matières premières et fournitures liées", category: "Achats", type: "Charge", nature: "Debit", class: 6 },
        { code: "603000", name: "Variations des stocks de biens achetés", category: "Achats", type: "Charge", nature: "Debit", class: 6 },
        { code: "604000", name: "Achats stockés de matières et fournitures", category: "Achats", type: "Charge", nature: "Debit", class: 6 },
        { code: "605000", name: "Autres achats", category: "Achats", type: "Charge", nature: "Debit", class: 6 },
        { code: "608000", name: "Achats d'emballages", category: "Achats", type: "Charge", nature: "Debit", class: 6 },
        { code: "609000", name: "Rabais, remises et ristournes obtenus sur achats", category: "Achats", type: "Produit", nature: "Credit", class: 6 },

        // Services extérieurs A
        { code: "611000", name: "Sous-traitance générale", category: "Services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "612000", name: "Redevances de crédit-bail", category: "Services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "613000", name: "Locations", category: "Services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "614000", name: "Charges locatives et de copropriété", category: "Services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "615000", name: "Entretien, réparations et maintenance", category: "Services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "616000", name: "Primes d'assurances", category: "Services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "617000", name: "Études et recherches", category: "Services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "618000", name: "Divers", category: "Services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "619000", name: "Rabais, remises et ristournes obtenus sur services extérieurs", category: "Services extérieurs", type: "Produit", nature: "Credit", class: 6 },

        // Services extérieurs B
        { code: "621000", name: "Personnel extérieur à l'entreprise", category: "Autres services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "622000", name: "Rémunérations d'intermédiaires et honoraires", category: "Autres services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "623000", name: "Publicité, publications, relations publiques", category: "Autres services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "624000", name: "Transports de biens et transport collectif du personnel", category: "Autres services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "625000", name: "Déplacements, missions et réceptions", category: "Autres services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "626000", name: "Frais postaux et de télécommunication", category: "Autres services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "627000", name: "Services bancaires et assimilés", category: "Autres services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "628000", name: "Divers", category: "Autres services extérieurs", type: "Charge", nature: "Debit", class: 6 },
        { code: "629000", name: "Rabais, remises et ristournes obtenus sur autres services extérieurs", category: "Autres services extérieurs", type: "Produit", nature: "Credit", class: 6 },

        // Impôts, taxes et versements assimilés
        { code: "631000", name: "Impôts, taxes et versements assimilés sur rémunérations", category: "Impôts et taxes", type: "Charge", nature: "Debit", class: 6 },
        { code: "633000", name: "Impôts, taxes et versements assimilés sur rémunérations (autres)", category: "Impôts et taxes", type: "Charge", nature: "Debit", class: 6 },
        { code: "635000", name: "Autres impôts, taxes et versements assimilés", category: "Impôts et taxes", type: "Charge", nature: "Debit", class: 6 },
        { code: "637000", name: "Impôts, taxes et versements assimilés des exercices antérieurs", category: "Impôts et taxes", type: "Charge", nature: "Debit", class: 6 },
        { code: "638000", name: "Autres impôts et taxes", category: "Impôts et taxes", type: "Charge", nature: "Debit", class: 6 },

        // Charges de personnel
        { code: "641000", name: "Rémunérations du personnel national", category: "Charges de personnel", type: "Charge", nature: "Debit", class: 6 },
        { code: "642000", name: "Rémunérations du personnel non national", category: "Charges de personnel", type: "Charge", nature: "Debit", class: 6 },
        { code: "643000", name: "Rémunérations de l'exploitant individuel", category: "Charges de personnel", type: "Charge", nature: "Debit", class: 6 },
        { code: "644000", name: "Rémunérations de transitaires et autres intervenants", category: "Charges de personnel", type: "Charge", nature: "Debit", class: 6 },
        { code: "645000", name: "Charges de sécurité sociale et de prévoyance", category: "Charges de personnel", type: "Charge", nature: "Debit", class: 6 },
        { code: "646000", name: "Charges sociales de l'exploitant individuel", category: "Charges de personnel", type: "Charge", nature: "Debit", class: 6 },
        { code: "647000", name: "Autres charges sociales", category: "Charges de personnel", type: "Charge", nature: "Debit", class: 6 },
        { code: "648000", name: "Autres charges de personnel", category: "Charges de personnel", type: "Charge", nature: "Debit", class: 6 },

        // Autres charges
        { code: "651000", name: "Redevances pour concessions, brevets, licences, marques, procédés, logiciels, droits et valeurs similaires", category: "Autres charges", type: "Charge", nature: "Debit", class: 6 },
        { code: "652000", name: "Moins-values des cessions courantes d'immobilisations", category: "Autres charges", type: "Charge", nature: "Debit", class: 6 },
        { code: "653000", name: "Jetons de présence", category: "Autres charges", type: "Charge", nature: "Debit", class: 6 },
        { code: "654000", name: "Pertes sur créances irrécouvrables", category: "Autres charges", type: "Charge", nature: "Debit", class: 6 },
        { code: "655000", name: "Quote-part de résultat sur opérations faites en commun", category: "Autres charges", type: "Charge", nature: "Debit", class: 6 },
        { code: "658000", name: "Charges diverses", category: "Autres charges", type: "Charge", nature: "Debit", class: 6 },

        // Charges financières
        { code: "661000", name: "Charges d'intérêts", category: "Charges financières", type: "Charge", nature: "Debit", class: 6 },
        { code: "662000", name: "Pertes de change", category: "Charges financières", type: "Charge", nature: "Debit", class: 6 },
        { code: "663000", name: "Réductions financières accordées", category: "Charges financières", type: "Charge", nature: "Debit", class: 6 },
        { code: "664000", name: "Provisions pour dépréciation des immobilisations financières", category: "Charges financières", type: "Charge", nature: "Debit", class: 6 },
        { code: "665000", name: "Escomptes accordés", category: "Charges financières", type: "Charge", nature: "Debit", class: 6 },
        { code: "667000", name: "Pertes sur cessions de valeurs mobilières de placement", category: "Charges financières", type: "Charge", nature: "Debit", class: 6 },
        { code: "668000", name: "Autres charges financières", category: "Charges financières", type: "Charge", nature: "Debit", class: 6 },

        // Dotations aux amortissements
        { code: "681000", name: "Dotations aux amortissements d'exploitation", category: "Dotations", type: "Charge", nature: "Debit", class: 6 },
        { code: "682000", name: "Dotations aux amortissements financiers", category: "Dotations", type: "Charge", nature: "Debit", class: 6 },
        { code: "687000", name: "Dotations aux amortissements exceptionnels", category: "Dotations", type: "Charge", nature: "Debit", class: 6 },

        // Dotations aux provisions
        { code: "691000", name: "Dotations aux provisions d'exploitation", category: "Dotations", type: "Charge", nature: "Debit", class: 6 },
        { code: "695000", name: "Dotations aux provisions financières", category: "Dotations", type: "Charge", nature: "Debit", class: 6 },
        { code: "697000", name: "Dotations aux provisions exceptionnelles", category: "Dotations", type: "Charge", nature: "Debit", class: 6 },
        { code: "698000", name: "Autres dotations", category: "Dotations", type: "Charge", nature: "Debit", class: 6 },

        // CLASSE 7 - COMPTES DE PRODUITS
        // Ventes de marchandises et de produits fabriqués
        { code: "701000", name: "Ventes de marchandises", category: "Ventes", type: "Produit", nature: "Credit", class: 7 },
        { code: "702000", name: "Ventes de produits finis", category: "Ventes", type: "Produit", nature: "Credit", class: 7 },
        { code: "703000", name: "Ventes de produits intermédiaires", category: "Ventes", type: "Produit", nature: "Credit", class: 7 },
        { code: "704000", name: "Ventes de produits résiduels", category: "Ventes", type: "Produit", nature: "Credit", class: 7 },
        { code: "705000", name: "Travaux et services vendus", category: "Ventes", type: "Produit", nature: "Credit", class: 7 },
        { code: "706000", name: "Autres prestations de services", category: "Ventes", type: "Produit", nature: "Credit", class: 7 },
        { code: "707000", name: "Ventes de marchandises dans l'État", category: "Ventes", type: "Produit", nature: "Credit", class: 7 },
        { code: "708000", name: "Produits des activités annexes", category: "Ventes", type: "Produit", nature: "Credit", class: 7 },
        { code: "709000", name: "Rabais, remises et ristournes accordés par l'entreprise", category: "Ventes", type: "Charge", nature: "Debit", class: 7 },

        // Production stockée
        { code: "721000", name: "Production immobilisée, immobilisations incorporelles", category: "Production stockée", type: "Produit", nature: "Credit", class: 7 },
        { code: "722000", name: "Production immobilisée, immobilisations corporelles", category: "Production stockée", type: "Produit", nature: "Credit", class: 7 },
        { code: "723000", name: "Production immobilisée, immobilisations en cours", category: "Production stockée", type: "Produit", nature: "Credit", class: 7 },

        // Variation des stocks de produits
        { code: "731000", name: "Variation des stocks de produits en cours", category: "Variation de stocks", type: "Produit", nature: "Credit", class: 7 },
        { code: "732000", name: "Variation des stocks de biens produits", category: "Variation de stocks", type: "Produit", nature: "Credit", class: 7 },

        // Subventions d'exploitation
        { code: "741000", name: "Subventions d'exploitation", category: "Subventions", type: "Produit", nature: "Credit", class: 7 },
        { code: "748000", name: "Autres subventions d'exploitation", category: "Subventions", type: "Produit", nature: "Credit", class: 7 },

        // Autres produits
        { code: "751000", name: "Redevances pour concessions, brevets, licences, marques, procédés, logiciels, droits et valeurs similaires", category: "Autres produits", type: "Produit", nature: "Credit", class: 7 },
        { code: "752000", name: "Revenus des immeubles non affectés aux activités professionnelles", category: "Autres produits", type: "Produit", nature: "Credit", class: 7 },
        { code: "753000", name: "Jetons de présence et rémunérations d'administrateurs", category: "Autres produits", type: "Produit", nature: "Credit", class: 7 },
        { code: "754000", name: "Ristournes perçues des coopératives", category: "Autres produits", type: "Produit", nature: "Credit", class: 7 },
        { code: "755000", name: "Quotes-parts de résultat sur opérations faites en commun", category: "Autres produits", type: "Produit", nature: "Credit", class: 7 },
        { code: "758000", name: "Produits divers", category: "Autres produits", type: "Produit", nature: "Credit", class: 7 },

        // Produits financiers
        { code: "761000", name: "Produits de participations", category: "Produits financiers", type: "Produit", nature: "Credit", class: 7 },
        { code: "762000", name: "Produits des autres immobilisations financières", category: "Produits financiers", type: "Produit", nature: "Credit", class: 7 },
        { code: "763000", name: "Revenus des autres créances", category: "Produits financiers", type: "Produit", nature: "Credit", class: 7 },
        { code: "764000", name: "Revenus des valeurs mobilières de placement", category: "Produits financiers", type: "Produit", nature: "Credit", class: 7 },
        { code: "765000", name: "Escomptes obtenus", category: "Produits financiers", type: "Produit", nature: "Credit", class: 7 },
        { code: "766000", name: "Gains de change", category: "Produits financiers", type: "Produit", nature: "Credit", class: 7 },
        { code: "767000", name: "Gains sur cessions de valeurs mobilières de placement", category: "Produits financiers", type: "Produit", nature: "Credit", class: 7 },
        { code: "768000", name: "Autres produits financiers", category: "Produits financiers", type: "Produit", nature: "Credit", class: 7 },

        // Reprises d'amortissements et de provisions
        { code: "781000", name: "Reprises d'amortissements", category: "Reprises", type: "Produit", nature: "Credit", class: 7 },
        { code: "791000", name: "Reprises de provisions d'exploitation", category: "Reprises", type: "Produit", nature: "Credit", class: 7 },
        { code: "795000", name: "Reprises de provisions financières", category: "Reprises", type: "Produit", nature: "Credit", class: 7 },
        { code: "797000", name: "Reprises de provisions exceptionnelles", category: "Reprises", type: "Produit", nature: "Credit", class: 7 },
        { code: "798000", name: "Autres reprises", category: "Reprises", type: "Produit", nature: "Credit", class: 7 },

        // CLASSE 8 - COMPTES DE RÉSULTATS
        // Charges et produits exceptionnels sur opérations de gestion
        { code: "811000", name: "Charges exceptionnelles sur opérations de gestion", category: "Charges exceptionnelles", type: "Charge", nature: "Debit", class: 8 },
        { code: "812000", name: "Charges exceptionnelles sur opérations de capital", category: "Charges exceptionnelles", type: "Charge", nature: "Debit", class: 8 },
        { code: "818000", name: "Autres charges exceptionnelles", category: "Charges exceptionnelles", type: "Charge", nature: "Debit", class: 8 },

        // Produits exceptionnels
        { code: "821000", name: "Produits exceptionnels sur opérations de gestion", category: "Produits exceptionnels", type: "Produit", nature: "Credit", class: 8 },
        { code: "822000", name: "Produits exceptionnels sur opérations de capital", category: "Produits exceptionnels", type: "Produit", nature: "Credit", class: 8 },
        { code: "828000", name: "Autres produits exceptionnels", category: "Produits exceptionnels", type: "Produit", nature: "Credit", class: 8 },

        // Participation des salariés et impôts sur le résultat
        { code: "831000", name: "Participation des salariés aux résultats", category: "Participation et impôts", type: "Charge", nature: "Debit", class: 8 },
        { code: "840000", name: "Impôts sur les bénéfices de l'exercice", category: "Participation et impôts", type: "Charge", nature: "Debit", class: 8 },
        { code: "845000", name: "Impôts différés", category: "Participation et impôts", type: "Charge", nature: "Debit", class: 8 },

        // Comptes de détermination du résultat
        { code: "870000", name: "Résultat d'exploitation", category: "Résultats intermédiaires", type: "Résultat", nature: "Solde", class: 8 },
        { code: "874000", name: "Résultat financier", category: "Résultats intermédiaires", type: "Résultat", nature: "Solde", class: 8 },
        { code: "876000", name: "Résultat courant avant impôts", category: "Résultats intermédiaires", type: "Résultat", nature: "Solde", class: 8 },
        { code: "878000", name: "Résultat exceptionnel", category: "Résultats intermédiaires", type: "Résultat", nature: "Solde", class: 8 },
        { code: "880000", name: "Résultat avant impôts", category: "Résultats intermédiaires", type: "Résultat", nature: "Solde", class: 8 },
        { code: "890000", name: "Résultat net de l'exercice", category: "Résultat final", type: "Résultat", nature: "Solde", class: 8 },

        // CLASSE 9 - COMPTES DE LA COMPTABILITÉ ANALYTIQUE D'EXPLOITATION
        // Comptes réfléchis
        { code: "901000", name: "Comptes de reclassement et d'analyse", category: "Comptes réfléchis", type: "Analytique", nature: "Solde", class: 9 },
        { code: "905000", name: "Transferts charges d'exploitation", category: "Comptes réfléchis", type: "Analytique", nature: "Solde", class: 9 },
        { code: "906000", name: "Transferts charges de personnel", category: "Comptes réfléchis", type: "Analytique", nature: "Solde", class: 9 },
        { code: "907000", name: "Transferts charges financières", category: "Comptes réfléchis", type: "Analytique", nature: "Solde", class: 9 },
        { code: "908000", name: "Transferts charges exceptionnelles", category: "Comptes réfléchis", type: "Analytique", nature: "Solde", class: 9 },

        // Comptes de coûts
        { code: "921000", name: "Coûts d'achat des marchandises vendues", category: "Coûts", type: "Analytique", nature: "Debit", class: 9 },
        { code: "922000", name: "Coûts d'achat des matières consommées", category: "Coûts", type: "Analytique", nature: "Debit", class: 9 },
        { code: "923000", name: "Coûts de production des produits vendus", category: "Coûts", type: "Analytique", nature: "Debit", class: 9 },
        { code: "924000", name: "Coûts de production des travaux", category: "Coûts", type: "Analytique", nature: "Debit", class: 9 },
        { code: "925000", name: "Coûts de production des services", category: "Coûts", type: "Analytique", nature: "Debit", class: 9 },
        { code: "926000", name: "Coûts de distribution", category: "Coûts", type: "Analytique", nature: "Debit", class: 9 },
        { code: "927000", name: "Coûts de revient de production vendue", category: "Coûts", type: "Analytique", nature: "Debit", class: 9 },

        // Inventaire permanent
        { code: "931000", name: "Stocks de marchandises", category: "Inventaire permanent", type: "Analytique", nature: "Debit", class: 9 },
        { code: "932000", name: "Stocks de matières et fournitures", category: "Inventaire permanent", type: "Analytique", nature: "Debit", class: 9 },
        { code: "933000", name: "Stocks d'en-cours", category: "Inventaire permanent", type: "Analytique", nature: "Debit", class: 9 },
        { code: "935000", name: "Stocks de produits", category: "Inventaire permanent", type: "Analytique", nature: "Debit", class: 9 },

        // Sections analytiques
        { code: "941000", name: "Sections principales", category: "Sections analytiques", type: "Analytique", nature: "Solde", class: 9 },
        { code: "942000", name: "Sections auxiliaires", category: "Sections analytiques", type: "Analytique", nature: "Solde", class: 9 },
        { code: "945000", name: "Centres d'analyse", category: "Sections analytiques", type: "Analytique", nature: "Solde", class: 9 },

        // Prestations internes
        { code: "951000", name: "Prestations fournies", category: "Prestations internes", type: "Analytique", nature: "Credit", class: 9 },
        { code: "952000", name: "Prestations reçues", category: "Prestations internes", type: "Analytique", nature: "Debit", class: 9 },

        // Écarts
        { code: "961000", name: "Écarts sur coûts préétablis", category: "Écarts", type: "Analytique", nature: "Solde", class: 9 },
        { code: "965000", name: "Écarts sur niveau d'activité", category: "Écarts", type: "Analytique", nature: "Solde", class: 9 },
        { code: "968000", name: "Autres écarts", category: "Écarts", type: "Analytique", nature: "Solde", class: 9 },

        // Résultats analytiques
        { code: "971000", name: "Résultat analytique sur marchandises", category: "Résultats analytiques", type: "Analytique", nature: "Solde", class: 9 },
        { code: "972000", name: "Résultat analytique sur matières", category: "Résultats analytiques", type: "Analytique", nature: "Solde", class: 9 },
        { code: "975000", name: "Résultat analytique global", category: "Résultats analytiques", type: "Analytique", nature: "Solde", class: 9 },

        // Comptes de liaisons internes
        { code: "981000", name: "Liaisons internes", category: "Liaisons internes", type: "Analytique", nature: "Solde", class: 9 },
        { code: "985000", name: "Différences de traitement comptable", category: "Liaisons internes", type: "Analytique", nature: "Solde", class: 9 },
        { code: "988000", name: "Bilan d'ouverture et de clôture", category: "Liaisons internes", type: "Analytique", nature: "Solde", class: 9 }
        ];

        // Export des comptes SYSCOHADA
        window.SYSCOHADA_ACCOUNTS = SYSCOHADA_ACCOUNTS;

        // Gestion du mode sombre
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        }
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            if (event.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        });

        // Affichage du plan comptable
        function displayAccounts() {
            const accountsList = document.getElementById('accountsList');
            
            // Grouper par classe
            const accountsByClass = SYSCOHADA_ACCOUNTS.reduce((acc, account) => {
                if (!acc[account.class]) {
                    acc[account.class] = [];
                }
                acc[account.class].push(account);
                return acc;
            }, {});

            const classNames = {
                1: "COMPTES DE RESSOURCES DURABLES",
                2: "COMPTES D'ACTIF IMMOBILISÉ", 
                3: "COMPTES DE STOCKS",
                4: "COMPTES DE TIERS",
                5: "COMPTES FINANCIERS",
                6: "COMPTES DE CHARGES",
                7: "COMPTES DE PRODUITS", 
                8: "COMPTES DE RÉSULTATS",
                9: "COMPTES DE LA COMPTABILITÉ ANALYTIQUE D'EXPLOITATION"
            };

            let html = `
                <div class="mb-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                            <h3 class="font-bold text-blue-800 dark:text-blue-200">Total des comptes</h3>
                            <p class="text-2xl font-bold text-blue-600 dark:text-blue-300">${SYSCOHADA_ACCOUNTS.length}</p>
                        </div>
                        <div class="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                            <h3 class="font-bold text-green-800 dark:text-green-200">Classes</h3>
                            <p class="text-2xl font-bold text-green-600 dark:text-green-300">9</p>
                        </div>
                        <div class="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                            <h3 class="font-bold text-purple-800 dark:text-purple-200">Version</h3>
                            <p class="text-2xl font-bold text-purple-600 dark:text-purple-300">SYSCOHADA Révisé</p>
                        </div>
                    </div>
                </div>
            `;

            for (let classNum = 1; classNum <= 9; classNum++) {
                if (accountsByClass[classNum]) {
                    html += `
                        <div class="mb-8 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                                <h2 class="text-xl font-bold">CLASSE ${classNum} - ${classNames[classNum]}</h2>
                                <p class="text-blue-100">${accountsByClass[classNum].length} comptes</p>
                            </div>
                            <div class="p-4">
                                <div class="overflow-x-auto">
                                    <table class="w-full text-sm">
                                        <thead>
                                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                                <th class="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Code</th>
                                                <th class="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Libellé</th>
                                                <th class="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Catégorie</th>
                                                <th class="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                                                <th class="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">Nature</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                    `;
                    
                    accountsByClass[classNum].forEach(account => {
                        const typeColor = account.type === 'Actif' ? 'text-green-600 dark:text-green-400' :
                                        account.type === 'Passif' ? 'text-blue-600 dark:text-blue-400' :
                                        account.type === 'Charge' ? 'text-red-600 dark:text-red-400' :
                                        account.type === 'Produit' ? 'text-green-600 dark:text-green-400' :
                                        account.type === 'Résultat' ? 'text-purple-600 dark:text-purple-400' :
                                        'text-orange-600 dark:text-orange-400';
                        
                        const natureColor = account.nature === 'Debit' ? 'text-red-600 dark:text-red-400' :
                                          account.nature === 'Credit' ? 'text-green-600 dark:text-green-400' :
                                          'text-gray-600 dark:text-gray-400';

                        html += `
                            <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td class="py-2 px-2 font-mono text-gray-900 dark:text-gray-100">${account.code}</td>
                                <td class="py-2 px-2 text-gray-900 dark:text-gray-100">${account.name}</td>
                                <td class="py-2 px-2 text-gray-600 dark:text-gray-400">${account.category}</td>
                                <td class="py-2 px-2 ${typeColor} font-medium">${account.type}</td>
                                <td class="py-2 px-2 ${natureColor} font-medium">${account.nature}</td>
                            </tr>
                        `;
                    });

                    html += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }

            accountsList.innerHTML = html;
        }

        // Initialiser l'affichage
        displayAccounts();

        console.log('📊 Plan comptable SYSCOHADA complet chargé:', SYSCOHADA_ACCOUNTS.length, 'comptes sur 9 classes');
    </script>
</body>
</html>
