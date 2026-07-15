import type { Ac360CustomerCommand } from './customer-command-model'

export type Ac360CommandValidationIssue = {
  fieldKey: string
  label: string
  message: string
  severity: 'bloquant' | 'attention'
}

export type Ac360CommandValidationResult = {
  ok: boolean
  score: number
  issues: Ac360CommandValidationIssue[]
  fieldErrors: Record<string, string>
  requiredMissing: number
  readinessLabel: string
  businessImpact: string
}

export type Ac360PreflightInsight = {
  allowed: boolean
  statusLabel: string
  headline: string
  explanation: string
  proofReference: string
  guardSignals: string[]
  recoveryActions: string[]
  nextSteps: string[]
  billingSignals: string[]
  raw?: unknown
}

export type Ac360ExecutionRecovery = {
  headline: string
  explanation: string
  severity: 'bloquant' | 'attention' | 'succès'
  actions: string[]
  proofReference: string
}

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function isBlank(value: unknown) {
  return asString(value).length === 0
}

function isValidDate(value: unknown) {
  const text = asString(value)
  if (!text) return false
  const date = new Date(text)
  return !Number.isNaN(date.getTime())
}

function positiveNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0
}

function looksLikeMoroccanPhone(value: unknown) {
  const text = asString(value).replace(/\s+/g, '')
  if (!text) return true
  return /^(\+212|0)[5-7]\d{8}$/.test(text) || text === '+212600000000'
}

export function validateAc360CustomerCommand(command: Ac360CustomerCommand, values: Record<string, string | number>): Ac360CommandValidationResult {
  const issues: Ac360CommandValidationIssue[] = []

  for (const field of command.fields) {
    const value = values[field.key]
    if (field.required && isBlank(value)) {
      issues.push({ fieldKey: field.key, label: field.label, message: `${field.label} est obligatoire avant le pré-vol.`, severity: 'bloquant' })
    }
    if (field.type === 'number' && !isBlank(value) && !positiveNumber(value)) {
      issues.push({ fieldKey: field.key, label: field.label, message: `${field.label} doit être un montant/nombre positif.`, severity: 'bloquant' })
    }
    if (field.type === 'date' && !isBlank(value) && !isValidDate(value)) {
      issues.push({ fieldKey: field.key, label: field.label, message: `${field.label} doit être une date valide.`, severity: 'bloquant' })
    }
    if (field.key.toLowerCase().includes('phone') && !looksLikeMoroccanPhone(value)) {
      issues.push({ fieldKey: field.key, label: field.label, message: 'Format téléphone Maroc attendu : +2126XXXXXXXX ou 06XXXXXXXX.', severity: 'attention' })
    }
  }

  if (command.key.includes('invoice') && !positiveNumber(values.amountMad)) {
    issues.push({ fieldKey: 'amountMad', label: 'Montant MAD', message: 'La facture doit contenir un montant MAD positif avant exécution.', severity: 'bloquant' })
  }

  if (command.key.includes('addon') && isBlank(values.addonKey)) {
    issues.push({ fieldKey: 'addonKey', label: 'Add-on', message: 'Choisir un add-on Growth Menu à activer.', severity: 'bloquant' })
  }

  const blockers = issues.filter((issue) => issue.severity === 'bloquant')
  const warnings = issues.filter((issue) => issue.severity === 'attention')
  const fieldErrors = issues.reduce<Record<string, string>>((acc, issue) => {
    acc[issue.fieldKey] = issue.message
    return acc
  }, {})
  const score = Math.max(0, 100 - blockers.length * 35 - warnings.length * 12)

  return {
    ok: blockers.length === 0,
    score,
    issues,
    fieldErrors,
    requiredMissing: blockers.length,
    readinessLabel: blockers.length ? 'Correction requise avant pré-vol' : warnings.length ? 'Pré-vol possible avec attention' : 'Prêt pour pré-vol AC360',
    businessImpact: blockers.length
      ? 'Le runtime ne doit pas être sollicité tant que les champs essentiels ne sont pas propres.'
      : 'Le payload est suffisamment structuré pour vérifier droits, abonnement, crédits et restrictions.',
  }
}

function readPath(data: any, paths: string[]) {
  for (const path of paths) {
    const value = path.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), data)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

export function analyzeAc360PreflightResult(command: Ac360CustomerCommand, payload: unknown, responseOk = true): Ac360PreflightInsight {
  const data = (payload || {}) as any
  const allowed = Boolean(responseOk && (data.allowed || data.ok || data.guard?.allowed || data.guard?.ok || data.guard?.decision === 'allow'))
  const reason = asString(readPath(data, ['reason', 'message', 'guard.reason', 'guard.message', 'policy.reason', 'restriction.reason', 'blockedUx.message', 'error']))
  const proofReference = asString(readPath(data, ['decisionId', 'guard.decision_id', 'guard.decisionId', 'audit.reference', 'reference'])) || `AC360-PREFLIGHT-${command.key.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`
  const creditSignal = asString(readPath(data, ['credits.message', 'usage.message', 'guard.usageSignal'])) || command.creditSignal
  const entitlementSignal = asString(readPath(data, ['entitlement.message', 'feature.message', 'guard.entitlementSignal'])) || command.entitlementSignal
  const restrictionSignal = asString(readPath(data, ['restriction.message', 'policy.message', 'guard.restrictionSignal'])) || command.riskSignal

  const recoveryActions = allowed
    ? ['Continuer vers la revue payload', 'Confirmer impact facture/usage', 'Exécuter avec preuve audit']
    : [
        'Corriger les champs ou relancer le pré-vol',
        'Vérifier plan, module, limite ou restriction compte',
        'Acheter crédits, activer add-on ou passer au plan supérieur si nécessaire',
        'Contacter AngelCare si le blocage est lié à la politique ou au paiement',
      ]

  return {
    allowed,
    statusLabel: allowed ? 'Pré-vol autorisé' : 'Action bloquée ou à régulariser',
    headline: allowed ? 'Le runtime AC360 autorise cette commande.' : 'La commande ne doit pas être exécutée tant que le blocage n’est pas résolu.',
    explanation: allowed ? 'Organisation, abonnement, droits, restrictions et usage sont compatibles avec cette action.' : reason || 'Le pré-vol n’a pas confirmé l’autorisation complète de cette action.',
    proofReference,
    guardSignals: [entitlementSignal, creditSignal, restrictionSignal].filter(Boolean),
    recoveryActions,
    nextSteps: allowed ? (command.recommendedNext || ['Exécuter la commande', 'Contrôler la preuve', 'Rafraîchir le module']) : recoveryActions,
    billingSignals: [command.entitlementSignal, command.creditSignal, command.riskSignal],
    raw: payload,
  }
}

export function buildAc360PreflightRequest(command: Ac360CustomerCommand, payload: Record<string, unknown>, values: Record<string, string | number>) {
  return {
    wiringKey: command.wiringKey,
    quantity: command.quantity,
    payloadPreview: payload,
    validationSnapshot: values,
    idempotencyKey: `customer-ui:${command.moduleKey}:${command.key}:${Date.now()}`,
    metadata: {
      source: 'ac360_customer_phase3h_inline_preflight',
      phase: 'phase_3h_live_forms_preflight_recovery',
      moduleKey: command.moduleKey,
      commandKey: command.key,
      targetEndpoint: command.targetEndpoint,
      locale: 'fr-MA',
      customerEnd: true,
    },
  }
}

export function buildExecutionRecovery(command: Ac360CustomerCommand, status: 'success' | 'error', message: string, raw?: unknown): Ac360ExecutionRecovery {
  const data = (raw || {}) as any
  const proofReference = asString(readPath(data, ['reference', 'id', 'data.id', 'result.id', 'audit.reference', 'guard.decision_id'])) || `AC360-EXEC-${command.key.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`

  if (status === 'success') {
    return {
      headline: 'Commande exécutée et preuve disponible.',
      explanation: message || command.successMessage,
      severity: 'succès',
      actions: command.recommendedNext || ['Rafraîchir le module', 'Contrôler la chronologie', 'Préparer l’action suivante'],
      proofReference,
    }
  }

  return {
    headline: 'Exécution non finalisée : récupération client requise.',
    explanation: message || 'Le runtime a refusé ou interrompu la commande.',
    severity: 'bloquant',
    actions: [
      'Relancer le pré-vol AC360',
      'Corriger les champs et revoir le payload',
      'Vérifier crédits, add-on, plan ou restriction de compte',
      'Réessayer après régularisation ou contacter AngelCare',
    ],
    proofReference,
  }
}
