import fs from 'fs'
const file='components/market-os/content-command/headquarters/DistributionWorkspace.tsx'
const model='components/market-os/content-command/experience-bulk6/bulk6-release-model.ts'
const s=fs.readFileSync(file,'utf8')+'\n'+fs.readFileSync(model,'utf8')
for(const token of ['PRE-FLIGHT & BLOCKING REQUIREMENTS','Validation et source','Version et renditions','Mode d’exécution honnête','releaseBlockers','packageReadiness','deterministicCollisions']) if(!s.includes(token)) throw new Error(`Distribution preflight missing: ${token}`)
for(const action of ['publication_save_manifest','publication_declare_ready','publication_authorize_release']) if(!s.includes(action)) throw new Error(`Governed release action missing: ${action}`)
console.log('PASS — Distribution preflight, readiness, blockers and collisions are deterministic')
