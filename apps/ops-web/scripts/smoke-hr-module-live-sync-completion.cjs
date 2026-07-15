#!/usr/bin/env node
const base = process.env.HR_SMOKE_BASE_URL || 'http://localhost:3000'
const endpoints = [
 '/api/hr/realtime/state?domain=attendance',
 '/api/hr/realtime/state?domain=rosters',
 '/api/hr/realtime/state?domain=work-schedules',
 '/api/hr/realtime/state?domain=leave',
 '/api/hr/realtime/state?domain=documents',
 '/api/hr/realtime/state?domain=training',
 '/api/hr/realtime/state?domain=recruitment',
 '/api/hr/realtime/state?domain=onboarding',
 '/api/hr/realtime/state?domain=payroll',
 '/api/hr/reports/hr-complete-export',
 '/api/hr/reports/hr-complete-export?format=csv'
]
async function main(){
  let failures=[]
  for(const ep of endpoints){
    try{
      const res = await fetch(base + ep, { cache: 'no-store' })
      const text = await res.text()
      if(!res.ok) failures.push(`${ep} -> ${res.status} ${text.slice(0,160)}`)
      else console.log('✓', ep, res.status)
    }catch(err){ failures.push(`${ep} -> ${err.message}`) }
  }
  if(failures.length){ console.error('\nHR live-sync smoke failed:'); failures.forEach(f=>console.error(' - '+f)); process.exit(1) }
  console.log('\nHR live-sync smoke passed.')
}
main()
