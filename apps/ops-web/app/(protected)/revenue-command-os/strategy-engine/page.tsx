import Link from 'next/link'
import {
  ArrowRight, BrainCircuit, CheckCircle2, CircleDot, GitCompareArrows,
  Layers3, Network, Orbit, ShieldCheck, Sparkles, Target, TriangleAlert,
} from 'lucide-react'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { readRevenueOsOperationalModel } from '@/lib/revenue-command-os/operational-read-model'
import type { RevenueOsOperationalStrategy } from '@/lib/revenue-command-os/types'
import { AiRuntimePanel } from './_components/AiRuntimePanel'
import { SChip, SEmpty, SIcon } from '../_components/visual-sovereignty/SovereignPrimitives'
import sovereigntyStyles from '../_components/visual-sovereignty/Sovereignty.module.css'
import StrategiesHero from '../_components/hero-sovereignty/heroes/StrategiesHero'

export const dynamic = 'force-dynamic'

const evidence = [
  ['Objectif revenue', 'Mandat, horizon, territoire et résultat attendu', Target, 'blue'],
  ['Tissu de signaux', 'Intentions, risques, saisonnalité et anomalies', Orbit, 'cyan'],
  ['Digital Twin', 'Offres, segments, marchés, capacité et contraintes', Network, 'violet'],
  ['Doctrine', 'Règles, preuves, cas, SOP et restrictions', ShieldCheck, 'emerald'],
] as const

const strategyBlocks = [
  ['Thèse', 'Pourquoi cette trajectoire peut gagner maintenant'],
  ['Marché', 'Fenêtre, territoire et maturité'],
  ['Segment', 'Acheteur, décisionnaire et besoin'],
  ['Offre', 'Valeur, prix et protection de marge'],
  ['Timing', 'Séquençage et urgence'],
  ['Canal', 'Accès et progression commerciale'],
  ['Capacité', 'Promesse réellement livrable'],
  ['Risque', 'Downside, stop conditions et preuve'],
]

function truthState(sourceState: 'live' | 'partial' | 'unavailable', count: number) {
  if (sourceState === 'unavailable') return 'DEGRADED' as const
  if (!count) return 'EMPTY' as const
  return sourceState === 'partial' ? 'DEGRADED' as const : 'LIVE' as const
}

export default async function StrategyEnginePage() {
  const actor = await resolveRevenueOsActor('revenue_os.strategy.manage', { aliases: ['revenue_os.view', 'revenue.view'] })
  const operations = await readRevenueOsOperationalModel(actor.tenantId)
  const strategies = operations.strategies
  const approved = operations.counts.strategiesApproved
  const top = strategies[0]

  return (
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <StrategiesHero
        state={truthState(operations.sourceState, strategies.length)}
        posture="Production analytique · dossier persisté"
        authority="Conseil stratégique · décision approbation-gated"
        summary={top
          ? `${top.code} · ${top.thesis}`
          : 'Aucune stratégie persistée n’est disponible pour ce tenant. Créez un objectif, assemblez les stratégies, puis soumettez un dossier au Conseil.'}
        freshness={new Date(operations.generatedAt).toLocaleString('fr-FR')}
        metrics={[
          { label: 'Stratégies persistées', value: strategies.length, note: `${operations.counts.strategiesReadyForCouncil} prête(s) pour le Conseil`, tone: 'violet' },
          { label: 'Approuvées', value: approved, note: `${operations.counts.pendingApprovals} décision(s) en attente`, tone: 'emerald' },
          { label: 'Contradictions ouvertes', value: operations.counts.openContradictions, note: operations.counts.openContradictions ? 'Arbitrage requis' : 'Aucune contradiction ouverte', tone: operations.counts.openContradictions ? 'amber' : 'blue' },
          { label: 'Confiance leader', value: top ? `${top.confidence}%` : '—', note: top?.code || 'Aucun dossier', tone: 'blue' },
        ]}
        actions={[
          { label: 'Ouvrir le Conseil', href: '/revenue-command-os/validation-council', kind: 'primary' },
          { label: 'Ouvrir le Studio', href: '/revenue-command-os/strategy-studio', kind: 'secondary' },
        ]}
        warning={operations.warnings.length ? `SOURCE PARTIELLE — ${operations.warnings.slice(0, 2).join(' · ')}` : undefined}
      />

      <div className="mt-7 grid gap-6 2xl:grid-cols-[330px_1fr_390px]">
        <aside className="space-y-4">
          <div><SChip tone="blue">Plan des preuves</SChip><h2 className="mt-3 text-2xl font-black tracking-[-.04em]">Ce que la stratégie est autorisée à considérer comme vrai.</h2></div>
          {evidence.map(([title, detail, Icon, tone], index) => <article key={title} className={`relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,.06)] ${index % 2 ? 'ml-5' : ''}`}><div className="flex items-start gap-4"><SIcon icon={Icon} tone={tone} /><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Entrée {index + 1}</p><h3 className="mt-1 text-sm font-black">{title}</h3><p className="mt-2 text-[10px] leading-5 text-slate-500">{detail}</p></div></div><div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-emerald-700"><CheckCircle2 size={13} /> Autorité et fraîcheur conservées dans le dossier</div></article>)}
          <div className="rounded-[30px] border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><TriangleAlert size={19} className="text-amber-700" /><div><h3 className="text-xs font-black text-amber-950">Frontière de vérité</h3><p className="mt-2 text-[10px] leading-5 text-amber-800">Aucune hypothèse n’est présentée comme preuve. Les manques, contradictions et risques proviennent uniquement des dossiers persistés.</p></div></div></div>
        </aside>

        <section className="relative min-h-[760px] overflow-hidden rounded-[48px] border border-violet-200 bg-white p-7 shadow-[0_32px_100px_rgba(76,29,149,.08)]">
          <div className={`absolute inset-0 opacity-40 ${sovereigntyStyles.dotField}`} />
          <div className="relative flex items-start justify-between"><div><SChip tone="violet"><BrainCircuit size={11} /> Architecture du Strategy Brain</SChip><h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-.055em]">Une stratégie versionnée, comparable et soumise à autorité.</h2></div><SIcon icon={Sparkles} tone="violet" /></div>
          <div className="relative mt-10 grid gap-6 sm:grid-cols-2">
            {strategyBlocks.map(([title, detail], index) => <article key={title} className={`relative rounded-[32px] border bg-white/92 p-6 shadow-[0_16px_45px_rgba(15,23,42,.06)] backdrop-blur ${index % 4 === 0 ? 'border-blue-200 sm:-rotate-1' : index % 4 === 1 ? 'border-violet-200 sm:translate-y-8' : index % 4 === 2 ? 'border-emerald-200 sm:-translate-y-2' : 'border-amber-200 sm:rotate-1'}`}><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-xs font-black text-white">{String(index + 1).padStart(2, '0')}</span><CircleDot size={18} className="text-violet-500" /></div><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>{index < strategyBlocks.length - 1 ? <ArrowRight size={17} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 sm:block" /> : null}</article>)}
          </div>
          <div className="relative mt-14 rounded-[34px] bg-slate-950 p-6 text-white"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-violet-300">Posture active</p><h3 className="mt-2 text-xl font-black">Sortie analytique persistée et versionnée</h3><p className="mt-2 max-w-2xl text-[10px] leading-5 text-slate-300">Les effets internes sont autorisés. Toute communication ou action externe reste soumise au canal, à l’approbation et à l’audit.</p></div><SChip tone="emerald">Approval-gated</SChip></div></div>
        </section>

        <aside className="space-y-5">
          <div><SChip tone="amber"><GitCompareArrows size={11} /> Stratégies persistées</SChip><h2 className="mt-3 text-2xl font-black tracking-[-.04em]">Comparer les dossiers réels du tenant.</h2></div>
          {strategies.slice(0, 6).map((strategy, index) => <StrategyCard key={strategy.id} strategy={strategy} index={index} />)}
          {!strategies.length ? <SEmpty title="Aucune stratégie persistée" description="Le moteur est disponible, mais aucun dossier stratégique réel n’a encore été généré pour ce tenant." action={<Link href="/revenue-command-os/revenue-objectives" className="rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white">Ouvrir les objectifs</Link>} /> : null}
          <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,.06)]"><AiRuntimePanel /></div>
        </aside>
      </div>

      <section className="mt-7 rounded-[44px] border border-slate-200 bg-white p-7"><div className="flex items-start gap-4"><SIcon icon={Layers3} tone="blue" /><div><SChip tone="blue">Chaîne stratégique opérationnelle</SChip><h2 className="mt-3 text-3xl font-black tracking-[-.05em]">Objectif → Stratégies → Conseil → Studio → Approbation → Compilation</h2><p className="mt-2 max-w-4xl text-xs leading-6 text-slate-500">Cette page lit maintenant les stratégies persistées. Elle ne remplace ni le Conseil, ni le Studio de décision, ni les gates de compilation.</p></div></div></section>
    </main>
  )
}

function StrategyCard({ strategy, index }: { strategy: RevenueOsOperationalStrategy; index: number }) {
  const tone = index % 3 === 0 ? 'border-blue-300 bg-blue-50/70' : index % 3 === 1 ? 'border-violet-300 bg-violet-50/70' : 'border-amber-300 bg-amber-50/70'
  return <article className={`relative overflow-hidden rounded-[34px] border p-6 shadow-[0_20px_55px_rgba(15,23,42,.07)] ${tone}`}>
    <div className="flex items-start justify-between"><span className="grid h-12 min-w-12 place-items-center rounded-[18px] bg-slate-950 px-3 text-xs font-black text-white">{strategy.code.slice(-4)}</span><div className="text-right"><p className="text-3xl font-black">{strategy.confidence}%</p><p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-500">confiance</p></div></div>
    <div className="mt-5 flex flex-wrap gap-2"><SChip tone="violet">{strategy.archetype}</SChip><SChip tone={strategy.approvalStatus?.includes('approved') ? 'emerald' : 'amber'}>{strategy.approvalStatus || strategy.status}</SChip></div>
    <h3 className="mt-5 text-xl font-black">{strategy.title}</h3><p className="mt-3 line-clamp-4 text-xs leading-5 text-slate-600">{strategy.thesis}</p>
    <div className="mt-5 grid grid-cols-3 gap-2"><MiniFact label="Preuves" value={strategy.evidenceCount} /><MiniFact label="Risques" value={strategy.highRisks} /><MiniFact label="Contrad." value={strategy.contradictions} /></div>
    <div className="mt-5 flex items-center justify-between border-t border-slate-200/70 pt-4"><span className="text-[10px] font-bold text-slate-500">Version {strategy.version}</span><Link href="/revenue-command-os/strategy-studio" className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700">Décider <ArrowRight size={13} /></Link></div>
  </article>
}

function MiniFact({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl bg-white/75 p-3 text-center"><p className="text-lg font-black text-slate-950">{value}</p><p className="mt-1 text-[8px] font-black uppercase tracking-[.1em] text-slate-500">{label}</p></div>
}
