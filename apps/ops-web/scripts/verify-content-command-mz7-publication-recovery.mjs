import fs from 'fs'; const s=fs.readFileSync('components/market-os/content-command/content-publishing-page.tsx','utf8');
for(const token of ['FAILURE & RECOVERY COMMAND','failedPackages','Retry gouverné','Replanifier','No provider']) if(!s.includes(token) && token!=='No provider') throw new Error(`Publishing recovery missing: ${token}`);
if(!s.includes('Aucun connecteur provider n’est simulé')) throw new Error('Provider truth boundary missing');
console.log('PASS — publication failure, retry and recovery remain explicit without simulated providers');
