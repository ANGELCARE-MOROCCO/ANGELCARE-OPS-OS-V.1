'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addLeadEvent(formData: FormData) {
  const supabase = await createClient()

  const lead_id = Number(formData.get('lead_id'))
  const content = String(formData.get('content') || '')
  const created_by = String(formData.get('created_by') || 'AngelCare')
  const event_type = 'comment'

  if (!lead_id || !content) return

  const { error } = await supabase.from('lead_events').insert([
    {
      lead_id,
      event_type,
      content,
      created_by,
    },
  ])

  if (error) throw new Error(error.message)

  revalidatePath(`/leads/${lead_id}`)
}

export async function addLeadTask(formData: FormData) {
  const supabase = await createClient()

  const lead_id = Number(formData.get('lead_id'))
  const task_type = String(formData.get('task_type') || '')
  const notes = String(formData.get('notes') || '')
  const due_date = String(formData.get('due_date') || '')
  const due_time = String(formData.get('due_time') || '')

  if (!lead_id || !task_type) return

  const due_at = due_date && due_time ? `${due_date}T${due_time}:00` : null

  const { error } = await supabase.from('lead_tasks').insert([
    {
      lead_id,
      task_type,
      notes,
      due_at,
      status: 'open',
    },
  ])

  if (error) throw new Error(error.message)

  revalidatePath(`/leads/${lead_id}`)
}

export async function addLeadReminder(formData: FormData) {
  const supabase = await createClient()

  const lead_id = Number(formData.get('lead_id'))
  const reason = String(formData.get('reason') || '')
  const remind_date = String(formData.get('remind_date') || '')
  const remind_time = String(formData.get('remind_time') || '')

  if (!lead_id || !reason || !remind_date || !remind_time) return

  const remind_at = `${remind_date}T${remind_time}:00`

  const { error } = await supabase.from('lead_reminders').insert([
    {
      lead_id,
      reason,
      remind_at,
      status: 'pending',
    },
  ])

  if (error) throw new Error(error.message)

  revalidatePath(`/leads/${lead_id}`)
}