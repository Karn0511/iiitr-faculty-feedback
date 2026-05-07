const crypto = require('crypto');

// Shared secret string for End-to-End Encryption
const secretString = process.env.E2EE_SECRET_KEY || 'IIIT_RANCHI_SECURE_E2EE_SECRET_2026';

// Derive a 256-bit (32-byte) key from the secret string using SHA-256
const e2eeKey = crypto.createHash('sha256').update(secretString).digest();

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
        console.error('Decryption failed, returning original string:', err.message);
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
        console.error('Encryption failed:', err.message);
        return text;
    }
}

module.exports = {
    decrypt,
    encrypt
};
