import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default function NewFamilyPage() {
  async function createFamily(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const family_name = String(formData.get('family_name') || '')
    const parent_name = String(formData.get('parent_name') || '')
    const phone = String(formData.get('phone') || '')
    const secondary_phone = String(formData.get('secondary_phone') || '')
    const city = String(formData.get('city') || '')
    const zone = String(formData.get('zone') || '')
    const address = String(formData.get('address') || '')
    const children_count = Number(formData.get('children_count') || 0)
    const children_ages = String(formData.get('children_ages') || '')
    const preferred_schedule = String(formData.get('preferred_schedule') || '')
    const service_preferences = String(formData.get('service_preferences') || '')
    const special_needs = String(formData.get('special_needs') || '')
    const source = String(formData.get('source') || '')
    const status = String(formData.get('status') || 'active')
    const notes = String(formData.get('notes') || '')

    const { data, error } = await supabase
      .from('families')
      .insert([
        {
          family_name,
          parent_name,
          phone,
          secondary_phone,
          city,
          zone,
          address,
          children_count,
          children_ages,
          preferred_schedule,
          service_preferences,
          special_needs,
          source,
          status,
          notes,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(error.message)

    redirect(`/families/${data.id}`)
  }

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Families CRM</div>
          <h1 style={titleStyle}>Nouvelle famille</h1>
          <p style={subtitleStyle}>
            Créer une fiche famille cliente avec ses coordonnées, enfants et préférences.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/families" style={secondaryButtonStyle}>
            ← Retour familles
          </Link>
        </div>
      </div>

      <form action={createFamily} style={formGridStyle}>
        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Informations principales</h2>
          <div style={twoColGridStyle}>
            <Field label="Nom de famille" name="family_name" />
            <Field label="Parent principal" name="parent_name" />
            <Field label="Téléphone" name="phone" />
            <Field label="Téléphone secondaire" name="secondary_phone" />
            <Field label="Ville" name="city" />
            <Field label="Zone" name="zone" />
            <Field label="Adresse" name="address" />
            <SelectField
              label="Statut"
              name="status"
              defaultValue="active"
              options={['active', 'pending', 'inactive', 'vip']}
            />
            <Field label="Source" name="source" />
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Enfants & besoins</h2>
          <div style={twoColGridStyle}>
            <Field label="Nombre enfants" name="children_count" type="number" />
            <Field label="Âges enfants" name="children_ages" />
            <Field label="Créneaux préférés" name="preferred_schedule" />
            <Field label="Préférences service" name="service_preferences" />
            <TextAreaField label="Besoins spécifiques" name="special_needs" />
          </div>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Notes CRM</h2>
          <TextAreaField label="Notes internes" name="notes" />
        </section>

        <div style={saveBarStyle}>
          <button type="submit" style={buttonStyle}>
            + Créer famille
          </button>
        </div>
      </form>
    </main>
  )
}

function Field({
  label,
  name,
  type = 'text',
}: {
  label: string
  name: string
  type?: string
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <input name={name} type={type} style={inputStyle} />
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