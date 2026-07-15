'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function createMissionEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  missionId: number,
  eventType: string,
  content: string
) {
  await supabase.from('mission_events').insert([{ mission_id: missionId, event_type: eventType, content }])
}

export async function assignCaregiverToMission(formData: FormData) {
  const supabase = await createClient()
  const missionId = Number(formData.get('mission_id'))
  const caregiverIdRaw = String(formData.get('caregiver_id') || '')
  const caregiverId = caregiverIdRaw ? Number(caregiverIdRaw) : null
  if (!missionId) throw new Error('Mission ID manquant')

  const { error } = await supabase.from('missions').update({
    caregiver_id: caregiverId,
    status: caregiverId ? 'assigned' : 'draft',
  }).eq('id', missionId)

  if (error) throw new Error(error.message)
  await createMissionEvent(supabase, missionId, caregiverId ? 'caregiver_assigned' : 'caregiver_unassigned', caregiverId ? `Caregiver assignée: #${caregiverId}` : 'Caregiver retirée')
  revalidatePath(`/missions/${missionId}`)
  revalidatePath('/missions')
  revalidatePath('/')
}

export async function updateMissionStatus(formData: FormData) {
  const supabase = await createClient()
  const missionId = Number(formData.get('mission_id'))
  const status = String(formData.get('status') || 'draft')
  if (!missionId) throw new Error('Mission ID manquant')

  const patch: Record<string, string> = { status }
  if (status === 'confirmed') patch.confirmed_at = new Date().toISOString()
  if (status === 'in_progress') patch.started_at = new Date().toISOString()
  if (status === 'completed') patch.completed_at = new Date().toISOString()
  if (status === 'incident') patch.incident_at = new Date().toISOString()
  if (status === 'cancelled') patch.cancelled_at = new Date().toISOString()

  const { error } = await supabase.from('missions').update(patch).eq('id', missionId)
  if (error) throw new Error(error.message)

  await createMissionEvent(supabase, missionId, 'status_updated', `Statut mis à jour vers ${status}`)
  revalidatePath(`/missions/${missionId}`)
  revalidatePath('/missions')
  revalidatePath('/')
}

export async function startMission(formData: FormData) {
  const supabase = await createClient()
  const missionId = Number(formData.get('mission_id'))
  if (!missionId) throw new Error('Mission ID manquant')

  const { error } = await supabase.from('missions').update({
    status: 'in_progress',
    started_at: new Date().toISOString(),
  }).eq('id', missionId)

  if (error) throw new Error(error.message)
  await createMissionEvent(supabase, missionId, 'mission_started', 'Mission démarrée')
  revalidatePath(`/missions/${missionId}`)
  revalidatePath('/missions')
  revalidatePath('/')
}

export async function completeMission(formData: FormData) {
  const supabase = await createClient()
  const missionId = Number(formData.get('mission_id'))
  if (!missionId) throw new Error('Mission ID manquant')

  const { data: mission, error: missionReadError } = await supabase.from('missions').select('id, contract_id').eq('id', missionId).maybeSingle()
  if (missionReadError) throw new Error(missionReadError.message)

  const { error } = await supabase.from('missions').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', missionId)
  if (error) throw new Error(error.message)

  if (mission?.contract_id) {
    const { data: contract } = await supabase.from('contracts').select('id, sessions_used').eq('id', mission.contract_id).maybeSingle()
    if (contract) {
      await supabase.from('contracts').update({
        sessions_used: Number(contract.sessions_used || 0) + 1,
      }).eq('id', contract.id)
    }
  }

  await createMissionEvent(supabase, missionId, 'mission_completed', 'Mission terminée')
  revalidatePath(`/missions/${missionId}`)
  revalidatePath('/missions')
  revalidatePath('/contracts')
  revalidatePath('/')
}

export async function declareMissionIncident(formData: FormData) {
  const supabase = await createClient()
  const missionId = Number(formData.get('mission_id'))
  const incidentNote = String(formData.get('incident_note') || '')
  if (!missionId) throw new Error('Mission ID manquant')

  const { error } = await supabase.from('missions').update({
    status: 'incident',
    incident_at: new Date().toISOString(),
  }).eq('id', missionId)

  if (error) throw new Error(error.message)
  await createMissionEvent(supabase, missionId, 'incident_declared', incidentNote || 'Incident déclaré sans détail')
  revalidatePath(`/missions/${missionId}`)
  revalidatePath('/missions')
  revalidatePath('/incidents')
  revalidatePath('/')
}

export async function cancelMission(formData: FormData) {
  const supabase = await createClient()
  const missionId = Number(formData.get('mission_id'))
  const cancelReason = String(formData.get('cancel_reason') || '')
  if (!missionId) throw new Error('Mission ID manquant')

  const { error } = await supabase.from('missions').update({
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
  }).eq('id', missionId)

  if (error) throw new Error(error.message)
  await createMissionEvent(supabase, missionId, 'mission_cancelled', cancelReason || 'Mission annulée')
  revalidatePath(`/missions/${missionId}`)
  revalidatePath('/missions')
  revalidatePath('/')
}