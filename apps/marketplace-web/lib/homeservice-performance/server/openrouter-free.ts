import { OPENROUTER_FREE_ROUTE } from '../constants'
const BASE=(process.env.OPENROUTER_BASE_URL||'https://openrouter.ai/api/v1').replace(/\/$/,'')
const KEY=process.env.OPENROUTER_API_KEY||''
function redact(value:unknown){
 const text=JSON.stringify(value??{})
 return text
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[EMAIL_REDACTED]')
  .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g,'[PHONE_REDACTED]')
  .replace(/(?:sk-|tvly-)[A-Za-z0-9_-]{10,}/g,'[SECRET_REDACTED]')
}
export async function runPerformanceAdvisory(task:string,context:unknown,schema:Record<string,unknown>){
 if(!KEY)throw Object.assign(new Error('OpenRouter Free non configuré. Aucun résultat synthétique n’a été produit.'),{status:503,code:'OPENROUTER_NOT_CONFIGURED'})
 const started=Date.now(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Number(process.env.FLASHCARDS_OS_OPENROUTER_TIMEOUT_MS||120000))
 try{
  const response=await fetch(`${BASE}/chat/completions`,{method:'POST',signal:controller.signal,headers:{
   Authorization:`Bearer ${KEY}`,'Content-Type':'application/json',
   'HTTP-Referer':process.env.OPENROUTER_SITE_URL||'http://localhost:3000',
   'X-Title':'ANGELCARE HomeService Design OS',
  },body:JSON.stringify({
   model:OPENROUTER_FREE_ROUTE,
   messages:[
    {role:'system',content:'Vous êtes un analyste consultatif AngelCare. Ne prenez aucune décision, ne jugez aucun employé, ne modifiez aucun prix et ne certifiez aucune mise en production. Répondez strictement en JSON selon le schéma.'},
    {role:'user',content:JSON.stringify({task,context:JSON.parse(redact(context))})},
   ],
   response_format:{type:'json_schema',json_schema:{name:'homeservice_performance_advisory',strict:true,schema}},
   temperature:.2,
  })})
  const raw=await response.text()
  if(!response.ok)throw Object.assign(new Error(`OpenRouter Free a échoué (${response.status}): ${raw.slice(0,500)}`),{status:502,code:'OPENROUTER_FAILURE'})
  const data=JSON.parse(raw),content=data?.choices?.[0]?.message?.content
  return{route:OPENROUTER_FREE_ROUTE,actualModel:String(data?.model||'unknown-free-model'),responseId:String(data?.id||''),usage:data?.usage||{},durationMs:Date.now()-started,output:typeof content==='string'?JSON.parse(content):content}
 }finally{clearTimeout(timer)}
}
