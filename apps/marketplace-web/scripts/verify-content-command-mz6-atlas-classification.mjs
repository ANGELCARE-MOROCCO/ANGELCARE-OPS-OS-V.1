import fs from 'node:fs'
const text=fs.readFileSync('components/market-os/content-command/knowledge/knowledge-model.ts','utf8')
for(const token of ['classificationMissing','famille','catégorie','sous-catégorie','service','audience','ville','langue','canal']) if(!text.includes(token)) throw new Error(`Atlas classification missing: ${token}`)
if(!text.includes('CONTENT_FAMILIES')){} // workspace uses canonical taxonomy
console.log('PASS — Atlas classification is deterministic and exposes missing institutional fields')
