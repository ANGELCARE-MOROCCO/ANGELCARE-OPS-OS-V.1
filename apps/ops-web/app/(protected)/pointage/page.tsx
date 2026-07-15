import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createCheckin } from './actions'

type Row = Record<string, any>

export default async function PointagePage() {
  const supabase = await createClient()
  const [caregiversRes, missionsRes, checkinsRes] = await Promise.all([
    supabase.from('caregivers').select('*').eq('is_archived', false).order('full_name', { ascending: true }),
    supabase.from('missions').select('*').eq('is_archived', false).order('mission_date', { ascending: true }).limit(250),
    supabase.from('caregiver_checkins').select('*').order('event_time', { ascending: false }).limit(80),
  ])

  const caregivers = (caregiversRes.data || []) as Row[]
  const missions = (missionsRes.data || []) as Row[]
  const checkins = (checkinsRes.data || []) as Row[]
  const latest = latestByCaregiver(checkins)
  const active = Array.from(latest.values()).filter((c) => n(c.event_type) === 'check_in').length
  const out = Array.from(latest.values()).filter((c) => n(c.event_type) === 'check_out').length

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Field Attendance</div>
          <h1 style={titleStyle}>Pointage terrain</h1>
          <p style={subtitleStyle}>Check-in / check-out intervenantes, traçabilité mission, zone terrain et contrôle opérationnel.</p>
        </div>
        <div style={heroActionsStyle}>
          <Link href="/operations" style={ghostButtonStyle}>Operations</Link>
          <Link href="/operations/availability" style={ghostButtonStyle}>Availability</Link>
          <Link href="/missions" style={buttonStyle}>Missions</Link>
        </div>
      </section>

      <section style={kpiGridStyle}>
        <Kpi label="Check-in actifs" value={active} tone="green" />
        <Kpi label="Check-out récents" value={out} tone="slate" />
        <Kpi label="Intervenantes" value={caregivers.length} tone="blue" />
        <Kpi label="Missions ouvertes" value={missions.length} tone="amber" />
      </section>

      <section style={gridStyle}>
        <div style={panelStyle}>
          <Header title="Nouveau pointage" subtitle="Enregistrer une présence terrain liée ou non à une mission." />
          <form action={createCheckin} style={formStyle}>
            <select name="caregiver_id" style={inputStyle} required defaultValue="">
              <option value="" disabled>Choisir une intervenante</option>
              {caregivers.map((caregiver) => <option key={caregiver.id} value={caregiver.id}>{caregiver.full_name} {caregiver.city ? `• ${caregiver.city}` : ''}</option>)}
            </select>
            <select name="mission_id" style={inputStyle} defaultValue="">
              <option value="">Aucune mission liée</option>
              {missions.map((mission) => <option key={mission.id} value={mission.id}>#{mission.id} • {mission.service_type || 'Mission'} • {mission.mission_date || 'Date non définie'}</option>)}
            </select>
            <div style={miniGridStyle}>
              <input name="city" placeholder="Ville" style={inputStyle} required />
              <input name="zone" placeholder="Zone / secteur" style={inputStyle} required />
            </div>
            <select name="event_type" style={inputStyle} required defaultValue="">
              <option value="" disabled>Type de pointage</option>
              <option value="check_in">🟢 Check-in</option>
              <option value="check_out">⚪ Check-out</option>
            </select>
            <textarea name="notes" placeholder="Notes terrain, retard, confirmation parent, incident léger..." style={{ ...inputStyle, minHeight: 110 }} />
            <button type="submit" style={submitButtonStyle}>Enregistrer le pointage</button>
          </form>
        </div>

        <aside style={panelStyle}>
          <Header title="Présence live" subtitle="Dernier statut connu par intervenante." />
          <div style={liveListStyle}>
            {Array.from(latest.entries()).slice(0, 12).map(([caregiverId, checkin]) => {
              const caregiver = caregivers.find((c) => String(c.id) === caregiverId)
              const isIn = n(checkin.event_type) === 'check_in'
              return (
                <div key={caregiverId} style={liveRowStyle(isIn)}>
                  <div>
                    <strong>{caregiver?.full_name || `Caregiver ${caregiverId}`}</strong>
                    <span>{checkin.city || 'Ville ?'} • {checkin.zone || 'Zone ?'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>{isIn ? '🟢 IN' : '⚪ OUT'}</strong>
                    <small>{format(checkin.event_time)}</small>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>
      </section>

      <section style={panelStyle}>
        <Header title="Historique récent" subtitle="Derniers pointages terrain enregistrés." />
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead><tr><th style={thStyle}>Type</th><th style={thStyle}>Intervenante</th><th style={thStyle}>Mission</th><th style={thStyle}>Zone</th><th style={thStyle}>Heure</th><th style={thStyle}>Note</th></tr></thead>
            <tbody>
              {checkins.map((c) => {
                const caregiver = caregivers.find((g) => String(g.id) === String(c.caregiver_id))
                return <tr key={c.id}><td style={tdStyle}>{n(c.event_type) === 'check_in' ? '🟢 Check-in' : '⚪ Check-out'}</td><td style={tdStyle}>{caregiver?.full_name || c.caregiver_id}</td><td style={tdStyle}>{c.mission_id || '—'}</td><td style={tdStyle}>{c.city || '—'} • {c.zone || '—'}</td><td style={tdStyle}>{format(c.event_time)}</td><td style={tdStyle}>{c.notes || '—'}</td></tr>
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function n(v: any) { return String(v || '').toLowerCase().trim() }
function latestByCaregiver(checkins: Row[]) { const map = new Map<string, Row>(); for (const c of checkins) if (!map.has(String(c.caregiver_id))) map.set(String(c.caregiver_id), c); return map }
function format(date?: string) { return date ? new Date(date).toLocaleString('fr-FR') : '—' }
function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div style={{ marginBottom: 16 }}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div> }
function Kpi({ label, value, tone }: { label: string; value: number; tone: string }) { return <div style={kpiStyle(tone)}><span>{label}</span><strong>{value}</strong></div> }

const pageStyle: React.CSSProperties = { padding: 28, display: 'grid', gap: 20, background: '#f8fafc', minHeight: '100vh' }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 22, alignItems: 'center', padding: 32, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#0f172a,#065f46 72%)', boxShadow: '0 32px 80px rgba(15,23,42,.28)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bbf7d0', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 42, fontWeight: 1000, letterSpacing: -0.8 }
const subtitleStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dcfce7', fontWeight: 800, maxWidth: 760, lineHeight: 1.55 }
const heroActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 16px', background: '#fff', color: '#0f172a', fontWeight: 950, textDecoration: 'none', cursor: 'pointer' }
const ghostButtonStyle: React.CSSProperties = { borderRadius: 14, padding: '13px 16px', background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 950, textDecoration: 'none', border: '1px solid rgba(255,255,255,.18)' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const kpiStyle = (tone: string): React.CSSProperties => ({ background: tone === 'green' ? '#f0fdf4' : tone === 'amber' ? '#fffbeb' : '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' })
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const formStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const miniGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }
const submitButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '14px 16px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const liveListStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const liveRowStyle = (active: boolean): React.CSSProperties => ({ display: 'flex', justifyContent: 'space-between', gap: 14, padding: 14, borderRadius: 18, background: active ? '#f0fdf4' : '#f8fafc', border: `1px solid ${active ? '#bbf7d0' : '#e2e8f0'}`, color: '#0f172a' })
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', background: '#fff' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: 14, background: '#0f172a', color: '#fff' }
const tdStyle: React.CSSProperties = { padding: 14, borderBottom: '1px solid #e2e8f0', color: '#334155' }
