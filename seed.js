const bcrypt = require('bcryptjs');


async function main() {
  console.log("🌱 Mise à jour des données...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 1. Créer d'abord l'entreprise
    where: { nom: 'Ma Première Entreprise' },
    update: {},
    create: {
      nom: 'Ma Première Entreprise',
      systemeComptable: 'normal',
      devise: 'XOF',
      dateDebutExercice: new Date('2025-01-01'),
      statut: 'Actif',
      administrateurId: 'temp-id' // sera mis à jour
    },
  });

  // 2. Créer l'utilisateur lié à cette entreprise
    where: { email: 'admin@douke.com' },
    update: {
      entrepriseContextId: defaultCompany.id,
      entreprisesAccessibles: [defaultCompany.id]
    },
    create: {
      email: 'admin@douke.com',
      utilisateurNom: 'Administrateur Douke',
      password: hashedPassword,
      utilisateurRole: 'ADMIN',
      multiEntreprise: true,
      entrepriseContextId: defaultCompany.id,
      entreprisesAccessibles: [defaultCompany.id]
    },
  });

  console.log(`✅ Succès !`);
  console.log(`🏢 Entreprise ID: ${defaultCompany.id}`);
  console.log(`👤 Admin lié à l'entreprise.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
