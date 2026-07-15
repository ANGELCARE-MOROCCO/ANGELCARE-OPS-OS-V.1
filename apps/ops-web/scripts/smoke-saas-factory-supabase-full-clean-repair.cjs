const baseUrl=process.env.APP_BASE_URL||'http://localhost:3000'
async function j(path,init){const r=await fetch(`${baseUrl}${path}`,init);const t=await r.text();try{return JSON.parse(t)}catch{throw new Error(`${path} did not return JSON: ${t.slice(0,100)}`)}}
async function main(){
 const summary=await j('/api/saas-factory/supabase/summary')
 if(!Array.isArray(summary.resources)||summary.resources.length<8) throw new Error('Supabase resources are empty or too shallow')
 for(const op of ['connection_probe','validate_schema','rls_review','safe_migration_preview','backup_review']){
   const result=await j('/api/saas-factory/supabase/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:op,resourceKey:'saas_factory_actions_table',payload:{}})})
   if(!result.probe) throw new Error(`${op} returned no probe`)
 }
 const blocked=await j('/api/saas-factory/supabase/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'destructive_sql',resourceKey:'saas_factory_actions_table',payload:{}})})
 if(blocked.ok) throw new Error('destructive_sql should be blocked')
 console.log('Supabase full clean repair smoke passed.')
}
main().catch(e=>{console.error(e);process.exit(1)})
