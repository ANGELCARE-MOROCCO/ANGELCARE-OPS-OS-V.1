import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const contractId = Number(id)
  const supabase = await createClient()
  const [contractRes, missionsRes, rowsRes] = await Promise.all([
    supabase.from('contracts').select(`*, families:family_id (family_name, parent_name, city), caregivers:preferred_caregiver_id (full_name)`).eq('id', contractId).eq('is_archived', false).maybeSingle(),
    supabase.from('missions').select('*').eq('contract_id', contractId).eq('is_archived', false).order('contract_row_order', { ascending: true }),
    supabase.from('contract_mission_rows').select('*').eq('contract_id', contractId).order('row_order', { ascending: true }),
  ])
  if (contractRes.error) return <main style={{ padding: 32 }}>Erreur : {contractRes.error.message}</main>
  const contract = contractRes.data
  const missions = missionsRes.data || []
  const rows = rowsRes.data || []
  if (!contract) return <main style={{ padding:32, fontFamily:'Arial, sans-serif' }}><h1>Contrat introuvable</h1><Link href="/contracts" style={secondaryButtonStyle}>← Retour contrats</Link></main>
  const totalSessions = Number(contract.total_sessions || 0)
  const used = Number(contract.sessions_used || 0)
  const remaining = Math.max(0, totalSessions - used)
  return <main style={pageStyle}><div style={headerStyle}><div><div style={eyebrowStyle}>AngelCare • Contracts Engine</div><h1 style={titleStyle}>{contract.contract_reference || contract.package_label || `Contrat #${contract.id}`}</h1><p style={subtitleStyle}>Vue complète du contrat, lignes planifiées et missions réelles liées.</p></div><div style={{ display:'flex', gap:12, flexWrap:'wrap' }}><Link href="/contracts" style={secondaryButtonStyle}>← Retour contrats</Link><Link href={`/contracts/edit/${contract.id}`} style={secondaryButtonStyle}>Modifier</Link></div></div><section style={heroCardStyle}><div style={heroGridStyle}><InfoCard label="Type contrat" value={contract.contract_type || 'one_shot'} /><InfoCard label="Famille" value={contract.families?.family_name || contract.families?.parent_name || 'Non définie'} /><InfoCard label="Ville famille" value={contract.families?.city || 'Non définie'} /><InfoCard label="Service" value={contract.service_type || 'Non défini'} /><InfoCard label="Caregiver préférée" value={contract.caregivers?.full_name || 'Non définie'} /><InfoCard label="Statut" value={contract.status || 'draft'} /><InfoCard label="Date début" value={contract.start_date || '—'} /><InfoCard label="Date fin" value={contract.end_date || '—'} /><InfoCard label="Jours préférés" value={contract.preferred_days || '—'} /><InfoCard label="Heure préférée" value={contract.preferred_time || '—'} /></div><div style={{ marginTop:20 }}><div style={progressHeaderStyle}><span>Sessions utilisées: <strong>{used}/{totalSessions}</strong></span><span>Restantes: <strong>{remaining}</strong></span></div><div style={progressTrackStyle}><div style={{ ...progressFillStyle, width:`${totalSessions>0 ? Math.min(100, (used/totalSessions)*100) : 0}%` }} /></div></div></section><section style={panelStyle}><h2 style={panelTitleStyle}>Lignes planifiées du contrat</h2>{rows.length===0 ? <div style={emptyStyle}>Aucune ligne mission enregistrée.</div> : <div style={{ display:'grid', gap:12 }}>{rows.map((row:any)=><div key={row.id} style={rowStyle}><div><div style={rowTitleStyle}>{row.mission_code || `Ligne #${row.row_order}`}</div><div style={rowMetaStyle}>{row.service_type || 'Service non défini'} • {row.mission_date || 'Date inconnue'} • {row.start_time || '--:--'} → {row.end_time || '--:--'}</div><div style={rowMetaStyle}>Durée: {row.duration_hours || 0}h • Caregiver ID: {row.caregiver_id || '—'}</div></div><div style={tagStyle}>{row.service_code || 'N/A'}</div></div>)}</div>}</section><section style={panelStyle}><h2 style={panelTitleStyle}>Missions réelles liées au contrat</h2>{missions.length===0 ? <div style={emptyStyle}>Aucune mission réelle liée pour le moment.</div> : <div style={{ display:'grid', gap:12 }}>{missions.map((mission:any)=><div key={mission.id} style={rowStyle}><div><div style={rowTitleStyle}>{mission.mission_code || `Mission #${mission.id}`} • {mission.service_type || 'Mission'}</div><div style={rowMetaStyle}>{mission.mission_date || 'Date inconnue'} • {mission.start_time || '--:--'} → {mission.end_time || '--:--'}</div><div style={rowMetaStyle}>Statut: {mission.status || 'draft'} • Urgence: {mission.urgency || 'normal'} • Caregiver ID: {mission.caregiver_id || '—'}</div></div><Link href={`/missions/${mission.id}`} style={secondaryButtonStyle}>Ouvrir mission</Link></div>)}</div>}</section></main>
}
function InfoCard({ label, value }: { label: string; value: string }) { return <div style={infoCardStyle}><div style={smallLabelStyle}>{label}</div><div style={infoValueStyle}>{value}</div></div> }
const pageStyle: React.CSSProperties = { padding:32, fontFamily:'Arial, sans-serif', background:'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)', minHeight:'100vh' }
const headerStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:20, flexWrap:'wrap', marginBottom:24 }
const eyebrowStyle: React.CSSProperties = { display:'inline-block', padding:'6px 10px', borderRadius:999, background:'#e2e8f0', color:'#334155', fontSize:12, fontWeight:800, marginBottom:10 }
const titleStyle: React.CSSProperties = { margin:0, fontSize:40, lineHeight:1.05, color:'#0f172a', fontWeight:800 }
const subtitleStyle: React.CSSProperties = { color:'#475569', margin:'10px 0 0 0', fontSize:17 }
const heroCardStyle: React.CSSProperties = { background:'rgba(255,255,255,0.96)', borderRadius:24, padding:24, border:'1px solid #dbe3ee', boxShadow:'0 16px 40px rgba(15, 23, 42, 0.07)', marginBottom:20 }
const heroGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(5, minmax(0, 1fr))', gap:14 }
const infoCardStyle: React.CSSProperties = { background:'#fcfdff', border:'1px solid #e2e8f0', borderRadius:14, padding:14 }
const smallLabelStyle: React.CSSProperties = { color:'#64748b', fontSize:13, fontWeight:700, marginBottom:6 }
const infoValueStyle: React.CSSProperties = { color:'#0f172a', fontSize:15, fontWeight:600, lineHeight:1.5 }
const progressHeaderStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', gap:12, marginBottom:8, color:'#334155', fontSize:14 }
const progressTrackStyle: React.CSSProperties = { height:12, borderRadius:999, background:'#e2e8f0', overflow:'hidden' }
const progressFillStyle: React.CSSProperties = { height:12, borderRadius:999, background:'linear-gradient(90deg, #0f172a 0%, #334155 100%)' }
const panelStyle: React.CSSProperties = { background:'rgba(255,255,255,0.96)', borderRadius:24, padding:24, border:'1px solid #dbe3ee', boxShadow:'0 16px 40px rgba(15, 23, 42, 0.06)', marginBottom:20 }
const panelTitleStyle: React.CSSProperties = { margin:'0 0 16px 0', color:'#0f172a', fontSize:24, fontWeight:800 }
const rowStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, padding:14, borderRadius:16, border:'1px solid #e2e8f0', background:'#ffffff' }
const rowTitleStyle: React.CSSProperties = { color:'#0f172a', fontWeight:800, marginBottom:6 }
const rowMetaStyle: React.CSSProperties = { color:'#64748b', fontSize:13, lineHeight:1.6 }
const secondaryButtonStyle: React.CSSProperties = { background:'white', color:'#0f172a', padding:'12px 16px', borderRadius:12, textDecoration:'none', fontWeight:800, border:'1px solid #cbd5e1' }
const emptyStyle: React.CSSProperties = { padding:16, borderRadius:14, border:'1px dashed #cbd5e1', background:'#ffffff', color:'#64748b' }
const tagStyle: React.CSSProperties = { display:'inline-flex', alignItems:'center', padding:'7px 10px', borderRadius:999, background:'#eef2ff', color:'#4338ca', fontSize:12, fontWeight:800, border:'1px solid #c7d2fe' }