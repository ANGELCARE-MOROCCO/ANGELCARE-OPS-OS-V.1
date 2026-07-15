import fs from 'node:fs'

const targets = [
  'components/traininghub/internal/ExistingPartnerSyncedModal.tsx',
  'components/traininghub/internal/ExistingPartnerSyncedModal copy.tsx',
].filter((file) => fs.existsSync(file))

const rows = []

for (const file of targets) {
  const text = fs.readFileSync(file, 'utf8')
  const hasDeletePartner = text.includes('deletePartner')
  const hasHardDeleteEndpoint = text.includes('/api/traininghub/internal/partners/') && text.includes('/hard-delete')
  const stillBareDelete = /`\/api\/traininghub\/internal\/partners\/\$\{[^`]+\}`/.test(text)
  const stillSafeDelete = text.includes('/safe-delete')
  const hasClearError = text.includes('Endpoint hard-delete') || text.includes('serveur a refusé') || text.includes('Backend hard-delete')

  rows.push({
    file,
    hasDeletePartner,
    hasHardDeleteEndpoint,
    stillBareDelete,
    stillSafeDelete,
    hasClearError,
    pass: hasDeletePartner && hasHardDeleteEndpoint && !stillBareDelete && !stillSafeDelete && hasClearError,
  })
}

console.table(rows)

if (!rows.length || rows.some((row) => !row.pass)) {
  console.error('Existing partner modal delete wire fix verification FAILED.')
  process.exit(1)
}

console.log('Existing partner modal delete wire fix verification PASSED.')
