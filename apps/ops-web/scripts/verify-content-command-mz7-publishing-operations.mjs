import fs from 'fs'; const s=fs.readFileSync('components/market-os/content-command/content-publishing-page.tsx','utf8');
for(const token of ['PUBLISHING OPERATIONS','RELEASE QUEUE','ACTIVE PUBLICATION CONTROL','SCHEDULE RUNWAY','MANUAL PUBLICATION CONFIRMATION','PUBLICATION EVIDENCE & HISTORY','LEGACY COMPATIBILITY']) if(!s.includes(token)) throw new Error(`Publishing Operations missing: ${token}`);
console.log('PASS — Publishing Operations contains release queue, schedule, manual proof, verification boundaries and history');
