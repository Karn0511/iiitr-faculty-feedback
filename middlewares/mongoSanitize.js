// ============================================================
// MONGO SANITIZE MIDDLEWARE
// Prevents NoSQL injection attacks by stripping MongoDB
// operators ($, .) from request body, query, and params.
//
// OWASP A03:2021 — Injection Prevention
// ============================================================

/**
 * Recursively sanitize an object by removing keys that start
 * with '$' or contain '.', which are MongoDB query operators.
 *
 * @param {any} obj - The object to sanitize
 * @returns {any} sanitized copy
 */
function sanitize(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item));
    }

    const sanitized = {};
    for (const key of Object.keys(obj)) {
        // Strip keys starting with '$' (MongoDB operators like $gt, $ne, $regex)
        if (key.startsWith('$')) {
            console.warn(`[SECURITY] Stripped malicious key "${key}" from request`);
            continue;
        }
        // Strip keys containing '.' (nested field injection)
        if (key.includes('.')) {
            console.warn(`[SECURITY] Stripped dot-notation key "${key}" from request`);
            continue;
        }
        sanitized[key] = sanitize(obj[key]);
    }
    return sanitized;
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params
 * to prevent NoSQL injection attacks against MongoDB.
 */
function mongoSanitize(req, res, next) {
    if (req.body)   req.body   = sanitize(req.body);
    if (req.query)  req.query  = sanitize(req.query);
    if (req.params) req.params = sanitize(req.params);
    next();
}

module.exports = mongoSanitize;
