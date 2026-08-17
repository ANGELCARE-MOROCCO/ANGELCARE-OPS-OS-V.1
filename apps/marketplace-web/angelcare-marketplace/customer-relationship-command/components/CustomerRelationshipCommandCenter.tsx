'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, BadgeDollarSign, BriefcaseBusiness, ChevronRight, CircleAlert, HeartHandshake, MessageCircle, ShieldAlert, Sparkles, UserPlus, UsersRound, WalletCards } from 'lucide-react'
import type { CustomerCaseRecord, CustomerRelationshipOverview, RelationshipCustomer } from '../types'
import styles from '../customer-relationship.module.css'
import { CreateCustomerDrawer, RelationshipDrawerHost, RelationshipObjectDock } from './CustomerRelationshipDrawers'

const money=(v:number)=>`${Math.round(v).toLocaleString('fr-FR')} Dh`
const date=(v:string)=>new Date(v).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})

type DockItem={id:string;kind:'customer';title:string;subtitle:string}

export function CustomerRelationshipCommandCenter({snapshot}:{snapshot:CustomerRelationshipOverview}){
 const[customer,setCustomer]=useState<RelationshipCustomer|null>(null);const[caseRecord,setCaseRecord]=useState<CustomerCaseRecord|null>(null);const[create,setCreate]=useState(false);const[dock,setDock]=useState<DockItem[]>([]);const[movementFilter,setMovementFilter]=useState('all')
 const movements=useMemo(()=>snapshot.movements.filter(m=>movementFilter==='all'||m.kind===movementFilter),[snapshot.movements,movementFilter])
 const customerById=useMemo(()=>new Map(snapshot.customers.map(c=>[c.id,c])),[snapshot.customers])
 function openCustomer(id:string|null|undefined){if(!id)return;const found=customerById.get(id);if(found)setCustomer(found)}
 function minimizeCurrent(){if(!customer)return;setDock(current=>current.some(i=>i.id===customer.id)?current:[...current,{id:customer.id,kind:'customer',title:customer.name,subtitle:`${customer.reference} · ${money(customer.capturedRevenue)}`}]);setCustomer(null)}
 const metrics=[['Active relationships',snapshot.metrics.active,UsersRound],['Premium',snapshot.metrics.premium,Sparkles],['New this month',snapshot.metrics.newThisMonth,UserPlus],['At risk',snapshot.metrics.atRisk,ShieldAlert],['Open orders',snapshot.metrics.openOrders,BriefcaseBusiness],['Open bookings',snapshot.metrics.openBookings,HeartHandshake],['Customer value',money(snapshot.metrics.customerValue),BadgeDollarSign],['Outstanding',money(snapshot.metrics.outstanding),CircleAlert],['AngelCare Credit',money(snapshot.metrics.creditBalance),WalletCards]] as const
 return <main className={styles.commandCanvas}>
  <section className={styles.relationshipIntro}><div><span>CUSTOMER COMMAND CENTER</span><h2>Every relationship, its value, its pressure and its next legitimate move.</h2><p>Built from canonical customer, family, commerce, finance, CRM and recovery data — no decorative relationship scores.</p></div><div className={styles.introActions}><button className={styles.primaryAction} onClick={()=>setCreate(true)}><UserPlus size={15}/>Create customer</button><Link className={styles.secondaryAction} href="/angelcare-marketplace/admin/customers-revenue/customers">Open registry</Link></div></section>

  <section className={styles.estateStrip}>{metrics.map(([label,value,Icon])=><button key={label}><Icon size={15}/><span>{label}</span><strong>{value}</strong></button>)}</section>

  <div className={styles.commandTopGrid}>
   <section className={styles.relationshipPanel}>
    <header className={styles.panelHeader}><div><span>01</span><div><small>RELATIONSHIP ESTATE</small><h3>Value & segment matrix</h3></div></div><Link href="/angelcare-marketplace/admin/customers-revenue/segments">Intelligence lab <ChevronRight size={13}/></Link></header>
    <div className={styles.segmentMatrix}>{snapshot.segments.map(segment=><Link href={`/angelcare-marketplace/admin/customers-revenue/customers?segment=${segment.key}`} key={segment.key} data-severity={segment.severity}><div><strong>{segment.label}</strong><small>{segment.description}</small></div><b>{segment.count}</b><span>{money(segment.value)}</span></Link>)}</div>
   </section>

   <section className={styles.relationshipPanel}>
    <header className={styles.panelHeader}><div><span>02</span><div><small>CUSTOMER MOVEMENT</small><h3>Relationship movement</h3></div></div></header>
    <div className={styles.microTabs}>{['all','new','premium','high_value','at_risk'].map(key=><button key={key} data-active={movementFilter===key} onClick={()=>setMovementFilter(key)}>{key.replace('_',' ')}</button>)}</div>
    <div className={styles.movementFeed}>{movements.slice(0,12).map(item=><button key={item.id} onClick={()=>openCustomer(item.customerId)}><i data-severity={item.severity}/><time>{date(item.occurredAt)}</time><div><strong>{item.title}</strong><small>{item.reference} · {item.subtitle}</small></div>{item.value?<b>{money(item.value)}</b>:<ChevronRight size={13}/>}</button>)}{!movements.length?<div className={styles.healthyEmpty}>No relationship movement in this filter.</div>:null}</div>
   </section>
  </div>

  <section className={styles.relationshipPanel}>
   <header className={styles.panelHeader}><div><span>03</span><div><small>RELATIONSHIP ATTENTION</small><h3>Customer consequence before operational noise</h3></div></div><Link href="/angelcare-marketplace/admin/customers-revenue/cases">Recovery desk <ChevronRight size={13}/></Link></header>
   <div className={styles.attentionTable}><div className={styles.attentionHeader}><span>Relationship</span><span>Situation</span><span>Value</span><span>Exposure</span><span>Action</span></div>{snapshot.attention.slice(0,12).map(item=><button key={item.id} onClick={()=>openCustomer(item.customerId)} data-severity={item.severity}><div><strong>{item.customerName}</strong><small>{item.reference}{item.premium?' · PREMIUM':''}</small></div><div><strong>{item.reason}</strong><small>{item.detail}</small></div><b>{money(item.customerValue)}</b><b>{item.exposure?money(item.exposure):'—'}</b><span>{item.action.toUpperCase()}<ChevronRight size={13}/></span></button>)}{!snapshot.attention.length?<div className={styles.healthyEmpty}>No relationship currently requires intervention.</div>:null}</div>
  </section>

  <div className={styles.relationshipBottomGrid}>
   <section className={styles.relationshipPanel}>
    <header className={styles.panelHeader}><div><span>04</span><div><small>REVENUE / RETENTION</small><h3>Commercial relationship picture</h3></div></div></header>
    <div className={styles.valueBands}><div><span>Customer value captured</span><strong>{money(snapshot.metrics.customerValue)}</strong><i style={{width:'100%'}}/></div><div><span>Outstanding exposure</span><strong>{money(snapshot.metrics.outstanding)}</strong><i style={{width:`${Math.min(100,snapshot.metrics.customerValue?100*snapshot.metrics.outstanding/snapshot.metrics.customerValue:0)}%`}}/></div><div><span>AngelCare Credit available</span><strong>{money(snapshot.metrics.creditBalance)}</strong><i style={{width:`${Math.min(100,snapshot.metrics.customerValue?100*snapshot.metrics.creditBalance/snapshot.metrics.customerValue:0)}%`}}/></div></div>
    <div className={styles.quickEstate}><Link href="/angelcare-marketplace/admin/customers-revenue/crm"><BriefcaseBusiness/><span>Open CRM pipeline</span><strong>{snapshot.opportunities.filter(o=>!['won','lost'].includes(o.stage)).length}</strong></Link><Link href="/angelcare-marketplace/admin/customers-revenue/families"><HeartHandshake/><span>Family relationships</span><strong>{snapshot.families.length}</strong></Link><Link href="/angelcare-marketplace/admin/customers-revenue/cases"><ShieldAlert/><span>Open cases</span><strong>{snapshot.cases.length}</strong></Link></div>
   </section>

   <section className={styles.relationshipPanel}>
    <header className={styles.panelHeader}><div><span>05</span><div><small>NEXT CUSTOMER MOVES</small><h3>Preconfigured relationship actions</h3></div></div></header>
    <div className={styles.nextMoves}>{snapshot.nextMoves.map(move=><button key={move.id} data-severity={move.severity} onClick={()=>{if(move.targetCustomerId)openCustomer(move.targetCustomerId);else if(move.id==='crm')location.href='/angelcare-marketplace/admin/customers-revenue/crm';else location.href='/angelcare-marketplace/admin/customers-revenue/segments'}}><span>{String(move.rank).padStart(2,'0')}</span><div><strong>{move.title}</strong><small>{move.detail}</small></div><b>{move.actionLabel}<ChevronRight size={13}/></b></button>)}{!snapshot.nextMoves.length?<div className={styles.healthyEmpty}>No urgent customer move. Relationship estate is within current thresholds.</div>:null}</div>
   </section>
  </div>

  <section className={styles.relationshipPanel}>
   <header className={styles.panelHeader}><div><span>06</span><div><small>RECENT RELATIONSHIPS</small><h3>High-value and recently active customers</h3></div></div><Link href="/angelcare-marketplace/admin/customers-revenue/customers">Full registry <ChevronRight size={13}/></Link></header>
   <div className={styles.relationshipCards}>{snapshot.customers.slice(0,8).map(c=><button key={c.id} onClick={()=>setCustomer(c)} data-risk={c.risk}><div><span>{c.premium?'PREMIUM':c.accountKind.toUpperCase()}</span><strong>{c.name}</strong><small>{c.reference} · {c.city||'Territory n/a'}</small></div><dl><div><dt>LTV</dt><dd>{money(c.capturedRevenue)}</dd></div><div><dt>Orders</dt><dd>{c.orderCount}</dd></div><div><dt>Credit</dt><dd>{money(c.walletBalance)}</dd></div><div><dt>Cases</dt><dd>{c.openCases}</dd></div></dl><footer><span>{c.risk==='healthy'?'Relationship healthy':c.riskReasons[0]}</span><ChevronRight size={14}/></footer></button>)}</div>
  </section>

  {customer||caseRecord?<RelationshipDrawerHost customer={customer} caseRecord={caseRecord} onClose={()=>{setCustomer(null);setCaseRecord(null)}} onMinimize={()=>minimizeCurrent()}/>:null}
  {create?<CreateCustomerDrawer onClose={()=>setCreate(false)} onCreated={c=>{setCreate(false);setCustomer(c)}}/>:null}
  <RelationshipObjectDock items={dock} onRestore={item=>{const c=customerById.get(item.id);if(c)setCustomer(c)}} onRemove={id=>setDock(items=>items.filter(item=>item.id!==id))}/>
 </main>
}
