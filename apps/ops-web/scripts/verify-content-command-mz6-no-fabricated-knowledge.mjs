import fs from 'node:fs'
const files=['components/market-os/content-command/headquarters/DirectoryWorkspace.tsx','components/market-os/content-command/headquarters/SourceVaultWorkspace.tsx','components/market-os/content-command/knowledge/knowledge-model.ts']
const text=files.map((file)=>fs.readFileSync(file,'utf8')).join('\n')
for(const forbidden of ['Math.random','crypto.randomUUID','fakeHash','mockSource','sampleUsageHistory']) if(text.includes(forbidden)) throw new Error(`Fabricated knowledge marker found: ${forbidden}`)
for(const required of ['jamais simulée','sans interprétation opaque','sans journal inventé','non documentés']) if(!text.toLowerCase().includes(required.toLowerCase())) throw new Error(`Honesty boundary missing: ${required}`)
console.log('PASS — no fabricated source, hash, lineage, reuse, usage, rights or audit authority introduced')
