'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRule(formData:FormData){
  const supabase = await createClient()

  const name = formData.get('name')
  const trigger_type = formData.get('trigger_type')

  const { error } = await supabase.from('bd_automation_rules').insert({
    name,
    trigger_type,
    condition:{ field:'next_action', operator:'missing' },
    action:{ type:'alert' }
  })

  if(error) throw new Error(error.message)

  revalidatePath('/revenue-command-center/automation')
}
