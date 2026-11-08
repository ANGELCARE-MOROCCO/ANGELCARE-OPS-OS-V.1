import { NextResponse } from 'next/server'
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { access } from '@/angelcare-marketplace/seo-power/repository'
import { googleOverview, inspectGoogleUrl, inspectionHistory, googleDiagnostics, GoogleIntelligenceError } from '@/angelcare-marketplace/seo-power/google-intelligence/server'
import { nativeInventory } from '@/angelcare-marketplace/seo-power/google-intelligence/native'

export const runtime='nodejs'
export const dynamic='force-dynamic'
export const maxDuration=55

function json(value:unknown,status=200){return NextResponse.json(value,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})}
function errorReply(err:unknown){
  const status=typeof (err as {status?:unknown})?.status==='number'?Number((err as {status:number}).status):503
  const v=err instanceof GoogleIntelligenceError?err:status===401?new GoogleIntelligenceError('AUTH_REQUIRED','Authentication required.',401):status===403?new GoogleIntelligenceError('PERMISSION_DENIED','SEO Power permission required.',403):new GoogleIntelligenceError('REQUEST_UNAVAILABLE','Google Intelligence operation was not confirmed.',503)
  return json({error:{code:v.code,message:v.message}},v.status)
}
async function authorize(){
  const ctx=await requireMarketplaceApiContext('marketplace.web_presence.view')
  const rights=access(ctx)
  if(!rights.view)throw new GoogleIntelligenceError('GLOBAL_ACCESS_REQUIRED','Global SEO read permission is required.',403)
  return rights
}
export async function GET(request:Request){
  try{
    await authorize()
    const u=new URL(request.url),view=u.searchParams.get('view')||'overview'
    switch(view){
      case 'overview':return json({data:await googleOverview(u.searchParams.get('refresh')==='1')})
      case 'native':return json({data:await nativeInventory(u.searchParams)})
      case 'history':return json({data:await inspectionHistory()})
      case 'diagnostics':return json({data:await googleDiagnostics()})
      default:throw new GoogleIntelligenceError('INVALID_VIEW','Unknown Google Intelligence view.',400)
    }
  }catch(e){return errorReply(e)}
}
export async function POST(request:Request){
  try{
    const rights=await authorize()
    if(!rights.manage)throw new GoogleIntelligenceError('SEO_MANAGE_REQUIRED','SEO management permission is required to spend URL Inspection quota.',403)
    const origin=request.headers.get('origin')
    const host=request.headers.get('host')||new URL(request.url).host
    if(origin){let compare='';try{compare=new URL(origin).host}catch{}
      if(compare!==host)throw new GoogleIntelligenceError('ORIGIN_REFUSED','Request origin refused.',403)
    }
    if(!request.headers.get('content-type')?.startsWith('application/json'))throw new GoogleIntelligenceError('JSON_REQUIRED','JSON request required.',415)
    const size=Number(request.headers.get('content-length')||0)
    if(size>4096)throw new GoogleIntelligenceError('BODY_TOO_LARGE','Request body too large.',413)
    const raw=await request.text()
    if(raw.length>4096)throw new GoogleIntelligenceError('BODY_TOO_LARGE','Request body too large.',413)
    let body:unknown
    try{body=JSON.parse(raw)}catch{throw new GoogleIntelligenceError('INVALID_JSON','Invalid JSON body.',400)}
    if(!body||typeof body!=='object'||Array.isArray(body))throw new GoogleIntelligenceError('INVALID_BODY','Invalid request object.',400)
    const url=(body as {url?:unknown}).url
    return json({data:await inspectGoogleUrl(url)})
  }catch(e){return errorReply(e)}
}
