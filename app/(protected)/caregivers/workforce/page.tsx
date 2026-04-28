import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
function text(v:any,f='—'){return v===null||v===undefined||v===''?f:String(v)}
export default async function WorkforceCommandPage(){
 const supabase=await createClient()
 const [{data:caregiversRaw},{data:missionsRaw},{data:incidentsRaw},{data:checkinsRaw}]=await Promise.all([
  supabase.from('caregivers').select('*').eq('is_archived',false),
  supabase.from('missions').select('*').limit(500),
  supabase.from('caregiver_incidents').select('*').order('created_at',{ascending:false}).limit(200),
  supabase.from('caregiver_checkins').select('*').order('event_time',{ascending:false}).limit(200),
 ])
 const caregivers=caregiversRaw||[]; const missions=missionsRaw||[]; const incidents=incidentsRaw||[]; const checkins=checkinsRaw||[]
 const available=caregivers.filter((c:any)=>['available','active'].includes((c.current_status||c.status||'').toLowerCase()))
 const busy=caregivers.filter((c:any)=>['busy','on_mission','mission'].includes((c.current_status||'').toLowerCase()))
 const top=caregivers.filter((c:any)=>Number(c.reliability_score||0)>=80)
 const risk=caregivers.filter((c:any)=>Number(c.reliability_score||0)<50||incidents.some((i:any)=>Number(i.caregiver_id)===Number(c.id)))
 const special=caregivers.filter((c:any)=>c.special_needs_capable)
 return <AppShell title="Workforce Command Center" subtitle="Vue CEO/OPS : disponibilité, risques, staffing et performance des intervenantes." breadcrumbs={[{label:'Caregivers',href:'/caregivers'},{label:'Workforce'}]} actions={<PageAction href="/caregivers" variant="light">Retour Caregivers</PageAction>}>
  <div style={pageStyle}>
   <section style={heroStyle}><div><div style={eyebrowStyle}>Field Workforce Intelligence</div><h1 style={heroTitleStyle}>Staffing, qualité & couverture terrain</h1><p style={heroTextStyle}>Priorisez les remplacements, sécurisez les profils sensibles et maximisez le taux de couverture mission.</p></div></section>
   <section style={kpiGridStyle}><Kpi label="Total" value={caregivers.length}/><Kpi label="Disponibles" value={available.length}/><Kpi label="Occupées" value={busy.length}/><Kpi label="Top 80+" value={top.length}/><Kpi label="À surveiller" value={risk.length}/><Kpi label="Special needs" value={special.length}/></section>
   <section style={gridStyle}><Board title="Disponibles maintenant" items={available} empty="Aucune disponibilité claire."/><Board title="Top performers" items={top} empty="Aucun top performer identifié."/><Board title="À risque / coaching" items={risk} empty="Aucun profil à risque."/><Board title="Special needs capable" items={special} empty="Aucune capacité spécifique renseignée."/></section>
   <section style={gridStyle}><Panel title="Derniers check-ins" items={checkins.slice(0,12)} empty="Aucun pointage récent." render={(x:any)=><><strong>{x.event_type==='check_in'?'🟢 Check-in':'⚪ Check-out'} • Caregiver {text(x.caregiver_id)}</strong><span>Mission {text(x.mission_id)} • {x.event_time?new Date(x.event_time).toLocaleString('fr-FR'):'—'}</span></>}/><Panel title="Incidents récents" items={incidents.slice(0,12)} empty="Aucun incident récent." render={(x:any)=><><strong>{text(x.incident_type,'Incident')} • {text(x.severity)}</strong><span>Caregiver {text(x.caregiver_id)} • {text(x.content||x.description)}</span></>}/></section>
  </div>
 </AppShell>
}
function Kpi({label,value}:{label:string;value:any}){return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong></div>}
function Board({title,items,empty}:{title:string;items:any[];empty:string}){return <div style={panelStyle}><h2 style={titleStyle}>{title}</h2>{items.length?items.slice(0,10).map((c:any)=><Link key={c.id} href={`/caregivers/${c.id}`} style={itemStyle}><strong>{text(c.full_name)}</strong><span>{text(c.city)} • {text(c.zone)} • Score {text(String(c.reliability_score ?? 0))}</span></Link>):<div style={emptyStyle}>{empty}</div>}</div>}
function Panel({title,items,empty,render}:{title:string;items:any[];empty:string;render:(x:any)=>React.ReactNode}){return <div style={panelStyle}><h2 style={titleStyle}>{title}</h2>{items.length?items.map((x:any)=><div key={x.id} style={itemStyle}>{render(x)}</div>):<div style={emptyStyle}>{empty}</div>}</div>}
const pageStyle:React.CSSProperties={display:'grid',gap:20}; const heroStyle:React.CSSProperties={padding:32,borderRadius:34,color:'#fff',background:'radial-gradient(circle at top left,#059669,#020617 68%)',boxShadow:'0 30px 80px rgba(2,6,23,.3)'}; const eyebrowStyle:React.CSSProperties={display:'inline-flex',padding:'7px 12px',borderRadius:999,background:'rgba(255,255,255,.12)',color:'#bbf7d0',fontWeight:950,fontSize:12,marginBottom:12}; const heroTitleStyle:React.CSSProperties={margin:0,color:'#fff',fontSize:40,fontWeight:950}; const heroTextStyle:React.CSSProperties={color:'rgba(255,255,255,.86)',fontWeight:750}; const kpiGridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(6,minmax(0,1fr))',gap:14}; const kpiStyle:React.CSSProperties={background:'#fff',border:'1px solid #dbe3ee',borderRadius:22,padding:18,display:'grid',gap:6,color:'#0f172a',boxShadow:'0 18px 38px rgba(15,23,42,.05)'}; const gridStyle:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:18}; const panelStyle:React.CSSProperties={background:'#fff',border:'1px solid #dbe3ee',borderRadius:26,padding:22,boxShadow:'0 18px 38px rgba(15,23,42,.06)'}; const titleStyle:React.CSSProperties={margin:'0 0 14px',color:'#0f172a',fontSize:23,fontWeight:950}; const itemStyle:React.CSSProperties={display:'grid',gap:6,padding:14,borderRadius:16,background:'#f8fafc',border:'1px solid #e2e8f0',marginBottom:10,color:'#334155',textDecoration:'none'}; const emptyStyle:React.CSSProperties={padding:18,borderRadius:18,background:'#f8fafc',border:'1px dashed #cbd5e1',color:'#64748b',fontWeight:800}
