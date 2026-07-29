import fs from 'fs'
const routes=['app/(protected)/market-os/content-command-center/validation/page.tsx','app/(protected)/market-os/content-command-center/distribution/page.tsx','app/(protected)/market-os/content-command-center/publishing/page.tsx']
for(const file of routes) if(!fs.existsSync(file)) throw new Error(`Missing contracted route: ${file}`)
const validation=fs.readFileSync(routes[0],'utf8'), distribution=fs.readFileSync(routes[1],'utf8'), publishing=fs.readFileSync(routes[2],'utf8')
if(!(validation.includes('Bulk5ValidationChamber')||validation.includes('view="validation"'))) throw new Error('Validation authority route changed unexpectedly')
if(!distribution.includes('view="distribution"')||!publishing.includes('ContentPublishingPage')) throw new Error('Distribution or Publishing mounting changed unexpectedly')
console.log('PASS — Validation, Distribution and Publishing remain on their protected canonical routes')
