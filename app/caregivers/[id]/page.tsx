import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { archiveCaregiver } from '../archive-action'

export default async function CaregiverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const caregiverId = Number(id)
  const supabase = await createClient()

  const [
    caregiverRes,
    skillsRes,
    availabilityRes,
    notesRes,
    incidentsRes,
    checkinsRes,
    missionsRes,
  ] = await Promise.all([
    supabase.from('caregivers').select('*').eq('id', caregiverId).maybeSingle(),
    supabase.from('caregiver_skills').select('*').eq('caregiver_id', caregiverId).order('id', { ascending: false }),
    supabase.from('caregiver_availability').select('*').eq('caregiver_id', caregiverId).order('id', { ascending: true }),
    supabase.from('caregiver_notes').select('*').eq('caregiver_id', caregiverId).order('created_at', { ascending: false }),
    supabase.from('caregiver_incidents').select('*').eq('caregiver_id', caregiverId).order('created_at', { ascending: false }),
    supabase.from('caregiver_checkins').select('*').eq('caregiver_id', caregiverId).order('event_time', { ascending: false }).limit(10),
    supabase.from('missions').select('*').eq('caregiver_id', caregiverId).order('mission_date', { ascending: false }).limit(10),
  ])

  const caregiver = caregiverRes.data
  const skills = skillsRes.data || []
  const availability = availabilityRes.data || []
  const notes = notesRes.data || []
  const incidents = incidentsRes.data || []
  const checkins = checkinsRes.data || []
  const missions = missionsRes.data || []

  if (caregiverRes.error) {
    return <main style={{ padding: 32 }}>Erreur : {caregiverRes.error.message}</main>
  }

  if (!caregiver) {
    return (
      <main style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
        <h1>Intervenante introuvable</h1>
        <Link href="/caregivers" style={secondaryButtonStyle}>← Retour caregivers</Link>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Caregiver Profile</div>
          <h1 style={titleStyle}>{caregiver.full_name || 'Intervenante sans nom'}</h1>
          <p style={subtitleStyle}>
            Profil opérationnel, disponibilité, incidents, missions et suivi terrain.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/caregivers" style={secondaryButtonStyle}>← Retour directory</Link>
        </div>
      </div>
<form action={archiveCaregiver}>
  <input type="hidden" name="caregiver_id" value={caregiver.id} />
  <button type="submit" style={archiveButtonStyle}>
    Archiver
  </button>
</form>
      <section style={heroCardStyle}>
        <div style={heroGridStyle}>
          <InfoCard label="ID" value={String(caregiver.id)} />
          <InfoCard label="Ville" value={caregiver.city || 'Non définie'} />
          <InfoCard label="Zone" value={caregiver.zone || 'Non définie'} />
          <InfoCard label="Téléphone" value={caregiver.phone || 'Non défini'} />
          <InfoCard label="Statut courant" value={caregiver.current_status || caregiver.status || 'available'} />
          <InfoCard label="Reliability score" value={String(caregiver.reliability_score ?? 0)} />
          <InfoCard label="Academy certified" value={caregiver.academy_certified ? 'Oui' : 'Non'} />
          <InfoCard label="Special needs capable" value={caregiver.special_needs_capable ? 'Oui' : 'Non'} />
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={smallLabelStyle}>Résumé compétences</div>
          <div style={infoValueStyle}>{caregiver.skills_summary || 'Non défini'}</div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={smallLabelStyle}>Notes profil</div>
          <div style={infoValueStyle}>{caregiver.notes || 'Aucune note'}</div>
        </div>
        <div style={{ marginTop: 18 }}>
  <div style={smallLabelStyle}>Langues</div>
  <div style={tagWrapStyle}>
    {(Array.isArray(caregiver.language_tags) ? caregiver.language_tags : []).length > 0 ? (
      (caregiver.language_tags as string[]).map((tag) => (
        <span key={tag} style={languageTagStyle}>{tag}</span>
      ))
    ) : (
      <span style={emptyMiniTextStyle}>Aucune langue renseignée</span>
    )}
  </div>
</div>

<div style={{ marginTop: 18 }}>
  <div style={smallLabelStyle}>Skill tags mission</div>
  <div style={tagWrapStyle}>
    {(Array.isArray(caregiver.skill_tags) ? caregiver.skill_tags : []).length > 0 ? (
      (caregiver.skill_tags as string[]).map((tag) => (
        <span key={tag} style={skillTagStyle}>{tag}</span>
      ))
    ) : (
      <span style={emptyMiniTextStyle}>Aucune compétence codée</span>
    )}
  </div>
</div>
      </section>

      <div style={sectionGridStyle}>
        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Compétences</h2>
          {skills.length > 0 ? (
            <div style={listGridStyle}>
              {skills.map((skill: any) => (
                <div key={skill.id} style={itemCardStyle}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{skill.skill_name}</div>
                  <div style={metaStyle}>{skill.skill_level || 'Niveau non défini'}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="Aucune compétence renseignée." />
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Disponibilités</h2>
          {availability.length > 0 ? (
            <div style={listGridStyle}>
              {availability.map((slot: any) => (
                <div key={slot.id} style={itemCardStyle}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{slot.weekday}</div>
                  <div style={metaStyle}>
                    {slot.start_time || '--:--'} → {slot.end_time || '--:--'}
                  </div>
                  <div style={metaStyle}>{slot.availability_status || 'available'}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="Aucune disponibilité renseignée." />
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Notes opérations</h2>
          {notes.length > 0 ? (
            <div style={listGridStyle}>
              {notes.map((note: any) => (
                <div key={note.id} style={itemCardStyle}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{note.note_type || 'Note'}</div>
                  <div style={metaStyle}>{note.content || '—'}</div>
                  <div style={smallMetaStyle}>
                    {note.created_by || 'Ops'} • {note.created_at ? new Date(note.created_at).toLocaleString() : '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="Aucune note opérationnelle." />
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Incidents</h2>
          {incidents.length > 0 ? (
            <div style={listGridStyle}>
              {incidents.map((incident: any) => (
                <div key={incident.id} style={itemCardStyle}>
                  <div style={{ fontWeight: 800, color: '#991b1b' }}>
                    {incident.incident_type || 'Incident'} • {incident.severity || 'N/A'}
                  </div>
                  <div style={metaStyle}>{incident.content || '—'}</div>
                  <div style={smallMetaStyle}>
                    {incident.created_at ? new Date(incident.created_at).toLocaleString() : '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="Aucun incident déclaré." />
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Check-ins récents</h2>
          {checkins.length > 0 ? (
            <div style={listGridStyle}>
              {checkins.map((checkin: any) => (
                <div key={checkin.id} style={itemCardStyle}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    {checkin.event_type === 'check_in' ? '🟢 Check-in' : '⚪ Check-out'}
                  </div>
                  <div style={metaStyle}>
                    {checkin.city || 'Ville non définie'} • {checkin.zone || 'Zone non définie'}
                  </div>
                  <div style={metaStyle}>Mission ID: {checkin.mission_id || '—'}</div>
                  <div style={smallMetaStyle}>
                    {checkin.event_time ? new Date(checkin.event_time).toLocaleString() : '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="Aucun pointage enregistré." />
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Missions récentes</h2>
          {missions.length > 0 ? (
            <div style={listGridStyle}>
              {missions.map((mission: any) => (
                <div key={mission.id} style={itemCardStyle}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    {mission.service_type || 'Mission AngelCare'}
                  </div>
                  <div style={metaStyle}>
                    {mission.mission_date || 'Date non définie'} • {mission.city || 'Ville non définie'}
                  </div>
                  <div style={metaStyle}>
                    Statut : {mission.status || 'draft'} • Urgence : {mission.urgency || 'normal'}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Link href={`/missions/${mission.id}`} style={miniButtonStyle}>
                      Voir mission
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="Aucune mission liée." />
          )}
        </section>
      </div>
    </main>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoCardStyle}>
      <div style={smallLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <div style={emptyHintStyle}>{text}</div>
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
  fontSize: 42,
  lineHeight: 1.05,
  color: '#0f172a',
  fontWeight: 800,
}

const subtitleStyle: React.CSSProperties = {
  color: '#475569',
  margin: '10px 0 0 0',
  fontSize: 18,
}

const heroCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 24,
  padding: 24,
  border: '1px solid #dbe3ee',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.07)',
  marginBottom: 20,
}

const heroGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 14,
}

const sectionGridStyle: React.CSSProperties = {
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

const listGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const itemCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
}

const infoCardStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
}

const smallLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 6,
}

const infoValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.5,
}

const metaStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 14,
  lineHeight: 1.6,
}

const smallMetaStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  marginTop: 6,
}

const emptyHintStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 14,
  border: '1px dashed #cbd5e1',
  background: '#ffffff',
  color: '#64748b',
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

const miniButtonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  padding: '8px 12px',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 13,
}
const tagWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 8,
}

const languageTagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 11px',
  borderRadius: 999,
  background: '#e0f2fe',
  color: '#075985',
  border: '1px solid #bae6fd',
  fontSize: 12,
  fontWeight: 800,
}

const skillTagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 11px',
  borderRadius: 999,
  background: '#ede9fe',
  color: '#6d28d9',
  border: '1px solid #ddd6fe',
  fontSize: 12,
  fontWeight: 800,
}

const emptyMiniTextStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
}
const archiveButtonStyle: React.CSSProperties = {
  background: '#fff7ed',
  color: '#9a3412',
  padding: '12px 16px',
  borderRadius: 12,
  fontWeight: 800,
  border: '1px solid #fdba74',
  cursor: 'pointer',
}