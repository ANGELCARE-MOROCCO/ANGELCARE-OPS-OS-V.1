import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { archiveCaregiver } from '../archive-action'

function text(v: any, f = '—') { return v === null || v === undefined || v === '' ? f : String(v) }
function date(v: any) { return v ? new Date(v).toLocaleString('fr-FR') : '—' }

export default async function CaregiverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const caregiverId = Number(id)
  const supabase = await createClient()

  const [caregiverRes, skillsRes, availabilityRes, notesRes, incidentsRes, checkinsRes, missionsRes] = await Promise.all([
    supabase.from('caregivers').select('*').eq('id', caregiverId).maybeSingle(),
    supabase.from('caregiver_skills').select('*').eq('caregiver_id', caregiverId).order('id', { ascending: false }),
    supabase.from('caregiver_availability').select('*').eq('caregiver_id', caregiverId).order('id', { ascending: true }),
    supabase.from('caregiver_notes').select('*').eq('caregiver_id', caregiverId).order('created_at', { ascending: false }).limit(10),
    supabase.from('caregiver_incidents').select('*').eq('caregiver_id', caregiverId).order('created_at', { ascending: false }).limit(10),
    supabase.from('caregiver_checkins').select('*').eq('caregiver_id', caregiverId).order('event_time', { ascending: false }).limit(12),
    supabase.from('missions').select('*').eq('caregiver_id', caregiverId).order('id', { ascending: false }).limit(12),
  ])

  const caregiver = caregiverRes.data as any
  const skills = skillsRes.data || []
  const availability = availabilityRes.data || []
  const notes = notesRes.data || []
  const incidents = incidentsRes.data || []
  const checkins = checkinsRes.data || []
  const missions = missionsRes.data || []

  if (!caregiver) return <AppShell title="Intervenante introuvable" subtitle="Profil absent."><Link href="/caregivers">Retour caregivers</Link></AppShell>

  const activeMissions = missions.filter((m: any) => ['planned','active','confirmed','in_progress'].includes((m.status || '').toLowerCase())).length
  const reliability = Number(caregiver.reliability_score || 0)
  const risk = incidents.length > 0 || reliability < 50 ? 'surveillance' : reliability >= 80 ? 'top performer' : 'standard'

  return (
    <AppShell title={caregiver.full_name || `Caregiver #${caregiver.id}`} subtitle="Fiche intervenante 360° : disponibilité, compétences, qualité, incidents, pointage et missions." breadcrumbs={[{ label: 'Caregivers', href: '/caregivers' }, { label: caregiver.full_name || `#${caregiver.id}` }]} actions={<><PageAction href="/caregivers" variant="light">Retour</PageAction><PageAction href={`/operations/replacements?caregiver_id=${caregiver.id}`} variant="light">Matching remplacement</PageAction></>}>
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div><div style={eyebrowStyle}>Caregiver 360 Workforce File</div><h1 style={heroTitleStyle}>{caregiver.full_name || 'Intervenante sans nom'}</h1><p style={heroTextStyle}>{text(caregiver.city)} • {text(caregiver.zone)} • {text(caregiver.phone)}</p><div style={tagRowStyle}><span>🎓 Academy: {caregiver.academy_certified ? 'Oui' : 'Non'}</span><span>🧩 Special needs: {caregiver.special_needs_capable ? 'Oui' : 'Non'}</span><span>📊 Score: {reliability}/100</span></div></div>
          <div style={statusPanelStyle(risk)}><strong>{risk.toUpperCase()}</strong><span>Lecture qualité & disponibilité</span></div>
        </section>
        <section style={kpiGridStyle}><Kpi label="Missions" value={missions.length} sub="historique récent" /><Kpi label="Actives" value={activeMissions} sub="charge actuelle" /><Kpi label="Compétences" value={skills.length} sub="déclarées" /><Kpi label="Disponibilités" value={availability.length} sub="slots" /><Kpi label="Incidents" value={incidents.length} sub="qualité" /><Kpi label="Check-ins" value={checkins.length} sub="terrain" /></section>
        <section style={gridStyle}><div style={panelStyle}><Header title="Profil opérationnel" subtitle="Informations utiles au matching et à la supervision." /><div style={infoGridStyle}><Info label="Ville" value={caregiver.city} /><Info label="Zone" value={caregiver.zone} /><Info label="Téléphone" value={caregiver.phone} /><Info label="Statut" value={caregiver.current_status || caregiver.status} /><Info label="Reliability" value={`${reliability}/100`} /><Info label="Academy" value={caregiver.academy_certified ? 'Oui' : 'Non'} /><Info label="Special needs" value={caregiver.special_needs_capable ? 'Oui' : 'Non'} /><Info label="Langues" value={Array.isArray(caregiver.language_tags) ? caregiver.language_tags.join(', ') : caregiver.languages} /></div></div><aside style={panelStyle}><Header title="Lecture manager" subtitle="Décision rapide staffing." /><Insight label="Priorité" value={risk} /><Insight label="Action recommandée" value={activeMissions > 2 ? 'Surveiller charge' : incidents.length ? 'Coaching qualité' : 'Disponible matching'} /><Insight label="Dernier check-in" value={checkins[0] ? date(checkins[0].event_time) : 'Aucun'} /><form action={archiveCaregiver} style={{ marginTop: 16 }}><input type="hidden" name="caregiver_id" value={caregiver.id} /><button style={archiveButtonStyle}>Archiver intervenante</button></form></aside></section>
        <section style={panelStyle}><Header title="Compétences & tags mission" subtitle="Base pour matching intelligent." /><div style={tagWrapStyle}>{(Array.isArray(caregiver.skill_tags) ? caregiver.skill_tags : []).map((t:string)=><span key={t} style={tagStyle}>{t}</span>)}{skills.map((s:any)=><span key={`s-${s.id}`} style={tagStyle}>{text(s.skill_name)} • {text(s.skill_level)}</span>)}{(!skills.length && (!Array.isArray(caregiver.skill_tags) || !caregiver.skill_tags.length)) ? <Empty text="Aucune compétence renseignée." /> : null}</div><div style={briefStyle}><Block title="Résumé compétences" value={caregiver.skills_summary} /><Block title="Notes profil" value={caregiver.notes} /></div></section>
        <section style={gridStyle}><Related title="Disponibilités" items={availability} empty="Aucune disponibilité." render={(a:any)=><><strong>{text(a.weekday)}</strong><span>{text(a.start_time)} → {text(a.end_time)} • {text(a.availability_status, 'available')}</span></>} /><Related title="Missions récentes" items={missions} empty="Aucune mission." hrefBase="/missions" render={(m:any)=><><strong>Mission #{m.id} • {text(m.service_type || m.status)}</strong><span>{text(m.mission_date || m.created_at)} • {text(m.city || m.zone)}</span></>} /></section>
        <section style={gridStyle}><Related title="Check-ins terrain" items={checkins} empty="Aucun pointage." render={(c:any)=><><strong>{c.event_type === 'check_in' ? '🟢 Check-in' : '⚪ Check-out'}</strong><span>{date(c.event_time)} • Mission {text(c.mission_id)}</span></>} /><Related title="Incidents / qualité" items={incidents} empty="Aucun incident." render={(i:any)=><><strong>{text(i.incident_type, 'Incident')} • {text(i.severity)}</strong><span>{text(i.content || i.description)} • {date(i.created_at)}</span></>} /></section>
        <section style={panelStyle}><Header title="Notes opérations" subtitle="Suivi interne et coaching." />{notes.length ? notes.map((n:any)=><div key={n.id} style={itemStyle}><strong>{text(n.note_type,'Note')}</strong><p>{text(n.content || n.note)}</p><small>{date(n.created_at)}</small></div>) : <Empty text="Aucune note." />}</section>
      </div>
    </AppShell>
  )
}
function Kpi({ label, value, sub }: { label:string; value:any; sub:string }) { return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div> }
function Header({ title, subtitle }: { title:string; subtitle:string }) { return <div style={{ marginBottom: 18 }}><h2 style={titleStyle}>{title}</h2><p style={subStyle}>{subtitle}</p></div> }
function Info({ label, value }: { label:string; value:any }) { return <div style={infoStyle}><span>{label}</span><strong>{text(value)}</strong></div> }
function Insight({ label, value }: { label:string; value:any }) { return <div style={insightStyle}><span>{label}</span><strong>{text(value)}</strong></div> }
function Block({ title, value }: { title:string; value:any }) { return <div style={blockStyle}><strong>{title}</strong><p>{text(value, 'Non renseigné')}</p></div> }
function Empty({ text }: { text:string }) { return <div style={emptyStyle}>{text}</div> }
function Related({ title, items, empty, hrefBase, render }: { title:string; items:any[]; empty:string; hrefBase?:string; render:(item:any)=>React.ReactNode }) { return <div style={panelStyle}><Header title={title} subtitle="Données connectées au profil." />{items.length ? items.map((i:any)=>(hrefBase ? <Link key={i.id} href={`${hrefBase}/${i.id}`} style={itemLinkStyle}>{render(i)}</Link> : <div key={i.id} style={itemStyle}>{render(i)}</div>)) : <Empty text={empty} />}</div> }
const pageStyle: React.CSSProperties = { display:'grid', gap:20 }
const heroStyle: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', gap:24, padding:32, borderRadius:34, color:'#fff', background:'radial-gradient(circle at top left,#059669,#020617 68%)', boxShadow:'0 30px 80px rgba(2,6,23,.3)' }
const eyebrowStyle: React.CSSProperties = { display:'inline-flex', padding:'7px 12px', borderRadius:999, background:'rgba(255,255,255,.12)', color:'#bbf7d0', fontWeight:950, fontSize:12, marginBottom:12 }
const heroTitleStyle: React.CSSProperties = { margin:0, color:'#fff', fontSize:40, fontWeight:950 }
const heroTextStyle: React.CSSProperties = { margin:'8px 0', color:'rgba(255,255,255,.85)', fontWeight:800 }
const tagRowStyle: React.CSSProperties = { display:'flex', gap:12, flexWrap:'wrap', color:'#e2e8f0', fontWeight:800, fontSize:13 }
const statusPanelStyle = (risk:any): React.CSSProperties => ({ minWidth:260, padding:22, borderRadius:26, background:String(risk).includes('top')?'rgba(34,197,94,.16)':String(risk).includes('surveillance')?'rgba(245,158,11,.18)':'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.2)', display:'grid', gap:6 })
const kpiGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(6,minmax(0,1fr))', gap:14 }
const kpiStyle: React.CSSProperties = { background:'#fff', border:'1px solid #dbe3ee', borderRadius:22, padding:18, display:'grid', gap:6, color:'#0f172a', boxShadow:'0 18px 38px rgba(15,23,42,.05)' }
const gridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'1.25fr .75fr', gap:18, alignItems:'start' }
const panelStyle: React.CSSProperties = { background:'#fff', border:'1px solid #dbe3ee', borderRadius:26, padding:22, boxShadow:'0 18px 38px rgba(15,23,42,.06)' }
const titleStyle: React.CSSProperties = { margin:0, color:'#0f172a', fontSize:23, fontWeight:950 }
const subStyle: React.CSSProperties = { margin:'7px 0 0', color:'#64748b', fontWeight:750 }
const infoGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:12 }
const infoStyle: React.CSSProperties = { display:'grid', gap:5, padding:13, borderRadius:16, background:'#f8fafc', border:'1px solid #e2e8f0', color:'#334155' }
const insightStyle: React.CSSProperties = { display:'grid', gap:6, padding:15, borderRadius:18, background:'linear-gradient(180deg,#f8fafc,#ecfdf5)', border:'1px solid #dbe3ee', marginBottom:10, color:'#0f172a' }
const archiveButtonStyle: React.CSSProperties = { width:'100%', border:'none', borderRadius:14, padding:'13px 16px', background:'#991b1b', color:'#fff', fontWeight:950, cursor:'pointer' }
const tagWrapStyle: React.CSSProperties = { display:'flex', flexWrap:'wrap', gap:8 }
const tagStyle: React.CSSProperties = { padding:'8px 11px', borderRadius:999, background:'#ecfdf5', color:'#047857', border:'1px solid #a7f3d0', fontWeight:850, fontSize:12 }
const briefStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:12, marginTop:16 }
const blockStyle: React.CSSProperties = { padding:16, borderRadius:18, background:'#f8fafc', border:'1px solid #e2e8f0', color:'#334155' }
const itemStyle: React.CSSProperties = { padding:14, borderRadius:16, background:'#f8fafc', border:'1px solid #e2e8f0', marginBottom:10, color:'#334155', display:'grid', gap:6 }
const itemLinkStyle: React.CSSProperties = { ...itemStyle, textDecoration:'none' }
const emptyStyle: React.CSSProperties = { padding:18, borderRadius:18, background:'#f8fafc', border:'1px dashed #cbd5e1', color:'#64748b', fontWeight:800 }
