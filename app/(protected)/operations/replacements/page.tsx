import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Row = Record<string, any>

export default async function ReplacementsPage() {
  const supabase = await createClient()
  const [missionsRes, caregiversRes, incidentsRes, checkinsRes] = await Promise.all([
    supabase.from('missions').select('*').eq('is_archived', false).order('mission_date', { ascending: true }).limit(250),
    supabase.from('caregivers').select('*').eq('is_archived', false).limit(300),
    supabase.from('incidents').select('*').eq('is_archived', false).order('created_at', { ascending: false }).limit(120),
    supabase.from('caregiver_checkins').select('*').order('event_time', { ascending: false }).limit(200),
  ])

  const missions = (missionsRes.data || []) as Row[]
  const caregivers = (caregiversRes.data || []) as Row[]
  const incidents = (incidentsRes.data || []) as Row[]
  const checkins = (checkinsRes.data || []) as Row[]
  const latest = latestByCaregiver(checkins)

  const cases = missions
    .filter((m) => !['completed', 'cancelled'].includes(n(m.status)))
    .map((mission) => {
      const relatedIncident = incidents.find((i) => String(i.mission_id) === String(mission.id) && ['open', 'in_progress', 'urgent'].includes(n(i.status)))
      const assignedLast = mission.caregiver_id ? latest.get(String(mission.caregiver_id)) : undefined
      const needsReplacement = !mission.caregiver_id || relatedIncident || n(mission.urgency) === 'urgent' || n(mission.replacement_required) === 'true' || (mission.caregiver_id && n(assignedLast?.event_type) === 'check_out')
      const ranked = caregivers
        .filter((c) => String(c.id) !== String(mission.caregiver_id))
        .map((c) => ({ caregiver: c, score: scoreCaregiver(c, mission, latest.get(String(c.id))) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
      return { mission, relatedIncident, assignedLast, needsReplacement, ranked }
    })
    .filter((c) => c.needsReplacement)

  const critical = cases.filter((c) => !c.mission.caregiver_id || c.relatedIncident).length
  const urgent = cases.filter((c) => n(c.mission.urgency) === 'urgent').length
  const availablePool = caregivers.filter((c) => isAvailable(c, latest.get(String(c.id)))).length

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Emergency Dispatch</div>
          <h1 style={titleStyle}>Replacement Command Center</h1>
          <p style={subtitleStyle}>Remplacement intelligent, shortlist intervenantes, score dispatch, incidents et couverture urgente.</p>
        </div>
        <div style={heroActionsStyle}>
          <Link href="/operations" style={ghostButtonStyle}>Operations</Link>
          <Link href="/operations/availability" style={ghostButtonStyle}>Availability</Link>
          <Link href="/missions" style={buttonStyle}>Missions</Link>
        </div>
      </section>

      <section style={kpiGridStyle}>
        <Kpi label="Cas remplacement" value={cases.length} tone="red" />
        <Kpi label="Critiques" value={critical} tone={critical ? 'red' : 'green'} />
        <Kpi label="Urgents" value={urgent} tone={urgent ? 'amber' : 'slate'} />
        <Kpi label="Pool disponible" value={availablePool} tone="green" />
      </section>

      {cases.length === 0 ? <Empty text="Aucun remplacement critique détecté. Continuer surveillance disponibilité." /> : (
        <section style={caseGridStyle}>
          {cases.map(({ mission, relatedIncident, assignedLast, ranked }) => (
            <article key={mission.id} style={caseCardStyle}>
              <div style={caseHeaderStyle}>
                <div>
                  <div style={idStyle}>Mission #{mission.id}</div>
                  <h2 style={caseTitleStyle}>{mission.service_type || 'Mission AngelCare'}</h2>
                  <p style={mutedStyle}>{mission.city || 'Ville ?'} • {mission.zone || 'Zone ?'} • {mission.mission_date || 'Date ?'} • {mission.start_time || '--:--'}</p>
                </div>
                <span style={dangerBadgeStyle}>{!mission.caregiver_id ? '⛔ Non assignée' : relatedIncident ? '🚨 Incident' : '🔥 Urgence'}</span>
              </div>

              <div style={reasonBoxStyle}>
                <strong>Pourquoi ce cas ressort ?</strong>
                <p>{!mission.caregiver_id ? 'Aucune intervenante assignée.' : relatedIncident ? `Incident ouvert #${relatedIncident.id}.` : assignedLast ? `Dernier pointage: ${assignedLast.event_type}.` : 'Priorité élevée / urgence.'}</p>
              </div>

              <h3 style={miniTitleStyle}>Shortlist recommandée</h3>
              <div style={shortlistStyle}>
                {ranked.map(({ caregiver, score }) => (
                  <div key={caregiver.id} style={caregiverCardStyle(score)}>
                    <div>
                      <strong>{caregiver.full_name || `Caregiver #${caregiver.id}`}</strong>
                      <span>{caregiver.city || 'Ville ?'} • {caregiver.current_status || caregiver.status || 'statut ?'}</span>
                    </div>
                    <div style={scoreStyle}>{score}</div>
                  </div>
                ))}
              </div>

              <div style={actionRowStyle}>
                <Link href={`/missions/${mission.id}`} style={primaryActionStyle}>Ouvrir mission</Link>
                <Link href={`/missions/edit/${mission.id}`} style={secondaryActionStyle}>Modifier assignation</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

function n(v: any) { return String(v || '').toLowerCase().trim() }
function latestByCaregiver(checkins: Row[]) { const map = new Map<string, Row>(); for (const c of checkins) if (!map.has(String(c.caregiver_id))) map.set(String(c.caregiver_id), c); return map }
function isAvailable(c: Row, last?: Row) { return ['available', 'active', 'validated'].includes(n(c.current_status)) || ['available', 'active', 'validated'].includes(n(c.status)) || n(last?.event_type) === 'check_out' }
function scoreCaregiver(c: Row, mission: Row, last?: Row) {
  let score = 50
  if (n(c.city) && n(c.city) === n(mission.city)) score += 25
  if (n(c.zone) && n(c.zone) === n(mission.zone)) score += 10
  if (isAvailable(c, last)) score += 15
  if (n(c.current_status) === 'working' || n(last?.event_type) === 'check_in') score -= 25
  if (n(c.status).includes('inactive')) score -= 40
  return Math.max(0, Math.min(100, score))
}
function Kpi({ label, value, tone }: { label: string; value: number; tone: string }) { return <div style={kpiStyle(tone)}><span>{label}</span><strong>{value}</strong></div> }
function Empty({ text }: { text: string }) { return <div style={emptyStyle}>{text}</div> }

const pageStyle: React.CSSProperties = { padding: 28, display: 'grid', gap: 20, background: '#f8fafc', minHeight: '100vh' }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 22, alignItems: 'center', padding: 32, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#b91c1c,#020617 70%)', boxShadow: '0 32px 80px rgba(15,23,42,.28)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#fecaca', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 42, fontWeight: 1000, letterSpacing: -0.8 }
const subtitleStyle: React.CSSProperties = { margin: '10px 0 0', color: '#fee2e2', fontWeight: 800, maxWidth: 760, lineHeight: 1.55 }
const heroActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#fff', color: '#0f172a', fontWeight: 950, textDecoration: 'none', cursor: 'pointer' }
const ghostButtonStyle: React.CSSProperties = { borderRadius: 14, padding: '13px 16px', background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 950, textDecoration: 'none', border: '1px solid rgba(255,255,255,.18)' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const kpiStyle = (tone: string): React.CSSProperties => ({ background: tone === 'red' ? '#fff7f7' : tone === 'green' ? '#f0fdf4' : tone === 'amber' ? '#fffbeb' : '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' })
const caseGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 18 }
const caseCardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #fecaca', borderRadius: 28, padding: 22, boxShadow: '0 22px 50px rgba(15,23,42,.07)' }
const caseHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 14 }
const idStyle: React.CSSProperties = { color: '#64748b', fontWeight: 900, fontSize: 12, marginBottom: 5 }
const caseTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 1000 }
const mutedStyle: React.CSSProperties = { color: '#64748b', fontWeight: 750 }
const dangerBadgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '8px 11px', borderRadius: 999, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontWeight: 950, fontSize: 12 }
const reasonBoxStyle: React.CSSProperties = { padding: 14, borderRadius: 18, background: '#fff7f7', border: '1px solid #fecaca', color: '#334155', marginBottom: 14 }
const miniTitleStyle: React.CSSProperties = { margin: '0 0 10px', color: '#0f172a', fontSize: 16, fontWeight: 950 }
const shortlistStyle: React.CSSProperties = { display: 'grid', gap: 9 }
const caregiverCardStyle = (score: number): React.CSSProperties => ({ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 13, borderRadius: 16, background: score >= 75 ? '#f0fdf4' : score >= 55 ? '#fffbeb' : '#f8fafc', border: '1px solid #dbe3ee', color: '#0f172a' })
const scoreStyle: React.CSSProperties = { width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#0f172a', color: '#fff', fontWeight: 1000 }
const actionRowStyle: React.CSSProperties = { display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 16 }
const primaryActionStyle: React.CSSProperties = { borderRadius: 13, padding: '11px 13px', background: '#1d4ed8', color: '#fff', fontWeight: 950, textDecoration: 'none' }
const secondaryActionStyle: React.CSSProperties = { borderRadius: 13, padding: '11px 13px', background: '#fff', color: '#0f172a', fontWeight: 950, textDecoration: 'none', border: '1px solid #cbd5e1' }
const emptyStyle: React.CSSProperties = { padding: 28, borderRadius: 24, background: '#fff', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
