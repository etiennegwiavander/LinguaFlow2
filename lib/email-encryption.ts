/**
 * Email Encryption Utilities
 * Provides secure encryption/decryption for SMTP passwords and sensitive data
 */

import crypto from 'crypto';

// Get encryption key from environment variable
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'default-key-change-in-production-32chars';
const ALGORITHM = 'aes-256-cbc';

/**
 * Derives a 32-byte key from the encryption key
 */
function getKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

/**
 * Encrypts a password using AES-256-CBC
 */
export function encryptPassword(password: string): string {
  try {
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Combine IV and encrypted data
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Decrypts a password using AES-256-CBC
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    const parts = encryptedPassword.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted password format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt password');
  }
}

/**
 * Validates if an encrypted password can be decrypted
 */
export function validateEncryptedPassword(encryptedPassword: string): boolean {
  try {
    decryptPassword(encryptedPassword);
    return true;
  } catch {
    return false;
  }
}