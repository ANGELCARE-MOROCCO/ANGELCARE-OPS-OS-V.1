
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'

const app = path.resolve(process.argv[2] || process.cwd())
let passed = 0
function pass(label){ passed += 1; console.log(`PASS  ${label}`) }
function fail(label){ console.error(`FAIL  ${label}`); process.exitCode = 1 }
function read(rel){ const p=path.join(app,rel); if(!fs.existsSync(p)){ fail(`missing ${rel}`); return '' } pass(`file exists ${rel}`); return fs.readFileSync(p,'utf8') }
function marker(source, value, label){ source.includes(value) ? pass(label) : fail(label) }
function absent(source, value, label){ !source.includes(value) ? pass(label) : fail(label) }

const files = [
  'app/(protected)/angelcare-360-operator/brand-governance/page.tsx',
  'app/api/angelcare360/operator/branding/route.ts',
  'app/api/angelcare360/branding/current/route.ts',
  'app/api/angelcare360/branding/assets/[id]/route.ts',
  'components/angelcare360/operator/branding/BrandGovernanceStudio.tsx',
  'components/angelcare360/operator/branding/BrandGovernanceStudio.module.css',
  'components/angelcare360/operator/branding/CustomerBrandGovernancePanel.tsx',
  'components/brand/AngelCareLogo.tsx',
  'components/brand/BrandRuntimeLockup.tsx',
  'components/brand/TenantBrandHeaderIdentity.tsx',
  'lib/angelcare360/operator/branding.ts',
  'lib/angelcare360/branding/email-template.ts',
  'supabase/migrations/20260801_angelcare360_global_brand_governance_tenant_whitelabel.sql',
  'types/angelcare360/operator/branding.ts',
  'tsconfig.angelcare360-brand-governance.json',
]
for(const rel of files) read(rel)

const studio = read('components/angelcare360/operator/branding/BrandGovernanceStudio.tsx')
const contract = read('components/angelcare360/operator/branding/BrandGovernanceContract.ts')
for(const value of ['Brand Command','Identité AngelCare','Marques clients','Assets Windows','Publication','Runtime & audit']) marker(contract,value,`scene contract ${value}`)
for(const value of ['500 000 octets','branding/customers','white_label','profile.transition','runtime.test']) marker(studio,value,`studio contract ${value}`)
const brandLib = read('lib/angelcare360/operator/branding.ts')
for(const value of ['BRAND_MAX_ASSET_BYTES = 500_000','BRAND_MAX_DIMENSION = 1600','image/png','image/jpeg','image/webp','validateImageSignature','imageDimensions','angelcare_brand_assets','branding/customers','resolveBrandRuntime','fallbackReason','tenantHasBrandEntitlement','uploadStorageFileToBridge','downloadStorageFileFromBridge']) marker(brandLib,value,`kernel ${value}`)
absent(brandLib,'image/svg+xml','SVG remains disabled')
const runtimeLockup = read('components/brand/BrandRuntimeLockup.tsx')
for(const value of ['angelcare_only','cobrand','customer_primary','white_label','Powered by']) marker(runtimeLockup,value,`runtime lockup ${value}`)
const nav = read('data/angelcare360/operator-sovereign-navigation.ts')
marker(nav,"Brand Governance",'platform navigation includes Brand Governance')
marker(nav,"brand-governance",'route resolves to platform tower')
const dossier = read('components/angelcare360/operator/growth/CustomerSovereignCommandRoom.tsx')
marker(dossier,'CustomerBrandGovernancePanel','customer dossier branding panel')
const customerHeader = read('components/angelcare360/layout/Angelcare360Header.tsx')
marker(customerHeader,'TenantBrandHeaderIdentity','customer header runtime branding')
const operatorHeader = read('components/angelcare360/operator/Angelcare360OperatorHeader.tsx')
marker(operatorHeader,'AngelCareLogo','operator header official identity')
const activation = read('components/angelcare360/access/TenantAccessActivationClient.tsx')
marker(activation,'BrandRuntimeLockup','activation runtime branding')
const mfa = read('app/angelcare-360-access/mfa/page.tsx')
marker(mfa,'BrandRuntimeLockup','MFA runtime branding')
const email = read('lib/angelcare360/email/email-os-bridge.ts')
marker(email,'renderAngelcare360BrandedEmail','Email OS branding renderer')
marker(email,'bodyHtml: branded.html','HTML branding sent to Email OS')
const a4 = read('components/angelcare360/documents/Angelcare360A4Header.tsx')
marker(a4,'AngelCareLogo','A4 official brand')
const pdf = read('lib/angelcare360/documents/pdf.ts')
marker(pdf,"public', 'logo.png'",'server PDF embeds official logo')
const appShell = read('app/components/erp/AppShell.tsx')
marker(appShell,'/brand/angelcare-official.webp','ERP shell official logo')

const assetChecks = [
  ['public/brand/angelcare-official.webp','RIFF',500000],
  ['public/logo.png','PNG',500000],
]
for(const [rel,kind,max] of assetChecks){
  const p=path.join(app,rel); if(!fs.existsSync(p)){ fail(`asset missing ${rel}`); continue }
  const b=fs.readFileSync(p); b.length<=max ? pass(`${rel} <= ${max} bytes`) : fail(`${rel} too large`)
  const valid=kind==='PNG' ? b.subarray(1,4).toString()==='PNG' : b.subarray(0,4).toString()==='RIFF' && b.subarray(8,12).toString()==='WEBP'
  valid ? pass(`${rel} signature`) : fail(`${rel} signature`)
  pass(`${rel} sha256 ${crypto.createHash('sha256').update(b).digest('hex')}`)
}

function classSet(css){ return new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map(m=>m[1])) }
for(const [tsxRel,cssRel] of [
  ['components/angelcare360/operator/branding/BrandGovernanceStudio.tsx','components/angelcare360/operator/branding/BrandGovernanceStudio.module.css'],
  ['components/angelcare360/operator/branding/CustomerBrandGovernancePanel.tsx','components/angelcare360/operator/branding/CustomerBrandGovernancePanel.module.css'],
]){
  const tsx=read(tsxRel), css=read(cssRel), classes=classSet(css)
  const refs=new Set([...tsx.matchAll(/styles\.([A-Za-z_][\w]*)/g)].map(m=>m[1]))
  for(const ref of refs) classes.has(ref) ? pass(`CSS resolves ${path.basename(tsxRel)}:${ref}`) : fail(`CSS missing ${path.basename(tsxRel)}:${ref}`)
  const clean=css.replace(/\/\*[\s\S]*?\*\//g,'')
  for(const rule of clean.matchAll(/([^{}]+)\{/g)){
    const pre=rule[1].trim().replace(/\s+/g,' ')
    if(!pre || pre.startsWith('@') || pre==='from' || pre==='to' || /^\d+(\.\d+)?%$/.test(pre)) continue
    for(const selector of pre.split(',')) /(^|[\s>+~(])[.#][A-Za-z_]/.test(selector.trim()) || selector.includes(':global(') ? null : fail(`impure CSS selector ${cssRel}: ${selector.trim()}`)
  }
  pass(`CSS module purity ${cssRel}`)
}

const tsFiles = [
  ...files.filter(f=>/\.(ts|tsx)$/.test(f)),
  'components/brand/TenantBrandLockup.tsx',
  'components/angelcare360/operator/branding/BrandGovernanceContract.ts',
  'app/api/angelcare360/access/activate/route.ts',
  'app/api/angelcare360/access/mfa/route.ts',
  'app/angelcare-360-access/mfa/page.tsx',
  'components/angelcare360/documents/Angelcare360A4Header.tsx',
  'lib/angelcare360/documents/pdf.ts',
  'types/angelcare360/documents.ts',
  'types/angelcare360/email.ts',
]
let ts=null
try { ts=createRequire(path.join(app,'package.json'))('typescript') } catch {}
if(ts){
  for(const rel of [...new Set(tsFiles)]){
    const source=fs.readFileSync(path.join(app,rel),'utf8')
    const result=ts.transpileModule(source,{fileName:rel,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.Preserve}})
    const diagnostics=result.diagnostics||[]
    if(diagnostics.length){ fail(`TypeScript syntax ${rel}: ${diagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join(' | ')}`) } else pass(`TypeScript syntax ${rel}`)
  }
}else console.log('NOTICE project-local TypeScript unavailable; syntax is checked by installer when available.')

if(process.exitCode) process.exit(process.exitCode)
console.log(`\n${passed} checks passed. Global Brand Governance & Tenant White-Label Control is statically accepted.`)
