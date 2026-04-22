import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ContractPlannerClient from '../../new/ContractPlannerClient'

const CONTRACT_TYPE_OPTIONS = ['one_shot', 'monthly_package']
const STATUS_OPTIONS = ['draft', 'active', 'paused', 'completed', 'cancelled']

type PlannerRow = { missionCode:string; serviceCode:string; serviceType:string; missionDate:string; durationHours:number; startTime:string; endTime:string; caregiverId:string }
async function buildPlannerRows(formData: FormData) {
  const rowCount = Number(formData.get('row_count') || 0)
  const rows: Array<PlannerRow & { rowOrder:number }> = []
  for (let i = 0; i < rowCount; i++) {
    const missionCode = String(formData.get(`row_mission_code_${i}`) || '')
    const serviceCode = String(formData.get(`row_service_code_${i}`) || '')
    const serviceType = String(formData.get(`row_service_type_${i}`) || '')
    const missionDate = String(formData.get(`row_date_${i}`) || '')
    const durationHours = Number(formData.get(`row_duration_${i}`) || 0)
    const startTime = String(formData.get(`row_start_${i}`) || '')
    const endTime = String(formData.get(`row_end_${i}`) || '')
    const caregiverId = String(formData.get(`row_caregiver_id_${i}`) || '')
    if (!missionCode && !missionDate && !startTime && !endTime) continue
    rows.push({ rowOrder:i+1, missionCode, serviceCode, serviceType, missionDate, durationHours, startTime, endTime, caregiverId })
  }
  return rows
}

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const contractId = Number(id)
  const supabase = await createClient()
  const [contractRes, familiesRes, caregiversRes, rowsRes] = await Promise.all([
    supabase.from('contracts').select('*').eq('id', contractId).eq('is_archived', false).maybeSingle(),
    supabase.from('families').select('id, family_name, parent_name, city, zone').eq('is_archived', false).order('id', { ascending: false }),
    supabase.from('caregivers').select('id, full_name, city, current_status, status, skill_tags').eq('is_archived', false).order('full_name', { ascending: true }),
    supabase.from('contract_mission_rows').select('*').eq('contract_id', contractId).order('row_order', { ascending: true }),
  ])
  if (contractRes.error) return <main style={{ padding:32 }}>Erreur : {contractRes.error.message}</main>
  const contract = contractRes.data
  const families = familiesRes.data || []
  const caregivers = caregiversRes.data || []
  const existingRows = (rowsRes.data || []).map((row:any)=>({ missionCode:row.mission_code || '', serviceCode:row.service_code || '', serviceType:row.service_type || contract?.service_type || '', missionDate:row.mission_date || '', durationHours:Number(row.duration_hours || 3), startTime:row.start_time || '', endTime:row.end_time || '', caregiverId:row.caregiver_id ? String(row.caregiver_id) : '' })) as PlannerRow[]
  if (!contract) return <main style={{ padding:32, fontFamily:'Arial, sans-serif' }}><h1>Contrat introuvable</h1><Link href="/contracts" style={secondaryButtonStyle}>← Retour contrats</Link></main>

  async function updateContract(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const familyIdRaw = String(formData.get('family_id') || '')
    const preferredCaregiverIdRaw = String(formData.get('preferred_caregiver_id') || '')
    const familyId = familyIdRaw ? Number(familyIdRaw) : null
    const payload = {
      contract_reference: String(formData.get('contract_reference') || ''),
      contract_type: String(formData.get('contract_type') || 'one_shot'),
      package_label: String(formData.get('package_label') || ''),
      family_id: familyId,
      service_type: String(formData.get('service_type') || ''),
      total_sessions: Number(formData.get('total_sessions') || 1),
      sessions_used: Number(formData.get('sessions_used') || 0),
      start_date: String(formData.get('start_date') || '') || null,
      end_date: String(formData.get('end_date') || '') || null,
      preferred_caregiver_id: preferredCaregiverIdRaw ? Number(preferredCaregiverIdRaw) : null,
      preferred_days: String(formData.get('preferred_days') || ''),
      preferred_time: String(formData.get('preferred_time') || ''),
      location_notes: String(formData.get('location_notes') || ''),
      status: String(formData.get('status') || 'active'),
      notes: String(formData.get('notes') || ''),
    }
    const { error: contractError } = await supabase.from('contracts').update(payload).eq('id', contractId)
    if (contractError) throw new Error(contractError.message)
    const familyRecord = familyId ? await supabase.from('families').select('city, zone').eq('id', familyId).maybeSingle() : { data:null }
    const rows = await buildPlannerRows(formData)
    const missionPayloads = rows.map((row)=>({ contract_id:contractId, contract_row_order:row.rowOrder, mission_code:row.missionCode, family_id:familyId, caregiver_id:row.caregiverId ? Number(row.caregiverId) : null, service_type:row.serviceType, mission_date:row.missionDate || null, start_time:row.startTime || null, end_time:row.endTime || null, duration_hours:row.durationHours || null, status:'draft', urgency:'normal', city:familyRecord.data?.city || null, zone:familyRecord.data?.zone || null, notes:`Mission synchronisée automatiquement depuis contrat #${contractId}` }))
    if (missionPayloads.length > 0) {
      const { error: upsertError } = await supabase.from('missions').upsert(missionPayloads, { onConflict:'contract_id,contract_row_order' })
      if (upsertError) throw new Error(upsertError.message)
    }
    const activeRowOrders = rows.map((row)=>row.rowOrder)
    if (activeRowOrders.length > 0) {
      const { error: deleteExtraMissionsError } = await supabase.from('missions').delete().eq('contract_id', contractId).not('contract_row_order', 'in', `(${activeRowOrders.join(',')})`)
      if (deleteExtraMissionsError) throw new Error(deleteExtraMissionsError.message)
    } else {
      const { error: deleteAllMissionsError } = await supabase.from('missions').delete().eq('contract_id', contractId)
      if (deleteAllMissionsError) throw new Error(deleteAllMissionsError.message)
    }
    const { data: syncedMissions, error: syncedMissionsError } = await supabase.from('missions').select('id, contract_row_order').eq('contract_id', contractId)
    if (syncedMissionsError) throw new Error(syncedMissionsError.message)
    const missionMap = new Map<number, number>()
    for (const mission of syncedMissions || []) if (typeof mission.contract_row_order === 'number') missionMap.set(mission.contract_row_order, mission.id)
    const { error: deleteRowsError } = await supabase.from('contract_mission_rows').delete().eq('contract_id', contractId)
    if (deleteRowsError) throw new Error(deleteRowsError.message)
    if (rows.length > 0) {
      const rowPayloads = rows.map((row)=>({ contract_id:contractId, linked_mission_id:missionMap.get(row.rowOrder) || null, mission_code:row.missionCode, service_code:row.serviceCode, service_type:row.serviceType, family_id:familyId, caregiver_id:row.caregiverId ? Number(row.caregiverId) : null, mission_date:row.missionDate || null, duration_hours:row.durationHours || null, start_time:row.startTime || null, end_time:row.endTime || null, row_order:row.rowOrder, status:'draft' }))
      const { error: rowsInsertError } = await supabase.from('contract_mission_rows').insert(rowPayloads)
      if (rowsInsertError) throw new Error(rowsInsertError.message)
    }
    redirect(`/contracts/${contractId}`)
  }

  return <main style={pageStyle}><div style={headerStyle}><div><div style={eyebrowStyle}>AngelCare • Contracts Engine</div><h1 style={titleStyle}>Modifier contrat #{contract.id}</h1><p style={subtitleStyle}>Ajuste le contrat et synchronise automatiquement les missions réelles liées.</p></div><Link href={`/contracts/${contract.id}`} style={secondaryButtonStyle}>← Retour contrat</Link></div><form action={updateContract} style={{ display:'grid', gap:22 }}><ContractPlannerClient families={families} caregivers={caregivers} contractTypeOptions={CONTRACT_TYPE_OPTIONS} statusOptions={STATUS_OPTIONS} initialServiceType={contract.service_type || ''} initialFamilyId={contract.family_id ? String(contract.family_id) : ''} initialPreferredCaregiverId={contract.preferred_caregiver_id ? String(contract.preferred_caregiver_id) : ''} initialRows={existingRows} /><div style={saveBarStyle}><button type="submit" style={saveButtonStyle}>Sauvegarder contrat + resynchroniser missions</button></div></form></main>
}
const pageStyle: React.CSSProperties = { padding:32, fontFamily:'Arial, sans-serif', background:'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)', minHeight:'100vh' }
const headerStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:20, flexWrap:'wrap', marginBottom:24 }
const eyebrowStyle: React.CSSProperties = { display:'inline-block', padding:'6px 10px', borderRadius:999, background:'#e2e8f0', color:'#334155', fontSize:12, fontWeight:800, marginBottom:10 }
const titleStyle: React.CSSProperties = { margin:0, fontSize:40, lineHeight:1.05, color:'#0f172a', fontWeight:800 }
const subtitleStyle: React.CSSProperties = { color:'#475569', margin:'10px 0 0 0', fontSize:17, maxWidth:850 }
const secondaryButtonStyle: React.CSSProperties = { background:'white', color:'#0f172a', padding:'12px 16px', borderRadius:12, textDecoration:'none', fontWeight:800, border:'1px solid #cbd5e1' }
const saveBarStyle: React.CSSProperties = { display:'flex', justifyContent:'flex-end', marginTop:4 }
const saveButtonStyle: React.CSSProperties = { background:'#0f172a', color:'white', padding:'14px 18px', borderRadius:12, fontWeight:800, border:'none', cursor:'pointer' }