
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createQuickTask(prospectId:string, title:string){
  const supabase = await createClient()
  await supabase.from('bd_tasks').insert({
    title,
    related_type:'prospect',
    related_id:prospectId,
    status:'pending'
  })
}

export async function createQuickFollowup(prospectId:string, title:string){
  const supabase = await createClient()
  await supabase.from('bd_followups').insert({
    title,
    related_type:'prospect',
    related_id:prospectId,
    status:'pending'
  })
}

export async function logInteraction(prospectId:string, type:string, note?:string){
  const supabase = await createClient()
  await supabase.from('bd_activity_logs').insert({
    entity_type:'prospect',
    entity_id:prospectId,
    action:type,
    note
  })
}
