import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Row = Record<string, any>

export default async function OperationsPage() {
  const supabase = await createClient()
  const [missionsRes, caregiversRes, incidentsRes, checkinsRes, familiesRes, contractsRes] = await Promise.all([
    supabase.from('missions').select('*').eq('is_archived', false).order('mission_date', { ascending: true }).limit(250),
    supabase.from('caregivers').select('*').eq('is_archived', false).limit(250),
    supabase.from('incidents').select('*').eq('is_archived', false).order('created_at', { ascending: false }).limit(120),
    supabase.from('caregiver_checkins').select('*').order('event_time', { ascending: false }).limit(120),
    supabase.from('families').select('*').eq('is_archived', false).limit(250),
    supabase.from('contracts').select('*').eq('is_archived', false).limit(250),
  ])

  const missions = (missionsRes.data || []) as Row[]
  const caregivers = (caregiversRes.data || []) as Row[]
  const incidents = (incidentsRes.data || []) as Row[]
  const checkins = (checkinsRes.data || []) as Row[]
  const families = (familiesRes.data || []) as Row[]
  const contracts = (contractsRes.data || []) as Row[]

  const today = new Date().toISOString().slice(0, 10)
  const todayMissions = missions.filter((m) => m.mission_date === today)
  const openIncidents = incidents.filter((i) => ['open', 'in_progress', 'urgent'].includes(n(i.status)))
  const unassigned = missions.filter((m) => !m.caregiver_id && !['completed', 'cancelled'].includes(n(m.status)))
  const urgent = missions.filter((m) => n(m.urgency) === 'urgent' || n(m.ops_priority) === 'critical')
  const activeCaregivers = caregivers.filter((c) => ['active', 'available', 'validated'].includes(n(c.status)) || ['available', 'working'].includes(n(c.current_status)))
  const activeCheckins = latestCheckins(checkins).filter((c) => n(c.event_type) === 'check_in')

  const commandQueue = [
    ...unassigned.slice(0, 4).map((m) => ({ tone: 'red', title: `Mission #${m.id} non assignée`, text: `${m.service_type || 'Mission'} • ${m.city || 'Ville ?'} • ${m.mission_date || 'Date ?'}`, href: `/missions/${m.id}` })),
    ...urgent.slice(0, 4).map((m) => ({ tone: 'amber', title: `Mission #${m.id} urgente`, text: `${m.service_type || 'Mission'} • ${m.start_time || '--:--'} • ${m.zone || 'Zone ?'}`, href: `/missions/${m.id}` })),
    ...openIncidents.slice(0, 4).map((i) => ({ tone: 'red', title: `Incident #${i.id} ouvert`, text: `${i.incident_type || 'Incident'} • ${i.city || 'Ville ?'} • ${i.status || 'open'}`, href: `/incidents/${i.id}` })),
  ].slice(0, 8)

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Operations Execution V2</div>
          <h1 style={titleStyle}>Ops Command Cockpit</h1>
          <p style={subtitleStyle}>Vue manager quotidienne pour piloter missions, staffing, incidents, pointage terrain et risque client.</p>
        </div>
        <div style={heroActionsStyle}>
          <Link href="/missions" style={ghostButtonStyle}>Missions</Link>
          <Link href="/operations/availability" style={ghostButtonStyle}>Availability</Link>
          <Link href="/operations/replacements" style={ghostButtonStyle}>Replacements</Link>
          <Link href="/pointage" style={buttonStyle}>Pointage terrain</Link>
        </div>
      </section>

      <section style={kpiGridStyle}>
        <Kpi label="Missions aujourd’hui" value={todayMissions.length} hint="à suivre en priorité" tone="blue" />
        <Kpi label="Non assignées" value={unassigned.length} hint="risque dispatch" tone={unassigned.length ? 'red' : 'green'} />
        <Kpi label="Urgences" value={urgent.length} hint="priorité opérationnelle" tone={urgent.length ? 'red' : 'slate'} />
        <Kpi label="Intervenantes actives" value={activeCaregivers.length} hint={`${caregivers.length} profils total`} tone="green" />
        <Kpi label="Check-in live" value={activeCheckins.length} hint="terrain détecté" tone="amber" />
        <Kpi label="Incidents ouverts" value={openIncidents.length} hint="qualité / escalade" tone={openIncidents.length ? 'red' : 'green'} />
      </section>

      <section style={gridStyle}>
        <div style={panelStyle}>
          <Header title="Command queue" subtitle="Ce que l’Ops Manager doit traiter en premier." />
          {commandQueue.length ? (
            <div style={listStyle}>{commandQueue.map((item, index) => <ActionItem key={index} {...item} />)}</div>
          ) : <Empty text="Aucune alerte critique détectée. Maintenir surveillance standard." />}
        </div>

        <aside style={sidePanelStyle}>
          <Header title="Executive health" subtitle="Lecture rapide du moteur opérationnel." />
          <Insight label="Couverture mission" value={unassigned.length ? 'Fragile' : 'Stable'} tone={unassigned.length ? 'red' : 'green'} />
          <Insight label="Risque qualité" value={openIncidents.length ? 'À surveiller' : 'Normal'} tone={openIncidents.length ? 'red' : 'green'} />
          <Insight label="Capacité terrain" value={activeCaregivers.length > todayMissions.length ? 'Confort' : 'Tendue'} tone={activeCaregivers.length > todayMissions.length ? 'green' : 'amber'} />
          <Insight label="Contrats actifs" value={String(contracts.length)} tone="blue" />
          <Insight label="Familles suivies" value={String(families.length)} tone="blue" />
        </aside>
      </section>

      <section style={panelStyle}>
        <Header title="Missions du jour" subtitle="Vue d’exécution rapide pour stabiliser la journée." />
        {todayMissions.length ? (
          <div style={missionGridStyle}>{todayMissions.slice(0, 12).map((m) => <MissionTile key={m.id} mission={m} />)}</div>
        ) : <Empty text="Aucune mission planifiée aujourd’hui." />}
      </section>
    </main>
  )
}

function n(v: any) { return String(v || '').toLowerCase().trim() }
function latestCheckins(checkins: Row[]) {
  const map = new Map<string, Row>()
  for (const c of checkins) if (!map.has(String(c.caregiver_id))) map.set(String(c.caregiver_id), c)
  return Array.from(map.values())
}
function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div style={{ marginBottom: 16 }}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div> }
function Kpi({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: string }) { return <div style={kpiStyle(tone)}><span>{label}</span><strong>{value}</strong><small>{hint}</small></div> }
function ActionItem({ title, text, href, tone }: { title: string; text: string; href: string; tone: string }) { return <Link href={href} style={actionItemStyle(tone)}><strong>{title}</strong><span>{text}</span></Link> }
function Insight({ label, value, tone }: { label: string; value: string; tone: string }) { return <div style={insightStyle(tone)}><span>{label}</span><strong>{value}</strong></div> }
function MissionTile({ mission }: { mission: Row }) { return <Link href={`/missions/${mission.id}`} style={missionTileStyle}><strong>#{mission.id} • {mission.service_type || 'Mission'}</strong><span>{mission.start_time || '--:--'} → {mission.end_time || '--:--'} • {mission.city || 'Ville ?'}</span><small>{mission.status || 'draft'} • {mission.caregiver_id ? `Caregiver ${mission.caregiver_id}` : 'Non assignée'}</small></Link> }
function Empty({ text }: { text: string }) { return <div style={emptyStyle}>{text}</div> }

const pageStyle: React.CSSProperties = { padding: 28, display: 'grid', gap: 20, background: '#f8fafc', minHeight: '100vh' }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 22, alignItems: 'center', padding: 32, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#1d4ed8,#020617 68%)', boxShadow: '0 32px 80px rgba(15,23,42,.28)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 42, fontWeight: 1000, letterSpacing: -0.8 }
const subtitleStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dbeafe', fontWeight: 800, maxWidth: 760, lineHeight: 1.55 }
const heroActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#fff', color: '#0f172a', fontWeight: 950, textDecoration: 'none', cursor: 'pointer' }
const ghostButtonStyle: React.CSSProperties = { borderRadius: 14, padding: '13px 16px', background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 950, textDecoration: 'none', border: '1px solid rgba(255,255,255,.18)' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle = (tone: string): React.CSSProperties => ({ background: tone === 'red' ? '#fff7f7' : tone === 'green' ? '#f0fdf4' : tone === 'amber' ? '#fffbeb' : '#fff', border: `1px solid ${tone === 'red' ? '#fecaca' : tone === 'green' ? '#bbf7d0' : tone === 'amber' ? '#fde68a' : '#dbe3ee'}`, borderRadius: 22, padding: 18, display: 'grid', gap: 7, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' })
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const sidePanelStyle: React.CSSProperties = { ...panelStyle, position: 'sticky', top: 90 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const listStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const actionItemStyle = (tone: string): React.CSSProperties => ({ display: 'grid', gap: 5, padding: 15, borderRadius: 18, textDecoration: 'none', color: '#0f172a', background: tone === 'red' ? '#fff7f7' : '#fffbeb', border: `1px solid ${tone === 'red' ? '#fecaca' : '#fde68a'}` })
const insightStyle = (tone: string): React.CSSProperties => ({ display: 'flex', justifyContent: 'space-between', gap: 10, padding: 15, borderRadius: 18, marginBottom: 10, background: tone === 'red' ? '#fff7f7' : tone === 'green' ? '#f0fdf4' : tone === 'amber' ? '#fffbeb' : '#f8fafc', border: '1px solid #dbe3ee', color: '#0f172a' })
const missionGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const missionTileStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 15, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#0f172a' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
