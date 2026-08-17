'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
 AlertTriangle, ArrowRight, BadgeDollarSign, CheckCircle2, ChevronRight, Clock3, ExternalLink,
 FileText, Maximize2, Minimize2, Navigation, RefreshCcw, ShieldAlert, Sparkles, UserRoundCheck,
 UsersRound, WalletCards, X, Zap,
} from 'lucide-react'
import type { CommandCenterSnapshot, ExecutiveSignal, RunwayItem, TerritoryPulse } from '../command-center-types'
import styles from '../enterprise-command.module.css'

export type CommandDrawerKind='incident'|'order'|'payment'|'supply'|'customer-case'|'territory'|'executive'
export type CommandDrawerState={
 id:string
 kind:CommandDrawerKind
 title:string
 subtitle:string
 item?:RunwayItem|null
 territory?:TerritoryPulse|null
 signal?:ExecutiveSignal|null
}

type Envelope<T>={data?:T;error?:{message?:string}}
type Row=Record<string,unknown>
const txt=(row:Row|undefined,key:string)=>String(row?.[key]??'')
const n=(value:unknown)=>{const x=Number(value);return Number.isFinite(x)?x:0}
const money=(value:unknown,currency='Dh')=>`${Math.round(n(value)).toLocaleString('fr-FR')} ${currency}`

export function CommandDrawerSystem({drawer,snapshot,onClose,onMinimize}:{drawer:CommandDrawerState|null;snapshot:CommandCenterSnapshot;onClose:()=>void;onMinimize:(drawer:CommandDrawerState)=>void}){
 const[fullscreen,setFullscreen]=useState(false)
 useEffect(()=>setFullscreen(false),[drawer?.id])
 if(!drawer)return null
 return <div className={styles.commandDrawerBackdrop} role="presentation" onMouseDown={event=>{if(event.currentTarget===event.target)onClose()}}>
  <aside className={`${styles.commandDrawer} ${fullscreen?styles.commandDrawerFullscreen:''}`} role="dialog" aria-modal="true" aria-label={drawer.title}>
   <header className={styles.commandDrawerHeader}>
    <div className={styles.commandDrawerIdentity}>
     <span>{drawer.kind.replace('-', ' ')}</span>
     <strong>{drawer.title}</strong>
     <small>{drawer.subtitle}</small>
    </div>
    <div className={styles.commandDrawerControls}>
     <button type="button" onClick={()=>onMinimize(drawer)} aria-label="Minimiser"><Minimize2 size={15}/></button>
     <button type="button" onClick={()=>setFullscreen(value=>!value)} aria-label={fullscreen?'Réduire':'Plein écran'}><Maximize2 size={15}/></button>
     {drawer.item?.route?<Link href={drawer.item.route} aria-label="Ouvrir le dossier standalone"><ExternalLink size={15}/></Link>:null}
     <button type="button" onClick={onClose} aria-label="Fermer"><X size={16}/></button>
    </div>
   </header>
   <div className={styles.commandDrawerBody}>
    {drawer.kind==='incident'?<IncidentDrawer item={drawer.item}/>:null}
    {drawer.kind==='order'?<OrderTriageDrawer item={drawer.item}/>:null}
    {drawer.kind==='payment'?<PaymentExposureDrawer item={drawer.item}/>:null}
    {drawer.kind==='supply'?<SupplyPressureDrawer item={drawer.item} snapshot={snapshot}/>:null}
    {drawer.kind==='customer-case'?<CustomerCaseDrawer item={drawer.item}/>:null}
    {drawer.kind==='territory'?<TerritoryCommandDrawer territory={drawer.territory}/>:null}
    {drawer.kind==='executive'?<ExecutiveDiagnosticDrawer signal={drawer.signal} snapshot={snapshot}/>:null}
   </div>
  </aside>
 </div>
}

function DrawerSection({eyebrow,title,children,aside}:{eyebrow:string;title:string;children:ReactNode;aside?:ReactNode}){
 return <section className={styles.drawerSection}><div className={styles.drawerSectionHeader}><div><span>{eyebrow}</span><h3>{title}</h3></div>{aside}</div>{children}</section>
}

function FactGrid({facts}:{facts:Array<{label:string;value:ReactNode;tone?:'danger'|'good'|'default'}>}){
 return <div className={styles.drawerFacts}>{facts.map(fact=><div key={fact.label} data-tone={fact.tone||'default'}><span>{fact.label}</span><strong>{fact.value}</strong></div>)}</div>
}

function StructuredReasons({value,onChange,items}:{value:string;onChange:(value:string)=>void;items:Array<{value:string;label:string}>}){
 return <div className={styles.reasonGrid}>{items.map(item=><label key={item.value} data-selected={value===item.value}><input type="radio" name="structured-reason" value={item.value} checked={value===item.value} onChange={()=>onChange(item.value)}/><span>{item.label}</span></label>)}</div>
}

function Notice({value,tone='good'}:{value:string;tone?:'good'|'error'}){return value?<div className={tone==='error'?styles.commandNoticeError:styles.commandNotice}>{value}</div>:null}

function IncidentDrawer({item}:{item?:RunwayItem|null}){
 const[reason,setReason]=useState('provider_unavailable')
 const[busy,setBusy]=useState('')
 const[notice,setNotice]=useState('')
 const[error,setError]=useState('')
 const[mission,setMission]=useState<Row|null>(null)
 const[proposals,setProposals]=useState<Row[]>([])
 async function loadMission(missionId:string){const r=await fetch(`/api/angelcare-marketplace/operations/missions/${missionId}`,{cache:'no-store'});const p=await r.json().catch(()=>({})) as Envelope<{mission?:Row;proposals?:Row[]}>;if(r.ok&&p.data){setMission(p.data.mission||null);setProposals(Array.isArray(p.data.proposals)?p.data.proposals:[])}}
 useEffect(()=>{if(item?.missionId)void loadMission(item.missionId)},[item?.missionId])
 async function replacements(){if(!item?.missionId)return;setBusy('replace');setNotice('');setError('');try{const r=await fetch(`/api/angelcare-marketplace/operations/missions/${item.missionId}/dispatch`,{method:'POST'});const p=await r.json().catch(()=>({})) as Envelope<unknown>;if(!r.ok)throw new Error(p.error?.message||'Scoring provider impossible.');await loadMission(item.missionId);setNotice('Providers recalculés selon éligibilité, disponibilité, territoire et conflits.') }catch(e){setError(e instanceof Error?e.message:'Action impossible.')}finally{setBusy('')}}
 async function recover(status:string,label:string){if(!item?.orderId)return;setBusy(status);setNotice('');setError('');try{const r=await fetch(`/api/angelcare-marketplace/admin/enterprise-command/orders/${item.orderId}/operate`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({fulfillmentStatus:status,nextActionLabel:label,reason:`Operational Command Nexus · ${reason}`})});const p=await r.json().catch(()=>({})) as Envelope<unknown>;if(!r.ok)throw new Error(p.error?.message||'Recovery impossible.');setNotice('État opérationnel enregistré dans la commande et son audit.')}catch(e){setError(e instanceof Error?e.message:'Recovery impossible.')}finally{setBusy('')}}
 if(!item)return <EmptyDrawer/>
 return <>
  <div className={styles.drawerSeverityBanner} data-severity={item.severity}><ShieldAlert size={18}/><div><strong>{item.reference}</strong><span>{item.title} · {item.ageMinutes??'—'} min</span></div></div>
  <DrawerSection eyebrow="BUSINESS IMPACT" title="Décider avec le contexte, pas avec un champ vide">
   <FactGrid facts={[{label:'Customer',value:item.customerName||'Contexte commande'},{label:'Exposure',value:item.amount?money(item.amount,item.currencyLabel):'Service continuity'},{label:'Territory',value:item.territory||'Non qualifié'},{label:'Mission',value:item.missionId?'Operations linked':'Non matérialisée'}]}/>
  </DrawerSection>
  <DrawerSection eyebrow="CURRENT STATE" title="Incident & recovery" aside={item.route?<Link className={styles.drawerTextLink} href={item.route}>Order Command <ChevronRight size={13}/></Link>:null}>
   <div className={styles.currentStateGrid}><span><b>Issue</b>{item.subtitle}</span><span><b>Recommended</b>{item.recommendedAction}</span><span><b>Mission status</b>{txt(mission||undefined,'status')||String(item.payload.missionStatus||'—')}</span><span><b>Provider</b>{txt(mission||undefined,'assigned_provider_id')||String(item.payload.providerId||'Unassigned')}</span></div>
  </DrawerSection>
  <DrawerSection eyebrow="STRUCTURED DECISION" title="Cause opérationnelle">
   <StructuredReasons value={reason} onChange={setReason} items={[{value:'provider_unavailable',label:'Provider unavailable'},{value:'provider_late',label:'Provider late'},{value:'capacity_conflict',label:'Capacity mismatch'},{value:'customer_change',label:'Customer requested change'},{value:'payment_block',label:'Payment unresolved'},{value:'service_configuration',label:'Service configuration issue'}]}/>
  </DrawerSection>
  <DrawerSection eyebrow="OPTIONS" title="Actions canoniques préconfigurées">
   <div className={styles.drawerActionGrid}>
    <button type="button" disabled={busy!==''||!item.missionId} onClick={()=>void replacements()}><Sparkles size={15}/><span><b>{busy==='replace'?'Scoring…':'Generate replacements'}</b><small>Eligibility · availability · territory · conflicts</small></span></button>
    <button type="button" disabled={busy!==''||!item.orderId} onClick={()=>void recover('recovery','Recovery provider / schedule')}><RefreshCcw size={15}/><span><b>Move to recovery</b><small>Preserve order context + audit</small></span></button>
    <button type="button" disabled={busy!==''||!item.orderId} onClick={()=>void recover('blocked','Customer communication required')}><UsersRound size={15}/><span><b>Customer recovery</b><small>Flag next action before communication</small></span></button>
    {item.route?<Link href={item.route}><ExternalLink size={15}/><span><b>Full order dossier</b><small>Items · finance · fulfillment · timeline</small></span></Link>:null}
   </div>
  </DrawerSection>
  {proposals.length?<DrawerSection eyebrow="PROVIDER PROPOSALS" title={`${proposals.length} proposition(s) scorée(s)`}><div className={styles.proposalCompactGrid}>{proposals.slice(0,8).map(row=><div key={txt(row,'id')}><div><strong>{txt(row,'provider_id')}</strong><span>Score {Math.round(n(row.score))}</span></div><small>{Array.isArray(row.conflicts)&&row.conflicts.length?row.conflicts.join(' · '):'Aucun conflit déclaré'}</small></div>)}</div></DrawerSection>:null}
  <Notice value={notice}/><Notice value={error} tone="error"/>
 </>
}

function OrderTriageDrawer({item}:{item?:RunwayItem|null}){
 const[nextAction,setNextAction]=useState('confirm_context')
 const[busy,setBusy]=useState(false)
 const[notice,setNotice]=useState('')
 const[error,setError]=useState('')
 async function apply(){if(!item?.orderId)return;setBusy(true);setNotice('');setError('');try{const labels:Record<string,string>={confirm_context:'Context validated · continue order flow',review_payment:'Review payment exposure',assign_provider:'Generate provider assignment',customer_clarification:'Customer clarification required',cancel_review:'Cancellation review required'};const r=await fetch(`/api/angelcare-marketplace/admin/enterprise-command/orders/${item.orderId}/operate`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({nextActionLabel:labels[nextAction],reason:`Marketplace Command triage · ${nextAction}`})});const p=await r.json().catch(()=>({})) as Envelope<unknown>;if(!r.ok)throw new Error(p.error?.message||'Triage impossible.');setNotice('Triage enregistré sur la commande avec trace d’audit.')}catch(e){setError(e instanceof Error?e.message:'Triage impossible.')}finally{setBusy(false)}}
 if(!item)return <EmptyDrawer/>
 return <>
  <div className={styles.drawerObjectHero}><div><span>INCOMING ORDER</span><h2>{item.reference}</h2><p>{item.customerName||'Customer'} · {item.title}</p></div><strong>{item.amount?money(item.amount,item.currencyLabel):'Value pending'}</strong></div>
  <DrawerSection eyebrow="CONTEXT ALREADY KNOWN" title="L’opérateur confirme — il ne reconstruit pas la commande"><FactGrid facts={[{label:'Status',value:String(item.payload.status||'—')},{label:'Journey',value:String(item.payload.journeyType||'—')},{label:'Territory',value:item.territory||'—'},{label:'Age',value:item.ageMinutes===null?'—':`${item.ageMinutes} min`} ]}/></DrawerSection>
  <DrawerSection eyebrow="TRIAGE" title="Prochaine décision"><StructuredReasons value={nextAction} onChange={setNextAction} items={[{value:'confirm_context',label:'Confirm context'},{value:'review_payment',label:'Review payment'},{value:'assign_provider',label:'Assign provider'},{value:'customer_clarification',label:'Request clarification'},{value:'cancel_review',label:'Cancellation review'}]}/></DrawerSection>
  <div className={styles.drawerStickyActions}><button className={styles.button} type="button" disabled={busy} onClick={()=>void apply()}>{busy?'Applying…':'APPLY TRIAGE'}</button>{item.route?<Link className={styles.buttonSecondary} href={item.route}>OPEN ORDER COMMAND</Link>:null}</div>
  <Notice value={notice}/><Notice value={error} tone="error"/>
 </>
}

function PaymentExposureDrawer({item}:{item?:RunwayItem|null}){
 const[dossier,setDossier]=useState<Row|null>(null)
 const[busy,setBusy]=useState('')
 const[reason,setReason]=useState('payment_verified')
 const[notice,setNotice]=useState('')
 const[error,setError]=useState('')
 useEffect(()=>{if(!item?.paymentId)return;void(async()=>{const r=await fetch(`/api/angelcare-marketplace/admin/payments/${item.paymentId}`,{cache:'no-store'});const p=await r.json().catch(()=>({})) as Envelope<Row>;if(r.ok&&p.data)setDossier(p.data)})()},[item?.paymentId])
 async function mutate(action:'capture'|'failed'|'cancelled'){if(!item?.paymentId)return;setBusy(action);setNotice('');setError('');try{const amount=n(item.payload.expected)-n(item.payload.captured)-n(item.payload.refunded);const r=await fetch(`/api/angelcare-marketplace/admin/payments/${item.paymentId}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({action,amount:action==='capture'&&amount>0?amount:undefined,reason})});const p=await r.json().catch(()=>({})) as Envelope<unknown>;if(!r.ok)throw new Error(p.error?.message||'Action paiement impossible.');setNotice(action==='capture'?'Capture enregistrée.':'Transition financière enregistrée.')}catch(e){setError(e instanceof Error?e.message:'Action paiement impossible.')}finally{setBusy('')}}
 if(!item)return <EmptyDrawer/>
 const payment=(dossier&&typeof dossier==='object'&&'payment' in dossier?dossier.payment:dossier) as Row|undefined
 const expected=n(payment?.expected_amount??item.payload.expected??item.amount)
 const captured=n(payment?.captured_amount??item.payload.captured)
 const refunded=n(payment?.refunded_amount??item.payload.refunded)
 return <>
  <div className={styles.drawerObjectHero}><div><span>PAYMENT EXPOSURE</span><h2>{item.reference}</h2><p>{String(payment?.selected_method??item.payload.method??'Payment method')}</p></div><strong>{money(Math.max(0,expected-captured-refunded),item.currencyLabel)} due</strong></div>
  <DrawerSection eyebrow="PAYMENT SUMMARY" title="Money state"><FactGrid facts={[{label:'Expected',value:money(expected,item.currencyLabel)},{label:'Captured',value:money(captured,item.currencyLabel),tone:captured>0?'good':'default'},{label:'Refunded',value:money(refunded,item.currencyLabel)},{label:'Balance',value:money(Math.max(0,expected-captured-refunded),item.currencyLabel),tone:expected>captured+refunded?'danger':'good'}]}/></DrawerSection>
  <DrawerSection eyebrow="RECOVERY REASON" title="Raison structurée"><StructuredReasons value={reason} onChange={setReason} items={[{value:'payment_verified',label:'Payment verified'},{value:'provider_confirmation',label:'Provider confirmation received'},{value:'customer_retry',label:'Customer retry confirmed'},{value:'offline_verified',label:'Offline payment verified'},{value:'fraud_review',label:'Risk review'},{value:'customer_cancelled',label:'Customer cancelled'}]}/></DrawerSection>
  <DrawerSection eyebrow="ACTIONS" title="Finance actions"><div className={styles.drawerActionGrid}>
   <button type="button" disabled={busy!==''||expected<=captured+refunded} onClick={()=>void mutate('capture')}><BadgeDollarSign size={15}/><span><b>{busy==='capture'?'Capturing…':'Capture balance'}</b><small>Requires verified operator reason</small></span></button>
   <button type="button" disabled={busy!==''} onClick={()=>void mutate('failed')}><AlertTriangle size={15}/><span><b>Mark failed</b><small>Financial exception with audit</small></span></button>
   <button type="button" disabled={busy!==''} onClick={()=>void mutate('cancelled')}><X size={15}/><span><b>Cancel intent</b><small>Preserve evidence and related order</small></span></button>
   {item.route?<Link href={item.route}><WalletCards size={15}/><span><b>Full Finance dossier</b><small>Attempts · refunds · invoices · evidence</small></span></Link>:null}
  </div></DrawerSection>
  <Notice value={notice}/><Notice value={error} tone="error"/>
 </>
}

function SupplyPressureDrawer({item,snapshot}:{item?:RunwayItem|null;snapshot:CommandCenterSnapshot}){
 const[selectedMission,setSelectedMission]=useState(item?.missionId||snapshot.runway.find(r=>r.missionId)?.missionId||'')
 const[mission,setMission]=useState<Row|null>(null)
 const[proposals,setProposals]=useState<Row[]>([])
 const[providers,setProviders]=useState<Row[]>([])
 const[busy,setBusy]=useState('')
 const[notice,setNotice]=useState('')
 const[error,setError]=useState('')
 async function load(id:string){if(!id)return;const[r1,r2]=await Promise.all([fetch(`/api/angelcare-marketplace/operations/missions/${id}`,{cache:'no-store'}),fetch('/api/angelcare-marketplace/operations/providers',{cache:'no-store'})]);const[p1,p2]=await Promise.all([r1.json().catch(()=>({})) as Promise<Envelope<{mission?:Row;proposals?:Row[]}>>,r2.json().catch(()=>({})) as Promise<Envelope<Row[]>>]);if(r1.ok&&p1.data){setMission(p1.data.mission||null);setProposals(Array.isArray(p1.data.proposals)?p1.data.proposals:[])}if(r2.ok&&Array.isArray(p2.data))setProviders(p2.data)}
 useEffect(()=>{if(selectedMission)void load(selectedMission)},[selectedMission])
 async function score(){if(!selectedMission)return;setBusy('score');setNotice('');setError('');try{const r=await fetch(`/api/angelcare-marketplace/operations/missions/${selectedMission}/dispatch`,{method:'POST'});const p=await r.json().catch(()=>({})) as Envelope<unknown>;if(!r.ok)throw new Error(p.error?.message||'Scoring impossible.');await load(selectedMission);setNotice('Scoring provider recalculé à partir des contraintes canoniques.')}catch(e){setError(e instanceof Error?e.message:'Scoring impossible.')}finally{setBusy('')}}
 async function decide(proposal:Row){const id=txt(proposal,'id');if(!id)return;setBusy(id);setNotice('');setError('');try{const r=await fetch(`/api/angelcare-marketplace/operations/proposals/${id}/decision`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({decision:'accepted',reason:'Marketplace Command · Supply Pressure'})});const p=await r.json().catch(()=>({})) as Envelope<unknown>;if(!r.ok)throw new Error(p.error?.message||'Assignation impossible.');await load(selectedMission);setNotice('Provider accepté dans le moteur Operations Execution.')}catch(e){setError(e instanceof Error?e.message:'Assignation impossible.')}finally{setBusy('')}}
 const providerMap=useMemo(()=>new Map(providers.map(p=>[txt(p,'provider_id')||txt(p,'id'),p])),[providers])
 const missionOptions=snapshot.runway.filter(r=>r.missionId)
 return <>
  <div className={styles.drawerObjectHero}><div><span>SUPPLY PRESSURE</span><h2>{txt(mission||undefined,'public_reference')||item?.reference||'Network command'}</h2><p>{txt(mission||undefined,'title')||item?.title||'Provider readiness & assignment'}</p></div><strong>{snapshot.metrics.find(m=>m.key==='providers')?.display||'—'} ready</strong></div>
  <DrawerSection eyebrow="MISSION CONTEXT" title="Choisir la mission sous pression"><select className={styles.select} value={selectedMission} onChange={e=>setSelectedMission(e.target.value)}><option value="">Sélectionner une mission</option>{missionOptions.map(row=><option key={row.id} value={row.missionId||''}>{row.reference} · {row.title}</option>)}</select></DrawerSection>
  <DrawerSection eyebrow="NETWORK" title="Éligibilité, disponibilité, charge et conflits"><FactGrid facts={[{label:'Mission status',value:txt(mission||undefined,'status')||'—'},{label:'Territory',value:txt(mission||undefined,'territory_id')||item?.territory||'—'},{label:'Assigned provider',value:txt(mission||undefined,'assigned_provider_id')||'Unassigned'},{label:'Proposals',value:String(proposals.length)}]}/></DrawerSection>
  <div className={styles.drawerStickyActions}><button className={styles.button} type="button" disabled={!selectedMission||busy!==''} onClick={()=>void score()}><Sparkles size={14}/>{busy==='score'?'SCORING…':'GENERATE PROPOSALS'}</button><Link className={styles.buttonSecondary} href="/angelcare-marketplace/admin/operations/mission-control">MISSION CONTROL</Link></div>
  {proposals.length?<DrawerSection eyebrow="PROVIDER MATRIX" title="Propositions calculées"><div className={styles.providerMatrix}>{proposals.slice(0,12).map(proposal=>{const provider=providerMap.get(txt(proposal,'provider_id'));const conflicts=Array.isArray(proposal.conflicts)?proposal.conflicts.map(String):[];return <div key={txt(proposal,'id')} className={styles.providerMatrixRow}><div><strong>{txt(provider,'display_name')||txt(proposal,'provider_id')}</strong><span>{txt(provider,'operational_status')||'provider'}</span></div><b>{Math.round(n(proposal.score))}%</b><span>{conflicts.length?`${conflicts.length} conflict(s)`:'No declared conflict'}</span><button type="button" disabled={busy!==''||txt(proposal,'status')!=='proposed'} onClick={()=>void decide(proposal)}>{busy===txt(proposal,'id')?'…':'Assign'}</button></div>})}</div></DrawerSection>:<DrawerSection eyebrow="PROVIDER MATRIX" title="Aucune proposition active"><p className={styles.drawerEmptyText}>Lancez le scoring. Le moteur existant utilisera l’éligibilité, la disponibilité, les territoires et les conflits — aucun provider fictif n’est créé pour remplir l’écran.</p></DrawerSection>}
  <Notice value={notice}/><Notice value={error} tone="error"/>
 </>
}

function CustomerCaseDrawer({item}:{item?:RunwayItem|null}){
 const[caseData,setCaseData]=useState<Row|null>(null)
 const[resolution,setResolution]=useState('service_recovery')
 const[busy,setBusy]=useState(false)
 const[notice,setNotice]=useState('')
 const[error,setError]=useState('')
 useEffect(()=>{if(!item?.caseId)return;void(async()=>{const r=await fetch(`/api/angelcare-marketplace/admin/operating/cases/${item.caseId}`,{cache:'no-store'});const p=await r.json().catch(()=>({})) as Envelope<Row>;if(r.ok&&p.data)setCaseData(p.data)})()},[item?.caseId])
 async function apply(){if(!item?.caseId)return;setBusy(true);setNotice('');setError('');try{const dossier=(caseData&&'case' in caseData?caseData.case:caseData) as Row|undefined;const current=txt(dossier,'status')||String(item.payload.status||'open');const next=current==='blocked'?'recovery':current==='new'?'triaged':'in_progress';const labels:Record<string,string>={service_recovery:'Service recovery',replacement_service:'Replacement service',credit_gesture:'AngelCare Credit gesture review',refund_review:'Refund review',reschedule:'Reschedule service',executive_escalation:'Executive escalation'};const r=await fetch(`/api/angelcare-marketplace/admin/operating/cases/${item.caseId}/transition`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({nextStatus:next,reason:`Marketplace Command · ${labels[resolution]}`})});const p=await r.json().catch(()=>({})) as Envelope<unknown>;if(!r.ok)throw new Error(p.error?.message||'Transition case impossible.');setNotice(`Case avancé vers ${next}.`)}catch(e){setError(e instanceof Error?e.message:'Transition impossible.')}finally{setBusy(false)}}
 if(!item)return <EmptyDrawer/>
 return <>
  <div className={styles.drawerObjectHero}><div><span>CUSTOMER CASE</span><h2>{item.reference}</h2><p>{item.customerName||'Customer'} · {item.title}</p></div><strong>{item.ageMinutes??'—'} min</strong></div>
  <DrawerSection eyebrow="CASE CONTEXT" title="Impact relationnel et opérationnel"><FactGrid facts={[{label:'Priority',value:String(item.payload.priority||item.payload.riskLevel||'—'),tone:'danger'},{label:'Exposure',value:item.amount?money(item.amount,item.currencyLabel):'Experience'},{label:'Territory',value:item.territory||'—'},{label:'Status',value:String(item.payload.status||'open')} ]}/></DrawerSection>
  <DrawerSection eyebrow="RESOLUTION TEMPLATE" title="Choisir une doctrine de résolution"><StructuredReasons value={resolution} onChange={setResolution} items={[{value:'service_recovery',label:'Apology + recovery'},{value:'replacement_service',label:'Replacement service'},{value:'credit_gesture',label:'Credit gesture review'},{value:'refund_review',label:'Refund review'},{value:'reschedule',label:'Reschedule'},{value:'executive_escalation',label:'Executive escalation'}]}/></DrawerSection>
  <div className={styles.drawerStickyActions}><button className={styles.button} type="button" disabled={busy} onClick={()=>void apply()}>{busy?'APPLYING…':'APPLY RESOLUTION PATH'}</button>{item.route?<Link className={styles.buttonSecondary} href={item.route}>OPEN CASE DOSSIER</Link>:null}</div>
  <Notice value={notice}/><Notice value={error} tone="error"/>
 </>
}

function TerritoryCommandDrawer({territory}:{territory?:TerritoryPulse|null}){
 if(!territory)return <EmptyDrawer/>
 return <>
  <div className={styles.drawerObjectHero}><div><span>TERRITORY COMMAND</span><h2>{territory.name}</h2><p>{territory.code||'Operational territory'} · live demand / supply</p></div><strong>{territory.capacityPercent===null?'N/A':`${Math.round(territory.capacityPercent)}%`}</strong></div>
  <DrawerSection eyebrow="PULSE" title="Territory operating state"><FactGrid facts={[{label:'Demand',value:territory.demand},{label:'Supply',value:territory.supply},{label:'Open orders',value:territory.openOrders},{label:'Active missions',value:territory.activeMissions},{label:'Revenue',value:money(territory.revenue)},{label:'Provider shortage',value:territory.providerShortage,tone:territory.providerShortage?'danger':'good'},{label:'Customer cases',value:territory.customerCases},{label:'Capacity',value:territory.capacityPercent===null?'N/A':`${Math.round(territory.capacityPercent)}%`} ]}/></DrawerSection>
  <DrawerSection eyebrow="OPERATING MOVES" title="Actions sans reconstruction manuelle"><div className={styles.drawerActionGrid}><Link href="/angelcare-marketplace/admin/operations/mission-control"><Navigation size={15}/><span><b>Open Mission Control</b><small>Filter operational pressure by territory</small></span></Link><Link href="/angelcare-marketplace/admin/live-map"><Zap size={15}/><span><b>Live Spatial Command</b><small>Visitors · orders · fulfillment · providers</small></span></Link><Link href="/angelcare-marketplace/admin/providers"><UsersRound size={15}/><span><b>Provider network</b><small>Capacity and readiness dossiers</small></span></Link><Link href="/angelcare-marketplace/admin/orders"><FileText size={15}/><span><b>Order estate</b><small>Open orders and value flow</small></span></Link></div></DrawerSection>
 </>
}

function ExecutiveDiagnosticDrawer({signal,snapshot}:{signal?:ExecutiveSignal|null;snapshot:CommandCenterSnapshot}){
 const selected=signal||snapshot.executiveWatch[0]
 if(!selected)return <EmptyDrawer/>
 const payment=snapshot.metrics.find(m=>m.key==='payment_waiting')
 const revenue=snapshot.metrics.find(m=>m.key==='revenue')
 const conversion=snapshot.metrics.find(m=>m.key==='conversion')
 return <>
  <div className={styles.drawerObjectHero}><div><span>EXECUTIVE DIAGNOSTIC</span><h2>{selected.label}</h2><p>{selected.detail}</p></div><strong>{selected.value}</strong></div>
  <DrawerSection eyebrow="WHAT CHANGED" title="Business facts disponibles"><FactGrid facts={[{label:'Revenue',value:revenue?.display||'—'},{label:'Conversion',value:conversion?.display||'—'},{label:'Payment exposure',value:payment?.deltaLabel||payment?.display||'—'},{label:'Critical runway',value:snapshot.runway.filter(r=>r.severity==='critical').length},{label:'Territories under pressure',value:snapshot.territories.filter(t=>t.providerShortage>0).length},{label:'Open cases',value:snapshot.counts.cases} ]}/></DrawerSection>
  <DrawerSection eyebrow="LIKELY DRIVERS" title="Evidence — no invented AI conclusion"><div className={styles.diagnosticDrivers}>{snapshot.operatingMoves.slice(0,5).map(move=><div key={move.id} data-severity={move.severity}><span>{String(move.rank).padStart(2,'0')}</span><div><strong>{move.title}</strong><small>{move.impact}</small></div></div>)}</div></DrawerSection>
  <DrawerSection eyebrow="RECOMMENDED DRILLDOWN" title="Open the authoritative workspace"><div className={styles.drawerActionGrid}><Link href="/angelcare-marketplace/admin/orders"><ArrowRight size={15}/><span><b>Orders</b><small>Commercial flow and value at risk</small></span></Link><Link href="/angelcare-marketplace/admin/payments"><BadgeDollarSign size={15}/><span><b>Payments</b><small>Exposure, capture and reconciliation</small></span></Link><Link href="/angelcare-marketplace/admin/operations/mission-control"><Navigation size={15}/><span><b>Mission Control</b><small>Provider and fulfillment pressure</small></span></Link><Link href="/angelcare-marketplace/admin/live-map"><Zap size={15}/><span><b>Live Marketplace</b><small>Spatial demand and intent</small></span></Link></div></DrawerSection>
 </>
}

function EmptyDrawer(){return <div className={styles.drawerEmpty}><CheckCircle2 size={28}/><strong>Aucun objet sélectionné</strong><p>Le Command Center n’invente pas de dossier pour remplir l’interface. Sélectionnez un signal réel dans le workspace.</p></div>}
