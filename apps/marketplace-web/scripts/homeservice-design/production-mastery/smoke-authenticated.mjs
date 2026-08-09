#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const baseURL=String(process.env.SERVICE_DESIGN_SMOKE_BASE_URL||'').replace(/\/$/,'')
const storageState=String(process.env.SERVICE_DESIGN_SMOKE_STORAGE_STATE||'')
const mutate=process.env.SERVICE_DESIGN_SMOKE_MUTATE==='1'
const runProvider=process.env.SERVICE_DESIGN_SMOKE_RUN_PROVIDER==='1'
const results=[]
function record(status,name,detail=''){results.push({status,name,detail});console.log(`${status}  ${name}${detail?` — ${detail}`:''}`)}
const pass=(n,d='')=>record('PASS',n,d)
const fail=(n,d='')=>record('FAIL',n,d)
const notRun=(n,d='')=>record('NOT_RUN',n,d)

if(!baseURL||!storageState||!fs.existsSync(storageState)){
  notRun('authenticated browser launch','Set SERVICE_DESIGN_SMOKE_BASE_URL and a valid SERVICE_DESIGN_SMOKE_STORAGE_STATE file.')
  notRun('category-to-programme browser journey','Authenticated browser state unavailable.')
  notRun('targeted CSV import mutation','Authenticated browser state unavailable.')
  notRun('record-aware dynamic dossier tests','Authenticated browser state unavailable.')
  notRun('provider composition and CARELINK commit','Explicit live fixtures and opt-in flags unavailable.')
  process.exit(0)
}
let playwright
try{playwright=await import('playwright')}catch(error){notRun('authenticated browser launch','playwright is not installed in this repository.');process.exit(0)}
const browser=await playwright.chromium.launch({headless:process.env.SERVICE_DESIGN_SMOKE_HEADED!=='1'})
const context=await browser.newContext({baseURL,storageState})
const page=await context.newPage()
page.setDefaultTimeout(25_000)
async function pageCheck(name,url,assertion){try{const response=await page.goto(url,{waitUntil:'domcontentloaded'});if(!response||response.status()>=500)throw new Error(`HTTP ${response?.status()||'no response'}`);const body=(await page.locator('body').innerText()).slice(0,12000);if(/Application error|Server Component|Internal Server Error|This operation was aborted/i.test(body))throw new Error('Framework or abort error rendered');if(assertion)await assertion(page,body);pass(name,url)}catch(error){fail(name,error instanceof Error?error.message:String(error))}}

await pageCheck('Doctrine workspace opens','/carelink-ops/service-design/standards/doctrine',async(p)=>{
  const trigger=p.getByRole('button',{name:/Importer une ressource|Fermer l’import/i}).first();await trigger.waitFor();await trigger.click();await p.getByText(/Import ciblé immédiat|Prévisualiser, corriger et appliquer/i).first().waitFor({state:'visible'})
})

const categoryCode=String(process.env.SERVICE_DESIGN_SMOKE_CATEGORY_CODE||'')
if(categoryCode){await pageCheck('Category studio exposes direct composition and Action Centre',`/carelink-ops/service-design/factory/category/${encodeURIComponent(categoryCode)}`,async(p)=>{await p.getByRole('button',{name:/Enregistrer.*composer|Composer/i}).first().waitFor();await p.getByRole('button',{name:/centre des actions|Actions/i}).first().waitFor()})}else notRun('category-to-programme browser journey','Set SERVICE_DESIGN_SMOKE_CATEGORY_CODE.')

const fixtures=[
  ['planning_request','SERVICE_DESIGN_SMOKE_PLANNING_REQUEST_ID','planning/requests'],
  ['planning_plan','SERVICE_DESIGN_SMOKE_PLAN_ID','planning/plans'],
  ['commercial_request','SERVICE_DESIGN_SMOKE_COMMERCIAL_REQUEST_ID','offers/requests'],
  ['commercial_scenario','SERVICE_DESIGN_SMOKE_COMMERCIAL_SCENARIO_ID','offers/scenarios'],
  ['bundle','SERVICE_DESIGN_SMOKE_BUNDLE_ID','bundles'],
  ['sellable','SERVICE_DESIGN_SMOKE_SELLABLE_ID','vitrine'],
  ['handoff','SERVICE_DESIGN_SMOKE_HANDOFF_ID','handoffs'],
  ['customer_case','SERVICE_DESIGN_SMOKE_CASE_ID','customer-experience/cases'],
  ['incident','SERVICE_DESIGN_SMOKE_INCIDENT_ID','operations/incidents'],
  ['quality_signal','SERVICE_DESIGN_SMOKE_QUALITY_SIGNAL_ID','quality/signals'],
  ['improvement','SERVICE_DESIGN_SMOKE_IMPROVEMENT_ID','quality/improvements'],
]
for(const [domain,envName,route] of fixtures){const id=String(process.env[envName]||'');if(!id){notRun(`exact ${domain} dossier`,`${envName} not supplied`);continue}await pageCheck(`exact ${domain} dossier`,`/carelink-ops/service-design/${route}/${encodeURIComponent(id)}`,async(p)=>{const payload=await p.evaluate(async({domain,id})=>{const r=await fetch(`/api/carelink-ops/service-design/mastery/${domain}/${encodeURIComponent(id)}`);return {status:r.status,json:await r.json().catch(()=>({}))}},{domain,id});if(payload.status!==200||!payload.json?.ok||String(payload.json?.data?.record?.id)!==id)throw new Error(`Exact record API mismatch (${payload.status})`)})}

const csvFixture=String(process.env.SERVICE_DESIGN_SMOKE_CSV_FIXTURE||'')
if(mutate&&categoryCode&&csvFixture&&fs.existsSync(csvFixture)){
  await pageCheck('targeted CSV import can select a real file',`/carelink-ops/service-design/factory/import?category=${encodeURIComponent(categoryCode)}&type=doctrine`,async(p)=>{
    const input=p.locator('input[type=file]').first();await input.setInputFiles(csvFixture);await p.getByText(/Prévisualiser|lignes|appliquer/i).first().waitFor({state:'visible'})
    if(process.env.SERVICE_DESIGN_SMOKE_APPLY_IMPORT==='1'){const apply=p.getByRole('button',{name:/Appliquer|Importer/i}).last();await apply.click();await p.getByText(/terminé|appliqué|succès/i).first().waitFor({state:'visible',timeout:45_000})}
  })
}else notRun('targeted CSV import mutation','Set MUTATE=1, CATEGORY_CODE and CSV_FIXTURE; APPLY_IMPORT=1 is required to commit rows.')

const planningRequestId=String(process.env.SERVICE_DESIGN_SMOKE_PLANNING_REQUEST_ID||'')
if(mutate&&planningRequestId){
  try{
    const serviceDate=String(process.env.SERVICE_DESIGN_SMOKE_TEST_DATE||new Date(Date.now()+86400000*30).toISOString().slice(0,10))
    const result=await page.evaluate(async({id,serviceDate})=>{const add=await fetch(`/api/carelink-ops/service-design/mastery/planning_request/${id}/action`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'add_date',serviceDate,startTime:'09:00',endTime:'10:30'})});const a=await add.json();if(!add.ok||!a.ok)return {error:a.error||add.status};const dateId=a.data?.date?.id;const remove=await fetch(`/api/carelink-ops/service-design/mastery/planning_request/${id}/action`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'remove_date',dateId})});const b=await remove.json();return {add:add.status,remove:remove.status,ok:remove.ok&&b.ok}}, {id:planningRequestId,serviceDate})
    if(result.ok)pass('planning add/remove date database mutation','created and cleaned test date')
    else fail('planning add/remove date database mutation',String(result.error||JSON.stringify(result)))
  }catch(error){fail('planning add/remove date database mutation',error instanceof Error?error.message:String(error))}
}else notRun('planning add/remove date database mutation','Set MUTATE=1 and PLANNING_REQUEST_ID.')

if(runProvider&&planningRequestId){
  try{const result=await page.evaluate(async(id)=>{const r=await fetch(`/api/carelink-ops/service-design/planning/requests/${id}/generate`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scenarioCount:1})});return {status:r.status,json:await r.json().catch(()=>({}))}},planningRequestId);if(result.status<300&&result.json?.ok)pass('live OpenRouter composition','one proposal persisted');else fail('live OpenRouter composition',result.json?.error||`HTTP ${result.status}`)}catch(error){fail('live OpenRouter composition',error instanceof Error?error.message:String(error))}
}else notRun('live OpenRouter composition','Set RUN_PROVIDER=1 and PLANNING_REQUEST_ID.')

notRun('irreversible CARELINK commit','Deliberately not executed automatically. Run only with a disposable controlled handoff and explicit operator confirmation.')

await browser.close()
const reportPath=process.env.SERVICE_DESIGN_SMOKE_REPORT||path.resolve(process.cwd(),'service-design-production-mastery-smoke.json')
fs.writeFileSync(reportPath,JSON.stringify({generatedAt:new Date().toISOString(),baseURL,mutate,runProvider,results},null,2))
const failed=results.filter((item)=>item.status==='FAIL')
console.log(`\nSmoke result: ${results.filter((item)=>item.status==='PASS').length} PASS · ${failed.length} FAIL · ${results.filter((item)=>item.status==='NOT_RUN').length} NOT_RUN`)
console.log(`Report: ${reportPath}`)
if(failed.length)process.exit(1)
