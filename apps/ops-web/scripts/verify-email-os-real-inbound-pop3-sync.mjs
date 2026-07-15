import fs from 'node:fs'

const checks = [
  ['lib/email-os-core/inbound-sync.ts', 'class Pop3Client'],
  ['lib/email-os-core/inbound-sync.ts', 'simpleParser'],
  ['lib/email-os-core/inbound-sync.ts', 'email_os_core_inbox'],
  ['app/api/email-os/sync/route.ts', 'syncEmailOSMailbox'],
  ['app/api/email-os/sync/route.ts', 'fetched'],
  ['database/email-os-core-real-inbound-pop3-sync.sql', 'email_os_core_inbox_mailbox_provider_uid_unique'],
]

let failed = false
for (const [file, marker] of checks) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const ok = text.includes(marker)
  console.log(`${ok ? '✓' : '✗'} ${file} contains ${marker}`)
  if (!ok) failed = true
}

if (failed) process.exit(1)
console.log('Email-OS real inbound POP3 sync patch is present.')
