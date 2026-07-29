import { NextRequest, NextResponse } from 'next/server'
import { contentHeadquartersApiError, requireContentHeadquartersUser, type ContentHeadquartersPermission } from '@/lib/market-os/content-command-headquarters/auth'
import { executeRecordLifecycle, getRecordLifecycleCatalog, inspectRecordLifecycle, listGovernedRecords, type RecordLifecycleAction, type RecordLifecycleEntityType } from '@/lib/market-os/content-command-headquarters/record-lifecycle-service'

export const dynamic='force-dynamic'
const clean=(v:unknown)=>String(v||'').trim()

export async function GET(request:NextRequest){
  try{
    await requireContentHeadquartersUser('view')
    const url=new URL(request.url)
    const entityType=clean(url.searchParams.get('entityType')) as RecordLifecycleEntityType
    const entityId=clean(url.searchParams.get('entityId'))
    if(entityType&&entityId) return NextResponse.json({ok:true,inspection:await inspectRecordLifecycle(entityType,entityId),catalog:getRecordLifecycleCatalog()})
    const records=await listGovernedRecords({entityType:entityType||undefined,family:clean(url.searchParams.get('family'))||undefined,state:clean(url.searchParams.get('state'))||'all',search:clean(url.searchParams.get('search')),limit:Number(url.searchParams.get('limit')||40)})
    return NextResponse.json({ok:true,records,catalog:getRecordLifecycleCatalog()})
  }catch(error){return contentHeadquartersApiError(error)}
}

export async function POST(request:NextRequest){
  try{
    const body=await request.json() as Record<string,unknown>
    const action=clean(body.action) as RecordLifecycleAction
    const permission:ContentHeadquartersPermission = action==='permanent_delete'?'purge' : action==='edit'?'edit' : action==='cancel'?'cancel' : action==='archive'?'archive' : action==='soft_delete'?'delete' : action==='restore'?'restore' : action==='reopen'?'reopen' : action==='supersede'?'supersede' : 'operate'
    const actor=await requireContentHeadquartersUser(permission)
    const result=await executeRecordLifecycle({actorId:actor.id,actorName:actor.name,entityType:clean(body.entityType) as RecordLifecycleEntityType,entityId:clean(body.entityId),action,reason:clean(body.reason),confirmation:clean(body.confirmation),patch:(body.patch&&typeof body.patch==='object'?body.patch:{}) as Record<string,unknown>})
    return NextResponse.json({ok:true,...result})
  }catch(error){return contentHeadquartersApiError(error)}
}
