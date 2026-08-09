import fs from 'node:fs'
const text=fs.readFileSync('components/market-os/content-command/headquarters/DirectoryWorkspace.tsx','utf8')
for(const token of ['Stratégie','Dossier','Mission / tâches','Asset','Preuve / revue','Source','Publication','Lignée partielle, jamais simulée']) if(!text.includes(token)) throw new Error(`Atlas lineage missing: ${token}`)
console.log('PASS — strategic and operational lineage remains visible and honest')
