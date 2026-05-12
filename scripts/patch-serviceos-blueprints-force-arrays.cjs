const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app/(protected)/services/blueprints/page.tsx')
if (!fs.existsSync(file)) {
  console.error('Missing file:', file)
  process.exit(1)
}

let s = fs.readFileSync(file, 'utf8')
const before = s

// Exact recurring unsafe pattern from build logs
s = s.replace(/b\.defaultWorkflow\.slice\(0,\s*4\)\.join\(' → '\)/g, "(b.defaultWorkflow ?? []).slice(0, 4).join(' → ')")
s = s.replace(/b\.defaultWorkflow\.join\(' → '\)/g, "(b.defaultWorkflow ?? []).join(' → ')")
s = s.replace(/b\.cities\.join\(', '\)/g, "(b.cities ?? []).join(', ')")
s = s.replace(/b\.modules\.join\(', '\)/g, "(b.modules ?? []).join(', ')")
s = s.replace(/b\.requiredDocuments\.join\(', '\)/g, "(b.requiredDocuments ?? []).join(', ')")
s = s.replace(/b\.requiredCertifications\.join\(', '\)/g, "(b.requiredCertifications ?? []).join(', ')")
s = s.replace(/b\.addons\.join\(', '\)/g, "(b.addons ?? []).join(', ')")
s = s.replace(/b\.automationRules\.join\(', '\)/g, "(b.automationRules ?? []).join(', ')")
s = s.replace(/b\.riskFlags\.join\(', '\)/g, "(b.riskFlags ?? []).join(', ')")

// Length access hardening for optional arrays
s = s.replace(/b\.modules\.length/g, '(b.modules ?? []).length')
s = s.replace(/b\.cities\.length/g, '(b.cities ?? []).length')
s = s.replace(/b\.defaultWorkflow\.length/g, '(b.defaultWorkflow ?? []).length')
s = s.replace(/b\.requiredDocuments\.length/g, '(b.requiredDocuments ?? []).length')
s = s.replace(/b\.requiredCertifications\.length/g, '(b.requiredCertifications ?? []).length')
s = s.replace(/b\.addons\.length/g, '(b.addons ?? []).length')
s = s.replace(/b\.automationRules\.length/g, '(b.automationRules ?? []).length')
s = s.replace(/b\.riskFlags\.length/g, '(b.riskFlags ?? []).length')

if (s === before) {
  console.warn('No changes were applied. The file may already be patched or uses unexpected formatting.')
} else {
  fs.writeFileSync(file, s)
  console.log('Patched:', file)
}

const updated = fs.readFileSync(file, 'utf8')
if (updated.includes('b.defaultWorkflow.slice')) {
  console.error('Unsafe defaultWorkflow access still exists.')
  process.exit(1)
}
console.log('ServiceOS blueprints force array patch complete.')
