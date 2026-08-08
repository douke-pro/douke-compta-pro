'use strict';

/**
 * ================================================================
 * CATALOGUE OFFICIEL DES NOTES ANNEXES SYSCOHADA RÉVISÉ (SYSTÈME NORMAL)
 * ================================================================
 * Structure extraite et vérifiée par rapport au modèle officiel
 * DGI (35 notes numérotées, dont certaines comportent des
 * sous-notes A/B/C/D/E — ex : Note 3A à 3E, Note 8A à 8C,
 * Note 15A/15B, Note 16A à 16C, Note 27A/27B).
 *
 * Chaque entrée contient :
 *  - code   : identifiant officiel de la (sous-)note (ex: "3A", "16B BIS")
 *  - titre  : intitulé officiel exact
 *  - lignes : libellés des rubriques/lignes attendues dans la note
 *             (dans l'ordre officiel du modèle)
 *
 * Ce catalogue remplace la logique précédente qui générait un texte
 * générique simulé ("Contenu détaillé de la note...") pour un nombre
 * limité de notes. Il couvre désormais l'intégralité des 35 notes
 * officielles du système normal.
 * ================================================================
 */

const NOTES_CATALOGUE = {
    "1": {
        code: "1",
        titre: "DETTES GARANTIES PAR DES SURETES REELLES ET LES ENGAGEMENTS FINANCIERS",
        lignes: [
            "Emprunts et dettes financières diverses :",
            "Emprunts obligataires convertibles",
            "Autres emprunts obligataires",
            "Emprunts et dettes des établissements de crédit",
            "Autres dettes financières",
            "SOUS TOTAL (1)",
            "Dettes de location-acquisition :",
            "Dettes de crédit-bail immobilier",
            "Dettes de crédit-bail mobilier",
            "Dettes sur contrats de location-vente",
            "Autres dettes sur contrats de location-acquisition",
            "SOUS TOTAL (2)",
            "Dettes du passif circulant :",
            "Fournisseurs et comptes rattachés",
            "Clients",
            "Personnel",
            "Sécurité sociale et organismes sociaux",
            "Etat",
            "Organismes internationaux",
            "Associés et groupe",
            "Créditeurs divers",
            "SOUS TOTAL (3)",
            "TOTAL (1) + (2) + (3)",
            "ENGAGEMENTS FINANCIERS",
            "Engagements consentis à des entités liées",
            "Primes de remboursement des obligations non échues",
            "Avals, cautions, garanties",
            "Hypothèques, nantissements, gages, autres",
            "Effets escomptés non échus",
            "Créances commerciales et professionnelles cédées",
            "Abandons de créances conditionnels"
        ]
    },
    "2": {
        code: "2",
        titre: "INFORMATIONS OBLIGATOIRES",
        lignes: [
            "A - DECLARATION DE CONFORMITE AU SYSCOHADA ET FAITS MARQUANTS DE L'EXERCICE (2000 caractères maximum)",
            "B - REGLES ET METHODES COMPTABLES (2000 caractères maximum)",
            "C- DEROGATION AUX POSTULATS ET CONVENTIONS COMPTABLES (2000 caractères maximum)",
            "D - INFORMATIONS COMPLEMENTAIRES RELATIVES AU BILAN, AU COMPTE DE RESULTAT ET\nAU TABLEAU DES FLUX DE TRESORERIE (2000 caractères maximum)"
        ]
    },
    "3A": {
        code: "3A",
        titre: "IMMOBILISATIONS (BRUTES)",
        lignes: [
            "IMMOBILISATIONS INCORPORELLES",
            "Frais de développement et de prospection",
            "Brevets, licences, logiciels, et droits similaires",
            "Fonds commercial et droit au bail",
            "Autres immobilisations incorporelles",
            "IMMOBILISATIONS CORPORELLES",
            "Terrains hors immeuble de placement",
            "Terrains - immeuble de placement",
            "Bâtiments hors immeuble de placement",
            "Bâtiments - immeuble de placement",
            "Aménagements, agencements et installations",
            "Matériel, mobilier et actifs biologiques",
            "Matériel de transport",
            "AVANCES ET ACOMPTES VERSES SUR IMMOBILISATIONS",
            "Avances et acomptes sur immobilisations incorporelles",
            "Avances et acomptes sur immobilisations corporelles",
            "IMMOBILISATIONS FINANCIERES",
            "Titres de participation",
            "Autres immobilisations financières",
            "TOTAL GENERAL"
        ]
    },
    "3B": {
        code: "3B",
        titre: "BIENS PRIS EN LOCATION ACQUISITION",
        lignes: [
            "Terrains",
            "Bâtiments",
            "Matériel, mobilier",
            "Matériel de transport",
            "TOTAL  IMMOBILISATIONS EN LOCATION-ACQUISITION",
            "[1] I : Crédit-bail immobilier ; M : Crédit-bail mobilier ; A : Autres contrats (dédoubler le poste si montants"
        ]
    },
    "3C": {
        code: "3C",
        titre: "IMMOBILISATIONS (AMORTISSEMENTS)",
        lignes: [
            "Frais de développement et de prospection",
            "Brevets, licences, logiciels et droits similaires",
            "Fonds commercial et droit au bail",
            "Autres immobilisations incorporelles",
            "IMMOBILISATIONS INCORPORELLES",
            "Terrains hors immeuble de placement",
            "Terrains - immeuble de  placement",
            "Bâtiments hors immeuble de placement",
            "Bâtiments - immeuble de placement",
            "Aménagements, agencements et installations",
            "Matériel, mobilier et actifs biologiques",
            "Matériel de transport",
            "IMMOBILISATIONS CORPORELLES",
            "TOTAL GENERAL"
        ]
    },
    "3D": {
        code: "3D",
        titre: "IMMOBILISATIONS (PLUS-VALUES ET MOINS-VALUES DE CESSION)",
        lignes: [
            "Frais de développement et de prospection",
            "Brevets, licences, logiciels et droits similaires",
            "Fonds commercial et droit au bail",
            "Autres immobilisations incorporelles",
            "IMMOBILISATIONS INCORPORELLES",
            "Terrains",
            "Bâtiments",
            "Aménagements, agencements et installations",
            "Matériel, mobilier et actifs biologiques",
            "Matériel de transport",
            "IMMOBILISATIONS CORPORELLES",
            "Titres de participations",
            "Autres immobilisations financières",
            "IMMOBILISATIONS FINANCIERES",
            "TOTAL GENERAL"
        ]
    },
    "3E": {
        code: "3E",
        titre: "INFORMATIONS SUR LES REEVALUATIONS EFFECTUEES PAR L'ENTITE",
        lignes: [
            "Nature et date des réévaluations (2000 caractères maximum) :",
            "Eléments réévalués par postes du bilan",
            "TOTAL GENERAL",
            "Méthode de réévaluation utilisée (2000 caractères maximum) :",
            "Traitement fiscal de l'écart de réévaluation et des amortissements supplémentaires (2000 caractères maximum) :",
            "Montant de l'écart incorporé au capital :"
        ]
    },
    "4": {
        code: "4",
        titre: "IMMOBILISATIONS FINANCIERES",
        lignes: [
            "Titres de participation",
            "Prêts et créances",
            "Prêt au personnel",
            "Créances sur l'état",
            "Titres immobilisés",
            "Dépôts et cautionnements",
            "Intérêts courus",
            "Créances rattachées à des avances et participations à des GIE",
            "Immobilisations financières diverses",
            "TOTAL BRUT",
            "Dépréciations des titres de participation",
            "Dépréciations des autres immobilisations financières",
            "TOTAL NET DE DEPRECIATION",
            "Liste des filiales et participations :"
        ]
    },
    "5": {
        code: "5",
        titre: "ACTIF CIRCULANT ET DETTES CIRCULANTES HAO",
        lignes: [
            
        ]
    },
    "6": {
        code: "6",
        titre: "STOCKS ET EN COURS",
        lignes: [
            "Marchandises",
            "Matières premières et fournitures liées",
            "Autres approvisionnements",
            "Produits en cours",
            "Services en cours",
            "Produits finis",
            "Produits intermédiaires",
            "Stocks en cours de route, en consignation ou en dépôt",
            "TOTAL BRUT STOCKS ET EN COURS",
            "Dépréciations des stocks",
            "TOTAL NET DE DEPRECIATIONS"
        ]
    },
    "7": {
        code: "7",
        titre: "CLIENTS",
        lignes: [
            "Clients (hors réserves de propriété et Groupe)",
            "Clients effets à recevoir \n(hors réserves de propriété et groupe)",
            "Clients avec réserves de propriété",
            "Clients et effets à recevoir Groupe",
            "Créances sur cession d'immobilisations",
            "Clients effets escomptés et non échus",
            "Créances litigieuses ou douteuses",
            "Clients produits à recevoir",
            "TOTAL BRUT CLIENTS",
            "Dépréciations des comptes clients",
            "TOTAL NET DE DEPRECIATIONS",
            "Clients, avances reçues hors groupe",
            "Clients, avances reçues groupe",
            "Autres clients créditeurs",
            "TOTAL CLIENTS CREDITEURS"
        ]
    },
    "8": {
        code: "8",
        titre: "AUTRES CREANCES",
        lignes: [
            "Personnel",
            "Organismes sociaux",
            "Etat et Collectivités publiques",
            "Organismes internationaux",
            "Apporteurs, associés et groupe",
            "Compte transitoire ajustement spécial lié à la révision du\nSYSCOHADA (Voir Notes 8A & 8C)",
            "Autres débiteurs divers",
            "Comptes permanents non bloqués des établissements et des succursales",
            "Comptes de liaison charges et produits",
            "Comptes de liaison des sociétés en participation",
            "TOTAL BRUT AUTRES CREANCES",
            "Dépréciations des autres créances",
            "TOTAL NET DE DEPRECIATIONS"
        ]
    },
    "8A": {
        code: "8A",
        titre: "TABLEAU D'ETALEMENT DES CHARGES IMMOBILISEES",
        lignes: [
            "Compte transitoire à solder: 4751 compte transitoire, ajustement lié à la révision du SYSCOHADA, compte-actif",
            "Montant global à étaler au 1er janvier de l'année N",
            "Durée d'étalement retenue",
            "Exercice N"
        ]
    },
    "8B": {
        code: "8B",
        titre: "TABLEAU D'ETALEMENT DE PROVISIONS POUR CHARGES A REPARTIR",
        lignes: [
            "Compte transitoire à solder: 4751 compte transitoire\najustement spécial lié à la révision du SYSCOHADA, compte-passif",
            "Montant global à étaler au 1er janvier N",
            "Durée d'étalement retenue",
            "Total exercice N",
            "Total exercice N+1",
            "Total exercice N+2",
            "Total exercice N+3",
            "Total exercice N+4",
            "TOTAL GENERAL"
        ]
    },
    "8C": {
        code: "8C",
        titre: "TABLEAU D'ETALEMENT DE PROVISIONS POUR ENGAGEMENTS DE RETRAITE",
        lignes: [
            "Compte transitoire à solder: 4751 compte transitoire\najustement spécial lié à la révision du SYSCOHADA, compte-passif",
            "Montant global à étaler au 1er janvier N",
            "Durée d'étalement retenue",
            "Total exercice N",
            "Total exercice N+1",
            "Total exercice N+2",
            "Total exercice N+3",
            "Total exercice N+4",
            "TOTAL GENERAL"
        ]
    },
    "9": {
        code: "9",
        titre: "TITRES DE PLACEMENT",
        lignes: [
            "Titres de trésor et bons de caisse à court terme",
            "Actions",
            "Obligations",
            "Bons de souscription",
            "Titres négociables hors régions",
            "Intérêts courus",
            "Autres valeurs assimilées",
            "TOTAL BRUT TITRES",
            "Dépréciations des titres",
            "TOTAL NET DE DEPRECIATIONS"
        ]
    },
    "10": {
        code: "10",
        titre: "VALEURS A ENCAISSER",
        lignes: [
            "Effets à encaisser",
            "Effets à l'encaissement",
            "Chèques à encaisser",
            "Chèques à l'encaissement",
            "Cartes de crédit à encaisser",
            "Autres valeurs à encaisser",
            "TOTAL BRUT VALEURS A ENCAISSER",
            "Dépréciations des valeurs à encaisser",
            "TOTAL NET DE DEPRECIATIONS"
        ]
    },
    "11": {
        code: "11",
        titre: "DISPONIBILITES",
        lignes: [
            "Banques locales",
            "Banques autres états région",
            "Banques, dépôt à terme",
            "Autres Banques",
            "Banques intérêts courus",
            "Chèques postaux",
            "Autres établissement financiers",
            "Etablissement financiers intérêts courus",
            "Instruments de trésorerie",
            "Instruments de monnaie  électronique",
            "Caisse",
            "Régies d'avances et virements accréditifs",
            "TOTAL BRUT DISPONIBILITES",
            "Dépréciations",
            "TOTAL NET DE DEPRECIATIONS"
        ]
    },
    "12": {
        code: "12",
        titre: "ECARTS DE CONVERSION ET TRANSFERTS DE CHARGES",
        lignes: [
            "ECARTS DE CONVERSION",
            "Ecarts de conversion actif : \ndétailler les créances et dettes concernées",
            "Ecart de conversion passif : \ndétailler les créances et dettes concernées",
            "UML : Unités Monétaires légales\nCommentaire:  Faire un commentaire.",
            "TRANSFERTS DE CHARGES",
            "Transferts de charges d'exploitation : \ndétailler la nature des charges transférées et leurs comptes de provenance (1)",
            "Transferts de charges financières : \ndétailler la nature des charges transférées et leurs comptes de provenance (1)"
        ]
    },
    "13": {
        code: "13",
        titre: "CAPITAL",
        lignes: [
            "Nom et prénoms ou raison sociale",
            "Apporteurs, capital non appelé",
            "TOTAL"
        ]
    },
    "14": {
        code: "14",
        titre: "PRIMES ET RESERVES",
        lignes: [
            "Primes d'émission",
            "Prime d'apport",
            "Prime de fusion",
            "Prime de conversion",
            "Autres primes",
            "TOTAL PRIMES",
            "Réserves légales",
            "Réserves statutaires",
            "Réserves de plus-values nettes à long terme",
            "Réserves d’attribution gratuite d’actions au personnel salarié\net aux dirigeants",
            "Autres réserves réglementées",
            "TOTAL RESERVES INDISPONIBLES",
            "Réserves libres",
            "Report à nouveau"
        ]
    },
    "15A": {
        code: "15A",
        titre: "SUBVENTIONS D'INVESTISSEMENT ET PROVISIONS REGLEMENTEES",
        lignes: [
            "État",
            "Régions",
            "Départements",
            "Communes et collectivités publiques décentralisées",
            "Entités publiques ou mixtes",
            "Entités et organismes privés",
            "Organismes internationaux",
            "Autres",
            "TOTAL SUBVENTIONS",
            "Amortissements dérogatoires",
            "Plus-value de cession à réinvestir",
            "Provisions spéciales de réévaluation",
            "Provisions réglementées relatives aux immobilisations",
            "Provisions réglementées relatives aux stocks",
            "Provisions pour investissement",
            "Autres provisions et fonds réglementés",
            "TOTAL PROVISIONS REGLEMENTEES",
            "TOTAL SUBVENTIONS ET PROVISIONS REGLEMENTEES"
        ]
    },
    "15B": {
        code: "15B",
        titre: "AUTRES FONDS PROPRES",
        lignes: [
            "Titres participatifs",
            "Avances conditionnées",
            "Titres subordonnés à durée indéterminée (T.S.D.I.)",
            "Obligations remboursables en actions (O.R.A.)",
            "Autres avances et dettes assorties de conditions particulières",
            "TOTAL AUTRES FONDS PROPRES"
        ]
    },
    "16A": {
        code: "16A",
        titre: "DETTES FINANCIERES ET RESSOURCES ASSIMILES",
        lignes: [
            "Emprunts obligataires",
            "Emprunts et dettes auprès des établissements de crédit",
            "Avances reçues de l'Etat",
            "Avances reçues et comptes courants bloqués",
            "Dépôts et cautionnements reçus",
            "Intérêts courus",
            "Avances et dettes assorties de conditions particulières",
            "Autres emprunts et dettes",
            "Dettes liées à des participations et sociétés en participation",
            "Comptes permanents bloqués des établissements et succursales",
            "TOTAL EMPRUNTS ET DETTES FINANCIERES",
            "Crédit bail immobilier",
            "Crédit bail mobilier",
            "Location vente",
            "Intérêts courus",
            "Autres dettes de location acquisition",
            "TOTAL DETTES DE LOCATION ACQUISITION",
            "Provisions pour litiges",
            "Provisions pour garantie donnés aux clients",
            "Provisions pour pertes sur marchés à achèvement futur",
            "Provisions pour pertes de change",
            "Provisions pour impôts",
            "Provisions pour pensions et obligations assimilées - engagements de retraite",
            "Actif du régime de retraite (1)",
            "Provisions pour restructuration",
            "Provisions pour amendes et pénalités",
            "Provisions pour propre assureur",
            "Provisions pour démantèlement et remise en état",
            "Provisions de droits à réduction ou avantage en nature",
            "Autres provisions",
            "TOTAL PROVISIONS POUR RISQUES ET CHARGES"
        ]
    },
    "16B": {
        code: "16B",
        titre: "ENGAGEMENTS DE RETRAITE ET AVANTAGES ASSIMILES (METHODE ACTUARIELLE)",
        lignes: [
            "HYPOTHESES ACTUARIELLES",
            "Taux d'augmentation des salaires",
            "Taux d'actualisation",
            "Taux d'inflation",
            "Probabilité d'être présent dans l'entité à la date de départ à la retraite (expérience passée)",
            "Probabilité d'être en vie à l'âge de départ à la retraite (table de mortalité)",
            "Taux de rendement effectif des actifs du régime"
        ]
    },
    "16B BIS": {
        code: "16B BIS",
        titre: "ENGAGEMENTS DE RETRAITE ET AVANTAGES ASSIMILES (METHODE ACTUARIELLE SUITE)",
        lignes: [
            "ACTIF/PASSIF NET COMPTABILISE AU TITRE DES REGIMES FINANCES",
            "Valeur actuelle de l'obligation résultant de régimes financés",
            "Valeur actuelle des actifs affectés aux plans de retraite",
            "Excédent / Déficit de régime"
        ]
    },
    "16C": {
        code: "16C",
        titre: "ACTIFS ET PASSIFS EVENTUELS",
        lignes: [
            "Actif éventuel",
            "Litiges",
            "Passif éventuel",
            "Litiges"
        ]
    },
    "17": {
        code: "17",
        titre: "FOURNISSEURS D'EXPLOITATION",
        lignes: [
            "Fournisseurs dettes en compte (hors groupe)",
            "Fournisseurs, sous-traitants",
            "Fournisseurs, réserve de propriété",
            "Fournisseurs, retenue de garantie",
            "Fournisseurs effets à payer (hors groupe)",
            "Fournisseurs, dettes et effets à payer groupe",
            "Fournisseurs, acquisitions courantes d'immobilisations",
            "Fournisseurs factures non parvenues (hors groupe)",
            "Fournisseurs factures non parvenues groupe",
            "TOTAL FOURNISSEURS",
            "Fournisseurs, avances et acomptes (hors groupe)",
            "Fournisseurs, avances et acomptes groupe",
            "Autres fournisseurs débiteurs",
            "TOTAL FOURNISSEURS DEBITEURS"
        ]
    },
    "18": {
        code: "18",
        titre: "DETTES FISCALES ET SOCIALES",
        lignes: [
            "Personnel rémunérations dues",
            "Personnel, congés à payer",
            "Charges sociales sur congés à payer",
            "Autres personnel",
            "Caisse de sécurité sociale",
            "Caisse de retraite",
            "Mutuelle de santé",
            "Assurance Retraite",
            "Autres charges sociales à payer",
            "Autres cotisations et organismes sociaux",
            "TOTAL DETTES SOCIALES",
            "Etat, impôts sur les bénéfices",
            "Etat, impôts et taxes",
            "Etat, TVA",
            "Etat, impôts retenus à la source",
            "Autres dettes Etat",
            "TOTAL DETTES FISCALES",
            "TOTAL DETTES SOCIALES ET FISCALES"
        ]
    },
    "19": {
        code: "19",
        titre: "AUTRES DETTES ET PROVISIONS POUR RISQUES ET CHARGES A COURT TERME",
        lignes: [
            "Organismes internationaux",
            "Apporteurs, opérations sur le capital",
            "Associés, compte courant",
            "Associés dividendes à payer",
            "Groupe, comptes courants",
            "Autres dettes associés",
            "TOTAL DETTES ASSOCIES",
            "Créditeurs divers",
            "Obligataires",
            "Rémunérations d'administrateurs",
            "Compte d'affacturage et de titrisation",
            "Versements restant à effectuer sur titres de placement\nnon libérés",
            "Compte transitoire ajustement spécial lié à la révision du\nSYSCOHADA (Voir Note 8B)",
            "Autres créditeurs divers",
            "TOTAL  CREDITEURS DIVERS",
            "Comptes permanents non bloqués des établissements et\ndes succursales",
            "Comptes de liaison charges et produits",
            "Comptes de liaison des sociétés en participation",
            "TOTAL  COMPTES DE LIAISON",
            "TOTAL  AUTRES DETTES",
            "Provisions pour risques et charges à court terme (voir note 28)"
        ]
    },
    "20": {
        code: "20",
        titre: "BANQUES, CREDIT D'ESCOMPTE ET DE TRESORERIE",
        lignes: [
            "Escomptes de crédit de campagne",
            "Escomptes de crédit ordinaires",
            "TOTAL: BANQUES, CREDITS D'ESCOMPTE ET DE TRESORERIE",
            "Banques locales",
            "Banques autres états région",
            "Autres Banques",
            "Banques intérêts courus",
            "Crédit de trésorerie",
            "TOTAL: BANQUES, CREDITS DE TRESORERIE",
            "TOTAL GENERAL"
        ]
    },
    "21": {
        code: "21",
        titre: "CHIFFRE D'AFFAIRES ET AUTRES PRODUITS",
        lignes: [
            "Ventes de marchandises dans l'Etat partie",
            "Ventes de marchandises dans les autres Etats parties de la Région (2)",
            "Ventes de marchandises hors Région (2)",
            "Ventes de marchandises groupe",
            "Ventes de marchandises sur internet",
            "TOTAL : VENTES MARCHANDISES",
            "Ventes de produits fabriqués dans l'Etat partie",
            "Ventes de produits fabriqués dans les autres Etats parties de la Région (2)",
            "Ventes de produits fabriqués hors Région (2)",
            "Ventes de produits fabriqués groupe",
            "Ventes de produits fabriqués sur internet",
            "TOTAL : VENTES DE PRODUITS FABRIQUES",
            "Ventes  de travaux et services dans l'Etat partie",
            "Ventes  de travaux et services dans les autres Etats parties de la Région (2)",
            "Ventes de travaux et services hors Région (2)",
            "Ventes de travaux et services  groupe",
            "Ventes de travaux et services  sur internet",
            "TOTAL : VENTES DE TRAVAUX ET SERVICES VENDUS",
            "Produits accessoires à détailler par nature d'activité économique :\ndont le détail de la rubrique \"Divers\" de la Fiche R2",
            "TOTAL : CHIFFRES D'AFFAIRES",
            "Production immobilisée",
            "Subventions d'exploitation",
            "Autres produits (1)",
            "TOTAL : AUTRES PRODUITS",
            "TOTAL"
        ]
    },
    "22": {
        code: "22",
        titre: "ACHATS",
        lignes: [
            "Achats de marchandises dans l'Etat partie",
            "Achats de marchandises dans les autres Etats parties de  la Région (2)",
            "Achats de marchandises hors Région (2)",
            "Achats de marchandises groupe",
            "TOTAL : ACHATS DE MARCHANDISES",
            "Achats de matières premières et fournitures liées  dans l'Etat partie",
            "Achats de matères premières et fournitures liées  dans les autres Etats parties de la Région (2)",
            "Achats matières premières et fournitures liées hors Région (2)",
            "Achats matières premières et fournitures liées groupe",
            "TOTAL : ACHATS MATIERES PREMIERES ET FOURNITURES LIEES",
            "Matières consommables",
            "Matières combustibles",
            "Produits d'entretien",
            "Fournitures d'atelier, d'usine et de magasin",
            "Eau",
            "Electricité",
            "Autres énergies",
            "Fourniture d'entretien",
            "Fourniture de bureau",
            "Petit matériel et outillages",
            "Achats études, prestations de services, de travaux matériels\net équipements",
            "Achats d'emballages",
            "Frais sur achats (1)",
            "Remises rabais, remises et ristournes (non ventilés)",
            "TOTAL : AUTRES ACHATS"
        ]
    },
    "23": {
        code: "23",
        titre: "TRANSPORTS",
        lignes: [
            "Transports sur ventes",
            "Transports pour le compte de tiers",
            "Transport du personnel",
            "Transports de plis",
            "Voyage déplacement (transport)",
            "Transport entre établissements ou chantiers",
            "Transports administratifs",
            "TOTAL"
        ]
    },
    "24": {
        code: "24",
        titre: "SERVICES EXTERIEURS",
        lignes: [
            "Sous-traitance générale",
            "Locations et charges locatives",
            "Redevances de location acquisition",
            "Entretien, réparations et maintenance",
            "Primes d'assurance",
            "Etudes, recherches et documentation",
            "Publicité, publications, relations publiques",
            "Frais de télécommunications",
            "Frais bancaires",
            "Rémunérations d'intermédiaires et de conseils",
            "Frais de formation du personnel",
            "Redevances pour brevets, licences, logiciels, concession\net droits similaires",
            "Cotisations",
            "Rémunérations de personnel extérieur à l'entité",
            "Autres charges externes",
            "TOTAL"
        ]
    },
    "25": {
        code: "25",
        titre: "IMPOTS ET TAXES",
        lignes: [
            "Impôts et taxes directs",
            "Impôts et taxes indirects",
            "Droits d'enregistrement",
            "Pénalités et amendes fiscales",
            "Autres impôts et taxes",
            "TOTAL"
        ]
    },
    "26": {
        code: "26",
        titre: "AUTRES CHARGES",
        lignes: [
            "Pertes sur créances clients",
            "Pertes sur autres débiteurs",
            "Quote-part de résultat sur opérations faites en commun",
            "Valeur comptable des cessions courantes d'immobilisations",
            "Perte de change sur créances et dettes commerciales",
            "Pénalités et amendes pénales",
            "Indemnités de fonction et autres rémunérations d'administrateurs",
            "Dons et mécénat",
            "Autres charges diverses",
            "Charges pour dépréciations et provisions pour risques à court terme d'exploitation (voir note 28)",
            "TOTAL"
        ]
    },
    "27A": {
        code: "27A",
        titre: "CHARGES DE PERSONNEL",
        lignes: [
            "Rémunérations directes versées au personnel national",
            "Rémunérations directes versées au personnel non national",
            "Indemnités forfaitaires versées au personnel",
            "Charges  sociales (personnel national)",
            "Charges sociales (personnel non national)",
            "Rémunérations et charges sociales de l'exploitant individuel",
            "Rémunération transférée de personnel extérieur",
            "Autres charges sociales",
            "TOTAL"
        ]
    },
    "27B": {
        code: "27B",
        titre: "EFFECTIFS, MASSE SALARIALE ET PERSONNEL EXTERIEUR",
        lignes: [
            "YA",
            "YB",
            "YC",
            "YD",
            "YE",
            "YF",
            "YG",
            "YH",
            "YI",
            "YJ",
            "YK",
            "YL",
            "YM",
            "YN",
            "YO"
        ]
    },
    "28": {
        code: "28",
        titre: "DOTATIONS ET CHARGES POUR PROVISIONS ET DEPRECIATIONS",
        lignes: [
            "NATURE",
            "Provisions réglementées",
            "Provisions financières pour risques et charges",
            "Dépréciations des immobilisations",
            "TOTAL DOTATIONS",
            "Dépréciations des stocks et en cours",
            "Dépréciations des comptes  fournisseurs",
            "Dépréciations des comptes clients",
            "Dépréciations autres créances d'exploitation",
            "Dépréciations des comptes de créances HAO",
            "Dépréciations des titres de placement",
            "Dépréciations des valeurs à encaisser",
            "Dépréciations des comptes banques",
            "Dépréciations des comptes établissements financiers et assimilés",
            "Dépréciations des comptes d'instruments de trésorerie",
            "Provisions pour risques à court terme d'exploitation",
            "Provisions pour risques à court terme HAO",
            "Provisions pour risques à court terme à caractère financier",
            "TOTAL CHARGES POUR DEPRECIATIONS ET PROVISIONS A COURT TERME",
            "TOTAL"
        ]
    },
    "29": {
        code: "29",
        titre: "CHARGES ET REVENUS FINANCIERS",
        lignes: [
            "Intérêts des emprunts",
            "Intérêts dans loyers de locations acquisition",
            "Escomptes accordés",
            "Autres intérêts",
            "Escomptes des effets de commerce",
            "Pertes de change financières",
            "Pertes sur cessions de titres de placement",
            "Malis provenant d’attribution gratuite d’actions au personnel salarié et aux dirigeants",
            "Pertes et charges sur risques financiers",
            "Charges pour dépréciation et provisions à court terme à caractère financier (voir note 28)",
            "SOUS TOTAL : FRAIS FINANCIERS (A)",
            "Intérêts de prêts et créances diverses",
            "Revenus de participations et autres titres immobilisés",
            "Escomptes obtenus",
            "Revenus de placement",
            "Intérêts dans loyers de location-financement",
            "Gains de change financiers",
            "Gains sur cessions de titres de placement",
            "Gains sur risques financiers",
            "Reprises de charges pour dépréciation et provisions à court terme à caractère financier (voir note 28)",
            "SOUS TOTAL : REVENUS FINANCIERS (B)",
            "SOUS TOTAL (contrôle) : RESULTAT FINANCIER (B) - (A)"
        ]
    },
    "30": {
        code: "30",
        titre: "AUTRES CHARGES ET PRODUITS HAO",
        lignes: [
            "Charges HAO constatées  (compte 831) à  détailler  :",
            "Charges liées aux opéations de restructuration",
            "Pertes sur créances HAO",
            "Dons et libéralités accordés",
            "Abandons de créances consentis",
            "Charges pour dépréciations et provisions pour risques à court terme  HAO",
            "Dotations hors activités ordinaires",
            "Participation des travailleurs",
            "SOUS TOTAL : AUTRES CHARGES HAO (ligne RP du Compte de Résultat)",
            "Produits HAO constatés (compte 841) à détailler :",
            "Produits liés aux opérations de restructuration",
            "Indemnités et subventions HAO (entité agricole)",
            "Dons et libéralités obtenus",
            "Abandons de créances obtenus",
            "Transfert de charges H.A.O",
            "Reprises de charges pour dépréciations et provisions pour risques à court terme HAO",
            "Reprises des charges, provisions et dépréciations H.A.O",
            "Subventions d'équilibre",
            "SOUS TOTAL : AUTRES PRODUITS HAO (ligne TO du Compte de Résultat)"
        ]
    },
    "31": {
        code: "31",
        titre: "REPARTITION DU RESULTAT ET AUTRES ELEMENTS CARACTERISTIQUES DES CINQ DERNIERS EXERCICES",
        lignes: [
            "EXERCICES CONCERNES (1)",
            "NATURE DES INDICATIONS",
            "STRUCTURE DU CAPITAL A LA CLOTURE DE L'EXERCICE (2)",
            "Capital social",
            "Actions ordinaires",
            "Actions à dividendes prioritaires (A.D.P) sans droit de vote",
            "Actions nouvelles à émettre :"
        ]
    },
    "32": {
        code: "32",
        titre: "PRODUCTION DE L'EXERCICE",
        lignes: [
            "DESIGNATION DU PRODUIT (1)",
            "NON VENTILE",
            "TOTAL"
        ]
    },
    "33": {
        code: "33",
        titre: "ACHATS DESTINES A LA PRODUCTION",
        lignes: [
            "DESIGNATION DES MATIERES ET PRODUITS (1)",
            "NON VENTILE",
            "TOTAL"
        ]
    },
    "34": {
        code: "34",
        titre: "FICHE DE SYNTHESE DES PRINCIPAUX INDICATEURS FINANCIERS",
        lignes: [
            "( EN  MILLIERS DE FRANCS)",
            "ANALYSE DE L'ACTIVITE",
            "SOLDES INTERMEDIAIRES DE GESTION",
            "CHIFFRE D'AFFAIRES",
            "MARGE COMMERCIALE",
            "VALEUR AJOUTEE",
            "EXCEDENT BRUT D'EXPLOITATION (EBE)",
            "RESULTAT D'EXPLOITATION",
            "RESULTAT FINANCIER",
            "RESULTAT DES ACTIVITES ORDINAIRES",
            "RESULTAT HORS ACTIVITES ORDINAIRES",
            "RESULTAT NET",
            "DETERMINATION DE LA CAPACITE D'AUTOFINANCEMENT",
            "Excédent brut d'exploitation (EBE)",
            "+ Valeurs comptables des cessions courantes d’immobilisation  (compte 654)"
        ]
    },
    "35": {
        code: "35",
        titre: "LISTE DES INFORMATIONS SOCIALES, ENVIRONNEMENTALES ET SOCIETALES A FOURNIR",
        lignes: [
            "Note obligatoire pour les entités ayant un effectif de plus de 250 salariés",
            "Liste des informations sociales, environnementales et sociétales à fournir",
            "INFORMATIONS SOCIALES",
            "Emploi (2000 caractères maximum) :",
            "•  l'effectif total et la répartition des salariés par sexe, âge et zone géographique ;",
            "•  les embauches et les licenciements ;",
            "•  les rémunérations et leur évolution.",
            "Relations sociales (2000 caractères maximum) :",
            "•  l'organisation du dialogue social ;",
            "•  le bilan des accords collectifs.",
            "Santé et sécurité (2000 caractères maximum) :",
            "•  les conditions de santé et de sécurité au travail ;",
            "•  le bilan des accords signés avec les organisations syndicales ou les représentants du personnel en matière\nde santé et de sécurité au travail.",
            "Formation (2000 caractères maximum) :",
            "•  les politiques mises en œuvre en matière de formation ;",
            "•  le nombre total d'heures de formation.",
            "Égalité de traitement (2000 caractères maximum) :",
            "•  les mesures prises en faveur de l'égalité entre les femmes et les hommes ;",
            "•  les mesures prises en faveur de l'emploi et de l'insertion des personnes handicapées ;",
            "INFORMATIONS ENVIRONNEMENTALES",
            "Politique générale en matière environnementale (2000 caractères maximum) :",
            "•  l'organisation de la société pour prendre en compte les questions environnementales et, le cas échéant, les démarches\nd'évaluation ou de certification en matière d'environnement ;",
            "•  les actions de formation et d'information des salariés menées en matière de protection de l'environnement ;",
            "•  les moyens consacrés à la prévention des risques environnementaux et des pollutions.",
            "Pollution et gestion des déchets (2000 caractères maximum) :",
            "•  les mesures de prévention, de réduction ou de réparation de rejets dans l'air, l'eau et le sol affectant gravement l'environnement ;",
            "•  les mesures de prévention, de recyclage et d'élimination des déchets ;"
        ]
    }
};

// Ordre d'affichage officiel des notes (numérotation DGI)
const ORDRE_NOTES = [
    '1','2','3A','3B','3C','3D','3E','4','5','6','7','8','8A','8B','8C','9','10','11','12',
    '13','14','15A','15B','16A','16B','16B BIS','16C','17','18','19','20','21','22','23',
    '24','25','26','27A','27B','28','29','30','31','32','33','34','35'
];

module.exports = { NOTES_CATALOGUE, ORDRE_NOTES };

