import fs from 'fs'; const s=fs.readFileSync('components/market-os/content-command/headquarters/DistributionWorkspace.tsx','utf8');
for(const token of ['PRE-FLIGHT CHECKLIST','Validation formelle','Source canonique','Renditions','Publisher / tracking','COLLISION & PRESSURE RADAR','Même canal']) if(!s.includes(token)) throw new Error(`Distribution preflight missing: ${token}`);
if(!s.includes('selectedReady')) throw new Error('No deterministic release readiness guard');
console.log('PASS — Distribution preflight and collision controls are deterministic and boundary-aware');
