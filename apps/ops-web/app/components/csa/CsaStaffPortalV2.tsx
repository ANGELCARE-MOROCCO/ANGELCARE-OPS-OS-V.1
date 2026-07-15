'use client'
import Link from 'next/link'
import { csaPortalData as d } from '@/lib/csa/csa-staff-portal-data'

export default function CsaStaffPortalV2(){
  return <div style={page}>
    <aside style={side}>
      <div style={brand}><div style={logo}>🎧</div><div><b>C.S.A</b><span>CLIENT SUCCESS OS</span></div></div>
      <div style={nav}>{d.nav.map(([l,h,i])=><Link key={h} href={h} style={navItem}><span>{i}</span>{l}</Link>)}</div>
      <div style={sync}><b>Sync status</b><span>Revenue · Services · Sales · Leads · Families</span><em>All connected</em></div>
    </aside>
    <main style={main}>
      <section style={hero}>
        <div><p style={eyebrow}>AngelCare Customer Success Authority</p><h1>C.S.A Staff Portal Command Center</h1>
        <p>Client success homepage synchronized with Revenue Management, Services, Sales, Leads and Families.</p>
        <div style={heroActions}><Link href="/leads">Lead Recovery</Link><Link href="/families">Family Cockpit</Link><Link href="/services">Service Activation</Link><Link href="/revenue-command-center">Revenue Risk</Link></div></div>
        <div style={score}><span>CSA Execution Score</span><b>91%</b><p>Strong coverage, 11 escalations need closure.</p></div>
      </section>
      <section style={kpis}>{d.kpis.map(k=><Link key={k.label} href={k.href} style={kpi}><div><span>{k.label}</span><b>{k.icon}</b></div><strong>{k.value}</strong><p>Open workspace →</p></Link>)}</section>
      <section style={grid}>
        <div style={col}><Panel title="Today’s Priority Families" href="/families" action="Open Families">{d.familyQueue.map(([n,i,p,h])=><Link key={n} href={h} style={row}><div><b>{n}</b><p>{i}</p></div><span>{p}</span></Link>)}</Panel>
        <Panel title="Operational Workstreams" href="/revenue-command-center/tasks" action="Open Tasks"><div style={cards}>{d.modules.map(([t,h,desc])=><Link key={t} href={h} style={card}><b>{t}</b><p>{desc}</p><span>Open workspace →</span></Link>)}</div></Panel></div>
        <div style={col}><Panel title="Revenue + Service Activation" href="/services" action="Open Services"><div style={pipeline}><Metric label="Ready to activate" value="6" href="/services"/><Metric label="Missing info" value="9" href="/families"/><Metric label="Revenue delay" value="12" href="/revenue-command-center"/><Metric label="Sales handoff" value="8" href="/sales"/></div></Panel>
        <Panel title="Lead Follow-up Queue" href="/leads" action="Open Leads"><Link href="/leads" style={row}><b>Crèche Les Petits Génies</b><span>Schedule visit</span></Link><Link href="/leads" style={row}><b>Famille Berrada</b><span>Call within 2h</span></Link><Link href="/revenue-command-center" style={row}><b>Famille Tazi</b><span>Pricing objection</span></Link></Panel></div>
        <aside style={col}><Panel title="AI Next Best Actions" href="/voice-center" action="Connect">{d.ai.map(x=><div key={x} style={ai}>⚡ {x}</div>)}</Panel>
        <Panel title="Recent Activity" href="/reports" action="View all">{d.activity.map(([t,time,h])=><Link key={t} href={h} style={activity}><b>{t}</b><span>{time}</span></Link>)}</Panel>
        <Panel title="Quick Execution" href="/revenue-command-center/tasks" action="Tasks"><div style={quick}><Link href="/voice-center">Call</Link><Link href="/leads">Follow-up</Link><Link href="/incidents">Escalate</Link><Link href="/services">Activate</Link><Link href="/sales">Handoff</Link><Link href="/revenue-command-center">Recover</Link></div></Panel></aside>
      </section>
    </main>
  </div>
}
function Panel({title,href,action,children}:{title:string;href:string;action:string;children:React.ReactNode}){return <section style={panel}><header><h2>{title}</h2><Link href={href}>{action} →</Link></header>{children}</section>}
function Metric({label,value,href}:{label:string;value:string;href:string}){return <Link href={href} style={metric}><span>{label}</span><b>{value}</b><em>Open →</em></Link>}
const page:React.CSSProperties={minHeight:'100vh',display:'grid',gridTemplateColumns:'290px 1fr',background:'#f3f7fb',fontFamily:'Inter,Arial,sans-serif',color:'#0f172a'}
const side:React.CSSProperties={background:'linear-gradient(180deg,#06111f,#0f172a)',color:'#fff',padding:24}
const brand:React.CSSProperties={display:'flex',gap:14,alignItems:'center',marginBottom:28}
const logo:React.CSSProperties={width:48,height:48,borderRadius:16,display:'grid',placeItems:'center',background:'#164e63'}
const nav:React.CSSProperties={display:'grid',gap:8}
const navItem:React.CSSProperties={display:'flex',gap:12,alignItems:'center',padding:'12px 13px',borderRadius:14,color:'#e0f2fe',textDecoration:'none',fontWeight:900}
const sync:React.CSSProperties={marginTop:30,padding:16,borderRadius:18,background:'rgba(255,255,255,.08)',display:'grid',gap:7,color:'#bae6fd'}
const main:React.CSSProperties={padding:28,display:'grid',gap:18}
const hero:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr 320px',gap:24,background:'linear-gradient(135deg,#082f49,#0f172a)',color:'#fff',borderRadius:32,padding:28}
const eyebrow:React.CSSProperties={fontSize:12,textTransform:'uppercase',letterSpacing:2,color:'#bae6fd',fontWeight:950}
const heroActions:React.CSSProperties={display:'flex',flexWrap:'wrap',gap:10,marginTop:20}
const score:React.CSSProperties={border:'1px solid rgba(255,255,255,.18)',borderRadius:24,padding:20,background:'rgba(255,255,255,.09)'}
const kpis:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12}
const kpi:React.CSSProperties={background:'#fff',border:'1px solid #dbe3ee',borderRadius:22,padding:18,color:'#0f172a',textDecoration:'none'}
const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr 1fr 360px',gap:16,alignItems:'start'}
const col:React.CSSProperties={display:'grid',gap:16}
const panel:React.CSSProperties={background:'#fff',border:'1px solid #dbe3ee',borderRadius:26,padding:20}
const row:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:14,alignItems:'center',padding:14,borderRadius:18,background:'#f8fafc',border:'1px solid #e2e8f0',color:'#0f172a',textDecoration:'none',marginBottom:10}
const cards:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}
const card:React.CSSProperties={padding:16,borderRadius:20,border:'1px solid #e2e8f0',background:'#f8fafc',textDecoration:'none',color:'#0f172a'}
const pipeline:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}
const metric:React.CSSProperties={padding:16,borderRadius:18,background:'#0f172a',color:'#fff',textDecoration:'none',display:'grid',gap:8}
const ai:React.CSSProperties={padding:12,borderRadius:16,background:'#eff6ff',color:'#1e3a8a',fontWeight:850,marginBottom:10}
const activity:React.CSSProperties={display:'grid',gap:5,padding:12,borderBottom:'1px solid #e2e8f0',textDecoration:'none',color:'#0f172a'}
const quick:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}
