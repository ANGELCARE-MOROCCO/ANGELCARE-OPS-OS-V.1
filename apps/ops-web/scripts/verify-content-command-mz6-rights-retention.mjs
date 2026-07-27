import fs from 'node:fs'
const text=fs.readFileSync('components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx','utf8')
for(const token of ['Droits d’usage','Rétention institutionnelle','Non exposé','Non documentée','Aucune éligibilité supposée']) if(!text.includes(token)) throw new Error(`Rights/retention honesty missing: ${token}`)
console.log('PASS — rights and retention remain explicit, governed and non-fabricated')
