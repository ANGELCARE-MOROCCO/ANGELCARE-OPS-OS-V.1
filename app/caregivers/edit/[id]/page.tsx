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

export default async function EditCaregiverPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const caregiverId = Number(id)

  const supabase = await createClient()

  const { data: caregiver, error } = await supabase
    .from('caregivers')
    .select('*')
    .eq('id', caregiverId)
    .maybeSingle()

  if (error) {
    return <main style={{ padding: 32 }}>Erreur : {error.message}</main>
  }

  if (!caregiver) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Intervenante introuvable</h1>
        <Link href="/caregivers">← Retour</Link>
      </main>
    )
  }

  const languageTags = Array.isArray(caregiver.language_tags) ? caregiver.language_tags : []
  const skillTags = Array.isArray(caregiver.skill_tags) ? caregiver.skill_tags : []

  async function updateCaregiver(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const full_name = String(formData.get('full_name') || '')
    const phone = String(formData.get('phone') || '')
    const city = String(formData.get('city') || '')
    const zone = String(formData.get('zone') || '')
    const skills_summary = String(formData.get('skills_summary') || '')
    const current_status = String(formData.get('current_status') || 'available')
    const language_tags = formData.getAll('language_tags').map(String)
    const skill_tags = formData.getAll('skill_tags').map(String)

    const { error } = await supabase
      .from('caregivers')
      .update({
        full_name,
        phone,
        city,
        zone,
        skills_summary,
        current_status,
        language_tags,
        skill_tags,
      })
      .eq('id', caregiverId)

    if (error) throw new Error(error.message)

    redirect(`/caregivers/${caregiverId}`)
  }

  return (
    <main style={pageStyle}>
      <h1 style={titleStyle}>Modifier intervenante #{caregiver.id}</h1>

      <form action={updateCaregiver} style={formStyle}>
        <input
          name="full_name"
          defaultValue={caregiver.full_name || ''}
          placeholder="Nom complet"
          style={inputStyle}
        />

        <input
          name="phone"
          defaultValue={caregiver.phone || ''}
          placeholder="Téléphone"
          style={inputStyle}
        />

        <input
          name="city"
          defaultValue={caregiver.city || ''}
          placeholder="Ville"
          style={inputStyle}
        />

        <input
          name="zone"
          defaultValue={caregiver.zone || ''}
          placeholder="Zone"
          style={inputStyle}
        />

        <textarea
          name="skills_summary"
          defaultValue={caregiver.skills_summary || ''}
          placeholder="Compétences"
          style={textAreaStyle}
        />

        <select
          name="current_status"
          defaultValue={caregiver.current_status || 'available'}
          style={inputStyle}
        >
          <option value="available">available</option>
          <option value="assigned">assigned</option>
          <option value="in_mission">in_mission</option>
          <option value="absent">absent</option>
          <option value="blocked">blocked</option>
        </select>

        <section style={panelStyle}>
          <div style={sectionTitleStyle}>Langues parlées</div>
          <div style={checkGridStyle}>
            {LANGUAGE_OPTIONS.map((lang) => (
              <label key={lang} style={checkFieldStyle}>
                <input
                  type="checkbox"
                  name="language_tags"
                  value={lang}
                  defaultChecked={languageTags.includes(lang)}
                />
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
                <input
                  type="checkbox"
                  name="skill_tags"
                  value={skill.code}
                  defaultChecked={skillTags.includes(skill.code)}
                />
                <span>
                  <strong>{skill.code}</strong> — {skill.label}
                </span>
              </label>
            ))}
          </div>
        </section>

        <button type="submit" style={buttonStyle}>
          💾 Sauvegarder
        </button>
      </form>

      <Link href={`/caregivers/${caregiver.id}`} style={secondaryButtonStyle}>
        ← Retour profil
      </Link>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  padding: 32,
  fontFamily: 'Arial',
}

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  marginBottom: 20,
}

const formStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  maxWidth: 720,
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
  border: 'none',
  fontWeight: 700,
}

const secondaryButtonStyle: React.CSSProperties = {
  marginTop: 16,
  display: 'inline-block',
  padding: 10,
  border: '1px solid #ccc',
  borderRadius: 10,
  textDecoration: 'none',
}