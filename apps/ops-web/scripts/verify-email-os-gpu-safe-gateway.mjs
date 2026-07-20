import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const file = path.join(root, 'components/email-os-core/EmailOSMailboxGateDispatcher.tsx')
if (!fs.existsSync(file)) throw new Error(`Missing file: ${file}`)
const source = fs.readFileSync(file, 'utf8')

const required = [
  'ANGELCARE EMAIL OS',
  'Developped and property of ANGELCARE',
  'Copyright protected',
  'SecureIdentityNetwork',
  'AuthenticatedOperatorPassport',
  'prefers-reduced-motion',
]
for (const token of required) {
  if (!source.includes(token)) throw new Error(`Missing GPU-safe contract: ${token}`)
}

const forbidden = [
  'emailOsNetworkSweep',
  'emailOsNetworkDash',
  'emailOsSignalFloat',
  'emailOsCorePulse',
  'emailOsCredentialSweep',
  'emailOsCredentialWave',
  '<feGaussianBlur',
  'motion-safe:animate-spin',
  'motion-safe:animate-ping',
  'motion-safe:animate-spin',
  'emailOsSafePulse',
  'emailOsCredentialSafePulse',
]
for (const token of forbidden) {
  if (source.includes(token)) throw new Error(`Expensive animation still present: ${token}`)
}

console.log('Email OS GPU-safe gateway verified.')
