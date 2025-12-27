// controllers/authController.js
const jwt = require('jsonwebtoken');
const xmlrpc = require('xmlrpc');

const {
  ODOO_URL,
  ODOO_DB,
  ODOO_USERNAME,
  ODOO_API_KEY,
  JWT_SECRET = 'change_me_in_env',
} = process.env;

/**
 * Helpers
 */
function signToken(payload, expiresIn = '12h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function createJsonResponse(res, status, dataOrError) {
  if (status >= 400) {
    return res.status(status).json({ error: dataOrError });
  }
  return res.status(status).json({ data: dataOrError });
}

function normalizeOdooUrl(url) {
  // Remove trailing slash to avoid XML-RPC path issues
  return url ? url.replace(/\/+$/, '') : '';
}

/**
 * Minimal Odoo XML-RPC authenticate
 */
async function odooAuthenticate({ username, password }) {
  return new Promise((resolve, reject) => {
    try {
      const baseUrl = normalizeOdooUrl(ODOO_URL);
      const common = xmlrpc.createClient({ url: `${baseUrl}/xmlrpc/2/common` });

      common.methodCall(
        'authenticate',
        [ODOO_DB, username, password, {}],
        (err, uid) => {
          if (err) return reject(err);
          if (!uid || uid === false) return reject(new Error('Identifiants invalides'));
          resolve(uid);
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * getCompanies for a user (placeholder consistent with frontend expectations)
 * In production: query Odoo for partner/analytic accounts assigned to the user.
 */
async function getUserCompanies(uid) {
  // Return a minimal, deterministic structure matching script.js expectations
  return [
    { id: 101, name: 'SYSTÈME NORMAL Sarl', systeme: 'NORMAL' },
    { id: 102, name: 'MINIMAL TRESO PME', systeme: 'MINIMAL' },
    { id: 103, name: 'DOUKÈ HOLDING SA', systeme: 'NORMAL' },
  ];
}

/**
 * Default company selection logic
 */
function pickDefaultCompany(companies) {
  if (!companies || companies.length === 0) return null;
  // Prefer NORMAL if available, else first
  const normal = companies.find(c => c.systeme === 'NORMAL');
  return normal || companies[0];
}

/**
 * Register user (stub but structured)
 */
async function registerUser(req, res) {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return createJsonResponse(res, 400, 'Email et mot de passe sont requis');
    }
    // In production: create user/partner/analytic vault in Odoo here.
    return createJsonResponse(res, 201, {
      message: 'Inscription en cours de raccordement (stub).',
      email,
      name: name || null,
    });
  } catch (error) {
    return createJsonResponse(res, 500, error.message || 'Erreur serveur');
  }
}

/**
 * Login via Odoo XML-RPC and return JWT + profile + companies (exact shape expected by script.js)
 */
async function loginUser(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return createJsonResponse(res, 400, 'Email et mot de passe sont requis');
    }

    // Authenticate against Odoo
    const uid = await odooAuthenticate({ username: email, password });

    // In production: fetch real profile and display name from Odoo user
    const profile = email.includes('admin') ? 'ADMIN' :
                    email.includes('collab') ? 'COLLABORATEUR' :
                    email.includes('caissier') ? 'CAISSIER' : 'USER';
    const name = email.split('@')[0];

    // Companies list expected by frontend
    const companiesList = await getUserCompanies(uid);
    const defaultCompany = pickDefaultCompany(companiesList);

    // Issue JWT containing minimal claims used by protect middleware and frontend
    const token = signToken({
      uid,
      email,
      profile,
      companyId: defaultCompany ? defaultCompany.id : null,
      systeme: defaultCompany ? defaultCompany.systeme : null,
    });

    return createJsonResponse(res, 200, {
      token,
      profile,
      name,
      companiesList,
      defaultCompany,
    });
  } catch (error) {
    const message = error?.message?.toLowerCase().includes('invalid')
      ? 'Authentification échouée. Veuillez vérifier vos identifiants.'
      : (error.message || 'Erreur serveur inconnue.');
    return createJsonResponse(res, 401, message);
  }
}

/**
 * Assign company (ADMIN only – stubbed, structured response)
 */
async function assignCompany(req, res) {
  try {
    const { userId, companyId } = req.body || {};
    if (!userId || !companyId) {
      return createJsonResponse(res, 400, 'userId et companyId sont requis');
    }
    // In production: write assignment in Odoo security model
    return createJsonResponse(res, 200, {
      message: 'Affectation enregistrée (stub).',
      userId,
      companyId,
    });
  } catch (error) {
    return createJsonResponse(res, 500, error.message || 'Erreur serveur');
  }
}

/**
 * Force logout (invalidate on client-side – server returns acknowledgement)
 */
async function forceLogout(req, res) {
  try {
    // No server-side session to invalidate with pure JWT; client must discard token.
    return createJsonResponse(res, 200, { message: 'Déconnexion forcée demandée. Supprimez le token côté client.' });
  } catch (error) {
    return createJsonResponse(res, 500, error.message || 'Erreur serveur');
  }
}

module.exports = {
  registerUser,
  loginUser,
  assignCompany,
  forceLogout,
};
