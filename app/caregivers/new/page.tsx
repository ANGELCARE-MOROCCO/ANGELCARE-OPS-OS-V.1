import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const LANGUAGE_OPTIONS = ['ARA', 'FRA', 'ENG']

const SKILL_OPTIONS = [
  { code: 'H.S', label: "Garde et accompagnement d'enfant à domicile" },
  { code: 'PP', label: 'Garde et accompagnement bébé post accouchement' },
  { code: 'SP', label: "Enfant spécial à domicile" },
  { code: 'SS', label: "Enfant spécial à l'école" },
  { code: 'SL', label: 'Animation et accompagnement ludique avancé à domicile' },
  { code: 'PT', label: 'Animation anniversaire' },
  { code: 'EX', label: 'Excursions' },
]

export default function NewCaregiverPage() {
  async function createCaregiver(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const full_name = String(formData.get('full_name') || '')
    const phone = String(formData.get('phone') || '')
    const city = String(formData.get('city') || '')
    const zone = String(formData.get('zone') || '')
    const skills_summary = String(formData.get('skills_summary') || '')
    const language_tags = formData.getAll('language_tags').map(String)
    const skill_tags = formData.getAll('skill_tags').map(String)

    const { error } = await supabase.from('caregivers').insert([
      {
        full_name,
        phone,
        city,
        zone,
        skills_summary,
        current_status: 'available',
        language_tags,
        skill_tags,
      },
    ])

    if (error) throw new Error(error.message)

    redirect('/caregivers')
  }

  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>Ajouter une intervenante</h1>

      <form action={createCaregiver} style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
        <input name="full_name" placeholder="Nom complet" style={inputStyle} required />
        <input name="phone" placeholder="Téléphone" style={inputStyle} />
        <input name="city" placeholder="Ville" style={inputStyle} />
        <input name="zone" placeholder="Zone" style={inputStyle} />
        <textarea name="skills_summary" placeholder="Résumé compétences" style={textAreaStyle} />

        <section style={panelStyle}>
          <div style={sectionTitleStyle}>Langues parlées</div>
          <div style={checkGridStyle}>
            {LANGUAGE_OPTIONS.map((lang) => (
              <label key={lang} style={checkFieldStyle}>
                <input type="checkbox" name="language_tags" value={lang} />
                <span>{lang}</span>
              </label>
            ))}
          </div>
        </section>

        <section style={panelStyle}>
          <div style={sectionTitleStyle}>Compétences mission</div>
          <div style={checkGridStyle}>
            {SKILL_OPTIONS.map((skill) => (
              <label key={skill.code} style={checkFieldStyle}>
                <input type="checkbox" name="skill_tags" value={skill.code} />
                <span>
                  <strong>{skill.code}</strong> — {skill.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        <button type="submit" style={buttonStyle}>
          Enregistrer
        </button>
      </form>

      <Link href="/caregivers" style={secondaryButtonStyle}>
        ← Retour
      </Link>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  padding: 32,
  fontFamily: 'Arial',
}

const titleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  marginBottom: 20,
}

const inputStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid #ccc',
}

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 100,
}

const panelStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#fcfdff',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  marginBottom: 12,
}

const checkGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
}

const checkFieldStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  padding: 10,
  border: '1px solid #e2e8f0',
  borderRadius: 10,
}

const buttonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  padding: 12,
  borderRadius: 10,
  fontWeight: 700,
  border: 'none',
}

const secondaryButtonStyle: React.CSSProperties = {
  marginTop: 16,
  display: 'inline-block',
  padding: 10,
  border: '1px solid #ccc',
  borderRadius: 10,
  textDecoration: 'none',
}