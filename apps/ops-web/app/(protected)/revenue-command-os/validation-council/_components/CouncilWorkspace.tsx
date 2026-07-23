'use client'

import { fetchRevenueOsJson } from '@/lib/revenue-command-os/client-http'
import { useMemo, useState } from 'react'
import {
  BadgeCheck, BrainCircuit, CheckCircle2, CircleDot, Gavel, Loader2, Scale, ShieldAlert,
  ShieldCheck, Sparkles, Swords, Target, UserRoundCheck,
} from 'lucide-react'
import { SChip, SIcon, STraceLink } from '../../_components/visual-sovereignty/SovereignPrimitives'
import sovereigntyStyles from '../../_components/visual-sovereignty/Sovereignty.module.css'
import CouncilHero from '../../_components/hero-sovereignty/heroes/CouncilHero'

const agents = [
  ['Intelligence Revenue en chef', 'Alignement & synthèse', 'blue'],
  ['Intelligence marché', 'Marché & opportunité', 'cyan'],
  ['Offre & monétisation', 'Offre, prix & valeur', 'violet'],
  ['Conversion commerciale', 'Conversion & décisionnaires', 'emerald'],
  ['Capacité & livraison', 'Capacité & livraison', 'amber'],
  ['Risque revenue & marge', 'Marge, paiement & downside', 'rose'],
  ['Marque & autorité', 'Marque, claims & autorité', 'blue'],
  ['Red Team commerciale', 'Attaques adverses', 'rose'],
  ['Optimisation exécutive', 'Correction & version optimisée', 'violet'],
  ['Audit indépendant', 'Audit indépendant', 'emerald'],
] as const

export function CouncilWorkspace() {
  const [strategyId, setStrategyId] = useState('')
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const scores = useMemo(() => data?.classification?.score || {}, [data])

  async function run() {
    setState('running'); setError('')
    try {
      const payload = await fetchRevenueOsJson<any>('/api/revenue-command-os/validation-council/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': `council-${strategyId}` },
        body: JSON.stringify({ strategyId }),
      }, { timeoutMs: 30000, fallbackMessage: 'Le Conseil n’a pas pu terminer la délibération.' })
      if (!payload.data) throw new Error('Le Conseil n’a retourné aucun dossier de délibération.')
      setData(payload.data); setState('done')
    } catch (caught) { setError(caught instanceof Error ? caught.message : String(caught)); setState('error') }
  }

  return (
    <div className="space-y-7">
      <>
      <CouncilHero
        state={state === 'running' ? 'INITIALIZING' : state === 'error' ? 'DEGRADED' : data ? 'LIVE' : 'EMPTY'}
        posture="Délibération indépendante"
        authority="Conseil stratégique · aucune action externe"
        summary={data?.classification?.reason || (strategyId ? 'Le dossier est identifié et attend l’ouverture d’une délibération gouvernée.' : 'Aucun dossier stratégique n’est actuellement en audience. Une stratégie persistée doit être désignée avant délibération.')}
        metrics={[
          { label: 'Dossiers éligibles', value: data ? 1 : '—', note: data ? 'Dossier délibéré' : 'Source non chargée', tone: 'violet' },
          { label: 'Sièges', value: 10, note: 'Positions indépendantes', tone: 'blue' },
          { label: 'Preuves non résolues', value: data?.disagreements?.length ?? '—', note: data ? 'Désaccords visibles' : 'Non calculé', tone: data?.disagreements?.length ? 'amber' : 'slate' },
          { label: 'Dernière résolution', value: data?.classification?.classification || '—', note: data ? 'Résolution formelle' : 'Aucune audience', tone: data ? 'emerald' : 'slate' },
        ]}
        actions={[{ label: state === 'running' ? 'Délibération…' : 'Ouvrir la délibération', onClick: () => void run(), disabled: !strategyId || state === 'running', reason: !strategyId ? 'Un identifiant de stratégie persistée est requis.' : state === 'running' ? 'Le Conseil délibère déjà.' : undefined, kind: 'primary', icon: Scale }]}
        warning={error || 'Shadow — chaque résolution reste interne, auditée et sans effet commercial externe.'}
      />
      <div className="mt-4 rounded-[26px] border border-violet-200 bg-white p-5 shadow-sm">
        <label className="block"><span className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Identifiant du dossier stratégique</span><input value={strategyId} onChange={(event) => setStrategyId(event.target.value)} placeholder="UUID de la stratégie persistée" className="mt-3 h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-200" /></label>
      </div>
      </>

      <section className="relative min-h-[880px] overflow-hidden rounded-[52px] border border-violet-200 bg-white p-5 shadow-[0_35px_110px_rgba(76,29,149,.09)] sm:p-8">
        <div className={`absolute inset-0 opacity-45 ${sovereigntyStyles.dotField}`} />
        <div className="relative grid min-h-[820px] place-items-center">
          <div className="absolute grid h-[360px] w-[360px] max-w-[70vw] place-items-center rounded-full border border-violet-200 bg-gradient-to-br from-white to-violet-50 shadow-[0_30px_90px_rgba(76,29,149,.12)]">
            <div className="max-w-[250px] text-center"><SIcon icon={Target} tone="violet" className="mx-auto h-14 w-14 rounded-[20px]" /><p className="mt-4 text-[9px] font-black uppercase tracking-[.16em] text-violet-700">Tribune stratégique</p><h2 className="mt-2 text-2xl font-black tracking-[-.045em]">{data?.strategy?.title || (strategyId ? `Dossier ${strategyId.slice(0, 8)}…` : 'Aucune stratégie en audience')}</h2><p className="mt-3 text-[10px] leading-5 text-slate-500">{data?.classification?.reason || 'Lancez le Conseil pour afficher les positions, fractures, attaques et résolution.'}</p>{data?.classification?.classification ? <SChip tone="emerald" className="mt-4">{data.classification.classification}</SChip> : <SChip tone="slate" className="mt-4">en attente de preuves</SChip>}</div>
          </div>

          {agents.map(([name, scope, tone], index) => {
            const angle = (index / agents.length) * Math.PI * 2 - Math.PI / 2
            const radiusX = 480; const radiusY = 330
            const review = data?.reviews?.[index]
            return <article key={name} className={`absolute w-52 rounded-[28px] border bg-white/94 p-4 shadow-[0_18px_50px_rgba(15,23,42,.08)] backdrop-blur transition ${review ? 'border-emerald-200' : 'border-slate-200'}`} style={{ left: `calc(50% + ${Math.cos(angle) * radiusX}px - 104px)`, top: `calc(50% + ${Math.sin(angle) * radiusY}px - 90px)` }}><div className="flex items-center justify-between"><SIcon icon={index === 7 ? Swords : index === 9 ? UserRoundCheck : BrainCircuit} tone={tone} className="h-9 w-9 rounded-xl" /><span className={`h-2.5 w-2.5 rounded-full ${review ? 'bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,.65)]' : 'bg-slate-300'}`} /></div><p className="mt-4 text-[8px] font-black uppercase tracking-[.12em] text-slate-400">Siège {String(index + 1).padStart(2, '0')}</p><h3 className="mt-1 text-xs font-black">{name}</h3><p className="mt-1 text-[9px] leading-4 text-slate-500">{scope}</p><p className={`mt-3 line-clamp-3 text-[9px] font-bold ${review ? 'text-emerald-700' : 'text-slate-400'}`}>{review?.verdict || 'En attente de délibération'}</p></article>
          })}
        </div>
      </section>

      {data ? <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-[42px] border border-slate-200 bg-white p-6 shadow-[0_25px_75px_rgba(15,23,42,.07)]"><div className="flex items-center gap-4"><SIcon icon={BadgeCheck} tone="emerald" /><div><SChip tone="emerald">Résolution du Conseil</SChip><h2 className="mt-2 text-3xl font-black tracking-[-.05em]">{data.classification?.classification || 'Classification en attente'}</h2></div></div><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">{Object.entries(scores).map(([key, value]) => <Score key={key} label={key} value={key === 'confidence' ? Math.round(Number(value) * 100) : Number(value)} />)}</div><div className="mt-6"><STraceLink traceId={data.traceId || data.councilRunId || strategyId} /></div></section>
        <div className="space-y-5"><section className="rounded-[36px] border border-rose-200 bg-rose-50 p-6"><div className="flex items-center gap-3"><SIcon icon={Swords} tone="rose" /><div><p className="text-[9px] font-black uppercase tracking-[.13em] text-rose-700">Attaques Red Team</p><p className="mt-1 text-3xl font-black text-rose-950">{data.redTeamAttacks?.length || 0}</p></div></div><p className="mt-4 text-xs leading-6 text-rose-800">Les attaques adverses sont conservées comme preuves; aucune action externe n’est exécutée.</p></section><section className="rounded-[36px] border border-amber-200 bg-amber-50 p-6"><div className="flex items-center gap-3"><SIcon icon={ShieldAlert} tone="amber" /><div><p className="text-[9px] font-black uppercase tracking-[.13em] text-amber-700">Désaccords</p><p className="mt-1 text-3xl font-black text-amber-950">{data.disagreements?.length || 0}</p></div></div><p className="mt-4 text-xs leading-6 text-amber-800">Fractures nécessitant correction, condition ou escalade exécutive.</p></section></div>
      </div> : null}

      <section className="rounded-[42px] border border-slate-200 bg-white p-6"><div className="grid gap-4 md:grid-cols-3"><TribunalProof icon={CheckCircle2} title="Positions indépendantes" detail="Chaque siège produit son propre verdict et ses preuves." /><TribunalProof icon={Sparkles} title="Optimisation exécutive" detail="Les corrections produisent une stratégie versionnée, jamais un écrasement silencieux." /><TribunalProof icon={CircleDot} title="Résolution formelle" detail="Décision, conditions, désaccords et trace restent inspectables." /></div></section>
    </div>
  )
}

function Score({ label, value }: { label: string; value: number }) { const safe = Number.isFinite(value) ? value : 0; return <div className="rounded-[22px] border border-slate-200 p-4"><div className="flex items-center justify-between"><p className="truncate text-[8px] font-black uppercase text-slate-400">{label}</p><p className="text-sm font-black">{safe}</p></div><div className="mt-3 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(2, Math.min(100, safe))}%` }} /></div></div> }
function TribunalProof({ icon: Icon, title, detail }: { icon: typeof CheckCircle2; title: string; detail: string }) { return <div className="flex items-start gap-4 rounded-[26px] bg-slate-50 p-5"><SIcon icon={Icon} tone="blue" /><div><h3 className="text-xs font-black">{title}</h3><p className="mt-2 text-[10px] leading-5 text-slate-500">{detail}</p></div></div> }
