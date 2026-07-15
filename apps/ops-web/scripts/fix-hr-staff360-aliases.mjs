import fs from 'node:fs'

const file = 'lib/hr-production/repository.ts'

if (!fs.existsSync(file)) {
  console.error('Missing lib/hr-production/repository.ts')
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')

// Patch getStaff360 return block by adding aliases after documents when possible.
if (!s.includes('docs: (dashboard.documents || []).filter(byStaff)')) {
  s = s.replace(
`    documents: (dashboard.documents || []).filter(byStaff),
    contracts: (dashboard.contracts || []).filter(byStaff),`,
`    documents: (dashboard.documents || []).filter(byStaff),
    docs: (dashboard.documents || []).filter(byStaff),
    contracts: (dashboard.contracts || []).filter(byStaff),`
  )
}

// If the repository has a slightly different compact style, use a broad fallback.
if (!s.includes('docs:') && s.includes('documents: dashboard.documents.filter(byStaff)')) {
  s = s.replace(
`    documents: dashboard.documents.filter(byStaff),
    contracts: dashboard.contracts.filter(byStaff),`,
`    documents: dashboard.documents.filter(byStaff),
    docs: dashboard.documents.filter(byStaff),
    contracts: dashboard.contracts.filter(byStaff),`
  )
}

// Add useful aliases for old staff subpages too.
if (!s.includes('reviews: (dashboard.performance || []).filter(byStaff)')) {
  s = s.replace(
`    performance: (dashboard.performance || []).filter(byStaff),`,
`    performance: (dashboard.performance || []).filter(byStaff),
    reviews: (dashboard.performance || []).filter(byStaff),`
  )
}

if (!s.includes('trainings: (dashboard.training || []).filter(byStaff)')) {
  s = s.replace(
`    training: (dashboard.training || []).filter(byStaff),`,
`    training: (dashboard.training || []).filter(byStaff),
    trainings: (dashboard.training || []).filter(byStaff),`
  )
}

fs.writeFileSync(file, s)
console.log('Patched getStaff360 aliases: docs, reviews, trainings')
