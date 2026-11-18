#!/usr/bin/env node
/**
 * AngelCare R4 public opt-in push sender (isolated from Marketplace).
 * Data-only FCM topic message, stored in native inbox on delivery.
 * Defaults to DRY RUN; actual send requires two explicit flags and OFF-REPO service key.
 * No Firebase console config, key, or customer data is committed to git.
 */
import { readFileSync } from 'node:fs';
import { createSign, randomUUID } from 'node:crypto';
import process from 'node:process';

const arg=(name, fallback='')=>{let i=process.argv.indexOf('--'+name);return i!==-1?process.argv[i+1]??'':fallback;};
const has=name=>process.argv.includes('--'+name);
const fail=message=>{console.error('STOP: '+message);process.exit(1);};
const validText=(s,max)=>typeof s==='string'&&s.trim()&&s.trim().length<=max&&!/[\u0000-\u001f]/.test(s);
const title=arg('title');const body=arg('body');const kind=arg('kind','announcement');
const url=arg('url','https://my.angelcarehub.com/angelcare-marketplace/fr');
if(!validText(title,100)||!validText(body,240))fail('title (<=100) and body (<=240) are mandatory public non-sensitive text');
if(!['announcement','offer','activity'].includes(kind))fail('kind must be announcement, offer or activity');
let link;
try{
 link=new URL(url);
 if(link.protocol!=='https:'||link.host!=='my.angelcarehub.com'||
   !(link.pathname==='/angelcare-marketplace'||link.pathname.startsWith('/angelcare-marketplace/')) ||
   link.username||link.password||link.hash||link.pathname.includes('..')||
   /%2f|%5c/i.test(url))fail('untrusted target URL');
}catch{fail('target_url must be an approved https AngelCare Marketplace URL');}
const payload={message:{topic:'angelcare_public_updates',android:{priority:'HIGH'},
  data:{kind,title:title.trim(),body:body.trim(),url:link.toString()}}};
console.log('ANGELCARE_R4_PUBLIC_FCM_PAYLOAD_VALID=PASS');
console.log('TARGET_TOPIC=angelcare_public_updates');
console.log('TITLE='+title);console.log('TYPE='+kind);console.log('URL='+link.toString());
if(!has('send')){console.log('FCM_DELIVERY=DRY_RUN_ONLY (no credentials read, no message sent)');process.exit(0);}
if(!has('confirm-public-broadcast'))fail('send requires --confirm-public-broadcast');
const keyPath=process.env.ANGELCARE_FCM_SERVICE_ACCOUNT_FILE||'';
if(!keyPath)fail('ANGELCARE_FCM_SERVICE_ACCOUNT_FILE required for authorized sending');
let key;try{key=JSON.parse(readFileSync(keyPath,'utf8'));}catch{fail('unable to read private service account JSON file');}
if(!key.private_key||!key.client_email||!key.project_id||key.type!=='service_account')fail('invalid Google service account');
const expected=process.env.ANGELCARE_FCM_PROJECT_ID||'';
if(!expected || expected!==key.project_id)fail('expected Firebase project ID missing or mismatched');
const timestamp=Math.floor(Date.now()/1000),base64url=ob=>Buffer.from(JSON.stringify(ob)).toString('base64url');
const header=base64url({alg:'RS256',typ:'JWT'});
const claims=base64url({iss:key.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',
    aud:'https://oauth2.googleapis.com/token',iat:timestamp,exp:timestamp+3300});
const unsigned=header+'.'+claims;
const sign=createSign('RSA-SHA256');sign.update(unsigned);sign.end();
const jwt=unsigned+'.'+sign.sign(key.private_key).toString('base64url');
const tokenRequest=new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt});
const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{
 method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:tokenRequest,signal:AbortSignal.timeout(15000)});
if(!tokenResponse.ok)fail('Google OAuth authorization refused (HTTP '+tokenResponse.status+')');
const token=await tokenResponse.json();if(!token.access_token)fail('OAuth token missing');
const response=await fetch('https://fcm.googleapis.com/v1/projects/'+encodeURIComponent(expected)+'/messages:send',{
 method:'POST',headers:{Authorization:'Bearer '+token.access_token,'content-type':'application/json'},
 body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
if(!response.ok)fail('FCM rejected broadcast (HTTP '+response.status+'); check Firebase project / topic enrollment');
const responseBody=await response.json();
if(!responseBody.name)fail('FCM did not return a message identifier');
console.log('FCM_PUBLIC_BROADCAST_ACCEPTED=YES');
console.log('MESSAGE_ID='+responseBody.name);
console.log('DELIVERY_PER_DEVICE=NOT_GUARANTEED; VERIFY_ON_REAL_OPTED_IN_ANDROID_DEVICE');
