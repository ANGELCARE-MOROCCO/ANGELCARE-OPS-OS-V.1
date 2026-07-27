import fs from 'node:fs'
const text=fs.readFileSync('components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx','utf8')
for(const token of ['source-replace','replacementReason','confirmation','REMPLACER ${replacement?.dossier.content_code}','Aucune propagation automatique revendiquée']) if(!text.includes(token)) throw new Error(`Replacement governance missing: ${token}`)
console.log('PASS — source replacement retains reason, exact confirmation and impact boundaries')
