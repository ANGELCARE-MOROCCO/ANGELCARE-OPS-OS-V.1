
const base=String(process.env.ANGELCARE_BASE_URL||'http://localhost:3000').replace(/\/$/,'')
for(const path of ['/angelcare-360-operator/brand-governance','/api/angelcare360/branding/current']){
  const response=await fetch(base+path,{redirect:'manual',headers:process.env.ANGELCARE_SMOKE_COOKIE?{cookie:process.env.ANGELCARE_SMOKE_COOKIE}:{}}).catch(error=>({ok:false,status:0,error}))
  if(!response || response.status===0){ console.error(`FAIL ${path} unreachable`); process.exitCode=1; continue }
  console.log(`PASS ${path} HTTP ${response.status}`)
}
if(process.exitCode)process.exit(process.exitCode)
