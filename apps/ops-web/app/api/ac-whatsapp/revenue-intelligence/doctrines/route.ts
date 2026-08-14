import { NextRequest } from 'next/server'
import { acContext, audit, fail, ok } from '@/lib/ac-whatsapp/server'
import { loadDoctrinePacks } from '@/lib/ac-whatsapp/revenue-intelligence/repository'

export async function GET(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.view')
  if('error' in context)return context.error
  try{return ok(await loadDoctrinePacks(context.supabase))}catch(cause){return fail('DOCTRINE_LIST_FAILED',500,cause instanceof Error?cause.message:String(cause))}
}

export async function POST(request:NextRequest){
  const context=await acContext(request,'ac-whatsapp.automation.manage')
  if('error' in context)return context.error
  const body=await request.json().catch(()=>({}))
  const name=String(body.name||'').trim(); if(!name)return fail('DOCTRINE_NAME_REQUIRED',422)
  const code=String(body.code||name.toUpperCase().replace(/[^A-Z0-9]+/g,'_')).slice(0,80)
  const inserted=await context.supabase.from('ac_whatsapp_ri_doctrine_packs').insert({
    code,name,description:String(body.description||'')||null,service_line:String(body.service_line||'all'),customer_type:String(body.customer_type||'all'),status:String(body.status||'draft'),maturity_level:'L0',version:1,source_kind:String(body.source_kind||'manual'),applicability_score:0,coverage_score:0,commercial_priority:Number(body.commercial_priority||50),default_goal:String(body.default_goal||'advance_commercial_journey'),created_by:context.user.id,updated_by:context.user.id,
  }).select('*').single()
  if(inserted.error)return fail(inserted.error.message,500)
  await audit(context,{action:'revenue.doctrine_pack.create',entityType:'ri_doctrine_pack',entityId:inserted.data.id,newState:inserted.data})
  return ok(inserted.data,{status:201})
}
