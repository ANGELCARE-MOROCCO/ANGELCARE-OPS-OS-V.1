'use client'
import Link from 'next/link'
import type React from 'react'
const alerts=[
['Revenue leakage detected','4 families delayed >48h','critical'],
['Activation bottleneck','3 services blocked','warning'],
['Retention opportunity','2 renewals recoverable','boost']
]

export default function CSAExecutiveCommandCenterV5(){
return <div style={page}>
<aside style={side}>
<div style={brand}><div style={logo}>🎧</div><div><strong>C.S.A OPS</strong><p>Executive Control Tower</p></div></div>

<div style={rail}>
{([
['Mission Control','/csa-home','LIVE'],
['Families','/families','32'],
['Leads','/leads','47'],
['Revenue Risk','/revenue-command-center','12'],
['Escalations','/incidents','11'],
['Voice','/voice-center','ON'],
] as Array<[string, string, string]>).map(([l,h,b])=><Link key={String(l)} href={String(h)} style={nav}><span>{l}</span><b>{b}</b></Link>)}
</div>

<div style={aiBox}>
<span>AI ORCHESTRATION</span>
<strong>Operational pressure increasing in Rabat sector.</strong>
<p>Recovery + retention actions recommended immediately.</p>
</div>
</aside>

<main style={main}>
<header style={hero}>
<div>
<div style={badge}>LIVE EXECUTION GRID</div>
<h1 style={title}>Customer Success Executive Command Center</h1>
<p style={sub}>AI-native operational war room synchronized with families, leads, services, revenue recovery, escalations and communications.</p>

<div style={actions}>
<Link href="/voice-center" style={primary}>Open Voice Recovery</Link>
<Link href="/revenue-command-center" style={secondary}>Revenue Risk</Link>
<Link href="/families" style={secondary}>Families</Link>
</div>
</div>

<div style={mission}>
<span>Operational Pulse</span>
<strong>94%</strong>
<p>11 escalations · 4 critical · 7 recoveries pending</p>
<div style={live}></div>
</div>
</header>

<section style={kpis}>
{[
['Revenue Recovered','182K MAD'],
['Families at Risk','12'],
['Pending Follow-ups','31'],
['Activation SLA','92%'],
['Response Speed','4 min']
].map(([k,v])=><div key={String(k)} style={kpi}><span>{k}</span><strong>{v}</strong><em>Live synchronized</em></div>)}
</section>

<section style={grid}>
<div style={left}>
<div style={panel}>
<div style={head}><h2>Live Recovery Board</h2><Link href="/revenue-command-center">Open →</Link></div>

{[
['Famille El Mansouri','Proposal hesitation','critical'],
['Famille Benali','Activation blocked','warning'],
['Famille Idrissi','Complaint escalation','critical'],
['Famille Alaoui','Renewal opportunity','boost'],
].map(([n,s,p])=><div key={String(n)} style={row}>
<div><strong>{n}</strong><p>{s}</p></div>
<b>{p}</b>
</div>)}
</div>

<div style={panel}>
<div style={head}><h2>AI Recommended Actions</h2></div>
{alerts.map(([t,d,l])=><div key={String(t)} style={alert}>
<div><strong>{t}</strong><p>{d}</p></div>
<b>{l}</b>
</div>)}
</div>
</div>

<div style={center}>
<div style={big}>
<div style={head}><h2>Execution Intelligence Matrix</h2><Link href="/reports">Analytics →</Link></div>

<div style={matrix}>
{[
['Retention Recovery','ACTIVE'],
['Escalation Control','HIGH'],
['Voice Queue','LIVE'],
['Activation Pressure','MEDIUM'],
['Family Satisfaction','STABLE'],
['Revenue Sync','CONNECTED']
].map(([t,s])=><div key={String(t)} style={cell}><span>{t}</span><strong>{s}</strong></div>)}
</div>

<div style={bars}>
<div style={{height:90}}/>
<div style={{height:160}}/>
<div style={{height:120}}/>
<div style={{height:210}}/>
<div style={{height:180}}/>
<div style={{height:240}}/>
</div>
</div>
</div>

<div style={right}>
<div style={panel}>
<div style={head}><h2>Quick Execution Dock</h2></div>
<div style={dock}>
{([
['Call','/voice-center'],
['Recover','/revenue-command-center'],
['Activate','/services'],
['Escalate','/incidents'],
['Families','/families'],
['Tasks','/revenue-command-center/tasks'],
] as Array<[string, string]>).map(([l,h])=><Link key={String(l)} href={String(h)} style={dockBtn}>{l}</Link>)}
</div>
</div>

<div style={panel}>
<div style={head}><h2>Live Activity Stream</h2></div>
{[
'Complaint escalated 2 min ago',
'Recovery call completed',
'Family activation approved',
'Revenue follow-up assigned'
].map(x=><div key={x} style={feed}>{x}</div>)}
</div>
</div>
</section>
</main>
</div>
}

const page: React.CSSProperties ={display:'grid',gridTemplateColumns:'300px 1fr',minHeight:'100vh',background:'#020617',color:'#fff',fontFamily:'Inter,Arial'}
const side: React.CSSProperties ={padding:24,background:'linear-gradient(180deg,#020617,#071226)',borderRight:'1px solid rgba(255,255,255,.08)'}
const brand: React.CSSProperties ={display:'flex',gap:14,alignItems:'center',marginBottom:24}
const logo: React.CSSProperties ={width:56,height:56,borderRadius:20,display:'grid',placeItems:'center',background:'linear-gradient(135deg,#0ea5e9,#8b5cf6)',fontSize:24}
const rail: React.CSSProperties ={display:'grid',gap:10}
const nav: React.CSSProperties ={display:'flex',justifyContent:'space-between',padding:'14px 16px',borderRadius:16,background:'rgba(255,255,255,.05)',textDecoration:'none',color:'#fff',fontWeight:800}
const aiBox: React.CSSProperties ={marginTop:28,padding:18,borderRadius:22,background:'rgba(14,165,233,.12)',border:'1px solid rgba(14,165,233,.25)',display:'grid',gap:8}
const main: React.CSSProperties ={padding:28,display:'grid',gap:18}
const hero: React.CSSProperties ={display:'grid',gridTemplateColumns:'1fr 320px',gap:18,padding:28,borderRadius:34,background:'linear-gradient(135deg,#082f49,#0f172a,#172554)',border:'1px solid rgba(255,255,255,.08)',boxShadow:'0 40px 120px rgba(2,6,23,.45)'}
const badge: React.CSSProperties ={display:'inline-flex',padding:'8px 12px',borderRadius:999,background:'rgba(239,68,68,.18)',color:'#fca5a5',fontWeight:900,fontSize:12}
const title: React.CSSProperties ={fontSize:52,lineHeight:1.02,margin:'16px 0'}
const sub: React.CSSProperties ={fontSize:18,color:'#cbd5e1',maxWidth:800}
const actions: React.CSSProperties ={display:'flex',gap:12,marginTop:22}
const primary: React.CSSProperties ={padding:'14px 18px',borderRadius:16,background:'#ef4444',textDecoration:'none',color:'#fff',fontWeight:900}
const secondary: React.CSSProperties ={padding:'14px 18px',borderRadius:16,background:'rgba(255,255,255,.08)',textDecoration:'none',color:'#fff',fontWeight:900}
const mission: React.CSSProperties ={padding:24,borderRadius:26,background:'rgba(255,255,255,.06)',display:'grid',gap:10}
const live: React.CSSProperties ={height:10,borderRadius:999,background:'linear-gradient(90deg,#22c55e,#38bdf8,#8b5cf6)'}
const kpis: React.CSSProperties ={display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14}
const kpi: React.CSSProperties ={padding:18,borderRadius:22,background:'linear-gradient(180deg,#0f172a,#111827)',border:'1px solid rgba(255,255,255,.06)',display:'grid',gap:8}
const grid: React.CSSProperties ={display:'grid',gridTemplateColumns:'1fr 1.2fr .7fr',gap:18}
const left: React.CSSProperties ={display:'grid',gap:18}
const center: React.CSSProperties ={display:'grid',gap:18}
const right: React.CSSProperties ={display:'grid',gap:18}
const panel: React.CSSProperties ={padding:22,borderRadius:28,background:'#0f172a',border:'1px solid rgba(255,255,255,.06)'}
const big: React.CSSProperties ={padding:22,borderRadius:28,background:'#0f172a',border:'1px solid rgba(255,255,255,.06)'}
const head: React.CSSProperties ={display:'flex',justifyContent:'space-between',marginBottom:16}
const row: React.CSSProperties ={display:'flex',justifyContent:'space-between',padding:16,borderRadius:18,background:'rgba(255,255,255,.04)',marginBottom:10}
const alert: React.CSSProperties ={display:'flex',justifyContent:'space-between',padding:16,borderRadius:18,background:'rgba(239,68,68,.08)',marginBottom:10}
const matrix: React.CSSProperties ={display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}
const cell: React.CSSProperties ={padding:18,borderRadius:18,background:'rgba(255,255,255,.04)',display:'grid',gap:8}
const bars: React.CSSProperties ={height:260,display:'flex',alignItems:'end',gap:16,marginTop:24}
const dock: React.CSSProperties ={display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}
const dockBtn: React.CSSProperties = {
  padding: '14px',
  borderRadius: 14,
  background: 'rgba(255,255,255,.06)',
  textDecoration: 'none',
  color: '#fff',
  fontWeight: 700,
  textAlign: 'center',
}
const feed: React.CSSProperties ={padding:14,borderBottom:'1px solid rgba(255,255,255,.08)'}
