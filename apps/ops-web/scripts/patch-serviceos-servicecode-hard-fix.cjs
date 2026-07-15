const fs = require('fs')
const path = require('path')

const root = process.cwd()
const typesPath = path.join(root, 'lib/service-os/types.ts')
const enginePath = path.join(root, 'lib/service-os/blueprint-engine.ts')

function fail(msg){ console.error(msg); process.exit(1) }
if (!fs.existsSync(typesPath)) fail('Missing lib/service-os/types.ts')
if (!fs.existsSync(enginePath)) fail('Missing lib/service-os/blueprint-engine.ts')

let types = fs.readFileSync(typesPath, 'utf8')

// Ensure ServiceBlueprint has serviceCode/code compatibility fields.
if (/export\s+(type|interface)\s+ServiceBlueprint/.test(types)) {
  if (!/serviceCode\??\s*:/.test(types)) {
    // Interface case: insert after opening brace
    if (/export\s+interface\s+ServiceBlueprint\s*{/.test(types)) {
      types = types.replace(/export\s+interface\s+ServiceBlueprint\s*{/, match => `${match}\n  serviceCode?: string\n  code?: string`)
    }
    // Type object case: insert after opening brace
    else if (/export\s+type\s+ServiceBlueprint\s*=\s*{/.test(types)) {
      types = types.replace(/export\s+type\s+ServiceBlueprint\s*=\s*{/, match => `${match}\n  serviceCode?: string\n  code?: string`)
    }
  }
} else {
  // Fallback: append a permissive declaration if somehow missing.
  types += `\n\nexport type ServiceBlueprint = {\n  id: string\n  name: string\n  code?: string\n  serviceCode?: string\n  [key: string]: any\n}\n`
}
fs.writeFileSync(typesPath, types)

let engine = fs.readFileSync(enginePath, 'utf8')

// Add safe blueprint code accessor and replace direct fragile lookup.
if (!/function\s+getBlueprintLookupCode/.test(engine)) {
  engine = engine.replace(/(import[^\n]+\n(?:import[^\n]+\n)*)/, `$1\nfunction getBlueprintLookupCode(blueprint: ServiceBlueprint): string {\n  const raw = blueprint as ServiceBlueprint & { serviceCode?: string; code?: string }\n  return String(raw.serviceCode ?? raw.code ?? raw.id ?? '').toLowerCase().replace('#', '')\n}\n`)
}

// Replace common direct serviceCode lookup pattern with helper.
engine = engine.replace(/\(b\.serviceCode \?\? b\.code \?\? b\.id \?\? ''\)\.toLowerCase\(\)\.replace\('#',''\)/g, 'getBlueprintLookupCode(b)')
engine = engine.replace(/\(b\.serviceCode \?\? b\.code \?\? b\.id \?\? ''\)\.toLowerCase\(\)\.replace\('#', ''\)/g, 'getBlueprintLookupCode(b)')
engine = engine.replace(/b\.serviceCode\.toLowerCase\(\)\.replace\('#',''\)/g, 'getBlueprintLookupCode(b)')
engine = engine.replace(/b\.serviceCode\.toLowerCase\(\)\.replace\('#', ''\)/g, 'getBlueprintLookupCode(b)')
engine = engine.replace(/b\.serviceCode/g, '(b as ServiceBlueprint & { serviceCode?: string }).serviceCode')

fs.writeFileSync(enginePath, engine)
console.log('ServiceOS serviceCode hard fix applied.')
