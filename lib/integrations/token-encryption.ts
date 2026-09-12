import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getDerivedKey(salt: Buffer): Buffer {
  const secretKey = process.env.ENCRYPTION_KEY || 'meetlio_fallback_32byte_encryption_key_default';
  return crypto.pbkdf2Sync(secretKey, salt, 100000, KEY_LENGTH, 'sha512');
}

export function encryptToken(text: string): string {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = getDerivedKey(salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: salt:iv:tag:encrypted (base64)
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  } catch (err) {
    console.error('Token Encryption Failed:', err);
    throw new Error('Encryption error');
  }
}

export function decryptToken(encryptedData: string): string {
  if (!encryptedData) return '';
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      // Fallback for unencrypted tokens in legacy dev state
      return encryptedData;
    }

    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encryptedText = Buffer.from(parts[3], 'hex');

    const key = getDerivedKey(salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Token Decryption Failed:', err);
    return '';
  }
}
