import fs from 'fs'; const s=fs.readFileSync('components/market-os/content-command/headquarters/ValidationWorkspace.tsx','utf8');
for(const token of ['record_human_review','authorityRole','approved','revision','blocked','preDecisionReady','Source Gate']) if(!s.includes(token)) throw new Error(`Validation decision governance missing: ${token}`);
if(s.includes('AI may approve')||s.includes('autoApprove')) throw new Error('AI authority escalation introduced');
console.log('PASS — human validation decisions remain persisted, version-aware and authority controlled');
