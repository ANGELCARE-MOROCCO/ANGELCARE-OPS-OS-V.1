import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const publicRoot = path.join(root, 'angelcare-marketplace', 'sanila-public')
const routeFile = path.join(root, 'app', 'angelcare-marketplace', '[locale]', '[[...slug]]', 'page.tsx')
const cssFile = path.join(publicRoot, 'SanilaPublic.module.css')

function fail(message) { console.error(`FAIL ${message}`); process.exitCode = 1 }
function pass(message) { console.log(`PASS ${message}`) }
function text(file) { return fs.readFileSync(file, 'utf8') }
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]) }

const sourceFiles = walk(publicRoot).filter((file) => /\.(ts|tsx|css)$/.test(file))
const source = sourceFiles.map(text).join('\n')
const blueprint = text(path.join(publicRoot, 'pageBlueprints.ts'))
const content = text(path.join(publicRoot, 'content.ts'))
const routeSource = text(routeFile)
const css = text(cssFile)

const slugs = [...blueprint.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1])
if (slugs.length === 29 && new Set(slugs).size === 29) pass('29 unique SANILA page blueprints')
else fail(`expected 29 unique blueprints, got ${slugs.length}/${new Set(slugs).size}`)

const pageFiles = walk(path.join(publicRoot, 'pages')).filter((file) => file.endsWith('.tsx'))
if (pageFiles.length === 29) pass('29 physical page-composition modules')
else fail(`expected 29 physical page modules, got ${pageFiles.length}`)

if (content.includes("normalized === 'sanila'") && content.includes("normalized.startsWith('sanila/')")) pass('explicit /sanila namespace matcher')
else fail('explicit /sanila namespace matcher missing')

if (routeSource.includes('isSanilaPublicRoute(slug)') && routeSource.includes('resolveSanilaPublicSlug(slug)')) pass('Marketplace catch-all delegates SANILA only through explicit resolver')
else fail('Marketplace catch-all SANILA resolver contract missing')

for (const generic of ['accueil','produit','finance','tarifs','solutions','ressources']) {
  const literal = `normalized === '${generic}'`
  if (!content.includes(literal)) pass(`generic Marketplace slug not registered as SANILA matcher: ${generic}`)
  else fail(`generic Marketplace slug can be claimed by SANILA: ${generic}`)
}

const accessAuthorities = [
  '/angelcare-360-access/login', '/angelcare-360-portal/login', '/angelcare-360-teacher/login',
  '/angelcare-360-staff/login', '/angelcare-360-parent/login', '/angelcare-360-student/login',
]
for (const href of accessAuthorities) source.includes(href) ? pass(`customer authority preserved ${href}`) : fail(`missing customer authority ${href}`)

if (!source.toLowerCase().includes('angelcare-360-operator')) pass('public internal-backoffice route exposure = 0')
else fail('internal backoffice route leaked into SANILA public source')

if (!source.includes('ProductPreview') && !source.includes('Données de démonstration')) pass('rejected fake-dashboard system absent')
else fail('fake product preview remnants found')

if (source.includes('/api/angelcare-marketplace/public/inquiries')) pass('existing public inquiry backend reused')
else fail('public inquiry backend not referenced')

for (const route of ['/angelcare-marketplace/fr/sanila/demonstration','/angelcare-marketplace/fr/sanila/contact','/angelcare-marketplace/fr/sanila/creer-mon-etablissement']) {
  source.includes(route) ? pass(`acquisition source route namespaced ${route}`) : fail(`missing acquisition source route ${route}`)
}

const logo = path.join(root, 'public', 'sanila', 'sanila-operating-system-logo.png')
if (fs.existsSync(logo)) {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(logo)).digest('hex')
  console.log(`INFO official logo SHA256 ${hash}`)
  pass('official SANILA logo asset exists')
} else fail('official SANILA logo asset missing')

const classes = new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]))
const styleRefs = new Set()
for (const file of sourceFiles.filter((file) => file.endsWith('.tsx'))) {
  for (const match of text(file).matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)) styleRefs.add(match[1])
}
const missingClasses = [...styleRefs].filter((name) => !classes.has(name)).sort()
if (!missingClasses.length) pass(`CSS module reference authority (${styleRefs.size} refs / ${classes.size} classes)`)
else fail(`missing CSS classes: ${missingClasses.join(', ')}`)

// Check user-visible copy while excluding evidence sourcePath strings, which are internal proof metadata.
const publicCopy = source.replace(/sourcePath:\s*'[^']*'/g, "sourcePath: '[internal-evidence-path]'")
const dangerousTerms = ['tenant', 'provisioning', 'runtime', 'crud', 'backoffice', 'postgrest', 'server component', 'command plane']
for (const term of dangerousTerms) {
  new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(publicCopy) ? fail(`public engineering jargon detected: ${term}`) : pass(`public jargon absent: ${term}`)
}

const evidencePaths = [...blueprint.matchAll(/sourcePath:\s*'([^']+)'/g)].map((match) => match[1])
const missingEvidence = [...new Set(evidencePaths)].filter((rel) => !fs.existsSync(path.join(root, rel)))
if (!missingEvidence.length) pass(`source-derived evidence authorities exist (${new Set(evidencePaths).size} unique)`)
else fail(`missing source-derived evidence authorities: ${missingEvidence.join(', ')}`)

if (!source.includes('href="/angelcare-marketplace/fr/demonstration"') && !source.includes('href="/angelcare-marketplace/fr/connexion"')) pass('legacy generic SANILA CTA authorities removed')
else fail('legacy generic SANILA CTA authority found')

console.log(`INFO files checked ${sourceFiles.length}`)
if (!process.exitCode) console.log('SANILA_PUBLIC_V2_STATIC_QA=PASS')
