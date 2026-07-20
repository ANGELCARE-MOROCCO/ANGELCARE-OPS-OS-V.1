import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const files = {
  gate: path.join(root, 'components/email-os-core/EmailOSMailboxGateDispatcher.tsx'),
  route: path.join(root, 'app/api/email-os/access/my-mailboxes/route.ts'),
}

for (const [label, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) throw new Error(`${label} file missing: ${file}`)
}

const gate = fs.readFileSync(files.gate, 'utf8')
const route = fs.readFileSync(files.route, 'utf8')

const gateContracts = [
  '/logo.png',
  'ANGELCARE EMAIL OS',
  'Developped and property of ANGELCARE',
  'Copyright protected',
  'Secure Communications Operating System',
  'Vos identités de communication.',
  'Un seul accès sécurisé.',
  'Accéder à mes identités',
  'SecureIdentityNetwork',
  'AuthenticatedOperatorPassport',
  'SecurityProtocolRibbon',
  'Identity network · Live signals',
  'Signaux détectés',
  'Secure access core',
  'Credential status · Live telemetry',
  'Signal cryptographique continu',
  'operatorDisplayName',
  'operatorTitle',
  'operatorDepartment',
  'Security clearance',
  'Security protocol',
  'email-os-identities',
  'Verrouiller les sessions',
  '/api/email-os/access/my-mailboxes',
  '/api/email-os/access/unlock',
  '/api/email-os/access/logout-mailbox',
  '/api/email-os/access/audit/my',
  'PIN sécurisé à 6 chiffres',
  'MailboxTable',
  'SecurityIntelligenceRail',
  'AccessDetailsDrawer',
  'AuditDrawer',
  'HelpDrawer',
  '!text-white',
  '!text-slate-950',
]

for (const contract of gateContracts) {
  if (!gate.includes(contract)) throw new Error(`Gate contract missing: ${contract}`)
}

const routeContracts = [
  'active_sessions_count',
  'locked_assignments_count',
  'security_status',
  'activeSessionsCount',
  'lockedAssignmentsCount',
  'securityStatus',
  'operator:',
  'normalizeEmailOSOperatorIdentity',
  'readableEmailName',
  'operatorName',
  'department:',
  'title:',
]

for (const contract of routeContracts) {
  if (!route.includes(contract)) throw new Error(`Route contract missing: ${contract}`)
}

if (/[>"']undefined[<"']/.test(gate)) throw new Error('Rendered undefined copy must not appear in premium mailbox gate UI')
if (gate.includes('Email-OS Secure Mailbox Gate')) throw new Error('Legacy gateway title is still present')
if (gate.includes('max-w-[1920px]')) throw new Error('Legacy constrained-width wrapper is still present')
if (!gate.includes('bg-[radial-gradient(circle_at_50%_42%')) throw new Error('Secure identity network visual surface is missing')
if (gate.includes('operatorEmail={')) throw new Error('Operator passport must not identify the user primarily by email')

console.log('Email OS live-signal secure mailbox gateway verified.')
