const baseUrl=process.env.APP_BASE_URL||'http://localhost:3000'
async function j(path,init){const r=await fetch(`${baseUrl}${path}`,init); const t=await r.text(); try{return JSON.parse(t)}catch{throw new Error(`${path} did not return JSON: ${t.slice(0,100)}`)}}
async function main(){
 const summary=await j('/api/saas-factory/apis/summary')
 if(!Array.isArray(summary.endpoints)||summary.endpoints.length<5) throw new Error('API endpoints are empty')
 const probe=await j('/api/saas-factory/apis/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'probe_api',endpointKey:'saas_factory_actions_summary',payload:{}})})
 if(!probe.probe) throw new Error('probe operation returned no probe')
 const blocked=await j('/api/saas-factory/apis/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'delete_api',endpointKey:'saas_factory_actions_summary',payload:{reason:'smoke'}})})
 if(blocked.ok) throw new Error('delete_api should be blocked')
 console.log('SaaS Factory APIs smoke passed.')
}
main().catch(e=>{console.error(e);process.exit(1)})
