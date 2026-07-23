'use client'

import Link from 'next/link'
import { Activity, AlarmClock, BadgeCheck, BookOpenCheck, Boxes, Braces, CheckCircle2, Fingerprint, GitBranch, History, Network, Radar, RefreshCw, Route, ShieldCheck, Waypoints } from 'lucide-react'
import CommandsHero from '../../../../_components/hero-sovereignty/heroes/CommandsHero'
import { CommandPanel, CommandStat, SafetyLockBanner, formatDate } from '../CommandExperiencePrimitives'
import type { CommandRouteContext } from '../command-experience-types'

const routeCards = [
  { href: '/revenue-command-os/command-kernel/catalogue', title: 'Catalogue', description: 'Explorer les 3 000 commandes canoniques et les anchors protégés.', icon: BookOpenCheck, tone: 'violet', key: 'commands' },
  { href: '/revenue-command-os/command-kernel/taxonomy', title: 'Taxonomie', description: 'Lire les familles, domaines et zones de classification incomplète.', icon: Braces, tone: 'blue', key: 'families' },
  { href: '/revenue-command-os/command-kernel/routing', title: 'Routage', description: 'Comprendre les destinations, conditions et classes d’autorité.', icon: Route, tone: 'cyan', key: 'routing' },
  { href: '/revenue-command-os/command-kernel/triggers', title: 'Déclencheurs', description: 'Contrôler les événements, conditions et activations gouvernées.', icon: Radar, tone: 'amber', key: 'triggers' },
  { href: '/revenue-command-os/command-kernel/schedules', title: 'Planifications', description: 'Superviser cadence, prochaine exécution et conflits temporels.', icon: AlarmClock, tone: 'blue', key: 'schedules' },
  { href: '/revenue-command-os/command-kernel/graphs', title: 'Dépendances', description: 'Tracer les chemins critiques et relations amont/aval.', icon: Network, tone: 'violet', key: 'graphs' },
  { href: '/revenue-command-os/command-kernel/simulation', title: 'Simulation', description: 'Prévisualiser une propagation sans effet externe.', icon: Waypoints, tone: 'emerald', key: 'simulation' },
  { href: '/revenue-command-os/command-kernel/runs', title: 'Exécutions', description: 'Consulter le registre historique et les preuves d’exécution.', icon: History, tone: 'slate', key: 'runs' },
  { href: '/revenue-command-os/command-kernel/versions', title: 'Versions', description: 'Gouverner la lignée, compatibilité et restauration.', icon: GitBranch, tone: 'blue', key: 'versions' },
  { href: '/revenue-command-os/command-kernel/guardrails', title: 'Garde-fous', description: 'Inspecter les interdictions et périmètres d’autorité.', icon: ShieldCheck, tone: 'rose', key: 'guardrails' },
  { href: '/revenue-command-os/command-kernel/validation', title: 'Certification', description: 'Certifier l’intégrité complète du noyau.', icon: BadgeCheck, tone: 'emerald', key: 'validation' },
] as const

export default function CommandOverviewExperience({ data, loading, error, warnings, refresh }: CommandRouteContext) {
  const state = error ? 'DEGRADED' : loading && !data ? 'INITIALIZING' : !data ? 'OFFLINE' : data.dataMode === 'live' ? 'LIVE' : data.dataMode === 'degraded' ? 'DEGRADED' : 'SHADOW'
  const issues = data?.issues || []
  const readiness = data?.readiness
  return <div className="space-y-7" data-command-experience="overview-control-hall">
    <CommandsHero
      state={state}
      posture={data?.executionPosture || 'shadow'}
      authority="Doctrine canonique · effets externes 0"
      summary={data ? `Le noyau expose ${data.expectedCount} commandes canoniques, ${data.missingCount} commande(s) manquante(s) et ${data.driftCount} dérive(s). Les 12 anchors protégés restent explicitement séparés du registre canonique.` : 'Le registre canonique est en cours de résolution. Aucun état de santé n’est affirmé avant disponibilité de la source.'}
      freshness={data?.generatedAt ? formatDate(data.generatedAt) : undefined}
      metrics={[
        { label: 'Canoniques', value: data?.expectedCount ?? 3000, note: 'Commandes opérationnelles', tone: 'violet' },
        { label: 'Anchors protégés', value: 12, note: 'Compatibilité et fallback', tone: 'blue' },
        { label: 'Définitions totales', value: 3012, note: 'Interprétation contractuelle', tone: 'cyan' },
        { label: 'Dérive', value: data ? data.driftCount : '—', note: data ? `${data.missingCount} manquante(s)` : 'Non calculé', tone: data?.driftCount || data?.missingCount ? 'amber' : 'emerald' },
      ]}
      actions={[
        { label: loading ? 'Actualisation…' : 'Actualiser le noyau', onClick: () => void refresh(), disabled: loading, reason: loading ? 'Actualisation déjà en cours.' : undefined, kind: 'primary', icon: RefreshCw },
        { label: 'Ouvrir le catalogue', href: '/revenue-command-os/command-kernel/catalogue', kind: 'primary' },
        { label: 'Certifier le noyau', href: '/revenue-command-os/command-kernel/validation', kind: 'secondary' },
      ]}
      warning={error || warnings[0] || (!data ? 'Initialisation : l’intégrité persistée reste non calculée.' : data.missingCount || data.driftCount ? 'Registre dégradé : aucun script de réparation n’est déclenché automatiquement.' : 'Intégrité contractuelle préservée : 3 000 canoniques + 12 anchors protégés.')}
    />

    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CommandStat label="Persistées" value={data?.persistedCount ?? '—'} note="Overlay réellement disponible" tone="blue" />
      <CommandStat label="Graphes" value={data?.graphs.length ?? '—'} note="Chaînes de dépendance déclarées" tone="violet" />
      <CommandStat label="Planifications" value={data?.schedules.length ?? '—'} note="Cadences enregistrées" tone="cyan" />
      <CommandStat label="Certification" value={readiness ? `${readiness.overall}%` : '—'} note="État global calculé" tone={readiness && readiness.overall >= 90 ? 'emerald' : 'amber'} />
    </section>

    <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
      <CommandPanel title="Architecture opérationnelle" eyebrow="11 ateliers spécialisés" icon={Boxes} tone="violet">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {routeCards.map((route, index) => {
            const Icon = route.icon
            return <Link key={route.href} href={route.href} className="group rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white hover:shadow-[0_18px_44px_rgba(15,23,42,.08)]">
              <div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white"><Icon size={18} /></span><span className="text-[9px] font-black text-slate-400">{String(index + 1).padStart(2, '0')}</span></div>
              <h3 className="mt-4 text-sm font-black text-slate-950">{route.title}</h3>
              <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-600">{route.description}</p>
            </Link>
          })}
        </div>
      </CommandPanel>

      <div className="space-y-6">
        <CommandPanel title="Priorités d’intégrité" eyebrow="Anomalies ouvertes" icon={Activity} tone={issues.length ? 'amber' : 'emerald'}>
          <div className="space-y-3">
            {issues.slice(0, 4).map((issue) => <article key={issue.id} className="rounded-[20px] border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-black text-slate-950">{issue.title}</p><span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${issue.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>{issue.severity}</span></div><p className="mt-2 text-[10px] font-semibold leading-5 text-slate-600">{issue.detail}</p></article>)}
            {!issues.length ? <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-5"><CheckCircle2 size={20} className="text-emerald-700" /><p className="mt-3 text-sm font-black text-emerald-950">Aucun défaut bloquant déclaré.</p><p className="mt-1 text-[11px] font-semibold leading-5 text-emerald-900">La certification reste dépendante des contrôles réels du registre.</p></div> : null}
          </div>
        </CommandPanel>
        <SafetyLockBanner />
        <CommandPanel title="Source de vérité" eyebrow="Registre" icon={Fingerprint} tone="violet">
          <dl className="space-y-3 text-[11px]"><div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Mode de stockage</dt><dd className="font-black text-slate-950">{data?.storageMode || 'Indisponible'}</dd></div><div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Version du contrat</dt><dd className="font-black text-slate-950">{data?.contractVersion || '—'}</dd></div><div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">Posture</dt><dd className="font-black text-slate-950">{data?.executionPosture || 'shadow'}</dd></div></dl>
        </CommandPanel>
      </div>
    </div>
  </div>
}
