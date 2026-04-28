import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Row = Record<string, any>

export default async function AvailabilityPage() {
  const supabase = await createClient()
  const [caregiversRes, missionsRes, checkinsRes, incidentsRes] = await Promise.all([
    supabase.from('caregivers').select('*').eq('is_archived', false).order('full_name', { ascending: true }),
    supabase.from('missions').select('*').eq('is_archived', false).order('mission_date', { ascending: true }).limit(250),
    supabase.from('caregiver_checkins').select('*').order('event_time', { ascending: false }).limit(200),
    supabase.from('incidents').select('*').eq('is_archived', false).order('created_at', { ascending: false }).limit(120),
  ])

  const caregivers = (caregiversRes.data || []) as Row[]
  const missions = (missionsRes.data || []) as Row[]
  const checkins = (checkinsRes.data || []) as Row[]
  const incidents = (incidentsRes.data || []) as Row[]
  const latest = latestByCaregiver(checkins)
  const today = new Date().toISOString().slice(0, 10)
  const todayMissions = missions.filter((m) => m.mission_date === today)

  const cards = caregivers.map((c) => {
    const last = latest.get(String(c.id))
    const activeMission = todayMissions.find((m) => String(m.caregiver_id) === String(c.id) && !['completed', 'cancelled'].includes(n(m.status)))
    const openIncident = incidents.find((i) => String(i.caregiver_id) === String(c.id) && ['open', 'in_progress', 'urgent'].includes(n(i.status)))
    const status = computeStatus(c, last, activeMission, openIncident)
    return { c, last, activeMission, openIncident, status }
  })

  const available = cards.filter((x) => x.status.key === 'available').length
  const working = cards.filter((x) => x.status.key === 'working').length
  const risk = cards.filter((x) => x.status.key === 'risk').length
  const offline = cards.filter((x) => x.status.key === 'offline').length

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Staffing Intelligence</div>
          <h1 style={titleStyle}>Availability Board</h1>
          <p style={subtitleStyle}>Lecture live des intervenantes, disponibilité, check-in terrain, risque incident et couverture mission.</p>
        </div>
        <div style={heroActionsStyle}>
          <Link href="/operations" style={ghostButtonStyle}>Operations</Link>
          <Link href="/operations/replacements" style={ghostButtonStyle}>Replacement</Link>
          <Link href="/pointage" style={buttonStyle}>Pointage</Link>
        </div>
      </section>

      <section style={kpiGridStyle}>
        <Kpi label="Disponibles" value={available} tone="green" />
        <Kpi label="En mission" value={working} tone="blue" />
        <Kpi label="À risque" value={risk} tone="red" />
        <Kpi label="Offline" value={offline} tone="slate" />
        <Kpi label="Missions aujourd’hui" value={todayMissions.length} tone="amber" />
      </section>

      <section style={gridStyle}>
        {cards.map(({ c, last, activeMission, openIncident, status }) => (
          <article key={c.id} style={cardStyle(status.color)}>
            <div style={cardTopStyle}>
              <div>
                <h2 style={nameStyle}>{c.full_name || `Caregiver #${c.id}`}</h2>
                <p style={mutedStyle}>{c.city || 'Ville ?'} • {c.zone || 'Zone ?'}</p>
              </div>
              <span style={statusBadgeStyle(status.color)}>{status.icon} {status.label}</span>
            </div>

            <div style={infoGridStyle}>
              <Info label="Statut profil" value={c.current_status || c.status || '—'} />
              <Info label="Dernier pointage" value={last ? `${last.event_type} • ${format(last.event_time)}` : 'Aucun'} />
              <Info label="Mission active" value={activeMission ? `#${activeMission.id} • ${activeMission.service_type || 'Mission'}` : 'Aucune'} />
              <Info label="Incident" value={openIncident ? `#${openIncident.id} • ${openIncident.status}` : 'Aucun ouvert'} />
            </div>

            <div style={actionRowStyle}>
              <Link href={`/caregivers/${c.id}`} style={secondaryActionStyle}>Profil</Link>
              {activeMission ? <Link href={`/missions/${activeMission.id}`} style={primaryActionStyle}>Mission</Link> : <Link href="/missions/new" style={secondaryActionStyle}>Créer mission</Link>}
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

function n(v: any) { return String(v || '').toLowerCase().trim() }
function latestByCaregiver(checkins: Row[]) { const map = new Map<string, Row>(); for (const c of checkins) if (!map.has(String(c.caregiver_id))) map.set(String(c.caregiver_id), c); return map }
function computeStatus(c: Row, last?: Row, activeMission?: Row, openIncident?: Row) {
  if (openIncident) return { key: 'risk', label: 'Risque incident', icon: '🚨', color: '#ef4444' }
  if (activeMission || n(last?.event_type) === 'check_in') return { key: 'working', label: 'En mission', icon: '🟢', color: '#22c55e' }
  if (['available', 'active', 'validated'].includes(n(c.current_status)) || ['available', 'active', 'validated'].includes(n(c.status))) return { key: 'available', label: 'Disponible', icon: '✅', color: '#3b82f6' }
  return { key: 'offline', label: 'Offline', icon: '⚪', color: '#94a3b8' }
}
function format(date?: string) { return date ? new Date(date).toLocaleString('fr-FR') : '—' }
function Kpi({ label, value, tone }: { label: string; value: number; tone: string }) { return <div style={kpiStyle(tone)}><span>{label}</span><strong>{value}</strong></div> }
function Info({ label, value }: { label: string; value: string }) { return <div style={infoStyle}><span>{label}</span><strong>{value}</strong></div> }

const pageStyle: React.CSSProperties = { padding: 28, display: 'grid', gap: 20, background: '#f8fafc', minHeight: '100vh' }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 22, alignItems: 'center', padding: 32, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#0f766e,#020617 68%)', boxShadow: '0 32px 80px rgba(15,23,42,.28)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#ccfbf1', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 42, fontWeight: 1000, letterSpacing: -0.8 }
const subtitleStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dbeafe', fontWeight: 800, maxWidth: 760, lineHeight: 1.55 }
const heroActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#fff', color: '#0f172a', fontWeight: 950, textDecoration: 'none', cursor: 'pointer' }
const ghostButtonStyle: React.CSSProperties = { borderRadius: 14, padding: '13px 16px', background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 950, textDecoration: 'none', border: '1px solid rgba(255,255,255,.18)' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }
const kpiStyle = (tone: string): React.CSSProperties => ({ background: tone === 'red' ? '#fff7f7' : tone === 'green' ? '#f0fdf4' : tone === 'amber' ? '#fffbeb' : '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' })
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 16 }
const cardStyle = (color: string): React.CSSProperties => ({ background: '#fff', border: `1px solid ${color}55`, borderRadius: 24, padding: 18, boxShadow: '0 18px 38px rgba(15,23,42,.06)' })
const cardTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }
const nameStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 1000 }
const mutedStyle: React.CSSProperties = { margin: '6px 0 0', color: '#64748b', fontWeight: 750 }
const statusBadgeStyle = (color: string): React.CSSProperties => ({ display: 'inline-flex', padding: '7px 11px', borderRadius: 999, background: `${color}18`, color: '#0f172a', border: `1px solid ${color}55`, fontWeight: 950, fontSize: 12 })
const infoGridStyle: React.CSSProperties = { display: 'grid', gap: 9 }
const infoStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 11, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }
const actionRowStyle: React.CSSProperties = { display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 14 }
const primaryActionStyle: React.CSSProperties = { borderRadius: 13, padding: '11px 13px', background: '#1d4ed8', color: '#fff', fontWeight: 950, textDecoration: 'none' }
const secondaryActionStyle: React.CSSProperties = { borderRadius: 13, padding: '11px 13px', background: '#fff', color: '#0f172a', fontWeight: 950, textDecoration: 'none', border: '1px solid #cbd5e1' }
