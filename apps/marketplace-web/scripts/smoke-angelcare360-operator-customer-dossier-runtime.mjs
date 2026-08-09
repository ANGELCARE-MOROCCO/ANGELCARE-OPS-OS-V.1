#!/usr/bin/env node
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import process from 'node:process'

const port = Number(process.env.ANGELCARE_CUSTOMER_DOSSIER_SMOKE_PORT || 3223)
const clientId = process.env.ANGELCARE_CUSTOMER_DOSSIER_CLIENT_ID || '00000000-0000-0000-0000-000000010001'
const cookie = process.env.ANGELCARE_RUNTIME_COOKIE || ''
const logFile = `.customer-dossier-runtime-${Date.now()}.log`
const log = fs.createWriteStream(logFile)
const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run','dev','--','--port',String(port)], { env:{...process.env,PORT:String(port)}, stdio:['ignore','pipe','pipe'] })
child.stdout.pipe(log); child.stderr.pipe(log)
const wait = (ms)=>new Promise((resolve)=>setTimeout(resolve,ms))
async function request(path) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, { redirect:'manual', headers: cookie ? { cookie } : {} })
  const text = await response.text()
  const valid = response.status >= 200 && response.status < 400
  console.log(`${valid?'PASS':'FAIL'} ${path} -> ${response.status}`)
  if (!valid) throw new Error(`Route ${path} returned ${response.status}: ${text.slice(0,180)}`)
}
try {
  let ready=false
  for(let i=0;i<90;i+=1){await wait(1000);try{const r=await fetch(`http://127.0.0.1:${port}/`,{redirect:'manual'});if(r.status<500){ready=true;break}}catch{}}
  if(!ready) throw new Error('Next.js development server did not become ready.')
  const sections=['overview','identity','contacts','institutions','product','commercial','finance','service','renewal','documents']
  await request(`/angelcare-360-operator/clients/${clientId}`)
  for(const section of sections) await request(`/angelcare-360-operator/clients/${clientId}?section=${section}`)
  await wait(1000)
} finally {
  child.kill('SIGTERM'); await wait(700); if(!child.killed) child.kill('SIGKILL'); log.end()
}
const contents=fs.readFileSync(logFile,'utf8')
const forbidden=[/Functions cannot be passed directly to Client Components/i,/hydration failed/i,/hydration mismatch/i,/unhandled runtime error/i,/TypeError:/i,/ReferenceError:/i]
const hits=forbidden.filter((pattern)=>pattern.test(contents))
if(hits.length){console.error(contents.slice(-5000));throw new Error(`Runtime log contains ${hits.length} forbidden error signature(s).`)}
console.log('PASS customer dossier direct routes and RSC/hydration log scan')
console.log(`Runtime log: ${logFile}`)
