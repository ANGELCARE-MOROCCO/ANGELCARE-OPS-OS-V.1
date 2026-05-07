import crypto from 'crypto';
const ALGO = 'aes-256-gcm';
function key() {
  const secret = process.env.EMAIL_CREDENTIAL_SECRET || 'temporary_development_secret_replace_in_env_32_chars';
  return crypto.createHash('sha256').update(secret).digest();
}
export function encryptSecret(value: string) {
  if (!value) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.');
}
export function decryptSecret(payload?: string | null) {
  if (!payload) return '';
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) return '';
  const decipher = crypto.createDecipheriv(ALGO, key(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}
