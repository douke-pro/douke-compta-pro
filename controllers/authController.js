// controllers/authController.js
const jwt = require('jsonwebtoken');
const xmlrpc = require('xmlrpc');

const {
  ODOO_URL,
  ODOO_DB,
  ODOO_USERNAME, // not used for auth; users must authenticate with their own Odoo credentials
  ODOO_API_KEY,  // not used for auth; kept for future service calls if needed
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
 * Odoo XML-RPC client helpers
 */
function getCommonClient() {
  const baseUrl = normalizeOdooUrl(ODOO_URL);
  return xmlrpc.createClient({ url: `${baseUrl}/xmlrpc/2/common` });
}

function getObjectClient() {
  const baseUrl = normalizeOdooUrl(ODOO_URL);
  return xmlrpc.createClient({ url: `${baseUrl}/xmlrpc/2/object` });
}

function odooExecuteKw(uid, model, method, args = [], kwargs = {}) {
  return new Promise((resolve, reject) => {
    try {
      const object = getObjectClient();
      object.methodCall(
        'execute_kw',
        [ODOO_DB, uid, null, model, method, args, kwargs],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Minimal Odoo XML-RPC authenticate
 * Each person authenticates with their own Odoo credentials on YOUR tenant/database.
 */
async function odooAuthenticate({ username, password }) {
  return new Promise((resolve, reject) => {
    try {
      const common = getCommonClient();
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
 * Fetch allowed companies for the authenticated user from your Odoo tenant
 * - Reads res.users.allowed_company_ids for the uid
 * - Loads res.company names for presentation
 * - Returns only companies the user is authorized to manage
 */
async function getUserCompanies(uid) {
  // Read user with allowed_company_ids
  const users = await odooExecuteKw(uid, 'res.users', 'read', [[uid], ['allowed_company_ids', 'partner_id', 'name']]);
  const user = Array.isArray(users) && users[0] ? users[0] : null;
  const allowedIds = user?.allowed_company_ids || [];

  if (!allowedIds.length) {
    return [];
  }

  // Load company names
  const companies = await odooExecuteKw(uid, 'res.company', 'read', [allowedIds, ['id', 'name']]);

  // Map to frontend shape; systeme default is NORMAL unless you store a flag elsewhere
  return companies.map(c => ({
    id: c.id,
    name: c.name,
    systeme: 'NORMAL',
  }));
}

/**
 * Default company selection logic (must be one of the allowed companies)
 */
function pickDefaultCompany(companies) {
  if (!companies || companies.length === 0) return null;
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
 * Guarantees:
 * - Authenticates only against YOUR Odoo tenant/database (ODOO_URL/ODOO_DB)
 * - Returns only companies the user is allowed to manage
 */
async function loginUser(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return createJsonResponse(res, 400, 'Email et mot de passe sont requis');
    }

    // Authenticate the person against YOUR Odoo tenant using their credentials
    const uid = await odooAuthenticate({ username: email, password });

    // OPTIONAL: derive profile heuristically; later tie to Odoo groups
    const profile = email.includes('admin') ? 'ADMIN' :
                    email.includes('collab') ? 'COLLABORATEUR' :
                    email.includes('caissier') ? 'CAISSIER' : 'USER';
    const name = email.split('@')[0];

    // Enforce per-user isolation: fetch allowed companies from Odoo
    const companiesList = await getUserCompanies(uid);
    if (!companiesList.length) {
      return createJsonResponse(res, 403, 'Aucune entreprise autorisée pour cet utilisateur.');
    }

    const defaultCompany = pickDefaultCompany(companiesList);

    // Issue JWT containing allowed companies and selected company
    const token = signToken({
      uid,
      email,
      profile,
      allowedCompanyIds: companiesList.map(c => c.id),
      selectedCompanyId: defaultCompany.id,
      systeme: defaultCompany.systeme,
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
