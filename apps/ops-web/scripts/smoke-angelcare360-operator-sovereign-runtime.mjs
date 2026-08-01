#!/usr/bin/env node
import fs from 'node:fs'
import http from 'node:http'
import { spawn } from 'node:child_process'

const port = Number(process.env.ANGELCARE_SMOKE_PORT || 3219)
const nextBin = new URL('../node_modules/next/dist/bin/next', import.meta.url).pathname
if (!fs.existsSync(nextBin)) {
  console.error('RUNTIME GATE NOT RUN: node_modules/next is unavailable. Install dependencies in ops-web, then rerun this script.')
  process.exit(2)
}
const routes = ['','/direction','/growth','/tenants-product','/revenue','/service','/platform','/clients','/tenants','/support']
const logs = []
const child = spawn(process.execPath,[nextBin,'dev','--hostname','127.0.0.1','--port',String(port)],{cwd:process.cwd(),env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']})
child.stdout.on('data',(chunk)=>logs.push(String(chunk)))
child.stderr.on('data',(chunk)=>logs.push(String(chunk)))
const wait = (ms) => new Promise((resolve)=>setTimeout(resolve,ms))
async function request(route) {
  return new Promise((resolve,reject)=>{
    const req=http.get({hostname:'127.0.0.1',port,path:`/angelcare-360-operator${route}`,timeout:15000},(res)=>{res.resume();res.on('end',()=>resolve(res.statusCode||0))})
    req.on('timeout',()=>req.destroy(new Error('timeout'))); req.on('error',reject)
  })
}
try {
  let ready=false
  for(let i=0;i<90;i+=1){await wait(1000);const joined=logs.join('');if(/Ready in|Local:|started server/i.test(joined)){ready=true;break}if(child.exitCode!==null)break}
  if(!ready) throw new Error(`Next development server did not become ready.\n${logs.join('').slice(-6000)}`)
  for(const route of routes){const status=await request(route);if(status<200||status>=500)throw new Error(`${route||'/'} returned ${status}`);console.log(`PASS ${route||'/'} -> ${status}`)}
  await wait(1500)
  const output=logs.join('')
  const forbidden=[/Functions cannot be passed directly to Client Components/i,/Hydration failed/i,/hydration mismatch/i,/Unhandled Runtime Error/i,/Cannot update a component while rendering/i]
  for(const pattern of forbidden) if(pattern.test(output)) throw new Error(`Runtime log contains ${pattern}:\n${output.slice(-6000)}`)
  console.log('PASS runtime route crawl and RSC/hydration log scan')
} finally { child.kill('SIGTERM') }
