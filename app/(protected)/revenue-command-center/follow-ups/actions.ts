'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/getUser'

function clean(v:any){return String(v||'').trim()||null}

export async function createFollowup(formData:FormData){
  const supabase = await createClient()
  const user = await getCurrentUser()

  const title = clean(formData.get('title'))
  const due_at = clean(formData.get('due_at'))
  const related_id = clean(formData.get('related_id'))

  if(!title) throw new Error('Missing title')

  const { error } = await supabase.from('bd_followups').insert({
    title,
    due_at,
    related_type:'prospect',
    related_id,
    owner_id:user?.id
  })

  if(error) throw new Error(error.message)

  revalidatePath('/revenue-command-center/follow-ups')
}

export async function completeFollowup(formData:FormData){
  const supabase = await createClient()
  const id = clean(formData.get('id'))

  const { error } = await supabase.from('bd_followups').update({
    status:'completed',
    updated_at:new Date().toISOString()
  }).eq('id',id)

  if(error) throw new Error(error.message)

  revalidatePath('/revenue-command-center/follow-ups')
}
