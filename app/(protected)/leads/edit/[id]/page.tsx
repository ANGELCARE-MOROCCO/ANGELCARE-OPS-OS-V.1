import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateLead } from './update-action'

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const leadId = Number(id)
  const supabase = await createClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle()

  if (error) {
    return <main style={{ padding: 32 }}>Erreur : {error.message}</main>
  }

  if (!lead) {
    return (
      <main style={pageStyle}>
        <h1>Lead introuvable</h1>
        <Link href="/leads" style={secondaryButtonStyle}>← Retour aux leads</Link>
      </main>
    )
  }

  const serviceInterests = Array.isArray(lead.service_interests)
    ? lead.service_interests
    : []

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Lead Edit</div>
          <h1 style={titleStyle}>Modifier lead #{lead.id}</h1>
          <p style={subtitleStyle}>
            Mise à jour CRM du lead avant conversion en mission.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href={`/leads/${lead.id}`} style={secondaryButtonStyle}>
            ← Retour fiche lead
          </Link>
          <Link href="/leads" style={secondaryButtonStyle}>
            Liste leads
          </Link>
        </div>
      </div>

      <form action={updateLead} style={{ display: 'grid', gap: 20 }}>
        <input type="hidden" name="id" value={lead.id} />

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Informations principales</h2>
          <div style={threeColGridStyle}>
            <Field label="Nom parent" name="parent_name" defaultValue={lead.parent_name || ''} />
            <Field label="Téléphone" name="phone" defaultValue={lead.phone || ''} />
            <Field label="Ville" name="city" defaultValue={lead.city || ''} />
            <Field label="Source" name="source" defaultValue={lead.source || ''} />
            <SelectField
              label="Urgence"
              name="urgency"
              defaultValue={lead.urgency || 'normal'}
              options={['normal', 'urgent']}
            />
            <SelectField
              label="Statut"
              name="status"
              defaultValue={lead.status || 'new'}
              options={['new', 'contacted', 'qualified', 'matching', 'converted']}
            />
            <Field
              label="Nombre enfants"
              name="children_count"
              type="number"
              defaultValue={String(lead.children_count || 0)}
            />
            <Field label="Âges enfants" name="children_ages" defaultValue={lead.children_ages || ''} />
            <Field label="Créneaux préférés" name="preferred_schedule" defaultValue={lead.preferred_schedule || ''} />
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Service demandé</h2>
          <div style={twoColGridStyle}>
            <Field
              label="Service principal"
              name="service_needed"
              defaultValue={lead.service_needed || ''}
            />
            <Field
              label="Besoins spécifiques"
              name="special_needs"
              defaultValue={lead.special_needs || ''}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={fieldLabelStyle}>Intérêts service</div>
            <div style={checkGridStyle}>
              {[
                'Garde et accompagnement enfants à domicile',
                'Garde bébé post accouchement',
                'Enfant spécial domicile',
                'Enfant spécial école',
                'Enfant spécial hybride',
                'Animation ludique à domicile',
                'Animation anniversaire',
                'Animation fêtes',
                'Excursion',
                'AngelCare Academy',
                'Flashcartes',
              ].map((item) => (
                <label key={item} style={checkFieldStyle}>
                  <input
                    type="checkbox"
                    name="service_interests"
                    value={item}
                    defaultChecked={serviceInterests.includes(item)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Notes CRM</h2>
          <TextAreaField
            label="Timeline / note CRM"
            name="timeline_note"
            defaultValue={lead.timeline_note || ''}
          />
        </section>

        <div style={saveBarStyle}>
          <button type="submit" style={saveButtonStyle}>
            💾 Sauvegarder lead
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

const checkGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  marginTop: 8,
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
  minHeight: 120,
  resize: 'vertical',
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