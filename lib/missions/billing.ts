import { createClient } from '@/lib/supabase/server'
import { recordMissionEvent } from './events'

export async function consumeContractSessionForMission(missionId: number) {
  const supabase = await createClient()
  const { data: mission, error } = await supabase.from('missions').select('id, contract_id').eq('id', missionId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!mission?.contract_id) return { consumed: false }
  const { data: contract, error: contractError } = await supabase.from('contracts').select('id, sessions_used').eq('id', mission.contract_id).maybeSingle()
  if (contractError) throw new Error(contractError.message)
  if (!contract) return { consumed: false }
  const { error: updateError } = await supabase.from('contracts').update({ sessions_used: Number(contract.sessions_used || 0) + 1 }).eq('id', contract.id)
  if (updateError) throw new Error(updateError.message)
  await recordMissionEvent({ missionId, eventType: 'contract_session_consumed', content: 'Contract session consumed after mission validation', metadata: { contract_id: contract.id } })
  return { consumed: true, contractId: contract.id }
}
