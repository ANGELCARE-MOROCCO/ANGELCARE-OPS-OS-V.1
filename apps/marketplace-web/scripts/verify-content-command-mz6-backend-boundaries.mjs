import fs from 'node:fs'
const manifest=fs.readFileSync('MZ6_PATCH_FILE_LIST.txt','utf8').trim().split(/\r?\n/).filter(Boolean)
for(const file of manifest){if(file.includes('/app/api/')||file.includes('supabase')||file.includes('migration')||file.endsWith('.sql')) throw new Error(`Backend/database scope violation: ${file}`)}
const vault=fs.readFileSync('components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx','utf8')
for(const endpoint of ['/api/market-os/content-command-headquarters/source-replace','/api/market-os/content-command-headquarters/source-upload?mode=source']) if(!vault.includes(endpoint)) throw new Error(`Existing source endpoint not preserved: ${endpoint}`)
console.log('PASS — MZ6 introduces no API, database, Supabase or migration architecture and preserves source workflows')
