import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
const baseURL=process.env.MARKETPLACE_BASE_URL||'http://localhost:3000'
const output=process.env.MARKETPLACE_EVIDENCE_DIR||path.resolve(`marketplace-runtime-evidence-${Date.now()}`)
await mkdir(output,{recursive:true})
const routes=['/angelcare-marketplace/fr','/angelcare-marketplace/en','/angelcare-marketplace/ar','/angelcare-marketplace/fr/marketplace','/angelcare-marketplace/fr/marketplace/search','/angelcare-marketplace/fr/basket','/angelcare-marketplace/fr/quote-basket']
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const results=[]
for(const route of routes){const response=await page.goto(baseURL+route,{waitUntil:'networkidle'});const status=response?.status()||0;const body=(await page.locator('body').innerText()).slice(0,1000);results.push({route,status,title:await page.title(),hasServerError:/Internal Server Error|Application error|Unhandled Runtime Error/i.test(body)});await page.screenshot({path:path.join(output,route.replace(/[^a-z0-9]+/gi,'-')+'.png'),fullPage:true})}
await browser.close();await writeFile(path.join(output,'runtime-results.json'),JSON.stringify(results,null,2));const failed=results.filter(r=>r.status>=400||r.hasServerError);console.log(`Runtime routes: ${results.length}; failures: ${failed.length}`);if(failed.length)process.exitCode=2
