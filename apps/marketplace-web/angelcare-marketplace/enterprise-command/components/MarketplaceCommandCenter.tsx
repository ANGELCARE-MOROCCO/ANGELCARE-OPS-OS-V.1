'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
 Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeDollarSign, CheckCircle2,
 ChevronRight, CircleDot, Clock3, Command, CreditCard, Gauge, Landmark, MapPinned, Navigation,
 PackageCheck, RefreshCcw, Search, ShieldAlert, ShoppingBag, Sparkles, UsersRound, WalletCards, X, type LucideIcon } from 'lucide-react'
import type {
 CommandCenterSnapshot, CommandMetric, ExecutiveSignal, PressureRow, RunwayItem, TerritoryPulse,
} from '../command-center-types'
import { CommandDrawerSystem, type CommandDrawerKind, type CommandDrawerState } from './CommandDrawerSystem'
import styles from '../enterprise-command.module.css'

type Envelope<T>={data?:T;error?:{message?:string}}
const money=(value:number)=>`${Math.round(value).toLocaleString('fr-FR')} Dh`
const time=(value:string)=>new Date(value).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})

const workspaceNav=[
 ['Overview','/angelcare-marketplace/admin/enterprise-command'],
 ['Live Marketplace','/angelcare-marketplace/admin/live-map'],
 ['Missions','/angelcare-marketplace/admin/operations/mission-control'],
 ['Business Pulse','/angelcare-marketplace/admin/business-pulse'],
 ['Exceptions','/angelcare-marketplace/admin/operations/exceptions'],
 ['Recovery','/angelcare-marketplace/admin/operations/recovery'],
 ['Closing','/angelcare-marketplace/admin/operations/closure'],
] as const

const eventFilters=['ALL','REVENUE','ORDERS','FULFILLMENT','CUSTOMERS','RISKS'] as const

export function MarketplaceCommandCenter({initialSnapshot}:{initialSnapshot:CommandCenterSnapshot}){
 const[snapshot,setSnapshot]=useState(initialSnapshot)
 const[loading,setLoading]=useState(false)
 const[error,setError]=useState('')
 const[eventFilter,setEventFilter]=useState<(typeof eventFilters)[number]>('ALL')
 const[drawer,setDrawer]=useState<CommandDrawerState|null>(null)
 const[dock,setDock]=useState<CommandDrawerState[]>([])
 const[runwayScope,setRunwayScope]=useState<'all'|'critical'|'attention'|'watch'>('all')

 async function refresh(){setLoading(true);setError('');try{const r=await fetch('/api/angelcare-marketplace/admin/enterprise-command/command-center',{cache:'no-store'});const p=await r.json().catch(()=>({})) as Envelope<CommandCenterSnapshot>;if(!r.ok||!p.data)throw new Error(p.error?.message||'Command Center indisponible.');setSnapshot(p.data)}catch(e){setError(e instanceof Error?e.message:'Command Center indisponible.')}finally{setLoading(false)}}
 useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh()},30000);return()=>clearInterval(timer)},[])

 function open(kind:CommandDrawerKind,opts:{item?:RunwayItem|null;territory?:TerritoryPulse|null;signal?:ExecutiveSignal|null;title?:string;subtitle?:string}={}){
  const item=opts.item||null,territory=opts.territory||null,signal=opts.signal||null
  const id=`${kind}:${item?.id||territory?.id||signal?.id||'global'}`
  setDrawer({id,kind,title:opts.title||item?.reference||territory?.name||signal?.label||'Command',subtitle:opts.subtitle||item?.title||signal?.detail||'Marketplace Command',item,territory,signal})
 }
 function minimize(value:CommandDrawerState){setDock(current=>[...current.filter(item=>item.id!==value.id),value].slice(-5));setDrawer(null)}
 function restore(value:CommandDrawerState){setDock(current=>current.filter(item=>item.id!==value.id));setDrawer(value)}

 function firstItem(kind:'payment'|'mission'|'case'|'order'){return snapshot.runway.find(item=>kind==='payment'?item.paymentId:kind==='mission'?item.missionId:kind==='case'?item.caseId:item.kind==='order')||null}
 function metricDrawer(metric:CommandMetric){if(metric.drawer==='payment')open('payment',{item:firstItem('payment'),title:'Payment Exposure',subtitle:metric.detail||metric.label});else if(metric.drawer==='supply')open('supply',{item:firstItem('mission'),title:'Supply Pressure',subtitle:metric.detail||metric.label});else if(metric.drawer==='customer-case')open('customer-case',{item:firstItem('case'),title:'Customer Cases',subtitle:metric.detail||metric.label});else if(metric.drawer==='territory')open('territory',{territory:snapshot.territories[0]||null,title:'Territory Command',subtitle:metric.detail||metric.label});else if(metric.drawer==='executive')open('executive',{signal:snapshot.executiveWatch.find(s=>s.id===metric.key)||snapshot.executiveWatch[0],title:metric.label,subtitle:metric.detail||'Executive diagnostic'});else open('order',{item:firstItem('order'),title:'Incoming Order Triage',subtitle:metric.detail||metric.label})}
 function runwayDrawer(item:RunwayItem){if(item.kind==='payment')open('payment',{item});else if(item.kind==='case')open('customer-case',{item});else if(item.kind==='order')open('order',{item});else open(item.severity==='critical'?'incident':'supply',{item})}

 const runway=useMemo(()=>snapshot.runway.filter(item=>runwayScope==='all'||item.severity===runwayScope),[snapshot.runway,runwayScope])
 const grouped=useMemo(()=>({critical:runway.filter(i=>i.severity==='critical'),attention:runway.filter(i=>i.severity==='attention'),watch:runway.filter(i=>i.severity==='watch')}),[runway])
 const filteredEvents=useMemo(()=>snapshot.events.filter(event=>{
  if(eventFilter==='ALL')return true
  if(eventFilter==='REVENUE')return ['payment','invoice','refund'].includes(event.kind)
  if(eventFilter==='ORDERS')return event.kind==='order'
  if(eventFilter==='FULFILLMENT')return ['fulfillment','mission'].includes(event.kind)
  if(eventFilter==='CUSTOMERS')return ['customer','inquiry'].includes(event.kind)
  return ['risk','incident'].includes(event.kind)||['failed','blocked','cancelled'].includes(event.status.toLowerCase())
 }),[snapshot.events,eventFilter])
 const moneyStages:Array<[string,number,LucideIcon]>=[['ORDERED',snapshot.money.ordered,ShoppingBag],['AUTHORIZED',snapshot.money.authorized,CreditCard],['CAPTURED',snapshot.money.captured,BadgeDollarSign],['OUTSTANDING',snapshot.money.outstanding,Clock3],['REFUNDED',snapshot.money.refunded,RefreshCcw]]

 return <div className={styles.commandNexus}>
  <section className={styles.nexusAreaHeader}>
   <div>
    <span className={styles.nexusEyebrow}>ANGELCARE MARKETPLACE HQ · AREA 01</span>
    <div className={styles.nexusHeadingRow}><h1>Command & Live Operations</h1><span className={styles.liveBadge}><i/>LIVE</span></div>
    <p>Marketplace Command · operational truth, money movement, customer pressure and provider execution from canonical data.</p>
   </div>
   <div className={styles.nexusHeaderMeta}>
    <div><span>Window</span><strong>{snapshot.windowLabel}</strong></div>
    <div><span>Last refresh</span><strong>{time(snapshot.generatedAt)}</strong></div>
    <button type="button" onClick={()=>void refresh()} disabled={loading}><RefreshCcw size={14}/>{loading?'Refreshing':'Refresh'}</button>
   </div>
  </section>

  <nav className={styles.horizontalWorkspaceNav} aria-label="Command & Live Operations workspaces">
   <div>{workspaceNav.map(([label,href],index)=><Link key={label} href={href} data-active={index===0}>{label}</Link>)}</div>
   <div className={styles.workspaceUtilities}><Link href="/angelcare-marketplace/admin/my-workspace"><Command size={13}/>War Room</Link><Link href="/angelcare-marketplace/admin/live-map"><MapPinned size={13}/>Morocco</Link><span><CircleDot size={12}/>Canonical live</span></div>
  </nav>

  {error?<div className={styles.nexusError}><AlertTriangle size={15}/>{error}<button type="button" onClick={()=>void refresh()}>Réessayer</button></div>:null}
  {snapshot.health.unavailableSignals.length?<div className={styles.signalAvailability}><AlertTriangle size={13}/><strong>Signal transparency:</strong><span>{snapshot.health.unavailableSignals.join(' · ')}</span></div>:null}

  <section className={styles.commandStrip} aria-label="Marketplace operating strip">
   <div className={styles.commandStripLabel}><span>COMMAND STRIP</span><small>Actual data · click to operate</small></div>
   <div className={styles.commandStripScroller}>{snapshot.metrics.map(metric=><button key={metric.key} type="button" className={styles.commandStripMetric} data-severity={metric.severity} onClick={()=>metricDrawer(metric)}><span>{metric.label}</span><strong>{metric.display}</strong><small>{metric.deltaLabel||metric.detail||'Open diagnostic'}</small></button>)}</div>
  </section>

  <div className={styles.nexusTopGrid}>
   <section className={`${styles.nexusPanel} ${styles.runwayPanel}`}>
    <header className={styles.nexusPanelHeader}><div><span className={styles.zoneNumber}>01</span><div><small>OPERATIONAL RUNWAY</small><h2>What requires intervention before the business moves forward?</h2></div></div><div className={styles.runwayFilters}>{(['all','critical','attention','watch'] as const).map(value=><button key={value} type="button" data-active={runwayScope===value} onClick={()=>setRunwayScope(value)}>{value}</button>)}</div></header>
    <div className={styles.runwayBands}>
     <RunwayBand title="CRITICAL NOW" tone="critical" items={grouped.critical} onOpen={runwayDrawer}/>
     <RunwayBand title="ATTENTION" tone="attention" items={grouped.attention} onOpen={runwayDrawer}/>
     <RunwayBand title="WATCH" tone="watch" items={grouped.watch} onOpen={runwayDrawer}/>
     {!runway.length?<div className={styles.healthyState}><CheckCircle2 size={24}/><div><strong>No critical interruptions</strong><span>Current signals are within healthy thresholds. The system does not manufacture incidents to fill the page.</span></div></div>:null}
    </div>
   </section>

   <section className={`${styles.nexusPanel} ${styles.streamPanel}`}>
    <header className={styles.nexusPanelHeader}><div><span className={styles.zoneNumber}>02</span><div><small>LIVE BUSINESS STREAM</small><h2>Business events</h2></div></div><Link href="/angelcare-marketplace/admin/business-pulse">View all <ChevronRight size={13}/></Link></header>
    <div className={styles.streamTabs}>{eventFilters.map(filter=><button type="button" key={filter} data-active={eventFilter===filter} onClick={()=>setEventFilter(filter)}>{filter}</button>)}</div>
    <div className={styles.liveStream}>{filteredEvents.slice(0,18).map(event=><Link href={event.route||'#'} key={`${event.kind}:${event.id}`}><time>{time(event.occurredAt)}</time><i data-kind={event.kind}/><div><strong>{event.title}</strong><span>{event.reference} · {event.subtitle}</span></div>{event.amount?<b>{money(event.amount)}</b>:<small>{event.status}</small>}</Link>)}{!filteredEvents.length?<div className={styles.drawerEmptyText}>No events in this filter. Nothing is fabricated.</div>:null}</div>
   </section>
  </div>

  <div className={styles.nexusMiddleGrid}>
   <section className={styles.nexusPanel}>
    <header className={styles.nexusPanelHeader}><div><span className={styles.zoneNumber}>03</span><div><small>OPERATIONAL PRESSURE MATRIX</small><h2>Health, attention, critical exposure</h2></div></div></header>
    <div className={styles.pressureMatrix}><div className={styles.pressureHeader}><span>Domain</span><span>Healthy</span><span>Attention</span><span>Critical</span><span>Trend</span><span>Exposure</span></div>{snapshot.pressure.map(row=><PressureRowView key={row.key} row={row} onOpen={()=>{if(row.drawer==='payment')open('payment',{item:firstItem('payment'),title:row.label});else if(row.drawer==='supply')open('supply',{item:firstItem('mission'),title:row.label});else if(row.drawer==='customer-case')open('customer-case',{item:firstItem('case'),title:row.label});else open('order',{item:firstItem('order'),title:row.label})}}/>)}</div>
   </section>

   <section className={styles.nexusPanel}>
    <header className={styles.nexusPanelHeader}><div><span className={styles.zoneNumber}>04</span><div><small>TERRITORY / DEMAND PULSE</small><h2>Demand × supply pressure</h2></div></div><Link href="/angelcare-marketplace/admin/live-map">Spatial command <ChevronRight size={13}/></Link></header>
    <div className={styles.territoryPulseList}>{snapshot.territories.slice(0,6).map(territory=><button key={territory.id} type="button" onClick={()=>open('territory',{territory})} data-severity={territory.severity}><div><strong>{territory.name}</strong><span>{territory.severity==='critical'?'HIGH PRESSURE':territory.severity==='attention'?'ATTENTION':'BALANCED'}</span></div><div className={styles.capacityBar}><i style={{width:`${territory.capacityPercent??0}%`}}/></div><dl><div><dt>Demand</dt><dd>{territory.demand}</dd></div><div><dt>Supply</dt><dd>{territory.supply}</dd></div><div><dt>Revenue</dt><dd>{money(territory.revenue)}</dd></div><div><dt>Cases</dt><dd>{territory.customerCases}</dd></div></dl></button>)}</div>
   </section>
  </div>

  <section className={`${styles.nexusPanel} ${styles.moneyPanel}`}>
   <header className={styles.nexusPanelHeader}><div><span className={styles.zoneNumber}>05</span><div><small>MONEY IN MOTION</small><h2>Commercial value through the financial lifecycle</h2></div></div><button type="button" onClick={()=>open('payment',{item:firstItem('payment'),title:'Finance Exposure'})}>Open finance diagnostic <ChevronRight size={13}/></button></header>
   <div className={styles.moneyFlow}>{moneyStages.map(([label,value,Icon],index)=><div className={styles.moneyStage} key={label} data-risk={label==='OUTSTANDING'&&value>0}><Icon size={15}/><span>{label}</span><strong>{money(value)}</strong>{index<4?<ArrowRight size={14}/>:null}</div>)}</div>
   <div className={styles.moneySecondary}><div><WalletCards/><span>AngelCare Credit used</span><strong>{money(snapshot.money.wallet)}</strong></div><div><Landmark/><span>Offline verified</span><strong>{money(snapshot.money.offline)}</strong></div><div><FileTextIcon/><span>Invoices due</span><strong>{money(snapshot.money.invoicesDue)}</strong></div><div><RefreshCcw/><span>Pending reconciliation</span><strong>{money(snapshot.money.reconciliation)}</strong></div></div>
  </section>

  <div className={styles.nexusBottomGrid}>
   <section className={styles.nexusPanel}>
    <header className={styles.nexusPanelHeader}><div><span className={styles.zoneNumber}>06</span><div><small>NEXT OPERATING MOVES</small><h2>Preconfigured decisions — not an empty AI box</h2></div></div></header>
    <div className={styles.operatingMoves}>{snapshot.operatingMoves.map(move=><button key={move.id} type="button" data-severity={move.severity} onClick={()=>{if(move.drawer==='payment')open('payment',{item:snapshot.runway.find(r=>r.paymentId===move.targetId)||firstItem('payment')});else if(move.drawer==='supply')open('supply',{item:snapshot.runway.find(r=>r.missionId===move.targetId)||firstItem('mission')});else if(move.drawer==='customer-case')open('customer-case',{item:snapshot.runway.find(r=>r.caseId===move.targetId)||firstItem('case')});else if(move.drawer==='territory')open('territory',{territory:snapshot.territories.find(t=>t.id===move.targetId)||snapshot.territories[0]});else open('order',{item:firstItem('order')})}}><span>{String(move.rank).padStart(2,'0')}</span><div><strong>{move.title}</strong><small>{move.impact}</small></div><b>{move.actionLabel}<ChevronRight size={13}/></b></button>)}{!snapshot.operatingMoves.length?<div className={styles.healthyState}><CheckCircle2 size={22}/><div><strong>No urgent operating move</strong><span>Command Center is monitoring the next pressure window.</span></div></div>:null}</div>
   </section>

   <section className={styles.nexusPanel}>
    <header className={styles.nexusPanelHeader}><div><span className={styles.zoneNumber}>07</span><div><small>EXECUTIVE WATCH</small><h2>Signals worth management attention</h2></div></div></header>
    <div className={styles.executiveWatch}>{snapshot.executiveWatch.map(signal=><button key={signal.id} type="button" data-severity={signal.severity} onClick={()=>open(signal.drawer==='supply'?'supply':signal.drawer==='payment'?'payment':signal.drawer==='customer-case'?'customer-case':'executive',{signal,item:signal.drawer==='supply'?firstItem('mission'):signal.drawer==='payment'?firstItem('payment'):signal.drawer==='customer-case'?firstItem('case'):null,title:signal.label,subtitle:signal.detail})}><span>{signal.direction==='up'?<ArrowUpRight/>:signal.direction==='down'?<ArrowDownRight/>:<Gauge/>}</span><div><strong>{signal.label}</strong><small>{signal.detail}</small></div><b>{signal.value}</b><i>WHY?</i></button>)}</div>
   </section>
  </div>

  <CommandDrawerSystem drawer={drawer} snapshot={snapshot} onClose={()=>setDrawer(null)} onMinimize={minimize}/>
  {dock.length?<div className={styles.objectDock}><div className={styles.objectDockLabel}><Command size={15}/><span>OBJECT DOCK</span><b>{dock.length}</b></div>{dock.map(value=><button key={value.id} type="button" onClick={()=>restore(value)}><span>{value.kind}</span><strong>{value.title}</strong><small>{value.subtitle}</small><ChevronRight size={13}/></button>)}<button className={styles.dockClear} type="button" onClick={()=>setDock([])} aria-label="Vider le dock"><X size={14}/></button></div>:null}
 </div>
}

function RunwayBand({title,tone,items,onOpen}:{title:string;tone:'critical'|'attention'|'watch';items:RunwayItem[];onOpen:(item:RunwayItem)=>void}){
 if(!items.length)return null
 return <div className={styles.runwayBand} data-tone={tone}><div className={styles.runwayBandTitle}><span>{title}</span><b>{items.length}</b></div><div>{items.slice(0,tone==='critical'?6:5).map(item=><button key={item.id} type="button" className={styles.runwayItem} onClick={()=>onOpen(item)}><i/><div className={styles.runwayRef}><strong>{item.reference}</strong><span>{item.customerName||item.territory||item.kind}</span></div><div className={styles.runwayIssue}><strong>{item.title}</strong><span>{item.subtitle}</span></div><div className={styles.runwayImpact}>{item.amount?<strong>{money(item.amount)}</strong>:<strong>{item.recommendedActionKey.replaceAll('_',' ')}</strong>}<span>{item.ageMinutes===null?'live':`${item.ageMinutes}m`}</span></div><ChevronRight size={14}/></button>)}</div></div>
}

function PressureRowView({row,onOpen}:{row:PressureRow;onOpen:()=>void}){return <button type="button" className={styles.pressureRow} onClick={onOpen}><strong>{row.label}</strong><span data-tone="healthy">{row.healthy}</span><span data-tone="attention">{row.attention}</span><span data-tone="critical">{row.critical}</span><i>{row.trend==='up'?<ArrowUpRight/>:row.trend==='down'?<ArrowDownRight/>:<Activity/>}</i><b>{row.exposureLabel}</b></button>}
function FileTextIcon(){return <PackageCheck/>}
