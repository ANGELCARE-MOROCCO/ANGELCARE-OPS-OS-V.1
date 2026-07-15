'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function convertLeadToMission(formData: FormData) {
  const supabase = await createClient()

  const lead_id = Number(formData.get('lead_id'))

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', lead_id)
    .single()

  if (!lead) throw new Error('Lead introuvable')

  // 1️⃣ créer ou récupérer famille
  let family_id = lead.family_id

  if (!family_id) {
    const { data: newFamily } = await supabase
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

    family_id = newFamily?.id
  }

  // 2️⃣ créer mission
  const { data: mission } = await supabase
    .from('missions')
    .insert([
      {
        family_id,
        service_type: lead.service_needed || 'Service AngelCare',
        mission_date: new Date().toISOString().slice(0, 10),
        status: 'draft',
        urgency: lead.urgency || 'normal',
        city: lead.city,
        notes: lead.notes,
      },
    ])
    .select()
    .single()

  // 3️⃣ update lead
  await supabase
    .from('leads')
    .update({
      status: 'converted',
      converted_to_mission_id: mission.id,
    })
    .eq('id', lead_id)

  // 4️⃣ timeline
  await supabase.from('lead_events').insert([
    {
      lead_id,
      content: 'Lead converti en mission #' + mission.id,
    },
  ])

  // 5️⃣ tâches auto
  await supabase.from('lead_tasks').insert([
    {
      lead_id,
      title: 'Confirmer mission avec parent',
    },
    {
      lead_id,
      title: 'Assigner intervenante',
    },
  ])

  redirect('/missions')
}
