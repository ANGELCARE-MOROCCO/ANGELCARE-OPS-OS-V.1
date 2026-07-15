const fs = require('fs')
const path = require('path')

const root = process.cwd()
const file = path.join(root, 'lib/service-os/blueprint-engine.ts')

if (!fs.existsSync(file)) {
  console.error('Missing lib/service-os/blueprint-engine.ts')
  process.exit(1)
}

let src = fs.readFileSync(file, 'utf8')

// Precise hardening for optional module keys used in getModuleDetails().
src = src.replace(/keys\.includes\(m\.key\)/g, "keys.includes(String(m.key ?? ''))")
src = src.replace(/keys\.includes\(([^)]*?)\.key\)/g, "keys.includes(String($1.key ?? ''))")

// Harden unsafe blueprint identifiers without assuming every seed uses the same code field.
src = src.replace(/b\.serviceCode\.toLowerCase\(\)\.replace\('#',''\)/g, "String((b as any).serviceCode ?? b.code ?? b.id ?? '').toLowerCase().replace('#','')")
src = src.replace(/b\.serviceCode\.toLowerCase\(\)/g, "String((b as any).serviceCode ?? b.code ?? b.id ?? '').toLowerCase()")
src = src.replace(/\(b\.serviceCode \?\? b\.code \?\? b\.id \?\? ''\)/g, "((b as any).serviceCode ?? b.code ?? b.id ?? '')")

// Add tiny local helpers only if not already present.
if (!src.includes('function serviceOSString')) {
  src = src.replace(/(import[^\n]+\n(?:import[^\n]+\n)*)/, `$1\nfunction serviceOSString(value: unknown): string {\n  return String(value ?? '')\n}\n`)
}

// Use helper in the exact failure path if the previous regex did not catch minified formatting.
src = src.replace(/keys\.includes\(String\(m\.key \?\? ''\)\)/g, "keys.includes(serviceOSString((m as any).key))")
src = src.replace(/keys\.includes\(m\.key as string\)/g, "keys.includes(serviceOSString((m as any).key))")

fs.writeFileSync(file, src)
console.log('Patched lib/service-os/blueprint-engine.ts for production-safe optional module keys and service code lookups.')
