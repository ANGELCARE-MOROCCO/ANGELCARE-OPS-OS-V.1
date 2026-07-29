import fs from 'fs'
const files=['components/market-os/content-command/headquarters/DistributionWorkspace.tsx','components/market-os/content-command/content-publishing-page.tsx','lib/market-os/content-command-headquarters/publication-release-service.ts']
const s=files.map(f=>fs.readFileSync(f,'utf8')).join('\n')
for(const forbidden of ['Math.random()','fakeExternalUrl','mockPublication','simulatedProviderSuccess','autoVerifyPublication','fabricatedValidator','providerReference: `manual-']) if(s.includes(forbidden)) throw new Error(`Fabricated release behavior detected: ${forbidden}`)
for(const boundary of ['Aucun provider n’est simulé','Aucune référence externe','REAL_PROVIDER_EXECUTION_NOT_AVAILABLE','Provider non supporté — bloquant']) if(!s.includes(boundary)) throw new Error(`Honest capability boundary missing: ${boundary}`)
console.log('PASS — no provider, URL, verification, collision or authority result is fabricated')
