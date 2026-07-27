import fs from 'fs'; const s=fs.readFileSync('components/market-os/content-command/headquarters/DistributionWorkspace.tsx','utf8');
for(const token of ['DISTRIBUTION TOWER','VALIDATED CONTENT INTAKE','PACKAGE BUILDER','PACKAGE REGISTER','SOURCE, COPY & ASSET AUTHORITY','SCHEDULE RUNWAY','Publishing Operations']) if(!s.includes(token)) throw new Error(`Distribution Tower missing: ${token}`);
for(const token of ['create_publication_package','update_publication_package']) if(!s.includes(token)) throw new Error(`Existing package action missing: ${token}`);
console.log('PASS — Distribution Tower contains intake, package construction, channel control, source authority and runway');
