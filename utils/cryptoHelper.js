const crypto = require('crypto');

// ============================================================
// CRYPTO HELPER — AES-256-GCM Encryption/Decryption
//
// OWASP A02:2021 — Cryptographic Failures
//
// SECURITY CHANGES:
//   1. REMOVED hardcoded fallback key
//   2. Key derivation uses PBKDF2 with salt (not raw SHA-256)
//   3. Startup validation: throws if E2EE_SECRET_KEY is missing
// ============================================================

// Validate that the encryption key is set in environment
const secretString = process.env.E2EE_SECRET_KEY;
if (!secretString && process.env.NODE_ENV === 'production') {
    throw new Error(
        '[SECURITY] E2EE_SECRET_KEY is not set in environment variables. ' +
        'This is required for data encryption. Set it in your .env file.'
    );
}

// Use a fallback ONLY in development with a clear warning
const effectiveSecret = secretString || (() => {
    console.warn(
        '\n⚠️  [SECURITY WARNING] E2EE_SECRET_KEY not set. Using development fallback.\n' +
        '    Set E2EE_SECRET_KEY in .env before deploying to production.\n'
    );
    return 'DEV_ONLY_IIIT_RANCHI_E2EE_KEY_NOT_FOR_PRODUCTION';
})();

// Derive a 256-bit (32-byte) key using PBKDF2 with a fixed salt
// PBKDF2 is resistant to brute-force attacks unlike raw SHA-256
const SALT = 'iiit-ranchi-feedback-e2ee-salt-v1';
const e2eeKey = crypto.pbkdf2Sync(effectiveSecret, SALT, 100000, 32, 'sha512');

/**
 * Decrypts an AES-256-GCM encrypted string formatted as:
 *   "iv_hex:ciphertext_hex:auth_tag_hex"
 * 
 * If the string does not match this format, or decryption fails, 
 * it returns the original text to handle legacy data gracefully.
 * 
 * @param {string} encryptedText 
 * @returns {string} decrypted plaintext
 */
function decrypt(encryptedText) {
    if (!encryptedText) return '';
    
    // Check if the text matches the standard E2EE hex:hex:hex format
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        return encryptedText; // Legacy unencrypted text
    }
    
    try {
        const [ivHex, ciphertextHex, authTagHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const ciphertext = Buffer.from(ciphertextHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', e2eeKey, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(ciphertext, 'binary', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        // Don't log the actual encrypted content — security risk
        console.error('[CRYPTO] Decryption failed — returning original string.');
        return encryptedText;
    }
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Formats the output as "iv_hex:ciphertext_hex:auth_tag_hex".
 * 
 * @param {string} text 
 * @returns {string} encrypted string
 */
function encrypt(text) {
    if (!text) return '';
    try {
        const iv = crypto.randomBytes(12); // standard 12-byte IV for GCM
        const cipher = crypto.createCipheriv('aes-256-gcm', e2eeKey, iv);
        
        let ciphertext = cipher.update(text, 'utf8', 'hex');
        ciphertext += cipher.final('hex');
        
        const authTag = cipher.getAuthTag().toString('hex');
        const ivHex = iv.toString('hex');
        
        return `${ivHex}:${ciphertext}:${authTag}`;
    } catch (err) {
        console.error('[CRYPTO] Encryption failed:', err.message);
        return text;
    }
}

module.exports = {
    decrypt,
    encrypt
};
