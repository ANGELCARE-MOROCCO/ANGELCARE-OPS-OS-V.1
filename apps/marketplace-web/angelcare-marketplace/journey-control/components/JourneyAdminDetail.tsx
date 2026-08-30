'use client'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Bell, CheckCircle2, Clock3, FileCheck2, LifeBuoy, Link2, ShieldCheck } from 'lucide-react'
import { useGovernedAction } from '@/angelcare-marketplace/shells/GovernedActionProvider'
import type { JourneyStatus, MarketplaceJourney } from '../types'
import { statusLabels } from '../content'
import { JourneyTimeline } from './JourneyTimeline'
import { DocumentVault } from './DocumentVault'
import styles from '../journey.module.css'
import detailStyles from './journey-admin-detail.module.css'

const date=(value:string|null)=>value?new Date(value).toLocaleString('fr-FR'):'Non planifié'
export function JourneyAdminDetail({journey,canManage}:{journey:MarketplaceJourney;canManage:boolean}){
 const requestAction=useGovernedAction();const[status,setStatus]=useState<JourneyStatus>(journey.status);const[busy,setBusy]=useState(false);const[notice,setNotice]=useState('');const openActions=useMemo(()=>journey.actions.filter(x=>['open','in_progress'].includes(x.status)),[journey.actions]);const failedNotifications=journey.notifications.filter(x=>x.status==='failed');const activeRecoveries=journey.recovery_cases.filter(x=>!['resolved','closed'].includes(x.status));
 async function apply(){
  if(status===journey.status)return
  const reason=await requestAction({
   title:`Faire évoluer ${journey.public_reference}`,
   objectLabel:journey.public_reference,
   currentState:statusLabels.fr[journey.status],
   nextState:statusLabels.fr[status],
   consequence:`Le parcours passera de « ${statusLabels.fr[journey.status]} » à « ${statusLabels.fr[status]} ». Cette transition ajoute un événement visible et une trace d’audit.`,
   permission:'marketplace.journeys.manage',
   danger:['blocked','recovery','cancelled'].includes(status),
   reasonLabel:'Motif de la transition',
  })
  if(!reason)return
  setBusy(true);setNotice('')
  try{
   const response=await fetch(`/api/angelcare-marketplace/journeys/admin/${journey.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({status,reason})})
   const payload=await response.json().catch(()=>({})) as {error?:{message?:string}}
   if(!response.ok)throw new Error(payload.error?.message||'Transition impossible.')
   setNotice('Parcours mis à jour et audité.')
   window.setTimeout(()=>window.location.reload(),450)
  }finally{setBusy(false)}
 }
 return <main className={styles.adminDetailShell}><Link className={styles.backLink} href="/angelcare-marketplace/admin/journeys"><ArrowLeft size={16}/> Journey Command</Link>
  <section className={styles.adminDetailHero}><div><span>{journey.public_reference}</span><h1>{journey.title}</h1><p>{journey.subtitle||`Autorité actuelle : ${journey.current_authority}`}</p><div className={detailStyles.heroMeta}><span>{journey.journey_type.replaceAll('_',' ')}</span><span>Risque {journey.risk_level}</span><span>{journey.territory_id||'Territoire global'}</span></div></div><div><strong>{journey.completion_percent}%</strong><span>{statusLabels.fr[journey.status]}</span></div></section>
  <section className={detailStyles.metricGrid}><Metric icon={<Clock3/>} label="Prochaine échéance" value={date(journey.next_action_due_at)}/><Metric icon={<CheckCircle2/>} label="Actions ouvertes" value={String(openActions.length)}/><Metric icon={<FileCheck2/>} label="Documents" value={String(journey.documents.length)}/><Metric icon={<Bell/>} label="Notifications en échec" value={String(failedNotifications.length)}/><Metric icon={<LifeBuoy/>} label="Recovery active" value={String(activeRecoveries.length)}/></section>
  <nav className={detailStyles.tabs} aria-label="Sections du parcours"><a href="#timeline">Timeline</a><a href="#actions">Actions</a><a href="#documents">Documents</a><a href="#communications">Communications</a><a href="#changes">Demandes</a><a href="#recovery">Recovery</a></nav>
  <section className={detailStyles.layout}><div className={detailStyles.main}>
   <div id="timeline"><JourneyTimeline events={journey.events} locale="fr"/></div>
   <section className={detailStyles.panel} id="actions"><Header title="Actions & handovers" count={journey.actions.length}/><div className={detailStyles.list}>{journey.actions.map(action=><article key={action.id}><span data-status={action.status}>{action.status}</span><div><strong>{action.title}</strong><p>{action.description||'Aucune instruction complémentaire.'}</p><small>{action.required_authority} · échéance {date(action.due_at)}{action.consequence?` · ${action.consequence}`:''}</small></div>{action.action_url?<Link href={action.action_url}>Ouvrir autorité <Link2/></Link>:null}</article>)}{!journey.actions.length?<Empty label="Aucune action source enregistrée."/>:null}</div></section>
   <div id="documents"><DocumentVault documents={journey.documents}/></div>
   <section className={detailStyles.panel} id="communications"><Header title="Communications" count={journey.notifications.length}/><div className={detailStyles.cards}>{journey.notifications.map(item=><article key={item.id} data-alert={item.status==='failed'}><Bell/><div><strong>{item.title}</strong><p>{item.message}</p><small>{item.channel} · {item.status} · {date(item.scheduled_at)}</small></div>{item.deep_link?<Link href={item.deep_link}>Contexte</Link>:null}</article>)}{!journey.notifications.length?<Empty label="Aucune notification enregistrée."/>:null}</div></section>
   <section className={detailStyles.panel} id="changes"><Header title="Demandes de changement" count={journey.change_requests.length}/><div className={detailStyles.cards}>{journey.change_requests.map(item=><article key={item.id}><FileCheck2/><div><strong>{item.request_type.replaceAll('_',' ')}</strong><p>{item.reason}</p><small>{item.status} · soumis {date(item.submitted_at)}</small></div></article>)}{!journey.change_requests.length?<Empty label="Aucune demande de changement."/>:null}</div></section>
   <section className={detailStyles.panel} id="recovery"><Header title="Recovery cases" count={journey.recovery_cases.length}/><div className={detailStyles.cards}>{journey.recovery_cases.map(item=><article key={item.id} data-alert={!['resolved','closed'].includes(item.status)}><LifeBuoy/><div><strong>{item.issue_type.replaceAll('_',' ')}</strong><p>{item.summary}</p><small>{item.status} · urgence {item.urgency} · SLA {date(item.sla_due_at)}</small></div></article>)}{!journey.recovery_cases.length?<Empty label="Aucun recovery case."/>:null}</div></section>
  </div><aside className={`${styles.operatorPanel} ${detailStyles.rail}`}><span>OPERATOR DECISION</span><h2>Faire évoluer le parcours</h2><label>État cible<select value={status} disabled={!canManage||busy} onChange={event=>setStatus(event.target.value as JourneyStatus)}>{Object.entries(statusLabels.fr).map(([value,item])=><option value={value} key={value}>{item}</option>)}</select></label><button className={styles.primaryButton} type="button" onClick={apply} disabled={busy||!canManage||status===journey.status}><ShieldCheck size={16}/>Examiner la transition</button>{!canManage?<div className={detailStyles.permission}>Lecture seule — <code>marketplace.journeys.manage</code> requis.</div>:null}{notice?<div className={detailStyles.notice}>{notice}</div>:null}<div className={styles.operatorFacts}><p><CheckCircle2 size={16}/>Autorité : {journey.current_authority}</p><p><CheckCircle2 size={16}/>Objet : {journey.canonical_object_type}</p><p><CheckCircle2 size={16}/>Finance : projection liée</p><p><CheckCircle2 size={16}/>Territoire : périmètre isolé</p></div><section className={detailStyles.next}><h3>Prochaine action</h3><strong>{journey.next_action_label||'Aucune action déclarée'}</strong><span>{date(journey.next_action_due_at)}</span>{journey.canonical_object_id?<Link href={`/angelcare-marketplace/admin/${journey.canonical_object_type}/${journey.canonical_object_id}`}>Ouvrir objet relié</Link>:null}</section>{(failedNotifications.length||activeRecoveries.length)?<section className={detailStyles.warning}><AlertTriangle/><strong>Intervention requise</strong><span>{failedNotifications.length} notification(s) en échec · {activeRecoveries.length} recovery active(s)</span></section>:null}</aside></section>
 </main>
}
function Metric({icon,label,value}:{icon:ReactNode;label:string;value:string}){return <article>{icon}<span>{label}</span><strong>{value}</strong></article>}
function Header({title,count}:{title:string;count:number}){return <header><div><span>JOURNEY AUTHORITY</span><h2>{title}</h2></div><b>{count}</b></header>}
function Empty({label}:{label:string}){return <div className={detailStyles.empty}>{label}</div>}
