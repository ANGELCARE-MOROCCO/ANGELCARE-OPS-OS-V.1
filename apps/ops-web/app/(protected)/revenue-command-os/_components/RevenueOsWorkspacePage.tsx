'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Boxes,
  CheckCircle2,
  CircleDashed,
  FileLock2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import type { RevenueOsWorkspaceKey } from '@/lib/revenue-command-os/types'
import { useRevenueOs } from './RevenueOsContext'
import RevenueOsIcon from './RevenueOsIcon'

const workspaceBlueprints: Record<RevenueOsWorkspaceKey, {
  eyebrow: string
  title: string
  statement: string
  columns: { title: string; items: string[] }[]
  nextPhase: string
}> = {
  'strategic-view': {
    eyebrow: 'Cockpit central',
    title: 'Vue stratégique',
    statement: 'La surface qui explique en temps réel ce que le moteur cherche à gagner, le raisonnement engagé, les validations et la progression de l’exécution.',
    columns: [{ title: 'Fondation active', items: ['Shell premium', 'Objective Command', 'État système', 'Recherche globale'] }],
    nextPhase: 'Revenue Doctrine & Memory Intelligence',
  },
  'digital-twin': {
    eyebrow: 'Commercial Truth Layer',
    title: 'Revenue Digital Twin',
    statement: 'Modèle machine-readable du portefeuille AngelCare: unités, offres, segments, décideurs, territoires, prix, capacités, parcours, dépendances et leviers de croissance.',
    columns: [
      { title: 'Portefeuille', items: ['Business units', 'Offres & formats', 'Bundles', 'Segments', 'Décideurs'] },
      { title: 'Faisabilité', items: ['Marchés', 'Prix protégés', 'Capacités', 'Contraintes', 'Dépendances'] },
      { title: 'Croissance', items: ['Saisonnalité', 'Cross-sell', 'Upsell', 'Renewal', 'Referral'] },
    ],
    nextPhase: 'Revenue Doctrine & Memory Intelligence',
  },
  'revenue-objectives': {
    eyebrow: 'Objective Command',
    title: 'Objectifs revenus',
    statement: 'Registre des mandats stratégiques avec priorité, horizon, marché, périmètre, propriétaire et mode d’autonomie autorisé.',
    columns: [
      { title: 'Contrat de l’objectif', items: ['Résultat attendu', 'Business unit', 'Marché cible', 'Horizon', 'Contraintes'] },
      { title: 'Gouvernance', items: ['Priorité', 'Propriétaire', 'Mode Shadow', 'Validation direction', 'Version'] },
      { title: 'Sortie future', items: ['Command graph', 'Stratégies concurrentes', 'Conseil de validation', 'Programme compilé'] },
    ],
    nextPhase: 'Strategy Brain & Command Kernel',
  },
  signals: {
    eyebrow: 'Signal Fabric',
    title: 'Signaux',
    statement: 'Contrat des événements normalisés qui réveilleront le moteur selon les changements du marché, du pipeline, de la capacité et du comportement client.',
    columns: [
      { title: 'Identité', items: ['Event ID global', 'Type', 'Agrégat', 'Horodatage', 'Corrélation'] },
      { title: 'Qualification', items: ['Sévérité', 'Confiance', 'Fraîcheur', 'Déduplication', 'Source'] },
      { title: 'Traitement futur', items: ['Routage', 'Cooldown', 'Retry', 'Dead letter', 'Context snapshot'] },
    ],
    nextPhase: 'Live Revenue Signal Fabric',
  },
  strategies: {
    eyebrow: 'Strategy Assembly',
    title: 'Stratégies',
    statement: 'Espace futur de génération, comparaison, critique, optimisation, versioning et approbation des stratégies de domination commerciale.',
    columns: [
      { title: 'Alternatives', items: ['Fast conversion', 'Premium positioning', 'Partnership-led capture', 'Seasonal urgency'] },
      { title: 'Preuves', items: ['Hypothèses', 'Sources', 'Contraintes', 'Capacité', 'Risques'] },
      { title: 'Décision', items: ['Score', 'Red-team', 'Optimisation', 'Approbation', 'Version finale'] },
    ],
    nextPhase: 'Revenue Strategy Assembly Engine',
  },
  'intelligent-commands': {
    eyebrow: 'Command Kernel',
    title: 'Commandes intelligentes',
    statement: 'Fondation du catalogue de 3 000 objets de commande versionnés, gouvernés et routés selon le contexte commercial réel.',
    columns: [
      { title: 'Identité commande', items: ['Code', 'Famille', 'Objectif', 'Version', 'Statut'] },
      { title: 'Activation', items: ['Manuelle', 'Planifiée', 'Événementielle', 'Conditionnelle', 'Command graph'] },
      { title: 'Contrôle', items: ['Contexte requis', 'Outils permis', 'Validateurs', 'Output schema', 'Performance'] },
    ],
    nextPhase: 'Golden 300 Revenue Commands',
  },
  'active-programs': {
    eyebrow: 'Revenue Programs',
    title: 'Programmes actifs',
    statement: 'Programmes revenus approuvés, organisés en plays, campagnes, vagues, comptes cibles et boucles d’adaptation.',
    columns: [
      { title: 'Structure', items: ['Play', 'Programme', 'Campagne', 'Vague', 'Account plan'] },
      { title: 'Progression', items: ['Statut', 'Confiance', 'Blocages', 'Résultats', 'Décision suivante'] },
      { title: 'Gouvernance', items: ['Owner', 'Budget', 'Capacité', 'Approbations', 'Stop conditions'] },
    ],
    nextPhase: 'Strategy-to-Mission Compiler',
  },
  'compiled-missions': {
    eyebrow: 'Mission Compiler',
    title: 'Missions compilées',
    statement: 'Sortie structurée et déterministe des stratégies validées vers les programmes, missions, tâches, étapes, preuves et résultats.',
    columns: [
      { title: 'Compilation', items: ['Objectif', 'Play', 'Campagne', 'Mission', 'Tâche'] },
      { title: 'Exécution', items: ['Responsable', 'Échéance', 'Dépendance', 'Script', 'Preuve'] },
      { title: 'Récupération', items: ['Retry', 'Fallback', 'Escalade', 'Reassignment', 'Stop rule'] },
    ],
    nextPhase: 'SaaS Propagation & Autopilot',
  },
  approvals: {
    eyebrow: 'Human Authority',
    title: 'Validations',
    statement: 'Centre des décisions humaines obligatoires avant tout engagement externe, financier, contractuel ou sensible.',
    columns: [
      { title: 'Action proposée', items: ['Motif', 'Données utilisées', 'Risque', 'Impact', 'Autorité requise'] },
      { title: 'Décision', items: ['Approuver', 'Modifier', 'Refuser', 'Déléguer', 'Expirer'] },
      { title: 'Traçabilité', items: ['Décideur', 'Horodatage', 'Version', 'Commentaire', 'Résultat'] },
    ],
    nextPhase: 'Validation Council & Approval Center',
  },
  exceptions: {
    eyebrow: 'Exception Control',
    title: 'Exceptions',
    statement: 'Contrôle des données manquantes, contradictions, blocages, échecs d’outils, retries et scénarios de récupération.',
    columns: [
      { title: 'Détection', items: ['Code erreur', 'Sévérité', 'Source', 'Corrélation', 'Contexte'] },
      { title: 'Récupération', items: ['Retry', 'Fallback', 'Dead letter', 'Escalade', 'Kill switch'] },
      { title: 'Clôture', items: ['Cause', 'Action', 'Responsable', 'Résultat', 'Prévention'] },
    ],
    nextPhase: 'Durable Queue & Recovery Runtime',
  },
  'memory-learning': {
    eyebrow: 'Institutional Memory',
    title: 'Mémoire & apprentissage',
    statement: 'Base versionnée des doctrines, stratégies, décisions, résultats et apprentissages mesurés qui renforcent les futures recommandations.',
    columns: [
      { title: 'Doctrine', items: ['Owner', 'Version', 'Approbation', 'Effective date', 'Retrait'] },
      { title: 'Expérience', items: ['Stratégie', 'Segment', 'Résultat', 'Cause', 'Leçon'] },
      { title: 'Réutilisation', items: ['Similarité', 'Confiance', 'Applicabilité', 'Command ranking', 'Audit'] },
    ],
    nextPhase: 'Doctrine Memory & Outcome Learning',
  },
  audit: {
    eyebrow: 'Immutable Traceability',
    title: 'Audit',
    statement: 'Journal append-only des événements, décisions, actions, versions, résultats, erreurs et changements de configuration Revenue OS.',
    columns: [
      { title: 'Événement', items: ['Event ID', 'Action', 'Ressource', 'Acteur', 'Horodatage'] },
      { title: 'Résultat', items: ['Succès', 'Bloqué', 'Échec', 'Pending', 'Métadonnées'] },
      { title: 'Gouvernance', items: ['Immutabilité', 'Rétention', 'Recherche', 'Export', 'Corrélation'] },
    ],
    nextPhase: 'AI Tracing & Tool-call Audit',
  },
  settings: {
    eyebrow: 'Runtime Governance',
    title: 'Paramètres',
    statement: 'Configuration contrôlée des environnements, modes d’autonomie, feature flags, permissions, rétention et frontières de sécurité.',
    columns: [
      { title: 'Environnements', items: ['Development', 'Staging', 'Production', 'Secrets serveur', 'Isolation'] },
      { title: 'Autonomie', items: ['Shadow', 'Recommend', 'Approval-gated', 'Limited autonomy', 'Kill switch'] },
      { title: 'Sécurité', items: ['Least privilege', 'Audit', 'Data minimization', 'Retention', 'Rollback'] },
    ],
    nextPhase: 'Production Governance & Model Registry',
  },
}

export default function RevenueOsWorkspacePage({ workspaceKey }: { workspaceKey: RevenueOsWorkspaceKey }) {
  const { bootstrap } = useRevenueOs()
  const workspace = bootstrap.workspaces.find((item) => item.key === workspaceKey)
  const blueprint = workspaceBlueprints[workspaceKey]

  if (!workspace || !blueprint) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-8"><TriangleAlert className="text-amber-600" /><h2 className="mt-4 text-xl font-black">Workspace non enregistré</h2><Link href="/revenue-command-os" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-blue-700"><ArrowLeft size={16} /> Retour au cockpit</Link></div>
  }

  const relatedFlags = bootstrap.featureFlags.filter((flag) => flag.key.includes(workspaceKey.split('-')[0]) || flag.key.startsWith('revenue_os.')).slice(0, 4)

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,.055)]">
        <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_360px]">
          <div>
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><RevenueOsIcon name={workspace.icon} size={23} /></span><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-700">{blueprint.eyebrow}</p><p className="mt-1 text-xs font-bold text-slate-400">{workspace.key}</p></div></div>
            <h2 className="mt-6 text-3xl font-black tracking-[-.035em] text-slate-950 sm:text-4xl">{blueprint.title}</h2>
            <p className="mt-4 max-w-4xl text-[15px] leading-7 text-slate-600">{blueprint.statement}</p>
            <div className="mt-6 flex flex-wrap gap-2">{workspace.contractScope.map((item) => <span key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-600">{item}</span>)}</div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Maturité actuelle</span><span className="rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-black uppercase text-blue-700">{workspace.status}</span></div>
            <h3 className="mt-4 text-lg font-black text-slate-950">Fondation contractée</h3>
            <p className="mt-2 text-xs leading-6 text-slate-500">La navigation, la permission, la définition, le statut et la portée de ce workspace sont enregistrés. Les logiques avancées restent strictement rattachées à leur phase.</p>
            <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4"><p className="text-[10px] font-black uppercase tracking-[.15em] text-violet-700">Extension prévue</p><p className="mt-2 text-sm font-black text-violet-950">{blueprint.nextPhase}</p></div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {blueprint.columns.map((column, index) => <div key={column.title} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,.035)]"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white">{index + 1}</span><CircleDashed size={19} className="text-slate-300" /></div><h3 className="mt-5 text-base font-black text-slate-950">{column.title}</h3><div className="mt-4 space-y-2.5">{column.items.map((item) => <div key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600"><CheckCircle2 size={15} className="text-emerald-600" />{item}</div>)}</div></div>)}
      </section>

      {workspaceKey === 'revenue-objectives' ? (
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,.045)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-[10px] font-black uppercase tracking-[.17em] text-blue-700">Registry</p><h3 className="mt-1 text-lg font-black text-slate-950">Objectifs disponibles</h3></div><button onClick={() => window.dispatchEvent(new CustomEvent('revenue-os:open-objective'))} className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white">Nouvel objectif</button></div>
          <div className="divide-y divide-slate-100">{bootstrap.objectives.map((objective) => <div key={objective.id} className="grid gap-4 px-6 py-5 lg:grid-cols-[160px_1fr_180px]"><div><p className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{objective.code}</p><span className="mt-2 inline-block rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-black uppercase text-blue-700">{objective.status}</span></div><div><h4 className="text-sm font-black text-slate-950">{objective.title}</h4><p className="mt-2 text-xs leading-6 text-slate-500">{objective.mandate}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-[.1em] text-slate-400">{objective.businessUnit} · {objective.targetMarket}</p></div><div className="lg:text-right"><p className="text-xs font-black text-slate-800">{objective.horizon}</p><p className="mt-1 text-[10px] text-slate-500">Owner: {objective.owner}</p><p className="mt-3 text-[10px] font-black uppercase text-emerald-700">{objective.executionMode}</p></div></div>)}</div>
        </section>
      ) : null}

      {workspaceKey === 'settings' ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {bootstrap.featureFlags.map((flag) => <div key={flag.key} className="rounded-[24px] border border-slate-200 bg-white p-5"><div className="flex items-start gap-4"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${flag.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{flag.locked ? <FileLock2 size={20} /> : <Sparkles size={20} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-slate-950">{flag.label}</h3><span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase ${flag.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{flag.enabled ? 'Activé' : 'Désactivé'}</span>{flag.locked ? <span className="rounded-lg bg-amber-50 px-2 py-1 text-[9px] font-black uppercase text-amber-700">Verrouillé</span> : null}</div><p className="mt-2 text-xs leading-6 text-slate-500">{flag.description}</p><p className="mt-2 font-mono text-[10px] text-slate-400">{flag.key} · {flag.environment} · {flag.riskClass}</p></div></div></div>)}
        </section>
      ) : null}

      {workspaceKey === 'audit' ? (
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,.045)]">
          <div className="border-b border-slate-100 px-6 py-5"><p className="text-[10px] font-black uppercase tracking-[.17em] text-blue-700">Audit Events</p><h3 className="mt-1 text-lg font-black text-slate-950">Journal append-only</h3></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-[.1em] text-slate-400"><th className="px-6 py-3">Event ID</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Acteur</th><th className="px-4 py-3">Ressource</th><th className="px-4 py-3">Résultat</th><th className="px-6 py-3">Horodatage</th></tr></thead><tbody>{bootstrap.auditEvents.map((event) => <tr key={event.id} className="border-b border-slate-100 text-xs"><td className="px-6 py-4 font-mono text-[10px] font-bold text-slate-500">{event.eventId}</td><td className="px-4 py-4 font-black text-slate-800">{event.action}</td><td className="px-4 py-4 text-slate-600">{event.actor}</td><td className="px-4 py-4 text-slate-600">{event.resourceType}</td><td className="px-4 py-4"><span className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase text-emerald-700">{event.outcome}</span></td><td className="px-6 py-4 text-slate-500">{new Date(event.createdAt).toLocaleString('fr-FR')}</td></tr>)}</tbody></table></div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5"><ShieldCheck className="text-emerald-700" /><h3 className="mt-4 text-sm font-black text-emerald-950">Ce qui est réel maintenant</h3><p className="mt-2 text-xs leading-6 text-emerald-800">Route, shell, permission, registry, feature flags, contrats de statut, Objective Command, recherche et audit foundation.</p></div>
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5"><FileLock2 className="text-amber-700" /><h3 className="mt-4 text-sm font-black text-amber-950">Ce qui reste verrouillé</h3><p className="mt-2 text-xs leading-6 text-amber-800">Toute communication externe, engagement tarifaire, compilation ou propagation opérationnelle.</p></div>
        <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-5"><BookOpenCheck className="text-blue-700" /><h3 className="mt-4 text-sm font-black text-blue-950">Prochaine extension</h3><p className="mt-2 text-xs leading-6 text-blue-800">{blueprint.nextPhase}, sans modifier ni contourner le contrat canonique cumulatif des Phases 1 et 2.</p></div>
      </section>

      <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><Link href="/revenue-command-os" className="inline-flex items-center gap-2 text-sm font-black text-slate-700"><ArrowLeft size={16} /> Retour au cockpit</Link><Link href={workspace.href === '/revenue-command-os/settings' ? '/revenue-command-os/audit' : '/revenue-command-os/settings'} className="inline-flex items-center gap-2 text-sm font-black text-blue-700">Inspecter la gouvernance <ArrowRight size={16} /></Link></div>
    </div>
  )
}
