import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derives a 32-byte key from a secret using PBKDF2
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, 32, 'sha256');
}

/**
 * Encrypts data using AES-256-GCM
 * Returns: salt(32) + iv(16) + authTag(16) + encryptedData
 */
export function encrypt(data: string, secret: string): Buffer {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(secret, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Combine all parts: salt + iv + authTag + encrypted
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Decrypts data encrypted with AES-256-GCM
 * Expects: salt(32) + iv(16) + authTag(16) + encryptedData
 */
export function decrypt(encryptedData: Buffer, secret: string): string {
  if (encryptedData.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted data: too short');
  }
  
  const salt = encryptedData.subarray(0, SALT_LENGTH);
  const iv = encryptedData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encryptedData.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = encryptedData.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  
  const key = deriveKey(secret, salt);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted.toString('utf8');
}

/**
 * Get the encryption key from environment
 */
export function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    // Fallback for development - in production, this should always be set
    console.warn('WARNING: ENCRYPTION_KEY not set, using development fallback');
    return 'dev-fallback-key-do-not-use-in-production';
  }
  
  return key;
}

/**
 * Decrypt the breeds data file
 */
export async function decryptBreedsData(): Promise<string> {
  const encryptedPath = path.join(process.cwd(), 'data', 'breeds.enc');
  const secret = getEncryptionKey();
  
  try {
    const encryptedData = await fs.readFile(encryptedPath);
    return decrypt(encryptedData, secret);
  } catch (error) {
    // Fallback: try reading raw CSV (for development)
    console.warn('Could not decrypt breeds.enc, falling back to raw CSV');
    const csvPath = path.join(process.cwd(), 'upload', 'breeds.csv');
    return fs.readFile(csvPath, 'utf-8');
  }
}

/**
 * Encrypt a file and save it
 */
export async function encryptFile(
  inputPath: string,
  outputPath: string,
  secret: string
): Promise<void> {
  const data = await fs.readFile(inputPath, 'utf-8');
  const encrypted = encrypt(data, secret);
  await fs.writeFile(outputPath, encrypted);
  console.log(`Encrypted ${inputPath} -> ${outputPath}`);
}

/**
 * Generate a new encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
