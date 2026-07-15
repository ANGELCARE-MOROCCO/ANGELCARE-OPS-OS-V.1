'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/getUser'

function s(formData: FormData, key: string, fallback = ''): string {
  const out = String(formData.get(key) || '').trim()
  return out || fallback
}

export async function acknowledgeStaffMemoPhase2(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  const memoId = s(formData, 'memo_id')

  if (!user?.id || !memoId) {
    throw new Error('Missing user or memo id.')
  }

  const { error } = await supabase
    .from('staff_memo_acknowledgements')
    .upsert(
      [
        {
          user_id: user.id,
          memo_id: memoId,
          acknowledged_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'user_id,memo_id' }
    )

  if (error) throw new Error(error.message)

  revalidatePath('/staff-home')
  revalidatePath('/staff-services')
}

export async function createStaffServiceRequestPhase2(formData: FormData) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user?.id) {
    throw new Error('Missing user.')
  }

  const payload = {
    user_id: user.id,
    title: s(formData, 'title'),
    request_type: s(formData, 'request_type', 'general'),
    priority: s(formData, 'priority', 'medium'),
    status: 'open',
    description: s(formData, 'description'),
  }

  const { error } = await supabase.from('staff_service_requests').insert([payload])
  if (error) throw new Error(error.message)

  revalidatePath('/staff-services')
  revalidatePath('/staff-home')
}
