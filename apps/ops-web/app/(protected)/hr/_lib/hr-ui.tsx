import Link from 'next/link'

export const TASK_TYPES = [
  'Open position approval','Candidate phone screen','Interview scheduling','Reference check','Offer preparation',
  'Contract collection','Onboarding document review','Training assignment','Probation follow-up',
  'Attendance exception review','Roster coverage repair','Department structure update','Position budget validation',
  'Staff profile audit','Compliance escalation'
]

export const HR_MODULES = [
  ['📌','Opening Jobs','/hr/openings','Headcount requests, approved openings, budgets and urgency control.'],
  ['🎯','Recruitment','/hr/recruitment','Candidate pipeline, interviews, scoring, decisions and offers.'],
  ['🚀','Onboarding','/hr/onboarding','Integration, documents, training, probation and readiness.'],
  ['👥','Staff Profiles','/hr/staff','Full employee profiles, skills, documents, notes and status.'],
  ['🏢','Departments','/hr/departments','Department and position control with headcount planning.'],
  ['🗓️','Rosters','/hr/rosters','Shift planning, assignment, coverage, locations and exceptions.'],
  ['🕒','Attendance','/hr/attendance','Presence, lateness, absences, corrections and approvals.'],
  ['✅','HR Tasks','/hr/tasks','Daily HR execution queue with AngelCare task types.'],
] as const

export function fmtDate(v: unknown) {
  if (!v) return '—'
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v).slice(0,16)
  return d.toLocaleDateString('fr-MA', { day:'2-digit', month:'short', year:'numeric' })
}
export function statusTone(status: unknown): 'blue'|'green'|'red'|'amber'|'purple'|'slate' {
  const s=String(status||'').toLowerCase()
  if(['active','approved','hired','completed','present','done','ready','open'].includes(s)) return 'green'
  if(['urgent','blocked','rejected','absent','late','cancelled','critical'].includes(s)) return 'red'
  if(['pending','screening','interview','in_progress','draft','planned'].includes(s)) return 'amber'
  if(['new','submitted','scheduled','assigned'].includes(s)) return 'blue'
  if(['offer','probation','training','integration'].includes(s)) return 'purple'
  return 'slate'
}

export function Field({name,label,type='text',value,placeholder=''}:{name:string;label:string;type?:string;value?:any;placeholder?:string}) {
  return <label style={fieldStyle}><span style={labelStyle}>{label}</span><input name={name} type={type} defaultValue={value ?? ''} placeholder={placeholder} style={inputStyle}/></label>
}
export function Select({name,label,value,options}:{name:string;label:string;value?:any;options:string[]}) {
  return <label style={fieldStyle}><span style={labelStyle}>{label}</span><select name={name} defaultValue={value || options[0]} style={inputStyle}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></label>
}
export function Textarea({name,label,value}:{name:string;label:string;value?:any}) {
  return <label style={{...fieldStyle,gridColumn:'1/-1'}}><span style={labelStyle}>{label}</span><textarea name={name} defaultValue={value ?? ''} style={textareaStyle}/></label>
}
export function ModuleTile({icon,title,href,text}:{icon:string;title:string;href:string;text:string}) {
  return <Link href={href} style={moduleTileStyle}><div style={moduleIconStyle}>{icon}</div><div><b style={{color:'#0f172a',fontSize:17}}>{title}</b><p style={{margin:'7px 0 0',color:'#64748b',fontWeight:650,lineHeight:1.55}}>{text}</p></div></Link>
}

export const pageGridStyle: React.CSSProperties = {display:'grid',gridTemplateColumns:'minmax(0,1fr) 360px',gap:20,alignItems:'start'}
export const gridStyle: React.CSSProperties = {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}
export const cardStyle: React.CSSProperties = {background:'#fff',border:'1px solid #dbe3ee',borderRadius:24,padding:22,boxShadow:'0 18px 38px rgba(15,23,42,.06)'}
export const listStyle: React.CSSProperties = {display:'grid',gap:12}
export const fieldStyle: React.CSSProperties = {display:'grid',gap:7}
export const labelStyle: React.CSSProperties = {fontSize:12,color:'#475569',fontWeight:900,textTransform:'uppercase',letterSpacing:.3}
export const inputStyle: React.CSSProperties = {width:'100%',minHeight:44,border:'1px solid #cbd5e1',borderRadius:14,padding:'10px 12px',fontSize:14,fontWeight:700,color:'#0f172a',background:'#fff',boxSizing:'border-box'}
export const textareaStyle: React.CSSProperties = {...inputStyle,minHeight:110,resize:'vertical',fontFamily:'inherit'}
export const buttonStyle: React.CSSProperties = {border:'0',borderRadius:14,background:'#0f172a',color:'#fff',fontWeight:950,padding:'11px 14px',textDecoration:'none',cursor:'pointer',display:'inline-flex',justifyContent:'center',alignItems:'center'}
export const ghostButtonStyle: React.CSSProperties = {...buttonStyle,background:'#f8fafc',color:'#0f172a',border:'1px solid #cbd5e1'}
export const dangerButtonStyle: React.CSSProperties = {...buttonStyle,background:'#dc2626'}
export const miniButtonStyle: React.CSSProperties = {...buttonStyle,fontSize:12,padding:'8px 10px',borderRadius:11}
export const tableStyle: React.CSSProperties = {width:'100%',borderCollapse:'separate',borderSpacing:'0 10px'}
export const thStyle: React.CSSProperties = {textAlign:'left',color:'#64748b',fontSize:12,fontWeight:950,padding:'8px 10px',textTransform:'uppercase'}
export const tdStyle: React.CSSProperties = {background:'#f8fafc',borderTop:'1px solid #e2e8f0',borderBottom:'1px solid #e2e8f0',padding:'12px 10px',color:'#0f172a',fontSize:13,fontWeight:700}
export const heroStyle: React.CSSProperties = {background:'radial-gradient(circle at top left,#334155 0%,#0f172a 45%,#020617 100%)',borderRadius:30,padding:28,color:'#fff',display:'grid',gridTemplateColumns:'minmax(0,1fr) 340px',gap:22,alignItems:'stretch'}
export const heroTitleStyle: React.CSSProperties = {margin:'0 0 10px',fontSize:42,lineHeight:1.02,letterSpacing:-1.4,color:'#fff',fontWeight:1000}
export const heroTextStyle: React.CSSProperties = {color:'#cbd5e1',fontSize:15,lineHeight:1.7,fontWeight:650,maxWidth:900}
export const heroBadgeStyle: React.CSSProperties = {display:'inline-flex',border:'1px solid rgba(255,255,255,.22)',background:'rgba(255,255,255,.12)',padding:'7px 10px',borderRadius:999,fontSize:12,fontWeight:950,letterSpacing:.4,color:'#e0f2fe',marginBottom:14}
const moduleTileStyle: React.CSSProperties = {display:'flex',gap:14,alignItems:'flex-start',border:'1px solid #dbe3ee',borderRadius:22,background:'linear-gradient(180deg,#fff 0%,#f8fafc 100%)',padding:18,textDecoration:'none',boxShadow:'0 14px 32px rgba(15,23,42,.06)'}
const moduleIconStyle: React.CSSProperties = {minWidth:54,width:54,height:54,display:'grid',placeItems:'center',borderRadius:18,background:'#eef2ff',border:'1px solid #c7d2fe',fontSize:26}
