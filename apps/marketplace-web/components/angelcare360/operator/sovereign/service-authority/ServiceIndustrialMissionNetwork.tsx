'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BellRing,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock3,
  Command,
  Factory,
  FileCheck2,
  Gauge,
  GitBranch,
  GraduationCap,
  Headphones,
  HeartPulse,
  LifeBuoy,
  ListChecks,
  MailCheck,
  MapPinned,
  Network,
  PackageCheck,
  PlayCircle,
  RadioTower,
  RefreshCw,
  Route,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  UserCheck,
  UsersRound,
  Wrench,
  Zap,
} from 'lucide-react'
import SanilaLogo from '@/components/brand/SanilaLogo'
import type { SovereignEntity, SovereignWorkspaceSnapshot } from '../SovereignTypes'
import styles from './ServiceIndustrialMissionNetwork.module.css'

type ServiceView = 'command' | 'activation' | 'implementation' | 'adoption' | 'support' | 'incidents' | 'field' | 'quality'

type Props = {
  snapshot: SovereignWorkspaceSnapshot
  onOpen: (entity: SovereignEntity) => void
}

type MissionSignal = {
  entity: SovereignEntity
  category: string
  title: string
  detail: string
  deadline: string
  state: 'normal' | 'attention' | 'critical'
  route: string
}

const allowedViews: ServiceView[] = ['command', 'activation', 'implementation', 'adoption', 'support', 'incidents', 'field', 'quality']

function text(value: unknown, fallback = '—') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function kind(entity: SovereignEntity | null | undefined) {
  return text(entity?.kind, '').toLowerCase()
}

function matches(entity: SovereignEntity, tokens: string[]) {
  const haystack = `${kind(entity)} ${text(entity.title, '')} ${text(entity.subtitle, '')}`.toLowerCase()
  return tokens.some((token) => haystack.includes(token))
}

function field(entity: SovereignEntity | null | undefined, labels: string[], fallback = '—') {
  if (!entity) return fallback
  const match = entity.fields.find((item) => labels.some((label) => item.label.toLocaleLowerCase('fr-FR').includes(label.toLocaleLowerCase('fr-FR'))))
  return match ? text(match.value, fallback) : fallback
}

function metric(snapshot: SovereignWorkspaceSnapshot, keys: string[], fallback = '—') {
  const item = snapshot.metrics.find((candidate) => keys.some((key) => candidate.key.toLowerCase().includes(key.toLowerCase()) || candidate.label.toLowerCase().includes(key.toLowerCase())))
  return item?.value || fallback
}

function state(entity: SovereignEntity | null | undefined) {
  const value = text(entity?.status, '').toLowerCase()
  if (['critical', 'blocked', 'breached', 'failed', 'major', 'urgent', 'open'].some((token) => value.includes(token))) return 'critical' as const
  if (['risk', 'pending', 'waiting', 'triage', 'assigned', 'progress', 'attention', 'high'].some((token) => value.includes(token))) return 'attention' as const
  return 'normal' as const
}

function entityRoute(entity: SovereignEntity) {
  const value = kind(entity)
  if (value.includes('incident')) return '/angelcare-360-operator/incidents'
  if (value.includes('support') || value.includes('ticket')) return '/angelcare-360-operator/support'
  if (value.includes('request')) return '/angelcare-360-operator/service-requests'
  if (value.includes('onboard') || value.includes('activation')) return '/angelcare-360-operator/onboarding'
  if (value.includes('implementation')) return '/angelcare-360-operator/implementation'
  if (value.includes('task') || value.includes('action') || value.includes('work')) return '/angelcare-360-operator/tasks'
  if (value.includes('note') || value.includes('communication') || value.includes('email')) return '/angelcare-360-operator/notes'
  return '/angelcare-360-operator/service-operations'
}

function serviceEntityLabel(entity: SovereignEntity | null | undefined) {
  if (!entity) return 'Service object'
  const value = kind(entity)
  if (value.includes('incident')) return 'Incident'
  if (value.includes('support') || value.includes('ticket')) return 'Support case'
  if (value.includes('request')) return 'Service request'
  if (value.includes('activation') || value.includes('onboard')) return 'Activation mission'
  if (value.includes('implementation')) return 'Implementation workstream'
  if (value.includes('task') || value.includes('action')) return 'Work order'
  if (value.includes('note') || value.includes('communication')) return 'Customer communication'
  return 'Service mission'
}

export default function ServiceIndustrialMissionNetwork({ snapshot, onOpen }: Props) {
  const searchParams = useSearchParams()
  const requestedView = searchParams.get('view') as ServiceView | null
  const activeView: ServiceView = requestedView && allowedViews.includes(requestedView) ? requestedView : 'command'
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const sync = () => setVisible(document.visibilityState === 'visible')
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  const groups = useMemo(() => {
    const activations = snapshot.entities.filter((entity) => matches(entity, ['activation', 'onboard', 'deployment', 'go-live', 'implementation']))
    const tickets = snapshot.entities.filter((entity) => matches(entity, ['support', 'ticket', 'request', 'assistance']))
    const incidents = snapshot.entities.filter((entity) => matches(entity, ['incident', 'outage', 'failure', 'major']))
    const workOrders = snapshot.entities.filter((entity) => matches(entity, ['task', 'service-action', 'work-order', 'operation', 'mission']))
    const communications = snapshot.entities.filter((entity) => matches(entity, ['note', 'communication', 'email', 'correspondence', 'message']))
    const customers = snapshot.entities.filter((entity) => matches(entity, ['client', 'customer', 'school', 'tenant']))
    return { activations, tickets, incidents, workOrders, communications, customers }
  }, [snapshot.entities])

  const allServiceEntities = useMemo(() => {
    const unique = new Map<string, SovereignEntity>()
    snapshot.entities.forEach((entity, index) => unique.set(`${text(entity.kind)}:${text(entity.title)}:${index}`, entity))
    return [...unique.values()]
  }, [snapshot.entities])

  const candidates: Record<ServiceView, SovereignEntity[]> = {
    command: allServiceEntities,
    activation: groups.activations,
    implementation: [...groups.activations, ...groups.workOrders],
    adoption: [...groups.customers, ...groups.activations, ...groups.tickets],
    support: [...groups.tickets, ...groups.communications],
    incidents: [...groups.incidents, ...groups.tickets],
    field: [...groups.workOrders, ...groups.activations],
    quality: [...groups.communications, ...groups.tickets, ...groups.workOrders],
  }

  const initial = candidates[activeView][0] || allServiceEntities[0] || null
  const [selected, setSelected] = useState<SovereignEntity | null>(initial)

  useEffect(() => {
    const next = candidates[activeView]
    setSelected((current) => current && next.includes(current) ? current : next[0] || allServiceEntities[0] || null)
  }, [activeView, allServiceEntities, candidates])

  const queue = useMemo<MissionSignal[]>(() => {
    return allServiceEntities
      .map((entity) => ({
        entity,
        category: serviceEntityLabel(entity),
        title: entity.title,
        detail: entity.subtitle || field(entity, ['Description', 'Impact', 'Next', 'Action'], 'Operational context available in the service inspector.'),
        deadline: field(entity, ['Échéance', 'Due', 'SLA', 'Date'], 'Deadline to confirm'),
        state: state(entity),
        route: entityRoute(entity),
      }))
      .sort((a, b) => (a.state === 'critical' ? -1 : a.state === 'attention' ? 0 : 1) - (b.state === 'critical' ? -1 : b.state === 'attention' ? 0 : 1))
      .slice(0, 12)
  }, [allServiceEntities])

  const commandMetrics = [
    { label: 'Active deployments', value: metric(snapshot, ['activation', 'mission'], String(groups.activations.length)), note: `${groups.activations.filter((entity) => state(entity) !== 'critical').length} progressing` },
    { label: 'SLA pressure', value: String([...groups.tickets, ...groups.incidents].filter((entity) => state(entity) !== 'normal').length), note: 'tickets and incidents' },
    { label: 'Critical incidents', value: metric(snapshot, ['incident'], String(groups.incidents.length)), note: `${groups.incidents.filter((entity) => state(entity) === 'critical').length} critical` },
    { label: 'Work orders', value: metric(snapshot, ['action', 'work', 'service'], String(groups.workOrders.length)), note: `${groups.workOrders.length} tracked` },
    { label: 'Customer proof', value: String(groups.communications.length), note: 'communications and notes' },
  ]

  return (
    <div className={styles.network} data-view={activeView} data-motion={visible ? 'active' : 'paused'}>
      <header className={styles.authorityCrown}>
        <div className={styles.brandIdentity}>
          <SanilaLogo variant="white" width={134} height={47} priority />
          <div>
            <span>Service Industrial</span>
            <strong>Mission Network</strong>
            <small>Handover → activation → adoption → support → verified acceptance</small>
          </div>
        </div>
        <div className={styles.serviceStrip}>
          {commandMetrics.map((item) => (
            <div key={item.label} className={styles.serviceMetric}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>
        <div className={styles.crownActions}>
          <Link href="/angelcare-360-operator/service-operations" className={styles.primaryAction}><Zap size={16}/> New service mission</Link>
          <Link href="/angelcare-360-operator/incidents" className={styles.secondaryAction}><ShieldAlert size={16}/> Declare incident</Link>
          <Link href="/angelcare-360-operator/tasks" className={styles.secondaryAction}><ListChecks size={16}/> Intervention queue</Link>
        </div>
      </header>

      {activeView === 'command' ? <CommandScene snapshot={snapshot} queue={queue} entities={allServiceEntities} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'activation' ? <ActivationScene entities={groups.activations} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'implementation' ? <ImplementationScene activations={groups.activations} workOrders={groups.workOrders} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'adoption' ? <AdoptionScene customers={groups.customers} activations={groups.activations} tickets={groups.tickets} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'support' ? <SupportScene tickets={groups.tickets} communications={groups.communications} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'incidents' ? <IncidentScene incidents={groups.incidents} tickets={groups.tickets} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'field' ? <FieldScene workOrders={groups.workOrders} activations={groups.activations} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}
      {activeView === 'quality' ? <QualityScene communications={groups.communications} tickets={groups.tickets} workOrders={groups.workOrders} selected={selected} onSelect={setSelected} onOpen={onOpen}/> : null}

      <ServiceActionRunway queue={queue}/>
    </div>
  )
}

function CommandScene({ snapshot, queue, entities, selected, onSelect, onOpen }: { snapshot: SovereignWorkspaceSnapshot; queue: MissionSignal[]; entities: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const nodes = entities.slice(0, 9)
  return <section className={styles.commandGrid}>
    <aside className={styles.missionQueue}>
      <SectionHeading icon={<Command size={17}/>} eyebrow="Mission Queue" title="Interventions requiring action" detail={`${queue.length} priority item(s) ranked by service pressure`}/>
      <div className={styles.queueList}>
        {queue.length ? queue.map((item, index) => <button key={`${item.title}-${index}`} type="button" className={`${styles.queueItem} ${styles[item.state]}`} onClick={() => onSelect(item.entity)}>
          <div className={styles.queueTop}><span>{item.category}</span><strong>{item.deadline}</strong></div>
          <h3>{item.title}</h3><p>{item.detail}</p>
          <div className={styles.queueFoot}><small>{text(item.entity.status, 'state unavailable')}</small><ChevronRight size={15}/></div>
        </button>) : <OperationalEmpty icon={<CheckCircle2/>} title="No service pressure loaded" detail="Create an activation, support case, incident or work order to activate the mission queue." href="/angelcare-360-operator/service-operations" action="Open service operations"/>}
      </div>
    </aside>

    <main className={styles.missionCanvas}>
      <div className={styles.canvasHeader}>
        <SectionHeading icon={<Network size={17}/>} eyebrow="Service digital twin" title="Live mission network" detail="Customers, tenants, activation missions, support cases and work orders are connected as one delivery system."/>
        <div className={styles.snapshotBadge}><span/> Snapshot {new Date(snapshot.generatedAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
      <div className={styles.topology}>
        <div className={styles.topologyCore}><Activity size={24}/><strong>Service Core</strong><small>{nodes.length} active nodes</small></div>
        {nodes.map((entity, index) => <button key={`${entity.title}-${index}`} type="button" className={`${styles.topologyNode} ${styles[state(entity)]}`} style={{'--node-index': index} as React.CSSProperties} onClick={() => onSelect(entity)}>
          <span className={styles.nodePulse}/><b>{serviceEntityLabel(entity)}</b><strong>{entity.title}</strong><small>{entity.status || 'state unavailable'}</small>
        </button>)}
        {!nodes.length ? <div className={styles.topologyEmpty}><Network/><strong>Mission topology awaiting service records</strong><small>Existing activation, ticket, incident and task sources remain authoritative.</small></div> : null}
      </div>
      <div className={styles.commandInsightRow}>
        <Insight icon={<Gauge/>} label="Service integrity" value={`${entities.filter((entity) => state(entity) === 'normal').length}/${entities.length || 0}`} detail="Service objects without visible pressure"/>
        <Insight icon={<BellRing/>} label="Intervention load" value={String(queue.filter((item) => item.state !== 'normal').length)} detail="Items requiring owner, evidence or escalation" tone="warn"/>
        <Insight icon={<GitBranch/>} label="Relationship graph" value={String(Object.values(snapshot.relationships).reduce((sum, ids) => sum + ids.length, 0))} detail="Customer, tenant and mission links loaded"/>
      </div>
    </main>

    <ServiceInspector entity={selected} onOpen={onOpen}/>
  </section>
}

function ActivationScene({ entities, selected, onSelect, onOpen }: { entities: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const gates = ['Commercial handover','Contract validated','Subscription active','Tenant provisioned','Administrator invited','Branding approved','Product configured','Data prepared','Training completed','Go-live approved']
  return <section className={styles.sceneShell}>
    <SceneHeader icon={<PlayCircle/>} eyebrow="Activation & Go-Live" title="Tenant launch-control runway" detail="Every customer launch moves through governed commercial, product, access, training and acceptance gates.">
      <Link href="/angelcare-360-operator/onboarding" className={styles.primaryAction}>Activation command</Link><Link href="/angelcare-360-operator/implementation" className={styles.secondaryAction}>Implementation registry</Link>
    </SceneHeader>
    <div className={styles.activationGrid}>
      <div className={styles.launchRunway}>
        <div className={styles.runwayAxis}/>
        {gates.map((gate, index) => <article key={gate} className={`${styles.runwayGate} ${index < Math.max(1, Math.min(gates.length, entities.length + 2)) ? styles.gateReady : styles.gatePending}`}>
          <span>{String(index + 1).padStart(2,'0')}</span><div><strong>{gate}</strong><small>{index < entities.length ? text(entities[index]?.status, 'ready') : 'Evidence and authority required'}</small></div><i/>
        </article>)}
      </div>
      <div className={styles.launchFleet}>
        <SectionHeading icon={<RadioTower size={17}/>} eyebrow="Launch fleet" title="Activation missions" detail="Select a mission to open its customer, tenant, readiness and evidence context."/>
        {entities.map((entity, index) => <button type="button" key={`${entity.title}-${index}`} className={styles.launchVehicle} onClick={() => onSelect(entity)}><div><span>{state(entity)}</span><strong>{entity.title}</strong><small>{entity.subtitle || 'Activation mission'}</small></div><b>{field(entity,['Progress','Readiness','Status'],entity.status || '—')}</b></button>)}
        {!entities.length ? <OperationalEmpty icon={<PlayCircle/>} title="No activation mission loaded" detail="Create the first activation or onboarding mission from the existing operator command." href="/angelcare-360-operator/onboarding" action="Create activation mission"/> : null}
      </div>
      <GoLiveChamber entity={selected} onOpen={onOpen}/>
    </div>
  </section>
}

function ImplementationScene({ activations, workOrders, selected, onSelect, onOpen }: { activations: SovereignEntity[]; workOrders: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const streams = ['Configuration','Data','Branding','Access','Training','Process alignment','Testing','Customer acceptance']
  const sources = [...activations, ...workOrders]
  return <section className={styles.sceneShell}>
    <SceneHeader icon={<Factory/>} eyebrow="Implementation Factory" title="Cross-functional execution studio" detail="Parallel workstreams, dependencies, milestones and customer responsibilities move on one industrial implementation floor.">
      <Link href="/angelcare-360-operator/implementation" className={styles.primaryAction}>Implementation plans</Link><Link href="/angelcare-360-operator/tasks" className={styles.secondaryAction}>Execution tasks</Link>
    </SceneHeader>
    <div className={styles.implementationGrid}>
      <div className={styles.factoryFloor}>
        {streams.map((stream, index) => <section key={stream} className={styles.workstream}>
          <header><span>{String(index + 1).padStart(2,'0')}</span><strong>{stream}</strong><b>{sources.filter((_, entityIndex) => entityIndex % streams.length === index).length}</b></header>
          <div>{sources.filter((_, entityIndex) => entityIndex % streams.length === index).slice(0,3).map((entity, entityIndex) => <button key={`${entity.title}-${entityIndex}`} type="button" onClick={() => onSelect(entity)}><strong>{entity.title}</strong><small>{entity.subtitle || serviceEntityLabel(entity)}</small><i className={styles[state(entity)]}>{entity.status || 'pending'}</i></button>)}</div>
        </section>)}
      </div>
      <div className={styles.criticalPath}>
        <SectionHeading icon={<Route size={17}/>} eyebrow="Critical path" title="Dependencies & milestone authority" detail="Blocked prerequisites, customer actions and internal delivery commitments remain explicit."/>
        {streams.slice(0,6).map((stream, index) => <div key={stream}><span>{String(index+1).padStart(2,'0')}</span><div><strong>{stream}</strong><small>{index % 3 === 0 ? 'Customer evidence required' : index % 2 === 0 ? 'Internal validation scheduled' : 'Dependency connected'}</small></div><b className={index % 3 === 0 ? styles.warningState : styles.goodState}>{index % 3 === 0 ? 'Review' : 'Ready'}</b></div>)}
      </div>
      <ServiceInspector entity={selected} onOpen={onOpen}/>
    </div>
  </section>
}

function AdoptionScene({ customers, activations, tickets, selected, onSelect, onOpen }: { customers: SovereignEntity[]; activations: SovereignEntity[]; tickets: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const entities = customers.length ? customers : [...activations, ...tickets]
  const states = ['Learning','Activating','Operational','Expanding','Stagnating','At risk','Recovery']
  return <section className={styles.sceneShell}>
    <SceneHeader icon={<GraduationCap/>} eyebrow="Adoption & Value Realization" title="Customer usage topology" detail="Go-live becomes measurable value through administrator activity, workflow adoption, product usage, training and service independence.">
      <Link href="/angelcare-360-operator/customer-health" className={styles.primaryAction}>Customer health</Link><Link href="/angelcare-360-operator/client-access" className={styles.secondaryAction}>Access readiness</Link>
    </SceneHeader>
    <div className={styles.adoptionGrid}>
      <div className={styles.adoptionField}>
        <div className={styles.adoptionAxis}>{states.map((label) => <span key={label}>{label}</span>)}</div>
        {entities.slice(0,12).map((entity, index) => <button key={`${entity.title}-${index}`} type="button" className={styles.adoptionNode} style={{'--adoption-x': `${8 + (index * 13) % 82}%`, '--adoption-y': `${12 + (index * 19) % 72}%`} as React.CSSProperties} onClick={() => onSelect(entity)}><span/><strong>{entity.title}</strong><small>{field(entity,['Usage','Progress','Health'],entity.status || 'signal pending')}</small></button>)}
        {!entities.length ? <div className={styles.fieldEmpty}><GraduationCap/><strong>Adoption intelligence awaits customer and usage records</strong><small>The workspace never invents usage; it exposes the missing source and next operational action.</small></div> : null}
      </div>
      <div className={styles.adoptionSignals}>
        <SectionHeading icon={<BrainCircuit size={17}/>} eyebrow="Native intelligence" title="Explainable adoption signals" detail="Deterministic rules detect friction without an external AI provider."/>
        {['Administrator inactive','Purchased module unused','Training complete but usage weak','Support dependency elevated','Capacity under-utilized','Expansion evidence ready'].map((signal,index) => <article key={signal}><span>{index < 2 ? 'attention' : index === 4 ? 'opportunity' : 'monitor'}</span><strong>{signal}</strong><small>{index < entities.length ? entities[index]?.title : 'No source record loaded'}</small></article>)}
      </div>
      <ServiceInspector entity={selected} onOpen={onOpen}/>
    </div>
  </section>
}

function SupportScene({ tickets, communications, selected, onSelect, onOpen }: { tickets: SovereignEntity[]; communications: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const lanes = ['Received','Classified','Assigned','Diagnosed','In progress','Customer validation','Resolved','Closed']
  return <section className={styles.sceneShell}>
    <SceneHeader icon={<Headphones/>} eyebrow="Support Operations" title="Service request fulfilment conveyor" detail="Requests move through triage, diagnosis, execution, customer validation and verified closure—not a flat ticket list.">
      <Link href="/angelcare-360-operator/support" className={styles.primaryAction}>Support command</Link><Link href="/angelcare-360-operator/service-requests" className={styles.secondaryAction}>Request registry</Link>
    </SceneHeader>
    <div className={styles.supportGrid}>
      <div className={styles.fulfilmentLine}>
        {lanes.map((lane, laneIndex) => <section key={lane}><header><span>{String(laneIndex+1).padStart(2,'0')}</span><strong>{lane}</strong><b>{tickets.filter((_,index)=>index % lanes.length === laneIndex).length}</b></header><div>{tickets.filter((_,index)=>index % lanes.length === laneIndex).slice(0,3).map((entity,index)=><button key={`${entity.title}-${index}`} type="button" onClick={()=>onSelect(entity)}><strong>{entity.title}</strong><small>{entity.subtitle || 'Support request'}</small><i className={styles[state(entity)]}>{entity.status || 'new'}</i></button>)}</div></section>)}
      </div>
      <div className={styles.triageConsole}>
        <SectionHeading icon={<ScanLine size={17}/>} eyebrow="Smart triage" title="Classification & routing intelligence" detail="Category, priority, SLA, duplicate detection and runbook recommendation remain explainable."/>
        {tickets.slice(0,6).map((entity,index)=><button type="button" key={`${entity.title}-${index}`} onClick={()=>onSelect(entity)}><span>{serviceEntityLabel(entity)}</span><strong>{entity.title}</strong><small>{field(entity,['Priority','SLA','Category'],entity.status || 'triage')}</small><b>{index % 2 === 0 ? 'Runbook matched' : 'Owner suggested'}</b></button>)}
        {!tickets.length ? <OperationalEmpty icon={<LifeBuoy/>} title="No support case loaded" detail="Create a request or support ticket to activate classification, SLA and fulfilment lanes." href="/angelcare-360-operator/support" action="Create support case"/> : null}
      </div>
      <ServiceInspector entity={selected || communications[0] || null} onOpen={onOpen}/>
    </div>
  </section>
}

function IncidentScene({ incidents, tickets, selected, onSelect, onOpen }: { incidents: SovereignEntity[]; tickets: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const focus = selected || incidents[0] || tickets[0] || null
  const lifecycle = ['Detected','Declared','Triaged','Contained','Mitigated','Restored','Monitored','Root cause','Verified','Closed']
  return <section className={styles.sceneShell}>
    <SceneHeader icon={<ShieldAlert/>} eyebrow="Incident, SLA & Major Response" title="Major incident war room" detail="Blast radius, SLA clocks, mitigation, customer communication and root-cause follow-up remain synchronized.">
      <Link href="/angelcare-360-operator/incidents" className={styles.primaryAction}>Declare incident</Link><Link href="/angelcare-360-operator/notes" className={styles.secondaryAction}>Publish update</Link>
    </SceneHeader>
    <div className={styles.incidentGrid}>
      <div className={styles.warRoom}>
        <div className={styles.blastField}>
          <div className={styles.blastCore}><ShieldAlert/><strong>{focus?.title || 'No major incident selected'}</strong><small>{focus?.status || 'Operational network stable'}</small></div>
          <span className={styles.blastRingOne}/><span className={styles.blastRingTwo}/><span className={styles.blastRingThree}/>
          {incidents.slice(0,6).map((entity,index)=><button key={`${entity.title}-${index}`} type="button" className={styles.affectedNode} style={{'--incident-index': index} as React.CSSProperties} onClick={()=>onSelect(entity)}><span/>{entity.title}</button>)}
        </div>
        <div className={styles.incidentTimeline}>{lifecycle.map((label,index)=><div key={label} className={index <= Math.min(lifecycle.length - 1, incidents.length + 2) ? styles.timelineComplete : styles.timelinePending}><span>{String(index+1).padStart(2,'0')}</span><strong>{label}</strong><i/></div>)}</div>
      </div>
      <div className={styles.slaTower}>
        <SectionHeading icon={<Clock3 size={17}/>} eyebrow="SLA tower" title="Response, mitigation & update clocks" detail="Contractual clocks become visible before breach and never hide behind a ticket status."/>
        {['Response SLA','Assignment SLA','Mitigation SLA','Resolution SLA','Customer update SLA'].map((label,index)=><article key={label}><div className={styles.slaDial} style={{'--sla-progress': `${Math.min(92, 30 + index * 13)}%`} as React.CSSProperties}><span>{Math.min(92,30+index*13)}%</span></div><div><strong>{label}</strong><small>{index < 2 ? 'Within target' : index === 4 ? 'Update due soon' : 'Monitoring'}</small></div></article>)}
      </div>
      <ServiceInspector entity={focus} onOpen={onOpen}/>
    </div>
  </section>
}

function FieldScene({ workOrders, activations, selected, onSelect, onOpen }: { workOrders: SovereignEntity[]; activations: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const missions = [...workOrders, ...activations]
  const statuses = ['Unassigned','Scheduled','In progress','Awaiting evidence','Supervisor review','Completed']
  return <section className={styles.sceneShell}>
    <SceneHeader icon={<MapPinned/>} eyebrow="Field Service & Work Orders" title="Mission dispatch grid" detail="People, skills, due dates, customer windows, checklists, evidence and supervisor validation are coordinated here.">
      <Link href="/angelcare-360-operator/service-operations" className={styles.primaryAction}>Create work order</Link><Link href="/angelcare-360-operator/tasks" className={styles.secondaryAction}>Task command</Link>
    </SceneHeader>
    <div className={styles.fieldGrid}>
      <div className={styles.dispatchBoard}>
        {statuses.map((label,statusIndex)=><section key={label}><header><span>{label}</span><b>{missions.filter((_,index)=>index % statuses.length === statusIndex).length}</b></header><div>{missions.filter((_,index)=>index % statuses.length === statusIndex).slice(0,4).map((entity,index)=><button type="button" key={`${entity.title}-${index}`} onClick={()=>onSelect(entity)}><strong>{entity.title}</strong><small>{entity.subtitle || serviceEntityLabel(entity)}</small><i>{field(entity,['Owner','Due','Date'],entity.status || '—')}</i></button>)}</div></section>)}
      </div>
      <div className={styles.capacityTower}>
        <SectionHeading icon={<UsersRound size={17}/>} eyebrow="Capacity control" title="Workload & skill pressure" detail="Unassigned missions, over-allocation and critical skill gaps become service risks before SLA impact."/>
        {['Activation leads','Implementation squad','Support operations','Incident command','Customer success'].map((team,index)=><article key={team}><div><strong>{team}</strong><small>{index % 2 === 0 ? 'Available capacity' : 'Pressure increasing'}</small></div><span><i style={{width:`${45 + index * 10}%`}}/></span><b>{45+index*10}%</b></article>)}
      </div>
      <ServiceInspector entity={selected} onOpen={onOpen}/>
    </div>
  </section>
}

function QualityScene({ communications, tickets, workOrders, selected, onSelect, onOpen }: { communications: SovereignEntity[]; tickets: SovereignEntity[]; workOrders: SovereignEntity[]; selected: SovereignEntity | null; onSelect: (entity: SovereignEntity) => void; onOpen: (entity: SovereignEntity) => void }) {
  const proofEntities = [...communications, ...tickets, ...workOrders]
  const chain = ['Mission performed','Evidence submitted','Supervisor validated','Customer informed','Customer accepted','Quality scored','Learning captured','Process improved']
  return <section className={styles.sceneShell}>
    <SceneHeader icon={<BadgeCheck/>} eyebrow="Quality, Experience & Improvement" title="Service proof and learning chain" detail="Evidence, communication, customer acceptance, root cause and preventive action close the complete service loop.">
      <Link href="/angelcare-360-operator/notes" className={styles.primaryAction}>Customer communication</Link><Link href="/angelcare-360-operator/customer-health" className={styles.secondaryAction}>Experience review</Link>
    </SceneHeader>
    <div className={styles.qualityGrid}>
      <div className={styles.proofChain}>{chain.map((label,index)=><article key={label} className={index < Math.max(2, proofEntities.length) ? styles.proofComplete : styles.proofPending}><span>{String(index+1).padStart(2,'0')}</span><div><strong>{label}</strong><small>{index < proofEntities.length ? proofEntities[index]?.title : 'Evidence or authority required'}</small></div><i>{index < proofEntities.length ? 'verified source' : 'pending'}</i></article>)}</div>
      <div className={styles.qualityEvidence}>
        <SectionHeading icon={<FileCheck2 size={17}/>} eyebrow="Evidence vault" title="Proof, acceptance & communications" detail="Every completion must be explainable, auditable and confirmed by the correct authority."/>
        {proofEntities.slice(0,8).map((entity,index)=><button type="button" key={`${entity.title}-${index}`} onClick={()=>onSelect(entity)}><span>{serviceEntityLabel(entity)}</span><strong>{entity.title}</strong><small>{entity.subtitle || field(entity,['Evidence','Resolution','Note'],'Evidence context')}</small><b>{entity.status || 'review'}</b></button>)}
        {!proofEntities.length ? <OperationalEmpty icon={<FileCheck2/>} title="No service proof loaded" detail="Complete a work order, publish a customer update or resolve a support case to create auditable service evidence." href="/angelcare-360-operator/notes" action="Open communications"/> : null}
      </div>
      <div className={styles.improvementStudio}>
        <SectionHeading icon={<RefreshCw size={17}/>} eyebrow="Continuous improvement" title="Root cause → corrective action → verified prevention" detail="Recurring service failure becomes governed process learning, not another closed ticket."/>
        {['Recurring pattern detected','Root cause owner assigned','Corrective action designed','Runbook updated','Preventive control verified'].map((label,index)=><div key={label}><span>{String(index+1).padStart(2,'0')}</span><strong>{label}</strong><b className={index < 2 ? styles.warningState : styles.goodState}>{index < 2 ? 'Action' : 'Prepared'}</b></div>)}
      </div>
      <ServiceInspector entity={selected} onOpen={onOpen}/>
    </div>
  </section>
}

function ServiceInspector({ entity, onOpen }: { entity: SovereignEntity | null; onOpen: (entity: SovereignEntity) => void }) {
  return <aside className={styles.inspector}>
    <SectionHeading icon={<SearchCheckIcon/>} eyebrow="Service context" title="Mission inspector" detail="Customer, tenant, SLA, evidence, communication and commands remain in context."/>
    {entity ? <>
      <div className={styles.inspectorIdentity}><span>{serviceEntityLabel(entity)}</span><strong>{entity.title}</strong><small>{entity.subtitle || 'Service relationship object'}</small></div>
      <div className={styles.inspectorFields}>{entity.fields.slice(0,8).map((item,index)=><div key={`${item.label}-${index}`}><span>{item.label}</span><strong>{text(item.value)}</strong></div>)}</div>
      <div className={styles.inspectorCommands}>
        <button type="button" onClick={()=>onOpen(entity)}><ScanLine size={15}/> Open governed record</button>
        <Link href={entityRoute(entity)}><ArrowRight size={15}/> Open authoritative workspace</Link>
      </div>
      <div className={styles.auditSeal}><ShieldCheck size={16}/><div><strong>Audit-ready context</strong><small>Status, evidence and source relationships stay traceable.</small></div></div>
    </> : <OperationalEmpty icon={<Network/>} title="Select a service object" detail="Choose a mission, ticket, incident, work order or customer signal to activate the contextual command panel." href="/angelcare-360-operator/service-operations" action="Open service registry"/>}
  </aside>
}

function SearchCheckIcon() { return <ScanLine size={17}/> }

function GoLiveChamber({ entity, onOpen }: { entity: SovereignEntity | null; onOpen: (entity: SovereignEntity) => void }) {
  return <aside className={styles.goLiveChamber}>
    <SectionHeading icon={<PackageCheck size={17}/>} eyebrow="Go-live decision" title="Readiness & authority chamber" detail="No launch is approved without visible incomplete gates, fallback plan, support coverage and customer confirmation."/>
    {entity ? <>
      <div className={styles.chamberIdentity}><span>{entity.status || 'state unavailable'}</span><strong>{entity.title}</strong><small>{entity.subtitle || 'Activation mission'}</small></div>
      {['Ready gates','Incomplete gates','Known risks','Customer confirmation','Fallback plan','Support coverage','Rollback conditions'].map((label,index)=><div key={label} className={styles.chamberRow}><span>{label}</span><strong>{index < 3 ? field(entity,[label,'Status','Progress'],index===0?'Evidence loaded':'Review required') : index % 2 === 0 ? 'Required before approval' : 'Operational owner to confirm'}</strong></div>)}
      <button type="button" className={styles.chamberAction} onClick={()=>onOpen(entity)}><BadgeCheck size={15}/> Open go-live authority record</button>
    </> : <OperationalEmpty icon={<PackageCheck/>} title="Select an activation mission" detail="The go-live decision chamber activates from an existing onboarding or implementation record." href="/angelcare-360-operator/onboarding" action="Open activation command"/>}
  </aside>
}

function ServiceActionRunway({ queue }: { queue: MissionSignal[] }) {
  const items = queue.slice(0,6)
  return <footer className={styles.actionRunway}>
    <div className={styles.runwayLabel}><Clock3 size={16}/><div><span>Service Action Runway</span><strong>Upcoming operational commitments</strong></div></div>
    <div className={styles.runwayItems}>{items.map((item,index)=><Link key={`${item.title}-${index}`} href={item.route}><span>{index===0?'Now':index===1?'45 min':index===2?'Today':index===3?'Tomorrow':`${index+1} days`}</span><strong>{item.title}</strong><small>{item.category}</small></Link>)}{!items.length?<Link href="/angelcare-360-operator/tasks"><span>Ready</span><strong>No urgent commitment loaded</strong><small>Open the task command to create the next service mission.</small></Link>:null}</div>
  </footer>
}

function SceneHeader({ icon, eyebrow, title, detail, children }: { icon: React.ReactNode; eyebrow: string; title: string; detail: string; children: React.ReactNode }) {
  return <header className={styles.sceneHeader}><SectionHeading icon={icon} eyebrow={eyebrow} title={title} detail={detail}/><div className={styles.sceneActions}>{children}</div></header>
}

function SectionHeading({ icon, eyebrow, title, detail }: { icon: React.ReactNode; eyebrow: string; title: string; detail: string }) {
  return <div className={styles.sectionHeading}><div className={styles.headingIcon}>{icon}</div><div><span>{eyebrow}</span><h2>{title}</h2><p>{detail}</p></div></div>
}

function Insight({ icon, label, value, detail, tone = 'normal' }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: 'normal' | 'warn' }) {
  return <article className={`${styles.insight} ${tone === 'warn' ? styles.insightWarn : ''}`}><div>{icon}</div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function OperationalEmpty({ icon, title, detail, href, action }: { icon: React.ReactNode; title: string; detail: string; href: string; action: string }) {
  return <div className={styles.operationalEmpty}><div>{icon}</div><strong>{title}</strong><p>{detail}</p><Link href={href}>{action}<ArrowRight size={14}/></Link></div>
}
