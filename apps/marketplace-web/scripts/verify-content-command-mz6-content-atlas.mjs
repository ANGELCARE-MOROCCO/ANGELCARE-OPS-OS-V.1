import fs from 'node:fs'
const file='components/market-os/content-command/headquarters/DirectoryWorkspace.tsx'; const text=fs.readFileSync(file,'utf8')
for(const token of ['CONTENT ATLAS · MÉMOIRE INSTITUTIONNELLE','Atlas visuel','REGISTRE ENTERPRISE','ARBRE TAXONOMIQUE','RELATIONS & LIGNÉE','INTELLIGENCE DE RÉUTILISATION','DUPLICATES','INTÉGRITÉ & MÉMOIRE']) if(!text.includes(token)) throw new Error(`Content Atlas contract token missing: ${token}`)
console.log('PASS — Content Atlas contains search, visual atlas, register, taxonomy, relationships, reuse, duplicates and integrity')
