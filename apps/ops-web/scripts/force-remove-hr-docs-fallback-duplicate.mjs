import fs from 'node:fs'

const file = 'lib/hr-production/repository.ts'

if (!fs.existsSync(file)) {
  console.error('Missing lib/hr-production/repository.ts')
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')

// Remove ONLY the duplicate fallback-table entry.
// Do NOT remove `docs: 'hr_documents'` from HR_TABLES.
s = s.replace(/^\s*\[HR_TABLES\.docs\]:\s*\[[^\n]*\],\s*$/gm, '')

fs.writeFileSync(file, s)
console.log('Removed duplicate [HR_TABLES.docs] fallback entry from repository.ts')
