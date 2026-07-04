import type { Ac360CustomerLiveCockpit } from './customer-live-data'
import { ac360CustomerModules } from './customer-ui-model'

type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate'

export type Ac360TrainingModeStep = {
  id: string
  title: string
  detail: string
  owner: string
  duration: string
  proof: string
  actionLabel: string
}

export type Ac360AdoptionSignal = {
  label: string
  value: string
  detail: string
  tone: Tone
}

export type Ac360UsageAnalyticsItem = {
  label: string
  value: string
  detail: string
  tone: Tone
}

export type Ac360CustomerReadinessProfile = {
  roleLabel: string
  moduleKey: string
  score: number
  maturityLevel: string
  readinessLabel: string
  executiveSummary: string
  successOwner: string
  weeklyRitual: string
  trainingMode: Ac360TrainingModeStep[]
  usageAnalytics: Ac360UsageAnalyticsItem[]
  adoptionSignals: Ac360AdoptionSignal[]
  reportCards: Ac360AdoptionSignal[]
  recommendedActions: string[]
  blockedFriction: string[]
  governanceProof: string[]
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function moduleHealth(moduleKey: string, live: Ac360CustomerLiveCockpit | null) {
  const module = ac360CustomerModules.find((item) => item.key === moduleKey)
  const signal = live?.moduleSignals?.[moduleKey]
  return clamp((module?.healthScore || 78) + (signal?.healthDelta || 0))
}

function connectedCount(live: Ac360CustomerLiveCockpit | null) {
  return live?.endpointResults?.filter((item) => item.ok).length || 0
}

function endpointTotal(live: Ac360CustomerLiveCockpit | null) {
  return live?.endpointResults?.length || 20
}

function roleRoutine(roleLabel: string) {
  if (roleLabel.includes('Finance')) return 'Rituel finance : créances, promesses, relances, rapprochement et preuve de paiement.'
  if (roleLabel.includes('Admissions')) return 'Rituel admissions : nouveaux leads, visites, offres, relances et conversion en élève.'
  if (roleLabel.includes('Éducatrice') || roleLabel.includes('Enseignant')) return 'Rituel classe : présence, notes du jour, incidents, familles et tâches rapides mobile.'
  if (roleLabel.includes('Success')) return 'Rituel Success : activation client, adoption modules, support, risques et montée en compétence.'
  return 'Rituel direction : brief du jour, risques, trésorerie, parents, équipe, décisions et croissance.'
}

function roleOwner(roleLabel: string) {
  if (roleLabel.includes('Finance')) return 'Responsable Finance'
  if (roleLabel.includes('Admissions')) return 'Responsable Admissions'
  if (roleLabel.includes('Éducatrice') || roleLabel.includes('Enseignant')) return 'Équipe pédagogique / Classe'
  if (roleLabel.includes('Success')) return 'AngelCare Success Manager'
  return 'Direction établissement'
}

export function getAc360CustomerReadinessProfile(params: {
  roleLabel: string
  moduleKey: string
  live: Ac360CustomerLiveCockpit | null
}): Ac360CustomerReadinessProfile {
  const { roleLabel, moduleKey, live } = params
  const module = ac360CustomerModules.find((item) => item.key === moduleKey) || ac360CustomerModules[0]
  const health = moduleHealth(moduleKey, live)
  const connected = connectedCount(live)
  const total = endpointTotal(live)
  const runtimeCoverage = clamp((connected / Math.max(1, total)) * 100)
  const credit = clamp(live?.billing?.creditPercent ?? 82)
  const restrictionCount = live?.billing?.restrictionCount ?? 0
  const alertCount = live?.billing?.alertCount ?? 0
  const adoptionBase = clamp(Math.round((health * 0.42) + (runtimeCoverage * 0.28) + (credit * 0.18) + (restrictionCount === 0 ? 12 : 0) - Math.min(18, restrictionCount * 4) - Math.min(12, alertCount * 2)))

  const maturityLevel = adoptionBase >= 88 ? 'Excellence opérationnelle' : adoptionBase >= 74 ? 'Adoption solide' : adoptionBase >= 58 ? 'Activation en cours' : 'Risque d’adoption'
  const readinessLabel = adoptionBase >= 80 ? 'Prêt pour usage avancé' : adoptionBase >= 65 ? 'Prêt avec accompagnement' : 'Besoin de guidage prioritaire'

  return {
    roleLabel,
    moduleKey,
    score: adoptionBase,
    maturityLevel,
    readinessLabel,
    successOwner: roleOwner(roleLabel),
    weeklyRitual: roleRoutine(roleLabel),
    executiveSummary: `${module.label} est suivi avec un score d’adoption de ${adoptionBase}%. Le cockpit combine couverture runtime, usage, formation, restrictions et preuves pour éviter une adoption superficielle.`,
    trainingMode: [
      {
        id: 'tour-module',
        title: `Comprendre ${module.label}`,
        detail: 'Lecture guidée de la promesse métier, des KPIs, des vues sauvegardées, des tables live et des commandes gardées.',
        owner: roleOwner(roleLabel),
        duration: '8 min',
        proof: 'Tour terminé localement + module consulté',
        actionLabel: 'Lancer le tour module',
      },
      {
        id: 'execute-command',
        title: 'Exécuter une commande gardée',
        detail: 'Ouvrir une action, vérifier le pré-vol AC360, corriger le payload puis produire une référence preuve.',
        owner: roleOwner(roleLabel),
        duration: '12 min',
        proof: 'Pré-vol affiché + résultat ou blocage expliqué',
        actionLabel: 'Simuler une commande',
      },
      {
        id: 'review-report',
        title: 'Lire le rapport adoption',
        detail: 'Analyser couverture live, friction commerciale, restrictions, crédit, usage et prochaines actions recommandées.',
        owner: 'Direction + AngelCare Success',
        duration: '6 min',
        proof: 'Signal adoption consulté',
        actionLabel: 'Voir rapport adoption',
      },
    ],
    usageAnalytics: [
      { label: 'Couverture runtime', value: `${connected}/${total}`, detail: 'Endpoints client connectés ou fallback sécurisé.', tone: runtimeCoverage >= 75 ? 'emerald' : 'amber' },
      { label: 'Crédits disponibles', value: `${credit}%`, detail: 'Impact direct sur messages, automatisations, exports et actions à l’usage.', tone: credit >= 65 ? 'emerald' : credit >= 35 ? 'amber' : 'rose' },
      { label: 'Restrictions', value: String(restrictionCount), detail: 'Blocages compte, limites ou conditions de plan à surveiller.', tone: restrictionCount === 0 ? 'emerald' : restrictionCount <= 2 ? 'amber' : 'rose' },
      { label: 'Santé module', value: `${health}%`, detail: `${module.label} · signal live + maturité métier.`, tone: health >= 80 ? 'emerald' : health >= 65 ? 'amber' : 'rose' },
    ],
    adoptionSignals: [
      { label: 'Mode formation', value: 'actif', detail: 'Parcours guidé disponible pour réduire les erreurs opérationnelles.', tone: 'blue' },
      { label: 'Rituel rôle', value: roleOwner(roleLabel), detail: roleRoutine(roleLabel), tone: 'violet' },
      { label: 'Preuves audit', value: 'exigées', detail: 'Chaque commande importante doit produire une trace, un statut et une suite recommandée.', tone: 'slate' },
    ],
    reportCards: [
      { label: 'Score adoption', value: `${adoptionBase}%`, detail: maturityLevel, tone: adoptionBase >= 80 ? 'emerald' : adoptionBase >= 60 ? 'amber' : 'rose' },
      { label: 'Readiness client', value: readinessLabel, detail: 'Lecture combinée usage + formation + runtime + gouvernance.', tone: adoptionBase >= 80 ? 'emerald' : 'blue' },
      { label: 'Prochaine revue', value: '7 jours', detail: 'Revue Success recommandée pour mesurer activation réelle et blocages.', tone: 'violet' },
    ],
    recommendedActions: [
      `Former ${roleOwner(roleLabel)} sur les 3 commandes prioritaires de ${module.label}.`,
      'Transformer les états vides en tâches guidées plutôt qu’en pages mortes.',
      'Vérifier crédit, restrictions et add-ons avant toute campagne ou automatisation.',
      'Planifier une revue adoption hebdomadaire avec preuve, usage et risques.',
    ],
    blockedFriction: [
      restrictionCount > 0 ? 'Restrictions actives : proposer correction, upgrade ou intervention AngelCare.' : 'Aucune restriction dure détectée : maintenir la discipline de preuve.',
      credit < 40 ? 'Crédits faibles : recommander recharge ou bundle Sérénité.' : 'Crédits suffisants : encourager automatisations contrôlées.',
      runtimeCoverage < 70 ? 'Couverture runtime partielle : fallback visible, mais revue technique recommandée.' : 'Runtime suffisamment couvert : renforcer les usages métier.',
    ],
    governanceProof: [
      'Journal de preuves des commandes importantes.',
      'Rapport adoption par rôle et module.',
      'Lecture facturation / droits / usage dans les zones critiques.',
      'Formation guidée avant exécution sensible.',
    ],
  }
}
