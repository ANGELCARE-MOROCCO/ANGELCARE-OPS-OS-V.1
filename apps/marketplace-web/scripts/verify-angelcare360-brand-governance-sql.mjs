
import fs from 'node:fs'
import path from 'node:path'
const app=path.resolve(process.argv[2]||process.cwd())
const file=path.join(app,'supabase/migrations/20260801_angelcare360_global_brand_governance_tenant_whitelabel.sql')
if(!fs.existsSync(file)){ console.error('FAIL SQL migration missing'); process.exit(1) }
const sql=fs.readFileSync(file,'utf8')
let passed=0
const pass=(x)=>{passed++;console.log(`PASS  ${x}`)}
const fail=(x)=>{console.error(`FAIL  ${x}`);process.exitCode=1}
for(const marker of [
 'begin;','commit;','angelcare360_operator_brand_profiles','angelcare360_operator_brand_assets','angelcare360_operator_brand_versions','angelcare360_operator_brand_events','angelcare360_official_brand_assets','angelcare360_operator_brand_runtime_snapshots','size_bytes > 0 and size_bytes <= 500000','image/png','image/jpeg','image/webp','enable row level security','revoke all on table','grant all on table','service_role','angelcare_storage_files','angelcare_storage_events','sha256_hash','public_version_token'
]) sql.toLowerCase().includes(marker.toLowerCase())?pass(marker):fail(marker)
for(const forbidden of ['drop table','drop column','truncate table','delete from auth.users','password text','image/svg+xml']) !sql.toLowerCase().includes(forbidden)?pass(`forbidden absent ${forbidden}`):fail(`forbidden present ${forbidden}`)
const stripped=sql.replace(/--.*$/gm,'').replace(/\$[A-Za-z0-9_]*\$[\s\S]*?\$[A-Za-z0-9_]*\$/g,'').replace(/'(?:''|[^'])*'/g,'')
for(const [open,close,label] of [['(',')','parentheses'],['[',']','brackets']]){
 let n=0; for(const c of stripped){if(c===open)n++;else if(c===close)n--} n===0?pass(`${label} balanced`):fail(`${label} imbalance ${n}`)
}
const begin=(sql.match(/\bbegin\s*;/gi)||[]).length, commit=(sql.match(/\bcommit\s*;/gi)||[]).length
begin===1&&commit===1?pass('single atomic transaction'):fail(`transaction begin=${begin} commit=${commit}`)
if(process.exitCode)process.exit(process.exitCode)
console.log(`\n${passed} SQL safety checks passed.`)
