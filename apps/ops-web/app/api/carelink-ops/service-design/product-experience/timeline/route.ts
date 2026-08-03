import { NextResponse } from 'next/server'
import { apiError, actorId, productExperienceClient, requireProductExperienceActor, safeJson, safeText, tenantId } from '@/lib/service-design-product-experience/server'
import { loadDraft, recordHistory } from '@/lib/service-design-product-experience/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ownedDraft(client: Awaited<ReturnType<typeof productExperienceClient>>, actor: Awaited<ReturnType<typeof requireProductExperienceActor>>, id: string) {
  const result = await client.from('hsd_px_workbench_drafts').select('id,workspace_key').eq('id', id).eq('tenant_id', tenantId(actor)).eq('user_id', actorId(actor)).maybeSingle()
  if (result.error) throw result.error
  if (!result.data) throw Object.assign(new Error('Workbench introuvable.'), { status: 404 })
  return result.data
}

export async function GET(request: Request) {
  try { const actor = await requireProductExperienceActor(); const client = await productExperienceClient(); const workspaceKey = safeText(new URL(request.url).searchParams.get('workspaceKey'),240); const draft = await loadDraft(client,actor,workspaceKey); return NextResponse.json({ok:true,data:draft}) }
  catch(error){const e=apiError(error);return NextResponse.json({ok:false,error:e.message},{status:e.status})}
}

export async function POST(request: Request) {
  try {
    const actor = await requireProductExperienceActor(); const client = await productExperienceClient(); const body = await request.json(); const action = safeText(body.action,80); const draftId = safeText(body.draftId,180)
    await ownedDraft(client,actor,draftId)
    if (action === 'create_day') {
      const result = await client.from('hsd_px_timeline_days').insert({tenant_id:tenantId(actor),user_id:actorId(actor),draft_id:draftId,service_date:body.serviceDate||null,label:safeText(body.label||'Nouvelle journée',200),start_minute:Number(body.startMinute||480),end_minute:Number(body.endMinute||960),sort_order:Number(body.sortOrder||100),metadata:safeJson(body.metadata)}).select('*').single(); if(result.error)throw result.error; return NextResponse.json({ok:true,data:result.data})
    }
    if (action === 'create_block') {
      const dayId=safeText(body.dayId,180); const day=await client.from('hsd_px_timeline_days').select('id').eq('id',dayId).eq('draft_id',draftId).maybeSingle(); if(day.error)throw day.error;if(!day.data)throw Object.assign(new Error('Journée introuvable.'),{status:404})
      const result=await client.from('hsd_px_timeline_blocks').insert({tenant_id:tenantId(actor),user_id:actorId(actor),day_id:dayId,source_activity_id:body.sourceActivityId||null,source_code:body.sourceCode||null,block_type:safeText(body.blockType||'custom',40),label:safeText(body.label||'Nouveau bloc',240),objective:safeText(body.objective,500),start_minute:Number(body.startMinute||480),duration_minutes:Math.max(5,Number(body.durationMinutes||30)),locked:Boolean(body.locked),sort_order:Number(body.sortOrder||100),metadata:safeJson(body.metadata)}).select('*').single();if(result.error)throw result.error;return NextResponse.json({ok:true,data:result.data})
    }
    if (action === 'duplicate_day') {
      const sourceId=safeText(body.dayId,180);const source=await client.from('hsd_px_timeline_days').select('*').eq('id',sourceId).eq('draft_id',draftId).single();if(source.error)throw source.error
      const date=body.serviceDate||source.data.service_date;const created=await client.from('hsd_px_timeline_days').insert({...source.data,id:undefined,service_date:date,label:safeText(body.label||`${source.data.label} · copie`,200),sort_order:Number(body.sortOrder||Number(source.data.sort_order)+100),created_at:undefined,updated_at:undefined}).select('*').single();if(created.error)throw created.error
      const blocks=await client.from('hsd_px_timeline_blocks').select('*').eq('day_id',sourceId);if(blocks.error)throw blocks.error
      if(blocks.data?.length){const inserted=await client.from('hsd_px_timeline_blocks').insert(blocks.data.map((block: Record<string, unknown>)=>({...block,id:undefined,day_id:created.data.id,created_at:undefined,updated_at:undefined})));if(inserted.error)throw inserted.error}
      return NextResponse.json({ok:true,data:created.data})
    }
    if (action === 'replace_all') {
      const days = Array.isArray(body.days) ? body.days : []
      const existing = await client.from('hsd_px_timeline_days').select('id').eq('draft_id', draftId)
      if (existing.error) throw existing.error
      if (existing.data?.length) { const removed = await client.from('hsd_px_timeline_days').delete().eq('draft_id', draftId); if (removed.error) throw removed.error }
      for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
        const day = days[dayIndex] || {}
        const created = await client.from('hsd_px_timeline_days').insert({ tenant_id: tenantId(actor), user_id: actorId(actor), draft_id: draftId, source_day_id: day.sourceDayId || null, service_date: day.serviceDate || null, label: safeText(day.label || `Jour ${dayIndex + 1}`, 200), start_minute: Number(day.startMinute || 480), end_minute: Number(day.endMinute || 960), sort_order: Number(day.sortOrder ?? dayIndex * 100), metadata: safeJson(day.metadata) }).select('*').single()
        if (created.error) throw created.error
        const blocks = Array.isArray(day.blocks) ? day.blocks : []
        if (blocks.length) {
          const inserted = await client.from('hsd_px_timeline_blocks').insert(blocks.map((block: Record<string, unknown>, index: number) => ({ tenant_id: tenantId(actor), user_id: actorId(actor), day_id: created.data.id, source_activity_id: block.sourceActivityId || null, source_code: block.sourceCode || null, block_type: safeText(block.blockType || 'custom', 40), label: safeText(block.label || `Bloc ${index + 1}`, 240), objective: safeText(block.objective, 500), start_minute: Number(block.startMinute || 480), duration_minutes: Math.max(5, Number(block.durationMinutes || 30)), locked: Boolean(block.locked), sort_order: Number(block.sortOrder ?? index * 100), metadata: safeJson(block.metadata) })))
          if (inserted.error) throw inserted.error
        }
      }
      return NextResponse.json({ ok: true, data: { replaced: true, days: days.length } })
    }
    if (action === 'rebalance') {
      const dayId=safeText(body.dayId,180);const day=await client.from('hsd_px_timeline_days').select('*').eq('id',dayId).eq('draft_id',draftId).single();if(day.error)throw day.error
      const blocks=await client.from('hsd_px_timeline_blocks').select('*').eq('day_id',dayId).order('start_minute');if(blocks.error)throw blocks.error
      let cursor=Number(day.data.start_minute);for(const block of blocks.data||[]){if(block.locked){cursor=Math.max(cursor,Number(block.start_minute)+Number(block.duration_minutes));continue}const update=await client.from('hsd_px_timeline_blocks').update({start_minute:cursor}).eq('id',block.id);if(update.error)throw update.error;cursor+=Number(block.duration_minutes)}
      return NextResponse.json({ok:true,data:{rebalanced:true,endMinute:cursor,overflow:Math.max(0,cursor-Number(day.data.end_minute))}})
    }
    throw Object.assign(new Error('Action timeline inconnue.'),{status:400})
  } catch(error){const e=apiError(error);return NextResponse.json({ok:false,error:e.message},{status:e.status})}
}

export async function PATCH(request: Request) {
  try {
    const actor=await requireProductExperienceActor();const client=await productExperienceClient();const body=await request.json();const kind=safeText(body.kind,30);const id=safeText(body.id,180);const draftId=safeText(body.draftId,180);await ownedDraft(client,actor,draftId)
    if(kind==='block'){
      const current=await client.from('hsd_px_timeline_blocks').select('*').eq('id',id).single();if(current.error)throw current.error
      await recordHistory(client,actor,draftId,'update_block',{block:current.data})
      const patch:Record<string,unknown>={};for(const [from,to] of [['label','label'],['objective','objective'],['blockType','block_type'],['sourceActivityId','source_activity_id'],['sourceCode','source_code'],['startMinute','start_minute'],['durationMinutes','duration_minutes'],['locked','locked'],['sortOrder','sort_order'],['metadata','metadata']] as const) if(body[from]!==undefined)patch[to]=from==='metadata'?safeJson(body[from]):body[from]
      if(patch.label!==undefined)patch.label=safeText(patch.label,240);if(patch.objective!==undefined)patch.objective=safeText(patch.objective,500);if(patch.duration_minutes!==undefined)patch.duration_minutes=Math.max(5,Number(patch.duration_minutes));if(patch.start_minute!==undefined)patch.start_minute=Math.max(0,Math.min(1439,Number(patch.start_minute)))
      const result=await client.from('hsd_px_timeline_blocks').update(patch).eq('id',id).select('*').single();if(result.error)throw result.error;return NextResponse.json({ok:true,data:result.data})
    }
    if(kind==='day'){
      const patch:Record<string,unknown>={};for(const [from,to] of [['label','label'],['serviceDate','service_date'],['startMinute','start_minute'],['endMinute','end_minute'],['sortOrder','sort_order'],['metadata','metadata']] as const)if(body[from]!==undefined)patch[to]=from==='metadata'?safeJson(body[from]):body[from]
      const result=await client.from('hsd_px_timeline_days').update(patch).eq('id',id).eq('draft_id',draftId).select('*').single();if(result.error)throw result.error;return NextResponse.json({ok:true,data:result.data})
    }
    throw Object.assign(new Error('Type timeline inconnu.'),{status:400})
  }catch(error){const e=apiError(error);return NextResponse.json({ok:false,error:e.message},{status:e.status})}
}

export async function DELETE(request: Request) {
  try{
    const actor=await requireProductExperienceActor();const client=await productExperienceClient();const url=new URL(request.url);const kind=safeText(url.searchParams.get('kind'),30);const id=safeText(url.searchParams.get('id'),180);const draftId=safeText(url.searchParams.get('draftId'),180);await ownedDraft(client,actor,draftId)
    const table=kind==='block'?'hsd_px_timeline_blocks':kind==='day'?'hsd_px_timeline_days':'';if(!table)throw Object.assign(new Error('Type de suppression invalide.'),{status:400})
    const result=await client.from(table).delete().eq('id',id).select('id');if(result.error)throw result.error;return NextResponse.json({ok:true,data:{deleted:result.data?.length||0}})
  }catch(error){const e=apiError(error);return NextResponse.json({ok:false,error:e.message},{status:e.status})}
}
