import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'); const repo=path.resolve(root,'../..'); let failed=0
const check=(label,ok)=>{console.log(`${ok?'PASS':'FAIL'} ${label}`);if(!ok)failed++}
const read=(rel)=>fs.readFileSync(path.join(repo,rel),'utf8')
const security=read('apps/ops-web/lib/browser-extension/security.ts'); const runtime=read('apps/ops-web/lib/browser-extension/runtime.ts'); const commands=read('apps/ops-web/app/api/browser-extension/v1/commands/execute/route.ts'); const telemetry=read('apps/ops-web/lib/browser-extension/production-control/service.ts')+read('apps/ops-web/lib/browser-extension/production-control/contract.ts'); const manifest=JSON.parse(read('apps/revenue-browser-extension/manifest.template.json')); const extFiles=[]
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);if(ent.isDirectory())walk(full);else extFiles.push(full)}} walk(path.join(repo,'apps/revenue-browser-extension/src'))
const extText=extFiles.filter(f=>/\.(ts|json)$/.test(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n')
check('token secret minimum length enforced',security.includes('value.length < 32'))
check('HMAC signature timing safe',security.includes('timingSafeEqual'))
check('access token expiry enforced',security.includes('claims.exp<='))
check('device revocation enforced',runtime.includes("device.status!=='active'"))
check('extension identity origin enforced',runtime.includes('EXTENSION_ORIGIN_MISMATCH'))
check('stale capability version denied',runtime.includes('ACCESS_CHANGED'))
check('temporary access expiration enforced',runtime.includes('ACCESS_EXPIRED'))
check('known-bad version denied',runtime.includes('KNOWN_BAD_EXTENSION_VERSION'))
check('production kill switch enforced',runtime.includes('PRODUCTION_KILL_SWITCH'))
check('idempotency registered',commands.includes('idempotencyKey')&&commands.includes("onConflict:'user_id,idempotency_key'"))
check('payload hash recorded',commands.includes("createHash('sha256')"))
check('audit on success and failure',commands.includes('command_executed')&&commands.includes('command_failed'))
check('telemetry redacts authorization',telemetry.includes("'authorization'")&&telemetry.includes("'[redacted]'"))
check('telemetry redacts message and page content',telemetry.includes("'messageBody'")&&telemetry.includes("'pageContent'"))
check('no Supabase client in Chrome source',!extText.toLowerCase().includes('@supabase')&&!extText.toLowerCase().includes('supabaseurl'))
check('no service-role token in Chrome source',!extText.includes('service_role')&&!extText.includes('SUPABASE_SERVICE_ROLE'))
check('no database password in Chrome source',!extText.includes('DATABASE_URL')&&!extText.includes('DB_PASSWORD'))
check('Manifest V3',manifest.manifest_version===3)
const allowed=new Set(['sidePanel','storage','activeTab','tabs','scripting','contextMenus','notifications','alarms']); check('no unexpected Chrome permissions',manifest.permissions.every(x=>allowed.has(x)))
check('restricted default host permissions',manifest.host_permissions.length===1&&manifest.host_permissions[0].includes('__SAAS_ORIGIN__'))
check('optional broad hosts require user grant',manifest.optional_host_permissions.includes('https://*/*')&&manifest.optional_host_permissions.includes('http://*/*'))
check('no uncontrolled external messaging implementation',!extText.includes('bulk unattended')&&!extText.includes('rate-limit evasion'))
const secretPatterns=[/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,/eyJhbGciOiJIUzI1NiJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,/sk_live_[A-Za-z0-9]{16,}/,/service_role\s*[:=]\s*["'][A-Za-z0-9._-]{20,}/i]
for(const pattern of secretPatterns)check(`secret scan ${pattern}`,!pattern.test(extText))
if(failed){console.error(`Production security verification FAILED: ${failed}`);process.exit(1)}
console.log('MEGA PATCH 07 PRODUCTION SECURITY VERIFICATION PASSED')
