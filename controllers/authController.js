const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * GÉNÉRATION DU TOKEN JWT
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/**
 * INSCRIPTION (REGISTER) 
 * Crée l'Admin, l'Entreprise et l'Affectation de manière atomique (Transaction)
 */
const registerUser = async (req, res) => {
    const { username, email, password, companyName, dateDebutExercice } = req.body;

    try {
        // 1. Vérification email unique
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ error: 'Cet email est déjà utilisé.' });
        }

        // 2. Hachage du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. TRANSACTION PRISMA : Tout ou rien
        const result = await prisma.$transaction(async (tx) => {
            // A. Création de l'entreprise (Système NORMAL par défaut post-création)
            const newCompany = await tx.company.create({
                data: {
                    nom: companyName,
                    dateDebutExercice: new Date(dateDebutExercice || Date.now()),
                    administrateurId: "TEMP_ID", // Sera mis à jour après
                    systemeComptable: 'NORMAL'
                }
            });

            // B. Création de l'utilisateur Admin
            const user = await tx.user.create({
                data: {
                    utilisateurNom: username,
                    email,
                    password: hashedPassword,
                    utilisateurRole: 'ADMIN', // Utilise l'Enum du schéma
                    isOnline: true,           // Session active dès l'inscription
                    entrepriseContextId: newCompany.id,
                    entreprisesAccessibles: [newCompany.id] // Compatibilité legacy
                }
            });

            // C. Mise à jour de l'ID administrateur réel de l'entreprise
            await tx.company.update({
                where: { id: newCompany.id },
                data: { administrateurId: user.id }
            });

            // D. Création de l'affectation dans la table pivot (Exigence Pro v1.4)
            await tx.userCompanyAccess.create({
                data: {
                    userId: user.id,
                    companyId: newCompany.id
                }
            });

            return { user, newCompany };
        });

        // 4. Réponse Succès
        res.status(201).json({
            utilisateurId: result.user.id,
            utilisateurNom: result.user.utilisateurNom,
            utilisateurRole: result.user.utilisateurRole,
            entrepriseContextId: result.user.entrepriseContextId,
            entrepriseContextName: result.newCompany.nom,
            token: generateToken(result.user.id),
        });

    } catch (error) {
        console.error("ERREUR CRITIQUE REGISTER :", error);
        res.status(500).json({ error: 'Erreur serveur lors de la création : ' + error.message });
    }
};

/**
 * CONNEXION (LOGIN)
 * Met à jour le statut isOnline pour valider l'accès middleware
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                affectations: { select: { companyId: true } }
            }
        });

        if (user && (await bcrypt.compare(password, user.password))) {
            
            // Mise à jour du statut isOnline (Requis par le nouveau middleware auth.js)
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: { isOnline: true }
            });

            // Récupérer le nom de l'entreprise de contexte
            const company = await prisma.company.findUnique({
                where: { id: user.entrepriseContextId || "" }
            });

            res.json({
                utilisateurId: updatedUser.id,
                utilisateurNom: updatedUser.utilisateurNom,
                utilisateurRole: updatedUser.utilisateurRole,
                entrepriseContextId: updatedUser.entrepriseContextId,
                entrepriseContextName: company ? company.nom : 'Aucun contexte',
                token: generateToken(updatedUser.id),
            });
        } else {
            res.status(401).json({ error: 'Identifiants invalides.' });
        }
    } catch (error) {
        console.error("ERREUR CRITIQUE LOGIN :", error);
        res.status(500).json({ error: 'Erreur serveur : ' + error.message });
    }
};

/**
 * GOUVERNANCE ADMIN : Affecter une entreprise à un Collaborateur/User
 */
const assignCompany = async (req, res) => {
    const { targetUserId, companyId } = req.body; // Seul l'Admin peut appeler cette route

    try {
        const access = await prisma.userCompanyAccess.create({
            data: {
                userId: targetUserId,
                companyId: companyId
            }
        });
        res.json({ message: "Affectation réussie", access });
    } catch (error) {
        res.status(400).json({ error: "L'utilisateur a déjà accès ou ID invalide." });
    }
};

/**
 * GOUVERNANCE ADMIN : Déconnexion forcée (Kick)
 */
const forceLogout = async (req, res) => {
    const { targetUserId } = req.body;

    try {
        await prisma.user.update({
            where: { id: targetUserId },
            data: { isOnline: false }
        });
        res.json({ message: "L'utilisateur a été déconnecté avec succès." });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la déconnexion forcée." });
    }
};

module.exports = {
    registerUser,
    loginUser,
    assignCompany,
    forceLogout
};
