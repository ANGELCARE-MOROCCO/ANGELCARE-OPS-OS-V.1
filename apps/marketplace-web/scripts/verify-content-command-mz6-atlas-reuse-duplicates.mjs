import fs from 'node:fs'
const text=fs.readFileSync('components/market-os/content-command/knowledge/knowledge-model.ts','utf8')
for(const token of ['shared.length >= 3','Titre normalisé identique','Empreinte source identique','Code contenu identique']) if(!text.includes(token)) throw new Error(`Reuse/duplicate rule missing: ${token}`)
if(text.includes('Math.random')) throw new Error('Random reuse/duplicate intelligence detected')
console.log('PASS — reuse and duplicate intelligence disclose deterministic bases only')
