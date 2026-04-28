import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Mission = Record<string, any>

const STATUSES = ['draft', 'assigned', 'confirmed', 'in_progress', 'completed', 'incident', 'cancelled']
const PRIORITIES = ['standard', 'high', 'critical']

export default async function MissionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; status?: string; city?: string; urgency?: string; priority?: string }>
}) {
  const params = searchParams ? await searchParams : undefined
  const q = (params?.q || '').trim()
  const statusFilter = (params?.status || '').trim()
  const cityFilter = (params?.city || '').trim()
  const urgencyFilter = (params?.urgency || '').trim()
  const priorityFilter = (params?.priority || '').trim()

  const supabase = await createClient()

  let query = supabase
    .from('missions')
    .select('*')
    .eq('is_archived', false)
    .order('mission_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (statusFilter) query = query.eq('status', statusFilter)
  if (cityFilter) query = query.eq('city', cityFilter)
  if (urgencyFilter) query = query.eq('urgency', urgencyFilter)
  if (priorityFilter) query = query.eq('ops_priority', priorityFilter)
  if (q) query = query.or(`service_type.ilike.%${q}%,city.ilike.%${q}%,zone.ilike.%${q}%,notes.ilike.%${q}%`)

  const [{ data, error }, allRes, caregiversRes, incidentsRes, checkinsRes] = await Promise.all([
    query,
    supabase.from('missions').select('*').eq('is_archived', false),
    supabase.from('caregivers').select('*').eq('is_archived', false),
    supabase.from('incidents').select('*').eq('is_archived', false),
    supabase.from('caregiver_checkins').select('*').order('event_time', { ascending: false }).limit(80),
  ])

  const missions = (data || []) as Mission[]
  const allMissions = (allRes.data || []) as Mission[]
  const caregivers = caregiversRes.data || []
  const incidents = incidentsRes.data || []
  const checkins = checkinsRes.data || []

  const todayKey = new Date().toISOString().slice(0, 10)
  const total = allMissions.length
  const today = allMissions.filter((m) => m.mission_date === todayKey).length
  const unassigned = allMissions.filter((m) => !m.caregiver_id && !['completed', 'cancelled'].includes(normalize(m.status))).length
  const urgent = allMissions.filter((m) => normalize(m.urgency) === 'urgent' || normalize(m.ops_priority) === 'critical').length
  const inProgress = allMissions.filter((m) => normalize(m.status) === 'in_progress').length
  const incidentsOpen = incidents.filter((i: any) => ['open', 'in_progress', 'urgent'].includes(normalize(i.status))).length
  const cityOptions = Array.from(new Set(allMissions.map((m) => m.city).filter(Boolean))) as string[]

  const liveCheckinCaregivers = new Set(
    checkins
      .filter((c: any) => normalize(c.event_type) === 'check_in')
      .map((c: any) => String(c.caregiver_id))
  )

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare OpsOS • Mission Execution V2</div>
          <h1 style={titleStyle}>Mission Control Center</h1>
          <p style={subtitleStyle}>Pilotage quotidien des missions, assignations, urgences, remplacement et exécution terrain.</p>
        </div>
        <div style={heroActionsStyle}>
          <Link href="/operations" style={ghostButtonStyle}>Operations cockpit</Link>
          <Link href="/operations/availability" style={ghostButtonStyle}>Availability</Link>
          <Link href="/operations/replacements" style={ghostButtonStyle}>Replacement</Link>
          <Link href="/missions/new" style={buttonStyle}>+ Nouvelle mission</Link>
        </div>
      </section>

      <section style={kpiGridStyle}>
        <Kpi label="Missions actives" value={total} hint="hors archive" tone="blue" />
        <Kpi label="Aujourd’hui" value={today} hint="à exécuter" tone="green" />
        <Kpi label="Non assignées" value={unassigned} hint="risque opérationnel" tone={unassigned ? 'red' : 'slate'} />
        <Kpi label="Urgences" value={urgent} hint="priorité haute" tone={urgent ? 'red' : 'slate'} />
        <Kpi label="En cours" value={inProgress} hint="live terrain" tone="amber" />
        <Kpi label="Incidents ouverts" value={incidentsOpen} hint="impact qualité" tone={incidentsOpen ? 'red' : 'slate'} />
      </section>

      <section style={filterPanelStyle}>
        <form method="GET" style={filterGridStyle}>
          <input name="q" defaultValue={q} placeholder="Rechercher service, ville, zone ou note" style={inputStyle} />
          <select name="status" defaultValue={statusFilter} style={inputStyle}>
            <option value="">Tous statuts</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select name="city" defaultValue={cityFilter} style={inputStyle}>
            <option value="">Toutes villes</option>
            {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <select name="urgency" defaultValue={urgencyFilter} style={inputStyle}>
            <option value="">Urgence</option>
            <option value="normal">normal</option>
            <option value="urgent">urgent</option>
          </select>
          <select name="priority" defaultValue={priorityFilter} style={inputStyle}>
            <option value="">Priorité ops</option>
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
          <button type="submit" style={buttonStyle}>Filtrer</button>
          <Link href="/missions" style={resetButtonStyle}>Reset</Link>
        </form>
      </section>

      {error ? (
        <div style={errorStyle}>Erreur : {error.message}</div>
      ) : missions.length === 0 ? (
        <Empty title="Aucune mission trouvée" text="Ajuste les filtres ou crée une nouvelle mission." />
      ) : (
        <section style={boardStyle}>
          {missions.map((mission) => {
            const caregiver = caregivers.find((c: any) => String(c.id) === String(mission.caregiver_id))
            const live = mission.caregiver_id ? liveCheckinCaregivers.has(String(mission.caregiver_id)) : false
            const risk = missionRisk(mission, live)
            return (
              <article key={mission.id} style={missionCardStyle(risk.tone)}>
                <div style={cardHeaderStyle}>
                  <div>
                    <div style={idStyle}>Mission #{mission.id}</div>
                    <h2 style={missionTitleStyle}>{mission.service_type || 'Mission AngelCare'}</h2>
                  </div>
                  <div style={badgeWrapStyle}>
                    <span style={badgeStyle(mission.status || 'draft')}>{mission.status || 'draft'}</span>
                    <span style={badgeStyle(mission.urgency || mission.ops_priority || 'normal')}>{mission.urgency || mission.ops_priority || 'normal'}</span>
                  </div>
                </div>

                <div style={riskStripStyle(risk.color)}>
                  <strong>{risk.icon} {risk.label}</strong>
                  <span>{risk.reason}</span>
                </div>

                <div style={detailsGridStyle}>
                  <Info label="Date" value={mission.mission_date || 'Non définie'} icon="📅" />
                  <Info label="Horaire" value={`${mission.start_time || '--:--'} → ${mission.end_time || '--:--'}`} icon="🕒" />
                  <Info label="Localisation" value={`${mission.city || 'Ville ?'} • ${mission.zone || 'Zone ?'}`} icon="📍" />
                  <Info label="Intervenante" value={caregiver?.full_name || (mission.caregiver_id ? `ID ${mission.caregiver_id}` : 'Non assignée')} icon="👩‍💼" />
                  <Info label="Live terrain" value={live ? 'Check-in détecté' : 'Pas de check-in récent'} icon={live ? '🟢' : '⚪'} />
                  <Info label="Famille" value={mission.family_id ? `Famille ID ${mission.family_id}` : 'Non liée'} icon="🏠" />
                </div>

                <div style={managerNoteStyle}>
                  <strong>Lecture manager</strong>
                  <p>{mission.notes || mission.ops_notes || 'Aucune note. Vérifier assignation, confirmation famille et disponibilité intervenante avant exécution.'}</p>
                </div>

                <div style={actionRowStyle}>
                  <Link href={`/missions/${mission.id}`} style={primaryActionStyle}>Fiche mission</Link>
                  <Link href={`/missions/edit/${mission.id}`} style={secondaryActionStyle}>Modifier</Link>
                  <Link href="/operations/replacements" style={secondaryActionStyle}>Remplacement</Link>
                  <Link href={`/missions/${mission.id}/print`} style={secondaryActionStyle}>Print</Link>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

function normalize(value: any) {
  return String(value || '').toLowerCase().trim()
}

function missionRisk(mission: Mission, live: boolean) {
  const status = normalize(mission.status)
  const urgent = normalize(mission.urgency) === 'urgent' || normalize(mission.ops_priority) === 'critical'
  const noCaregiver = !mission.caregiver_id && !['completed', 'cancelled'].includes(status)
  if (normalize(mission.status) === 'incident') return { label: 'Incident terrain', reason: 'Escalade qualité requise', tone: 'red', color: '#ef4444', icon: '🚨' }
  if (noCaregiver) return { label: 'Mission non assignée', reason: 'À assigner avant confirmation client', tone: 'red', color: '#ef4444', icon: '⛔' }
  if (urgent) return { label: 'Priorité haute', reason: 'À surveiller par Ops Manager', tone: 'amber', color: '#f59e0b', icon: '🔥' }
  if (status === 'in_progress' && !live) return { label: 'Check-in absent', reason: 'Vérifier pointage terrain', tone: 'amber', color: '#f59e0b', icon: '⚠️' }
  return { label: 'Stable', reason: 'Aucune alerte majeure détectée', tone: 'green', color: '#22c55e', icon: '✅' }
}

function Kpi({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: string }) {
  return <div style={kpiStyle(tone)}><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>
}
function Info({ label, value, icon }: { label: string; value: string; icon: string }) {
  return <div style={infoStyle}><span>{icon} {label}</span><strong>{value}</strong></div>
}
function Empty({ title, text }: { title: string; text: string }) {
  return <div style={emptyStyle}><h3>{title}</h3><p>{text}</p></div>
}
function badgeStyle(value: string): React.CSSProperties {
  const v = normalize(value)
  const color = v.includes('urgent') || v.includes('critical') || v.includes('incident') ? ['#fee2e2', '#991b1b', '#fecaca'] : v.includes('confirm') || v.includes('complete') ? ['#dcfce7', '#166534', '#bbf7d0'] : v.includes('progress') ? ['#fef3c7', '#92400e', '#fde68a'] : ['#e2e8f0', '#334155', '#cbd5e1']
  return { display: 'inline-flex', padding: '7px 11px', borderRadius: 999, background: color[0], color: color[1], border: `1px solid ${color[2]}`, fontSize: 12, fontWeight: 900, textTransform: 'capitalize' }
}

const pageStyle: React.CSSProperties = { padding: 28, display: 'grid', gap: 20, background: '#f8fafc', minHeight: '100vh' }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 22, alignItems: 'center', padding: 32, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#2563eb,#020617 68%)', boxShadow: '0 32px 80px rgba(15,23,42,.28)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 42, fontWeight: 1000, letterSpacing: -0.8 }
const subtitleStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dbeafe', fontWeight: 800, maxWidth: 760, lineHeight: 1.55 }
const heroActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#0f172a', color: '#fff', fontWeight: 950, textDecoration: 'none', cursor: 'pointer' }
const ghostButtonStyle: React.CSSProperties = { borderRadius: 14, padding: '13px 16px', background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 950, textDecoration: 'none', border: '1px solid rgba(255,255,255,.18)' }
const resetButtonStyle: React.CSSProperties = { borderRadius: 14, padding: '13px 16px', background: '#fff', color: '#0f172a', fontWeight: 950, textDecoration: 'none', border: '1px solid #cbd5e1' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle = (tone: string): React.CSSProperties => ({ background: tone === 'red' ? '#fff7f7' : tone === 'green' ? '#f0fdf4' : tone === 'amber' ? '#fffbeb' : '#fff', border: `1px solid ${tone === 'red' ? '#fecaca' : tone === 'green' ? '#bbf7d0' : tone === 'amber' ? '#fde68a' : '#dbe3ee'}`, borderRadius: 22, padding: 18, display: 'grid', gap: 7, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' })
const filterPanelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 24, padding: 16, boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const filterGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.4fr repeat(4, minmax(130px, .6fr)) auto auto', gap: 10, alignItems: 'center' }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }
const boardStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 18 }
const missionCardStyle = (tone: string): React.CSSProperties => ({ background: '#fff', border: `1px solid ${tone === 'red' ? '#fecaca' : tone === 'amber' ? '#fde68a' : '#dbe3ee'}`, borderRadius: 28, padding: 22, boxShadow: '0 22px 50px rgba(15,23,42,.07)' })
const cardHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 14 }
const idStyle: React.CSSProperties = { color: '#64748b', fontWeight: 900, fontSize: 12, marginBottom: 5 }
const missionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 1000 }
const badgeWrapStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }
const riskStripStyle = (color: string): React.CSSProperties => ({ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 13, borderRadius: 16, background: `${color}12`, border: `1px solid ${color}44`, color: '#0f172a', marginBottom: 14 })
const detailsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const infoStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 12, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }
const managerNoteStyle: React.CSSProperties = { marginTop: 14, padding: 14, borderRadius: 18, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', color: '#334155', border: '1px solid #dbe3ee' }
const actionRowStyle: React.CSSProperties = { display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 16 }
const primaryActionStyle: React.CSSProperties = { ...buttonStyle, background: '#1d4ed8' }
const secondaryActionStyle: React.CSSProperties = { ...resetButtonStyle }
const errorStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#fee2e2', color: '#991b1b', fontWeight: 900 }
const emptyStyle: React.CSSProperties = { padding: 28, borderRadius: 24, background: '#fff', border: '1px dashed #cbd5e1', color: '#475569' }
