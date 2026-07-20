import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const secretDir = path.join(root, '.secrets')
fs.mkdirSync(secretDir, { recursive: true })
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'der' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } })
fs.writeFileSync(path.join(secretDir, 'angelcare-revenue-command-private.pem'), privateKey, { mode: 0o600 })
const base64 = publicKey.toString('base64')
fs.writeFileSync(path.join(root, '.env.local'), `ANGELCARE_EXTENSION_PUBLIC_KEY=${base64}\n`)
console.log('Generated stable extension identity. Keep .secrets/ private and backed up securely.')
