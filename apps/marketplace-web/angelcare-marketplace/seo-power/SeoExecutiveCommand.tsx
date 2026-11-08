'use client'

import { useMemo, useState } from 'react'
import {
  AlertCircle, AlertTriangle, ArrowRight, ArrowUpRight, BadgeCheck,
  BarChart3, CheckCircle2, ChevronRight, Clock3, Cpu,
  ExternalLink, FileSearch, Fingerprint, Globe2, Layers3, LifeBuoy,
  ListChecks, LockKeyhole, Play, Radar, RefreshCw, SearchCheck, ShieldAlert,
  ShieldCheck, Target, TrendingUp, Workflow, Zap,
} from 'lucide-react'
import type { Row, Snapshot } from './model'
import { record } from './model'
import { health, recovery } from './operations-model'
import s from './seo-executive.module.css'

type Destination = 'overview' | 'growth' | 'priorities' | 'pages' | 'corrections' | 'executions' | 'automation' | 'history'
type Severity = 'critical' | 'attention' | 'opportunity' | 'healthy'
type Decision = {
  id: string
  project: Row
  severity: Severity
  family: string
  title: string
  description: string
  evidence: string
  destination: Destination
  cta: string
  weight: number
}
type Incident = Row & { diagnostic: ReturnType<typeof recovery>; failureCode: string; followup: Row; hasMismatch: boolean; hasProblem: boolean }
type Props = {
  snapshot: Snapshot
  operations: Row
  runtime: Row
  selectedWorld: string
  connected: boolean
  stale: boolean
  canManage: boolean
  isBusy: boolean
  now: number
  onNavigate: (destination: Destination, projectId?: string) => void
  onAction: (name: string, input: Row) => Promise<Row | null>
  onGuidedStart: () => void
  onRunTracked: () => void
  onRefresh: () => void
}

const rows = (value: unknown): Row[] => Array.isArray(value) ? value.map(record) : []
const number = (value: unknown) => { const n = Number(value); return Number.isFinite(n) && n >= 0 ? n : 0 }
const count = (value: unknown) => new Intl.NumberFormat('fr-FR').format(number(value))
const shortDate = (value: unknown) => {
  const time = Date.parse(String(value || ''))
  return Number.isFinite(time) ? new Date(time).toLocaleString('fr-FR', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Non confirmé'
}
const iconFor = (world: string) => world === 'angelcare' ? 'AC' : world === 'kidflix' ? 'KF' : world === 'jobkix' ? 'JK' : 'SEO'
const prettyWorld = (world: string) => world === 'angelcare' ? 'ANGELCARE' : world === 'kidflix' ? 'KIDFLIX' : world === 'jobkix' ? 'JOBKIX' : world.toUpperCase()
const priorityName = (severity: Severity) => ({critical:'Critique',attention:'À résoudre',opportunity:'Amélioration',healthy:'Conforme'})[severity]
const priorityRank = (severity: Severity) => ({critical:0,attention:1,opportunity:2,healthy:3})[severity]

function makeDecisions(projects: Row[], runtime: Row, ready: boolean, operationsError: string | undefined, now: number): Decision[] {
  const out: Decision[] = []
  for (const p of projects) {
    const name = prettyWorld(String(p.world || ''))
    const projectId = String(p.id || '')
    const add = (id: string, severity: Severity, family: string, title: string, description: string, evidence: string, destination: Destination, cta: string, weight: number) =>
      out.push({id:projectId+':'+id,project:p,severity,family,title,description,evidence,destination,cta,weight})
    const h = health(p, runtime, now)
    if (p.enabled !== true) add('paused','attention','Exécution',`${name} est en pause`,'Les nouvelles tâches sont retenues. Examiner la politique et reprendre explicitement si cela est souhaité.','Univers désactivé dans la configuration.','automation','Examiner la configuration',70)
    if (number(p.failed)+number(p.followup)+number(p.mismatches)>0) add('failures','critical','Fiabilité',`Traiter les incidents ${name}`,'Des travaux ont échoué, sont incomplets ou ont été exécutés sans preuve publique conforme.',`${count(p.failed)} échec(s) · ${count(p.followup)} suite(s) · ${count(p.mismatches)} divergence(s)`,'executions','Ouvrir les preuves',100+number(p.failed))
    if (number(p.expired)>0 || h.state==='blocked' && /interrompue|périmé/i.test(h.reason)) add('leases','critical','Moteur',`Reprise du moteur ${name}`,'Un bail de tâche ou une exécution est périmé. Examiner la file avant toute nouvelle tentative.',`${count(p.expired)} bail(s) expiré(s)`,'executions','Diagnostiquer les baux',93)
    if (h.state==='blocked' && /Automatisation|planification|sans exécution/i.test(h.label+' '+h.reason)) add('scheduler','critical','Planification',`Planificateur ${name} non confirmé`,h.reason,`pg_cron ${runtime.cron===true?'✓':'?'} · pg_net ${runtime.net===true?'✓':'?'} · Vault ${runtime.vault===true?'✓':'?'} · moteur ${runtime.enabled===true?'✓':'?'}`,'automation','Ouvrir l’orchestration',94)
    if (number(p.awaiting_verification)>0) add('verification','attention','Publication',`Vérifications publiques en attente · ${name}`,'Une publication effectuée n’équivaut pas à une page réellement servie et conforme.',`${count(p.awaiting_verification)} correction(s) sans preuve publique`,'corrections','Examiner les preuves',83)
    if (number(p.issues)>0) add('issues','attention','Qualité',`Constats SEO ouverts · ${name}`,'Les problèmes de métadonnées, structure, maillage et contenu doivent être corrigés dans leur source autorisée.',`${count(p.issues)} constat(s) ouvert(s)`,'corrections','Prioriser les corrections',75+Math.min(10,number(p.issues)))
    if (number(p.unscanned)+number(p.stale)>0) add('coverage','opportunity','Couverture',`Inspecter les URL ${name}`,'Un inventaire inexaminé ne peut pas être présenté comme une couverture SEO validée.',`${count(p.unscanned)} jamais explorée(s) · ${count(p.stale)} observation(s) ancienne(s)`,'pages','Explorer les URL',55)
    if (number(p.due)>0 && number(p.used)>=number(record(p.policy).crawlBudget || 120)) add('budget','attention','Capacité',`Budget quotidien atteint · ${name}`,'Les tâches restent persistantes jusqu’à la prochaine fenêtre UTC ou une décision de politique explicite.',`${count(p.used)} requêtes aujourd’hui · ${count(record(p.policy).crawlBudget || 120)} budget autorisé`,'automation','Examiner les limites',76)
    if (number(p.waiting)>0 && record(p.policy).scheduleEnabled !== true) add('manual','opportunity','Exécution',`File manuelle ${name}`,'Des tâches sont en attente et ne pourront pas se déclencher selon une cadence automatisée.',`${count(p.waiting)} tâche(s) en attente`,'executions','Traiter avec suivi',49)
  }
  if ((!ready || operationsError) && !out.length) out.push({id:'global:readiness',project:{id:'',world:'global'},severity:'critical',family:'Configuration',title:'La lecture opérationnelle n’est pas vérifiée',description:operationsError || 'Le moteur SEO ne renvoie pas actuellement une preuve de fonctionnement exploitable.',evidence:'Aucun indicateur absent ne sera affiché comme zéro.',destination:'automation',cta:'Examiner le diagnostic',weight:110})
  return out.sort((a,b)=>priorityRank(a.severity)-priorityRank(b.severity)||b.weight-a.weight)
}

export function SeoExecutiveCommand({snapshot,operations,runtime,selectedWorld,connected,stale,canManage,isBusy,now,onNavigate,onAction,onGuidedStart,onRunTracked,onRefresh}:Props) {
  const [decisionFilter,setDecisionFilter] = useState<'all'|'critical'|'attention'|'opportunity'>('all')
  const [jobFilter,setJobFilter] = useState<'all'|'policy'|'retry'|'configuration'|'rescan'>('all')
  const [expanded,setExpanded] = useState<string|null>(null)
  const [showAll,setShowAll] = useState(false)
  const projects = useMemo(()=>rows(operations.projects).filter(p=>!selectedWorld||String(p.id)===selectedWorld),[operations.projects,selectedWorld])
  const decisions = useMemo(()=>makeDecisions(projects,runtime,snapshot.ready,snapshot.operationsError,now),[projects,runtime,snapshot.ready,snapshot.operationsError,now])
  const incidents = useMemo(()=>rows(snapshot.jobs).map((j): Incident=>{
    const result=record(j.result), f=record(result.followup)
    const code=String(f.code||result.code||'')
    return {...j,diagnostic:recovery(code),failureCode:code,followup:f,hasMismatch:j.kind==='verify'&&result.verified===false,hasProblem:!!(j.error||code||result.verified===false||j.state==='failed'||j.state==='unconfirmed')}
  }).filter(j=>j.hasProblem).filter(j=>!selectedWorld||String(j.project_id)===selectedWorld).slice(0,30),[snapshot.jobs,selectedWorld])
  const filteredIncidents = incidents.filter(j=>jobFilter==='all'||j.diagnostic.kind===jobFilter||(jobFilter==='retry'&&j.diagnostic.kind==='retry'))
  const visibleDecisions=decisions.filter(d=>decisionFilter==='all'||d.severity===decisionFilter).slice(0,showAll?50:8)
  const summary=(key:string)=>projects.reduce((total,p)=>total+number(p[key]),0)
  const countsVerified=snapshot.ready&&Number(operations.version)===2&&!snapshot.operationsError
  const stats=[
    {label:'Pages sous surveillance',value:countsVerified?count(summary('pages')||summary('total')):'—',sub:'Inventaire opérationnel déclaré',type:'inventory',icon:FileSearch},
    {label:'Tâches en attente',value:countsVerified?count(summary('waiting')):'—',sub:`${countsVerified?count(summary('due')):'—'} échéance(s) dues`,type:'waiting',icon:Clock3},
    {label:'Incidents à traiter',value:countsVerified?count(summary('failed')+summary('followup')+summary('mismatches')):'—',sub:'Échecs, suites, divergences',type:'risk',icon:ShieldAlert},
    {label:'Publication vérifiée',value:countsVerified?count(summary('verified')):'—',sub:'Conformité publique observée',type:'verified',icon:BadgeCheck},
    {label:'Pages non auditées',value:countsVerified?count(summary('unscanned')+summary('stale')):'—',sub:'Non explorées ou anciennes',type:'coverage',icon:SearchCheck},
    {label:'Constats ouverts',value:countsVerified?count(summary('issues')):'—',sub:'Dette de qualité à résoudre',type:'issues',icon:Target},
  ]
  const urgent=decisions.filter(d=>d.severity==='critical').length
  const watch=decisions.filter(d=>d.severity==='attention').length
  const activeExecution=projects.some(p=>number(p.running)>0)
  const locked=!snapshot.ready||!!snapshot.operationsError||stale||!connected

  return <div className={s.command}>
    <section className={s.masthead}>
      <div className={s.mastTop}><span className={s.identity}><Radar size={15}/> ANGELCARE DIGITAL INTELLIGENCE / SEO COMMAND</span><span className={s.version}>EXECUTIVE OPERATING DESK · R1</span></div>
      <div className={s.mastMain}><div><span className={s.eyebrow}>SEARCH VISIBILITY · CONTENT AUTHORITY · TECHNICAL EXCELLENCE</span><h2>De la donnée à la décision.<br/><em>De la décision à la preuve.</em></h2><p>Une seule lecture dirigeant, trois univers, un chemin d’action vérifiable. Les anomalies sont séparées des opportunités et les preuves publiques des simples tâches exécutées.</p></div><div className={s.execDial}><span className={s.dialTop}>{locked?'ÉTAT NON CONFIRMÉ':urgent?'INTERVENTION REQUISE':activeExecution?'EXÉCUTION EN COURS':'SYSTÈME OBSERVÉ'}</span><strong>{locked?'—':urgent}</strong><span>alerte(s) critique(s)</span><div className={s.signalBar}><i data-risk={!!urgent||locked}/><i data-risk={!!urgent||locked}/><i/><i/><i/></div><small>Dernière preuve · {shortDate(snapshot.observedAt)}</small></div></div>
      <div className={s.mastFooter}><span className={s.liveLabel} data-status={locked?'unknown':urgent?'risk':'ok'}><span/>{locked?'TÉLÉMÉTRIE NON CONFIRMÉE':connected?'TÉLÉMÉTRIE CONNECTÉE':'CONNEXION INTERROMPUE'}</span><span className={s.miniStatus}><Cpu size={14}/> Moteur {runtime.enabled===true?'activé':'non confirmé'}</span><span className={s.miniStatus}><Workflow size={14}/> Planificateur {runtime.cron===true&&runtime.net===true&&runtime.vault===true?'configuré':'à vérifier'}</span><button type="button" onClick={onRefresh}><RefreshCw size={14}/> Actualiser les preuves</button></div>
    </section>

    <section className={s.scoreBoard} aria-label="Tableau de bord SEO validé">
      {stats.map(({label,value,sub,type,icon:Icon})=><article key={type} className={s.scoreCard} data-type={type}><div className={s.scoreIcon}><Icon size={19}/></div><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></article>)}
    </section>

    <section className={s.opGrid}>
      <article className={s.featurePanel}><div className={s.panelTop}><div><span className={s.panelKicker}>OPERATING MODEL · 360°</span><h3>La chaîne SEO de bout en bout</h3><p>Chaque étape révèle un état distinct. Rien n’est déclaré indexé sur la seule réponse d’un crawler.</p></div><BarChart3 size={21}/></div>
        <div className={s.flowGrid}>
          {[
            {n:'01',label:'Inventorier',desc:'URL natives & portée',metric:count(summary('unscanned')),action:'pages' as Destination,icon:Globe2},
            {n:'02',label:'Auditer',desc:'Robots, contenu, technique',metric:count(summary('stale')),action:'pages' as Destination,icon:FileSearch},
            {n:'03',label:'Décider',desc:'Priorité, preuve, source',metric:count(summary('issues')),action:'priorities' as Destination,icon:Target},
            {n:'04',label:'Corriger',desc:'Autoriser puis publier',metric:count(summary('awaiting_verification')),action:'corrections' as Destination,icon:Layers3},
            {n:'05',label:'Vérifier',desc:'Résultat public réellement servi',metric:count(summary('verified')),action:'corrections' as Destination,icon:ShieldCheck},
          ].map(x=><button key={x.n} type="button" className={s.flowStep} onClick={()=>onNavigate(x.action)}><span className={s.stepNo}>{x.n}</span><x.icon size={20}/><strong>{x.label}</strong><small>{x.desc}</small><em>{countsVerified?x.metric:'—'}</em><ChevronRight size={13} className={s.stepArrow}/></button>)}
        </div>
        <div className={s.modelFoot}><span><ShieldCheck size={15}/> Publication contrôlée et réversible selon les droits</span><span><LockKeyhole size={15}/> Aucune directive robots contournée</span><span><BadgeCheck size={15}/> Validation publique indépendante</span></div>
      </article>
      <article className={s.controlPanel}><div className={s.panelTop}><div><span className={s.panelKicker}>NEXT BEST ACTION</span><h3>Le bon geste, immédiatement</h3></div><Zap size={20}/></div>
        <div className={s.priorityPulse}><span>{locked?'—':urgent}</span><div><strong>blocage(s) prioritaire(s)</strong><small>{locked?'Lecture du système à confirmer':watch?`${watch} sujet(s) supplémentaires à décider`:'Aucun blocage supplémentaire détecté'}</small></div></div>
        {decisions[0]?<div className={s.featuredDecision}><span className={s.severity} data-severity={decisions[0].severity}>{priorityName(decisions[0].severity)}</span><strong>{decisions[0].title}</strong><p>{decisions[0].description}</p><small>{decisions[0].evidence}</small><button type="button" onClick={()=>onNavigate(decisions[0].destination,String(decisions[0].project.id||''))}>{decisions[0].cta}<ArrowRight size={15}/></button></div>:<div className={s.featuredDecision}><CheckCircle2 size={24}/><strong>Aucune décision urgente identifiée</strong><p>Ce constat est limité au dernier snapshot. Poursuivez la surveillance ou initiez un nouveau cycle.</p></div>}
        <div className={s.actionTiles}><button onClick={onGuidedStart} disabled={!canManage||isBusy}><Play size={16}/> Lancer un parcours guidé</button><button onClick={onRunTracked} disabled={!canManage||isBusy||locked}><ListChecks size={16}/> Traiter la file avec suivi</button><button onClick={()=>onNavigate('executions')}><ListChecks size={16}/> Ouvrir les exécutions</button><button onClick={()=>onNavigate('automation')}><Workflow size={16}/> Contrôler l’automatisation</button></div>
      </article>
    </section>

    <section className={s.section}><div className={s.sectionHead}><div><span className={s.panelKicker}>GLOBAL VISIBILITY PORTFOLIO</span><h3>Les trois tours de contrôle</h3><p>Un univers est évalué sur ses propres preuves, son budget et la fraîcheur de ses travaux.</p></div><button type="button" onClick={()=>onNavigate('growth')} className={s.textLink}>Explorer la croissance <ArrowUpRight size={15}/></button></div>
      {projects.length?<div className={s.towerGrid}>{projects.map(p=>{
        const h=health(p,runtime,now),ratio=number(p.verified)+number(p.issues)+number(p.unscanned)+number(p.stale),coverage=ratio?Math.round(100*number(p.verified)/ratio):null
        const policy=record(p.policy)
        return <article key={String(p.id)} className={s.tower} data-health={stale?'unverified':h.state}><div className={s.towerHead}><div className={s.towerId}>{iconFor(String(p.world))}</div><div><span className={s.panelKicker}>SEO TERRITORY</span><h4>{prettyWorld(String(p.world))}</h4></div><span className={s.towerState}>{stale?'Observations anciennes':h.label}</span></div><div className={s.towerScene} aria-hidden="true"><div className={s.towerRings}><i/><i/><i/></div><div className={s.towerSpire}><span/><span/><span/><span/></div><div className={s.towerSignal} data-active={p.enabled===true&&!stale}/><div className={s.towerStat}><strong>{countsVerified?count(p.waiting):'—'}</strong><span>en attente</span></div><div className={s.towerStat}><strong>{countsVerified?count(number(p.failed)+number(p.followup)+number(p.mismatches)):'—'}</strong><span>anomalies</span></div></div><div className={s.towerBody}><p>{h.reason}</p><div className={s.towerCounters}><div><span>Vérifiées</span><strong>{countsVerified?count(p.verified):'—'}</strong></div><div><span>À explorer</span><strong>{countsVerified?count(p.unscanned):'—'}</strong></div><div><span>À corriger</span><strong>{countsVerified?count(p.issues):'—'}</strong></div></div><div className={s.budget}><div><span>Budget aujourd’hui</span><b>{countsVerified?`${count(p.used)} / ${count(policy.crawlBudget||120)}`:'Non confirmé'}</b></div><span className={s.budgetTrack}><i style={{width:`${Math.min(100,number(p.used)/Math.max(1,number(policy.crawlBudget||120))*100)}%`}}/></span></div><small>Observation : {shortDate(p.last_observation)} · Couverture de travail {coverage===null?'non calculable':coverage+'%'}*</small></div><div className={s.towerActions}><button type="button" onClick={()=>onNavigate('priorities',String(p.id))}>Décisions <ArrowRight size={14}/></button><button type="button" onClick={()=>onNavigate('pages',String(p.id))}>Pages</button><button type="button" onClick={()=>onNavigate('executions',String(p.id))}>File</button></div></article>
      })}</div>:<div className={s.emptyEvidence}><AlertCircle size={23}/><strong>Aucune tour observable</strong><p>Le périmètre sélectionné ne contient aucune ligne de projet confirmée. Vérifiez la lecture opérationnelle.</p></div>}
      <small className={s.qualification}>*Ratio de suivi indicatif calculé à partir des comptes disponibles, pas un score Google, ni une mesure de trafic, de classement ou d’indexation.</small>
    </section>

    <section className={s.section}><div className={s.sectionHead}><div><span className={s.panelKicker}>DECISION INTELLIGENCE</span><h3>Portefeuille des décisions</h3><p>Priorités ordonnées par gravité, avec preuve explicite et prochaine action réelle.</p></div><span className={s.totalPill}>{decisions.length} situation(s)</span></div>
      <div className={s.filters}>{([['all','Toutes'],['critical','Critiques'],['attention','À résoudre'],['opportunity','À améliorer']] as const).map(([key,label])=><button key={key} aria-pressed={decisionFilter===key} onClick={()=>setDecisionFilter(key)}>{label}<span>{key==='all'?decisions.length:decisions.filter(d=>d.severity===key).length}</span></button>)}</div>
      {visibleDecisions.length?<div className={s.decisionList}>{visibleDecisions.map((d,i)=><article key={d.id} className={s.decisionRow} data-severity={d.severity}><span className={s.decisionIndex}>{String(i+1).padStart(2,'0')}</span><div className={s.decisionMain}><div className={s.decisionTags}><span className={s.severity} data-severity={d.severity}>{priorityName(d.severity)}</span><span>{prettyWorld(String(d.project.world||''))}</span><span>{d.family}</span></div><strong>{d.title}</strong><p>{d.description}</p><small><Fingerprint size={12}/> {d.evidence}</small></div><button type="button" onClick={()=>onNavigate(d.destination,String(d.project.id||''))}>{d.cta}<ArrowRight size={15}/></button></article>)}</div>:<div className={s.emptyEvidence}><CheckCircle2 size={23}/><strong>Aucune situation pour ce filtre</strong><p>Changez le filtre ou actualisez les observations.</p></div>}
      {decisions.length>8?<button className={s.more} type="button" onClick={()=>setShowAll(v=>!v)}>{showAll?'Afficher moins':'Voir toutes les décisions'}<ChevronRight size={15}/></button>:null}
    </section>

    <section className={s.section}><div className={s.sectionHead}><div><span className={s.panelKicker}>INCIDENT INTELLIGENCE / RUN HISTORY</span><h3>Décodeur des incidents SEO</h3><p>Chaque reprise dépend de la nature de l’incident. Les blocages robots et les absences de configuration ne sont jamais contournés par un clic.</p></div><button type="button" onClick={()=>onNavigate('executions')} className={s.textLink}>Toutes les tâches <ArrowUpRight size={15}/></button></div>
      <div className={s.filters}>{([['all','Tous'],['policy','Politiques robots'],['configuration','Configuration'],['retry','Réseau / reprise'],['rescan','Nouvelle exploration']] as const).map(([key,label])=><button key={key} aria-pressed={jobFilter===key} onClick={()=>setJobFilter(key)}>{label}</button>)}</div>
      {filteredIncidents.slice(0,6).length?<div className={s.incidentList}>{filteredIncidents.slice(0,6).map(j=>{
        const c=j.diagnostic, expandedNow=expanded===String(j.id), retryable=c.kind==='retry'&&['failed','cancelled'].includes(String(j.state))&&number(j.attempts)<3, project=snapshot.projects.find(p=>p.id===j.project_id)
        return <article key={String(j.id)} className={s.incident} data-kind={c.kind}><button type="button" className={s.incidentHead} onClick={()=>setExpanded(v=>v===String(j.id)?null:String(j.id))} aria-expanded={expandedNow}><span className={s.incidentIcon}>{c.kind==='policy'?<LockKeyhole size={17}/>:c.kind==='configuration'?<Cpu size={17}/>:c.kind==='retry'?<RefreshCw size={17}/>:<AlertTriangle size={17}/>}</span><div><small>{project?.name||'SEO POWER'} · {String(j.kind||'Tâche')} · {shortDate(j.created_at)}</small><strong>{String(j.path||j.failureCode||'Incident sans URL confirmée')}</strong></div><span className={s.incidentStatus}>{c.label}</span><ChevronRight size={16}/></button>{expandedNow?<div className={s.incidentDetail}><p>{c.detail}</p><div className={s.incidentEvidence}><strong>Code observé :</strong> {j.failureCode||String(j.state)}<strong>Message :</strong> {String(j.error||record(j.followup).message||'Voir le reçu technique dans les exécutions')}</div><div className={s.incidentActions}><button type="button" onClick={()=>onNavigate(c.kind==='configuration'?'automation':c.kind==='source'?'corrections':'executions',String(j.project_id||''))}><LifeBuoy size={14}/> Diagnostic et preuve</button>{retryable?<button type="button" className={s.primaryAction} disabled={!canManage||isBusy||locked} onClick={()=>void onAction('retry-job',{id:j.id})}><RefreshCw size={14}/> Reprise contrôlée</button>:null}{c.kind==='policy'&&project?.origin?<a href={project.origin.replace(/\/$/,'')+'/robots.txt'} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/> Voir robots.txt</a>:null}<button type="button" onClick={()=>onNavigate('pages',String(j.project_id||''))}><FileSearch size={14}/> Inspecter les URL</button></div></div>:null}</article>
      })}</div>:<div className={s.emptyEvidence}><ShieldCheck size={22}/><strong>Aucun incident dans cet échantillon</strong><p>Les 80 dernières tâches sont consultables dans le workspace. L’absence ici ne prouve pas qu’aucun incident historique n’existe.</p></div>}
    </section>

    <section className={s.bottomGrid}><article><span className={s.panelKicker}>LIVRABLE MANAGÉRIAL</span><h3>Conseil stratégique SEO</h3><p>Le système doit prouver la qualité de l’inventaire, le traitement des incidents et la conformité de publication. Sans connexion Search Console ou données de classement, aucune hausse de visibilité organique ne peut être déduite.</p><button type="button" onClick={()=>onNavigate('growth')}><TrendingUp size={16}/> Étudier les opportunités de croissance</button></article><article><span className={s.panelKicker}>GOUVERNANCE & GARANTIES</span><h3>Des garde-fous non négociables</h3><div className={s.guarantees}><span><CheckCircle2 size={15}/> Les approbations de publication restent obligatoires</span><span><CheckCircle2 size={15}/> Les restrictions robots sont respectées</span><span><CheckCircle2 size={15}/> Les échecs ne sont pas maquillés en réussite</span><span><CheckCircle2 size={15}/> Aucune métrique de trafic n’est inventée</span></div></article></section>
  </div>
}
