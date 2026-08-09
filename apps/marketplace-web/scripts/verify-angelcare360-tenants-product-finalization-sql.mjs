import fs from 'node:fs'
import path from 'node:path'
const file = path.join(process.cwd(), 'supabase/migrations/20260730_angelcare360_operator_product_kernel_finalization.sql')
const sql = fs.readFileSync(file, 'utf8')
let passed=0, failed=0
const check=(condition,label)=>{console.log(`${condition?'PASS':'FAIL'}  ${label}`);condition?passed++:failed++}
for (const token of ['begin;','commit;','supersedes_id','version_code','published_at','deprecated_at','retired_at','last_reviewed_at','ac360_product_modules_key_version_uidx','ac360_product_features_key_version_uidx','ac360_product_addons_code_version_uidx','ac360_product_meters_key_version_uidx','ac360_price_books_code_version_uidx']) check(sql.toLowerCase().includes(token.toLowerCase()),`SQL contains ${token}`)
for (const table of ['product_modules','product_features','product_addons','product_meters','package_versions','price_books']) check(sql.includes(`alter table public.angelcare360_operator_${table}`),`SQL evolves ${table}`)
for (const pattern of [/\bdrop\s+table\b/i,/\btruncate\b/i,/\bdrop\s+column\b/i,/\bdelete\s+from\b/i]) check(!pattern.test(sql),`SQL excludes ${pattern}`)
let balance=0
for (const char of sql.replace(/--.*$/gm,'')) { if(char==='(') balance++; if(char===')') balance-- }
check(balance===0,'SQL parentheses balanced')
console.log(`\n${passed} SQL safety checks passed.`)
if(failed){console.error(`${failed} SQL safety failure(s).`);process.exit(1)}
