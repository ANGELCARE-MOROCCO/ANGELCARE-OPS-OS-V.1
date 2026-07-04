import fs from 'node:fs'
import path from 'node:path'

function read(file) {
  try { return fs.readFileSync(file, 'utf8') } catch { return '' }
}

function exists(file) {
  return fs.existsSync(file)
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

const commandCenterFiles = walk('components/traininghub/internal').filter((file) => file.endsWith('.tsx'))
const allTrainingHubFiles = [
  ...walk('components/traininghub').filter((file) => /\.(tsx|ts)$/.test(file)),
  ...walk('app/traininghub').filter((file) => /\.(tsx|ts)$/.test(file)),
  ...walk('app/api/traininghub').filter((file) => /\.(tsx|ts)$/.test(file)),
]

const modal = 'components/traininghub/internal/ExistingPartnerSyncedModal.tsx'
const partnerApi = 'app/api/traininghub/internal/partner-dossier/[id]/route.ts'
const commandCenter = 'components/traininghub/internal/TrainingHubCommandCenterDynamicPremium.tsx'

const modalText = read(modal)
const apiText = read(partnerApi)
const commandCenterText = read(commandCenter)
const allText = allTrainingHubFiles.map(read).join('\n')

const plaintextBadPatterns = [
  'plain_password',
  'passwordPlaintext',
  'plaintextPassword',
  'clearTextPassword',
  'password_clear',
  'storedPassword',
]

const dangerousConsolePatterns = [
  'console.log("password',
  "console.log('password",
  'console.log(tempPassword',
  'console.log(password',
]

const checks = [
  ['command center exists', exists(commandCenter)],
  ['existing partner synced modal exists', exists(modal)],
  ['partner dossier API exists', exists(partnerApi)],
  ['modal has preview mode', modalText.includes('MODE PREVIEW SYNCHRONISÉ') || modalText.includes('MODE PREVIEW SYNCHRONISE')],
  ['modal has edit mode', modalText.includes('setEditMode(true)') && modalText.includes('Enregistrer modifications')],
  ['modal has access/password step', modalText.includes('Accès, login & mot de passe') || modalText.includes('Accès, login')],
  ['modal has temporary password generator', modalText.includes('generatePassword')],
  ['modal has password copy action', modalText.includes('copyPassword') && modalText.includes('Copier')],
  ['modal has suspend access action', modalText.includes('Suspendre accès')],
  ['modal has permanent delete action', modalText.includes('Supprimer définitivement')],
  ['API has GET/PATCH/DELETE', apiText.includes('export async function GET') && apiText.includes('export async function PATCH') && apiText.includes('export async function DELETE')],
  ['API has set_password action', apiText.includes("action === 'set_password'")],
  ['API uses Supabase auth admin for password set', apiText.includes('auth.admin.createUser') && apiText.includes('auth.admin.updateUserById')],
  ['API protects permanent delete with DELETE_PARTNER', apiText.includes('DELETE_PARTNER')],
  ['no obvious plaintext password persistence keys', !plaintextBadPatterns.some((pattern) => allText.includes(pattern))],
  ['no obvious password console logging', !dangerousConsolePatterns.some((pattern) => allText.includes(pattern))],
  ['partner cards/directory exist', commandCenterText.includes('PartnerDirectory') || commandCenterText.includes('DirectoryPartnerCard')],
  ['portfolio cards open dossier modal', commandCenterText.includes('onOpenPartner') || commandCenterText.includes('setSelectedPartner')],
]

const rows = checks.map(([name, pass]) => ({ name, pass: Boolean(pass) }))
console.table(rows)

const failed = rows.filter((row) => !row.pass)

if (failed.length) {
  console.error('\nTrainingHub production hardening static verification FAILED.')
  console.error('Failed checks:', failed.map((row) => row.name).join(', '))
  process.exit(1)
}

console.log('\nTrainingHub production hardening static verification PASSED.')
