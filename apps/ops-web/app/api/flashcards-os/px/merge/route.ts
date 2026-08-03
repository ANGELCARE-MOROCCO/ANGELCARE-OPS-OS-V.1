import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromPxUser, createWorkbench, getWorkbench, recordScenarioComposition } from '@/lib/flashcards-os/px/repository'

export async function POST(request:Request){
 const access=await assertFlashcardsApiAccess('flashcards_os.view_solutions');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status})
 try{
  const body=await request.json() as {workbenchIds?:unknown[];title?:unknown;strategy?:unknown};const ids:string[]=Array.isArray(body.workbenchIds)?Array.from(new Set(body.workbenchIds.map((value)=>String(value)))).slice(0,4):[];if(ids.length<2)throw new Error('Select at least two workbenches to merge.')
  const actor=actorFromPxUser(access.user);const sources=[] as any[];for(const id of ids){const source=await getWorkbench(id,actor);if(!source)throw new Error(`Workbench not found: ${id}`);sources.push(source)}
  const kind=sources[0].workbench.kind;if(!sources.every((source)=>source.workbench.kind===kind))throw new Error('Only workbenches of the same type can be merged.')
  const itemMap=new Map<string,any>();for(const source of sources){for(const item of source.items){const key=`${item.itemKind}:${item.sourceRef||item.title}:${item.payload?.dayNumber||''}:${item.payload?.sessionNumber||''}`;const existing=itemMap.get(key);if(!existing||Number(item.quantity)>Number(existing.quantity))itemMap.set(key,item)}}
  const items=[...itemMap.values()].sort((a,b)=>a.sortOrder-b.sortOrder).map((item,index)=>({itemKind:item.itemKind,sourceRef:item.sourceRef,sourceVersion:item.sourceVersion,title:item.title,sortOrder:(index+1)*100,startMinute:item.startMinute,durationMinutes:item.durationMinutes,quantity:item.quantity,locked:item.locked,payload:{...item.payload,mergedFrom:ids}}))
  const created=await createWorkbench({kind,sourceId:null,sourceType:'merged_workbench',title:String(body.title||`${sources[0].workbench.title} · Fusion`),universe:sources[0].workbench.universe,payload:{mergedFrom:ids,mergeStrategy:String(body.strategy||'unique_best'),commercial:sources[0].workbench.payload.commercial||{}},sourceSnapshot:{sources:sources.map((source)=>source.workbench.sourceSnapshot)},items},actor)
  if(!created)throw new Error('Merged workbench creation failed.')
  await recordScenarioComposition({workbenchId:created.workbench.id,kind:'merge',sourceScenarioIds:ids,before:{sources:ids},proposed:{items},applied:created},actor)
  return NextResponse.json(created,{status:201})
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Merge failed.'},{status:400})}
}
