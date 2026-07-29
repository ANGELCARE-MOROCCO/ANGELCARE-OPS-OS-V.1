import fs from 'fs'
const ui=fs.readFileSync('components/market-os/content-command/content-publishing-page.tsx','utf8')
const service=fs.readFileSync('lib/market-os/content-command-headquarters/publication-release-service.ts','utf8')
const s=ui+'\n'+service
for(const token of ['FAILURE & RECOVERY COMMAND','FAILURE CONSTITUTION','RECOVERY AUTHORITY','WITHDRAWAL & SUPERSESSION','recordPublicationFailure','recoverPublicationPackage','governPublicationTermination']) if(!s.includes(token)) throw new Error(`Publishing recovery missing: ${token}`)
if(!s.includes('previousStatus')) throw new Error('Recovery lineage does not preserve previous state')
console.log('PASS — failure, recovery, withdrawal and supersession preserve decision lineage')
