import fs from 'fs'; const file='components/market-os/content-command/headquarters/ValidationWorkspace.tsx'; const s=fs.readFileSync(file,'utf8');
for(const token of ['VALIDATION CHAMBER','VALIDATION INTAKE','INSTITUTIONAL CONTROL MATRIX','AI Recommendation','Human Authority Conclusion','DECISION CHAMBER','DECISION CERTIFICATE','VALIDATION TIMELINE']) if(!s.includes(token)) throw new Error(`Validation Chamber missing: ${token}`);
console.log('PASS — Validation Chamber contains intake, inspection, controls, authority, decisions, certificate and timeline');
