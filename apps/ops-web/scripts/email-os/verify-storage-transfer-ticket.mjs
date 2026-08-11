import crypto from 'node:crypto'
import {
  signStorageTransferTicket,
  verifyStorageTransferTicket,
} from '../../lib/email-os-core/storage-transfer-ticket.ts'

const previous = process.env.EMAIL_STORAGE_TRANSFER_SIGNING_SECRET
process.env.EMAIL_STORAGE_TRANSFER_SIGNING_SECRET = 'email-os-test-secret-0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function mustThrow(fn, label) {
  let threw = false
  try { fn() } catch { threw = true }
  if (!threw) throw new Error(`${label}: expected rejection`)
}

function b64url(value) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
function signature(payload) {
  return b64url(crypto.createHmac('sha256', process.env.EMAIL_STORAGE_TRANSFER_SIGNING_SECRET).update(payload).digest())
}

try {
  const claims = {
    fileId: 'file-test-1', userId: 'user-test-1', mailboxId: 'mailbox-test-1',
    moduleKey: 'email_os', entityType: 'compose_attachment', entityId: null,
    direction: 'outbound', filename: 'proof.pdf', contentType: 'application/pdf',
    sizeBytes: 1024, origin: 'https://opsmanagement.angelcarehub.com',
  }

  const token = signStorageTransferTicket('storage_upload', claims, 60)
  const verified = verifyStorageTransferTicket(token, 'storage_upload')
  if (verified.fileId !== claims.fileId || verified.mailboxId !== claims.mailboxId) throw new Error('valid ticket claims mismatch')

  mustThrow(() => verifyStorageTransferTicket(`${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`, 'storage_upload'), 'tampered signature')
  mustThrow(() => verifyStorageTransferTicket(token, 'storage_download'), 'wrong purpose')
  mustThrow(() => verifyStorageTransferTicket('malformed', 'storage_upload'), 'malformed token')
  mustThrow(() => signStorageTransferTicket('storage_upload', { ...claims, direction: 'sideways' }, 60), 'invalid direction')

  const now = Math.floor(Date.now() / 1000)
  const expiredClaims = { ...verified, iat: now - 120, exp: now - 60, purpose: 'storage_upload' }
  const payload = b64url(JSON.stringify(expiredClaims))
  const expired = `${payload}.${signature(payload)}`
  mustThrow(() => verifyStorageTransferTicket(expired, 'storage_upload'), 'expired ticket')

  console.log('PASS  storage transfer ticket cryptographic tests')
} finally {
  if (previous === undefined) delete process.env.EMAIL_STORAGE_TRANSFER_SIGNING_SECRET
  else process.env.EMAIL_STORAGE_TRANSFER_SIGNING_SECRET = previous
}
