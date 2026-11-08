'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode, type ChangeEvent, type FormEvent, type MouseEvent as ReactMouseEvent } from 'react'
import Link from 'next/link'
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, CircleAlert, Clock3, Cloud, Database, Download, ExternalLink,
  Eye, FileCheck2, FileSearch, Filter, Gauge, Globe2, Layers3, LockKeyhole, Radar,
  RefreshCw, Search, ServerCog, ShieldAlert, ShieldCheck, Sparkles, TrendingUp, X
} from 'lucide-react'
import type { GoogleOverview, SearchSummary, AnalyticsSummary, Inspection, Diagnostics, InspectionHistory, SearchPage } from './server'
import type { NativePage, NativeSummary } from './native'
import s from './google-intelligence.module.css'

const API='/api/angelcare-marketplace/admin/seo-power/google-intelligence'
const SEO_HOME='/angelcare-marketplace/admin/seo-power'
type Tab='command'|'search'|'inventory'|'analytics'|'inspection'|'diagnostics'
type Envelope<T>={data?:T;error?:{code?:string;message?:string}}
type World='all'|'AngelCare'|'KidFlix'|'JOBKIX'
const WORLDS:World[]=['all','AngelCare','KidFlix','JOBKIX']
const NAV:[Tab,string,typeof Activity][]=[['command','Command Center',Radar],['search','Search Performance',TrendingUp],['inventory','Native Coverage',Layers3],['analytics','Organic Analytics',BarChart3],['inspection','URL Inspection',FileSearch],['diagnostics','System & Quotas',ServerCog]]
const nf=(v:number)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(v)
const dec=(v:number)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(v)
const pct=(v:number)=>`${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:2}).format(100*v)}%`
const stamp=(value:string|null|undefined)=>value&&!Number.isNaN(new Date(value).getTime())?new Date(value).toLocaleString('fr-FR'):'Not reported'
const trend=(n:number,prior:number)=>prior?Math.round(((n-prior)/prior)*100):null
const WNAME=(w:World)=>w==='all'?'All worlds':w
const wkey=(w:World)=>w==='all'?'all':w.toLowerCase()
function downloadCsv(filename:string,columns:string[],lines:Array<Array<string|number>>){
  const cell=(v:string|number)=>{let x=String(v??'');if(/^[=+@-]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"'}
  const content='\ufeff'+[columns,...lines].map(row=>row.map(cell).join(',')).join('\r\n')
  const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}))
  const link=document.createElement('a');link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)
}
async function api<T>(path='',options?:RequestInit):Promise<T>{
  const r=await fetch(API+path,{credentials:'same-origin',cache:'no-store',...options})
  let b:Envelope<T>
  try{b=await r.json() as Envelope<T>}catch{throw new Error(`Invalid server response (${r.status}).`)}
  if(!r.ok||b.data===undefined)throw new Error(`${b.error?.message||'Unconfirmed response.'}${b.error?.code?` [${b.error.code}]`:''}`)
  return b.data
}
function State({ok,label}:{ok:boolean;label:string}){return <span className={s.status} data-ok={ok}><i/>{label}</span>}
function Delta({now,prior}:{now:number;prior:number}){
  const d=trend(now,prior)
  return <span className={s.delta} data-positive={d!==null&&d>=0} title="Change vs previous equal-length reporting period">{d===null?'No comparison':<>{d>=0?<TrendingUp size={12}/>:<ArrowDownRight size={12}/>} {d>=0?'+':''}{d}% vs previous</>}</span>
}
function Metric({title,value,description,icon,delta,shade}:{title:string;value:string;description:string;icon:ReactNode;delta?:ReactNode;shade?:string}){
  return <article className={s.metric} data-shade={shade||'blue'}><div className={s.metricTop}><span>{title}</span><span className={s.metricIcon}>{icon}</span></div><strong>{value}</strong><p>{description}</p><div className={s.metricDelta}>{delta||<span>Google official source</span>}</div></article>
}
function Problem({title,details}:{title:string;details:string}){return <div className={s.problem} role="alert"><ShieldAlert size={19}/><div><strong>{title}</strong><p>{details}</p></div></div>}
function Empty({text}:{text:string}){return <div className={s.empty}><Database size={23}/><strong>No confirmed entries for this view</strong><p>{text}</p></div>}
function SectionHeading({kicker,title,sub,right}:{kicker:string;title:string;sub?:string;right?:ReactNode}){return <div className={s.heading}><div><span>{kicker}</span><h2>{title}</h2>{sub?<p>{sub}</p>:null}</div>{right?<div className={s.headingRight}>{right}</div>:null}</div>}
function Bars({data,kind='impressions'}:{data:Array<{date:string;clicks?:number;impressions?:number;sessions?:number}>;kind?:'clicks'|'impressions'|'sessions'}){
  const max=Math.max(1,...data.map(v=>Number(v[kind]||0)))
  if(!data.length)return <Empty text="Google did not return a daily series for this period."/>
  return <div className={s.bars} role="img" aria-label={`Daily ${kind} chart; values available on hover`}><div className={s.barGrid}>{data.map((d,i)=><div key={`${d.date}-${i}`} className={s.barItem} title={`${d.date}: ${nf(Number(d[kind]||0))} ${kind}`}><span style={{height:`${Math.max(2,100*Number(d[kind]||0)/max)}%`}}/><small>{i===0||i===data.length-1?d.date.slice(5):''}</small></div>)}</div></div>
}
function Line({data,metric}:{data:Array<{date:string;sessions:number;activeUsers:number;engagedSessions:number}>;metric:'sessions'|'engagedSessions'}){
  if(data.length<2)return <Empty text="Not enough recorded days to draw a reliable trend."/>
  const width=860,height=220,values=data.map(x=>x[metric]),max=Math.max(1,...values)
  const pts=data.map((d,i)=>`${Math.round(12+i*(width-24)/(data.length-1))},${Math.round(height-22-(d[metric]/max)*(height-45))}`).join(' ')
  return <div className={s.lineChart}><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`Daily ${metric} over the reporting period`}><defs><linearGradient id="seo-r2-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#40a5fd" stopOpacity=".38"/><stop offset="1" stopColor="#40a5fd" stopOpacity=".02"/></linearGradient></defs>{[1,2,3,4].map(n=><line key={n} x1="0" x2={width} y1={n*(height/5)} y2={n*(height/5)} stroke="#dce5ef" strokeDasharray="5 7"/>)}<polygon points={`12,${height-22} ${pts} ${width-12},${height-22}`} fill="url(#seo-r2-fill)"/><polyline points={pts} fill="none" stroke="#3872e9" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>{data.map((d,i)=><circle key={i} cx={12+i*(width-24)/(data.length-1)} cy={height-22-(d[metric]/max)*(height-45)} r="3" fill="#3872e9"><title>{d.date}: {nf(d[metric])}</title></circle>)}</svg><div className={s.axis}><span>{data[0]?.date}</span><span>{data[data.length-1]?.date}</span></div></div>
}
function WorldIcon({world}:{world:string}){return <span className={s.worldIcon} data-world={world}><Globe2 size={17}/></span>}
function tinyPath(v:string){try{const u=new URL(v);return u.pathname+(u.search?'?…':'')}catch{return v}}

export function GoogleIntelligenceCommand(){
  const [tab,setTab]=useState<Tab>('command')
  const [world,setWorld]=useState<World>('all')
  const [overview,setOverview]=useState<GoogleOverview|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [refreshId,setRefreshId]=useState(0)
  const [searchText,setSearchText]=useState('')
  const [searchSort,setSearchSort]=useState<'clicks'|'impressions'|'ctr'|'position'>('clicks')
  const [searchSection,setSearchSection]=useState<'pages'|'queries'>('pages')
  const [native,setNative]=useState<NativePage|null>(null)
  const [nativeError,setNativeError]=useState('')
  const [nativeLoading,setNativeLoading]=useState(false)
  const [nativePage,setNativePage]=useState(1)
  const [nativeTerm,setNativeTerm]=useState('')
  const [nativeQuery,setNativeQuery]=useState('')
  const [nativeLocale,setNativeLocale]=useState('all')
  const [nativeState,setNativeState]=useState('all')
  const [selected,setSelected]=useState<SearchPage|null>(null)
  const [inspectUrl,setInspectUrl]=useState('')
  const [inspection,setInspection]=useState<Inspection|null>(null)
  const [inspectError,setInspectError]=useState('')
  const [inspecting,setInspecting]=useState(false)
  const [history,setHistory]=useState<InspectionHistory>([])
  const [historyError,setHistoryError]=useState('')
  const [diagnostics,setDiagnostics]=useState<Diagnostics|null>(null)
  const [diagnosticsError,setDiagnosticsError]=useState('')
  const go=useCallback((key:Tab)=>{setTab(key);const u=new URL(location.href);u.searchParams.set('view',key);window.history.replaceState(null,'',u)},[])
  const load=useCallback(async(force=false)=>{setLoading(true);setError('');try{setOverview(await api<GoogleOverview>(force?'?refresh=1':''))}catch(e){setError(e instanceof Error?e.message:'Google evidence is unavailable.')}finally{setLoading(false)}},[])
  useEffect(()=>{const initial=new URL(location.href).searchParams.get('view');if(NAV.some(([k])=>k===initial))setTab(initial as Tab);void load()},[load,refreshId])
  const search:SearchSummary|null=overview?.search.state==='ok'?overview.search.data:null
  const ga:AnalyticsSummary|null=overview?.analytics.state==='ok'?overview.analytics.data:null
  const nativeSummary:NativeSummary|null=overview?.native.state==='ok'?overview.native.data:null
  useEffect(()=>{setNativePage(1)},[world,nativeLocale,nativeState,nativeQuery])
  useEffect(()=>{
    if(tab!=='inventory')return
    let active=true
    const q=new URLSearchParams({view:'native',page:String(nativePage),size:'40',world:wkey(world),state:nativeState,locale:nativeLocale,q:nativeQuery})
    setNativeLoading(true);setNativeError('')
    void api<NativePage>(`?${q}`).then(data=>{if(active)setNative(data)}).catch(e=>{if(active){setNativeError(e instanceof Error?e.message:'Inventory unavailable.');setNative(null)}}).finally(()=>{if(active)setNativeLoading(false)})
    return()=>{active=false}
  },[tab,world,nativePage,nativeLocale,nativeState,nativeQuery,refreshId])
  const loadHistory=useCallback(async()=>{setHistoryError('');try{setHistory(await api<InspectionHistory>('?view=history'))}catch(e){setHistoryError(e instanceof Error?e.message:'Inspection history unavailable.')}},[])
  const loadDiagnostics=useCallback(async()=>{setDiagnosticsError('');try{setDiagnostics(await api<Diagnostics>('?view=diagnostics'))}catch(e){setDiagnosticsError(e instanceof Error?e.message:'Diagnostics unavailable.')}},[])
  useEffect(()=>{if(tab==='inspection')void loadHistory();if(tab==='diagnostics'||tab==='inspection')void loadDiagnostics()},[tab,loadHistory,loadDiagnostics,refreshId])
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setSelected(null)};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey)},[])
  const scopedNative=useMemo(()=>{
    if(!nativeSummary)return null
    if(world==='all')return nativeSummary
    const rows=nativeSummary.worlds.filter(p=>p.world===wkey(world))
    return {...nativeSummary,registered:rows.reduce((sum,p)=>sum+p.registered,0),eligible:rows.reduce((sum,p)=>sum+p.eligible,0),unscanned:rows.reduce((sum,p)=>sum+p.unscanned,0),httpFailures:rows.reduce((sum,p)=>sum+p.httpFailures,0)}
  },[nativeSummary,world])
  const topPages=useMemo(()=>{
    const needle=searchText.trim().toLowerCase()
    return (search?.pages||[]).filter(r=>(world==='all'||r.world===world)&&(!needle||r.url.toLowerCase().includes(needle))).sort((a,b)=>searchSort==='position'?a.position-b.position:b[searchSort]-a[searchSort])
  },[search,world,searchSort,searchText])
  const topQueries=useMemo(()=>{
    const needle=searchText.trim().toLowerCase()
    // GSC query rows are property-wide; the page/world filter does not apply to query-only rows.
    return (search?.queries||[]).filter(r=>!needle||r.query.toLowerCase().includes(needle)).sort((a,b)=>searchSort==='position'?a.position-b.position:b[searchSort]-a[searchSort])
  },[search,searchSort,searchText])
  const gaPages=useMemo(()=>ga?.landingPages.filter(p=>world==='all'||p.world===world)||[],[ga,world])
  const worldCards=useMemo(()=>['AngelCare','KidFlix','JOBKIX'].map(name=>{
    const urls=(search?.pages||[]).filter(p=>p.world===name)
    const matched=nativeSummary?.worlds.filter(p=>p.world===name.toLowerCase())||[]
    const n=matched.length?{registered:matched.reduce((t,p)=>t+p.registered,0)}:null
    return {name,urls,clicks:urls.reduce((a,p)=>a+p.clicks,0),impressions:urls.reduce((a,p)=>a+p.impressions,0),native:n}
  }),[search,nativeSummary])
  const inspect=async(url:string)=>{
    if(!url.trim())return
    setInspectUrl(url);setInspection(null);setInspectError('');setInspecting(true);go('inspection');setSelected(null)
    try{const v=await api<Inspection>('',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});setInspection(v);await Promise.all([loadHistory(),loadDiagnostics()])}
    catch(e){setInspectError(e instanceof Error?e.message:'Inspection not confirmed.')}
    finally{setInspecting(false)}
  }
  return <main className={s.shell}>
    <div className={s.tinyHeader}><div><Link href={SEO_HOME}>ANGELCARE OPS OS</Link><ChevronRight size={12}/><span>SEO POWER</span><ChevronRight size={12}/><strong>GOOGLE INTELLIGENCE</strong></div><span className={s.topTimestamp}><Clock3 size={13}/> {overview?`Official evidence · ${stamp(overview.generatedAt)}`:'No confirmed refresh'}</span></div>
    <header className={s.hero}>
      <div className={s.heroText}><div className={s.superlabel}><Sparkles size={14}/> SEARCH VISIBILITY OPERATING SYSTEM <span>R2</span></div><h1>Google Intelligence <em>Command Center.</em></h1><p>Votre visibilité, vos audiences organiques et vos pages publiques. Des preuves Google officielles croisées avec l'inventaire SEO natif — sans chiffres inventés.</p><div className={s.heroTrust}><span><ShieldCheck size={14}/> Read-only Google APIs</span><span><LockKeyhole size={14}/> Server-only credentials</span><span><Clock3 size={14}/> 15-minute evidence cache</span></div></div>
      <div className={s.heroRight}><div className={s.heroSignal}><span className={s.orbit}><Radar size={28}/></span><div><span>LIVE CONNECTORS</span><strong>{overview?[overview.search,overview.analytics,overview.native].filter(p=>p.state==='ok').length:0} <small>/ 3</small></strong><p>Sources reporting successfully</p></div></div><div className={s.heroActions}><Link href={SEO_HOME} className={s.lightButton}><ArrowLeft size={15}/> SEO Operations</Link><button className={s.hotButton} disabled={loading} onClick={()=>void load(true)}><RefreshCw size={15} className={loading?s.spin:''}/>{loading?'Loading…':'Refresh evidence'}</button></div></div>
    </header>
    <div className={s.ribbon}><span><Globe2 size={14}/> {overview?.property||'sc-domain:angelcarehub.com'}</span><span><Activity size={14}/> GA4 · {overview?.ga4PropertyId||'562445579'}</span><span><Clock3 size={14}/> {overview?`${overview.period.start} → ${overview.period.end}`:'Awaiting source report'}</span><span className={s.ribbonRight}>NO PAID GOOGLE SERVICES <CheckCircle2 size={14}/></span></div>
    {error?<Problem title="Google Intelligence gateway unavailable" details={error}/>:null}
    <div className={s.sourceBar}><State ok={overview?.search.state==='ok'} label="Search Console"/><State ok={overview?.analytics.state==='ok'} label="GA4 Organic"/><State ok={overview?.native.state==='ok'} label="Native SEO Inventory"/><span>{overview?`Last read ${stamp(overview.generatedAt)}`:'No verified reporting yet'}</span></div>
    <nav className={s.tabs} aria-label="Google Intelligence workspaces">{NAV.map(([key,label,Icon])=><button key={key} aria-current={tab===key?'page':undefined} onClick={()=>go(key)}><Icon size={17}/>{label}{tab===key?<span className={s.activeMark}/>:null}</button>)}</nav>
    <div className={s.toolbar}><div className={s.toolbarTitle}><span className={s.dotAccent}/><strong>{NAV.find(x=>x[0]===tab)?.[1]}</strong><span> / Real Google + native evidence</span></div><div className={s.worldFilters}>{WORLDS.map(w=><button key={w} aria-pressed={world===w} onClick={()=>setWorld(w)}>{WNAME(w)}</button>)}</div></div>
    {world!=='all'?<div className={s.scopeNote}><CircleAlert size={14}/> Filter: {world}. Search Console and GA4 headline totals remain property-wide; page tables and native record counts use the selected world. Google URL samples are not complete indexing coverage.</div>:null}
    {loading&&!overview?<div className={s.loadPanel}><RefreshCw className={s.spin} size={25}/><strong>Establishing evidence from Google and your database</strong><p>The dashboard will not display simulated or assumed figures.</p></div>:null}
    {overview?.search.state==='error'?<Problem title={`Search Console · ${overview.search.code}`} details={overview.search.message}/>:null}
    {overview?.analytics.state==='error'?<Problem title={`GA4 · ${overview.analytics.code}`} details={overview.analytics.message}/>:null}
    {overview?.native.state==='error'?<Problem title={`Native inventory · ${overview.native.code}`} details={overview.native.message}/>:null}

    {overview&&tab==='command'?<>
      <section className={s.metrics}>
        <Metric title="Google impressions" value={search?nf(search.impressions):'—'} description="Search Console · Web search" shade="blue" icon={<Eye size={20}/>} delta={search?<Delta now={search.impressions} prior={search.priorImpressions}/>:undefined}/>
        <Metric title="Google clicks" value={search?nf(search.clicks):'—'} description="Verified organic search clicks" shade="violet" icon={<TrendingUp size={20}/>} delta={search?<Delta now={search.clicks} prior={search.priorClicks}/>:undefined}/>
        <Metric title="Organic sessions" value={ga?nf(ga.sessions):'—'} description="GA4 · Organic Search only" shade="green" icon={<Activity size={20}/>} delta={ga?<Delta now={ga.sessions} prior={ga.priorSessions}/>:undefined}/>
        <Metric title="Search CTR" value={search?pct(search.ctr):'—'} description="Click-through rate" shade="gold" icon={<Gauge size={20}/>}/>
        <Metric title="Avg. Google position" value={search&&search.position!==null?dec(search.position):'—'} description="Average observation, not fixed rank" shade="blue" icon={<BarChart3 size={20}/>}/>
        <Metric title="Registered native pages" value={scopedNative?nf(scopedNative.registered):'—'} description="Registered SEO pages · selected scope" shade="pink" icon={<Database size={20}/>}/>
      </section>
      <div className={s.mainGrid}>
        <section className={s.panel}><SectionHeading kicker="SEARCH VISIBILITY · 28 FINAL DAYS" title="Organic visibility trajectory" sub="Daily Google impressions. Hover bars for confirmed values." right={<span className={s.tag}>Official GSC</span>}/>{search?<Bars data={search.daily}/>:<Empty text="Search Console series is unavailable."/>}<div className={s.bottomStats}><div><span>Clicks</span><strong>{search?nf(search.clicks):'—'}</strong></div><div><span>Impressions</span><strong>{search?nf(search.impressions):'—'}</strong></div><div><span>Measured CTR</span><strong>{search?pct(search.ctr):'—'}</strong></div><button onClick={()=>go('search')}>Explore Search <ArrowRight size={14}/></button></div></section>
        <section className={s.panel}><SectionHeading kicker="THREE BUSINESS WORLDS" title="Portfolio command" sub="Observed GSC top-page sample + registered native coverage"/>{worldCards.map(w=><button className={s.portfolioRow} key={w.name} onClick={()=>{setWorld(w.name as World);go('inventory')}}><WorldIcon world={w.name}/><div><strong>{w.name}</strong><small>{w.native?`${nf(w.native.registered)} native pages registered`: 'Native count unavailable'}</small></div><div className={s.portfolioNumbers}><strong>{nf(w.clicks)}</strong><small>sample clicks</small></div><ChevronRight size={16}/></button>)}<p className={s.note}>The portfolio clicks above are summed from Google's top 1,000 page rows, not the complete property total.</p></section>
      </div>
      <div className={s.mainGrid}>
        <section className={s.panel}><SectionHeading kicker="PRIORITY SIGNALS · NATIVE INVENTORY" title="Technical operational radar" sub="Actionable flags from your existing SEO Power database"/>
          <div className={s.radarGrid}><div><span className={s.radarIcon}><FileCheck2 size={20}/></span><strong>{nativeSummary?nf(nativeSummary.eligible):'—'}</strong><small>Marked indexable</small></div><div><span className={s.radarIcon}><Clock3 size={20}/></span><strong>{nativeSummary?nf(nativeSummary.unscanned):'—'}</strong><small>Never scanned</small></div><div><span className={s.radarIcon}><CircleAlert size={20}/></span><strong>{nativeSummary?nf(nativeSummary.httpFailures):'—'}</strong><small>Last HTTP 4xx/5xx</small></div></div>
          <div className={s.actionRail}><button onClick={()=>{setNativeState('unscanned');go('inventory')}}><Clock3 size={16}/> Triage unscanned pages <ArrowRight size={14}/></button><button onClick={()=>{setNativeState('http-error');go('inventory')}}><ShieldAlert size={16}/> Triage HTTP failures <ArrowRight size={14}/></button><Link href={`${SEO_HOME}?tab=priorities`}><Layers3 size={16}/> Open SEO correction queue <ArrowUpRight size={14}/></Link></div>
        </section>
        <section className={s.panel}><SectionHeading kicker="ORGANIC JOURNEYS · GA4" title="Visitor acquisition" sub="Sessions are distinct from Google search clicks"/>
          {ga?<Line data={ga.daily} metric="sessions"/>:<Empty text="GA4 organic sessions are unavailable."/>}
          <div className={s.bottomStats}><div><span>Organic sessions</span><strong>{ga?nf(ga.sessions):'—'}</strong></div><div><span>Engaged sessions</span><strong>{ga?nf(ga.engagedSessions):'—'}</strong></div><div><span>Engagement rate</span><strong>{ga?pct(ga.engagementRate):'—'}</strong></div><button onClick={()=>go('analytics')}>Explore GA4 <ArrowRight size={14}/></button></div>
        </section>
      </div>
      <section className={s.panel}><SectionHeading kicker="CONTENT PERFORMANCE" title="Top URLs generating Google visibility" sub="Search Console ranked page sample · explicit URL inspection available" right={<button className={s.secondary} onClick={()=>go('search')}>See all sampled pages <ArrowRight size={14}/></button>}/><div className={s.tableScroll}><table><thead><tr><th>Google URL</th><th>World</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Action</th></tr></thead><tbody>{topPages.slice(0,8).map(p=><tr key={p.url}><td><button className={s.urlButton} onClick={()=>setSelected(p)} title={p.url}>{tinyPath(p.url)}</button></td><td><span className={s.worldTag} data-world={p.world}>{p.world}</span></td><td><strong>{nf(p.clicks)}</strong></td><td>{nf(p.impressions)}</td><td>{pct(p.ctr)}</td><td><button className={s.tableAction} onClick={()=>void inspect(p.url)}>Inspect <ArrowUpRight size={13}/></button></td></tr>)}</tbody></table></div>{!topPages.length?<Empty text="There are no observed top-page rows for this world and period."/>:null}</section>
    </>:null}

    {overview&&tab==='search'?<>
      <div className={s.twoMetrics}><Metric title="GSC clicks" value={search?nf(search.clicks):'—'} description="All property clicks · 28 days" icon={<TrendingUp size={18}/>} delta={search?<Delta now={search.clicks} prior={search.priorClicks}/>:undefined}/><Metric title="GSC impressions" value={search?nf(search.impressions):'—'} description="All property impressions · 28 days" icon={<Eye size={18}/>} delta={search?<Delta now={search.impressions} prior={search.priorImpressions}/>:undefined}/><Metric title="Search position" value={search&&search.position!==null?dec(search.position):'—'} description="Average observed position" icon={<Gauge size={18}/>}/></div>
      <div className={s.mainGrid}><section className={s.panel}><SectionHeading kicker="SEARCH CONSOLE PERFORMANCE" title="Search clicks by day" sub="Official finalized data · source is the entire Search Console property"/>{search?<Bars data={search.daily} kind="clicks"/>:<Empty text="Search Console unavailable."/>}</section><section className={s.panel}><SectionHeading kicker="MARKET DISTRIBUTION" title="Devices and countries" sub="These aggregations apply to the full property"/><div className={s.distGrid}><div><h3>Device segments</h3>{(search?.devices||[]).map(v=><div className={s.distribution} key={v.device}><span>{v.device}</span><strong>{nf(v.clicks)} clicks</strong><i style={{width:`${Math.max(2,100*v.clicks/Math.max(1,...(search?.devices||[]).map(d=>d.clicks)))}%`}}/></div>)}{!search?.devices.length?<Empty text="No device rows."/>:null}</div><div><h3>Top countries</h3>{(search?.countries||[]).slice(0,7).map(v=><div className={s.distItem} key={v.code}><strong>{v.code.toUpperCase()}</strong><span>{nf(v.clicks)} clicks</span></div>)}{!search?.countries.length?<Empty text="No country rows."/>:null}</div></div></section></div>
      <section className={s.panel}><SectionHeading kicker="SEARCH PERFORMANCE EXPLORER" title="Queries & indexed-performance pages" sub="Top sampled rows only; absence is not proof of exclusion from Google" right={<button className={s.secondary} onClick={()=>downloadCsv(`seo-google-${searchSection}-${world.toLowerCase()}.csv`,searchSection==='pages'?['URL','World','Locale','Clicks','Impressions','CTR','Position']:['Query','Clicks','Impressions','CTR','Position'],searchSection==='pages'?topPages.map(r=>[r.url,r.world,r.locale,r.clicks,r.impressions,r.ctr,r.position]):topQueries.map(r=>[r.query,r.clicks,r.impressions,r.ctr,r.position]))}><Download size={14}/> Export visible sample</button>}/>
        <div className={s.dataToolbar}><div className={s.segment}><button aria-pressed={searchSection==='pages'} onClick={()=>setSearchSection('pages')}>Landing URLs</button><button aria-pressed={searchSection==='queries'} onClick={()=>setSearchSection('queries')}>Search queries</button></div><label className={s.searchInput}><Search size={15}/><input value={searchText} onChange={(e:ChangeEvent<HTMLInputElement>)=>setSearchText(e.target.value)} placeholder={searchSection==='pages'?'Search reported URLs':'Search query text'}/></label><label className={s.selectBox}><Filter size={14}/><select value={searchSort} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setSearchSort(e.target.value as typeof searchSort)}><option value="clicks">Most clicks</option><option value="impressions">Most impressions</option><option value="ctr">Highest CTR</option><option value="position">Best position</option></select><ChevronDown size={13}/></label></div>
        {searchSection==='queries'&&world!=='all'?<p className={s.note}>Query-only data is property-wide because the Search Console query dimension does not identify a world. The world selector is intentionally not applied to query rows.</p>:null}
        <div className={s.tableScroll}><table><thead><tr><th>{searchSection==='pages'?'Public URL':'Search query'}</th><th>{searchSection==='pages'?'World':'Source'}</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Avg. position</th>{searchSection==='pages'?<th>Inspection</th>:null}</tr></thead><tbody>{searchSection==='pages'?topPages.slice(0,150).map(p=><tr key={p.url}><td><button className={s.urlButton} title={p.url} onClick={()=>setSelected(p)}>{tinyPath(p.url)}</button></td><td><span className={s.worldTag} data-world={p.world}>{p.world} {p.locale!=='—'?`· ${p.locale}`:''}</span></td><td><strong>{nf(p.clicks)}</strong></td><td>{nf(p.impressions)}</td><td>{pct(p.ctr)}</td><td>{dec(p.position)}</td><td><button className={s.tableAction} onClick={()=>void inspect(p.url)}>Inspect <ArrowUpRight size={12}/></button></td></tr>):topQueries.slice(0,150).map((r,i)=><tr key={i}><td><strong>{r.query}</strong></td><td><span className={s.tag}>Google Search</span></td><td><strong>{nf(r.clicks)}</strong></td><td>{nf(r.impressions)}</td><td>{pct(r.ctr)}</td><td>{dec(r.position)}</td></tr>)}</tbody></table></div>
        {!(searchSection==='pages'?topPages:topQueries).length?<Empty text="No rows match the search and scope filters."/>:null}
        <p className={s.note}>Showing at most 150 rows in this table. CSV exports all matching sampled rows, up to Google's top 1,000 reported page rows or top 150 query rows. Property totals appear separately.</p>
      </section>
    </>:null}

    {tab==='inventory'?<>
      <section className={s.metrics}><Metric title="Native registered" value={scopedNative?nf(scopedNative.registered):'—'} description="Database records · selected scope" icon={<Database size={18}/>} shade="blue"/><Metric title="Marked indexable" value={scopedNative?nf(scopedNative.eligible):'—'} description="Local SEO eligibility" icon={<FileCheck2 size={18}/>} shade="green"/><Metric title="Never scanned" value={scopedNative?nf(scopedNative.unscanned):'—'} description="Requires operational triage" icon={<Clock3 size={18}/>} shade="gold"/><Metric title="HTTP failures" value={scopedNative?nf(scopedNative.httpFailures):'—'} description="Last recorded HTTP 4xx/5xx" icon={<CircleAlert size={18}/>} shade="pink"/></section>
      <section className={s.panel}><SectionHeading kicker="CANONICAL SEO POWER REGISTRY" title="Native page coverage & triage" sub="Live rows from ac_seo_power_pages. This registry may not yet include all published resources." right={<Link className={s.secondary} href={`${SEO_HOME}?tab=pages`}><ArrowUpRight size={14}/> Open operations</Link>}/>
        <form className={s.dataToolbar} onSubmit={(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setNativeQuery(nativeTerm);setNativePage(1)}}><label className={s.searchInput}><Search size={14}/><input value={nativeTerm} onChange={(e:ChangeEvent<HTMLInputElement>)=>setNativeTerm(e.target.value)} placeholder="Search canonical path or title"/></label><label className={s.selectBox}><select aria-label="Locale" value={nativeLocale} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setNativeLocale(e.target.value)}>{['all','fr','en','ar','es','hi','tl','id'].map(k=><option key={k} value={k}>{k==='all'?'All languages':k.toUpperCase()}</option>)}</select><ChevronDown size={13}/></label><label className={s.selectBox}><select aria-label="Page state" value={nativeState} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setNativeState(e.target.value)}><option value="all">All statuses</option><option value="eligible">Indexable</option><option value="excluded">Not indexable</option><option value="unscanned">Never scanned</option><option value="http-error">HTTP failure</option></select><ChevronDown size={13}/></label><button className={s.blueButton} type="submit"><Search size={13}/> Search</button><button className={s.secondary} type="button" disabled={!native?.items.length} onClick={()=>downloadCsv(`seo-native-page-${nativePage}.csv`,['URL','World','Locale','Title','Indexable','HTTP','Last scan'],(native?.items||[]).map(v=>[v.url,v.world,v.locale,v.title,String(v.indexable),v.httpStatus??'',v.lastScannedAt||'']))}><Download size={13}/> Export this page</button></form>
        {nativeError?<Problem title="Native inventory unavailable" details={nativeError}/>:null}
        {nativeLoading?<p className={s.note}>Loading native records...</p>:null}
        <div className={s.tableScroll}><table><thead><tr><th>Canonical page</th><th>World / language</th><th>Eligibility</th><th>HTTP</th><th>Last scan</th><th>Actions</th></tr></thead><tbody>{(native?.items||[]).map(p=><tr key={p.id}><td><div className={s.nativeTitle}><strong>{p.title||'Untitled native page'}</strong><small title={p.url}>{tinyPath(p.url)}</small></div></td><td><span className={s.worldTag} data-world={p.world==='angelcare'?'AngelCare':p.world==='kidflix'?'KidFlix':'JOBKIX'}>{p.world} · {p.locale.toUpperCase()}</span></td><td><span className={s.eligibility} data-ok={p.indexable}>{p.indexable?'Eligible':'Excluded locally'}</span></td><td><span className={s.httpStatus} data-error={p.httpStatus!==null&&p.httpStatus>=400}>{p.httpStatus??'—'}</span></td><td>{stamp(p.lastScannedAt)}</td><td><button className={s.tableAction} onClick={()=>void inspect(p.url)}>Google check <ArrowUpRight size={12}/></button></td></tr>)}</tbody></table></div>
        {!native?.items.length&&!nativeLoading&&!nativeError?<Empty text="No registered page matches the selected filters."/>:null}
        <div className={s.pagination}><span>{native?`${nf(native.total)} matching native records · page ${native.page} of ${native.totalPages||1}`:'No confirmed count'}</span><div><button disabled={nativePage<=1||nativeLoading} onClick={()=>setNativePage(n=>Math.max(1,n-1))}><ChevronLeft size={15}/> Previous</button><button disabled={!native||nativePage>=native.totalPages||nativeLoading} onClick={()=>setNativePage(n=>n+1)}>Next <ChevronRight size={15}/></button></div></div>
      </section>
      <div className={s.advisory}><ShieldCheck size={19}/><div><strong>Two different concepts, never merged.</strong><p>Local <b>indexable</b> means the SEO Power page record is eligible for indexing. Google's actual known index status requires a URL Inspection API response. No performance row is not a negative indexing verdict.</p></div></div>
    </>:null}

    {overview&&tab==='analytics'?<>
      <section className={s.metrics}><Metric title="Organic sessions" value={ga?nf(ga.sessions):'—'} description="GA4 Organic Search channel" icon={<Activity size={18}/>} shade="blue" delta={ga?<Delta now={ga.sessions} prior={ga.priorSessions}/>:undefined}/><Metric title="Active users" value={ga?nf(ga.activeUsers):'—'} description="Active users · not total users" icon={<Globe2 size={18}/>} shade="violet"/><Metric title="Engaged sessions" value={ga?nf(ga.engagedSessions):'—'} description="Sessions meeting GA4 engagement rules" icon={<CheckCircle2 size={18}/>} shade="green"/><Metric title="Engagement rate" value={ga?pct(ga.engagementRate):'—'} description="Engaged organic sessions / sessions" icon={<Gauge size={18}/>} shade="gold"/></section>
      <section className={s.panel}><SectionHeading kicker="GA4 OFFICIAL ORGANIC SEARCH" title="Daily acquisition & engagement" sub="Final data date window aligned with Search Console for comparison" right={<span className={s.tag}>Sessions ≠ Google clicks</span>}/>{ga?<Line data={ga.daily} metric="sessions"/>:<Empty text="GA4 organic data not available."/>}</section>
      <section className={s.panel}><SectionHeading kicker="GA4 LANDING PAGE DISCOVERY" title="Organic landing pages" sub="Top 200 GA4 landing-page rows including hostnames; filtered by chosen world" right={<button className={s.secondary} onClick={()=>downloadCsv(`seo-ga4-landing-pages-${world.toLowerCase()}.csv`,['Host','Landing path','World','Locale','Sessions','Active users','Engaged sessions'],gaPages.map(p=>[p.host,p.path,p.world,p.locale,p.sessions,p.activeUsers,p.engagedSessions]))}><Download size={13}/> Export sample</button>}/><div className={s.tableScroll}><table><thead><tr><th>Hostname / landing page</th><th>World</th><th>Organic sessions</th><th>Active users</th><th>Engaged sessions</th></tr></thead><tbody>{gaPages.map((p,i)=><tr key={`${p.host}:${p.path}:${i}`}><td><div className={s.nativeTitle}><strong>{p.host||'Hostname not reported'}</strong><small>{p.path||'/'}</small></div></td><td><span className={s.worldTag} data-world={p.world}>{p.world} · {p.locale}</span></td><td><strong>{nf(p.sessions)}</strong></td><td>{nf(p.activeUsers)}</td><td>{nf(p.engagedSessions)}</td></tr>)}</tbody></table></div>{!gaPages.length?<Empty text="No GA4 organic landing page rows for the selected world."/>:null}<p className={s.note}>Only GA4's authorized property is queried. If some world uses another GA4 property, its sessions will not appear here until its property is connected separately.</p></section>
    </>:null}

    {tab==='inspection'?<>
      <section className={s.inspectHero}><div className={s.inspectBadge}><Radar size={26}/></div><div><span>GOOGLE URL INSPECTION · MANUAL / FREE QUOTA</span><h2>What does Google actually know about this URL?</h2><p>An authoritative stored Google index status, not an indexing submission and not a live webpage crawl. Every request consumes a reserved daily quota slot.</p></div><div className={s.inspectQuota}><span>Available daily safe budget</span><strong>{diagnostics?.inspectionBudget?nf(Math.max(0,diagnostics.inspectionBudget.limit-diagnostics.inspectionBudget.used)):'—'}</strong><small>{diagnostics?.inspectionBudget?`${diagnostics.inspectionBudget.used} used / ${diagnostics.inspectionBudget.limit} cap`:'Quota ledger not confirmed'}</small></div></section>
      <section className={s.panel}><SectionHeading kicker="ONE VERIFIED REQUEST AT A TIME" title="Inspect a public canonical URL" sub="HTTPS and angelcarehub.com domain property only · no private paths, fragments or query strings"/><form className={s.inspectForm} onSubmit={(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();void inspect(inspectUrl)}}><label><Search size={17}/><input required type="url" value={inspectUrl} onChange={(e:ChangeEvent<HTMLInputElement>)=>setInspectUrl(e.target.value)} placeholder="https://my.angelcarehub.com/angelcare-marketplace/fr/..."/></label><button className={s.hotButton} disabled={inspecting||!inspectUrl.trim()} type="submit"><Radar size={17}/>{inspecting?'Checking Google…':'Run Google inspection'}</button></form>
      {inspectError?<Problem title="Inspection not confirmed" details={inspectError}/>:null}
      {inspection?<div className={s.inspectionResult}><div className={s.resultTop}><div><span>OFFICIAL INDEX STATUS</span><h3>{inspection.verdict==='PASS'?'Indexed according to Google':inspection.verdict==='FAIL'?'Not indexed / review coverage':'Status not conclusive'}</h3><small>{stamp(inspection.inspectedAt)} · {inspection.coverageState}</small></div><span className={s.verdict} data-result={inspection.verdict}>{inspection.verdict}</span></div><div className={s.resultGrid}>{([['Inspected URL',inspection.url],['Google canonical',inspection.googleCanonical],['Declared canonical',inspection.userCanonical],['Last Google crawl',inspection.lastCrawlTime],['Robots state',inspection.robotsTxtState],['Indexing state',inspection.indexingState],['Page fetch',inspection.pageFetchState],['Sitemaps',inspection.sitemap.join(', ')]] as [string,string|null][]).map(([k,v])=><div key={k}><span>{k}</span><strong>{v||'Not provided by Google'}</strong></div>)}</div><p className={s.note}>{inspection.note} {inspection.persisted?'Result saved in evidence history.':'Google responded, but saving evidence failed; check database permissions.'}</p></div>:null}</section>
      <section className={s.panel}><SectionHeading kicker="DURABLE DATABASE HISTORY" title="Recent Google URL inspections" sub="Saved evidence from prior authorized requests, newest first" right={<button className={s.secondary} onClick={()=>void loadHistory()}><RefreshCw size={14}/> Refresh history</button>}/>{historyError?<Problem title="Evidence storage not available" details={historyError}/>:null}<div className={s.tableScroll}><table><thead><tr><th>Inspection URL</th><th>Google verdict</th><th>Coverage state</th><th>Checked at</th><th>Action</th></tr></thead><tbody>{history.map(p=><tr key={p.id}><td className={s.urlCell} title={p.url}>{tinyPath(p.url)}</td><td><span className={s.verdict} data-result={p.verdict}>{p.verdict}</span></td><td>{p.coverageState}</td><td>{stamp(p.inspectedAt)}</td><td><button className={s.tableAction} disabled={inspecting} onClick={()=>void inspect(p.url)}>Re-inspect <ArrowUpRight size={12}/></button></td></tr>)}</tbody></table></div>{!history.length&&!historyError?<Empty text="No saved inspections yet. The first manual inspection will create an evidence record."/>:null}</section>
    </>:null}

    {tab==='diagnostics'?<>
      <div className={s.mainGrid}><section className={s.panel}><SectionHeading kicker="CONNECTION & ACCESS CONTROL" title="Google production readiness" sub="These are real runtime configuration checks, not a simulated health score"/><div className={s.healthChecks}><div><ServerCog size={19}/><strong>Service account JSON</strong><State ok={Boolean(diagnostics?.configured)} label={diagnostics?.configured?'Validated':'Missing / invalid'}/></div><div><Cloud size={19}/><strong>Google Search Console</strong><State ok={overview?.search.state==='ok'} label={overview?.search.state==='ok'?'Reported':'Unavailable'}/></div><div><Activity size={19}/><strong>GA4 Analytics Data API</strong><State ok={overview?.analytics.state==='ok'} label={overview?.analytics.state==='ok'?'Reported':'Unavailable'}/></div><div><Database size={19}/><strong>Native database coverage</strong><State ok={overview?.native.state==='ok'} label={overview?.native.state==='ok'?'Reported':'Unavailable'}/></div><div><ShieldCheck size={19}/><strong>Atomic inspection quota ledger</strong><State ok={Boolean(diagnostics?.inspectionBudget)} label={diagnostics?.inspectionBudget?'Active':'Unavailable'}/></div></div></section>
      <section className={s.panel}><SectionHeading kicker="SERVER CONFIGURATION · NON-SECRET" title="Connected account identity" sub="Only public identifiers and limited diagnostics are exposed to authenticated SEO operators"/><dl className={s.kv}><div><dt>Google project</dt><dd>{diagnostics?.project||'—'}</dd></div><div><dt>Search Console property</dt><dd>{diagnostics?.searchProperty||'—'}</dd></div><div><dt>GA4 property</dt><dd>{diagnostics?.ga4Property||'—'}</dd></div><div><dt>Service account</dt><dd>{diagnostics?.serviceAccount||'Not confirmed'}</dd></div><div><dt>Cached report age</dt><dd>{diagnostics?.cacheAgeSeconds===null||diagnostics?.cacheAgeSeconds===undefined?'—':`${diagnostics.cacheAgeSeconds} seconds`}</dd></div><div><dt>Daily inspection allowance</dt><dd>{diagnostics?.inspectionBudget?`${diagnostics.inspectionBudget.used} / ${diagnostics.inspectionBudget.limit}`:'Not confirmed'}</dd></div></dl></section></div>
      {diagnosticsError?<Problem title="Diagnostics unavailable" details={diagnosticsError}/>:null}
      <section className={s.panel}><SectionHeading kicker="EVIDENCE INTEGRITY · REPORTING CONTRACT" title="What these results can — and cannot — prove" sub="Operational rules for reliable decisions and no fake green statuses"/>{(overview?.warnings||[]).map((v,i)=><div className={s.rule} key={i}><ShieldCheck size={17}/><span>{v}</span></div>)}{(diagnostics?.notes||[]).map((v,i)=><div className={s.rule} key={`d${i}`}><LockKeyhole size={17}/><span>{v}</span></div>)}<div className={s.diagnosticActions}><Link href={`${SEO_HOME}?tab=overview`} className={s.secondary}>Native SEO operations <ArrowUpRight size={15}/></Link><Link href={`${SEO_HOME}?tab=executions`} className={s.secondary}>Execution queue <ArrowUpRight size={15}/></Link><button className={s.hotButton} onClick={()=>setRefreshId(n=>n+1)}><RefreshCw size={14}/> Reload diagnostics</button></div></section>
    </>:null}
    <footer className={s.footer}><strong>SEO POWER · GOOGLE INTELLIGENCE OS R2</strong><span>Authoritative sources only · Google free APIs · Read-only external access · Native registry ≠ Google indexing</span><Link href={SEO_HOME}>Return to SEO Operations <ArrowUpRight size={13}/></Link></footer>
    {selected?<div className={s.drawerBackdrop} onClick={()=>setSelected(null)}><aside className={s.detailSheet} role="dialog" aria-modal="true" aria-label="Search Console page detail" onClick={(e:ReactMouseEvent<HTMLElement>)=>e.stopPropagation()}><div className={s.drawerHead}><span>GOOGLE PERFORMANCE · DETAIL</span><button onClick={()=>setSelected(null)} aria-label="Close detail"><X size={20}/></button></div><h2>Search visibility evidence</h2><p className={s.drawerUrl}>{selected.url}</p><div className={s.detailMetrics}><div><span>Clicks</span><strong>{nf(selected.clicks)}</strong></div><div><span>Impressions</span><strong>{nf(selected.impressions)}</strong></div><div><span>CTR</span><strong>{pct(selected.ctr)}</strong></div><div><span>Avg. position</span><strong>{dec(selected.position)}</strong></div></div><div className={s.rule}><ShieldCheck size={17}/><span>This page appeared in the Search Console top-page response during the reporting period. That does not by itself prove its current Google index status.</span></div><button className={s.hotButton} onClick={()=>void inspect(selected.url)}><Radar size={16}/> Verify known Google index status</button><a className={s.secondary} href={selected.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> Open public URL</a></aside></div>:null}
  </main>
}
