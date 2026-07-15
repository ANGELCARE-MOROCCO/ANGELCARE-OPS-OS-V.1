const fs = require('fs')
const path = require('path')

const root = process.cwd()
const servicesDir = path.join(root, 'app', '(protected)', 'services')
const typeFile = path.join(root, 'lib', 'service-os', 'types.ts')

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return entry.isFile() && /\.(tsx|ts)$/.test(entry.name) ? [full] : []
  })
}

const arrayFields = [
  'requiredDocuments',
  'requiredCertifications',
  'defaultWorkflow',
  'cities',
  'modules',
  'addons',
  'automationRules',
  'riskFlags',
  'complianceFlags',
  'serviceModes',
  'pricingRules',
  'staffRequirements',
  'operationalRules',
]

const files = walk(servicesDir)
let changedFiles = 0

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8')
  const original = src

  for (const field of arrayFields) {
    // Convert simple unsafe array method usage: x.field.join/map/slice/length
    src = src.replace(new RegExp(`([A-Za-z0-9_$.]+)\\.${field}\\.join\\(`, 'g'), `(Array.isArray($1.${field}) ? $1.${field} : []).join(`)
    src = src.replace(new RegExp(`([A-Za-z0-9_$.]+)\\.${field}\\.map\\(`, 'g'), `(Array.isArray($1.${field}) ? $1.${field} : []).map(`)
    src = src.replace(new RegExp(`([A-Za-z0-9_$.]+)\\.${field}\\.slice\\(`, 'g'), `(Array.isArray($1.${field}) ? $1.${field} : []).slice(`)
    src = src.replace(new RegExp(`([A-Za-z0-9_$.]+)\\.${field}\\.length`, 'g'), `(Array.isArray($1.${field}) ? $1.${field}.length : 0)`)
  }

  // TypeScript parameter hardening for common map callbacks left implicit.
  src = src.replace(/\.map\(b=>/g, '.map((b: any)=>')
  src = src.replace(/\.map\(x=>/g, '.map((x: any)=>')
  src = src.replace(/\.map\(m=>/g, '.map((m: any)=>')
  src = src.replace(/\.map\(r=>/g, '.map((r: any)=>')
  src = src.replace(/\.map\(c=>/g, '.map((c: any)=>')
  src = src.replace(/\.map\(s=>/g, '.map((s: any)=>')

  if (src !== original) {
    fs.writeFileSync(file, src)
    changedFiles++
    console.log('patched', path.relative(root, file))
  }
}

// Strengthen the central blueprint type if present so seed data + pages share a stable contract.
if (fs.existsSync(typeFile)) {
  let types = fs.readFileSync(typeFile, 'utf8')
  const original = types
  for (const field of arrayFields) {
    types = types.replace(new RegExp(`${field}\\?:\\s*string\\[\\]`, 'g'), `${field}: string[]`)
    types = types.replace(new RegExp(`${field}\\?:\\s*Array<string>`, 'g'), `${field}: string[]`)
  }
  if (types !== original) {
    fs.writeFileSync(typeFile, types)
    console.log('patched', path.relative(root, typeFile))
  }
}

console.log(`ServiceOS global optional-array stabilization complete. Files changed: ${changedFiles}`)
