// etats-financiers-syscohada.js

import { genererBilan } from './modules/syscohada/normal/bilan.js';
import { genererCompteResultat } from './modules/syscohada/normal/compteResultat.js';
import { genererFluxTresorerie } from './modules/syscohada/normal/fluxTresorerie.js';
import { genererNotesAnnexes as annexesNormal } from './modules/syscohada/normal/notesAnnexes.js';

import { genererEtatRecettesDepenses } from './modules/syscohada/minimal/recettesDepenses.js';
import { genererBilanMinimal } from './modules/syscohada/minimal/bilanMinimal.js';
import { genererNotesAnnexes as annexesMinimal } from './modules/syscohada/minimal/notesAnnexes.js';

// 🏢 Exemple de structure multi-entreprises (à remplacer par ton backend réel)
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

// 🧠 Initialisation du sélecteur d’entreprises
const selectEntreprise = document.getElementById('entreprise');
Object.entries(entreprises).forEach(([id, ent]) => {
  const option = document.createElement('option');
  option.value = id;
  option.textContent = ent.nom;
  selectEntreprise.appendChild(option);
});

// 🎯 Gestion du changement de système ou d’entreprise
document.getElementById('systeme').addEventListener('change', afficherEtats);
document.getElementById('entreprise').addEventListener('change', afficherEtats);

// 📤 Fonction d’affichage des états financiers
function afficherEtats() {
  const entrepriseId = document.getElementById('entreprise').value;
  const systemeChoisi = document.getElementById('systeme').value;
  const zone = document.getElementById('etat-financier');
  zone.innerHTML = '';

  if (!entrepriseId || !entreprises[entrepriseId]) {
    zone.innerHTML = '<p class="text-red-600">Aucune entreprise sélectionnée.</p>';
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

    afficherBloc(zone, `📘 Bilan – ${nom}`, bilan);
    afficherBloc(zone, `📘 Compte de résultat – ${nom}`, resultat);
    afficherBloc(zone, `📘 Flux de trésorerie – ${nom}`, flux);
    afficherBloc(zone, `📘 Notes annexes – ${nom}`, annexes, true);
  } else {
    const recettesDepenses = genererEtatRecettesDepenses(ecritures);
    const bilanMinimal = genererBilanMinimal(ecritures);
    const annexes = annexesMinimal(ecritures, {
      methodes: "Encaissements/décaissements réels.",
      engagements: "Aucun engagement hors bilan.",
      evenements: "Renouvellement de bail prévu."
    });

    afficherBloc(zone, `📗 Recettes et dépenses – ${nom}`, recettesDepenses);
    afficherBloc(zone, `📗 Bilan minimal – ${nom}`, bilanMinimal);
    afficherBloc(zone, `📗 Annexes simplifiées – ${nom}`, annexes, true);
  }
}

// 📦 Fonction d’affichage d’un bloc
function afficherBloc(zone, titre, contenu, isMarkdown = false) {
  const bloc = document.createElement('div');
  bloc.className = 'mb-6 p-4 border rounded bg-white shadow';
  bloc.innerHTML = `<h2 class="text-xl font-bold mb-2">${titre}</h2>` +
    (isMarkdown ? `<pre>${contenu}</pre>` : `<pre>${JSON.stringify(contenu, null, 2)}</pre>`);
  zone.appendChild(bloc);
}

