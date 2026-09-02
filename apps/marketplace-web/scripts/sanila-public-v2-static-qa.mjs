import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const publicRoot = path.join(root, 'angelcare-marketplace', 'sanila-public')
const routeFile = path.join(root, 'app', 'angelcare-marketplace', '[locale]', '[[...slug]]', 'page.tsx')
const marketplaceRootFile = path.join(root, 'app', 'angelcare-marketplace', 'page.tsx')
const nextConfigFile = path.join(root, 'next.config.ts')
const cssFile = path.join(publicRoot, 'SanilaPublic.module.css')
const pagesDir = path.join(publicRoot, 'pages')

function fail(message) { console.error(`FAIL ${message}`); process.exitCode = 1 }
function pass(message) { console.log(`PASS ${message}`) }
function text(file) { return fs.readFileSync(file, 'utf8') }
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]) }
function fingerprint(source) {
  const normalized = source
    .replace(/'[^']*'|"[^"]*"|`[^`]*`/gs, 'STR')
    .replace(/getSanilaPublicPage\([^)]*\)/g, 'PAGE')
    .replace(/\s+/g, ' ')
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16)
}

const sourceFiles = walk(publicRoot).filter((file) => /\.(ts|tsx|css)$/.test(file))
const tsxFiles = sourceFiles.filter((file) => file.endsWith('.tsx'))
const source = sourceFiles.map(text).join('\n')
const blueprint = text(path.join(publicRoot, 'pageBlueprints.ts'))
const content = text(path.join(publicRoot, 'content.ts'))
const routeSource = text(routeFile)
const marketplaceRootSource = text(marketplaceRootFile)
const nextConfig = text(nextConfigFile)
const css = text(cssFile)

console.log('=== SANILA INSTITUTIONAL PRODUCT EXPERIENCE STATIC QA ===')

// Root authority
if (/source:\s*['"]\/['"]\s*,\s*destination:\s*['"]\/angelcare-marketplace\/fr['"]\s*,\s*permanent:\s*true/.test(nextConfig)) pass('application root / permanently redirects to /angelcare-marketplace/fr')
else fail('application root permanent Marketplace redirect missing from next.config.ts')
if (marketplaceRootSource.includes("permanentRedirect('/angelcare-marketplace/fr')")) pass('/angelcare-marketplace permanently redirects to Marketplace FR')
else fail('/angelcare-marketplace permanent redirect missing')

// Namespace constitution
if (content.includes("normalized === 'sanila'") && content.includes("normalized.startsWith('sanila/')")) pass('explicit /sanila namespace matcher')
else fail('explicit /sanila namespace matcher missing')
if (routeSource.includes('isSanilaPublicRoute(slug)') && routeSource.includes('resolveSanilaPublicSlug(slug)')) pass('Marketplace catch-all delegates SANILA only through explicit resolver')
else fail('Marketplace catch-all SANILA resolver contract missing')
for (const generic of ['accueil','produit','finance','tarifs','solutions','ressources','administration','transport','admissions']) {
  const literal = `normalized === '${generic}'`
  !content.includes(literal) ? pass(`generic Marketplace slug not registered as SANILA matcher: ${generic}`) : fail(`generic Marketplace slug can be claimed by SANILA: ${generic}`)
}

// Page estate and anti-template constitution
const slugs = [...blueprint.matchAll(/slug:\s*'([^']+)'/g)].map((match) => match[1])
if (slugs.length === 29 && new Set(slugs).size === 29) pass('29 unique SANILA page blueprints')
else fail(`expected 29 unique blueprints, got ${slugs.length}/${new Set(slugs).size}`)
const pageFiles = walk(pagesDir).filter((file) => file.endsWith('.tsx'))
if (pageFiles.length === 29) pass('29 physical page-composition modules')
else fail(`expected 29 physical page modules, got ${pageFiles.length}`)
const fingerprints = new Map()
for (const file of pageFiles) {
  const fp = fingerprint(text(file))
  const names = fingerprints.get(fp) || []
  names.push(path.basename(file))
  fingerprints.set(fp, names)
}
const duplicateFingerprints = [...fingerprints.entries()].filter(([, names]) => names.length > 1)
if (fingerprints.size === pageFiles.length) pass(`page-composition fingerprint diversity ${fingerprints.size}/${pageFiles.length}`)
else fail(`duplicate page composition fingerprints: ${duplicateFingerprints.map(([fp,n])=>`${fp}:${n.join(',')}`).join(' | ')}`)

for (const retired of ['components/SanilaSections.tsx','components/SanilaSpecialSections.tsx']) {
  const file = path.join(publicRoot, retired)
  !fs.existsSync(file) ? pass(`retired generic page choreography absent: ${retired}`) : fail(`retired generic page choreography still exists: ${retired}`)
}
for (const symbol of ['PageHero','RecognitionBand','DomainSignature']) {
  !source.includes(symbol) ? pass(`legacy shared choreography symbol absent: ${symbol}`) : fail(`legacy shared choreography symbol remains: ${symbol}`)
}

const majorSignatures = {
  HomePage: ['homeHero','FragmentationModel','InteractiveDayStory','RoleSwitchboard'],
  DirectionPage: ['directionHero','ExecutiveSignalBoard','directionSignals'],
  FinancePage: ['financeHero','FinanceLedgerVisual','financeDocuments'],
  AdmissionsPage: ['admissionsHero','AdmissionsJourneyVisual','admissionsStory'],
  PedagogyPage: ['pedagogyHero','AcademicGridVisual','pedagogyEditorial'],
  TransportPage: ['transportHero','TransportTopologyVisual','transportOperations'],
  SecurityPage: ['securityHero','SecurityArchitectureVisual','securityPrinciples'],
  AccessPage: ['accessHero','RoleAccessDoors'],
  DemoPage: ['formExperience','SanilaDemoForm'],
  OnboardingPage: ['onboardingStepsPreview','SanilaOnboardingForm'],
}
for (const [pageName, signatures] of Object.entries(majorSignatures)) {
  const file = path.join(pagesDir, `${pageName}.tsx`)
  const body = text(file)
  const missing = signatures.filter((signature) => !body.includes(signature))
  !missing.length ? pass(`${pageName} independent composition signature`) : fail(`${pageName} missing independent signatures: ${missing.join(', ')}`)
}

// CSS authority
const classes = new Set([...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]))
const styleRefs = new Set()
for (const file of tsxFiles) for (const match of text(file).matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)) styleRefs.add(match[1])
const missingClasses = [...styleRefs].filter((name) => !classes.has(name)).sort()
!missingClasses.length ? pass(`CSS module reference authority (${styleRefs.size} refs / ${classes.size} classes)`) : fail(`missing CSS classes: ${missingClasses.join(', ')}`)

// Product truth / access boundaries
const accessAuthorities = ['/angelcare-360-access/login','/angelcare-360-portal/login','/angelcare-360-teacher/login','/angelcare-360-staff/login','/angelcare-360-parent/login','/angelcare-360-student/login']
for (const href of accessAuthorities) source.includes(href) ? pass(`customer authority preserved ${href}`) : fail(`missing customer authority ${href}`)
!source.toLowerCase().includes('angelcare-360-operator') ? pass('public Operator exposure = 0') : fail('Operator route leaked into SANILA public source')
!source.includes('ProductPreview') && !source.includes('Données de démonstration') ? pass('rejected fake-dashboard system absent') : fail('fake product preview remnants found')
source.includes('Schéma éditorial') || source.includes('schéma éditorial') ? pass('editorial explanatory visuals explicitly labelled') : fail('editorial visual truth labels missing')
source.includes('/api/angelcare-marketplace/public/inquiries') ? pass('existing public inquiry backend reused') : fail('public inquiry backend not referenced')
for (const route of ['/angelcare-marketplace/fr/sanila/demonstration','/angelcare-marketplace/fr/sanila/contact','/angelcare-marketplace/fr/sanila/creer-mon-etablissement']) source.includes(route) ? pass(`acquisition source route namespaced ${route}`) : fail(`missing acquisition source route ${route}`)

// Buyer journey maturity
const demo = text(path.join(publicRoot,'SanilaDemoForm.tsx'))
const onboarding = text(path.join(publicRoot,'SanilaOnboardingForm.tsx'))
const contact = text(path.join(publicRoot,'SanilaContactForm.tsx'))
const demoSteps = (demo.match(/const stepNames = \[/) && demo.includes("'Institution'") && demo.includes("'Réalité actuelle'") && demo.includes("'Priorités'") && demo.includes("'Échelle'") && demo.includes("'Calendrier'") && demo.includes("'Contact'"))
demoSteps ? pass('demonstration uses six-stage qualification journey') : fail('demonstration progressive qualification journey missing')
onboarding.includes("const steps=['Organisation','Sites','Volume','Priorités','Calendrier','Responsable']") ? pass('onboarding uses six-stage preparation journey') : fail('onboarding six-stage preparation journey missing')
contact.includes('Pourquoi souhaitez-vous nous contacter ?') && contact.includes('role="radiogroup"') ? pass('contact begins with explicit intent selection') : fail('contact intent-first interaction missing')

// Public language
const publicCopy = source.replace(/sourcePath:\s*'[^']*'/g, "sourcePath: '[internal-evidence-path]'")
const dangerousTerms = ['tenant','provisioning','runtime','crud','backoffice','postgrest','server component','command plane']
for (const term of dangerousTerms) new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')}\\b`,'i').test(publicCopy) ? fail(`public engineering jargon detected: ${term}`) : pass(`public jargon absent: ${term}`)

// Source evidence
const evidencePaths = [...blueprint.matchAll(/sourcePath:\s*'([^']+)'/g)].map((match) => match[1])
const missingEvidence = [...new Set(evidencePaths)].filter((rel) => !fs.existsSync(path.join(root, rel)))
!missingEvidence.length ? pass(`source-derived evidence authorities exist (${new Set(evidencePaths).size} unique)`) : fail(`missing source-derived evidence authorities: ${missingEvidence.join(', ')}`)
const publicAssets = walk(path.join(root,'public','sanila')).filter((file)=>/\.(png|webp|jpe?g|avif)$/i.test(file))
console.log(`INFO physical SANILA visual assets available in recovery source: ${publicAssets.length}`)
if (publicAssets.length < 18) console.log('INFO authentic 18–24 screenshot target requires authorized runtime capture; static package does not fabricate missing product screenshots')

// Logo authority
const logo = path.join(root,'public','sanila','sanila-operating-system-logo.png')
if (fs.existsSync(logo)) { const hash=crypto.createHash('sha256').update(fs.readFileSync(logo)).digest('hex'); console.log(`INFO official logo SHA256 ${hash}`); pass('official SANILA logo asset exists') } else fail('official SANILA logo asset missing')

console.log(`INFO SANILA source files checked ${sourceFiles.length}`)
if (!process.exitCode) console.log('SANILA_INSTITUTIONAL_STATIC_QA=PASS')
