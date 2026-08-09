#!/usr/bin/env node
import fs from 'node:fs'
const base=(process.env.MARKETPLACE_BASE_URL||'http://localhost:3000').replace(/\/$/,'')
const locale=process.env.MARKETPLACE_LOCALE||'fr'
const evidence={startedAt:new Date().toISOString(),base,checks:[]}
async function check(label,path,expected=[200,302,307,401,403]){try{const response=await fetch(`${base}${path}`,{redirect:'manual'});const ok=expected.includes(response.status);evidence.checks.push({label,path,status:response.status,ok});if(!ok)throw new Error(`${label}: HTTP ${response.status}`)}catch(error){evidence.checks.push({label,path,ok:false,error:error instanceof Error?error.message:String(error)});throw error}}
await check('customer registration',`/angelcare-marketplace/${locale}/auth/register`,[200])
await check('customer login',`/angelcare-marketplace/${locale}/auth/login`,[200])
await check('protected customer portal',`/angelcare-marketplace/${locale}/account`)
await check('protected Wallet',`/angelcare-marketplace/${locale}/account/wallet`)
await check('public Wallet comparison API','/api/angelcare-marketplace/wallet/comparison?normalPrice=1000',[200,400])
await check('admin Wallet protection','/api/angelcare-marketplace/admin/wallet/summary',[401,403,302,307])
await check('admin order protection','/api/angelcare-marketplace/admin/orders',[401,403,302,307])
evidence.completedAt=new Date().toISOString();evidence.ok=evidence.checks.every(x=>x.ok)
const out=process.env.MARKETPLACE_EVIDENCE_FILE||`CUSTOMER_PAYMENT_WALLET_RUNTIME_EVIDENCE_${Date.now()}.json`;fs.writeFileSync(out,JSON.stringify(evidence,null,2));console.log(out)
if(!evidence.ok)process.exit(1)
