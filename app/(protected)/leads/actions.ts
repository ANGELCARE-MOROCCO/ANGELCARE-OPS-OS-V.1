'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function convertLeadToMissionFromList(formData: FormData) {
  const supabase = await createClient()

  const leadId = Number(formData.get('lead_id'))

  if (!leadId) {
    throw new Error('Lead ID manquant')
  }

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle()

  if (leadError) throw new Error(leadError.message)
  if (!lead) throw new Error('Lead introuvable')

  let familyId: number | null = null

  const { data: existingFamily, error: familyLookupError } = await supabase
    .from('families')
    .select('*')
    .eq('phone', lead.phone)
    .maybeSingle()

  if (familyLookupError) throw new Error(familyLookupError.message)

  if (existingFamily) {
    familyId = existingFamily.id
  } else {
    const { data: newFamily, error: familyCreateError } = await supabase
      .from('families')
      .insert([
        {
          parent_name: lead.parent_name,
          city: lead.city,
          phone: lead.phone,
        },
      ])
      .select()
      .single()

    if (familyCreateError) throw new Error(familyCreateError.message)
    familyId = newFamily.id
  }

  const serviceType =
    lead.service_needed ||
    (Array.isArray(lead.service_interests) && lead.service_interests.length > 0
      ? lead.service_interests[0]
      : 'Service AngelCare')

  const missionNotes =
    lead.special_needs ||
    lead.timeline_note ||
    'Mission créée depuis le Kanban CRM'

  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .insert([
      {
        family_id: familyId,
        service_type: serviceType,
        mission_date: new Date().toISOString().slice(0, 10),
        status: 'draft',
        urgency: lead.urgency || 'normal',
        city: lead.city || null,
        notes: missionNotes,
      },
    ])
    .select()
    .single()

  if (missionError) throw new Error(missionError.message)

  const { error: leadUpdateError } = await supabase
    .from('leads')
    .update({
      status: 'converted',
      converted_to_mission_id: mission.id,
    })
    .eq('id', leadId)

  if (leadUpdateError) throw new Error(leadUpdateError.message)

  await supabase.from('lead_events').insert([
    {
      lead_id: leadId,
      event_type: 'conversion',
      content: `Lead converti en mission #${mission.id} depuis le Kanban`,
      created_by: 'AngelCare OpsOS',
    },
  ])

  await supabase.from('lead_tasks').insert([
    {
      lead_id: leadId,
      task_type: 'Confirmer mission avec parent',
      status: 'open',
      notes: `Mission #${mission.id}`,
    },
    {
      lead_id: leadId,
      task_type: 'Assigner intervenante',
      status: 'open',
      notes: `Mission #${mission.id}`,
    },
  ])

  redirect('/missions')
}