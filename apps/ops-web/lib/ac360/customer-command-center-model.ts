import { ac360CustomerModules, type Ac360CustomerModule } from './customer-ui-model'
import { ac360DedicatedModuleRoutes, getAc360DedicatedModuleRouteByModuleKey } from './customer-module-routes'
import { getAc360CustomerCommandsForModule, type Ac360CustomerCommand } from './customer-command-model'
import { getAc360ModuleLiveSignal, type Ac360CustomerLiveCockpit } from './customer-live-data'

export type Ac360SmartCommandKind = 'module' | 'commande' | 'vue' | 'alerte' | 'facturation' | 'gouvernance'
export type Ac360SmartCommandTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate'

export type Ac360SmartCommandResult = {
  id: string
  kind: Ac360SmartCommandKind
  label: string
  description: string
  moduleKey?: string
  routeHref?: string
  commandKey?: string
  priority: number
  tone: Ac360SmartCommandTone
  tags: string[]
  proof?: string
  billingImpact?: string
  recommendedAction?: string
}

export type Ac360SyncedSavedView = {
  id: string
  label: string
  moduleKey: string
  moduleLabel: string
  scope: 'direction' | 'finance' | 'admissions' | 'operations' | 'parents' | 'gouvernance'
  filterSummary: string
  ownerRole: string
  syncState: 'synchronisée' | 'locale' | 'à valider'
  usage: string
  href: string
}

export type Ac360CockpitIntelligenceSignal = {
  id: string
  label: string
  value: string
  explanation: string
  tone: Ac360SmartCommandTone
  moduleKeys: string[]
  actionLabel: string
}

const moduleRoute = (module: Ac360CustomerModule) => {
  const dedicated = getAc360DedicatedModuleRouteByModuleKey(module.key)
  return dedicated ? `/angelcare-360/customer/${dedicated.slug}` : `/angelcare-360/customer#${module.key}`
}

export function ac360NormalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s+/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function moduleTone(module: Ac360CustomerModule): Ac360SmartCommandTone {
  if (module.riskLevel === 'critical') return 'rose'
  if (module.riskLevel === 'high') return 'amber'
  if (module.status === 'addon' || module.status === 'metered') return 'violet'
  if (module.status === 'included') return 'emerald'
  return 'blue'
}

export function buildAc360SmartCommandResults(live: Ac360CustomerLiveCockpit | null): Ac360SmartCommandResult[] {
  const moduleResults = ac360CustomerModules.map((module) => {
    const signal = getAc360ModuleLiveSignal(live, module.key)
    return {
      id: `module:${module.key}`,
      kind: 'module' as const,
      label: module.label,
      description: module.headline,
      moduleKey: module.key,
      routeHref: moduleRoute(module),
      priority: module.riskLevel === 'high' || module.riskLevel === 'critical' ? 94 : 72,
      tone: moduleTone(module),
      tags: [module.group, module.status, module.riskLevel, module.primaryMetric, module.secondaryMetric],
      proof: signal?.connected ? `Runtime connecté · ${signal.endpointLabel}` : 'Fallback sécurisé · endpoint non bloquant',
      billingImpact: module.billingSignal,
      recommendedAction: module.nextBestActions[0] || module.commandActions[0],
    }
  })

  const commandResults = ac360CustomerModules.flatMap((module) => {
    const commands = getAc360CustomerCommandsForModule(module.key).slice(0, 4)
    return commands.map((command) => ({
      id: `commande:${command.key}`,
      kind: 'commande' as const,
      label: command.shortLabel || command.label,
      description: command.description,
      moduleKey: module.key,
      routeHref: moduleRoute(module),
      commandKey: command.key,
      priority: 88,
      tone: 'blue' as const,
      tags: [module.label, command.entitlementSignal, command.creditSignal, command.riskSignal],
      proof: `Pré-vol AC360 · ${command.wiringKey}`,
      billingImpact: command.creditSignal,
      recommendedAction: (command.recommendedNext ?? [])[0],
    }))
  })

  const governanceResults: Ac360SmartCommandResult[] = [
    {
      id: 'facturation:growth-menu',
      kind: 'facturation',
      label: 'Inspecter le Growth Menu et les add-ons',
      description: 'Ouvrir la surface commerciale qui explique plan, crédits, modules actifs, add-ons, restrictions et upgrades.',
      moduleKey: 'billing-growth',
      routeHref: '/angelcare-360/customer/facturation-growth-menu',
      priority: 96,
      tone: 'violet',
      tags: ['facturation', 'add-on', 'crédits', 'plan', 'upgrade', 'Sérénité'],
      proof: 'Gouvernance commerciale visible dans le cockpit client',
      billingImpact: 'Transforme les limites et verrous en parcours d’achat lisible.',
      recommendedAction: 'Ouvrir Facturation & Growth Menu',
    },
    {
      id: 'gouvernance:restrictions',
      kind: 'gouvernance',
      label: 'Voir les restrictions et blocages de compte',
      description: 'Contrôler les restrictions, les verrous politiques, les crédits faibles et les actions bloquées avant exécution.',
      routeHref: '/angelcare-360/customer/facturation-growth-menu',
      priority: 92,
      tone: 'amber',
      tags: ['restriction', 'politique', 'crédits', 'pré-vol', 'audit'],
      proof: 'Relié au runtime restrictions / policy / billing.',
      billingImpact: 'Aide le client à comprendre pourquoi une action est bloquée et comment la débloquer.',
      recommendedAction: 'Lancer un pré-vol sur l’action concernée',
    },
  ]

  return [...governanceResults, ...moduleResults, ...commandResults].sort((a, b) => b.priority - a.priority)
}

export function searchAc360SmartCommandResults(results: Ac360SmartCommandResult[], query: string, kind?: Ac360SmartCommandKind | 'tout') {
  const q = ac360NormalizeSearchText(query)
  return results
    .filter((result) => !kind || kind === 'tout' || result.kind === kind)
    .filter((result) => {
      if (!q) return true
      const haystack = ac360NormalizeSearchText([
        result.label,
        result.description,
        result.kind,
        result.proof,
        result.billingImpact,
        result.recommendedAction,
        ...(result.tags || []),
      ].filter(Boolean).join(' '))
      return q.split(' ').every((token) => haystack.includes(token))
    })
    .slice(0, 18)
}

export const ac360DefaultSavedViews: Ac360SyncedSavedView[] = [
  {
    id: 'finance-creances-critique',
    label: 'Créances critiques à relancer',
    moduleKey: 'finance',
    moduleLabel: 'Finance & Créances',
    scope: 'finance',
    filterSummary: 'Factures en retard · familles à risque · promesse absente',
    ownerRole: 'Direction / Finance',
    syncState: 'synchronisée',
    usage: 'Vue prioritaire pour protéger le cash-flow hebdomadaire.',
    href: '/angelcare-360/customer/finance-creances',
  },
  {
    id: 'admissions-hot-leads',
    label: 'Prospects chauds sans prochaine action',
    moduleKey: 'admissions',
    moduleLabel: 'Admissions CRM',
    scope: 'admissions',
    filterSummary: 'Lead chaud · suivi > 48h · visite non planifiée',
    ownerRole: 'Admissions / Direction',
    syncState: 'synchronisée',
    usage: 'Vue commerciale pour éviter de perdre les inscriptions potentielles.',
    href: '/angelcare-360/customer/admissions-crm',
  },
  {
    id: 'presence-anomalies-jour',
    label: 'Anomalies présence du jour',
    moduleKey: 'attendance',
    moduleLabel: 'Présence & Opérations',
    scope: 'operations',
    filterSummary: 'Sortie manquante · correction en attente · absence non justifiée',
    ownerRole: 'Direction / Vie scolaire',
    syncState: 'locale',
    usage: 'Vue d’exécution quotidienne pour clôturer proprement la journée.',
    href: '/angelcare-360/customer/presence-operations',
  },
  {
    id: 'parenttrust-risques-retention',
    label: 'Risques ParentTrust et rétention',
    moduleKey: 'parenttrust',
    moduleLabel: 'ParentTrust',
    scope: 'parents',
    filterSummary: 'Réclamations critiques · satisfaction basse · rendez-vous en attente',
    ownerRole: 'Direction / Relation parents',
    syncState: 'à valider',
    usage: 'Vue premium pour protéger la confiance parent et la réputation.',
    href: '/angelcare-360/customer/parenttrust',
  },
]

export function buildAc360CockpitIntelligenceSignals(live: Ac360CustomerLiveCockpit | null): Ac360CockpitIntelligenceSignal[] {
  const connectedCount = live?.endpointResults?.filter((endpoint) => endpoint.ok).length || 0
  const totalCount = live?.endpointResults?.length || 20
  const creditPercent = live?.billing.creditPercent ?? 82
  const restrictionCount = live?.billing.restrictionCount || 0

  return [
    {
      id: 'runtime-coverage',
      label: 'Couverture runtime',
      value: `${connectedCount}/${totalCount}`,
      explanation: 'Nombre d’endpoints client connectés ou sécurisés avec fallback. Sert à piloter la qualité de données affichée.',
      tone: connectedCount >= totalCount * 0.8 ? 'emerald' : 'amber',
      moduleKeys: ['command-center'],
      actionLabel: 'Inspecter les modules non connectés',
    },
    {
      id: 'credits-watch',
      label: 'Crédits et usage',
      value: `${creditPercent}%`,
      explanation: 'Niveau de crédits estimé pour communications, automatisations, rapports et actions à l’usage.',
      tone: creditPercent < 30 ? 'rose' : creditPercent < 60 ? 'amber' : 'blue',
      moduleKeys: ['billing-growth', 'communication', 'automation'],
      actionLabel: 'Ouvrir Growth Menu',
    },
    {
      id: 'restrictions-watch',
      label: 'Restrictions actives',
      value: String(restrictionCount),
      explanation: 'Restrictions de compte, politique ou facturation pouvant bloquer les actions sérieuses.',
      tone: restrictionCount > 0 ? 'rose' : 'emerald',
      moduleKeys: ['billing-growth'],
      actionLabel: 'Analyser les blocages',
    },
    {
      id: 'module-risk-map',
      label: 'Modules à attention',
      value: String(ac360CustomerModules.filter((module) => module.riskLevel === 'high' || module.riskLevel === 'critical').length),
      explanation: 'Modules où le cockpit détecte un risque business ou opérationnel élevé.',
      tone: 'amber',
      moduleKeys: ac360CustomerModules.filter((module) => module.riskLevel === 'high' || module.riskLevel === 'critical').map((module) => module.key),
      actionLabel: 'Prioriser les actions recommandées',
    },
  ]
}

export function getAc360CommandByKey(commandKey?: string): Ac360CustomerCommand | null {
  if (!commandKey) return null
  for (const module of ac360CustomerModules) {
    const command = getAc360CustomerCommandsForModule(module.key).find((candidate) => candidate.key === commandKey)
    if (command) return command
  }
  return null
}
