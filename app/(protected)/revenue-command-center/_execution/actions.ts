
'use server'
import { createClient } from '@/lib/supabase/server'

export async function bulkUpdate(ids:string[], payload:any){
  const supabase=await createClient()
  await supabase.from('bd_tasks').update(payload).in('id',ids)
}

export async function snoozeItem(id:string, hours:number){
  const supabase=await createClient()
  await supabase.from('bd_tasks').update({
    snoozed_until: new Date(Date.now()+hours*3600000).toISOString()
  }).eq('id',id)
}

export async function logOutcome(id:string, outcome:string, note?:string){
  const supabase=await createClient()
  await supabase.from('bd_activity_logs').insert({
    entity_type:'task',
    entity_id:id,
    action:outcome,
    note
  })
}

export async function escalateItem(id:string, reason:string){
  const supabase=await createClient()
  await supabase.from('bd_tasks').update({
    escalated:true,
    escalation_reason:reason
  }).eq('id',id)
}
