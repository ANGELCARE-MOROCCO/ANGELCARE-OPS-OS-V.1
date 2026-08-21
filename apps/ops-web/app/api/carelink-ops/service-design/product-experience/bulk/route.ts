import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { apiError, productExperienceClient, requireProductExperienceActor, safeArray, safeText } from '@/lib/service-design-product-experience/server'
export const runtime='nodejs';export const dynamic='force-dynamic'
async function POST__angelcareGovernedImpl(request:Request){try{await requireProductExperienceActor();const body=await request.json();const items=safeArray(body.items).slice(0,100) as Array<Record<string,unknown>>;const origin=new URL(request.url).origin;const results=[];for(const item of items){const response=await fetch(`${origin}/api/carelink-ops/service-design/product-experience/delete`,{method:'POST',headers:{'content-type':'application/json',cookie:request.headers.get('cookie')||''},body:JSON.stringify({action:'execute',entityType:safeText(item.entityType,80),entityId:safeText(item.entityId,180)})});const payload=await response.json().catch(()=>({}));results.push({entityType:item.entityType,entityId:item.entityId,ok:response.ok,error:payload.error||null})}return NextResponse.json({ok:results.every((r)=>r.ok),data:results})}catch(error){const e=apiError(error);return NextResponse.json({ok:false,error:e.message},{status:e.status})}}

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/carelink-ops/service-design/product-experience/bulk',
  },
  POST__angelcareGovernedImpl,
)
