import { HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';

/**
 * For onCall functions: throws HttpsError if request is unauthenticated.
 * @param {object} request - The onCall request object
 * @returns {object} request.auth
 */
export function requireCallAuth(request) {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Authentication required.');
    }
    return request.auth;
}

/**
 * For onRequest functions: verifies the Bearer token in the Authorization header.
 * Returns the decoded token on success, or writes a 401 response and returns null.
 * @param {object} req - Express-style request
 * @param {object} res - Express-style response
 * @returns {object|null} decoded token or null
 */
export async function requireAuthToken(req, res) {
    const authHeader = req.headers.authorization ?? '';
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) {
        res.status(401).json({ ok: false, error: 'Missing or invalid Authorization header.' });
        return null;
    }
    try {
        return await getAuth().verifyIdToken(match[1]);
    } catch {
        res.status(401).json({ ok: false, error: 'Invalid or expired ID token.' });
        return null;
    }
}
