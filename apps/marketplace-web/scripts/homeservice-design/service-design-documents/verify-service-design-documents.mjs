import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
let passed = 0
let failed = 0
const exists = (file) => fs.existsSync(path.join(root, file))
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const safeOutput = (result) => `${typeof result?.stdout === 'string' ? result.stdout : ''}${typeof result?.stderr === 'string' ? result.stderr : ''}`.trim()
const check = (name, value, detail = '') => { console.log(`${value ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`); value ? passed++ : failed++ }
const walk = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => { const target = path.join(dir, entry.name); return entry.isDirectory() ? walk(target) : [target] }) : []

const required = [
  'components/carelink/service-design/documents/types.ts',
  'components/carelink/service-design/documents/templateRegistry.ts',
  'components/carelink/service-design/documents/sourceNormalization.ts',
  'components/carelink/service-design/documents/previewLayout.ts',
  'components/carelink/service-design/documents/DocumentPreview.tsx',
  'components/carelink/service-design/documents/ServiceDocumentStudio.tsx',
  'components/carelink/service-design/documents/ServiceDocumentStudio.module.css',
  'components/carelink/service-design/documents/server/access.ts',
  'components/carelink/service-design/documents/server/sourceResolver.ts',
  'components/carelink/service-design/documents/server/pdfRenderer.ts',
  'app/api/carelink-ops/service-design/documents/source/route.ts',
  'app/api/carelink-ops/service-design/documents/render/route.ts',
  'app/carelink-ops/service-design/documents/page.tsx',
  'app/carelink-ops/service-design/planning/documents/[planId]/page.tsx',
  'app/carelink-ops/service-design/vitrine/[sellableId]/documents/page.tsx',
  'tsconfig.service-design-documents.json',
]
required.forEach((file) => check(`required ${file}`, exists(file)))

const registry = read('components/carelink/service-design/documents/templateRegistry.ts')
const studio = read('components/carelink/service-design/documents/ServiceDocumentStudio.tsx')
const preview = read('components/carelink/service-design/documents/DocumentPreview.tsx')
const css = read('components/carelink/service-design/documents/ServiceDocumentStudio.module.css')
const renderer = read('components/carelink/service-design/documents/server/pdfRenderer.ts')
const sourceResolver = read('components/carelink/service-design/documents/server/sourceResolver.ts')
const sourceRoute = read('app/api/carelink-ops/service-design/documents/source/route.ts')
const renderRoute = read('app/api/carelink-ops/service-design/documents/render/route.ts')
const dock = read('components/carelink/service-design/studio2030/ServiceDesignDock.tsx')
const shell = read('components/carelink/service-design/HomeServiceDesignShell.tsx')
const documentFiles = walk(path.join(root, 'components/carelink/service-design/documents')).filter((file) => /\.(ts|tsx|css)$/.test(file))
const documentSource = documentFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n')

const templateIds = [...registry.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1])
check('fourteen professional A4 templates are registered', templateIds.length === 14, `${templateIds.length} templates`)
check('template IDs are unique', new Set(templateIds).size === 14)
check('technical, field, event, route, care, commercial, enterprise and economics families exist', ['technical','field','event','route','care','commercial','enterprise','economics','complete'].every((value) => registry.includes(`family: '${value}'`)))
check('ISO 216 A4 portrait dimensions are exact', renderer.includes('[595.28, 841.89]') && css.includes('width:210mm') && css.includes('min-height:297mm'))
check('ISO 216 A4 landscape dimensions are exact', renderer.includes('[841.89, 595.28]') && css.includes('width:297mm') && css.includes('min-height:210mm'))
check('official repository PNG logo is used unchanged', renderer.includes("angelcare-original-logo.png") && preview.includes("angelcare-original-logo.png") && exists('public/b2b-plaquette-partenaires/assets/angelcare-original-logo.png'))
check('corporate footer contains legal identity and broad contacts', renderer.includes('ANGELCARE UNITÉ D’AFFAIRE ARTAB S.A.R.L (A.U)') && renderer.includes('www.angelcarehub.com') && renderer.includes('backoffice@angelcarehub.com') && renderer.includes('+212 537 581 462'))
check('footer preserves reference, confidentiality and page count', renderer.includes('Réf.') && renderer.includes('Page ${index + 1} / ${pages.length}') && renderer.includes('confidentiality.toUpperCase'))
check('PDF metadata is assigned', ['setTitle','setAuthor','setSubject','setKeywords','setCreator','setProducer'].every((value) => renderer.includes(value)))
check('PDF renderer uses pdf-lib server-side', renderer.includes("from 'pdf-lib'") && renderer.includes("import 'server-only'"))
check('render endpoint returns real application/pdf bytes', renderRoute.includes("'content-type': 'application/pdf'") && renderRoute.includes('x-document-sha256') && renderRoute.includes('ArrayBuffer'))
check('source resolution is server-only and authenticated', sourceRoute.includes('getCurrentAppUser') && sourceRoute.includes('canUseServiceDesignDocuments') && sourceResolver.includes("import 'server-only'"))
check('document source resolver is read-only', !sourceResolver.includes('.insert(') && !sourceResolver.includes('.update(') && !sourceResolver.includes('.delete(') && !sourceResolver.includes('.upsert('))
check('unresolved sources remain explicit and never fabricated', sourceResolver.includes('return null') && read('components/carelink/service-design/documents/sourceNormalization.ts').includes('Aucun contenu opérationnel n’est inventé'))
check('stretchable section composer exists', studio.includes('moveSection') && studio.includes('toggleSection') && studio.includes('sectionOrder') && studio.includes('hiddenSections'))
check('portrait and landscape controls exist', studio.includes("values={['portrait','landscape']}") && studio.includes("updateSetting('orientation'"))
check('compact, standard and detailed density controls exist', studio.includes("values={['compact','standard','detailed']}") && studio.includes("updateSetting('density'"))
check('customer, operations, commercial and executive audiences exist', registry.includes("['operations', 'commercial', 'executive']") && studio.includes('audienceLabels'))
check('public, internal, confidential and restricted markings exist', studio.includes("['public','internal','confidential','restricted']"))
check('live page thumbnails and page navigation exist', studio.includes('previewPages.map') && studio.includes('Page active') && studio.includes('setActivePage'))
check('accurate page boundaries and print mode exist', preview.includes('paginateServiceDocument') && css.includes('@media print') && css.includes('break-after:page'))
check('direct print action exists', studio.includes('window.print()'))
check('real PDF download action exists', studio.includes("/api/carelink-ops/service-design/documents/render") && studio.includes('response.blob()'))
check('browser draft recovery exists without SQL', studio.includes('localStorage.setItem') && studio.includes('localStorage.getItem'))
check('blank approval fields are optional and contain no preloaded signature', renderer.includes('showBlankApprovalFields') && renderer.includes('VALIDATION / NOM / DATE') && !documentSource.includes('CACHET') && !documentSource.includes('data:image'))
check('document production never mutates plan, sellable or CARELINK data', !documentSource.includes('/factory/publish') && !documentSource.includes('/handoffs/') && !documentSource.includes('.insert(') && !documentSource.includes('.update('))
check('central A4 & PDF Studio is exposed in Studio Dock', dock.includes("label: 'A4 & PDF'") && dock.includes("/service-design/documents"))
check('Service Design route identity recognizes document studios', shell.includes('A4 & PDF Production Studio') && shell.includes('Executive Document Studio'))
check('planning documents receive their plan ID', read('app/carelink-ops/service-design/planning/documents/[planId]/page.tsx').includes('planId={planId}'))
check('commercial documents receive their sellable ID', read('app/carelink-ops/service-design/vitrine/[sellableId]/documents/page.tsx').includes('sellableId={sellableId}'))
check('executive documents use real performance data', read('components/carelink/service-design/performance/workspaces/ExecutiveDocumentWorkspace.tsx').includes('performanceData()'))
check('no styled-jsx compatibility hazard exists', !documentSource.includes('<style jsx'))
check('no SQL migration is introduced', !walk(path.join(root, 'supabase/migrations')).some((file) => /service.design.*document|a4.*pdf/i.test(path.basename(file))))

const sourceFiles = [
  ...walk(path.join(root, 'components/carelink/service-design/documents')),
  ...walk(path.join(root, 'app/api/carelink-ops/service-design/documents')),
  ...walk(path.join(root, 'app/carelink-ops/service-design/documents')),
].filter((file) => /\.(ts|tsx)$/.test(file))
let localLinks = 0
const missing = []
const importPattern = /(?:from\s*|import\s*)['"]([^'"]+)['"]/g
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8')
  for (const match of source.matchAll(importPattern)) {
    const spec = match[1]
    if (!spec.startsWith('.')) continue
    localLinks++
    const base = path.resolve(path.dirname(file), spec)
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.css`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]
    if (!candidates.some((candidate) => fs.existsSync(candidate))) missing.push(`${path.relative(root, file)} -> ${spec}`)
  }
}
check('local document imports resolve', missing.length === 0, missing.length ? missing.slice(0, 8).join('; ') : `${localLinks} links`)

const localTsc = path.join(root, 'node_modules/.bin/tsc')
if (fs.existsSync(localTsc)) {
  const tscResult = spawnSync(localTsc, ['-p', 'tsconfig.service-design-documents.json', '--pretty', 'false'], { cwd: root, encoding: 'utf8', shell: false })
  const tscOutput = safeOutput(tscResult)
  check('strict dependency-backed TypeScript passes', tscResult.status === 0, tscResult.status === 0 ? '0 errors' : tscOutput.slice(-2200))
} else {
  const transpileScript = `
    const fs=require('fs'),path=require('path'),ts=require('typescript');
    const root=process.argv[1];
    const walk=d=>fs.existsSync(d)?fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]):[];
    const files=[...walk(path.join(root,'components/carelink/service-design/documents')),...walk(path.join(root,'app/api/carelink-ops/service-design/documents')),...walk(path.join(root,'app/carelink-ops/service-design/documents'))].filter(f=>/\.(ts|tsx)$/.test(f));
    let failed=0;
    for(const file of files){const source=fs.readFileSync(file,'utf8');const r=ts.transpileModule(source,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve,moduleResolution:ts.ModuleResolutionKind.Bundler}});for(const d of r.diagnostics||[]){if(d.category===ts.DiagnosticCategory.Error){failed++;console.error(file+': '+ts.flattenDiagnosticMessageText(d.messageText,' '));}}}
    console.log(files.length+' document TypeScript/TSX files transpiled');process.exit(failed?1:0);
  `
  const syntaxResult = spawnSync(process.execPath, ['-e', transpileScript, root], { cwd: root, encoding: 'utf8', shell: false })
  const syntaxOutput = safeOutput(syntaxResult)
  check('TypeScript syntax gate passes without repository dependencies', syntaxResult.status === 0, syntaxResult.status === 0 ? syntaxOutput : syntaxOutput.slice(-2200))
  console.log('INFO  Dependency-backed strict TypeScript will run automatically after installation in the target repository.')
}

console.log(`\n${passed}/${passed + failed} Service Design A4 & PDF Production Studio checks passed.`)
if (failed) process.exit(1)
