const baseURL=process.env.MARKETPLACE_BASE_URL||'http://localhost:3000'
const tests=[
  ['GET','/api/angelcare-marketplace/admin/commerce/summary'],
  ['POST','/api/angelcare-marketplace/admin/activation/run'],
  ['GET','/angelcare-marketplace/admin/activation'],
]
const results=[]
for(const [method,path] of tests){const response=await fetch(baseURL+path,{method,redirect:'manual',headers:{'content-type':'application/json'},body:method==='POST'?'{}':undefined});results.push({method,path,status:response.status,location:response.headers.get('location')})}
const failures=results.filter((r)=>r.status>=200&&r.status<300)
console.log(JSON.stringify(results,null,2));if(failures.length){console.error('FAIL: Anonymous protected access succeeded.');process.exitCode=2}else console.log('PASS: Anonymous protected access was denied or redirected.')
