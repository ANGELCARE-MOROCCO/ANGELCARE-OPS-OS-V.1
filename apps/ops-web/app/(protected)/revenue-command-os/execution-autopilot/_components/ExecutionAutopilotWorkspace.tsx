'use client'

import { fetchRevenueOsJson } from '@/lib/revenue-command-os/client-http'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, BadgeCheck, CalendarDays, CheckCircle2, CircleDot,
  CloudCog, Database, FileClock, FileText, Gauge, GitBranch, HeartPulse, History, Layers3,
  Mail, MessageSquare, Network, Orbit, PackageCheck, PlaneTakeoff, Radar, RefreshCw, RotateCcw,
  Route, Send, ShieldCheck, Siren, Timer, TrendingUp, Undo2, WalletCards, Webhook, Workflow,
} from 'lucide-react'
import { SChip, SDataTruth, SEmpty, SIcon, SMetric, STraceLink } from '../../_components/visual-sovereignty/SovereignPrimitives'
import sovereigntyStyles from '../../_components/visual-sovereignty/Sovereignty.module.css'
import { ExecutionHero } from '../../_components/hero-sovereignty/heroes'

type Health = { code: string; status: string; configured: boolean; enabled: boolean; message: string; executionMode: string }
type Action = { id: string; adapterCode: string; actionType: string; status: string; priority: number; target: { module: string; entityType: string }; controls: { externalAction: boolean; approvalRequired: boolean }; approval: { required: boolean }; lastError?: string; createdAt: string }
type Package = { id: string; compilationRunId: string; strategyId: string; strategyVersion: string; status: string; createdAt: string }
type Dashboard = { packages: Package[]; actions: Action[]; adapters: Health[]; counts: Record<string, number>; externalActionsExecuted: number; executionMode: string }

const tabs = ['Vue d’exécution', 'Packages compilés', 'Propagation', 'Adaptateurs', 'Campagnes', 'Waves de comptes', 'Affectations', 'Messages & emails', 'WhatsApp', 'Réunions & calendrier', 'Propositions', 'Opportunités', 'Paiements', 'Livraison Academy', 'Renouvellements', 'Tâches internes', 'Approbations', 'File d’exécution', 'Retries', 'Dead letters', 'Rollback & compensation', 'Webhooks', 'Santé des adaptateurs', 'Audit', 'Validation finale']

type Layout = 'control' | 'terminal' | 'map' | 'engine' | 'campaign' | 'radar' | 'routing' | 'studio' | 'human' | 'calendar' | 'atelier' | 'momentum' | 'flow' | 'bridge' | 'horizon' | 'choreo' | 'clearance' | 'conveyor' | 'orbit' | 'vault' | 'balance' | 'observatory' | 'diagnostic' | 'recorder' | 'certificate'
const visual: Record<string, { concept: string; description: string; tone: string; layout: Layout; icon: any }> = {
  'Vue d’exécution': { concept: 'Air Traffic Revenue Control', description: 'Chaque package devient un vol opérationnel contrôlé de la compilation au résultat.', tone: 'from-slate-950 to-blue-950', layout: 'control', icon: PlaneTakeoff },
  'Packages compilés': { concept: 'Departure Terminal', description: 'Les packages attendent autorité, readiness et fenêtre de départ.', tone: 'from-blue-950 to-slate-950', layout: 'terminal', icon: PackageCheck },
  'Propagation': { concept: 'System Propagation Map', description: 'Les actions se diffusent uniquement vers les modules et adaptateurs autorisés.', tone: 'from-cyan-950 to-blue-950', layout: 'map', icon: Network },
  'Adaptateurs': { concept: 'Integration Engine Room', description: 'Chaque adapter est un moteur isolé avec configuration, santé et mode.', tone: 'from-slate-950 to-cyan-950', layout: 'engine', icon: CloudCog },
  'Campagnes': { concept: 'Campaign Operations Centre', description: 'Les actions de campagne se regroupent par progression, risque et résultat.', tone: 'from-violet-950 to-blue-950', layout: 'campaign', icon: Send },
  'Waves de comptes': { concept: 'Account Wave Radar', description: 'Les groupes de comptes évoluent comme des formations commerciales suivies au radar.', tone: 'from-blue-950 to-cyan-950', layout: 'radar', icon: Radar },
  'Affectations': { concept: 'Responsibility Routing Board', description: 'Le travail est routé vers les rôles et équipes avec ownership explicite.', tone: 'from-emerald-950 to-slate-950', layout: 'routing', icon: Route },
  'Messages & emails': { concept: 'Governed Communications Studio', description: 'Préparation, approbation, remise et résultat restent distincts.', tone: 'from-blue-950 to-violet-950', layout: 'studio', icon: Mail },
  'WhatsApp': { concept: 'Human-Controlled Conversation Bridge', description: 'Contexte et préparation sans auto-envoi ni simulation de livraison.', tone: 'from-emerald-950 to-slate-950', layout: 'human', icon: MessageSquare },
  'Réunions & calendrier': { concept: 'Commercial Calendar Theatre', description: 'Les rendez-vous se lisent dans la progression commerciale, pas comme des blocs isolés.', tone: 'from-cyan-950 to-slate-950', layout: 'calendar', icon: CalendarDays },
  'Propositions': { concept: 'Proposal Production Atelier', description: 'Les propositions passent préparation, autorité et livraison contrôlée.', tone: 'from-violet-950 to-slate-950', layout: 'atelier', icon: FileText },
  'Opportunités': { concept: 'Opportunity Momentum Field', description: 'Momentum, valeur, risque et prochaine action structurent le mouvement.', tone: 'from-blue-950 to-emerald-950', layout: 'momentum', icon: TrendingUp },
  'Paiements': { concept: 'Revenue Collection Flow', description: 'Promesses, conditions et retards modifient visiblement la trajectoire d’exécution.', tone: 'from-amber-950 to-slate-950', layout: 'flow', icon: WalletCards },
  'Livraison Academy': { concept: 'Training Delivery Bridge', description: 'Les engagements commerciaux deviennent obligations de livraison planifiées.', tone: 'from-violet-950 to-blue-950', layout: 'bridge', icon: Layers3 },
  'Renouvellements': { concept: 'Renewal Horizon', description: 'Les comptes approchent leur fenêtre de renouvellement sur un horizon contrôlé.', tone: 'from-emerald-950 to-blue-950', layout: 'horizon', icon: History },
  'Tâches internes': { concept: 'Internal Operations Choreography', description: 'Les responsabilités internes s’alignent en séquences dépendantes.', tone: 'from-slate-950 to-violet-950', layout: 'choreo', icon: Workflow },
  'Approbations': { concept: 'Operational Clearance Desk', description: 'Chaque action sensible attend une autorité claire avant progression.', tone: 'from-amber-950 to-violet-950', layout: 'clearance', icon: BadgeCheck },
  'File d’exécution': { concept: 'Queue Conveyor', description: 'Les actions traversent une chaîne de traitement visible et mesurée.', tone: 'from-blue-950 to-slate-950', layout: 'conveyor', icon: Activity },
  'Retries': { concept: 'Retry Orbit', description: 'Les échecs reviennent dans des boucles contrôlées, jamais dans un restart aveugle.', tone: 'from-amber-950 to-slate-950', layout: 'orbit', icon: RefreshCw },
  'Dead letters': { concept: 'Failure Containment Vault', description: 'Les échecs définitifs sont isolés, inspectés et attribués.', tone: 'from-rose-950 to-slate-950', layout: 'vault', icon: Siren },
  'Rollback & compensation': { concept: 'Compensation Balance Sheet', description: 'Action originale, impact et compensation sont comparés avant retour.', tone: 'from-amber-950 to-rose-950', layout: 'balance', icon: Undo2 },
  'Webhooks': { concept: 'Event Transmission Observatory', description: 'Signatures, transmission, réponse et réconciliation deviennent visibles.', tone: 'from-cyan-950 to-violet-950', layout: 'observatory', icon: Webhook },
  'Santé des adaptateurs': { concept: 'Mechanical Health Diagnostics', description: 'Chaque moteur est examiné par configuration, disponibilité et posture.', tone: 'from-emerald-950 to-slate-950', layout: 'diagnostic', icon: HeartPulse },
  'Audit': { concept: 'End-to-End Flight Recorder', description: 'Le trajet package → action → adapter → résultat reste traçable.', tone: 'from-slate-950 to-blue-950', layout: 'recorder', icon: FileClock },
  'Validation finale': { concept: 'Operational Clearance Certificate', description: 'Readiness, coverage et Shadow guarantees convergent vers une certification.', tone: 'from-emerald-950 to-slate-950', layout: 'certificate', icon: ShieldCheck },
}

export default function ExecutionAutopilotWorkspace() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [tab, setTab] = useState(tabs[0])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    setBusy(true); setError('')
    try {
      const payload = await fetchRevenueOsJson<any>('/api/revenue-command-os/execution-autopilot', { cache: 'no-store' }, {
        timeoutMs: 25000,
        fallbackMessage: 'Le pilotage d’exécution n’a pas pu être chargé.',
      })
      setData(payload.data ?? null)
    } catch (caught) { setError(caught instanceof Error ? caught.message : String(caught)) } finally { setBusy(false) }
  }
  useEffect(() => { void load() }, [])
  const actions = useMemo(() => filter(tab, data?.actions || []), [tab, data])
  const meta = visual[tab] || visual['Vue d’exécution']

  return (
    <div className="mx-auto max-w-[1760px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <ExecutionHero
        state={error ? 'DEGRADED' : !data ? 'INITIALIZING' : data.actions.length === 0 && data.packages.length === 0 ? 'EMPTY' : 'SHADOW'}
        posture={data?.executionMode || 'Initialisation contrôlée'}
        authority={data && data.externalActionsExecuted > 0 ? 'Effets externes détectés' : 'Effets externes verrouillés'}
        summary={error
          ? 'La source d’exécution est dégradée. Les volumes restent non calculés et aucun état sain n’est déduit.'
          : data
            ? `${data.packages.length} package(s) et ${data.actions.length} action(s) sont orchestrés par ${data.adapters.length} adaptateur(s), sous contrôle d’approbation et de sécurité.`
            : 'Le moteur prépare les packages, actions, adaptateurs et compteurs sans simuler de résultat.'}
        metrics={[
          { label: 'Packages actifs', value: data ? data.packages.length : '—', note: data ? 'Packages visibles' : 'Non calculé', tone: 'blue' },
          { label: 'Actions gouvernées', value: data ? data.actions.length : '—', note: data ? 'File actuelle' : 'Non calculé', tone: 'cyan' },
          { label: 'Adaptateurs sains', value: data ? `${data.adapters.filter((adapter) => adapter.status === 'healthy').length}/${data.adapters.length}` : '—', note: data ? 'Santé déclarée' : 'Source en attente', tone: 'emerald' },
          { label: 'Effets externes', value: data ? data.externalActionsExecuted : '—', note: data ? 'Compteur réel' : 'Indisponible', tone: data && data.externalActionsExecuted > 0 ? 'rose' : 'slate' },
        ]}
        actions={[{ label: busy ? 'Actualisation…' : 'Actualiser le contrôle', onClick: () => void load(), disabled: busy, reason: busy ? 'Actualisation déjà en cours.' : undefined, kind: 'primary', icon: RefreshCw }]}
        freshness={data?.actions.length ? new Date(Math.max(...data.actions.map((action) => new Date(action.createdAt).getTime()))).toLocaleString('fr-FR') : undefined}
        warning={error || (data && data.externalActionsExecuted > 0 ? 'Le compteur signale des effets externes exécutés. Vérification d’autorité requise.' : undefined)}
      />

      <SDataTruth mode={error ? 'degraded' : data ? 'shadow' : 'initializing'} warnings={error ? [error] : []} />

      <div className="grid gap-6 xl:grid-cols-[285px_minmax(0,1fr)]">
        <aside className="h-fit overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.07)] xl:sticky xl:top-5"><div className="bg-slate-950 p-5 text-white"><SChip tone="blue">Execution domains</SChip><p className="mt-3 text-sm font-black">Twenty-five operational environments.</p></div><nav className="max-h-[780px] space-y-1 overflow-y-auto p-3">{tabs.map((item, index) => <button key={item} onClick={() => setTab(item)} className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[10px] font-black transition ${tab === item ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl text-[8px] ${tab === item ? 'bg-blue-400 text-slate-950' : 'bg-slate-100 text-slate-400'}`}>{String(index + 1).padStart(2, '0')}</span>{item}</button>)}</nav></aside>
        <main className="min-w-0">{!data ? <SEmpty title={error ? 'Pilotage momentanément indisponible' : 'Moteur d’exécution en initialisation'} description={error ? 'La source n’a pas pu être certifiée. Les compteurs restent non calculés; aucune action externe n’a été exécutée.' : 'Les packages, actions, adaptateurs et compteurs sont chargés sans simuler de données.'} mode={error ? 'unavailable' : 'empty'} icon={Activity} /> : <DomainView tab={tab} layout={meta.layout} data={data} rows={actions} />}</main>
      </div>
    </div>
  )
}

function DomainView({ tab, layout, data, rows }: { tab: string; layout: Layout; data: Dashboard; rows: Action[] }) {
  if (layout === 'control') return <ControlTower data={data} />
  if (layout === 'terminal') return <DepartureTerminal rows={data.packages} />
  if (layout === 'engine' || layout === 'diagnostic') return <EngineRoom rows={data.adapters} diagnostic={layout === 'diagnostic'} />
  if (layout === 'radar') return <RadarView title={tab} rows={rows} />
  if (layout === 'calendar' || layout === 'horizon') return <TimelineView title={tab} rows={rows} horizon={layout === 'horizon'} />
  if (layout === 'conveyor' || layout === 'orbit') return <ConveyorView title={tab} rows={rows} orbit={layout === 'orbit'} />
  if (layout === 'vault') return <FailureVault rows={rows} />
  if (layout === 'balance') return <CompensationBalance rows={rows} />
  if (layout === 'certificate') return <ExecutionCertificate data={data} />
  if (layout === 'map' || layout === 'observatory') return <PropagationMap title={tab} rows={rows} webhook={layout === 'observatory'} />
  if (layout === 'clearance') return <ClearanceDesk rows={rows} />
  if (layout === 'recorder') return <FlightRecorder rows={rows} />
  return <SovereignActionDomain title={tab} layout={layout} rows={rows} />
}

function ControlTower({ data }: { data: Dashboard }) {
  const stages = ['Compiled package', 'Governed action', 'Transactional outbox', 'Authorized adapter', 'Result & audit']
  return <div className="space-y-6"><section className="relative min-h-[620px] overflow-hidden rounded-[46px] border border-blue-200 bg-slate-950 p-7 text-white shadow-[0_32px_100px_rgba(15,23,42,.28)]"><div className={`absolute inset-0 opacity-20 ${sovereigntyStyles.gridFine}`} /><div className="relative flex items-start justify-between"><div><SChip tone="blue"><PlaneTakeoff size={11} /> Live operations field</SChip><h2 className="mt-4 text-4xl font-black tracking-[-.055em]">Packages cross controlled airspace toward verified outcomes.</h2></div><SChip tone={(data.externalActionsExecuted === 0) ? 'emerald' : 'rose'}>{data.externalActionsExecuted} external</SChip></div><div className="relative mt-12 grid gap-5 lg:grid-cols-5">{stages.map((stage, index) => <article key={stage} className="relative rounded-[30px] border border-white/10 bg-white/7 p-5 backdrop-blur"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500 text-xs font-black">{index + 1}</span><h3 className="mt-5 text-sm font-black">{stage}</h3><p className="mt-2 text-[9px] leading-4 text-slate-300">{index === 0 ? `${data.packages.length} package(s) visible` : index === 1 ? `${data.actions.length} action(s) governed` : index === 2 ? `${data.counts.queued || 0} waiting` : index === 3 ? `${data.adapters.filter((adapter) => adapter.status === 'healthy').length}/${data.adapters.length} healthy` : `${data.counts.succeeded || 0} succeeded`}</p>{index < stages.length - 1 ? <ArrowRight size={20} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-blue-300 lg:block" /> : null}</article>)}</div><div className="relative mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Object.entries(data.counts).slice(0, 10).map(([key, value]) => <div key={key} className="rounded-[22px] border border-white/10 bg-white/5 p-4"><p className="text-2xl font-black text-blue-300">{value}</p><p className="mt-1 text-[8px] font-black uppercase text-slate-400">{key}</p></div>)}</div></section><div className="grid gap-5 xl:grid-cols-[1fr_360px]"><ActionLedger title="Latest governed actions" rows={data.actions.slice(0, 16)} /><section className="rounded-[38px] border border-emerald-200 bg-emerald-50 p-6"><SIcon icon={ShieldCheck} tone="emerald" /><h3 className="mt-4 text-xl font-black">Execution safety posture</h3><div className="mt-5 space-y-3">{['Internal actions permitted by adapter', 'External actions require explicit authority', 'Idempotency and trace preserved', 'Rollback and compensation visible'].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-xs font-bold"><CheckCircle2 size={15} className="text-emerald-600" />{item}</div>)}</div></section></div></div>
}

function DepartureTerminal({ rows }: { rows: Package[] }) { return <div className="space-y-6"><div><SChip tone="blue"><PlaneTakeoff size={11} /> Departure Terminal</SChip><h2 className="mt-4 text-4xl font-black tracking-[-.055em]">Packages wait in controlled bays before operational departure.</h2></div><section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{rows.map((item, index) => <article key={item.id} className="relative overflow-hidden rounded-[38px] border border-blue-200 bg-white p-6 shadow-[0_24px_70px_rgba(30,64,175,.07)]"><div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-blue-50" /><div className="relative flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-[18px] bg-slate-950 text-sm font-black text-white">G{String(index + 1).padStart(2, '0')}</span><Status value={item.status} /></div><p className="relative mt-6 text-[9px] font-black uppercase tracking-[.15em] text-blue-700">Strategy {item.strategyVersion}</p><h3 className="relative mt-2 font-mono text-xs font-black">{item.compilationRunId}</h3><p className="relative mt-4 text-[10px] text-slate-500">Created {new Date(item.createdAt).toLocaleString('fr-FR')}</p><div className="relative mt-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[9px] font-bold text-slate-600"><ShieldCheck size={14} /> Departure only after governed activation.</div></article>)}</section>{!rows.length ? <SEmpty title="Terminal vide" description="Aucun package compilé n’est actuellement disponible. Aucun départ n’est simulé." icon={PackageCheck} /> : null}</div> }

function EngineRoom({ rows, diagnostic }: { rows: Health[]; diagnostic: boolean }) { return <div className="space-y-6"><div><SChip tone="emerald"><CloudCog size={11} /> {diagnostic ? 'Mechanical Health Diagnostics' : 'Integration Engine Room'}</SChip><h2 className="mt-4 text-4xl font-black tracking-[-.055em]">{diagnostic ? 'Every integration engine is clinically inspected.' : 'Every adapter is an isolated, governed engine.'}</h2></div><section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{rows.map((adapter, index) => <article key={adapter.code} className={`relative overflow-hidden rounded-[38px] border p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)] ${adapter.status === 'healthy' ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white' : 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'}`}><div className="flex items-start justify-between"><SIcon icon={diagnostic ? HeartPulse : CloudCog} tone={adapter.status === 'healthy' ? 'emerald' : 'amber'} /><span className="text-4xl font-black text-slate-100">{String(index + 1).padStart(2, '0')}</span></div><h3 className="mt-6 font-mono text-sm font-black">{adapter.code}</h3><p className="mt-2 min-h-12 text-xs leading-5 text-slate-600">{adapter.message}</p><div className="mt-5 grid grid-cols-2 gap-2"><TinyFact label="Status" value={adapter.status} /><TinyFact label="Mode" value={adapter.executionMode} /><TinyFact label="Configured" value={String(adapter.configured)} /><TinyFact label="Enabled" value={String(adapter.enabled)} /></div></article>)}</section></div> }

function RadarView({ title, rows }: { title: string; rows: Action[] }) { return <div className="space-y-6"><div><SChip tone="cyan"><Radar size={11} /> {title}</SChip><h2 className="mt-4 text-4xl font-black tracking-[-.055em]">Account formations are tracked by momentum and operational state.</h2></div><section className="relative min-h-[720px] overflow-hidden rounded-[46px] bg-slate-950 p-7 text-white shadow-[0_34px_105px_rgba(15,23,42,.3)]"><div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/15" /><div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] max-w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/15" /><div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/15" /><div className="absolute left-1/2 top-0 h-full w-px bg-cyan-400/10" /><div className="absolute left-0 top-1/2 h-px w-full bg-cyan-400/10" />{rows.slice(0, 18).map((action, index) => { const angle = (index / Math.max(1, Math.min(18, rows.length))) * Math.PI * 2; const radius = 110 + (index % 3) * 80; return <article key={action.id} className="absolute w-44 rounded-[22px] border border-cyan-300/25 bg-white/8 p-3 backdrop-blur" style={{ left: `calc(50% + ${Math.cos(angle) * radius}px - 88px)`, top: `calc(50% + ${Math.sin(angle) * radius}px - 44px)` }}><p className="truncate text-[9px] font-black">{action.actionType}</p><p className="mt-1 text-[8px] text-cyan-200">{action.adapterCode}</p><Status value={action.status} compact /></article> })}</section>{!rows.length ? <SEmpty title="Radar sans formation" description="Aucune wave opérationnelle n’est présente dans ce périmètre." icon={Radar} /> : null}</div> }

function TimelineView({ title, rows, horizon }: { title: string; rows: Action[]; horizon: boolean }) { return <div className="space-y-6"><div><SChip tone={horizon ? 'emerald' : 'cyan'}>{horizon ? <History size={11} /> : <CalendarDays size={11} />} {title}</SChip><h2 className="mt-4 text-4xl font-black tracking-[-.055em]">{horizon ? 'Accounts approach the renewal horizon with visible readiness.' : 'Commercial moments are placed inside revenue progression.'}</h2></div><section className={`relative overflow-hidden rounded-[46px] border p-7 shadow-[0_30px_90px_rgba(15,23,42,.07)] ${horizon ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-blue-50' : 'border-cyan-200 bg-white'}`}><div className="absolute bottom-16 left-8 right-8 h-1 rounded-full bg-slate-200" /><div className="grid min-h-[620px] grid-cols-2 gap-5 pt-8 md:grid-cols-4 xl:grid-cols-6">{rows.slice(0, 18).map((action, index) => <article key={action.id} className={`relative self-end rounded-[28px] border bg-white p-4 shadow-[0_16px_45px_rgba(15,23,42,.07)] ${index % 3 === 0 ? 'mb-36 border-blue-200' : index % 3 === 1 ? 'mb-20 border-cyan-200' : 'mb-4 border-emerald-200'}`}><p className="text-[9px] font-black uppercase text-slate-400">{new Date(action.createdAt).toLocaleDateString('fr-FR')}</p><h3 className="mt-3 text-xs font-black">{action.actionType}</h3><p className="mt-2 text-[9px] text-slate-500">{action.adapterCode} · {action.target.entityType}</p><div className="mt-3"><Status value={action.status} compact /></div><span className="absolute -bottom-[74px] left-1/2 h-16 w-px -translate-x-1/2 bg-slate-300" /><span className="absolute -bottom-[78px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-blue-500 ring-4 ring-white" /></article>)}</div></section>{!rows.length ? <SEmpty title="Aucun événement sur l’horizon" description="Le domaine ne contient actuellement aucune action datée." icon={CalendarDays} /> : null}</div> }

function ConveyorView({ title, rows, orbit }: { title: string; rows: Action[]; orbit: boolean }) { return <div className="space-y-6"><div><SChip tone="amber">{orbit ? <Orbit size={11} /> : <Workflow size={11} />} {title}</SChip><h2 className="mt-4 text-4xl font-black tracking-[-.055em]">{orbit ? 'Failures re-enter only through bounded retry orbits.' : 'Actions progress through a measured execution conveyor.'}</h2></div>{orbit ? <section className="relative min-h-[700px] overflow-hidden rounded-[46px] bg-slate-950 p-7 text-white"><div className="absolute left-1/2 top-1/2 h-[570px] w-[570px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-400/20" /><div className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-400/20" /><RefreshCw size={70} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-300" />{rows.slice(0, 14).map((action, index) => { const angle = (index / Math.max(1, rows.length)) * Math.PI * 2; const radius = index % 2 ? 275 : 185; return <article key={action.id} className="absolute w-48 rounded-[22px] border border-amber-300/20 bg-white/8 p-3 backdrop-blur" style={{ left: `calc(50% + ${Math.cos(angle) * radius}px - 96px)`, top: `calc(50% + ${Math.sin(angle) * radius}px - 40px)` }}><p className="truncate text-[9px] font-black">{action.actionType}</p><p className="mt-1 text-[8px] text-amber-200">{action.lastError || action.status}</p></article> })}</section> : <section className="overflow-hidden rounded-[46px] border border-blue-200 bg-white p-7 shadow-[0_30px_90px_rgba(30,64,175,.08)]"><div className="flex min-h-[620px] gap-5 overflow-x-auto pb-5">{['queued', 'leased', 'executing', 'succeeded', 'failed'].map((state, laneIndex) => <div key={state} className="w-72 shrink-0 rounded-[32px] bg-slate-50 p-4"><div className="flex items-center justify-between"><p className="text-xs font-black uppercase text-slate-500">{state}</p><SChip tone={state === 'succeeded' ? 'emerald' : state === 'failed' ? 'rose' : 'blue'}>{rows.filter((row) => row.status === state).length}</SChip></div><div className="mt-5 space-y-3">{rows.filter((row) => row.status === state).map((action) => <ActionCard key={action.id} action={action} />)}</div>{laneIndex < 4 ? <ArrowRight size={20} className="absolute hidden" /> : null}</div>)}</div></section>}{!rows.length ? <SEmpty title="Aucune action dans ce circuit" description="Le zéro affiché est un état réel du domaine, pas une simulation." icon={Workflow} /> : null}</div> }

function FailureVault({ rows }: { rows: Action[] }) { return <div className="space-y-6"><div><SChip tone="rose"><Siren size={11} /> Failure Containment Vault</SChip><h2 className="mt-4 text-4xl font-black tracking-[-.055em]">Permanent failures are isolated from operational flow.</h2></div><section className="grid gap-5 rounded-[46px] border border-rose-200 bg-slate-950 p-7 text-white shadow-[0_34px_105px_rgba(15,23,42,.3)] md:grid-cols-2 xl:grid-cols-3">{rows.map((action, index) => <article key={action.id} className="relative overflow-hidden rounded-[30px] border border-rose-300/20 bg-rose-500/8 p-5"><span className="absolute right-4 top-3 text-5xl font-black text-white/5">{String(index + 1).padStart(2, '0')}</span><SIcon icon={Siren} tone="rose" /><p className="mt-5 text-xs font-black">{action.actionType}</p><p className="mt-2 text-[9px] text-rose-200">{action.adapterCode} · {action.target.module}</p><p className="mt-4 min-h-12 text-[10px] leading-5 text-slate-300">{action.lastError || 'Failure reason not exposed by the current record.'}</p><div className="mt-4"><STraceLink traceId={action.id} compact /></div></article>)}</section>{!rows.length ? <SEmpty title="Vault vide" description="Aucune dead letter n’est actuellement contenue." icon={Siren} /> : null}</div> }

function CompensationBalance({ rows }: { rows: Action[] }) { return <div className="space-y-6"><div><SChip tone="amber"><RotateCcw size={11} /> Compensation Balance Sheet</SChip><h2 className="mt-4 text-4xl font-black tracking-[-.055em]">Original effect and compensating action are reconciled side by side.</h2></div><section className="rounded-[46px] border border-amber-200 bg-white p-7 shadow-[0_30px_90px_rgba(146,64,14,.08)]"><div className="grid gap-5 xl:grid-cols-[1fr_90px_1fr]">{rows.length ? rows.map((action, index) => <div key={action.id} className="contents"><article className="rounded-[30px] border border-rose-200 bg-rose-50 p-5"><p className="text-[9px] font-black uppercase text-rose-700">Original effect {index + 1}</p><h3 className="mt-3 text-sm font-black">{action.actionType}</h3><p className="mt-2 text-[10px] text-rose-800">{action.target.module} · {action.status}</p></article><div className="grid place-items-center"><Undo2 size={26} className="text-amber-600" /></div><article className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-5"><p className="text-[9px] font-black uppercase text-emerald-700">Compensation contract</p><h3 className="mt-3 text-sm font-black">Controlled reversal</h3><p className="mt-2 text-[10px] text-emerald-800">Governed by the recorded rollback/compensation action and audit trace.</p></article></div>) : <div className="xl:col-span-3"><SEmpty title="Aucune compensation ouverte" description="Le domaine ne contient actuellement aucune action de rollback ou compensation." icon={Undo2} /></div>}</div></section></div> }

function PropagationMap({ title, rows, webhook }: { title: string; rows: Action[]; webhook: boolean }) { return <div className="space-y-6"><div><SChip tone="cyan">{webhook ? <Webhook size={11} /> : <Network size={11} />} {title}</SChip><h2 className="mt-4 text-4xl font-black tracking-[-.055em]">{webhook ? 'Events are transmitted, signed and reconciled.' : 'Actions spread only through authorized integration paths.'}</h2></div><section className="relative min-h-[720px] overflow-hidden rounded-[46px] bg-gradient-to-br from-cyan-950 to-slate-950 p-7 text-white"><div className={`absolute inset-0 opacity-20 ${sovereigntyStyles.gridFine}`} /><div className="relative grid place-items-center"><div className="grid h-48 w-48 place-items-center rounded-full bg-cyan-500 shadow-[0_0_80px_rgba(6,182,212,.3)]"><div className="text-center"><Network size={44} className="mx-auto" /><p className="mt-2 text-[9px] font-black uppercase">Outbox core</p></div></div>{rows.slice(0, 16).map((action, index) => { const angle = (index / Math.max(1, rows.length)) * Math.PI * 2 - Math.PI / 2; const radius = 250 + (index % 2) * 65; return <article key={action.id} className="absolute w-48 rounded-[24px] border border-cyan-300/20 bg-white/8 p-4 backdrop-blur" style={{ left: `calc(50% + ${Math.cos(angle) * radius}px - 96px)`, top: `calc(50% + ${Math.sin(angle) * radius}px + 170px)` }}><p className="truncate text-[9px] font-black">{action.adapterCode}</p><p className="mt-1 truncate text-[8px] text-cyan-200">{action.actionType}</p><Status value={action.status} compact /></article> })}</div></section>{!rows.length ? <SEmpty title="Aucune transmission" description="Aucune action n’est présente dans ce périmètre." icon={webhook ? Webhook : Network} /> : null}</div> }

function ClearanceDesk({ rows }: { rows: Action[] }) { return <div className="space-y-6"><div><SChip tone="amber"><BadgeCheck size={11} /> Operational Clearance Desk</SChip><h2 className="mt-4 text-4xl font-black tracking-[-.055em]">Sensitive actions wait for human authority before movement.</h2></div><section className="grid gap-6 xl:grid-cols-[300px_1fr]"> <aside className="rounded-[38px] bg-slate-950 p-6 text-white"><SIcon icon={BadgeCheck} tone="amber" /><p className="mt-5 text-4xl font-black">{rows.length}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">Clearance requests</p><p className="mt-5 text-[10px] leading-5 text-slate-300">L’autorité, la portée et la raison doivent rester explicites dans le backend; cette page ne fabrique aucune décision.</p></aside><div className="space-y-4">{rows.map((action) => <article key={action.id} className="grid gap-4 rounded-[32px] border border-amber-200 bg-white p-5 shadow-[0_18px_50px_rgba(146,64,14,.06)] md:grid-cols-[auto_1fr_auto] md:items-center"><SIcon icon={BadgeCheck} tone="amber" /><div><h3 className="text-sm font-black">{action.actionType}</h3><p className="mt-1 text-[10px] text-slate-500">{action.adapterCode} · {action.target.module} · priority {action.priority}</p></div><Status value={action.status} /></article>)}</div></section>{!rows.length ? <SEmpty title="Clearance desk vide" description="Aucune action n’attend actuellement d’approbation." icon={BadgeCheck} /> : null}</div> }

function FlightRecorder({ rows }: { rows: Action[] }) { return <div className="space-y-6"><div><SChip tone="blue"><FileClock size={11} /> End-to-End Flight Recorder</SChip><h2 className="mt-4 text-4xl font-black tracking-[-.055em]">Every governed action remains in chronological evidence.</h2></div><section className="relative rounded-[46px] border border-blue-200 bg-white p-7 shadow-[0_30px_90px_rgba(30,64,175,.08)]"><div className="absolute bottom-8 left-16 top-8 w-px bg-blue-200" /><div className="space-y-5">{rows.slice(0, 120).map((action, index) => <article key={action.id} className="relative pl-16"><span className="absolute left-[-1px] top-5 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-blue-600 text-[8px] font-black text-white">{index + 1}</span><div className="grid gap-4 rounded-[28px] border border-slate-200 p-5 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-black">{action.actionType}</p><p className="mt-1 text-[9px] text-slate-500">{action.adapterCode} · {action.target.module} · {new Date(action.createdAt).toLocaleString('fr-FR')}</p><div className="mt-3"><STraceLink traceId={action.id} compact /></div></div><Status value={action.status} /></div></article>)}</div></section></div> }

function ExecutionCertificate({ data }: { data: Dashboard }) { const healthy = data.adapters.filter((adapter) => adapter.status === 'healthy').length; const score = Math.round(((data.externalActionsExecuted === 0 ? 1 : 0) + (data.adapters.length ? healthy / data.adapters.length : 1) + ((data.counts.dead_letter || 0) === 0 ? 1 : 0) + 1) / 4 * 100); return <div className="space-y-6"><div><SChip tone="emerald"><ShieldCheck size={11} /> Operational Clearance Certificate</SChip><h2 className="mt-4 text-4xl font-black tracking-[-.055em]">Readiness, adapter health and safety converge into one clearance proof.</h2></div><section className="grid gap-7 rounded-[46px] border border-emerald-200 bg-white p-7 shadow-[0_32px_100px_rgba(5,150,105,.09)] xl:grid-cols-[430px_1fr]"><div className="grid min-h-[560px] place-items-center rounded-[38px] bg-gradient-to-br from-emerald-600 to-slate-950 text-white"><div className="text-center"><ShieldCheck size={70} className="mx-auto text-emerald-200" /><p className="mt-6 text-7xl font-black tracking-[-.08em]">{score}%</p><p className="mt-2 text-[10px] font-black uppercase tracking-[.2em] text-emerald-100">Operational clearance</p></div></div><div className="grid content-start gap-4 sm:grid-cols-2"><SMetric label="Healthy adapters" value={`${healthy}/${data.adapters.length}`} tone={healthy === data.adapters.length ? 'emerald' : 'amber'} icon={HeartPulse} /><SMetric label="External actions" value={data.externalActionsExecuted} tone={data.externalActionsExecuted === 0 ? 'emerald' : 'rose'} icon={ShieldCheck} /><SMetric label="Dead letters" value={data.counts.dead_letter || 0} tone={(data.counts.dead_letter || 0) === 0 ? 'emerald' : 'rose'} icon={Siren} /><SMetric label="Approval queue" value={data.counts.approval || 0} tone="amber" icon={BadgeCheck} /><div className="sm:col-span-2 rounded-[30px] border border-slate-200 p-5"><h3 className="text-sm font-black">Certificate statement</h3><p className="mt-3 text-xs leading-6 text-slate-600">This visual certificate reports the current dashboard state only. It does not activate workers, adapters or external actions, and it does not replace backend acceptance evidence.</p></div></div></section></div> }

function SovereignActionDomain({ title, layout, rows }: { title: string; layout: Layout; rows: Action[] }) {
  const iconMap: Partial<Record<Layout, any>> = {
    campaign: Send,
    routing: Route,
    studio: Mail,
    human: MessageSquare,
    atelier: FileText,
    momentum: TrendingUp,
    flow: WalletCards,
    bridge: Layers3,
    choreo: Workflow,
  }
  const Icon = iconMap[layout] || Activity
  const tileMode = layout === 'campaign' || layout === 'atelier'
  const borderClass = layout === 'human'
    ? 'border-emerald-200'
    : layout === 'flow'
      ? 'border-amber-200'
      : layout === 'atelier'
        ? 'border-violet-200'
        : 'border-blue-200'

  return (
    <div className="space-y-6">
      <div>
        <SChip tone="blue"><Icon size={11} /> {title}</SChip>
        <h2 className="mt-4 text-4xl font-black tracking-[-.055em]">Purpose-built operational domain.</h2>
      </div>
      <section className={`rounded-[46px] border bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,.07)] ${borderClass}`}>
        <div className={tileMode ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
          {rows.map((action, index) => tileMode ? (
            <article key={action.id} className="rounded-[32px] border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <SIcon icon={Icon} tone={layout === 'atelier' ? 'violet' : 'blue'} />
                <span className="text-4xl font-black text-slate-100">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-5 text-sm font-black">{action.actionType}</h3>
              <p className="mt-2 text-[10px] text-slate-500">{action.adapterCode} · {action.target.module}</p>
              <div className="mt-4"><Status value={action.status} /></div>
            </article>
          ) : (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>
        {!rows.length ? (
          <SEmpty
            title={`Aucune donnée — ${title}`}
            description="Ce zéro est un état réel et explicite du domaine, sans donnée inventée."
            icon={Icon}
          />
        ) : null}
      </section>
    </div>
  )
}

function ActionLedger({ title, rows }: { title: string; rows: Action[] }) { return <section className="rounded-[38px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.07)]"><h3 className="text-sm font-black">{title}</h3><div className="mt-5 space-y-3">{rows.map((action) => <ActionCard key={action.id} action={action} />)}</div></section> }
function ActionCard({ action }: { action: Action }) { return <article className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-black">{action.actionType}</p><p className="mt-1 text-[9px] text-slate-500">{action.adapterCode} · {action.target.module} · priority {action.priority}</p>{action.lastError ? <p className="mt-2 text-[9px] font-bold text-rose-700">{action.lastError}</p> : null}</div><Status value={action.status} /></article> }
function DarkFact({ label, value }: { label: string; value: string }) { return <div className="rounded-[22px] border border-white/10 bg-white/7 p-4 text-center backdrop-blur"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p></div> }
function TinyFact({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white/80 p-3"><p className="text-[8px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 truncate text-[10px] font-black text-slate-700">{value}</p></div> }
function Status({ value, compact = false }: { value: string; compact?: boolean }) { const tone = value === 'succeeded' || value === 'approved' || value === 'healthy' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : value === 'awaiting_approval' || value === 'retry_scheduled' ? 'bg-amber-50 text-amber-800 ring-amber-200' : value === 'dead_letter' || value === 'failed' ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-blue-50 text-blue-700 ring-blue-200'; return <span className={`inline-flex w-fit items-center gap-1 rounded-full font-black ring-1 ${tone} ${compact ? 'mt-2 px-2 py-0.5 text-[8px]' : 'px-3 py-1 text-[10px]'}`}><CircleDot size={compact ? 9 : 11} />{value}</span> }

function filter(tab: string, actions: Action[]) {
  const contains = (action: Action, ...tokens: string[]) => tokens.some((token) => `${action.adapterCode} ${action.actionType} ${action.target.module} ${action.target.entityType}`.toLowerCase().includes(token))
  const tests: Record<string, (action: Action) => boolean> = {
    Propagation: (action) => contains(action, 'propagat'), Campagnes: (action) => contains(action, 'campaign', 'campagne'), 'Waves de comptes': (action) => contains(action, 'wave', 'account_wave'), Affectations: (action) => contains(action, 'assign', 'affect'), 'Messages & emails': (action) => ['email_os', 'gmail'].includes(action.adapterCode), WhatsApp: (action) => action.adapterCode === 'whatsapp', 'Réunions & calendrier': (action) => ['meetings', 'calendar'].includes(action.adapterCode), Propositions: (action) => action.adapterCode === 'proposals', Opportunités: (action) => action.adapterCode === 'opportunities', Paiements: (action) => action.adapterCode === 'payments', 'Livraison Academy': (action) => ['academy_delivery', 'trainer_planning'].includes(action.adapterCode), Renouvellements: (action) => contains(action, 'renewal', 'renouvel'), 'Tâches internes': (action) => action.adapterCode === 'internal_tasks', Approbations: (action) => action.status === 'awaiting_approval' || action.status === 'approved', 'File d’exécution': (action) => ['queued', 'leased', 'executing', 'succeeded', 'failed'].includes(action.status), Retries: (action) => action.status === 'retry_scheduled', 'Dead letters': (action) => action.status === 'dead_letter', 'Rollback & compensation': (action) => contains(action, 'rollback', 'compens'), Webhooks: (action) => contains(action, 'webhook'), Audit: () => true, 'Validation finale': (action) => ['succeeded', 'approved'].includes(action.status),
  }
  return tests[tab] ? actions.filter(tests[tab]) : []
}
