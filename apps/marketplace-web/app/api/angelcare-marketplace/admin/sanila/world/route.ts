import { NextRequest, NextResponse } from 'next/server'
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { getSanilaWorldState, mutateSanilaWorld, SanilaWorldConflict } from '@/angelcare-marketplace/sanila-world/repository'
import { applySanilaWorldAction } from '@/angelcare-marketplace/sanila-world/world-engine'

export const runtime='nodejs'
export const dynamic='force-dynamic'
type Action=Parameters<typeof applySanilaWorldAction>[1]
const actions=new Set<Action>(['create_page','duplicate_page','save_page','edit_page','trash_page','restore_page','pause_page','resume_page',
 'upsert_theme','duplicate_theme','trash_theme','restore_theme','set_theme','set_navigation','set_shell',
 'import_bundle','publish','rollback'])
function failure(error:unknown){
  const message=error instanceof Error?error.message:'Action SANILA impossible.'
  return NextResponse.json({ok:false,error:message},{status:error instanceof SanilaWorldConflict?409:/refusé|permission/i.test(message)?403:422})
}
export async function GET(){
  try{
    await requireMarketplaceApiContext('marketplace.public.inquiries.manage')
    return NextResponse.json({ok:true,state:await getSanilaWorldState()},{headers:{'Cache-Control':'no-store'}})
  }catch(error){return failure(error)}
}
export async function POST(request:NextRequest){
  try{
    const context=await requireMarketplaceApiContext('marketplace.public.inquiries.manage')
    const size=Number(request.headers.get('content-length')||0)
    if(size>3_000_000)return NextResponse.json({ok:false,error:'Package SANILA supérieur à 3 MB.'},{status:413})
    const body=await request.json() as Record<string,unknown>
    const action=String(body.action||'') as Action
    if(!actions.has(action))return NextResponse.json({ok:false,error:'Action SANILA non autorisée.'},{status:422})
    const expectedRevision=Number(body.expectedRevision)
    if(!Number.isInteger(expectedRevision)||expectedRevision<0)throw new SanilaWorldConflict()
    const payload=body.payload&&typeof body.payload==='object'&&!Array.isArray(body.payload)
      ?body.payload as Record<string,unknown>:body
    const state=await mutateSanilaWorld({action,payload,context,expectedRevision})
    return NextResponse.json({ok:true,state},{headers:{'Cache-Control':'no-store'}})
  }catch(error){return failure(error)}
}
