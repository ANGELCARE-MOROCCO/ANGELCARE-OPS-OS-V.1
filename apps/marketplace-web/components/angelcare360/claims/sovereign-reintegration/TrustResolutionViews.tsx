'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { TrustCase, TrustCaseEvent, TrustResolutionSnapshot } from '@/types/angelcare360/trust-resolution'
import { TrustActionButton } from './TrustResolutionActions'
import styles from './TrustResolutionSovereign.module.css'

const STATUS: Record<string,string> = {new:'Nouvelle',open:'Ouverte',in_review:'Qualification',in_progress:'Traitement',assigned:'Assignée',waiting_parent:'Attente famille',waiting_internal:'Attente interne',resolved:'Résolue',closed:'Clôturée',archived:'Archivée'}
const PRIORITY: Record<string,string> = {low:'Faible',normal:'Normale',medium:'Moyenne',high:'Haute',urgent:'Urgente',critical:'Critique'}
const CATEGORY: Record<string,string> = {general:'Général',communication:'Communication',billing:'Facturation',attendance:'Présence',teacher:'Équipe pédagogique',safety:'Sécurité',transport:'Transport',quality:'Qualité',admissions:'Admissions',other:'Autre'}
const date = (value?: string|null) => value ? new Intl.DateTimeFormat('fr-MA',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) : '—'

function Tone({ value, type='status' }: { value:string; type?:'status'|'priority'|'truth' }) { return <span className={styles.tone} data-tone={type === 'priority' ? value : value.replace('_','-')}>{type === 'priority' ? PRIORITY[value] || value : type === 'status' ? STATUS[value] || value : value}</span> }
function Metric({ label, value, note, tone }: { label:string; value:number|string; note:string; tone?:string }) { return <div className={styles.metric} data-tone={tone}><span>{label}</span><strong>{value}</strong><small>{note}</small></div> }
function Empty({ title, copy }: { title:string; copy:string }) { return <div className={styles.empty}><strong>{title}</strong><p>{copy}</p></div> }

export function TrustResolutionCockpit({ snapshot }: { snapshot:TrustResolutionSnapshot }) {
  const m=snapshot.metrics
  return <div className={styles.stack}>
    <section className={styles.readinessRail} aria-label="État de confiance">
      <Metric label="À traiter" value={m.open} note="dossiers actifs" />
      <Metric label="Urgentes" value={m.urgent} note="priorité urgente / critique" tone={m.urgent?'danger':'good'} />
      <Metric label="Hors délai" value={m.overdue} note="échéance dépassée" tone={m.overdue?'warn':'good'} />
      <Metric label="Sans responsable" value={m.unassigned} note="à attribuer" tone={m.unassigned?'warn':'good'} />
      <Metric label="Attente famille" value={m.waitingParent} note="réponse externe" />
      <Metric label="Prêtes à résoudre" value={m.resolutionReady} note="résolution documentée" tone="good" />
    </section>

    <div className={styles.commandGrid}>
      <section className={styles.interventionPanel}>
        <header className={styles.sectionHeader}><div><span className={styles.eyebrow}>Watchtower</span><h2>À traiter maintenant</h2><p>Ordonné par urgence factuelle, dépassement, absence de responsable et temps d’attente.</p></div><Link href="/angelcare-360-command-center/reclamations/tickets">Voir tous les dossiers</Link></header>
        <div className={styles.caseQueue}>{snapshot.interventionQueue.length ? snapshot.interventionQueue.map(item => <CaseQueueCard key={item.id} item={item} />) : <Empty title="Aucune intervention prioritaire" copy="Aucun dossier ouvert ne présente actuellement de signal d’intervention prioritaire." />}</div>
      </section>
      <aside className={styles.trustRail}>
        <div className={styles.railCard}><span className={styles.eyebrow}>Aujourd’hui</span><strong>{m.createdToday}</strong><p>nouveau(x) dossier(s)</p><strong>{m.closedToday}</strong><p>clôture(s) enregistrée(s)</p></div>
        <div className={styles.railCard}><span className={styles.eyebrow}>Répartition</span>{snapshot.categories.slice(0,6).map(category => <div className={styles.categoryBar} key={category.key}><span>{category.label}</span><b>{category.count}</b><i style={{width:`${Math.max(8,Math.round((category.count/Math.max(1,snapshot.cases.length))*100))}%`}} /></div>)}</div>
      </aside>
    </div>

    <section className={styles.flowBoard}><header className={styles.sectionHeader}><div><span className={styles.eyebrow}>Resolution flow</span><h2>Portefeuille de résolution</h2><p>La vue suit les états réellement persistés par SANILA.</p></div></header><div className={styles.flowTrack}>{snapshot.flow.map((bucket,index) => <div className={styles.flowNode} key={bucket.key}><span>{String(index+1).padStart(2,'0')}</span><strong>{bucket.count}</strong><p>{bucket.label}</p></div>)}</div></section>
  </div>
}

function CaseQueueCard({ item }: { item:TrustCase }) {
  return <Link href={`/angelcare-360-command-center/reclamations/tickets/${item.id}`} className={styles.queueCard}>
    <div className={styles.queueIdentity}><span>{item.code}</span><strong>{item.subject}</strong><p>{item.reporter?.label || item.student?.label || 'Origine non liée'} · {CATEGORY[item.category] || item.category}</p></div>
    <div className={styles.queueSignals}><Tone value={item.priority} type="priority"/><Tone value={item.status}/>{item.overdue ? <span className={styles.alertSignal}>Échéance dépassée</span> : null}<small>{item.waitingHours}h depuis la dernière activité</small></div>
  </Link>
}

export function TrustCaseRegistry({ snapshot }: { snapshot:TrustResolutionSnapshot }) {
  const [query,setQuery]=useState(''); const [status,setStatus]=useState('active'); const [priority,setPriority]=useState('all')
  const filtered=useMemo(()=>snapshot.cases.filter(item=>{
    const hay=[item.code,item.subject,item.description,item.reporter?.label,item.student?.label,item.assignedStaff?.label,item.category].join(' ').toLowerCase()
    return (!query||hay.includes(query.toLowerCase())) && (status==='all'||status==='active'&& !['resolved','closed','archived'].includes(item.status)||item.status===status) && (priority==='all'||item.priority===priority)
  }),[snapshot.cases,query,status,priority])
  return <div className={styles.stack}>
    <div className={styles.toolbar}><label className={styles.searchBox}><span>⌕</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Référence, famille, élève, objet, responsable…" /></label><select value={status} onChange={event=>setStatus(event.target.value)}><option value="active">Actifs</option><option value="all">Tous les états</option><option value="new">Nouveaux</option><option value="in_progress">En traitement</option><option value="waiting_parent">Attente famille</option><option value="waiting_internal">Attente interne</option><option value="resolved">Résolus</option><option value="closed">Clôturés</option></select><select value={priority} onChange={event=>setPriority(event.target.value)}><option value="all">Toutes priorités</option><option value="critical">Critiques</option><option value="urgent">Urgentes</option><option value="high">Hautes</option><option value="medium">Moyennes</option></select><TrustActionButton mode="create" label="Nouvelle réclamation" staff={snapshot.staff} parents={snapshot.parents} students={snapshot.students}/></div>
    <section className={styles.registry}><div className={styles.registryHead}><span>Dossier</span><span>Contexte</span><span>Pilotage</span><span>Temps</span><span></span></div>{filtered.length ? filtered.map(item => <div className={styles.registryRow} key={item.id}><div><b>{item.code}</b><strong>{item.subject}</strong><small>{CATEGORY[item.category]||item.category}</small></div><div><strong>{item.reporter?.label||'Origine non liée'}</strong><small>{item.student?.label||'Aucun élève lié'}</small></div><div className={styles.cellSignals}><Tone value={item.priority} type="priority"/><Tone value={item.status}/><small>{item.assignedStaff?.label||'Sans responsable'}</small></div><div><strong>{item.ageHours}h</strong><small>{item.overdue?'Échéance dépassée':item.dueAt?`Échéance ${date(item.dueAt)}`:'Sans échéance'}</small></div><Link className={styles.rowLink} href={`/angelcare-360-command-center/reclamations/tickets/${item.id}`}>Ouvrir →</Link></div>) : <Empty title="Aucun dossier dans cette vue" copy="Modifiez vos filtres ou créez une nouvelle réclamation." />}</section>
  </div>
}

export function TrustOwnershipBoard({ snapshot }: { snapshot:TrustResolutionSnapshot }) {
  const unassigned=snapshot.cases.filter(item=>!item.assignedStaff&&!['closed','archived'].includes(item.status)); const grouped=snapshot.staff.map(person=>({person,cases:snapshot.cases.filter(item=>item.assignedStaff?.id===person.id&&!['closed','archived'].includes(item.status))})).filter(group=>group.cases.length)
  return <div className={styles.ownershipLayout}><section className={styles.interventionPanel}><header className={styles.sectionHeader}><div><span className={styles.eyebrow}>Responsabilité</span><h2>Dossiers sans propriétaire</h2><p>Chaque dossier actif doit avoir un responsable explicite.</p></div></header>{unassigned.length ? <div className={styles.caseQueue}>{unassigned.map(item=><CaseQueueCard key={item.id} item={item}/>)}</div> : <Empty title="Aucun dossier orphelin" copy="Tous les dossiers actifs ont un responsable identifié." />}</section><section className={styles.ownerBoard}>{grouped.map(group=><article className={styles.ownerCard} key={group.person.id}><header><div className={styles.avatar}>{group.person.label.slice(0,2).toUpperCase()}</div><div><strong>{group.person.label}</strong><span>{group.person.role||'Équipe'}</span></div><b>{group.cases.length}</b></header><div>{group.cases.slice(0,5).map(item=><Link href={`/angelcare-360-command-center/reclamations/tickets/${item.id}`} key={item.id}><span>{item.code}</span><strong>{item.subject}</strong><Tone value={item.priority} type="priority"/></Link>)}</div></article>)}</section></div>
}

export function TrustPriorityBoard({ snapshot }: { snapshot:TrustResolutionSnapshot }) {
  const columns=['critical','urgent','high','medium','normal','low']
  return <div className={styles.priorityBoard}>{columns.map(priority=>{const items=snapshot.cases.filter(item=>item.priority===priority&&!['closed','archived'].includes(item.status));return <section className={styles.priorityColumn} data-tone={priority} key={priority}><header><span>{PRIORITY[priority]||priority}</span><strong>{items.length}</strong></header><div>{items.length ? items.map(item=><Link href={`/angelcare-360-command-center/reclamations/tickets/${item.id}`} className={styles.priorityCase} key={item.id}><span>{item.code}</span><strong>{item.subject}</strong><small>{item.assignedStaff?.label||'Sans responsable'}</small><div><Tone value={item.status}/>{item.overdue?<b>En retard</b>:null}</div></Link>) : <p className={styles.columnEmpty}>Aucun dossier.</p>}</div></section>})}</div>
}

export function TrustForensics({ snapshot }: { snapshot:TrustResolutionSnapshot }) {
  return <section className={styles.forensics}><header className={styles.sectionHeader}><div><span className={styles.eyebrow}>Trust Forensics</span><h2>Trace institutionnelle</h2><p>Événements d’audit réellement persistés dans le périmètre Réclamations.</p></div></header>{snapshot.audit.length ? <div className={styles.timeline}>{snapshot.audit.slice(0,300).map(event=><TimelineEvent event={event} key={event.id}/>)}</div> : <Empty title="Aucun événement d’audit" copy="Aucun événement Réclamations n’est disponible pour cet établissement." />}</section>
}

function TimelineEvent({ event }: { event:TrustCaseEvent }) { return <article className={styles.timelineEvent}><i/><time>{date(event.at)}</time><div><strong>{event.label}</strong><p>{event.note||'Événement opérationnel enregistré.'}</p><small>{event.actorLabel||'Auteur non libellé'}{event.caseId?` · ${event.caseId.slice(0,8)}`:''}</small></div></article> }

export function TrustCaseDossier({ snapshot, item, chronology }: { snapshot:TrustResolutionSnapshot; item:TrustCase; chronology:TrustCaseEvent[] }) {
  const [tab,setTab]=useState('resolution')
  const tabs=[['resolution','Vue de résolution'],['chronology','Chronologie'],['facts','Faits & éléments'],['communication','Communication'],['coordination','Coordination interne'],['closure','Résolution'],['audit','Audit']]
  return <div className={styles.dossier}>
    <section className={styles.dossierHero}><div className={styles.caseCode}><span>{item.code}</span><Tone value={item.priority} type="priority"/><Tone value={item.status}/></div><h2>{item.subject}</h2><p>{item.description}</p><div className={styles.identityGrid}><div><span>Famille / origine</span><strong>{item.reporter?.label||'Non liée'}</strong></div><div><span>Élève</span><strong>{item.student?.label||'Aucun élève lié'}</strong></div><div><span>Responsable</span><strong>{item.assignedStaff?.label||'Non assigné'}</strong></div><div><span>Ouverte depuis</span><strong>{item.ageHours}h</strong></div><div><span>Prochaine action</span><strong>{item.nextAction||'À définir'}</strong></div><div><span>Échéance</span><strong>{item.dueAt?date(item.dueAt):'Non définie'}</strong></div></div></section>
    <nav className={styles.dossierTabs}>{tabs.map(([key,label])=><button type="button" key={key} data-active={tab===key} onClick={()=>setTab(key)}>{label}</button>)}</nav>
    <div className={styles.dossierGrid}><main className={styles.dossierMain}>
      {tab==='resolution'?<ResolutionOverview item={item}/>:null}
      {tab==='chronology'?<div className={styles.timeline}>{chronology.length?chronology.map(event=><TimelineEvent event={event} key={`${event.eventType}-${event.id}`}/>):<Empty title="Chronologie vide" copy="Aucun événement n’est encore enregistré."/>}</div>:null}
      {tab==='facts'?<Facts item={item}/>:null}
      {tab==='communication'?<Communications item={item}/>:null}
      {tab==='coordination'?<InternalCoordination item={item}/>:null}
      {tab==='closure'?<Closure item={item}/>:null}
      {tab==='audit'?<div className={styles.timeline}>{snapshot.audit.filter(event=>event.caseId===item.id).map(event=><TimelineEvent event={event} key={event.id}/>)}</div>:null}
    </main><aside className={styles.dossierRail}><span className={styles.eyebrow}>Commandes</span><TrustActionButton mode="assign" label="Attribuer / transférer" item={item} staff={snapshot.staff}/><TrustActionButton mode="update" label="Piloter le dossier" item={item}/><TrustActionButton mode="note" label="Ajouter note interne" item={item}/><TrustActionButton mode="communication" label="Enregistrer communication" item={item}/><TrustActionButton mode="resolve" label="Résoudre / clôturer" item={item}/><div className={styles.truthCard}><strong>Vérité communication</strong><p>SANILA distingue une communication enregistrée d’une livraison réellement confirmée par un fournisseur.</p></div></aside></div>
  </div>
}

function ResolutionOverview({item}:{item:TrustCase}) { return <div className={styles.overviewGrid}><section className={styles.focusCard}><span className={styles.eyebrow}>Situation</span><h3>{CATEGORY[item.category]||item.category}</h3><p>{item.description}</p></section><section className={styles.focusCard}><span className={styles.eyebrow}>Blocage / attente</span><h3>{item.status==='waiting_parent'?'Réponse de la famille attendue':item.status==='waiting_internal'?'Action interne attendue':item.overdue?'Échéance dépassée':'Traitement en cours'}</h3><p>{item.overdue?'Une échéance enregistrée est dépassée.':`${item.waitingHours}h depuis la dernière activité enregistrée.`}</p></section><section className={styles.focusCard}><span className={styles.eyebrow}>Prochaine action</span><h3>{item.nextAction||'À définir'}</h3><p>{item.dueAt?`Échéance : ${date(item.dueAt)}`:'Aucune échéance formalisée.'}</p></section><section className={styles.focusCard}><span className={styles.eyebrow}>Résolution</span><h3>{item.resolutionSummary?'Synthèse disponible':'Résolution non documentée'}</h3><p>{item.resolutionSummary||'Le dossier ne dispose pas encore d’une synthèse de résolution.'}</p></section></div> }
function Facts({item}:{item:TrustCase}) { return <div className={styles.documentPanel}><h3>Faits & éléments du dossier</h3><dl><div><dt>Objet</dt><dd>{item.subject}</dd></div><div><dt>Description initiale</dt><dd>{item.description}</dd></div><div><dt>Catégorie</dt><dd>{CATEGORY[item.category]||item.category}</dd></div><div><dt>Origine</dt><dd>{item.reporter?.label||'Non liée'}{item.sourceChannel?` · ${item.sourceChannel}`:''}</dd></div><div><dt>Création</dt><dd>{date(item.createdAt)}</dd></div></dl><p className={styles.disclaimer}>Cette section présente uniquement les faits persistés dans le dossier. Aucun jugement automatique n’est ajouté.</p></div> }
function Communications({item}:{item:TrustCase}) { return <div className={styles.communicationList}>{item.communications.length?item.communications.map(record=><article key={record.id}><header><strong>{record.channel}</strong><span>{date(record.at)}</span></header><p>{record.note||record.purpose||'Communication enregistrée.'}</p><footer><span>{record.recipientLabel||'Interlocuteur non libellé'}</span><span className={styles.deliveryTruth}>{record.deliveryTruth.replaceAll('_',' ')}</span></footer></article>):<Empty title="Aucune communication enregistrée" copy="Enregistrez seulement les communications réellement effectuées ou préparées, avec leur vérité de livraison."/>}</div> }
function InternalCoordination({item}:{item:TrustCase}) { return <div className={styles.noteStack}>{item.internalNotes.length?item.internalNotes.map(note=><article key={note.id}><header><strong>{note.actorLabel||'Équipe interne'}</strong><span>{date(note.at)}</span></header><p>{note.note||'Note interne'}</p></article>):<Empty title="Aucune note interne" copy="La coordination interne n’a encore aucune note persistée pour ce dossier."/>}</div> }
function Closure({item}:{item:TrustCase}) { const checks=[['Responsable identifié',Boolean(item.assignedStaff)],['Synthèse de résolution',Boolean(item.resolutionSummary)],['Prochaine action clarifiée',Boolean(item.nextAction)||['resolved','closed'].includes(item.status)],['Communication tracée',item.communications.length>0]]; return <div className={styles.closurePanel}><span className={styles.eyebrow}>Closure gate</span><h3>{item.status==='closed'?'Dossier clôturé':item.status==='resolved'?'Résolution enregistrée':'Résolution à consolider'}</h3><p>{item.resolutionSummary||'Aucune synthèse de résolution n’est encore enregistrée.'}</p><div className={styles.checkList}>{checks.map(([label,ok])=><div key={String(label)} data-ok={String(ok)}><span>{ok?'✓':'○'}</span><strong>{label}</strong></div>)}</div></div> }
