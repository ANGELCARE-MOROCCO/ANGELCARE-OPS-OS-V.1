import fs from 'node:fs'

const file = 'components/email-os-core/EmailOSWorkspacePro.tsx'
const text = fs.readFileSync(file, 'utf8')
const checks = [
  'EmailOSSyncControlPanel',
  'Manual Inbox Control',
  'Sync current',
  'Sync all',
  'forceFetch',
  '/api/email-os/sync',
  'Mailbox execution ledger'
]

console.log('EMAIL OS SYNC CONTROL PANEL VERIFY')
console.log('===================================')
for (const check of checks) {
  if (!text.includes(check)) {
    console.error(`✗ Missing: ${check}`)
    process.exit(1)
  }
  console.log(`✓ ${check}`)
}
console.log('Ready.')
