// etats-financiers-syscohada.js

import { genererBilan } from './modules/syscohada/normal/bilan.js';
import { genererCompteResultat } from './modules/syscohada/normal/compteResultat.js';
import { genererFluxTresorerie } from './modules/syscohada/normal/fluxTresorerie.js';
import { genererNotesAnnexes as annexesNormal } from './modules/syscohada/normal/notesAnnexes.js';

import { genererEtatRecettesDepenses } from './modules/syscohada/minimal/recettesDepenses.js';
import { genererBilanMinimal } from './modules/syscohada/minimal/bilanMinimal.js';
import { genererNotesAnnexes as annexesMinimal } from './modules/syscohada/minimal/notesAnnexes.js';

// 🏢 Structure multi-entreprises (à remplacer par ton backend réel)
const entreprises = {
  E001: {
    nom: "Alpha SARL",
    systeme: "normal",
    ecritures: [
      { compte: 201, montant: 500000, libellé: "Logiciel de gestion" },
      { compte: 411, montant: 250000, libellé: "Créance client A" },
      { compte: 512, montant: 150000, libellé: "Banque" },
      { compte: 606, montant: 80000, libellé: "Achats de fournitures" },
      { compte: 701, montant: 300000, libellé: "Vente de marchandises" },
      { compte: 681, montant: 50000, libellé: "Impôt sur le résultat" },
      { compte: 101, montant: 1000000, libellé: "Capital social" }
    ]
  },
  E002: {
    nom: "Beta SA",
    systeme: "minimal",
    ecritures: [
      { compte: 701, montant: 200000, libellé: "Vente de services" },
      { compte: 606, montant: 50000, libellé: "Achats divers" },
      { compte: 512, montant: 100000, libellé: "Banque" },
      { compte: 411, montant: 30000, libellé: "Créance client B" },
      { compte: 101, montant: 500000, libellé: "Capital social" }
    ]
  }
};

// 🔒 Sélecteurs HTML
const selectEntreprise = document.getElementById('activeCompanySelect');
const selectSysteme = document.getElementById('systeme');
const zoneAffichage = document.getElementById('etat-financier');

// 🚨 Sécurité : vérification des éléments HTML
if (!selectEntreprise || !selectSysteme || !zoneAffichage) {
  console.warn('⛔ Éléments HTML manquants – affichage désactivé');
  return;
}

// 🧠 Initialisation des entreprises (une seule fois)
function initialiserEntreprises() {
  if (selectEntreprise.options.length > 1) return;

  Object.entries(entreprises).forEach(([id, ent]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = ent.nom;
    selectEntreprise.appendChild(option);
  });
}

// 🎯 Événements de sélection
selectEntreprise.addEventListener('change', afficherEtats);
selectSysteme.addEventListener('change', afficherEtats);

// 🧭 Protection contre récursion
let affichageEnCours = false;

// 📤 Affichage des états financiers
function afficherEtats() {
  if (affichageEnCours) return;
  affichageEnCours = true;

  try {
    const entrepriseId = selectEntreprise.value;
    const systemeChoisi = selectSysteme.value;
    zoneAffichage.innerHTML = '';

    if (!entrepriseId || !entreprises[entrepriseId]) {
      zoneAffichage.innerHTML = '<p class="text-red-600">Aucune entreprise sélectionnée.</p>';
      return;
    }

    const { ecritures, nom } = entreprises[entrepriseId];

    if (systemeChoisi === 'normal') {
      const bilan = genererBilan(ecritures);
      const resultat = genererCompteResultat(ecritures);
      const flux = genererFluxTresorerie(ecritures);
      const annexes = annexesNormal(ecritures, {
        methodes: "Méthode d'amortissement linéaire.",
        engagements: "Contrats en cours.",
        evenements: "Aucun événement postérieur significatif."
      });

      afficherBloc(zoneAffichage, `📘 Bilan – ${nom}`, bilan);
      afficherBloc(zoneAffichage, `📘 Compte de résultat – ${nom}`, resultat);
      afficherBloc(zoneAffichage, `📘 Flux de trésorerie – ${nom}`, flux);
      afficherBloc(zoneAffichage, `📘 Notes annexes – ${nom}`, annexes, true);
    } else {
      const recettesDepenses = genererEtatRecettesDepenses(ecritures);
      const bilanMinimal = genererBilanMinimal(ecritures);
      const annexes = annexesMinimal(ecritures, {
        methodes: "Encaissements/décaissements réels.",
        engagements: "Aucun engagement hors bilan.",
        evenements: "Renouvellement de bail prévu."
      });

      afficherBloc(zoneAffichage, `📗 Recettes et dépenses – ${nom}`, recettesDepenses);
      afficherBloc(zoneAffichage, `📗 Bilan minimal – ${nom}`, bilanMinimal);
      afficherBloc(zoneAffichage, `📗 Annexes simplifiées – ${nom}`, annexes, true);
    }
  } finally {
    affichageEnCours = false;
  }
}

// 📦 Affichage d’un bloc
function afficherBloc(zone, titre, contenu, isMarkdown = false) {
  const bloc = document.createElement('div');
  bloc.className = 'mb-6 p-4 border rounded bg-white shadow';
  bloc.innerHTML = `<h2 class="text-xl font-bold mb-2">${titre}</h2>` +
    (isMarkdown ? `<pre>${contenu}</pre>` : `<pre>${JSON.stringify(contenu, null, 2)}</pre>`);
  zone.appendChild(bloc);
}

// 🚀 Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  initialiserEntreprises();
  afficherEtats();
});
