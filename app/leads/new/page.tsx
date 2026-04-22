import Link from 'next/link'
import { createLead } from './actions'

const cities = ['Casablanca', 'Rabat', 'Kénitra', 'Marrakech', 'Tanger', 'Mohammédia']

const sources = ['WhatsApp', 'Appel', 'Facebook', 'Instagram']

const services = [
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

export default function NewLeadPage() {
  return (
    <main style={{ padding: 32, fontFamily: 'Arial, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: 'white', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0 }}>Nouveau lead</h1>
            <p style={{ color: '#64748b' }}>Créer une nouvelle demande entrante AngelCare</p>
          </div>
          <Link href="/leads" style={secondaryButtonStyle}>← Retour</Link>
        </div>

        <form action={createLead} style={{ display: 'grid', gap: 24 }}>
          <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Informations principales</h3>
            <div style={grid2}>
              <input name="parent_name" placeholder="Nom du parent" style={inputStyle} required />
              <input name="phone" placeholder="Téléphone" style={inputStyle} required />
              <select name="city" style={inputStyle} required defaultValue="">
                <option value="" disabled>Choisir une ville</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <select name="source" style={inputStyle} defaultValue="">
                <option value="" disabled>Source du lead</option>
                {sources.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
              <select name="urgency" style={inputStyle} defaultValue="normal">
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
              <input name="preferred_schedule" placeholder="Créneaux souhaités" style={inputStyle} />
              <input name="children_count" type="number" placeholder="Nombre d’enfants" style={inputStyle} />
              <input name="children_ages" placeholder="Âges des enfants" style={inputStyle} />
            </div>
          </section>

          <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Intérêt du lead</h3>
            <div style={checkboxGrid}>
              {services.map((service) => (
                <label key={service} style={checkCardStyle}>
                  <input type="checkbox" name="service_interests" value={service} />
                  <span>{service}</span>
                </label>
              ))}
            </div>
          </section>

          <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Contexte et besoins</h3>
            <textarea
              name="special_needs"
              placeholder="Besoins spécifiques / contexte / détails utiles"
              style={{ ...inputStyle, minHeight: 120 }}
            />
            <textarea
              name="timeline_note"
              placeholder="Premier commentaire / note CRM / résumé de l’échange"
              style={{ ...inputStyle, minHeight: 120, marginTop: 12 }}
            />
          </section>

          <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Actions à traiter</h3>
            <div style={checkboxGrid}>
              <label style={checkCardStyle}>
                <input type="checkbox" name="offer_needed" />
                <span>Établir offre</span>
              </label>
              <label style={checkCardStyle}>
                <input type="checkbox" name="quote_needed" />
                <span>Devis à envoyer</span>
              </label>
              <label style={checkCardStyle}>
                <input type="checkbox" name="product_explanation_needed" />
                <span>Programme / explication produits nécessaire</span>
              </label>
            </div>
          </section>

          <section style={sectionStyle}>
            <h3 style={sectionTitleStyle}>Rappel</h3>
            <div style={grid3}>
              <input name="reminder_reason" placeholder="Raison du rappel" style={inputStyle} />
              <input name="reminder_date" type="date" style={inputStyle} />
              <input name="reminder_time" type="time" style={inputStyle} />
            </div>
          </section>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/leads" style={secondaryButtonStyle}>Annuler</Link>
            <button type="submit" style={buttonStyle}>Créer le lead</button>
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

const grid3: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.5fr 1fr 1fr',
  gap: 12,
}

const checkboxGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
}

const checkCardStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  padding: 14,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: 'white',
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
  cursor: 'pointer',
  textDecoration: 'none',
}
