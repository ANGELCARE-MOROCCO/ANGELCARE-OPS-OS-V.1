import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createMission } from '../actions'

const SERVICE_OPTIONS = [
  "Garde et accompagnement d'enfants à domicile",
  "Garde et accompagnement bébé post accouchement",
  "Garde et accompagnement d'enfant spécial à domicile",
  "Garde et accompagnement d'enfant spécial à l'école",
  "Garde et accompagnement d'enfant spécial hybride",
  "Animation et accompagnement ludique avancé à domicile",
  "Animation anniversaire",
  "Animation fêtes",
  "Excursion",
  "AngelCare Academy",
  "Flashcartes",
]

const CITY_OPTIONS = [
  'Casablanca',
  'Rabat',
  'Kénitra',
  'Marrakech',
  'Tanger',
  'Mohammédia',
]

export default async function NewMissionPage() {
  const supabase = await createClient()

  const { data: families } = await supabase
    .from('families')
    .select('*')
    .eq('is_archived', false)
    .order('parent_name', { ascending: true })

  const { data: caregivers } = await supabase
    .from('caregivers')
    .select('*')
    .order('full_name', { ascending: true })

  return (
    <main style={{ padding: 32, fontFamily: 'Arial, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: 'white', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0 }}>Nouvelle mission</h1>
            <p style={{ color: '#64748b' }}>Créer et assigner une intervention AngelCare</p>
          </div>
          <Link href="/missions" style={secondaryButtonStyle}>← Retour</Link>
        </div>

        <form action={createMission} style={{ display: 'grid', gap: 20 }}>
          <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Données principales</h3>
            <div style={grid2}>
              <select name="family_id" style={inputStyle} defaultValue="">
                <option value="">Choisir une famille</option>
                {families?.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.parent_name} {family.city ? `• ${family.city}` : ''}
                  </option>
                ))}
              </select>

              <select name="caregiver_id" style={inputStyle} defaultValue="">
                <option value="">Choisir une intervenante</option>
                {caregivers?.map((caregiver) => (
                  <option key={caregiver.id} value={caregiver.id}>
                    {caregiver.full_name} {caregiver.city ? `• ${caregiver.city}` : ''}
                  </option>
                ))}
              </select>

              <select name="service_type" style={inputStyle} required defaultValue="">
                <option value="" disabled>Choisir un service</option>
                {SERVICE_OPTIONS.map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>

              <select name="city" style={inputStyle} defaultValue="">
                <option value="">Choisir une ville</option>
                {CITY_OPTIONS.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <input name="zone" placeholder="Zone / secteur" style={inputStyle} />
              <input name="mission_date" type="date" style={inputStyle} required />

              <input name="start_time" type="time" style={inputStyle} />
              <input name="end_time" type="time" style={inputStyle} />

              <select name="status" style={inputStyle} defaultValue="draft">
                <option value="draft">Draft</option>
                <option value="assigned">Assigned</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="incident">Incident</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select name="urgency" style={inputStyle} defaultValue="normal">
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </section>

          <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Notes opérationnelles</h3>
            <textarea
              name="notes"
              placeholder="Consignes, contexte, détails mission, besoins famille..."
              style={{ ...inputStyle, minHeight: 120 }}
            />
          </section>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/missions" style={secondaryButtonStyle}>Annuler</Link>
            <button type="submit" style={buttonStyle}>Créer la mission</button>
          </div>
        </form>
      </div>
    </main>
  )
}

const sectionStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 16,
  border: '1px solid #e2e8f0',
  background: '#fcfdff',
}

const sectionTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
}

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontSize: 15,
  boxSizing: 'border-box',
}

const buttonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '12px 16px',
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'white',
  color: '#0f172a',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  padding: '12px 16px',
  fontWeight: 700,
  textDecoration: 'none',
}
