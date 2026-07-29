import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args=Object.fromEntries(process.argv.slice(2).map((arg,index,array)=>arg.startsWith("--")?[arg.slice(2),array[index+1]&&!array[index+1].startsWith("--")?array[index+1]:true]:null).filter(Boolean));
const baseUrl=String(args["base-url"]||process.env.AC_CAPITAL_API_ROOT||"http://localhost:3000").replace(/\/$/,"");
const storageState=String(args["storage-state"]||process.env.AC_CAPITAL_STORAGE_STATE||"");
const persist=args.persist===true||args.persist==="true";
const evidenceDir=path.resolve(String(args["evidence-dir"]||"AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION/evidence/browser"));
fs.mkdirSync(evidenceDir,{recursive:true});
let chromium;
try{({chromium}=await import("playwright"))}catch{try{({chromium}=await import("@playwright/test"))}catch{console.error("BLOCKED: Playwright is not installed. Install project dependencies or run the repository's existing browser toolchain.");process.exit(2)}}

const plans=[
 ["/ac-capital-os","New Capital Mission","Radar"], ["/ac-capital-os/radar","Create Opportunity","Women"], ["/ac-capital-os/qualification","Create Dossier","Bank"],
 ["/ac-capital-os/funders","Create Funder","Bank"], ["/ac-capital-os/doctrine","Create Doctrine","Bank"], ["/ac-capital-os/cases","Create Case","case"],
 ["/ac-capital-os/data-room","Upload Document","document"], ["/ac-capital-os/pipeline","Create Deal","deal"], ["/ac-capital-os/coordinator","Create Mission","mission"],
 ["/ac-capital-os/ai-command","Run Dry Test","Agent"], ["/ac-capital-os/strategy","Create Scenario","scenario"], ["/ac-capital-os/simulator","Save Snapshot","scenario"],
 ["/ac-capital-os/reports","Generate Report","report"], ["/ac-capital-os/manual","Open SOP","SOP"], ["/ac-capital-os/approvals","Create Approval","approval"],
 ["/ac-capital-os/learning","Capture Learning","learning"], ["/ac-capital-os/settings","Request Setting Change","setting"], ["/ac-capital-os/production","Create Blocker","blocker"],
];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1100},storageState:storageState||undefined,reducedMotion:"reduce"});
const results=[];
for(const [route,primaryText,entityHint] of plans){
 const page=await context.newPage();const consoleErrors=[];page.on("console",message=>{if(message.type()==="error")consoleErrors.push(message.text())});page.on("pageerror",error=>consoleErrors.push(error.message));
 let responseStatus=null,pageLoaded=false,apiResolved=false,primaryActionTested=false,modalTested=false,drawerTested=false,keyboardTested=false,responsiveTested=false,status="PARTIAL",notes=[];
 try{
  const response=await page.goto(baseUrl+route,{waitUntil:"networkidle",timeout:45000});responseStatus=response?.status()||null;
  const current=page.url();if(/sign-in|login|auth/i.test(current)&&!current.includes(route)){notes.push("Authentication redirect blocked page acceptance; provide --storage-state.");status="BLOCKED"}else{
   pageLoaded=responseStatus!==404&&await page.locator("main").count()>0;
   apiResolved=!(await page.getByText(/Workspace request failed/i).count())&&!(await page.getByText(/Request failed \(/i).count());
   const primary=page.getByRole("button",{name:new RegExp(primaryText,"i")}).first();
   if(await primary.count()){await primary.click();primaryActionTested=true;modalTested=await page.locator('[role="dialog"]').count()>0;if(modalTested){await page.keyboard.press("Escape");await page.waitForTimeout(250);keyboardTested=await page.locator('[role="dialog"]').count()===0}}
   const candidates=page.locator("main button").filter({hasText:new RegExp(entityHint,"i")});
   if(await candidates.count()){await candidates.first().click();drawerTested=await page.locator('aside[role="dialog"]').count()>0;if(drawerTested){await page.keyboard.press("Escape");await page.waitForTimeout(200)}}
   await page.setViewportSize({width:768,height:1024});await page.waitForTimeout(150);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+8);responsiveTested=!overflow;await page.setViewportSize({width:1440,height:1100});
   status=pageLoaded&&apiResolved&&primaryActionTested&&modalTested&&keyboardTested&&responsiveTested&&consoleErrors.length===0?"PASS":"PARTIAL";
  }
  const file=`${route==="/ac-capital-os"?"00-command-floor":route.split("/").pop()}.png`;const screenshotPath=path.join(evidenceDir,file);await page.screenshot({path:screenshotPath,fullPage:true});
  const record={route,status,responseStatus,pageLoaded,apiResolved,primaryActionTested,modalTested,drawerTested,keyboardTested,responsiveTested,consoleErrors,notes:notes.join(" "),screenshotPath};results.push(record);
  if(persist&&!/sign-in|login|auth/i.test(page.url())){await page.evaluate(async record=>{await fetch("/api/ac-capital-os/browser-acceptance",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({...record,primaryApiState:record.apiResolved?"resolved":"failed",primaryActionState:record.primaryActionTested?"tested":"not-tested",drawerState:record.drawerTested?"tested":"not-tested",keyboardState:record.keyboardTested?"tested":"not-tested",responsiveState:record.responsiveTested?"tested":"failed",evidence:{browser:"playwright",viewport:"1440x1100"}})});},record)}
 }catch(error){const screenshotPath=path.join(evidenceDir,`${route.split("/").pop()||"command-floor"}-error.png`);try{await page.screenshot({path:screenshotPath,fullPage:true})}catch{}results.push({route,status:"BLOCKED",responseStatus,pageLoaded:false,apiResolved:false,primaryActionTested:false,modalTested:false,drawerTested:false,keyboardTested:false,responsiveTested:false,consoleErrors:[...consoleErrors,String(error)],notes:"Browser execution failed.",screenshotPath})}
 await page.close();
}
await browser.close();
const jsonPath=path.join(evidenceDir,"MZ15_BROWSER_ACCEPTANCE_RESULTS.json");fs.writeFileSync(jsonPath,JSON.stringify({baseUrl,generatedAt:new Date().toISOString(),results},null,2));
const md=["# MZ15 Browser Acceptance Results","",`Base URL: ${baseUrl}`,`Generated: ${new Date().toISOString()}`,"","| Route | Status | HTTP | API | Action | Modal | Drawer | Keyboard | Responsive | Console errors |","|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",...results.map(r=>`| ${r.route} | ${r.status} | ${r.responseStatus??"—"} | ${r.apiResolved?"PASS":"NO"} | ${r.primaryActionTested?"PASS":"NO"} | ${r.modalTested?"PASS":"NO"} | ${r.drawerTested?"PASS":"NO"} | ${r.keyboardTested?"PASS":"NO"} | ${r.responsiveTested?"PASS":"NO"} | ${r.consoleErrors.length} |`),"","A PASS is browser evidence only. It does not replace SQL migration, server authorization, external storage/provider configuration or repository TypeScript acceptance."];
fs.writeFileSync(path.join(evidenceDir,"MZ15_BROWSER_ACCEPTANCE_RESULTS.md"),md.join("\n"));
console.log(`Browser acceptance complete: ${results.filter(r=>r.status==="PASS").length}/${results.length} PASS`);console.log(jsonPath);if(results.some(r=>r.status!=="PASS"))process.exitCode=1;
