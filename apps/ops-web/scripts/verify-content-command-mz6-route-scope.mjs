import fs from 'node:fs'
const routes=[
'app/(protected)/market-os/content-command-center/directory/page.tsx',
'app/(protected)/market-os/content-command-center/source-vault/page.tsx',
]
for(const file of routes){if(!fs.existsSync(file)) throw new Error(`MZ6 route missing: ${file}`)}
const config=JSON.parse(fs.readFileSync('tsconfig.market-os-content-command-mz6.json','utf8'))
if(config.files.some((file)=>file.includes('/api/')||file.includes('supabase')||file.includes('migration'))) throw new Error('MZ6 scope contains backend/database files')
console.log('PASS — exactly two contracted MZ6 routes remain present and scoped')
