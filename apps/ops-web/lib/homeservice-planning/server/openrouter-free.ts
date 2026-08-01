import { OPENROUTER_FREE_ROUTE } from '../constants'
export type FreePlanResult={responseId:string|null;actualModel:string|null;content:unknown;usage:{promptTokens:number;completionTokens:number;totalTokens:number};durationMs:number}
const base=()=>process.env.OPENROUTER_BASE_URL||'https://openrouter.ai/api/v1'
export function providerConfigured(){return Boolean(process.env.OPENROUTER_API_KEY)}
export async function composeFreePlan(args:{system:string;input:unknown;schema:Record<string,unknown>;timeoutMs?:number}):Promise<FreePlanResult>{
 const key=process.env.OPENROUTER_API_KEY; if(!key) throw new Error('OPENROUTER_NOT_CONFIGURED: aucune clé serveur disponible.')
 const started=Date.now(); const controller=new AbortController(); const timeout=setTimeout(()=>controller.abort(),args.timeoutMs||Number(process.env.HOMESERVICE_DESIGN_OPENROUTER_TIMEOUT_MS||120000))
 try{
  const response=await fetch(`${base()}/chat/completions`,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','HTTP-Referer':process.env.OPENROUTER_SITE_URL||'http://localhost:3000','X-Title':'ANGELCARE HomeService Mission Design OS'},body:JSON.stringify({model:OPENROUTER_FREE_ROUTE,messages:[{role:'system',content:args.system},{role:'user',content:JSON.stringify(args.input)}],response_format:{type:'json_schema',json_schema:{name:'homeservice_plan',strict:true,schema:args.schema}},temperature:0.2}),signal:controller.signal})
  const raw=await response.text(); if(!response.ok)throw new Error(`OPENROUTER_FREE_${response.status}: ${raw.slice(0,800)}`)
  const json=JSON.parse(raw); const content=json?.choices?.[0]?.message?.content; if(!content)throw new Error('OPENROUTER_FREE_EMPTY: aucune composition reçue.')
  return {responseId:json.id||null,actualModel:json.model||null,content:typeof content==='string'?JSON.parse(content):content,usage:{promptTokens:Number(json.usage?.prompt_tokens||0),completionTokens:Number(json.usage?.completion_tokens||0),totalTokens:Number(json.usage?.total_tokens||0)},durationMs:Date.now()-started}
 } finally {clearTimeout(timeout)}
}
