import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ContractPlannerClient from './ContractPlannerClient'

const CONTRACT_TYPE_OPTIONS = ['one_shot', 'monthly_package']
const STATUS_OPTIONS = ['draft', 'active', 'paused', 'completed', 'cancelled']

type Family = {
  id: number
  family_name?: string | null
  parent_name?: string | null
  city?: string | null
  zone?: string | null
}

type Caregiver = {
  id: number
  full_name?: string | null
  city?: string | null
  current_status?: string | null
  status?: string | null
  skill_tags?: string[] | null
}

type PlannerRowPayload = {
  rowOrder: number
  missionCode: string
  serviceCode: string
  serviceType: string
  missionDate: string
  durationHours: number
  startTime: string
  endTime: string
  caregiverId: number | null
}

async function buildPlannerRows(formData: FormData) {
  const rowCount = Number(formData.get('row_count') || 0)
  const rows: PlannerRowPayload[] = []
  for (let i = 0; i < rowCount; i++) {
    const missionCode = String(formData.get(`row_mission_code_${i}`) || '')
    const serviceCode = String(formData.get(`row_service_code_${i}`) || '')
    const serviceType = String(formData.get(`row_service_type_${i}`) || '')
    const missionDate = String(formData.get(`row_date_${i}`) || '')
    const durationHours = Number(formData.get(`row_duration_${i}`) || 0)
    const startTime = String(formData.get(`row_start_${i}`) || '')
    const endTime = String(formData.get(`row_end_${i}`) || '')
    const caregiverIdRaw = String(formData.get(`row_caregiver_id_${i}`) || '')
    if (!missionCode && !missionDate && !startTime && !endTime) continue
    rows.push({ rowOrder: i + 1, missionCode, serviceCode, serviceType, missionDate, durationHours, startTime, endTime, caregiverId: caregiverIdRaw ? Number(caregiverIdRaw) : null })
  }
  return rows
}

export default async function NewContractPage() {
  const supabase = await createClient()
  const [familiesRes, caregiversRes] = await Promise.all([
    supabase.from('families').select('id, family_name, parent_name, city, zone').eq('is_archived', false).order('id', { ascending: false }),
    supabase.from('caregivers').select('id, full_name, city, current_status, status, skill_tags').eq('is_archived', false).order('full_name', { ascending: true }),
  ])
  const families = (familiesRes.data || []) as Family[]
  const caregivers = (caregiversRes.data || []) as Caregiver[]

  async function createContractWithRows(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const familyIdRaw = String(formData.get('family_id') || '')
    const preferredCaregiverIdRaw = String(formData.get('preferred_caregiver_id') || '')
    const familyId = familyIdRaw ? Number(familyIdRaw) : null
    const contractPayload = {
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
      is_archived: false,
    }
    const { data: contract, error: contractError } = await supabase.from('contracts').insert([contractPayload]).select().single()
    if (contractError) throw new Error(contractError.message)
    const familyRecord = familyId ? await supabase.from('families').select('city, zone').eq('id', familyId).maybeSingle() : { data: null }
    const rows = await buildPlannerRows(formData)
    const missionPayloads = rows.map((row) => ({
      contract_id: contract.id,
      contract_row_order: row.rowOrder,
      mission_code: row.missionCode,
      family_id: familyId,
      caregiver_id: row.caregiverId,
      service_type: row.serviceType,
      mission_date: row.missionDate || null,
      start_time: row.startTime || null,
      end_time: row.endTime || null,
      duration_hours: row.durationHours || null,
      status: 'draft', urgency: 'normal',
      city: familyRecord.data?.city || null,
      zone: familyRecord.data?.zone || null,
      notes: `Mission générée automatiquement depuis contrat #${contract.id}`,
    }))
    const missionMap = new Map<number, number>()
    if (missionPayloads.length > 0) {
      const { data: missions, error: missionsError } = await supabase.from('missions').insert(missionPayloads).select('id, contract_row_order')
      if (missionsError) throw new Error(missionsError.message)
      for (const mission of missions || []) if (typeof mission.contract_row_order === 'number') missionMap.set(mission.contract_row_order, mission.id)
    }
    const rowPayloads = rows.map((row) => ({
      contract_id: contract.id,
      linked_mission_id: missionMap.get(row.rowOrder) || null,
      mission_code: row.missionCode,
      service_code: row.serviceCode,
      service_type: row.serviceType,
      family_id: familyId,
      caregiver_id: row.caregiverId,
      mission_date: row.missionDate || null,
      duration_hours: row.durationHours || null,
      start_time: row.startTime || null,
      end_time: row.endTime || null,
      row_order: row.rowOrder,
      status: 'draft',
    }))
    if (rowPayloads.length > 0) {
      const { error: rowsError } = await supabase.from('contract_mission_rows').insert(rowPayloads)
      if (rowsError) throw new Error(rowsError.message)
    }
    redirect(`/contracts/${contract.id}`)
  }

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Premium Contract Builder</div>
          <h1 style={titleStyle}>Nouveau contrat premium</h1>
          <p style={subtitleStyle}>Crée un contrat, lie la famille, définis le service, puis planifie chaque mission avec code automatique, durée, horaire et caregiver dédiée.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><Link href="/contracts" style={secondaryButtonStyle}>← Retour contrats</Link></div>
      </div>
      <form action={createContractWithRows} style={{ display: 'grid', gap: 22 }}>
        <ContractPlannerClient families={families} caregivers={caregivers} contractTypeOptions={CONTRACT_TYPE_OPTIONS} statusOptions={STATUS_OPTIONS} />
        <div style={saveBarStyle}><button type="submit" style={saveButtonStyle}>Créer contrat + missions réelles</button></div>
      </form>
    </main>
  )
}

const pageStyle: React.CSSProperties = { padding: 32, fontFamily: 'Arial, sans-serif', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)', minHeight: '100vh' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 24 }
const eyebrowStyle: React.CSSProperties = { display: 'inline-block', padding: '6px 10px', borderRadius: 999, background: '#e2e8f0', color: '#334155', fontSize: 12, fontWeight: 800, marginBottom: 10 }
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 40, lineHeight: 1.05, color: '#0f172a', fontWeight: 800 }
const subtitleStyle: React.CSSProperties = { color: '#475569', margin: '10px 0 0 0', fontSize: 17, maxWidth: 850 }
const secondaryButtonStyle: React.CSSProperties = { background: 'white', color: '#0f172a', padding: '12px 16px', borderRadius: 12, textDecoration: 'none', fontWeight: 800, border: '1px solid #cbd5e1' }
const saveBarStyle: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', marginTop: 4 }
const saveButtonStyle: React.CSSProperties = { background: '#0f172a', color: 'white', padding: '14px 18px', borderRadius: 12, fontWeight: 800, border: 'none', cursor: 'pointer' }