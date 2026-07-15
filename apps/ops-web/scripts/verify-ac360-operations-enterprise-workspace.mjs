import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredFiles = [
  'components/ac360/customer/operations/Ac360OperationsWorkspace.tsx',
  'app/(protected)/angelcare-360/customer/operations/page.tsx',
  'app/(protected)/angelcare-360/customer/operations/[section]/page.tsx',
  'app/(protected)/angelcare-360/customer/[module]/page.tsx',
  'lib/ac360/customer-direction-cockpit-model.ts',
]

const requiredMarkers = [
  ['components/ac360/customer/operations/Ac360OperationsWorkspace.tsx', 'Opérations & exécution quotidienne'],
  ['components/ac360/customer/operations/Ac360OperationsWorkspace.tsx', 'Cockpit de Direction'],
  ['components/ac360/customer/operations/Ac360OperationsWorkspace.tsx', 'Vue réseau'],
  ['components/ac360/customer/operations/Ac360OperationsWorkspace.tsx', 'Clôture journée'],
  ['components/ac360/customer/operations/Ac360OperationsWorkspace.tsx', '/api/ac360/customer/operations'],
  ['app/(protected)/angelcare-360/customer/[module]/page.tsx', 'legacyAlias'],
  ['lib/ac360/customer-direction-cockpit-model.ts', '/angelcare-360/customer/operations/aujourdhui'],
]

const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)))
const missingMarkers = requiredMarkers.filter(([file, marker]) => {
  const full = path.join(root, file)
  return !fs.existsSync(full) || !fs.readFileSync(full, 'utf8').includes(marker)
})

if (missingFiles.length || missingMarkers.length) {
  console.error('AC360 Operations Enterprise Workspace verification failed.')
  if (missingFiles.length) console.error('Missing files:', missingFiles.join(', '))
  if (missingMarkers.length) console.error('Missing markers:', missingMarkers.map(([file, marker]) => `${file} -> ${marker}`).join(' | '))
  process.exit(1)
}

console.log('✅ AC360 Operations Enterprise Workspace patch installed.')
console.log('Check: /angelcare-360/customer/operations/aujourdhui')
console.log('Legacy alias now patched: /angelcare-360/customer/presence-operations')
