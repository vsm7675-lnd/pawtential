/**
 * Script to encrypt breeds.csv data
 * Run with: bun run scripts/encrypt-data.ts
 */

import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const ITERATIONS = 100000;

function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, 32, 'sha256');
}

function encrypt(data: string, secret: string): Buffer {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(secret, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function main() {
  const csvPath = path.join(process.cwd(), 'upload', 'breeds.csv');
  const encPath = path.join(process.cwd(), 'data', 'breeds.enc');
  const envPath = path.join(process.cwd(), '.env.local');
  
  console.log('🔐 Encrypting breeds data...\n');
  
  // Generate new key
  const key = generateEncryptionKey();
  console.log('Generated encryption key:', key);
  
  // Read CSV
  const csvData = await fs.readFile(csvPath, 'utf-8');
  console.log(`Read ${csvData.length} bytes from ${csvPath}`);
  
  // Encrypt
  const encrypted = encrypt(csvData, key);
  console.log(`Encrypted to ${encrypted.length} bytes`);
  
  // Save encrypted file
  await fs.writeFile(encPath, encrypted);
  console.log(`Saved encrypted file to ${encPath}`);
  
  // Create/update .env.local
  const envContent = `# Pawtential Encryption Key\n# KEEP THIS SECRET - DO NOT COMMIT TO GIT\nENCRYPTION_KEY=${key}\n`;
  await fs.writeFile(envPath, envContent);
  console.log(`\nSaved key to ${envPath}`);
  
  // Verify decryption works
  console.log('\n✅ Verifying decryption...');
  const decryptKey = deriveKey(key, encrypted.subarray(0, SALT_LENGTH));
  const iv = encrypted.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encrypted.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const encryptedData = encrypted.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, decryptKey, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]).toString('utf-8');
  
  const lines = decrypted.split('\n').length;
  console.log(`✅ Verification passed! Decrypted ${lines} lines`);
  
  console.log('\n🎉 Done! Remember to:');
  console.log('   1. Keep .env.local secure and backed up');
  console.log('   2. Add breeds.csv to .gitignore (if not already)');
  console.log('   3. Set ENCRYPTION_KEY in your production environment');
}

main().catch(console.error);
