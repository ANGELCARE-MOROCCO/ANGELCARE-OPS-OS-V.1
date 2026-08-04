import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
const baseURL=process.env.MARKETPLACE_BASE_URL||'http://localhost:3000'
const output=process.env.MARKETPLACE_VISUAL_OUTPUT||path.resolve(`marketplace-visual-evidence-${Date.now()}`)
await mkdir(output,{recursive:true})
const surfaces=['','/marketplace','/basket','/quote-basket']
const viewports=[['desktop',1440,1100],['tablet',900,1100],['mobile',390,844]]
const browser=await chromium.launch({headless:true});const evidence=[]
for(const locale of ['fr','en','ar'])for(const [name,width,height] of viewports){const page=await browser.newPage({viewport:{width,height}});for(const surface of surfaces){const route=`/angelcare-marketplace/${locale}${surface}`;const response=await page.goto(baseURL+route,{waitUntil:'networkidle'});const file=`${locale}-${name}-${surface||'home'}`.replace(/[^a-z0-9-]+/gi,'-')+'.png';await page.screenshot({path:path.join(output,file),fullPage:true});evidence.push({route,viewport:name,status:response?.status()||0,file,dir:await page.locator('html').getAttribute('dir')})}await page.close()}
await browser.close();await writeFile(path.join(output,'visual-evidence.json'),JSON.stringify(evidence,null,2));const failed=evidence.filter(e=>e.status>=400||(e.route.includes('/ar')&&e.dir!=='rtl'));console.log(`Visual captures: ${evidence.length}; failures: ${failed.length}`);if(failed.length)process.exitCode=2
