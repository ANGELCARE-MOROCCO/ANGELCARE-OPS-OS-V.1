#!/usr/bin/env node
const http = require('http')
const https = require('https')

const base = process.env.HR_SMOKE_BASE_URL || 'http://localhost:3000'
const paths = [
  '/hr','/hr/employees','/hr/attendance','/hr/rosters','/hr/work-schedules','/hr/leave','/hr/recruitment','/hr/onboarding','/hr/training','/hr/documents','/hr/payroll','/hr/approvals','/hr/audit','/hr/system-health',
  '/api/hr/health','/api/hr/employees','/api/hr/navigation','/api/hr/live-snapshot','/api/hr/diagnostics','/api/hr/audit/recent','/api/hr/sync/diagnose','/api/hr/export'
]
function get(url){
  return new Promise((resolve)=>{
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, (res)=>{ res.resume(); res.on('end',()=>resolve({url,status:res.statusCode})) })
    req.on('error',(err)=>resolve({url,status:0,error:err.message}))
    req.setTimeout(12000,()=>{ req.destroy(); resolve({url,status:0,error:'timeout'}) })
  })
}
;(async()=>{
  const results=[]
  for(const p of paths) results.push(await get(`${base}${p}`))
  let failed=0
  for(const r of results){
    const ok = r.status >= 200 && r.status < 500
    console.log(`${ok?'✓':'✗'} ${r.status || 'ERR'} ${r.url}${r.error?' - '+r.error:''}`)
    if(!ok) failed++
  }
  if(failed){ console.error(`${failed} HR smoke check(s) failed.`); process.exit(1) }
  console.log('HR MODULE PRODUCTION SMOKE PASSED')
})()
