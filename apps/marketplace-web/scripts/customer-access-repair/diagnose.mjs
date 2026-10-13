import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
const base=path.dirname(fileURLToPath(import.meta.url));
function envFile(filename){const found={};if(!fs.existsSync(filename))return found;for(const line of fs.readFileSync(filename,'utf8').split(/\r?\n/)){const match=line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);if(!match)continue;let value=match[2];if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);found[match[1]]=value}return found}
async function readJson(url,headers={},method='GET',body){const start=Date.now();try{const response=await fetch(url,{method,headers,body,redirect:'error',cache:'no-store',signal:AbortSignal.timeout(35000)});let data=null;try{data=await response.json()}catch{}return{http:response.status,elapsedMs:Date.now()-start,data}}catch{return{http:null,elapsedMs:Date.now()-start,error:'NETWORK_OR_TIMEOUT'}}}
async function main(){
 const repo=path.resolve(process.argv[2]||path.join(os.homedir(),'Desktop/angelcare-platform')),app=path.join(repo,'apps/marketplace-web'),home=os.homedir(),downloads=path.join(home,'Downloads'),origin='https://my.angelcarehub.com';
 if(!fs.existsSync(path.join(app,'package.json')))throw Error('Repository not found at '+app);
 const report={revision:'CUSTOMER_ACCESS_REPAIR_R4',checkedAt:new Date().toISOString(),origin,configurationChanges:false,emailsSent:0,sourceChecks:{},social:null,email:null,candidate:null,findings:[]};
 console.log('[1/4] READ DEPLOYED SOCIAL PROVIDERS');
 report.social=await readJson(origin+'/api/angelcare-marketplace/customer/auth/social/providers');
 console.log('DEPLOYED_SOCIAL='+JSON.stringify(report.social));
 const data=report.social.data?.data;if(data?.settingsAvailable){for(const provider of ['google','facebook'])if(!data.providers?.[provider])report.findings.push(provider.toUpperCase()+'_DISABLED_BY_DEPLOYED_AUTH');if(!data.profileReady)report.findings.push('SOCIAL_DATABASE_NOT_READY')}
 console.log('[2/4] READ PROTECTED EMAIL LEDGER — NO SEND');
 const local={...envFile(path.join(app,'.env')),...envFile(path.join(app,'.env.local')),...process.env};
 const envs=[{label:'Repository/process environment',values:local}];
 if(fs.existsSync(downloads))for(const name of fs.readdirSync(downloads).filter(n=>/^ANGELCARE.*(?:AUTH|EMAIL).*ENV.*\.txt$/i.test(n)).slice(0,12))envs.push({label:name,values:envFile(path.join(downloads,name))});
 report.email={inspection:'NO_WORKER_SECRET_AVAILABLE',http:null};
 for(const entry of envs){const secret=entry.values.ANGELCARE_AUTH_EMAIL_WORKER_SECRET;if(!secret||secret.length<32)continue;const result=await readJson(origin+'/api/angelcare-marketplace/customer/auth/email-worker',{authorization:'Bearer '+secret});report.email={source:entry.label,...result};if(result.http===200)break}
 console.log('EMAIL_LEDGER='+JSON.stringify(report.email));
 if(report.email.http===401)report.findings.push('WORKER_SECRET_NOT_MATCHED');
 if(report.email.http===503)report.findings.push('DEPLOYED_EMAIL_LEDGER_READ_FAILED');
 const runtime=report.email.data?.runtime;if(runtime){for(const key of ['bridgeUrlConfigured','bridgeTokenConfigured'])if(!runtime[key])report.findings.push(key.toUpperCase()+'_MISSING_IN_MARKETPLACE_RUNTIME')}
 const counts=report.email.data?.counts||{};if((counts.queued||0)+(counts.retry_wait||0)>0)report.findings.push('AUTH_EMAILS_WAITING_FOR_WORKER_OR_RETRY');if(counts.failed)report.findings.push('AUTH_EMAIL_FAILURE_CODES_REQUIRE_REVIEW');if(counts.delivery_unknown)report.findings.push('DELIVERY_ACKNOWLEDGEMENT_UNKNOWN_NO_AUTOMATIC_RESEND');
 if(local.NEXT_PUBLIC_SUPABASE_URL&&local.SUPABASE_SERVICE_ROLE_KEY){
  const authOrigin=new URL(local.NEXT_PUBLIC_SUPABASE_URL).origin,headers={apikey:local.SUPABASE_SERVICE_ROLE_KEY,authorization:'Bearer '+local.SUPABASE_SERVICE_ROLE_KEY,'content-type':'application/json'};
  const ledger=await readJson(authOrigin+'/rest/v1/rpc/angelcare_marketplace_auth_email_status',headers,'POST','{}');
  report.candidate={origin:authOrigin,deployedTargetVerified:Boolean(runtime?.authOrigin&&new URL(runtime.authOrigin).origin===authOrigin),ledger};
  if(local.NEXT_PUBLIC_SUPABASE_ANON_KEY){const settings=await readJson(authOrigin+'/auth/v1/settings',{apikey:local.NEXT_PUBLIC_SUPABASE_ANON_KEY});report.candidate.settings={http:settings.http,external:settings.data?.external||null,emailEnabled:settings.data?.external?.email===true}}
  const credential=await readJson(authOrigin+'/rest/v1/email_os_core_mailbox_credentials?select=mailbox_id,provider_profile_id,status,email_address,username&or=(email_address.eq.supports%40angelcarehub.ma,username.eq.supports%40angelcarehub.ma)&order=updated_at.desc&limit=1',headers);
  report.candidate.senderCredential={http:credential.http,found:Array.isArray(credential.data)&&credential.data.length===1,status:Array.isArray(credential.data)?credential.data[0]?.status:null};
  const identity=Array.isArray(credential.data)?credential.data[0]:null;
  if(identity?.mailbox_id){const mailbox=await readJson(authOrigin+'/rest/v1/email_os_core_mailboxes?select=status&id=eq.'+encodeURIComponent(identity.mailbox_id),headers);report.candidate.mailbox={http:mailbox.http,status:mailbox.data?.[0]?.status||null}}
  if(identity?.provider_profile_id){const profile=await readJson(authOrigin+'/rest/v1/email_os_core_provider_profiles?select=status,smtp_host,smtp_port,smtp_secure&id=eq.'+encodeURIComponent(identity.provider_profile_id),headers);report.candidate.senderTransport={http:profile.http,data:profile.data?.[0]||null}}
  console.log('LOCAL_CANDIDATE='+JSON.stringify(report.candidate));
 }
 console.log('[3/4] READ EXISTING WINDOWS / WSL AUTH CONFIGURATION');
 const native=spawnSync(process.execPath,[path.join(base,'read-runtime.cjs')],{encoding:'utf8',timeout:200000,maxBuffer:3*1024*1024});
 console.log(native.stdout||'Native inspection unavailable.');
 // The reader writes a separate report with no credentials, tokens, addresses of recipients or email bodies.
 const reports=fs.existsSync(downloads)?fs.readdirSync(downloads).filter(n=>/^ANGELCARE_CUSTOMER_ACCESS_RUNTIME_.*\.json$/.test(n)).sort():[];
 if(reports.length){const latest=JSON.parse(fs.readFileSync(path.join(downloads,reports[reports.length-1]),'utf8'));if(Date.parse(latest.checkedAt)>=Date.parse(report.checkedAt)){report.native=latest;for(const container of latest.authContainers||[]){const settings=container.settings||{};if(settings.GOTRUE_HOOK_SEND_EMAIL_ENABLED!=='true')report.findings.push('AUTH_SEND_EMAIL_HOOK_NOT_ENABLED_IN_'+container.name);if(settings.GOTRUE_EXTERNAL_GOOGLE_ENABLED!=='true')report.findings.push('GOOGLE_NOT_ENABLED_IN_'+container.name)}}}
 console.log('[4/4] SAVE REPORT');fs.mkdirSync(downloads,{recursive:true});const file=path.join(downloads,'ANGELCARE_CUSTOMER_ACCESS_DIAG_'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');fs.writeFileSync(file,JSON.stringify(report,null,2),{mode:0o600,flag:'wx'});console.log('FINDINGS='+JSON.stringify(report.findings));console.log('REPORT='+file);console.log('READ_ONLY_COMPLETE — no email, configuration change, restart, build or Git operation.');
}
main().catch(error=>{console.error('DIAGNOSTIC_STOPPED='+error.message);process.exitCode=1}).finally(()=>console.log('TERMINAL_REMAINS_OPEN'))
