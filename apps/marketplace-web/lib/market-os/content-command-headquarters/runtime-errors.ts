export type ContentCommandBlockerKind =
  | 'validation'
  | 'dependency'
  | 'authority'
  | 'permission'
  | 'protected_record'
  | 'conflict'
  | 'provider'
  | 'not_found'
  | 'manual_continuation'
  | 'system'

export type ContentCommandRecoveryInstruction = {
  key: string
  label: string
  description?: string
  href?: string
}

export type SerializedContentCommandError = {
  ok: false
  error: string
  code: string
  message: string
  status: number
  blocker: {
    kind: ContentCommandBlockerKind
    title: string
    recoverable: boolean
    recovery: ContentCommandRecoveryInstruction[]
  }
  details?: unknown
}

type ClassifiedError = {
  code: string
  status: number
  kind: ContentCommandBlockerKind
  title: string
  message: string
  recovery: ContentCommandRecoveryInstruction[]
}

export class ContentCommandActionError extends Error {
  readonly code: string
  readonly status: number
  readonly kind: ContentCommandBlockerKind
  readonly details?: unknown
  readonly recovery: ContentCommandRecoveryInstruction[]

  constructor(input: {
    code: string
    message: string
    status?: number
    kind?: ContentCommandBlockerKind
    details?: unknown
    recovery?: ContentCommandRecoveryInstruction[]
  }) {
    super(input.message)
    this.name = 'ContentCommandActionError'
    this.code = input.code
    this.status = input.status ?? 409
    this.kind = input.kind ?? 'conflict'
    this.details = input.details
    this.recovery = input.recovery ?? []
  }
}

const clean = (value: unknown) => String(value ?? '').trim()

function genericClassification(technical: string): ClassifiedError {
  const upper = technical.toUpperCase()

  if (upper === 'UNAUTHENTICATED') {
    return {
      code: 'AUTHENTICATION_REQUIRED',
      status: 401,
      kind: 'authority',
      title: 'Session requise',
      message: 'Reconnectez-vous pour reprendre cette opération.',
      recovery: [{ key: 'reload', label: 'Actualiser la session' }],
    }
  }

  if (upper === 'FORBIDDEN') {
    return {
      code: 'PERMISSION_DENIED',
      status: 403,
      kind: 'permission',
      title: 'Autorité insuffisante',
      message: 'Votre rôle ne permet pas cette action. Affectez une autorité compétente ou demandez une délégation.',
      recovery: [
        { key: 'governance', label: 'Ouvrir la gouvernance', href: '/market-os/content-command-center/record-governance' },
        { key: 'close', label: 'Revenir sans modifier' },
      ],
    }
  }

  if (upper.includes('NOT_FOUND')) {
    return {
      code: 'RECORD_NOT_FOUND',
      status: 404,
      kind: 'not_found',
      title: 'Objet introuvable',
      message: 'L’objet a été supprimé, déplacé ou n’est plus accessible. Rechargez la source de vérité.',
      recovery: [
        { key: 'reload', label: 'Actualiser les données' },
        { key: 'home', label: 'Retour au Commandement', href: '/market-os/content-command-center' },
      ],
    }
  }

  if (upper.startsWith('ACTION_BLOCKED') || upper.includes('DEPENDENCY_BLOCKED') || upper.includes('PURGE_BLOCKED')) {
    const reason = technical.includes(':') ? technical.split(':').slice(1).join(':').trim() : ''
    const dependency = /dépend|depend|purge/i.test(`${technical} ${reason}`)
    return {
      code: dependency ? 'DEPENDENCY_BLOCKED' : 'ACTION_BLOCKED',
      status: 409,
      kind: dependency ? 'dependency' : 'conflict',
      title: dependency ? 'Dépendances à résoudre' : 'Action gouvernée bloquée',
      message: reason || 'Cette action ne peut pas être exécutée dans l’état actuel.',
      recovery: [
        { key: 'inspect', label: 'Inspecter les dépendances', href: '/market-os/content-command-center/record-governance' },
        { key: 'archive', label: 'Utiliser une alternative réversible' },
        { key: 'close', label: 'Revenir sans modifier' },
      ],
    }
  }

  if (upper.includes('IMMUTABLE') || upper.includes('PROTECTED')) {
    return {
      code: 'RECORD_PROTECTED',
      status: 409,
      kind: 'protected_record',
      title: 'Historique protégé',
      message: 'Cet objet contient une autorité ou une preuve institutionnelle. Utilisez le retrait, la supersession, l’archive ou la réouverture.',
      recovery: [
        { key: 'governance', label: 'Ouvrir Record Governance', href: '/market-os/content-command-center/record-governance' },
        { key: 'close', label: 'Revenir sans modifier' },
      ],
    }
  }

  if (upper.includes('CONFIRMATION_MISMATCH')) {
    return {
      code: 'CONFIRMATION_REQUIRED',
      status: 400,
      kind: 'validation',
      title: 'Confirmation incorrecte',
      message: 'La confirmation typée ne correspond pas exactement au code attendu.',
      recovery: [{ key: 'correct', label: 'Corriger la confirmation' }],
    }
  }

  if ((upper.includes('AUTHORITY') || upper.includes('REVIEWER') || upper.includes('ASSIGNEE'))
      && (upper.includes('MISSING') || upper.includes('REQUIRED'))) {
    return {
      code: 'AUTHORITY_REQUIRED',
      status: 409,
      kind: 'authority',
      title: 'Autorité à affecter',
      message: 'Une responsabilité ou une autorité requise n’est pas encore affectée.',
      recovery: [
        { key: 'governance', label: 'Affecter une autorité', href: '/market-os/content-command-center/record-governance' },
        { key: 'close', label: 'Revenir sans modifier' },
      ],
    }
  }

  if (upper.includes('ALREADY_') || upper.includes('CONFLICT') || upper.includes('PENDING') || upper.includes('LIMIT_REACHED')) {
    return {
      code: 'CONFLICT_RETRY',
      status: 409,
      kind: 'conflict',
      title: 'État concurrent détecté',
      message: 'Les données ont évolué ou une opération similaire existe déjà. Actualisez avant de poursuivre.',
      recovery: [
        { key: 'reload', label: 'Actualiser et réessayer' },
        { key: 'close', label: 'Revenir sans modifier' },
      ],
    }
  }

  if (upper.endsWith('_REQUIRED') || upper.includes('INCOMPLETE') || upper.startsWith('INVALID_') || upper.includes('TOO_LARGE') || upper.includes('MISSING')) {
    return {
      code: 'VALIDATION_REQUIRED',
      status: upper.includes('TOO_LARGE') ? 413 : 400,
      kind: 'validation',
      title: 'Informations à compléter',
      message: 'Complétez ou corrigez les conditions indiquées avant de relancer l’action.',
      recovery: [
        { key: 'complete', label: 'Compléter maintenant' },
        { key: 'close', label: 'Revenir sans modifier' },
      ],
    }
  }

  if (upper.includes('UNAVAILABLE') || upper.includes('NOT_INSTALLED') || upper.includes('PROVIDER') || upper.includes('MODEL_') || upper.includes('API_KEY')) {
    return {
      code: 'CAPABILITY_UNAVAILABLE',
      status: 503,
      kind: 'provider',
      title: 'Capacité temporairement indisponible',
      message: 'La capacité demandée est indisponible. Continuez manuellement, changez de fournisseur ou réessayez plus tard.',
      recovery: [
        { key: 'providers', label: 'Contrôler les fournisseurs', href: '/market-os/content-command-center/ai-director/integrations' },
        { key: 'manual', label: 'Continuer manuellement' },
      ],
    }
  }

  return {
    code: 'SYSTEM_FAILURE',
    status: 500,
    kind: 'system',
    title: 'Incident technique',
    message: technical || 'Une erreur inattendue a interrompu l’action.',
    recovery: [
      { key: 'reload', label: 'Actualiser et réessayer' },
      { key: 'home', label: 'Retour au Commandement', href: '/market-os/content-command-center' },
    ],
  }
}

export function serializeContentCommandError(error: unknown): SerializedContentCommandError {
  if (error instanceof ContentCommandActionError) {
    const generic = genericClassification(error.code)
    return {
      ok: false,
      error: error.code,
      code: error.code,
      message: error.message,
      status: error.status,
      blocker: {
        kind: error.kind,
        title: generic.title,
        recoverable: error.kind !== 'system',
        recovery: error.recovery.length ? error.recovery : generic.recovery,
      },
      details: error.details,
    }
  }

  const technical = error instanceof Error ? error.message : clean(error) || 'UNKNOWN_ERROR'
  const classified = genericClassification(technical)
  return {
    ok: false,
    error: technical,
    code: classified.code,
    message: classified.message,
    status: classified.status,
    blocker: {
      kind: classified.kind,
      title: classified.title,
      recoverable: classified.kind !== 'system',
      recovery: classified.recovery,
    },
  }
}
