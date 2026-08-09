import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'); const repo=path.resolve(root,'../..')
let failed=0; const checks=[]
const read=(rel)=>fs.readFileSync(path.join(repo,rel),'utf8'); const exists=(rel)=>fs.existsSync(path.join(repo,rel))
function check(label,ok,detail=''){checks.push({label,ok:Boolean(ok),detail});console.log(`${ok?'PASS':'FAIL'} ${label}${detail?` — ${detail}`:''}`);if(!ok)failed++}
const required=[
 'packages/browser-extension-contracts/b2b-production-final.v7.json',
 'apps/ops-web/supabase/migrations/20260720_browser_extension_production_final.sql',
 'apps/ops-web/supabase/migrations/rollback_20260720_browser_extension_production_final.sql',
 'apps/ops-web/lib/browser-extension/production-control/types.ts','apps/ops-web/lib/browser-extension/production-control/contract.ts','apps/ops-web/lib/browser-extension/production-control/authorization.ts','apps/ops-web/lib/browser-extension/production-control/service.ts',
 'apps/ops-web/app/api/browser-extension/v1/production/status/route.ts','apps/ops-web/app/api/browser-extension/v1/production/telemetry/route.ts','apps/ops-web/app/api/browser-extension/v1/admin/production/control/route.ts',
 'apps/ops-web/app/(protected)/browser-os-production/page.tsx','apps/ops-web/app/(protected)/browser-os-production/production-control.tsx',
 'apps/revenue-browser-extension/src/production/reliability.ts','apps/revenue-browser-extension/src/production/runtime-health.ts',
 'docs/browser-extension/production/release/release-manifest.v0.7.0.json','docs/browser-extension/production/release/sbom.v0.7.0.json','docs/browser-extension/production/deployment/update-manifest.example.xml','docs/browser-extension/production/deployment/chrome-enterprise-policy.example.json'
]
for(const f of required)check(`required file ${f}`,exists(f))
const production=JSON.parse(read('packages/browser-extension-contracts/b2b-production-final.v7.json'))
const canonical=JSON.parse(read('packages/browser-extension-contracts/b2b-capabilities.v1.json'))
const operational=canonical.capabilities.filter(x=>x.patch02Status==='implemented'||x.patch03Status==='implemented'||x.patch04Status==='implemented'||x.patch05Status==='implemented'||x.patch06Status==='implemented'||x.patch06Status==='preserved')
check('45 canonical capabilities',canonical.capabilities.length===45,String(canonical.capabilities.length))
check('45 operational capabilities preserved',operational.length===45,String(operational.length))
for(const [key,value] of Object.entries(production.capabilityProof))check(`final proof ${key} 45/45`,value===45,String(value))
check('five release channels',production.releaseChannels.length===5,String(production.releaseChannels.length))
check('five production control workspaces',production.productionControlWorkspaces.length===5,String(production.productionControlWorkspaces.length))
check('22 documentation families',production.documentation.length===22,String(production.documentation.length))
check('stable promotion remains gated',String(production.truthfulness.stablePromotion).includes('live production gates'))
check('Mega ZIP 8 boundary preserved',String(production.mega8Boundary).includes('No multi-module federation'))
const sql=read('apps/ops-web/supabase/migrations/20260720_browser_extension_production_final.sql'); const rollback=read('apps/ops-web/supabase/migrations/rollback_20260720_browser_extension_production_final.sql')
const tables=[...sql.matchAll(/create table if not exists public\.([a-z0-9_]+)/gi)].map(m=>m[1])
check('production persistence structures >=14',tables.length>=14,String(tables.length))
for(const table of tables){check(`RLS ${table}`,sql.includes(`alter table public.${table} enable row level security`));check(`rollback ${table}`,rollback.includes(`drop table if exists public.${table}`))}
for(const signal of ['development','internal','pilot','stable','rollback','browser_extension_runtime_health_events','browser_extension_performance_samples','browser_extension_adapter_health','browser_extension_error_fingerprints','browser_extension_feature_flags','browser_extension_production_kill_switches','browser_extension_incidents','browser_extension_compatibility_matrix','browser_extension_privacy_retention_policies'])check(`SQL production signal ${signal}`,sql.includes(signal))
check('pilot upgraded to 0.7.0',sql.includes("'0.7.0'"))
check('rollback returns 0.6.0',rollback.includes("'0.6.0'"))
const runtime=read('apps/ops-web/lib/browser-extension/runtime.ts'); const service=read('apps/ops-web/lib/browser-extension/production-control/service.ts'); const api=read('apps/revenue-browser-extension/src/api.ts'); const worker=read('apps/revenue-browser-extension/src/background/service-worker.ts'); const health=read('apps/revenue-browser-extension/src/production/runtime-health.ts'); const reliability=read('apps/revenue-browser-extension/src/production/reliability.ts'); const ui=read('apps/ops-web/app/(protected)/browser-os-production/production-control.tsx')
for(const signal of ['PRODUCTION_KILL_SWITCH','KNOWN_BAD_EXTENSION_VERSION','EXTENSION_ORIGIN_MISMATCH','ACCESS_CHANGED'])check(`server authority ${signal}`,runtime.includes(signal))
for(const signal of ['recordProductionTelemetry','loadProductionStatus','loadProductionControl','executeProductionAdminAction','sanitize','fingerprint'])check(`production service ${signal}`,service.includes(signal))
for(const signal of ['withRetry','exponential','onlineState','isRetryableError'])check(`reliability ${signal}`,reliability.includes(signal)||signal==='exponential'&&reliability.includes('2 **'))
for(const signal of ['flushProductionTelemetry','recordAdapterHealth','measure','getProductionStatus','isProductionBlocked'])check(`runtime health ${signal}`,health.includes(signal))
for(const signal of ['angelcare-production-health','angelcare-production-status','scheduled_health','ANGELCARE_PRODUCTION_BLOCK'])check(`service worker production ${signal}`,worker.includes(signal))
for(const signal of ['Production Health','Release Channels','Device Fleet','Flags & Kill Switches','Incident Command','Emergency rollback'])check(`production cockpit ${signal}`,ui.includes(signal))
check('Gateway requests instrumented',api.includes("measure(metricKey")&&api.includes('withRetry'))
const manifest=JSON.parse(read('apps/revenue-browser-extension/manifest.template.json'))
const versionParts=String(manifest.version||'0.0.0').split('.').map(Number)
check('extension preserves Mega ZIP 7 baseline at version >=0.7.0',versionParts[0]>0||versionParts[1]>=7,manifest.version)
check('newer cumulative RC preserves live-acceptance truth boundary',manifest.version==='0.7.0'||String(manifest.version_name||'').toLowerCase().includes('live acceptance required'),manifest.version_name||'')
check('Manifest V3',manifest.manifest_version===3,String(manifest.manifest_version))
check('minimum Chrome documented',Number(manifest.minimum_chrome_version)>=114,String(manifest.minimum_chrome_version))
const docDir=path.join(repo,'docs/browser-extension/production'); const handbookCount=fs.readdirSync(docDir).filter(x=>x.endsWith('.md')).length
check('complete documentation files',handbookCount>=22,String(handbookCount))
const releaseManifest=JSON.parse(read('docs/browser-extension/production/release/release-manifest.v0.7.0.json'))
check('release excludes secrets',releaseManifest.exclusions.includes('private-signing-key')&&releaseManifest.exclusions.includes('.env'))
const hashes=['packages/browser-extension-contracts/b2b-production-final.v7.json','apps/ops-web/lib/browser-extension/generated/b2b-production-final.v7.json','apps/revenue-browser-extension/src/generated/b2b-production-final.v7.json'].map(rel=>crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,rel))).digest('hex'))
check('production contract mirrors synchronized',new Set(hashes).size===1)
const report={generatedAt:new Date().toISOString(),checks,totals:{checks:checks.length,passed:checks.filter(x=>x.ok).length,failed,tables:tables.length,documentationFiles:handbookCount,capabilities:operational.length}}
fs.writeFileSync(path.join(repo,'ANGELCARE_BROWSER_OS_B2B_MEGA_PATCH_07_VERIFICATION.json'),JSON.stringify(report,null,2)+'\n')
if(failed){console.error(`Mega ZIP 7 verification FAILED: ${failed} check(s)`);process.exit(1)}
console.log(`MEGA PATCH 07 PRODUCTION FINAL VERIFICATION PASSED — ${checks.length}/${checks.length} checks`)
