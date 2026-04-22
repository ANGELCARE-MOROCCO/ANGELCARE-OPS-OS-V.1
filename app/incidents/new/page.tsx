import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewIncidentPage() {
  const supabase = await createClient()

  const [missionsRes, caregiversRes, familiesRes, leadsRes] = await Promise.all([
    supabase.from('missions').select('id, service_type').order('id', { ascending: false }).limit(100),
    supabase.from('caregivers').select('id, full_name').order('full_name', { ascending: true }).limit(100),
    supabase.from('families').select('id, family_name, parent_name').order('id', { ascending: false }).limit(100),
    supabase.from('leads').select('id, parent_name').order('id', { ascending: false }).limit(100),
  ])

  const missions = missionsRes.data || []
  const caregivers = caregiversRes.data || []
  const families = familiesRes.data || []
  const leads = leadsRes.data || []

  async function createIncident(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const incident_title = String(formData.get('incident_title') || '')
    const incident_type = String(formData.get('incident_type') || '')
    const severity = String(formData.get('severity') || 'medium')
    const status = String(formData.get('status') || 'open')
    const source_module = String(formData.get('source_module') || '')
    const description = String(formData.get('description') || '')
    const resolution_notes = String(formData.get('resolution_notes') || '')
    const assigned_to = String(formData.get('assigned_to') || '')
    const created_by = String(formData.get('created_by') || 'AngelCare OpsOS')

    const mission_id_raw = String(formData.get('mission_id') || '')
    const caregiver_id_raw = String(formData.get('caregiver_id') || '')
    const family_id_raw = String(formData.get('family_id') || '')
    const lead_id_raw = String(formData.get('lead_id') || '')

    const mission_id = mission_id_raw ? Number(mission_id_raw) : null
    const caregiver_id = caregiver_id_raw ? Number(caregiver_id_raw) : null
    const family_id = family_id_raw ? Number(family_id_raw) : null
    const lead_id = lead_id_raw ? Number(lead_id_raw) : null

    const resolved_at =
      status === 'resolved' || status === 'closed' ? new Date().toISOString() : null

    const { data, error } = await supabase
      .from('incidents')
      .insert([
        {
          incident_title,
          incident_type,
          severity,
          status,
          source_module,
          mission_id,
          caregiver_id,
          family_id,
          lead_id,
          description,
          resolution_notes,
          assigned_to,
          created_by,
          resolved_at,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(error.message)

    redirect(`/incidents/${data.id}`)
  }

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Incidents Center</div>
          <h1 style={titleStyle}>Nouvel incident</h1>
          <p style={subtitleStyle}>
            Créer un incident et le relier aux modules opérationnels concernés.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/incidents" style={secondaryButtonStyle}>
            ← Retour incidents
          </Link>
        </div>
      </div>

      <form action={createIncident} style={formGridStyle}>
        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Informations incident</h2>
          <div style={twoColGridStyle}>
            <Field label="Titre incident" name="incident_title" />
            <Field label="Type incident" name="incident_type" />
            <SelectField
              label="Sévérité"
              name="severity"
              defaultValue="medium"
              options={['low', 'medium', 'high', 'critical']}
            />
            <SelectField
              label="Statut"
              name="status"
              defaultValue="open"
              options={['open', 'in_progress', 'resolved', 'closed']}
            />
            <Field label="Module source" name="source_module" />
            <Field label="Assigné à" name="assigned_to" />
            <Field label="Créé par" name="created_by" defaultValue="AngelCare OpsOS" />
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Liens opérationnels</h2>
          <div style={twoColGridStyle}>
            <SelectLinkedField
              label="Mission liée"
              name="mission_id"
              placeholder="Aucune mission"
              options={missions.map((m: any) => ({
                value: String(m.id),
                label: `#${m.id} • ${m.service_type || 'Mission AngelCare'}`,
              }))}
            />

            <SelectLinkedField
              label="Caregiver lié"
              name="caregiver_id"
              placeholder="Aucun caregiver"
              options={caregivers.map((c: any) => ({
                value: String(c.id),
                label: `#${c.id} • ${c.full_name || 'Caregiver sans nom'}`,
              }))}
            />

            <SelectLinkedField
              label="Famille liée"
              name="family_id"
              placeholder="Aucune famille"
              options={families.map((f: any) => ({
                value: String(f.id),
                label: `#${f.id} • ${f.family_name || f.parent_name || 'Famille sans nom'}`,
              }))}
            />

            <SelectLinkedField
              label="Lead lié"
              name="lead_id"
              placeholder="Aucun lead"
              options={leads.map((l: any) => ({
                value: String(l.id),
                label: `#${l.id} • ${l.parent_name || 'Lead sans nom'}`,
              }))}
            />
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Contenu</h2>
          <div style={singleColGridStyle}>
            <TextAreaField label="Description" name="description" />
            <TextAreaField label="Notes de résolution" name="resolution_notes" />
          </div>
        </section>

        <div style={saveBarStyle}>
          <button type="submit" style={buttonStyle}>
            + Créer incident
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
}: {
  label: string
  name: string
  defaultValue?: string
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <input name={name} defaultValue={defaultValue} style={inputStyle} />
    </label>
  )
}

function SelectField({
  label,
  name,
  defaultValue,
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function SelectLinkedField({
  label,
  name,
  placeholder,
  options,
}: {
  label: string
  name: string
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <select name={name} defaultValue="" style={inputStyle}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextAreaField({
  label,
  name,
}: {
  label: string
  name: string
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <textarea name={name} style={textAreaStyle} />
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
  fontSize: 40,
  lineHeight: 1.05,
  color: '#0f172a',
  fontWeight: 800,
}

const subtitleStyle: React.CSSProperties = {
  color: '#475569',
  margin: '10px 0 0 0',
  fontSize: 17,
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 20,
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

const twoColGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
}

const singleColGridStyle: React.CSSProperties = {
  display: 'grid',
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

const saveBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
}

const buttonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  padding: '12px 16px',
  borderRadius: 12,
  textDecoration: 'none',
  fontWeight: 800,
  border: 'none',
  cursor: 'pointer',
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