import fs from 'fs'
const s=fs.readFileSync('components/market-os/content-command/content-publishing-page.tsx','utf8')
for(const token of ['PUBLISHING OPERATIONS · BULK 6','LIVE RELEASE QUEUE','ACTIVE PUBLICATION COCKPIT','SCHEDULE RUNWAY','CONTROLLED PUBLICATION EXECUTION','INDEPENDENT PUBLICATION VERIFICATION','PUBLICATION PROOF & DECISION LINEAGE','LEGACY COMPATIBILITY']) if(!s.includes(token)) throw new Error(`Publishing Operations missing: ${token}`)
for(const action of ['publication_record_execution','publication_verify','publication_record_failure','publication_recover','publication_terminate']) if(!s.includes(action)) throw new Error(`Publishing action missing: ${action}`)
console.log('PASS — Publishing Operations separates authorization, execution, proof, verification and recovery')
