import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateAdvancedMission } from './updateAdvancedAction'
import MissionBuilderClient from './MissionBuilderClient'

type RouteLine = {
  operation_label: string
  mission_date: string
  outbound_departure: string
  outbound_arrival: string
  return_departure: string
  return_arrival: string
}

type ParameterDayLine = {
  session_date: string
  session_time: string
  module_theme: string
}

type ProgramLine = {
  session_label: string
  session_datetime_label: string
  theme_module: string
  ct_label: string
  m1: string
  m2: string
  m3: string
  short_break: string
  meal_break: string
  code_atelier: string
  notes: string
}

function repeatToLength<T>(items: T[], min: number, factory: () => T): T[] {
  const result = [...items]
  while (result.length < min) result.push(factory())
  return result
}

function emptyRoute(): RouteLine {
  return {
    operation_label: '',
    mission_date: '',
    outbound_departure: '',
    outbound_arrival: '',
    return_departure: '',
    return_arrival: '',
  }
}

function emptyParameterDay(): ParameterDayLine {
  return {
    session_date: '',
    session_time: '',
    module_theme: '',
  }
}

function emptyProgramLine(): ProgramLine {
  return {
    session_label: '',
    session_datetime_label: '',
    theme_module: '',
    ct_label: '',
    m1: '',
    m2: '',
    m3: '',
    short_break: '',
    meal_break: '',
    code_atelier: '',
    notes: '',
  }
}

const FORFAIT_OPTIONS = ['1 session', '2 sessions', '4 sessions', '8 sessions', '12 sessions']
const HOURLY_OPTIONS = ['03 heures', '05 heures', '08 heures']
const TYPE_SERVICE_OPTIONS = [
  'Animation à domicile',
  'Atelier à domicile',
  'Animation événement',
  'Station kidsclub',
  'Home school',
  'Station',
]
const CHILDREN_RANGE_OPTIONS = ['1 pax', '2 pax - 5 pax', '5 pax - 10 pax', '+10 pax']
const PARTICIPANT_PROFILE_OPTIONS = ['01 ans - 03 ans', '03 ans - 06 ans', '+06 ans']
const CLIENT_TYPE_OPTIONS = ['B2C', 'B2B']
const CLIENT_PROFILE_OPTIONS = ['Nouveau', 'Silver', 'Gold', 'Platinum']
const TRANSPORT_BY_OPTIONS = ['ARTAB / ANGELCARE', 'STAFF']
const STATUS_OPTIONS = ['draft', 'assigned', 'confirmed', 'in_progress', 'completed', 'incident', 'cancelled']
const URGENCY_OPTIONS = ['normal', 'urgent']

export default async function EditAdvancedMissionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const missionId = Number(id)
  const supabase = await createClient()

  const [
    missionRes,
    routesRes,
    parametersRes,
    parameterDaysRes,
    transportRes,
    allowancesRes,
    programLinesRes,
  ] = await Promise.all([
    supabase
      .from('missions')
      .select('*')
      .eq('id', missionId)
      .eq('is_archived', false)
      .maybeSingle(),
    supabase.from('mission_routes').select('*').eq('mission_id', missionId).order('line_order', { ascending: true }),
    supabase.from('mission_parameters').select('*').eq('mission_id', missionId).maybeSingle(),
    supabase.from('mission_parameter_days').select('*').eq('mission_id', missionId).order('line_order', { ascending: true }),
    supabase.from('mission_transport').select('*').eq('mission_id', missionId).maybeSingle(),
    supabase.from('mission_allowances').select('*').eq('mission_id', missionId).maybeSingle(),
    supabase.from('mission_program_lines').select('*').eq('mission_id', missionId).order('line_order', { ascending: true }),
  ])

  const mission = missionRes.data
  if (missionRes.error) {
    return <main style={{ padding: 32 }}>Erreur : {missionRes.error.message}</main>
  }

  if (!mission) {
    return (
      <main style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
        <h1>Mission introuvable</h1>
        <Link href="/missions" style={secondaryButtonStyle}>← Retour aux missions</Link>
      </main>
    )
  }

  const routes = repeatToLength(
    (routesRes.data || []).map((r: any) => ({
      operation_label: r.operation_label || '',
      mission_date: r.mission_date || '',
      outbound_departure: r.outbound_departure || '',
      outbound_arrival: r.outbound_arrival || '',
      return_departure: r.return_departure || '',
      return_arrival: r.return_arrival || '',
    })),
    1,
    emptyRoute
  )

  const parameterDays = repeatToLength(
    (parameterDaysRes.data || []).map((d: any) => ({
      session_date: d.session_date || '',
      session_time: d.session_time || '',
      module_theme: d.module_theme || '',
    })),
    1,
    emptyParameterDay
  )

  const programLines = repeatToLength(
    (programLinesRes.data || []).map((p: any) => ({
      session_label: p.session_label || '',
      session_datetime_label: p.session_datetime_label || '',
      theme_module: p.theme_module || '',
      ct_label: p.ct_label || '',
      m1: p.m1 || '',
      m2: p.m2 || '',
      m3: p.m3 || '',
      short_break: p.short_break || '',
      meal_break: p.meal_break || '',
      code_atelier: p.code_atelier || '',
      notes: p.notes || '',
    })),
    1,
    emptyProgramLine
  )

  const parameters = parametersRes.data
  const transport = transportRes.data
  const allowances = allowancesRes.data

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Mission Sheet Builder V2</div>
          <h1 style={titleStyle}>Éditer ordre de mission #{mission.id}</h1>
          <p style={subtitleStyle}>
            Configuration avancée, lignes dynamiques, paramètres, indemnités et programme.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href={`/missions/${mission.id}`} style={secondaryButtonStyle}>
            ← Retour fiche mission
          </Link>
        </div>
      </div>

      <form action={updateAdvancedMission} style={{ display: 'grid', gap: 20 }}>
        <input type="hidden" name="mission_id" value={mission.id} />

        <MissionBuilderClient
          initialRoutes={routes}
          initialParameterDays={parameterDays}
          initialProgramLines={programLines}
        />

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Informations principales mission</h2>
          <div style={threeColGridStyle}>
            <Field label="Référence mission" name="mission_reference" defaultValue={mission.mission_reference || ''} />
            <Field label="Service" name="service_type" defaultValue={mission.service_type || ''} />
            <Field label="Date mission" name="mission_date" type="date" defaultValue={mission.mission_date || ''} />
            <Field label="Heure début" name="start_time" type="time" defaultValue={mission.start_time || ''} />
            <Field label="Heure fin" name="end_time" type="time" defaultValue={mission.end_time || ''} />
            <SelectField label="Statut" name="status" defaultValue={mission.status || 'draft'} options={STATUS_OPTIONS} />
            <SelectField label="Urgence" name="urgency" defaultValue={mission.urgency || 'normal'} options={URGENCY_OPTIONS} />
            <Field label="Ville" name="city" defaultValue={mission.city || ''} />
            <Field label="Zone" name="zone" defaultValue={mission.zone || ''} />
          </div>

          <div style={{ marginTop: 14 }}>
            <TextAreaField label="Notes mission" name="notes" defaultValue={mission.notes || ''} />
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>1. Missionnaire</h2>
          <div style={twoColGridStyle}>
            <Field label="Staff ID" name="staff_id" defaultValue={mission.staff_id || ''} />
            <Field label="Grade Level" name="grade_level" defaultValue={mission.grade_level || ''} />
            <Field label="Statut staff" name="staff_status" defaultValue={mission.staff_status || ''} />
            <Field label="Mobile" name="mobile" defaultValue={mission.mobile || ''} />
            <Field label="Adresse personnelle" name="personal_address" defaultValue={mission.personal_address || ''} />
            <Field label="Adresse domicile" name="home_address" defaultValue={mission.home_address || ''} />
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>3. Objet de la mission / Paramètre</h2>
          <div style={threeColGridStyle}>
            <TextAreaField label="Motif mission" name="mission_reason" defaultValue={parameters?.mission_reason || ''} />
            <Field label="N° dossier" name="dossier_number" defaultValue={parameters?.dossier_number || ''} />
            <SelectField label="Type client" name="client_type" defaultValue={parameters?.client_type || ''} options={CLIENT_TYPE_OPTIONS} />
            <Field label="Désignation" name="designation" defaultValue={parameters?.designation || ''} />
            <Field label="Nom client" name="client_name" defaultValue={parameters?.client_name || ''} />
            <Field label="Adresse client" name="client_address" defaultValue={parameters?.client_address || ''} />
            <Field label="Ville client" name="client_city" defaultValue={parameters?.client_city || ''} />
            <SelectField label="Profil client" name="client_profile" defaultValue={parameters?.client_profile || ''} options={CLIENT_PROFILE_OPTIONS} />
            <SelectField label="Forfait" name="forfait" defaultValue={parameters?.forfait || ''} options={FORFAIT_OPTIONS} />
            <SelectField label="Option horaire" name="hourly_option" defaultValue={parameters?.hourly_option || ''} options={HOURLY_OPTIONS} />
            <SelectField label="Type service" name="type_service" defaultValue={parameters?.type_service || ''} options={TYPE_SERVICE_OPTIONS} />
            <SelectField label="Nombre enfant" name="children_range" defaultValue={parameters?.children_range || ''} options={CHILDREN_RANGE_OPTIONS} />
            <SelectField label="Profil participant(s)" name="participant_profile" defaultValue={parameters?.participant_profile || ''} options={PARTICIPANT_PROFILE_OPTIONS} />
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>4. Moyen de transport</h2>
          <div style={threeColGridStyle}>
            <SelectField label="Transport assuré par" name="transport_by" defaultValue={transport?.transport_by || ''} options={TRANSPORT_BY_OPTIONS} />
            <CheckField label="Train" name="train" defaultChecked={!!transport?.train} />
            <CheckField label="Avion" name="airplane" defaultChecked={!!transport?.airplane} />
            <CheckField label="Taxi" name="taxi" defaultChecked={!!transport?.taxi} />
            <CheckField label="Chauffeur privé" name="private_driver" defaultChecked={!!transport?.private_driver} />
            <CheckField label="Bus / Autocar" name="bus" defaultChecked={!!transport?.bus} />
            <Field label="Infos taxi" name="taxi_info" defaultValue={transport?.taxi_info || ''} />
            <Field label="Infos train" name="train_info" defaultValue={transport?.train_info || ''} />
            <CheckField label="Billet à commander" name="ticket_to_order" defaultChecked={!!transport?.ticket_to_order} />
            <CheckField label="Billet à rembourser" name="ticket_to_reimburse" defaultChecked={!!transport?.ticket_to_reimburse} />
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>5. Indemnités de mission</h2>
          <div style={threeColGridStyle}>
            <CheckField label="Collect directe" name="direct_collection" defaultChecked={!!allowances?.direct_collection} />
            <CheckField label="Collect mensuelle" name="monthly_collection" defaultChecked={!!allowances?.monthly_collection} />
            <CheckField label="Honoraires par heure" name="hourly_fee" defaultChecked={!!allowances?.hourly_fee} />
            <CheckField label="Par mission" name="per_mission" defaultChecked={!!allowances?.per_mission} />
            <Field label="Grade / honoraire" name="grade_fee" defaultValue={allowances?.grade_fee || ''} />
            <CheckField label="Indemnités repas" name="meal_allowance" defaultChecked={!!allowances?.meal_allowance} />
            <CheckField label="Hébergement remboursé" name="lodging_reimbursed" defaultChecked={!!allowances?.lodging_reimbursed} />
            <CheckField label="Hébergement non remboursé" name="lodging_not_reimbursed" defaultChecked={!!allowances?.lodging_not_reimbursed} />
          </div>

          <div style={{ marginTop: 14 }}>
            <TextAreaField label="Notes manuelles" name="manual_notes" defaultValue={allowances?.manual_notes || ''} />
          </div>
        </section>

        <div style={saveBarStyle}>
          <button type="submit" style={saveButtonStyle}>
            💾 Sauvegarder mission
          </button>
        </div>
      </form>
    </main>
  )
}

function Field({
  label,
  name,
  defaultValue = '',
  type = 'text',
}: {
  label: string
  name: string
  defaultValue?: string
  type?: string
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <input name={name} defaultValue={defaultValue} type={type} style={inputStyle} />
    </label>
  )
}

function SelectField({
  label,
  name,
  defaultValue = '',
  options,
}: {
  label: string
  name: string
  defaultValue?: string
  options: string[]
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <select name={name} defaultValue={defaultValue} style={inputStyle}>
        <option value="">Choisir</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextAreaField({
  label,
  name,
  defaultValue = '',
}: {
  label: string
  name: string
  defaultValue?: string
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <textarea name={name} defaultValue={defaultValue} style={textAreaStyle} />
    </label>
  )
}

function CheckField({
  label,
  name,
  defaultChecked = false,
}: {
  label: string
  name: string
  defaultChecked?: boolean
}) {
  return (
    <label style={checkFieldStyle}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  )
}

const pageStyle: React.CSSProperties = {
  padding: 32,
  fontFamily: 'Arial, sans-serif',
  background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
  minHeight: '100vh',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 20,
  flexWrap: 'wrap',
  marginBottom: 24,
}

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: 999,
  background: '#e2e8f0',
  color: '#334155',
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 10,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 38,
  lineHeight: 1.05,
  color: '#0f172a',
  fontWeight: 800,
}

const subtitleStyle: React.CSSProperties = {
  color: '#475569',
  margin: '10px 0 0 0',
  fontSize: 17,
}

const panelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 24,
  padding: 24,
  border: '1px solid #dbe3ee',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
}

const panelTitleStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 800,
}

const threeColGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 14,
}

const twoColGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
}

const fieldWrapStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const fieldLabelStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  boxSizing: 'border-box',
  background: 'white',
  color: '#0f172a',
}

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  resize: 'vertical',
}

const checkFieldStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  padding: 12,
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  color: '#0f172a',
  fontWeight: 600,
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'white',
  color: '#0f172a',
  padding: '12px 16px',
  borderRadius: 12,
  textDecoration: 'none',
  fontWeight: 800,
  border: '1px solid #cbd5e1',
}

const saveBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 4,
}

const saveButtonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  padding: '14px 18px',
  borderRadius: 12,
  fontWeight: 800,
  border: 'none',
  cursor: 'pointer',
}
