import fs from 'node:fs'
const text=fs.readFileSync('components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx','utf8')
for(const token of ['CANONICAL SOURCE REGISTER','MISSING SOURCE QUEUE','VERSION LINEAGE','FILE AUTHORITY MODEL','SOURCE REPLACEMENT CHAMBER','RIGHTS & RETENTION','INTEGRITY INCIDENT COMMAND','RESTORATION CHAMBER','VAULT AUDIT']) if(!text.includes(token)) throw new Error(`Source Vault contract token missing: ${token}`)
console.log('PASS — Source Vault contains canonical register, missing queue, versions, classes, replacement, rights, incidents, restoration and audit')
