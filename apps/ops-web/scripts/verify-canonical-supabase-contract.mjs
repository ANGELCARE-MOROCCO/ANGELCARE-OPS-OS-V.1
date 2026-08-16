import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const contractPath = path.join(root, 'scripts', 'canonical-paid-public-contract.json')
const compatPath = path.join(root, 'scripts', 'angelcare-canonical-compatibility.json')
const driftPath = path.join(root, 'scripts', 'canonical-known-drift-20260815.json')

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const compat = JSON.parse(fs.readFileSync(compatPath, 'utf8'))
const knownDrift = JSON.parse(fs.readFileSync(driftPath, 'utf8'))
const canonicalRelations = new Set([...Object.keys(contract.tables || {}), ...(contract.views || [])])
const canonicalFunctions = new Set(contract.functions || [])
const aliases = compat.relation_aliases || {}
const rpcShims = new Set(compat.missing_rpc_shims || [])
const columnAliases = compat.column_aliases || {}
const tableSinks = compat.table_sinks || {}

const runtimeRoots = ['app', 'lib', 'components', 'hooks', 'server']
const sourceFiles = []
const ignoredParts = new Set(['node_modules', '.next', '.git', '.turbo', 'dist', 'build', 'coverage', '.cache'])

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredParts.has(entry.name) || entry.name.startsWith('.service-design-backups') || entry.name.includes('backup')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) sourceFiles.push(full)
  }
}
for (const rel of runtimeRoots) walk(path.join(root, rel))

const relationUses = new Map()
const rpcUses = new Map()
const rawClientImports = []
const directSsrClients = []

function add(map, key, file, line) {
  if (!map.has(key)) map.set(key, [])
  map.get(key).push(`${path.relative(root, file)}:${line}`)
}

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8')
  const lines = source.split(/\r?\n/)
  lines.forEach((line, i) => {
    for (const match of line.matchAll(/\.from\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const prefix = line.slice(Math.max(0, match.index - 24), match.index)
      if (/storage\s*$/.test(prefix)) continue
      add(relationUses, match[1], file, i + 1)
    }
    for (const match of line.matchAll(/\.rpc\(\s*['"]([^'"]+)['"]/g)) add(rpcUses, match[1], file, i + 1)
    const relFile = path.relative(root, file).replaceAll('\\', '/')
    const allowedRaw = relFile === 'lib/supabase/server.ts' || relFile === 'lib/supabase/contract-client.ts'
    if (/^\s*import\b.*\bcreateClient\b.*@supabase\/supabase-js/.test(line) && !allowedRaw) rawClientImports.push(`${relFile}:${i + 1}`)
    if (/@supabase\/ssr/.test(line) && /\bcreate(?:Browser|Server)Client\b/.test(line) && !source.includes('wrapSupabaseClient')) directSsrClients.push(`${relFile}:${i + 1}`)
  })
}


const unresolvedKnownPairs = []
for (const item of [...(knownDrift.invalid_write_pairs || []), ...(knownDrift.invalid_read_pairs || [])]) {
  const alias = aliases[item.table]
  const physical = alias?.table || item.table
  const columns = new Set(contract.tables?.[physical] || [])
  if (columns.has(item.column)) continue
  const map = columnAliases[item.table] || columnAliases[physical] || {}
  const hasExplicitRule = Object.prototype.hasOwnProperty.call(map, item.column)
  const sink = alias?.sink || tableSinks[item.table] || tableSinks[physical]
  if (!hasExplicitRule && !sink) unresolvedKnownPairs.push(`${item.table}.${item.column}`)
}
const uncoveredKnownRelations = (knownDrift.missing_relations || []).filter((name) => !canonicalRelations.has(name) && !aliases[name])
const uncoveredKnownRpcs = (knownDrift.missing_rpcs || []).filter((name) => !canonicalFunctions.has(name) && !rpcShims.has(name))

const missingRelations = [...relationUses.entries()].filter(([name]) => !canonicalRelations.has(name) && !aliases[name])
const missingRpcs = [...rpcUses.entries()].filter(([name]) => !canonicalFunctions.has(name) && !rpcShims.has(name))

console.log('============================================================')
console.log(' ANGELCARE CANONICAL SUPABASE CONTRACT GATE')
console.log(' SOURCE=PAID_SUPABASE_LIVE_FINAL_TRUTH')
console.log('============================================================')
console.log(`SOURCE_FILES=${sourceFiles.length}`)
console.log(`RELATIONS_REFERENCED=${relationUses.size}`)
console.log(`RPCS_REFERENCED=${rpcUses.size}`)
console.log(`UNRESOLVED_RELATIONS=${missingRelations.length}`)
console.log(`UNRESOLVED_RPCS=${missingRpcs.length}`)
console.log(`RAW_SUPABASE_CREATECLIENT_IMPORTS=${rawClientImports.length}`)
console.log(`DIRECT_SSR_CLIENTS=${directSsrClients.length}`)
console.log(`KNOWN_DRIFT_PAIRS_UNCOVERED=${unresolvedKnownPairs.length}`)
console.log(`KNOWN_MISSING_RELATIONS_UNCOVERED=${uncoveredKnownRelations.length}`)
console.log(`KNOWN_MISSING_RPCS_UNCOVERED=${uncoveredKnownRpcs.length}`)

if (missingRelations.length) {
  console.log('\nUNRESOLVED RELATIONS:')
  for (const [name, locations] of missingRelations) console.log(`- ${name}: ${locations.slice(0, 5).join('; ')}`)
}
if (missingRpcs.length) {
  console.log('\nUNRESOLVED RPCS:')
  for (const [name, locations] of missingRpcs) console.log(`- ${name}: ${locations.slice(0, 5).join('; ')}`)
}
if (rawClientImports.length) {
  console.log('\nRAW CLIENT IMPORTS:')
  rawClientImports.slice(0, 40).forEach((x) => console.log(`- ${x}`))
}
if (directSsrClients.length) {
  console.log('\nDIRECT SSR CLIENTS:')
  directSsrClients.slice(0, 40).forEach((x) => console.log(`- ${x}`))
}

const failed = missingRelations.length || missingRpcs.length || rawClientImports.length || directSsrClients.length || unresolvedKnownPairs.length || uncoveredKnownRelations.length || uncoveredKnownRpcs.length
if (failed) {
  console.log('\nCANONICAL_CONTRACT_GATE=FAIL')
  process.exit(1)
}
console.log('\nCANONICAL_CONTRACT_GATE=PASS')
