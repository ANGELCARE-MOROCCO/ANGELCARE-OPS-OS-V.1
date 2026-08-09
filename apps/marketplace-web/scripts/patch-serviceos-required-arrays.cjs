const fs = require('fs')
const path = require('path')

const typesPath = path.join(process.cwd(), 'lib/service-os/types.ts')
if (!fs.existsSync(typesPath)) {
  throw new Error('Missing lib/service-os/types.ts')
}

let src = fs.readFileSync(typesPath, 'utf8')

// Make high-use array fields required on ServiceBlueprint if they were optional.
const requiredArrayFields = ['modules', 'cities', 'certifications', 'documents', 'workflows', 'rules', 'addons', 'tags']
for (const field of requiredArrayFields) {
  src = src.replace(new RegExp(`(\\b${field})\\?:\\s*([^;\n]+\\[\\])`, 'g'), `$1: $2`)
  src = src.replace(new RegExp(`(\\b${field})\\?:\\s*Array<([^>]+)>`, 'g'), `$1: Array<$2>`)
}

// Make common string/number fields optional-safe but not force if absent.
// Add a helper type if it does not exist, useful for future extension.
if (!src.includes('export type ServiceOSRiskLevel')) {
  src += `\n\nexport type ServiceOSRiskLevel = 'low' | 'medium' | 'high' | 'critical'\n`
}

fs.writeFileSync(typesPath, src)
console.log('✅ Patched lib/service-os/types.ts required blueprint arrays')

// Also patch blueprints page to be safe in case imported runtime data is partial.
const pagePath = path.join(process.cwd(), 'app/(protected)/services/blueprints/page.tsx')
if (fs.existsSync(pagePath)) {
  let page = fs.readFileSync(pagePath, 'utf8')
  page = page.replace(/b\.cities\.join\(', '\)/g, "(b.cities ?? []).join(', ')")
  page = page.replace(/b\.modules\.length/g, '(b.modules ?? []).length')
  fs.writeFileSync(pagePath, page)
  console.log('✅ Patched services/blueprints page optional arrays fallback')
}
