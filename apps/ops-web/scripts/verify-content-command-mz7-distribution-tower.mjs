import fs from 'fs'
const s=fs.readFileSync('components/market-os/content-command/headquarters/DistributionWorkspace.tsx','utf8')
for(const token of ['DISTRIBUTION TOWER · BULK 6','VALIDATED CONTENT INTAKE','GOVERNED PACKAGE BUILDER','PACKAGE REGISTER','SOURCE & AUTHORITY BOUNDARY','COLLISION & SCHEDULE RUNWAY','Publishing Operations']) if(!s.includes(token)) throw new Error(`Distribution Tower missing: ${token}`)
for(const action of ['create_publication_package','publication_save_manifest','publication_declare_ready','publication_authorize_release']) if(!s.includes(action)) throw new Error(`Package lifecycle action missing: ${action}`)
console.log('PASS — Distribution Tower contains governed intake, package engineering, preflight and release authority')
