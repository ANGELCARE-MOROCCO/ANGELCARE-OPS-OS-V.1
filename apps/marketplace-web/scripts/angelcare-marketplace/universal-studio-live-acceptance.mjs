import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const base=(process.env.MARKETPLACE_BASE_URL||'').replace(/\/$/,'')
const publicPath=process.env.MARKETPLACE_PUBLIC_PATH||''
const pageId=process.env.MARKETPLACE_STUDIO_PAGE_ID||''
const storage=process.env.MARKETPLACE_STORAGE_STATE||''
const out=process.env.MARKETPLACE_ACCEPTANCE_DIR||path.resolve('artifacts/universal-studio-acceptance')
if(!base||!publicPath){console.error('REQUIRED: MARKETPLACE_BASE_URL + MARKETPLACE_PUBLIC_PATH');process.exitCode=2}else{
  fs.mkdirSync(out,{recursive:true})
  const browser=await chromium.launch({headless:true})
  const context=await browser.newContext(storage&&fs.existsSync(storage)?{storageState:storage}:{})
  const consoleErrors=[]
  const page=await context.newPage()
  page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text())})
  page.on('pageerror',error=>consoleErrors.push(error.message))
  const result={base,publicPath,pageId,public:{status:0,url:'',screenshot:''},studio:null,consoleErrors,hydrationErrors:[],pass:false}
  const publicResponse=await page.goto(`${base}${publicPath.startsWith('/')?publicPath:`/${publicPath}`}`,{waitUntil:'networkidle'})
  result.public.status=publicResponse?.status()||0;result.public.url=page.url();result.public.screenshot=path.join(out,'public.png');await page.screenshot({path:result.public.screenshot,fullPage:true})
  if(pageId){const studio=await context.newPage();studio.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(`[studio] ${msg.text()}`)});studio.on('pageerror',error=>consoleErrors.push(`[studio] ${error.message}`));const response=await studio.goto(`${base}/angelcare-marketplace/admin/experience/studio/${pageId}`,{waitUntil:'networkidle'});const screenshot=path.join(out,'studio.png');await studio.screenshot({path:screenshot,fullPage:true});result.studio={status:response?.status()||0,url:studio.url(),screenshot,title:await studio.title()}}
  result.hydrationErrors=consoleErrors.filter(value=>/hydration|hydrated|server.*client|did not match/i.test(value))
  result.pass=result.public.status>=200&&result.public.status<400&&result.hydrationErrors.length===0
  fs.writeFileSync(path.join(out,'acceptance.json'),JSON.stringify(result,null,2)+'\n')
  console.log(JSON.stringify(result,null,2))
  await browser.close()
  if(!result.pass)process.exitCode=1
}
