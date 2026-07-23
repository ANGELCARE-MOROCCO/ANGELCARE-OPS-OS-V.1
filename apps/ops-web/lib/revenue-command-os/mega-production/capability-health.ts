import type {
  ActivationLevel,
  MegaActionAvailability,
  MegaActionAvailabilityMap,
  MegaCapabilityHealth,
  MegaCapabilityKey,
  MegaMetricAvailability,
  MegaSourceHealth,
  MegaTruthMode,
} from './types'

const capabilityDefinitions: ReadonlyArray<{
  key: MegaCapabilityKey
  label: string
  sources: string[]
}> = [
  { key: 'learning', label: 'Apprentissage et mémoire des résultats', sources: ['outcomes', 'commandPerformance', 'segments'] },
  { key: 'experimentation', label: 'Expérimentation contrôlée', sources: ['experiments'] },
  { key: 'attribution', label: 'Attribution causale', sources: ['attributions'] },
  { key: 'forecasting', label: 'Prévisions et anomalies', sources: ['calibrations', 'anomalies'] },
  { key: 'runtime', label: 'Runtime durable', sources: ['workers', 'queues'] },
  { key: 'governance', label: 'Registres et politiques', sources: ['registries', 'confidencePolicies'] },
  { key: 'quality', label: 'Évaluations et non-régression', sources: ['evaluations'] },
  { key: 'safety', label: 'Sécurité et arrêts d’urgence', sources: ['emergencyStops', 'securityReviews'] },
  { key: 'activation', label: 'Activation de production', sources: ['activations'] },
  { key: 'recovery', label: 'Reprise et continuité', sources: ['drRuns'] },
  { key: 'finops', label: 'Coûts et budgets', sources: ['costUsage', 'costBudgets'] },
]

function healthFor(sourceHealth: MegaSourceHealth[], key: string): MegaSourceHealth | undefined {
  return sourceHealth.find((source) => source.key === key)
}

export function truthModeForSources(sourceHealth: MegaSourceHealth[], sourceKeys: string[]): MegaTruthMode {
  const selected = sourceKeys.map((key) => healthFor(sourceHealth, key)).filter(Boolean) as MegaSourceHealth[]
  if (!selected.length) return 'unavailable'
  const healthy = selected.filter((source) => source.ok).length
  if (healthy === selected.length) return 'live'
  if (healthy === 0) return 'unavailable'
  return 'degraded'
}

export function buildMegaCapabilityHealth(sourceHealth: MegaSourceHealth[]): MegaCapabilityHealth[] {
  return capabilityDefinitions.map((definition) => {
    const sources = definition.sources.map((key) => healthFor(sourceHealth, key)).filter(Boolean) as MegaSourceHealth[]
    const healthySources = sources.filter((source) => source.ok)
    const failedSources = sources.filter((source) => !source.ok)
    const state = truthModeForSources(sourceHealth, definition.sources)
    const message = state === 'live'
      ? `${healthySources.length}/${sources.length} sources disponibles.`
      : state === 'degraded'
        ? `${healthySources.length}/${sources.length} sources disponibles. Les fonctions non dépendantes restent utilisables.`
        : `Les sources nécessaires à cette capacité sont indisponibles.`

    return {
      key: definition.key,
      label: definition.label,
      state,
      sourceKeys: definition.sources,
      healthySources: healthySources.map((source) => source.key),
      failedSources: failedSources.map((source) => source.key),
      message,
    }
  })
}

function availability(
  sourceHealth: MegaSourceHealth[],
  requiredSources: string[],
  allowedMessage: string,
  blockedMessage: string,
  options: { maxActivationLevel?: ActivationLevel } = {},
): MegaActionAvailability {
  const missingSources = requiredSources.filter((key) => healthFor(sourceHealth, key)?.ok !== true)

  return {
    allowed: missingSources.length === 0,
    reason: missingSources.length === 0 ? allowedMessage : blockedMessage,
    requiredSources,
    missingSources,
    ...(options.maxActivationLevel === undefined ? {} : { maxActivationLevel: options.maxActivationLevel }),
  }
}

export function buildMegaActionAvailability(
  sourceHealth: MegaSourceHealth[],
  externalActionsConfigured: boolean,
): MegaActionAvailabilityMap {
  const emergencyStop = availability(
    sourceHealth,
    ['emergencyStops'],
    'Le contrôle d’arrêt d’urgence est disponible et reste audité.',
    'Le registre des arrêts d’urgence est indisponible. Consultez l’observabilité avant de réessayer.',
  )

  const activationStorage = availability(
    sourceHealth,
    ['activations'],
    'Une demande d’activation peut être créée en statut review.',
    'Le registre d’activation est indisponible. Aucune demande ne peut être persistée.',
  )

  const advancedActivationEvidence = ['securityReviews', 'evaluations', 'drRuns', 'emergencyStops']
  const advancedReady = advancedActivationEvidence.every((key) => healthFor(sourceHealth, key)?.ok)
  const maxActivationLevel: ActivationLevel = advancedReady ? 6 : 4

  const activationReview: MegaActionAvailability = {
    ...activationStorage,
    maxActivationLevel,
    reason: activationStorage.allowed
      ? advancedReady
        ? 'Les demandes d’activation L0 à L6 sont disponibles en review. Toute activation reste soumise aux approbations.'
        : 'Les demandes L0 à L4 restent disponibles. L5 et L6 exigent sécurité, évaluations, reprise et arrêts d’urgence entièrement disponibles.'
      : activationStorage.reason,
    missingSources: activationStorage.allowed
      ? advancedActivationEvidence.filter((key) => !healthFor(sourceHealth, key)?.ok)
      : activationStorage.missingSources,
  }

  return {
    internalInspection: {
      allowed: sourceHealth.some((source) => source.ok),
      reason: 'La consultation interne, le diagnostic et les espaces indépendants des sources défaillantes restent disponibles.',
      requiredSources: [],
      missingSources: [],
    },
    emergencyStop,
    activationReview,
    externalExecution: {
      allowed: Boolean(externalActionsConfigured) && sourceHealth.every((source) => source.ok),
      reason: externalActionsConfigured
        ? 'Les effets externes nécessitent des sources intégralement disponibles et les approbations applicables.'
        : 'Les actions externes restent désactivées par le contrat Revenue OS.',
      requiredSources: sourceHealth.map((source) => source.key),
      missingSources: sourceHealth.filter((source) => !source.ok).map((source) => source.key),
    },
  }
}

export function buildMegaMetricAvailability(
  sourceHealth: MegaSourceHealth[],
  evidence: { hasSecurityReview: boolean; hasForecastSamples: boolean },
): MegaMetricAvailability {
  return {
    activationSafety:
      truthModeForSources(sourceHealth, ['securityReviews', 'queues', 'anomalies', 'evaluations']) === 'live' &&
      evidence.hasSecurityReview,
    forecastAccuracy: healthFor(sourceHealth, 'calibrations')?.ok === true && evidence.hasForecastSamples,
    queueDepth: healthFor(sourceHealth, 'queues')?.ok === true,
    openAnomalies: healthFor(sourceHealth, 'anomalies')?.ok === true,
  }
}

export function sourceLabel(sourceHealth: MegaSourceHealth[], key: string): string {
  return healthFor(sourceHealth, key)?.label ?? key
}
