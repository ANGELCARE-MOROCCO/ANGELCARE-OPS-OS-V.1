#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const app = path.resolve(process.argv[2] || process.cwd())
const roots = [
  'angelcare-marketplace/customer-commerce',
  'app/api/angelcare-marketplace/customer',
  'app/api/angelcare-marketplace/wallet',
  'app/api/angelcare-marketplace/checkout',
  'app/api/angelcare-marketplace/payments',
  'app/api/angelcare-marketplace/admin/wallet',
  'app/api/angelcare-marketplace/admin/orders',
  'app/api/angelcare-marketplace/admin/payments',
  'app/angelcare-marketplace/[locale]/auth',
  'app/angelcare-marketplace/[locale]/account',
  'app/angelcare-marketplace/(protected)/admin/wallet',
  'app/angelcare-marketplace/(protected)/admin/orders',
  'app/angelcare-marketplace/(protected)/admin/payments',
]
const explicit = [
  'angelcare-marketplace/category-native-experience/components/AdaptiveExperience.tsx',
  'angelcare-marketplace/conversion-universe/components/CheckoutExperience.tsx',
  'angelcare-marketplace/shells/AdminNavigation.tsx',
]
const files = []
function walk(current) {
  if (!fs.existsSync(current)) return
  const stat = fs.statSync(current)
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(current)) walk(path.join(current, name))
  } else if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(current)) {
    files.push(current)
  }
}
for (const root of roots) walk(path.join(app, root))
for (const rel of explicit) files.push(path.join(app, rel))

const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.module.css', '.d.ts']
function resolveLocal(specifier, containingFile) {
  let base
  if (specifier.startsWith('@/')) base = path.join(app, specifier.slice(2))
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(containingFile), specifier)
  else return true
  for (const extension of extensions) {
    const candidate = `${base}${extension}`
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return true
  }
  for (const extension of extensions) {
    const candidate = path.join(base, `index${extension}`)
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return true
  }
  return false
}

const importPattern = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
let failures = 0
let imports = 0
for (const file of [...new Set(files)]) {
  if (!fs.existsSync(file)) {
    console.error(`MISSING SOURCE: ${path.relative(app, file)}`)
    failures += 1
    continue
  }
  const source = fs.readFileSync(file, 'utf8')
  let match
  while ((match = importPattern.exec(source)) !== null) {
    const specifier = match[1] || match[2] || match[3]
    if (!specifier) continue
    imports += 1
    if (!resolveLocal(specifier, file)) {
      failures += 1
      console.error(`UNRESOLVED: ${path.relative(app, file)} -> ${specifier}`)
    }
  }
}

console.log(`Customer/Payment/Wallet source files checked: ${new Set(files).size}`)
console.log(`Imports inspected: ${imports}`)
console.log(`Unresolved local imports: ${failures}`)
if (failures) process.exit(1)
console.log('RESULT: CUSTOMER PAYMENT WALLET LOCAL IMPORT INTEGRITY PASSED')
