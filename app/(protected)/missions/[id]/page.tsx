import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  assignCaregiverToMission,
  updateMissionStatus,
  startMission,
  completeMission,
  declareMissionIncident,
  cancelMission,
} from './actions'

function badgeStyle(value: string): React.CSSProperties {
  const v = (value || '').toLowerCase()
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    draft: { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' },
    assigned: { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
    confirmed: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    in_progress: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    completed: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    incident: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    cancelled: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
    urgent: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    normal: { bg: '#e0f2fe', text: '#075985', border: '#bae6fd' },
  }
  const color = colors[v] || { bg: '#e2e8f0', text: '#334155', border: '#cbd5e1' }
  return { display:'inline-flex', alignItems:'center', padding:'8px 12px', borderRadius:999, background:color.bg, color:color.text, border:`1px solid ${color.border}`, fontSize:12, fontWeight:800, textTransform:'capitalize' }
}

function timelineStepStyle(active: boolean, done: boolean): React.CSSProperties {
  return { padding:'12px 14px', borderRadius:14, border:active?'2px solid #0f172a':'1px solid #dbe3ee', background:done?'#f8fafc':'#fff', color:'#0f172a', fontWeight:active?800:700, minWidth:130, textAlign:'center' }
}

export default async function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const missionId = Number(id)
  const supabase = await createClient()

  const [missionRes, familiesRes, caregiversRes, eventsRes, contractsRes] = await Promise.all([
    supabase.from('missions').select('*').eq('id', missionId).eq('is_archived', false).maybeSingle(),
    supabase.from('families').select('id, family_name, parent_name, city, zone, phone').order('parent_name', { ascending: true }),
    supabase.from('caregivers').select('id, full_name, city, current_status, status').eq('is_archived', false).order('full_name', { ascending: true }),
    supabase.from('mission_events').select('*').eq('mission_id', missionId).order('created_at', { ascending: false }),
    supabase.from('contracts').select('id, contract_reference, total_sessions, sessions_used, status').eq('is_archived', false),
  ])

  if (missionRes.error) return <main style={{ padding:32 }}>Erreur : {missionRes.error.message}</main>
  const mission = missionRes.data
  if (!mission) return <main style={{ padding:32, fontFamily:'Arial, sans-serif' }}><h1>Mission introuvable</h1><Link href="/missions" style={secondaryButtonStyle}>← Retour missions</Link></main>

  const family = (familiesRes.data || []).find((x:any) => x.id === mission.family_id)
  const caregiver = (caregiversRes.data || []).find((x:any) => x.id === mission.caregiver_id)
  const contract = (contractsRes.data || []).find((x:any) => x.id === mission.contract_id)
  const events = eventsRes.data || []
  const steps = ['draft','assigned','confirmed','in_progress','completed']
  const currentIndex = steps.indexOf(String(mission.status || 'draft'))

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Mission Command Center</div>
          <h1 style={titleStyle}>{mission.mission_code || `Mission #${mission.id}`}</h1>
          <p style={subtitleStyle}>Poste de pilotage de mission: statut, exécution, contrat, incidents et journal d’actions.</p>
        </div>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <Link href="/missions" style={secondaryButtonStyle}>← Retour missions</Link>
          <Link href={`/missions/edit/${mission.id}`} style={secondaryButtonStyle}>Modifier</Link>
        </div>
      </div>

      <section style={heroCardStyle}>
        <div style={heroTopStyle}>
          <div>
            <div style={smallLabelStyle}>Code mission</div>
            <div style={heroValueStyle}>{mission.mission_code || `MISSION-${mission.id}`}</div>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <span style={badgeStyle(mission.status || 'draft')}>{mission.status || 'draft'}</span>
            <span style={badgeStyle(mission.urgency || 'normal')}>{mission.urgency || 'normal'}</span>
            {mission.contract_id ? <span style={contractBadgeStyle}>Contract #{mission.contract_id}</span> : null}
            {mission.caregiver_id ? <span style={successBadgeStyle}>Caregiver assignée</span> : <span style={warningBadgeStyle}>Caregiver manquante</span>}
          </div>
        </div>

        <div style={heroGridStyle}>
          <InfoCard label="Service" value={mission.service_type || 'Non défini'} />
          <InfoCard label="Date mission" value={mission.mission_date || 'Non définie'} />
          <InfoCard label="Heure" value={`${mission.start_time || '--:--'} → ${mission.end_time || '--:--'}`} />
          <InfoCard label="Ville / Zone" value={`${mission.city || '—'} • ${mission.zone || '—'}`} />
          <InfoCard label="Famille" value={family ? `${family.family_name || family.parent_name || `Famille #${family.id}`}` : 'Non définie'} />
          <InfoCard label="Caregiver" value={caregiver ? `${caregiver.full_name || `Caregiver #${caregiver.id}`}` : 'Non assignée'} />
        </div>

        <div style={{ marginTop:18 }}>
          <div style={smallLabelStyle}>Timeline mission</div>
          <div style={timelineWrapStyle}>
            {steps.map((step, index) => <div key={step} style={timelineStepStyle(mission.status === step, currentIndex >= index)}>{step}</div>)}
          </div>
        </div>
      </section>

      <div style={sectionGridStyle}>
        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>⚡ Quick Actions</h2>
          <form action={assignCaregiverToMission} style={actionRowStyle}>
            <input type="hidden" name="mission_id" value={mission.id} />
            <select name="caregiver_id" defaultValue={mission.caregiver_id ? String(mission.caregiver_id) : ''} style={inputStyle}>
              <option value="">Choisir une intervenante</option>
              {(caregiversRes.data || []).map((item:any) => <option key={item.id} value={item.id}>{item.full_name || `Caregiver #${item.id}`}{item.city ? ` • ${item.city}` : ''}{item.current_status || item.status ? ` • ${item.current_status || item.status}` : ''}</option>)}
            </select>
            <button type="submit" style={primaryButtonStyle}>Assigner</button>
          </form>

          <form action={updateMissionStatus} style={actionRowStyle}>
            <input type="hidden" name="mission_id" value={mission.id} />
            <select name="status" defaultValue={mission.status || 'draft'} style={inputStyle}>
              <option value="draft">draft</option>
              <option value="assigned">assigned</option>
              <option value="confirmed">confirmed</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
              <option value="incident">incident</option>
              <option value="cancelled">cancelled</option>
            </select>
            <button type="submit" style={secondaryBtnAsButton}>Mettre à jour statut</button>
          </form>

          <div style={actionGridStyle}>
            <form action={startMission}><input type="hidden" name="mission_id" value={mission.id} /><button type="submit" style={quickActionStyle}>▶ Démarrer</button></form>
            <form action={completeMission}><input type="hidden" name="mission_id" value={mission.id} /><button type="submit" style={successButtonStyle}>✔ Terminer</button></form>
          </div>

          <form action={declareMissionIncident} style={actionRowStyle}>
            <input type="hidden" name="mission_id" value={mission.id} />
            <input name="incident_note" placeholder="Décrire l'incident..." style={inputStyle} />
            <button type="submit" style={dangerButtonStyle}>⚠ Déclarer incident</button>
          </form>

          <form action={cancelMission} style={actionRowStyle}>
            <input type="hidden" name="mission_id" value={mission.id} />
            <input name="cancel_reason" placeholder="Motif d'annulation..." style={inputStyle} />
            <button type="submit" style={cancelButtonStyle}>✖ Annuler mission</button>
          </form>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>🧾 Mission Execution Block</h2>
          <div style={detailGridStyle}>
            <InfoCard label="Famille téléphone" value={family?.phone || '—'} />
            <InfoCard label="Ville famille" value={family?.city || '—'} />
            <InfoCard label="Zone famille" value={family?.zone || '—'} />
            <InfoCard label="Caregiver statut" value={caregiver?.current_status || caregiver?.status || '—'} />
            <InfoCard label="Durée" value={mission.duration_hours ? `${mission.duration_hours}h` : '—'} />
            <InfoCard label="Ordre contrat" value={mission.contract_row_order ? String(mission.contract_row_order) : '—'} />
          </div>

          <div style={{ marginTop:16 }}>
            <div style={smallLabelStyle}>Notes opérationnelles</div>
            <div style={noteCardStyle}>{mission.notes || 'Aucune note'}</div>
          </div>

          {contract ? <div style={{ marginTop:16 }}><div style={smallLabelStyle}>Contrat lié</div><div style={contractCardStyle}><div style={{ fontWeight:800, color:'#0f172a' }}>{contract.contract_reference || `Contract #${contract.id}`}</div><div style={{ color:'#475569' }}>Sessions utilisées: {Number(contract.sessions_used || 0)} / {Number(contract.total_sessions || 0)} • Statut: {contract.status || 'draft'}</div></div></div> : null}
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>📜 Journal mission</h2>
          {events.length === 0 ? <div style={emptyStyle}>Aucun événement enregistré.</div> : <div style={{ display:'grid', gap:12 }}>{events.map((event:any) => <div key={event.id} style={eventCardStyle}><div style={{ display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}><div style={eventTypeStyle}>{event.event_type}</div><div style={eventDateStyle}>{new Date(event.created_at).toLocaleString()}</div></div><div style={eventContentStyle}>{event.content || 'Sans détail'}</div></div>)}</div>}
        </section>
      </div>
    </main>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div style={infoCardStyle}><div style={smallLabelStyle}>{label}</div><div style={infoValueStyle}>{value}</div></div>
}

const pageStyle: React.CSSProperties = { padding:32, fontFamily:'Arial, sans-serif', background:'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)', minHeight:'100vh' }
const headerStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:20, flexWrap:'wrap', marginBottom:24 }
const eyebrowStyle: React.CSSProperties = { display:'inline-block', padding:'6px 10px', borderRadius:999, background:'#e2e8f0', color:'#334155', fontSize:12, fontWeight:800, marginBottom:10 }
const titleStyle: React.CSSProperties = { margin:0, fontSize:40, lineHeight:1.05, color:'#0f172a', fontWeight:800 }
const subtitleStyle: React.CSSProperties = { color:'#475569', margin:'10px 0 0 0', fontSize:17, maxWidth:820 }
const heroCardStyle: React.CSSProperties = { background:'rgba(255,255,255,0.96)', borderRadius:24, padding:24, border:'1px solid #dbe3ee', boxShadow:'0 16px 40px rgba(15, 23, 42, 0.07)', marginBottom:20 }
const heroTopStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:20, flexWrap:'wrap', marginBottom:18 }
const heroGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:14 }
const detailGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:14 }
const timelineWrapStyle: React.CSSProperties = { display:'flex', gap:12, flexWrap:'wrap', marginTop:10 }
const smallLabelStyle: React.CSSProperties = { color:'#64748b', fontSize:13, fontWeight:700, marginBottom:6 }
const heroValueStyle: React.CSSProperties = { color:'#0f172a', fontSize:30, fontWeight:800 }
const sectionGridStyle: React.CSSProperties = { display:'grid', gap:20 }
const panelStyle: React.CSSProperties = { background:'rgba(255,255,255,0.96)', borderRadius:24, padding:24, border:'1px solid #dbe3ee', boxShadow:'0 16px 40px rgba(15, 23, 42, 0.06)' }
const panelTitleStyle: React.CSSProperties = { margin:'0 0 16px 0', color:'#0f172a', fontSize:24, fontWeight:800 }
const infoCardStyle: React.CSSProperties = { background:'#fcfdff', border:'1px solid #e2e8f0', borderRadius:14, padding:14 }
const infoValueStyle: React.CSSProperties = { color:'#0f172a', fontSize:15, fontWeight:600, lineHeight:1.5 }
const noteCardStyle: React.CSSProperties = { borderRadius:16, border:'1px solid #e2e8f0', background:'#ffffff', padding:16, color:'#334155', lineHeight:1.6 }
const contractCardStyle: React.CSSProperties = { borderRadius:16, border:'1px solid #dbe3ee', background:'#f8fafc', padding:16 }
const actionRowStyle: React.CSSProperties = { display:'flex', gap:12, marginBottom:12, flexWrap:'wrap', alignItems:'center' }
const actionGridStyle: React.CSSProperties = { display:'flex', gap:12, flexWrap:'wrap', marginBottom:12 }
const inputStyle: React.CSSProperties = { padding:'12px 14px', borderRadius:12, border:'1px solid #cbd5e1', fontSize:14, minWidth:280, background:'white' }
const primaryButtonStyle: React.CSSProperties = { background:'#0f172a', color:'white', padding:'12px 16px', borderRadius:12, border:'none', fontWeight:800, cursor:'pointer' }
const quickActionStyle: React.CSSProperties = { background:'#1d4ed8', color:'white', padding:'12px 16px', borderRadius:12, border:'none', fontWeight:800, cursor:'pointer' }
const successButtonStyle: React.CSSProperties = { background:'#16a34a', color:'white', padding:'12px 16px', borderRadius:12, border:'none', fontWeight:800, cursor:'pointer' }
const dangerButtonStyle: React.CSSProperties = { background:'#dc2626', color:'white', padding:'12px 16px', borderRadius:12, border:'none', fontWeight:800, cursor:'pointer' }
const cancelButtonStyle: React.CSSProperties = { background:'#475569', color:'white', padding:'12px 16px', borderRadius:12, border:'none', fontWeight:800, cursor:'pointer' }
const secondaryButtonStyle: React.CSSProperties = { background:'white', color:'#0f172a', padding:'12px 16px', borderRadius:12, textDecoration:'none', fontWeight:800, border:'1px solid #cbd5e1' }
const secondaryBtnAsButton: React.CSSProperties = { background:'white', color:'#0f172a', padding:'12px 16px', borderRadius:12, fontWeight:800, border:'1px solid #cbd5e1', cursor:'pointer' }
const eventCardStyle: React.CSSProperties = { borderRadius:16, border:'1px solid #e2e8f0', background:'#ffffff', padding:14 }
const eventTypeStyle: React.CSSProperties = { color:'#0f172a', fontWeight:800 }
const eventDateStyle: React.CSSProperties = { color:'#64748b', fontSize:12 }
const eventContentStyle: React.CSSProperties = { color:'#475569', marginTop:8, lineHeight:1.6 }
const emptyStyle: React.CSSProperties = { padding:16, borderRadius:14, border:'1px dashed #cbd5e1', background:'#ffffff', color:'#64748b' }
const contractBadgeStyle: React.CSSProperties = { display:'inline-flex', alignItems:'center', padding:'8px 12px', borderRadius:999, background:'#ede9fe', color:'#6d28d9', border:'1px solid #ddd6fe', fontSize:12, fontWeight:800 }
const successBadgeStyle: React.CSSProperties = { display:'inline-flex', alignItems:'center', padding:'8px 12px', borderRadius:999, background:'#dcfce7', color:'#166534', border:'1px solid #bbf7d0', fontSize:12, fontWeight:800 }
const warningBadgeStyle: React.CSSProperties = { display:'inline-flex', alignItems:'center', padding:'8px 12px', borderRadius:999, background:'#fff7ed', color:'#9a3412', border:'1px solid #fdba74', fontSize:12, fontWeight:800 }