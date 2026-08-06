'use client'

import { fetchRevenueOsJson } from '@/lib/revenue-command-os/client-http'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  Archive,
  Award,
  Boxes,
  CircleDollarSign,
  CloudSun,
  Compass,
  Cpu,
  Fingerprint,
  GalleryVerticalEnd,
  LineChart,
  LockKeyhole,
  Microscope,
  Route,
  ScanSearch,
  Shield,
  AlertTriangle,
  Atom,
  BarChart3,
  BrainCircuit,
  DatabaseBackup,
  FlaskConical,
  Gauge,
  Network,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Workflow,
} from 'lucide-react'
import type { MegaProductionDashboard, MegaTruthMode } from '@/lib/revenue-command-os/mega-production/types'
import { SChip, SDataTruth, SEmpty, SIcon, SMetric, STraceLink } from '../../_components/visual-sovereignty/SovereignPrimitives'
import ProductionHero from '../../_components/hero-sovereignty/heroes/ProductionHero'
import sovereigntyStyles from '../../_components/visual-sovereignty/Sovereignty.module.css'

const tabs = [
  'Production & Learning',
  'Mémoire des résultats',
  'Classement commandes',
  'Apprentissage segments',
  'Expériences',
  'Attribution',
  'Planification adaptative',
  'Prévisions & anomalies',
  'Queues & Workers',
  'Dead Letters & Locks',
  'Observabilité & Traces',
  'Registres',
  'Évaluations & Régressions',
  'Coûts & Confiance',
  'Disaster Recovery',
  'Sécurité',
] as const

type Tab = (typeof tabs)[number]
type Tone = 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'violet'
type VisualMode = 'factory' | 'archive' | 'ranking' | 'evolution' | 'laboratory' | 'causality' | 'navigation' | 'weather' | 'machine' | 'containment' | 'xray' | 'registry' | 'quality' | 'balance' | 'continuity' | 'perimeter'

const tabVisual: Record<Tab, { concept: string; subtitle: string; icon: typeof Activity; mode: VisualMode; tone: string }> = {
  'Production & Learning': { concept: 'Revenue Learning Factory', subtitle: 'Les outcomes alimentent attribution, apprentissage, calibration et amélioration continue.', icon: BrainCircuit, mode: 'factory', tone: 'from-slate-950 via-violet-950 to-blue-950' },
  'Mémoire des résultats': { concept: 'Outcome Archive Wall', subtitle: 'Chaque résultat est conservé avec sa stratégie, sa commande, son segment et sa preuve.', icon: Archive, mode: 'archive', tone: 'from-blue-950 via-slate-950 to-cyan-950' },
  'Classement commandes': { concept: 'Command Performance Championship', subtitle: 'Les commandes sont classées par preuve, répétabilité, confiance et qualité d’échantillon.', icon: Award, mode: 'ranking', tone: 'from-amber-950 via-slate-950 to-violet-950' },
  'Apprentissage segments': { concept: 'Segment Evolution Map', subtitle: 'Les segments évoluent lorsque les résultats modifient hypothèses, objections et réponses.', icon: Route, mode: 'evolution', tone: 'from-emerald-950 via-slate-950 to-blue-950' },
  'Expériences': { concept: 'Controlled Experiment Laboratory', subtitle: 'Hypothèses, variantes, groupes de contrôle et conclusions restent audités et séparés.', icon: FlaskConical, mode: 'laboratory', tone: 'from-violet-950 via-blue-950 to-slate-950' },
  'Attribution': { concept: 'Revenue Causality Map', subtitle: 'Les résultats sont reliés aux stratégies, commandes, interventions et facteurs de contexte.', icon: Network, mode: 'causality', tone: 'from-cyan-950 via-blue-950 to-slate-950' },
  'Planification adaptative': { concept: 'Adaptive Navigation System', subtitle: 'Le plan recommandé se recalcule selon outcomes, confiance, contraintes et priorités opérateur.', icon: Compass, mode: 'navigation', tone: 'from-blue-950 via-cyan-950 to-emerald-950' },
  'Prévisions & anomalies': { concept: 'Forecast Weather Observatory', subtitle: 'Précision, drift et anomalies apparaissent comme des systèmes commerciaux en mouvement.', icon: CloudSun, mode: 'weather', tone: 'from-sky-950 via-blue-950 to-slate-950' },
  'Queues & Workers': { concept: 'Production Machine Hall', subtitle: 'Queues, workers, leases et saturation deviennent une chaîne industrielle observable.', icon: Cpu, mode: 'machine', tone: 'from-slate-950 via-blue-950 to-cyan-950' },
  'Dead Letters & Locks': { concept: 'Concurrency Containment Chamber', subtitle: 'Dead letters, verrous, fencing tokens et reprises sont isolés avant toute intervention.', icon: LockKeyhole, mode: 'containment', tone: 'from-rose-950 via-slate-950 to-violet-950' },
  'Observabilité & Traces': { concept: 'Revenue System X-Ray', subtitle: 'Chaque source, table, trace et read model révèle sa santé réelle et sa fraîcheur.', icon: ScanSearch, mode: 'xray', tone: 'from-cyan-950 via-slate-950 to-blue-950' },
  'Registres': { concept: 'Institutional Registry Hall', subtitle: 'Modèles, prompts, doctrines et versions restent directement exploitables et traçables.', icon: GalleryVerticalEnd, mode: 'registry', tone: 'from-violet-950 via-slate-950 to-blue-950' },
  'Évaluations & Régressions': { concept: 'Quality Assurance Laboratory', subtitle: 'Les évaluations comparent qualité, stabilité et régressions avant promotion.', icon: Microscope, mode: 'quality', tone: 'from-emerald-950 via-blue-950 to-slate-950' },
  'Coûts & Confiance': { concept: 'Decision Utility Balance', subtitle: 'Coût, confiance et impact commercial sont comparés pour piloter immédiatement.', icon: CircleDollarSign, mode: 'balance', tone: 'from-amber-950 via-violet-950 to-slate-950' },
  'Disaster Recovery': { concept: 'Continuity Command Room', subtitle: 'RPO, RTO, scénarios, exercices et preuves de récupération restent immédiatement lisibles.', icon: DatabaseBackup, mode: 'continuity', tone: 'from-blue-950 via-slate-950 to-emerald-950' },
  'Sécurité': { concept: 'Revenue Security Perimeter', subtitle: 'Tenant, permissions, signatures et secrets forment des anneaux de défense vérifiables.', icon: Fingerprint, mode: 'perimeter', tone: 'from-emerald-950 via-slate-950 to-blue-950' },
}

const tabSources: Record<Tab, string[]> = {
  'Production & Learning': ['outcomes', 'commandPerformance', 'segments', 'experiments', 'attributions', 'calibrations', 'anomalies'],
  'Mémoire des résultats': ['outcomes'],
  'Classement commandes': ['commandPerformance'],
  'Apprentissage segments': ['segments'],
  'Expériences': ['experiments'],
  'Attribution': ['attributions'],
  'Planification adaptative': ['confidencePolicies'],
  'Prévisions & anomalies': ['calibrations', 'anomalies'],
  'Queues & Workers': ['queues', 'workers'],
  'Dead Letters & Locks': ['queues'],
  'Observabilité & Traces': [],
  'Registres': ['registries'],
  'Évaluations & Régressions': ['evaluations'],
  'Coûts & Confiance': ['costUsage', 'costBudgets', 'confidencePolicies'],
  'Disaster Recovery': ['drRuns'],
  'Sécurité': ['securityReviews'],
}

function truthModeFor(data: MegaProductionDashboard, sourceKeys: string[]): MegaTruthMode {
  if (!sourceKeys.length) return 'live'
  const selected = sourceKeys
    .map((key) => data.sourceHealth.find((source) => source.key === key))
    .filter(Boolean)
  if (!selected.length) return 'unavailable'
  const healthy = selected.filter((source) => source?.ok).length
  if (healthy === selected.length) return 'live'
  if (healthy === 0) return 'unavailable'
  return 'degraded'
}

function sourceMode(data: MegaProductionDashboard, key: string): MegaTruthMode {
  return truthModeFor(data, [key])
}


function pct(value: number) {
  return `${Math.round(value)}%`
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,.05)] ${className}`}
    >
      {children}
    </section>
  )
}

function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  const map: Record<Tone, string> = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${map[tone]}`}>
      {children}
    </span>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">{children}</div>
}

function humanize(key: string) {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, (value) => value.toUpperCase())
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2)
  if (Array.isArray(value)) return `${value.length} élément${value.length > 1 ? 's' : ''}`
  if (typeof value === 'object') return `${Object.keys(value as Record<string, unknown>).length} propriétés`
  return String(value)
}

function JsonRows({ rows, mode = 'archive', dataMode = 'live' }: { rows: unknown[]; mode?: VisualMode; dataMode?: MegaProductionDashboard['dataMode'] }) {
  if (!rows.length) return dataMode === 'live'
    ? <SEmpty title="Zéro persistant confirmé" description="La source est disponible et ne contient actuellement aucun enregistrement." icon={DatabaseBackup} />
    : <SEmpty title="Données non calculées" description="Cette source n’est pas entièrement disponible. Aucun zéro opérationnel n’est affirmé tant que la synchronisation n’est pas rétablie." mode="unavailable" icon={DatabaseBackup} />

  const grid = mode === 'ranking' || mode === 'laboratory' || mode === 'registry'
    ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
    : mode === 'causality' || mode === 'evolution'
      ? 'grid gap-4 lg:grid-cols-2'
      : 'space-y-3'

  return (
    <div className={grid}>
      {rows.slice(0, 30).map((row, index) => {
        const record = row && typeof row === 'object' ? row as Record<string, unknown> : { value: row }
        const entries = Object.entries(record).filter(([, value]) => value !== null && value !== undefined).slice(0, 8)
        const titleEntry = entries.find(([key]) => /title|name|code|segment|queue|status|state|type/i.test(key)) ?? entries[0]
        const title = titleEntry ? displayValue(titleEntry[1]) : `Enregistrement ${index + 1}`
        const rest = entries.filter(([key]) => key !== titleEntry?.[0]).slice(0, 5)
        const accent = mode === 'containment' ? 'border-rose-200' : mode === 'quality' || mode === 'perimeter' ? 'border-emerald-200' : mode === 'ranking' || mode === 'balance' ? 'border-amber-200' : mode === 'laboratory' || mode === 'registry' ? 'border-violet-200' : 'border-blue-200'
        return (
          <article key={String(record.id ?? record.code ?? record.key ?? index)} className={`group relative overflow-hidden rounded-[28px] border ${accent} bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,.10)]`}>
            <div className="absolute right-3 top-1 text-5xl font-black tracking-[-.08em] text-slate-100">{String(index + 1).padStart(2, '0')}</div>
            <p className="relative max-w-[82%] truncate text-sm font-black text-slate-950">{title}</p>
            <div className="relative mt-5 grid gap-2 sm:grid-cols-2">
              {rest.map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-slate-50 px-3 py-2.5">
                  <p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-500">{humanize(key)}</p>
                  <p className="mt-1 truncate text-[10px] font-bold text-slate-700">{displayValue(value)}</p>
                </div>
              ))}
            </div>
            {record.traceId ? <div className="relative mt-4"><STraceLink traceId={String(record.traceId)} compact /></div> : null}
          </article>
        )
      })}
    </div>
  )
}

function SectionHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-700">{eyebrow}</p>
      <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
      {detail ? <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{detail}</p> : null}
    </div>
  )
}

function DarkMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Activity }) {
  return <div className="rounded-[26px] border border-white/10 bg-white/[.07] p-4 backdrop-blur-xl"><div className="flex items-center justify-between"><Icon size={17} className="text-blue-200" /><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.9)]" /></div><p className="mt-5 text-3xl font-black tracking-[-.05em]">{value}</p><p className="mt-1 text-[8px] font-black uppercase tracking-[.14em] text-slate-500">{label}</p></div>
}

export default function MegaProductionConsole() {
  const [data, setData] = useState<MegaProductionDashboard | null>(null)
  const [active, setActive] = useState<Tab>(tabs[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setBusy(true)
    setError('')
    try {
      const body = await fetchRevenueOsJson<MegaProductionDashboard>(
        '/api/revenue-command-os/mega-production',
        { cache: 'no-store' },
        { timeoutMs: 30000, fallbackMessage: 'Chargement Production & Learning impossible.' },
      )
      if (!body.data) throw new Error('Le centre Production & Learning n’a retourné aucune donnée exploitable.')
      setData(body.data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erreur Production & Learning non identifiée.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const alerts = useMemo(
    () => data?.anomalies.filter((item) => item.status === 'open').slice(0, 6) ?? [],
    [data],
  )
  const unavailable = data?.dataMode === 'unavailable'
  const degraded = data?.dataMode === 'degraded'
  const sourceFailures = data?.sourceHealth.filter((source) => !source.ok) ?? []
  const healthySourceCount = data ? data.sourceHealth.length - sourceFailures.length : 0
  const affectedCapabilities = data?.capabilityHealth.filter((capability) => capability.state !== 'live') ?? []

  function renderTab() {
    if (!data) return <Card><Empty>Initialisation des sources de production…</Empty></Card>
    const modeFor = (...sourceKeys: string[]) => truthModeFor(data, sourceKeys)

    switch (active) {
      case 'Mémoire des résultats':
        return <Card><SectionHeader eyebrow="Learning memory" title="Résultats stratégiques persistés" /><div className="mt-5"><JsonRows mode={tabVisual[active].mode} rows={data.outcomes} dataMode={modeFor('outcomes')} /></div></Card>
      case 'Classement commandes':
        return <Card><SectionHeader eyebrow="Command intelligence" title="Classement des commandes par preuve" /><div className="mt-5"><JsonRows mode={tabVisual[active].mode} rows={data.commandPerformance} dataMode={modeFor('commandPerformance')} /></div></Card>
      case 'Apprentissage segments':
        return <Card><SectionHeader eyebrow="Segment learning" title="Réponses, patterns gagnants et échecs" /><div className="mt-5"><JsonRows mode={tabVisual[active].mode} rows={data.segmentLearning} dataMode={modeFor('segments')} /></div></Card>
      case 'Expériences':
        return <Card><SectionHeader eyebrow="Controlled experiments" title="Expériences et groupes de contrôle" /><div className="mt-5"><JsonRows mode={tabVisual[active].mode} rows={data.experiments} dataMode={modeFor('experiments')} /></div></Card>
      case 'Attribution':
        return <Card><SectionHeader eyebrow="Causal attribution" title="Contribution des stratégies, commandes et interventions" /><div className="mt-5"><JsonRows mode={tabVisual[active].mode} rows={data.attributions} dataMode={modeFor('attributions')} /></div></Card>
      case 'Planification adaptative':
        return <Card><SectionHeader eyebrow="Adaptive scheduling" title="Planification pilotée par résultats" detail="Les résultats et anomalies alimentent directement la prochaine cadence opérationnelle." /><div className="mt-5"><JsonRows mode={tabVisual[active].mode} rows={data.confidencePolicies} dataMode={modeFor('confidencePolicies')} /></div></Card>
      case 'Prévisions & anomalies':
        return <Card><SectionHeader eyebrow="Forecast control" title="Calibrations et anomalies" /><div className="mt-5 grid gap-5 lg:grid-cols-2"><JsonRows mode={tabVisual[active].mode} rows={data.calibrations} dataMode={modeFor('calibrations')} /><JsonRows mode={tabVisual[active].mode} rows={data.anomalies} dataMode={modeFor('anomalies')} /></div></Card>
      case 'Queues & Workers':
        return <Card><SectionHeader eyebrow="Durable runtime" title="Queues et workers" /><div className="mt-5 grid gap-5 lg:grid-cols-2"><JsonRows mode={tabVisual[active].mode} rows={data.queues} dataMode={modeFor('queues')} /><JsonRows mode={tabVisual[active].mode} rows={data.workers} dataMode={modeFor('workers')} /></div></Card>
      case 'Dead Letters & Locks':
        return <Card><SectionHeader eyebrow="Recovery control" title="Dead letters et verrous distribués" /><div className="mt-5"><JsonRows mode={tabVisual[active].mode} rows={data.locks} dataMode={modeFor('queues')} /></div></Card>
      case 'Observabilité & Traces':
        return <Card><SectionHeader eyebrow="Source observability" title="Santé des sources opérationnelles" /><div className="mt-5 space-y-3">{data.sourceHealth.map((source) => <div key={source.key} className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-slate-900">{source.label}</p><Badge tone={source.criticality === 'safety' ? 'red' : source.criticality === 'operational' ? 'amber' : 'slate'}>{source.capability}</Badge></div><p className="truncate text-xs text-slate-500">Dernière lecture : {new Date(source.queriedAt).toLocaleString('fr-FR')}</p>{source.message ? <p className="mt-1 text-xs font-semibold text-rose-600">{source.message}</p> : null}{source.traceId ? <p className="mt-1 text-[10px] font-bold text-slate-500">Trace: {source.traceId}</p> : null}</div><Badge tone={source.ok ? 'green' : 'red'}>{source.ok ? `${source.count} lignes` : 'indisponible'}</Badge></div>)}</div></Card>
      case 'Registres':
        return <Card><SectionHeader eyebrow="Registres opérationnels" title="Modèles, prompts et doctrines" /><div className="mt-5"><JsonRows mode={tabVisual[active].mode} rows={data.registries} dataMode={modeFor('registries')} /></div></Card>
      case 'Évaluations & Régressions':
        return <Card><SectionHeader eyebrow="Evaluation suites" title="Évaluations automatiques et non-régression" /><div className="mt-5"><JsonRows mode={tabVisual[active].mode} rows={data.evaluations} dataMode={modeFor('evaluations')} /></div></Card>
      case 'Coûts & Confiance':
        return <Card><SectionHeader eyebrow="FinOps & confidence" title="Coûts, budget et seuils de confiance" /><div className="mt-5 grid gap-5 lg:grid-cols-2"><JsonRows mode={tabVisual[active].mode} rows={[data.cost]} dataMode={modeFor('costUsage', 'costBudgets')} /><JsonRows mode={tabVisual[active].mode} rows={data.confidencePolicies} dataMode={modeFor('confidencePolicies')} /></div></Card>
      case 'Disaster Recovery':
        return <Card><SectionHeader eyebrow="Resilience" title="Exercices de reprise et preuves" /><div className="mt-5"><JsonRows mode={tabVisual[active].mode} rows={data.disasterRecovery} dataMode={modeFor('drRuns')} /></div></Card>
      case 'Sécurité':
        return <Card><SectionHeader eyebrow="Production security" title="Revue de sécurité" /><div className="mt-5"><JsonRows mode={tabVisual[active].mode} rows={data.securityReview ? [data.securityReview] : []} dataMode={modeFor('securityReviews')} /></div></Card>
      default:
        return renderOverview(data)
    }
  }

  function renderOverview(current: MegaProductionDashboard) {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between">
              <SectionHeader eyebrow="Boucle d’auto-maturation" title="Résultats → attribution → apprentissage → meilleure décision" />
              <BrainCircuit className="text-violet-600" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Outcomes', value: current.outcomes.length, icon: DatabaseBackup, available: sourceMode(current, 'outcomes') === 'live' },
                { label: 'Commandes classées', value: current.commandPerformance.length, icon: BarChart3, available: sourceMode(current, 'commandPerformance') === 'live' },
                { label: 'Expériences actives', value: current.metrics.activeExperiments, icon: FlaskConical, available: sourceMode(current, 'experiments') === 'live' },
                { label: 'Échantillons learning', value: current.metrics.learningSamples, icon: Atom, available: sourceMode(current, 'outcomes') === 'live' },
              ].map(({ label, value, icon: DisplayIcon, available }) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <DisplayIcon size={18} className="text-violet-600" />
                  <p className="mt-3 text-2xl font-black text-slate-950">{available ? value : '—'}</p>
                  <p className="text-xs font-bold text-slate-500">{label}</p>
                  {!available ? <p className="mt-1 text-[10px] font-bold text-amber-700">Source non disponible</p> : null}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between"><SectionHeader eyebrow="Runtime durable" title="Queues, workers et verrouillage distribué" /><Workflow className="text-blue-600" /></div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[1fr_90px_100px_100px] bg-slate-50 px-4 py-3 text-[10px] font-black uppercase text-slate-500"><span>Queue</span><span>Depth</span><span>Oldest</span><span>Status</span></div>
              {current.queues.slice(0, 8).map((queue) => <div key={queue.queue} className="grid grid-cols-[1fr_90px_100px_100px] items-center border-t border-slate-100 px-4 py-3 text-xs"><span className="font-black text-slate-800">{queue.queue}</span><span>{queue.depth}</span><span>{queue.oldestJobAgeSeconds}s</span><Badge tone={queue.status === 'healthy' ? 'green' : queue.status === 'critical' ? 'red' : 'amber'}>{queue.status}</Badge></div>)}
              {!current.queues.length ? sourceMode(current, 'queues') === 'live' ? <p className="p-5 text-sm text-slate-500">Aucune métrique de queue persistée pour le moment.</p> : <p className="p-5 text-sm font-semibold text-amber-700">La source des files est indisponible. Les autres espaces restent utilisables.</p> : null}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between"><SectionHeader eyebrow="Approches gagnantes" title="Commandes et patterns à haute confiance" /><Sparkles className="text-emerald-600" /></div>
            <div className="mt-4 space-y-3">
              {current.commandPerformance.filter((command) => ['high_performing', 'validated'].includes(command.state)).slice(0, 6).map((command) => <div key={`${command.commandCode}-${command.segment ?? ''}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Gauge size={18} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{command.commandCode}</p><p className="text-xs text-slate-500">{command.segment ?? 'Tous segments'} · {command.executions} exécutions · {pct(command.successRate * 100)} succès</p></div><Badge tone="green">{command.state}</Badge></div>)}
              {!current.commandPerformance.length ? sourceMode(current, 'commandPerformance') === 'live' ? <p className="text-sm text-slate-500">Le classement se renforcera avec les résultats réels.</p> : <p className="text-sm font-semibold text-amber-700">Le classement est momentanément indisponible sans bloquer les autres capacités.</p> : null}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-3"><ShieldCheck className="text-emerald-600" /><div><p className="text-[10px] font-black uppercase text-slate-500">Autorité opérateur</p><h3 className="text-lg font-black">Production live</h3></div></div>
            <div className="mt-5 space-y-3">
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-xs"><span>Mode</span><strong>{current.mode}</strong></div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-xs"><span>Niveau</span><strong>L{current.activationLevel}</strong></div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-xs"><span>Actions externes</span><strong className="text-emerald-700">Disponibles via Email OS et WhatsApp</strong></div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-xs"><span>Autorité utilisateur</span><strong className="text-emerald-700">Complète</strong></div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-xs"><span>Mode données</span><strong>{current.dataMode}</strong></div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3"><AlertTriangle className="text-rose-600" /><div><p className="text-[10px] font-black uppercase text-slate-500">Anomalies prioritaires</p><h3 className="text-lg font-black">Intervention requise</h3></div></div>
            <div className="mt-4 space-y-3">
              {alerts.map((alert) => <div key={alert.id} className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4"><div className="flex justify-between gap-3"><p className="text-sm font-black text-slate-900">{alert.title}</p><Badge tone={alert.severity === 'critical' || alert.severity === 'high' ? 'red' : 'amber'}>{alert.severity}</Badge></div><p className="mt-2 text-xs leading-5 text-slate-600">{alert.businessImpact}</p><p className="mt-2 text-xs font-bold text-rose-700">{alert.recommendedAction}</p></div>)}
              {!alerts.length ? sourceMode(current, 'anomalies') === 'live' ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">Aucune anomalie ouverte prioritaire.</div> : <div className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">Le registre des anomalies est indisponible. Aucun zéro n’est affirmé.</div> : null}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const activeVisual = tabVisual[active]
  const activeTruthMode = data ? truthModeFor(data, tabSources[active]) : 'unavailable'

  return (
    <div className="mx-auto max-w-[1760px] space-y-6 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <>
      <ProductionHero
        state={error && !data ? 'OFFLINE' : !data ? 'INITIALIZING' : activeTruthMode === 'live' ? 'LIVE' : activeTruthMode === 'degraded' ? 'DEGRADED' : 'OFFLINE'}
        posture={data ? `Activation L${data.activationLevel} · ${active}` : 'Initialisation production'}
        authority={data?.externalActionsEnabled ? 'Posture source: effets externes autorisés' : 'Effets externes désactivés'}
        summary={`${activeVisual.subtitle} ${data ? `${healthySourceCount}/${data.sourceHealth.length} sources sont disponibles pour ce périmètre.` : 'La disponibilité réelle des sources est en cours de résolution.'}`}
        freshness={data?.freshness.message}
        metrics={[
          { label: 'Sécurité activation', value: data?.metricAvailability.activationSafety ? `${data.metrics.activationSafetyScore}/100` : '—', note: data?.metricAvailability.activationSafety ? 'Contrôle disponible' : 'Non calculé', tone: 'emerald' },
          { label: 'Précision forecast', value: data?.metricAvailability.forecastAccuracy ? pct(data.metrics.forecastAccuracy) : '—', note: data?.metricAvailability.forecastAccuracy ? 'Source disponible' : 'Indisponible', tone: 'blue' },
          { label: 'Files', value: data?.metricAvailability.queueDepth ? data.metrics.queueDepth : '—', note: data?.metricAvailability.queueDepth ? 'Profondeur actuelle' : 'Source dégradée', tone: 'cyan' },
          { label: 'Anomalies', value: data?.metricAvailability.openAnomalies ? data.metrics.openAnomalies : '—', note: data?.metricAvailability.openAnomalies ? 'Ouvertes' : 'Non calculé', tone: 'amber' },
        ]}
        actions={[
          { label: busy ? 'Actualisation…' : 'Actualiser', onClick: () => void load(), disabled: busy, reason: busy ? 'La production est déjà en cours d’actualisation.' : undefined, kind: 'primary', icon: RefreshCw },
          { label: 'Ouvrir l’exécution', onClick: () => { window.location.href = '/revenue-command-os/execution-autopilot' }, kind: 'secondary', icon: Workflow },
        ]}
        warning={!data ? 'Initialisation — les métriques apparaissent dès que les sources répondent.' : unavailable ? 'Sources indisponibles — ouvrez les traces et relancez les opérations concernées.' : degraded ? `Dégradation localisée : ${affectedCapabilities.length} capacité(s) affectée(s), ${sourceFailures.length} source(s) à rétablir.` : 'Production live disponible pour tous les opérateurs authentifiés.'}
      />
      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</p> : null}
      </>

      <nav aria-label="Workspaces Production & Learning" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {tabs.map((tab) => {
          const item = tabVisual[tab]
          const Icon = item.icon
          const selected = active === tab
          const state = data ? truthModeFor(data, tabSources[tab]) : 'unavailable'
          return (
            <button key={tab} onClick={() => setActive(tab)} className={`group min-h-[112px] rounded-[26px] border p-4 text-left transition ${selected ? 'border-slate-950 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,.20)]' : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_18px_55px_rgba(30,64,175,.08)]'}`}>
              <div className="flex items-start justify-between gap-3">
                <SIcon icon={Icon} tone={selected ? 'blue' : 'slate'} />
                <div className="text-right">
                  <span className={`block text-[8px] font-black uppercase tracking-[.14em] ${selected ? 'text-blue-200' : 'text-slate-500'}`}>{item.mode}</span>
                  <span className={`mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase ${state === 'live' ? selected ? 'text-emerald-300' : 'text-emerald-600' : state === 'degraded' ? 'text-amber-500' : 'text-rose-500'}`}><span className={`h-1.5 w-1.5 rounded-full ${state === 'live' ? 'bg-emerald-500' : state === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'}`} />{state === 'live' ? 'disponible' : state === 'degraded' ? 'partiel' : 'indisponible'}</span>
                </div>
              </div>
              <p className="mt-4 text-[11px] font-black leading-4">{tab}</p>
            </button>
          )
        })}
      </nav>

      {renderTab()}

      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex gap-3"><TimerReset className="text-blue-600" /><div><p className="text-xs font-black">Durable queues</p><p className="text-[11px] text-slate-500">Leases, visibility timeouts, retries et replay.</p></div></div>
          <div className="flex gap-3"><LockKeyhole className="text-violet-600" /><div><p className="text-xs font-black">Distributed locks</p><p className="text-[11px] text-slate-500">Fencing tokens et récupération des locks expirés.</p></div></div>
          <div className="flex gap-3"><Network className="text-emerald-600" /><div><p className="text-xs font-black">Full tracing</p><p className="text-[11px] text-slate-500">Objectif jusqu’au résultat et à l’apprentissage.</p></div></div>
          <div className="flex gap-3"><Workflow className="text-rose-600" /><div><p className="text-xs font-black">Contrôles opérateur</p><p className="text-[11px] text-slate-500">Exécuter, réessayer, interrompre et reprendre depuis le centre d’exécution.</p></div></div>
        </div>
      </Card>


    </div>
  )
}
