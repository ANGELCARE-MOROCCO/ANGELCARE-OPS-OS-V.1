/** Actual local Next rendering, with synthetic isolated services only. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),{chromium}=require('playwright');
const {sourceFingerprint,evidenceDirectory}=require('./source-fingerprint.cjs'),before=sourceFingerprint(),directory=evidenceDirectory();
const app=path.resolve(__dirname,'../..'),source=path.join(app,'angelcare-marketplace/jobkix');
require.extensions['.ts']=(module,file)=>{if(!file.startsWith(source+path.sep))throw Error('Test loader scope refused');module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);};
const {TEXT}=require(path.join(source,'i18n.ts')),{LOCALES}=require(path.join(source,'contracts.ts'));
const fixture=JSON.parse(fs.readFileSync('/private/tmp/jobkix-source-20261020/runtime/fixture-session.json'));
(async()=>{
 const browser=await chromium.launch({headless:true}),checks=[],errors=[];let failure=null;
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},extraHTTPHeaders:{'x-real-ip':'127.0.0.1'}}),page=await context.newPage();page.setDefaultNavigationTimeout(300000);page.setDefaultTimeout(60000);
  page.on('pageerror',error=>errors.push({url:page.url(),message:error.message}));page.on('console',message=>{if(message.type()==='error')errors.push({url:page.url(),message:message.text()});});
  for(const locale of LOCALES)for(const suffix of ['','/account-terms','/privacy']){
   const response=await page.goto(fixture.origin+'/jobkix/'+locale+'/legal'+suffix,{waitUntil:'networkidle'});assert.equal(response.status(),200);
   await page.waitForFunction(()=>!document.querySelector('form[inert]'));
   const actual=await page.locator('#jobkix-main').innerText();assert.equal(actual.trim(),TEXT.operatorAttribution[locale]);
   assert.equal(await page.title(),TEXT.operatorAttribution[locale]);
   assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'),TEXT.operatorAttribution[locale]);
   assert.equal(await page.locator('meta[name="description"]').getAttribute('content'),TEXT.operatorAttribution[locale]);
   assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href'),fixture.origin).pathname,'/jobkix/'+locale+'/legal');
   assert.equal(await page.locator('html').getAttribute('lang'),locale);assert.equal(await page.locator('html').getAttribute('dir'),locale==='ar'?'rtl':'ltr');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(suffix)assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/);
   checks.push({locale,suffix,status:'PASS'});console.log('LEGAL_ATTRIBUTION='+locale+suffix);
   if(!suffix&&['en','ar','hi'].includes(locale))await page.screenshot({path:path.join(directory,'P26-'+locale+'-390-attribution.png'),fullPage:true,animations:'disabled',caret:'initial'});
  }
  for(const slug of ['cookies','community','acceptable-use','fair-hiring']){
   const response=await page.goto(fixture.origin+'/jobkix/en/legal/'+slug,{waitUntil:'networkidle'});assert.equal(response.status(),200);assert.equal((await page.locator('#jobkix-main').innerText()).trim(),TEXT.operatorAttribution.en);checks.push({locale:'en',suffix:'/'+slug,status:'PASS'});
  }
  await page.setViewportSize({width:1440,height:1000});await page.goto(fixture.origin+'/jobkix/en/legal',{waitUntil:'networkidle'});await page.screenshot({path:path.join(directory,'P26-en-1440-attribution.png'),fullPage:true,animations:'disabled',caret:'initial'});
  assert.deepEqual(sourceFingerprint(),before,'Source changed during verification');assert.deepEqual(errors,[]);
 }catch(error){failure={message:error.message,stack:error.stack};throw error;}finally{
  fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'legal-attribution.json'),JSON.stringify({recordedAt:new Date().toISOString(),sourceAtStart:before,sourceAtEnd:sourceFingerprint(),checks,errors,failure,scope:'Public P26 main content and metadata, seven locales and all legacy document aliases. Original source art intentionally superseded by explicit user amendment. No worldwide compliance, policy adequacy, native-language review or hosted-service certification claimed.'},null,2)+'\n');await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
