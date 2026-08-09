import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const componentPath = path.join(root, 'components/email-os-core/EmailOSMailboxGateDispatcher.tsx')
const routePath = path.join(root, 'app/api/email-os/access/my-mailboxes/route.ts')

for (const file of [componentPath, routePath]) {
  if (!fs.existsSync(file)) throw new Error(`Required file missing: ${file}`)
}

const component = fs.readFileSync(componentPath, 'utf8')
const route = fs.readFileSync(routePath, 'utf8')

const required = [
  'ANGELCARE EMAIL OS',
  'Developped and property of ANGELCARE',
  'Copyright protected',
  'Vos identités Email OS.',
  'Un accès unique, sécurisé.',
  'xl:grid-cols-[minmax(0,1fr)_470px]',
  'AuthenticatedOperatorPassport',
  'SecurityProtocolRibbon',
  'Session opérateur scellée',
  '/api/email-os/access/my-mailboxes',
  '/api/email-os/access/unlock',
]

for (const contract of required) {
  if (!component.includes(contract)) throw new Error(`Compact hero contract missing: ${contract}`)
}

const forbidden = [
  'SecureIdentityNetwork',
  'Réseau de communication gouverné',
  'SECURE ACCESS CORE',
  'IDENTITY NETWORK',
  'xl:grid-cols-[minmax(0,1.08fr)_minmax(330px,.72fr)_390px]',
]

for (const contract of forbidden) {
  if (component.includes(contract)) throw new Error(`Removed dark-network contract is still present: ${contract}`)
}

for (const contract of ['operator:', 'department:', 'title:', 'normalizeEmailOSOperatorIdentity']) {
  if (!route.includes(contract)) throw new Error(`Operator identity API contract missing: ${contract}`)
}

console.log('Email OS compact modern hero verified.')
