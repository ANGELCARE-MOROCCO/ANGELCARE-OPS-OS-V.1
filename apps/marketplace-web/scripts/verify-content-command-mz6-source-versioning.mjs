import fs from 'node:fs'
const model=fs.readFileSync('components/market-os/content-command/knowledge/knowledge-model.ts','utf8')
const vault=fs.readFileSync('components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx','utf8')
for(const token of ['sourceVersions','source_version','is_current','historicalSources']) if(!model.includes(token)) throw new Error(`Source version model missing: ${token}`)
for(const token of ['Courante','Historique','v{source.version}']) if(!vault.includes(token)) throw new Error(`Source version UI missing: ${token}`)
console.log('PASS — current and historical source versions remain distinguishable')
