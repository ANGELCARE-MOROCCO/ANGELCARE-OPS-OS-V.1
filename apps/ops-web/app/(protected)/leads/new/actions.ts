'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createLead(formData: FormData) {
  const supabase = await createClient()

  const parent_name = String(formData.get('parent_name') || '')
  const phone = String(formData.get('phone') || '')
  const city = String(formData.get('city') || '')
  const source = String(formData.get('source') || '')
  const urgency = String(formData.get('urgency') || 'normal')
  const children_count = Number(formData.get('children_count') || 0)
  const children_ages = String(formData.get('children_ages') || '')
  const special_needs = String(formData.get('special_needs') || '')
  const preferred_schedule = String(formData.get('preferred_schedule') || '')
  const timeline_note = String(formData.get('timeline_note') || '')
  const reminder_reason = String(formData.get('reminder_reason') || '')
  const reminder_date = String(formData.get('reminder_date') || '')
  const reminder_time = String(formData.get('reminder_time') || '')
  const service_interests = formData.getAll('service_interests').map(String)

  const offer_needed = formData.get('offer_needed') === 'on'
  const quote_needed = formData.get('quote_needed') === 'on'
  const product_explanation_needed = formData.get('product_explanation_needed') === 'on'

  const reminder_at =
    reminder_date && reminder_time
      ? `${reminder_date}T${reminder_time}:00`
      : null

  const { data: insertedLead, error } = await supabase
    .from('leads')
    .insert([
      {
        parent_name,
        phone,
        city,
        source,
        urgency,
        children_count,
        children_ages,
        special_needs,
        preferred_schedule,
        timeline_note,
        reminder_reason: reminder_reason || null,
        reminder_at,
        service_interests,
        offer_needed,
        quote_needed,
        product_explanation_needed,
        status: 'new',
        service_needed: service_interests.join(', '),
      },
    ])
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (timeline_note) {
    await supabase.from('lead_events').insert([
      {
        lead_id: insertedLead.id,
        event_type: 'comment',
        content: timeline_note,
        created_by: 'AngelCare',
      },
    ])
  }

  const tasks = []

  if (offer_needed) {
    tasks.push({
      lead_id: insertedLead.id,
      task_type: 'Établir offre',
      status: 'open',
      notes: '',
      due_at: reminder_at,
    })
  }

  if (quote_needed) {
    tasks.push({
      lead_id: insertedLead.id,
      task_type: 'Devis à envoyer',
      status: 'open',
      notes: '',
      due_at: reminder_at,
    })
  }

  if (product_explanation_needed) {
    tasks.push({
      lead_id: insertedLead.id,
      task_type: 'Programme / explication produits nécessaire',
      status: 'open',
      notes: '',
      due_at: reminder_at,
    })
  }

  if (tasks.length > 0) {
    await supabase.from('lead_tasks').insert(tasks)
  }

  if (reminder_reason && reminder_at) {
    await supabase.from('lead_reminders').insert([
      {
        lead_id: insertedLead.id,
        reason: reminder_reason,
        remind_at: reminder_at,
        status: 'pending',
      },
    ])
  }

  redirect(`/leads/${insertedLead.id}`)
}
