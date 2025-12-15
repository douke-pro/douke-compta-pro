const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // Initialisation de l'accès à PostgreSQL
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Récupération du hachage car Prisma ne le gère pas directement


// Génère un JWT
const generateToken = (id) => {
    // Note : L'ID est maintenant un String CUID (ou UUID) généré par Prisma
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // 30 jours de validité
    });
};

// Logique POST /api/auth/register (CRÉATION DE COMPTE + ENTREPRISE)
const registerUser = async (req, res) => {
    const { username, email, password, companyName, dateDebutExercice } = req.body; 
    
    // 1. Recherche d'utilisateur via Prisma (PostgreSQL)
    // Remplacement de User.findOne({ email })
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
    }
    
    // 2. Hachage du mot de passe (Doit être fait ici, car nous n'avons plus le middleware Mongoose)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        // --- 3. Création de l'Entreprise d'abord (Pour obtenir l'ID réel) ---
        
        // Création de l'entreprise dans la DB (Remplacement du MOCK)
        const newCompany = await prisma.company.create({
            data: {
                nom: companyName,
                // Les autres champs sont par défaut (XOF, normal)
                dateDebutExercice: new Date(dateDebutExercice || Date.now()),
                // L'administrateurId sera mis à jour après la création de l'utilisateur
            }
        });
        
        // --- 4. Création de l'Utilisateur ---
        // Remplacement de User.create({ ... })
        const user = await prisma.user.create({
            data: {
                utilisateurNom: username,
                email,
                password: hashedPassword, // Haché
                utilisateurRole: 'ADMIN', 
                entrepriseContextId: newCompany.id, // ID réel de la nouvelle entreprise
                entreprisesAccessibles: [newCompany.id],
                multiEntreprise: true,
            },
            // On sélectionne les champs que l'on veut retourner, excluant le hash du mot de passe
            select: { id: true, utilisateurNom: true, utilisateurRole: true, entrepriseContextId: true, multiEntreprise: true }
        });

        // 5. Mise à jour de l'administrateurId de l'entreprise
        await prisma.company.update({
            where: { id: newCompany.id },
            data: { administrateurId: user.id }
        });


        // --- 6. Réponse Succès ---
        res.status(201).json({
            utilisateurId: user.id,
            utilisateurNom: user.utilisateurNom,
            utilisateurRole: user.utilisateurRole,
            entrepriseContextId: user.entrepriseContextId, 
            entrepriseContextName: newCompany.nom, // Nom réel
            multiEntreprise: user.multiEntreprise,
            token: generateToken(user.id), 
        });

    } catch (error) {
        // Gérer les erreurs de la DB ou du hachage
        console.error("Erreur d'enregistrement :", error);
        res.status(500).json({ error: 'Erreur serveur lors de l\'enregistrement : ' + error.message });
    }
};

// Logique POST /api/auth/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // 1. Recherche d'utilisateur via Prisma
    // Remplacement de User.findOne({ email }).select('+password');
    // Prisma renvoie tous les champs par défaut, y compris le hash, si non exclus explicitement.
    const user = await prisma.user.findUnique({ 
        where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
        
        // 2. Récupérer le nom de l'entreprise à partir de l'ID de contexte
        // Remplacement du placeholder 'Alpha Solutions (Placeholder)'
        const company = await prisma.company.findUnique({
            where: { id: user.entrepriseContextId }
        });

        // Succès: Générer le token et retourner le contexte
        res.json({
            utilisateurId: user.id,
            utilisateurNom: user.utilisateurNom,
            utilisateurRole: user.utilisateurRole,
            entrepriseContextId: user.entrepriseContextId, 
            entrepriseContextName: company ? company.nom : 'Entreprise Inconnue', 
            multiEntreprise: user.multiEntreprise,
            token: generateToken(user.id),
        });
    } else {
        res.status(401).json({ error: 'Identifiants invalides.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
};
