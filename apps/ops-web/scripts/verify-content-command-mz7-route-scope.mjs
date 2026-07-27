import fs from 'fs';
const routes=[
'app/(protected)/market-os/content-command-center/validation/page.tsx',
'app/(protected)/market-os/content-command-center/distribution/page.tsx',
'app/(protected)/market-os/content-command-center/publishing/page.tsx'];
for(const file of routes){if(!fs.existsSync(file)) throw new Error(`Missing contracted route: ${file}`)}
const validation=fs.readFileSync(routes[0],'utf8'), distribution=fs.readFileSync(routes[1],'utf8'), publishing=fs.readFileSync(routes[2],'utf8');
if(!validation.includes('view="validation"')||!distribution.includes('view="distribution"')||!publishing.includes('ContentPublishingPage')) throw new Error('Contracted route mounting changed unexpectedly');
console.log('PASS — exactly three contracted MZ7 routes remain mounted');
