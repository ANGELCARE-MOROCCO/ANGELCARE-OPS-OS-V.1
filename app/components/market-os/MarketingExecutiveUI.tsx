'use client'

import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import Link from 'next/link'

type NavItem = [string, string, string, string]
type KPIItem = [string, string, string, string, string]
type CampaignItem = [string, string, string, string, string, string]
type ChannelItem = [string, string, string, string]
type InsightItem = [string, string, string, string, string]
type TripleItem = [string, string, string]
type ContentItem = [string, string, string, string]
type QuickActionItem = [string, string]
type ActivityItem = {
  title: string
  channel?: string
  region?: string
  tag?: string
  time?: string
  href: string
}
type SyncItem = {
  module: string
  href: string
}

const nav: NavItem[] = [
  ['Marketing Home','/market-os/marketing-home','⌂','HOME'],
  ['Market-OS','/market-os','◎','OS'],
  ['Revenue','/revenue-command-center','◇',''],
  ['Leads','/leads','◈',''],
  ['Sales','/sales','▱',''],
  ['Services','/services','✣',''],
  ['Families','/families','⌘',''],
]

const fallbackKpis: KPIItem[] = [
  ['Total Revenue Impact','12.64M MAD','+28.4%','/revenue-command-center','#22c55e'],
  ['New Leads','1,842','+35.7%','/leads','#38bdf8'],
  ['Marketing ROI','385%','+18.2%','/reports','#a855f7'],
  ['Customer Acquisition Cost','98 MAD','-14.6%','/reports','#f59e0b'],
  ['Conversion Rate','7.62%','+9.3%','/reports','#22d3ee'],
  ['LTV / CAC Ratio','8.7x','+21.5%','/reports','#c084fc'],
]

const topCampaigns: CampaignItem[] = [
  ['Ramadan Awareness 2025','Reach 1.2M','Conversions 186','2.48M MAD','412%','/market-os/campaign-lifecycle'],
  ['Elderly Care Services','Reach 875K','Conversions 142','1.87M MAD','378%','/market-os/campaign-lifecycle'],
  ['Post-Surgery Recovery','Reach 642K','Conversions 98','1.24M MAD','352%','/market-os/campaign-lifecycle'],
  ['Angelcare Home Care','Reach 521K','Conversions 76','890K MAD','290%','/market-os/content-command-center'],
  ['Caregiver Recruitment','Reach 311K','Conversions 52','430K MAD','268%','/market-os/partners-network'],
]

const channelRows: ChannelItem[] = [
  ['Facebook Ads','32.6%','4.12M MAD','#3b82f6'],
  ['Google Ads','24.8%','3.13M MAD','#ec4899'],
  ['TikTok Ads','18.7%','2.36M MAD','#f59e0b'],
  ['Instagram','12.9%','1.63M MAD','#ef4444'],
  ['Email Marketing','6.1%','770K MAD','#22c55e'],
  ['Others','4.9%','620K MAD','#64748b'],
]

const insights: InsightItem[] = [
  ['Budget Shift Opportunity','Move 15% budget from Instagram to Google Ads.','High Impact','Potential +22% ROI','/revenue-command-center'],
  ['Audience Expansion','Lookalike audience shows 34% higher conversion.','Growth','Potential +18% Leads','/leads'],
  ['Content Optimization','Video content generates 2.6x more engagement.','Optimize','Potential +32% Engagement','/market-os/content-command-center'],
  ['Email Automation','Re-engagement emails can recover 230+ leads.','Automation','Potential +15% Conversion','/market-os/automation-control'],
]

const funnelRows: TripleItem[] = [['Impressions','2.45M','+12.5%'],['Clicks','125.6K','+18.3%'],['Landing Page Views','47.3K','+21.7%'],['Leads','1,842','+35.7%'],['Conversions','312','+28.1%']]
const contentRows: ContentItem[] = [['Home Care Services Video','128K','8.7%','96/100'],['Patient Testimonial – Fatima','96K','7.2%','89/100'],['Caregiver Training Tips','74K','6.1%','82/100'],['Post-Surgery Recovery Guide','61K','5.3%','78/100']]

function ago(value?: string) {
  if (!value) return 'live'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function MarketingExecutiveUI() {
  const [snapshot,setSnapshot] = useState<any>(null)
  const [status,setStatus] = useState<'loading'|'live'|'safe'>('loading')
  const [tick,setTick] = useState(0)

  useEffect(() => {
    let alive = true
    async function load(){
      try{
        const res = await fetch('/api/marketing/deep-sync',{cache:'no-store'})
        const json = await res.json()
        if(!alive) return
        if(json?.ok){ setSnapshot(json); setStatus(json.mode === 'deep-live' ? 'live' : 'safe') }
        else setStatus('safe')
      }catch{ if(alive) setStatus('safe') }
    }
    load()
    const a=setInterval(load,30000), b=setInterval(()=>setTick(v=>v+1),15000)
    return ()=>{alive=false; clearInterval(a); clearInterval(b)}
  },[])

  const kpis = useMemo<KPIItem[]>(() => snapshot?.kpis?.length ? snapshot.kpis.slice(0,6).map((x:any,i:number): KPIItem => [String(x.label),String(x.value),String(x.delta || '+ live'),String(x.href),['#22c55e','#38bdf8','#a855f7','#f59e0b','#22d3ee','#c084fc'][i]]) : fallbackKpis,[snapshot])

  const activity: ActivityItem[] = snapshot?.activity?.length ? snapshot.activity : [
    {title:'New lead generated',channel:'Website Form',region:'Casablanca',tag:'Hot',time:new Date(Date.now()-120000).toISOString(),href:'/leads'},
    {title:'Campaign achieved 100K impressions',channel:'Facebook Ads',region:'Rabat',tag:'Info',time:new Date(Date.now()-480000).toISOString(),href:'/market-os/campaign-lifecycle'},
    {title:'New content published',channel:'Home Care Video',region:'—',tag:'Success',time:new Date(Date.now()-900000).toISOString(),href:'/market-os/content-command-center'},
    {title:'Budget approved',channel:'Google Ads',region:'4.20M MAD',tag:'Finance',time:new Date(Date.now()-1320000).toISOString(),href:'/revenue-command-center'},
    {title:'High intent lead detected',channel:'Post-Surgery Recovery',region:'Rabat',tag:'Hot',time:new Date(Date.now()-2100000).toISOString(),href:'/leads'},
  ]

  const sync: SyncItem[] = snapshot?.sync?.length ? snapshot.sync : [
    {module:'Marketing OS',href:'/market-os'}, {module:'Revenue OS',href:'/revenue-command-center'},
    {module:'Leads OS',href:'/leads'}, {module:'Sales OS',href:'/sales'}, {module:'Services OS',href:'/services'}, {module:'Families OS',href:'/families'},
  ]

  return <div style={page}>
    <aside style={sidebar}>
      <div style={brand}><div style={heart}>♡</div><strong>Angelcare</strong></div>
      <div style={navWrap}><p>MARKET-OS</p>{nav.map(([l,h,i,b])=><Link key={String(l)} href={String(h)} style={l==='Marketing Home'?navActive:navItem}><span>{i}</span><b>{l}</b>{b?<em>{b}</em>:null}</Link>)}</div>
      <div style={assistant}><b>AI Marketing Assistant</b><span>● Online</span><p>Ask anything...</p></div>
      <div style={workspace}><b>Marketing Workspace</b><span>All systems operational ●</span></div>
    </aside>

    <main style={main}>
      <header style={topbar}><div style={search}>⌕ Search across Market-OS...</div><div style={icons}><span>✦</span><span>🔔</span><b>Marketing Executive</b></div></header>
      <section style={hero}><div><h1><span>AI-Powered Marketing</span> Executive Command Center</h1><p>Real-time intelligence. Smarter decisions. Measurable growth.</p></div><div style={heroControls}><Link href="/reports">Share</Link><Link href="/reports">Export</Link><Link href="/market-os/campaign-lifecycle">+ New Campaign</Link></div></section>

      <section style={kpiGrid}>{kpis.map(([l,v,d,h,c])=><Link key={String(l)} href={String(h)} style={kpi}><span>{l}</span><strong>{v}</strong><em style={{color:c}}>{d} vs prev 7 days</em><svg viewBox="0 0 120 26" width="100%" height="26"><path d="M2 21 C18 14,24 18,38 13 C52 8,62 16,78 7 C92 0,104 10,118 4" fill="none" stroke={c as string} strokeWidth="3"/></svg></Link>)}<div style={liveSync}><b>Live Sync</b><p>All systems operational</p>{sync.slice(0,5).map((s:any)=><Link href={String(s.href)} key={String(s.module)}><span>{s.module}</span><b>Live</b></Link>)}</div></section>

      <section style={dashboardTop}>
        <Panel title="Performance Overview" action={<Link href="/reports">7D</Link>}><Chart/></Panel>
        <Panel title="Channel Performance" action={<Link href="/reports">View All Channels</Link>}><div style={channelPanel}><div style={donut}><b>12.64M<br/><small>Total Revenue</small></b></div><div style={channelList}>{channelRows.map(([n,p,v,c])=><Link href="/reports" key={String(n)}><i style={{background:c}}/><span>{n}</span><b>{p}</b><em>{v}</em></Link>)}</div></div></Panel>
        <Panel title="Funnel Analytics" action={<Link href="/reports">View Full Funnel</Link>}><div style={funnel}>{funnelRows.map(([l,v,d],i)=><div key={String(l)} style={{width:`${100-i*10}%`}}><span>{l}</span><b>{v}</b><em>{d}</em></div>)}</div><div style={conversion}><span>Conversion Rate</span><b>7.62%</b><em>+9.3%</em></div></Panel>
      </section>

      <section style={dashboardMid}>
        <Panel title="Top Campaigns" action={<Link href="/market-os/campaign-lifecycle">View All</Link>}>{topCampaigns.map(([n,r,c,rev,roas,href],i)=><Link href={String(href)} key={String(n)} style={campaign}><div>{i+1}</div><b>{n}</b><span>{r}</span><span>{c}</span><strong>{rev}</strong><em>{roas}</em></Link>)}</Panel>
        <Panel title="AI Insights & Recommendations" action={<Link href="/reports">View All</Link>}>{insights.map(([t,d,tag,impact,href])=><Link href={String(href)} key={String(t)} style={insight}><b>{t}</b><p>{d}</p><span>{tag}</span><em>{impact}</em></Link>)}</Panel>
        <Panel title="Audience Insights" action={<Link href="/reports">View Full Report</Link>}><div style={audience}><div style={audDonut}>126.4K<br/><small>Total Audience</small></div><div>{['Women 62.3%','Men 37.1%','18-34 years 41.8%','Casablanca 28.4%','Rabat 18.7%','Other Cities 40.0%'].map(x=><p key={x}>{x}</p>)}</div></div></Panel>
        <Panel title="Content Performance" action={<Link href="/market-os/content-command-center">View All</Link>}>{contentRows.map(([t,v,e,s])=><Link href="/market-os/content-command-center" key={String(t)} style={contentRow}><b>{t}</b><span>{v}</span><span>{e}</span><em>{s}</em></Link>)}</Panel>
      </section>

      <section style={dashboardBottom}>
        <Panel title="Budget Overview" action={<Link href="/revenue-command-center">View Full Report</Link>}><div style={budget}><b>8.42M MAD</b><span>Total Spent of 12.00M MAD</span></div><p>Budget pacing on track</p></Panel>
        <Panel title="Recent Activity Feed" action={<Link href="/reports">View All Activity</Link>}>{activity.slice(0,5).map((a:any)=><Link href={a.href} key={`${a.title}-${a.time}`} style={activityRow}><span>{ago(a.time)}</span><b>{a.title}</b><em>{a.channel}</em><small>{a.region}</small><strong>{a.tag}</strong></Link>)}</Panel>
        <Panel title="Tasks & Approvals" action={<Link href="/revenue-command-center/tasks">View All</Link>}>{['Approve Google Ads Budget · 4.20M MAD · High','Review Campaign Creatives · Medium','Q2 Marketing Strategy Update · High','Partner Contract Review · Low'].map(x=><Link href="/revenue-command-center/tasks" key={x} style={task}>{x}</Link>)}</Panel>
        <Panel title="Quick Actions" action={null}><div style={quick}>{([['New Campaign','/market-os/campaign-lifecycle'],['Create Audience','/leads'],['Content Studio','/market-os/content-command-center'],['Automation Rule','/market-os/automation-control'],['Generate Report','/reports'],['All Workspaces','/market-os']] as QuickActionItem[]).map(([l,h])=><Link href={String(h)} key={String(l)}>{l}</Link>)}</div></Panel>
      </section>
      <div style={syncDock}><b>Market-OS Sync Status</b>{sync.slice(0,6).map((s:any)=><Link href={String(s.href)} key={String(s.module)}>{s.module}<span>✓</span></Link>)}</div>
    </main>
  </div>
}

function Chart(){return <div style={bigChart}><svg viewBox="0 0 700 300" width="100%" height="100%" preserveAspectRatio="none"><defs><linearGradient id="line" x1="0" x2="1"><stop stopColor="#22c55e"/><stop offset=".5" stopColor="#38bdf8"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>{[55,105,155,205,255].map(y=><line key={y} x1="30" y1={y} x2="670" y2={y} stroke="rgba(148,163,184,.14)" />)}<path d="M30 235 C110 180,140 170,210 165 C280 160,310 115,385 110 C470 105,480 145,560 120 C620 98,640 82,670 55" fill="none" stroke="url(#line)" strokeWidth="5"/><path d="M30 250 C120 210,150 198,220 190 C310 182,330 150,410 160 C500 170,540 132,670 118" fill="none" stroke="#38bdf8" strokeDasharray="12 12" strokeWidth="3"/></svg></div>}
function Panel({title, action, children}:{title:string; action:React.ReactNode; children:React.ReactNode}){return <section style={panel}><header><h2>{title}</h2>{action}</header>{children}</section>}

const page:React.CSSProperties={minHeight:'100vh',display:'grid',gridTemplateColumns:'270px 1fr',background:'#040b16',color:'#e5eefc',fontFamily:'Inter,Arial,sans-serif'}
const sidebar:React.CSSProperties={height:'100vh',position:'sticky',top:0,overflowY:'auto',padding:22,background:'linear-gradient(180deg,#06111f,#040b16)',borderRight:'1px solid rgba(148,163,184,.16)',display:'grid',alignContent:'start',gap:22}
const brand:React.CSSProperties={display:'flex',alignItems:'center',gap:12,fontSize:24}
const heart:React.CSSProperties={width:48,height:48,borderRadius:18,display:'grid',placeItems:'center',background:'linear-gradient(135deg,#06b6d4,#7c3aed)'}
const navWrap:React.CSSProperties={display:'grid',gap:8}
const navItem:React.CSSProperties={display:'grid',gridTemplateColumns:'24px 1fr auto',gap:10,alignItems:'center',padding:'12px 13px',borderRadius:12,color:'#cbd5e1',textDecoration:'none',background:'rgba(255,255,255,.025)',fontWeight:850}
const navActive:React.CSSProperties={...navItem,background:'linear-gradient(135deg,#7c3aed,#2563eb)',color:'#fff'}
const assistant:React.CSSProperties={padding:16,borderRadius:16,background:'rgba(124,58,237,.14)',border:'1px solid rgba(124,58,237,.28)',display:'grid',gap:8}
const workspace:React.CSSProperties={padding:16,borderRadius:16,background:'rgba(255,255,255,.04)',display:'grid',gap:8}
const main:React.CSSProperties={padding:24,display:'grid',gap:16}
const topbar:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr auto',gap:16,alignItems:'center'}
const search:React.CSSProperties={padding:'14px 16px',borderRadius:14,background:'#0d1726',border:'1px solid rgba(148,163,184,.14)',color:'#94a3b8'}
const icons:React.CSSProperties={display:'flex',gap:16,alignItems:'center'}
const hero:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr auto',gap:18,alignItems:'center'}
const heroControls:React.CSSProperties={display:'flex',gap:10,alignItems:'center'}
const kpiGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:12}
const kpi:React.CSSProperties={padding:16,borderRadius:16,background:'linear-gradient(180deg,#101827,#0b1320)',border:'1px solid rgba(148,163,184,.16)',color:'#fff',textDecoration:'none',display:'grid',gap:6}
const liveSync:React.CSSProperties={padding:16,borderRadius:16,background:'linear-gradient(180deg,#101827,#0b1320)',border:'1px solid rgba(34,197,94,.25)',display:'grid',gap:7}
const dashboardTop:React.CSSProperties={display:'grid',gridTemplateColumns:'1.2fr .95fr .95fr',gap:14}
const dashboardMid:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:14}
const dashboardBottom:React.CSSProperties={display:'grid',gridTemplateColumns:'.9fr 1.3fr .9fr .75fr',gap:14}
const panel:React.CSSProperties={padding:18,borderRadius:18,background:'linear-gradient(180deg,#0d1726,#09111e)',border:'1px solid rgba(14,165,233,.20)',boxShadow:'0 22px 70px rgba(0,0,0,.24)'}
const bigChart:React.CSSProperties={height:295,borderRadius:15,background:'radial-gradient(circle at 40% 20%,rgba(34,197,94,.18),transparent 45%),rgba(2,6,23,.30)',overflow:'hidden'}
const channelPanel:React.CSSProperties={display:'grid',gridTemplateColumns:'220px 1fr',gap:16,alignItems:'center'}
const donut:React.CSSProperties={width:210,height:210,borderRadius:'50%',display:'grid',placeItems:'center',textAlign:'center',background:'conic-gradient(#3b82f6 0 33%,#22c55e 33% 58%,#f59e0b 58% 77%,#ec4899 77% 90%,#64748b 90% 100%)'}
const channelList:React.CSSProperties={display:'grid',gap:9}
const funnel:React.CSSProperties={display:'grid',justifyItems:'center',gap:6}
const conversion:React.CSSProperties={marginTop:14,padding:14,borderRadius:12,background:'rgba(255,255,255,.04)',display:'flex',justifyContent:'space-between'}
const campaign:React.CSSProperties={display:'grid',gridTemplateColumns:'32px 1fr auto auto auto',gap:10,alignItems:'center',padding:11,borderRadius:12,background:'rgba(255,255,255,.045)',color:'#fff',textDecoration:'none',marginBottom:8}
const insight:React.CSSProperties={display:'grid',gap:6,padding:12,borderRadius:13,background:'rgba(255,255,255,.045)',color:'#fff',textDecoration:'none',marginBottom:8}
const audience:React.CSSProperties={display:'grid',gridTemplateColumns:'160px 1fr',gap:14}
const audDonut:React.CSSProperties={width:150,height:150,borderRadius:'50%',display:'grid',placeItems:'center',background:'conic-gradient(#8b5cf6 0 40%,#0ea5e9 40% 70%,#22c55e 70% 100%)',textAlign:'center'}
const contentRow:React.CSSProperties={display:'grid',gridTemplateColumns:'1fr auto auto auto',gap:10,padding:10,color:'#fff',textDecoration:'none',borderBottom:'1px solid rgba(148,163,184,.12)'}
const budget:React.CSSProperties={height:150,borderRadius:'150px 150px 20px 20px',display:'grid',placeItems:'center',background:'conic-gradient(from 270deg,#3b82f6 0 70%,#22c55e 70% 88%,#1f2937 88% 100%)',textAlign:'center'}
const activityRow:React.CSSProperties={display:'grid',gridTemplateColumns:'80px 1fr 150px 110px 70px',gap:10,padding:10,color:'#fff',textDecoration:'none',borderBottom:'1px solid rgba(148,163,184,.12)'}
const task:React.CSSProperties={display:'block',padding:11,color:'#fff',textDecoration:'none',borderBottom:'1px solid rgba(148,163,184,.12)'}
const quick:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}
const syncDock:React.CSSProperties={justifySelf:'center',display:'flex',gap:18,alignItems:'center',padding:'16px 24px',borderRadius:20,background:'rgba(13,23,38,.9)',border:'1px solid rgba(148,163,184,.18)'}