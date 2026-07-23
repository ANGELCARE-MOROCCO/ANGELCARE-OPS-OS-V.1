'use client'

import {
  ArrowRight, BrainCircuit, CheckCircle2, CircleDot, FlaskConical, Gauge, GitCompareArrows,
  Layers3, LockKeyhole, Network, Orbit, ShieldCheck, Sparkles, Target, TriangleAlert,
} from 'lucide-react'
import { AiRuntimePanel } from './_components/AiRuntimePanel'
import { SChip, SIcon } from '../_components/visual-sovereignty/SovereignPrimitives'
import sovereigntyStyles from '../_components/visual-sovereignty/Sovereignty.module.css'
import StrategiesHero from '../_components/hero-sovereignty/heroes/StrategiesHero'

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

const alternatives = [
  { code: 'A', title: 'Concentration verticale', confiance: 84, accent: 'border-blue-300 bg-blue-50/70', outcome: 'Dominer un ICP avec preuve et répétabilité.' },
  { code: 'B', title: 'Expansion territoriale', confiance: 72, accent: 'border-violet-300 bg-violet-50/70', outcome: 'Répliquer le modèle dans les zones les plus prêtes.' },
  { code: 'C', title: 'Monétisation premium', confiance: 68, accent: 'border-amber-300 bg-amber-50/70', outcome: 'Élever la valeur par bundles et autorité.' },
]

export default function StrategyEnginePage() {
  return (
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <StrategiesHero
        state="PREVIEW"
        posture="Analytique · sans exécution"
        authority="Laboratoire stratégique · Conseil requis"
        summary="Les objectifs, signaux, modèles commerciaux, doctrines et commandes canoniques sont assemblés en hypothèses concurrentes. Cette surface reste contractuelle tant qu’aucun dossier live n’est fourni à cette page."
        metrics={[
          { label: 'Stratégies candidates', value: 'Non calculé', note: 'Source live non exposée', tone: 'violet' },
          { label: 'Preuves complètes', value: 'Non calculé', note: 'Dossier requis', tone: 'blue' },
          { label: 'Contradictions', value: 'Non calculé', note: 'Validation requise', tone: 'amber' },
          { label: 'Éligibilité Conseil', value: 'Indisponible', note: 'Aucun dossier sélectionné', tone: 'slate' },
        ]}
        actions={[
          { label: 'Ouvrir le Conseil', href: '/revenue-command-os/validation-council', kind: 'primary' },
          { label: 'Ouvrir le Studio', href: '/revenue-command-os/strategy-studio', kind: 'secondary' },
        ]}
        warning="PREVIEW — les alternatives et scores sous ce hero sont des compositions contractuelles; ils ne sont pas présentés comme des résultats live."
      />

      <div className="mt-7 grid gap-6 2xl:grid-cols-[330px_1fr_390px]">
        <aside className="space-y-4">
          <div><SChip tone="blue">Plan des preuves</SChip><h2 className="mt-3 text-2xl font-black tracking-[-.04em]">Ce que la stratégie est autorisée à considérer comme vrai.</h2></div>
          {evidence.map(([title, detail, Icon, tone], index) => <article key={title} className={`relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,.06)] ${index % 2 ? 'ml-5' : ''}`}><div className="flex items-start gap-4"><SIcon icon={Icon} tone={tone} /><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Entrée {index + 1}</p><h3 className="mt-1 text-sm font-black">{title}</h3><p className="mt-2 text-[10px] leading-5 text-slate-500">{detail}</p></div></div><div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-emerald-700"><CheckCircle2 size={13} /> Autorité et fraîcheur visibles dans le dossier de preuves</div></article>)}
          <div className="rounded-[30px] border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><TriangleAlert size={19} className="text-amber-700" /><div><h3 className="text-xs font-black text-amber-950">Frontière de vérité</h3><p className="mt-2 text-[10px] leading-5 text-amber-800">Aucune hypothèse ne doit être confondue avec une preuve. Les manques restent visibles et réduisent la confiance.</p></div></div></div>
        </aside>

        <section className="relative min-h-[900px] overflow-hidden rounded-[48px] border border-violet-200 bg-white p-7 shadow-[0_32px_100px_rgba(76,29,149,.08)]">
          <div className={`absolute inset-0 opacity-40 ${sovereigntyStyles.dotField}`} />
          <div className="relative flex items-start justify-between"><div><SChip tone="violet"><BrainCircuit size={11} /> Plan d’assemblage stratégique</SChip><h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-.055em]">Construire la stratégie comme une architecture de décisions porteuses.</h2></div><SIcon icon={Sparkles} tone="violet" /></div>
          <div className="relative mt-10 grid gap-6 sm:grid-cols-2">
            {strategyBlocks.map(([title, detail], index) => <article key={title} className={`relative rounded-[32px] border bg-white/92 p-6 shadow-[0_16px_45px_rgba(15,23,42,.06)] backdrop-blur ${index % 4 === 0 ? 'border-blue-200 sm:-rotate-1' : index % 4 === 1 ? 'border-violet-200 sm:translate-y-8' : index % 4 === 2 ? 'border-emerald-200 sm:-translate-y-2' : 'border-amber-200 sm:rotate-1'}`}><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-xs font-black text-white">{String(index + 1).padStart(2, '0')}</span><CircleDot size={18} className="text-violet-500" /></div><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p><div className="mt-5 h-1 rounded-full bg-slate-100"><div className={`h-full rounded-full ${index % 3 === 0 ? 'w-4/5 bg-blue-500' : index % 3 === 1 ? 'w-2/3 bg-violet-500' : 'w-3/4 bg-emerald-500'}`} /></div>{index < strategyBlocks.length - 1 ? <ArrowRight size={17} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 sm:block" /> : null}</article>)}
          </div>
          <div className="relative mt-14 rounded-[34px] bg-slate-950 p-6 text-white"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-violet-300">Posture d’assemblage</p><h3 className="mt-2 text-xl font-black">Sortie analytique versionnée</h3><p className="mt-2 max-w-2xl text-[10px] leading-5 text-slate-300">Chaque alternative conserve hypothèses, preuves, contraintes, scores, version et filiation d’audit avant de quitter le laboratoire.</p></div><SChip tone="emerald">Exécution externe verrouillée</SChip></div></div>
        </section>

        <aside className="space-y-5">
          <div><SChip tone="amber"><GitCompareArrows size={11} /> Superposition des alternatives</SChip><h2 className="mt-3 text-2xl font-black tracking-[-.04em]">Comparer les architectures concurrentes couche par couche.</h2></div>
          {alternatives.map((alternative, index) => <article key={alternative.code} className={`relative overflow-hidden rounded-[34px] border p-6 shadow-[0_20px_55px_rgba(15,23,42,.07)] ${alternative.accent} ${index === 1 ? 'ml-5' : index === 2 ? 'ml-10' : ''}`}><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-[18px] bg-slate-950 text-lg font-black text-white">{alternative.code}</span><div className="text-right"><p className="text-3xl font-black">{alternative.confiance}%</p><p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-500">confiance</p></div></div><h3 className="mt-6 text-xl font-black">{alternative.title}</h3><p className="mt-3 text-xs leading-5 text-slate-600">{alternative.outcome}</p><div className="mt-5 grid grid-cols-3 gap-2"><MiniGauge label="Preuve" value={78 - index * 4} /><MiniGauge label="Capacité" value={84 - index * 8} /><MiniGauge label="Marge" value={72 + index * 5} /></div></article>)}
          <div className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,.06)]"><AiRuntimePanel /></div>
        </aside>
      </div>

      <section className="mt-7 rounded-[44px] border border-slate-200 bg-white p-7"><div className="flex items-start gap-4"><SIcon icon={Layers3} tone="blue" /><div><SChip tone="blue">Seize espaces stratégiques souverains</SChip><h2 className="mt-3 text-3xl font-black tracking-[-.05em]">Chaque angle stratégique reste accessible individuellement.</h2><p className="mt-2 max-w-4xl text-xs leading-6 text-slate-500">Objectif, file d’assemblage, contexte, sélection de commandes, stratégies générées, scénarios, comparaison, combinaisons, hypothèses, risques, capacité, versions, exécutions, traçabilité et validation conservent leur finalité backend. Ce laboratoire constitue leur point d’entrée visuel souverain.</p></div></div></section>
    </main>
  )
}

function LabFact({ label, value }: { label: string; value: string }) { return <div className="rounded-[22px] border border-white/10 bg-white/7 p-4 backdrop-blur"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p></div> }
function MiniGauge({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl bg-white/75 p-3 text-center"><Gauge size={14} className="mx-auto text-slate-400" /><p className="mt-2 text-sm font-black">{value}%</p><p className="text-[7px] font-black uppercase text-slate-400">{label}</p></div> }
