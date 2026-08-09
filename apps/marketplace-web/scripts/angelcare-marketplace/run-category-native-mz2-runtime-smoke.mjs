import fs from 'node:fs'
const base=(process.env.MARKETPLACE_BASE_URL||'http://localhost:3000').replace(/\/$/,'')
const locale=process.env.MARKETPLACE_LOCALE||'fr'
const slug=process.env.MARKETPLACE_ITEM_SLUG||''
const routes=[`/angelcare-marketplace/${locale}/marketplace/category-native`,`/angelcare-marketplace/${locale}/marketplace/compare`]
if(slug)routes.push(`/angelcare-marketplace/${locale}/experience/${encodeURIComponent(slug)}`)
const evidence=[]
for(const route of routes){const started=Date.now();try{const response=await fetch(base+route,{redirect:'manual'});evidence.push({route,status:response.status,duration_ms:Date.now()-started,location:response.headers.get('location')})}catch(error){evidence.push({route,status:0,duration_ms:Date.now()-started,error:String(error)})}}
const output={generated_at:new Date().toISOString(),base_url:base,locale,slug:slug||null,evidence}
const file=process.env.MARKETPLACE_EVIDENCE_FILE||'CATEGORY_NATIVE_MZ2_RUNTIME_EVIDENCE.json'
fs.writeFileSync(file,JSON.stringify(output,null,2)+'\n')
console.log(JSON.stringify(output,null,2))
if(evidence.some((entry)=>entry.status===0||entry.status>=500))process.exit(1)
