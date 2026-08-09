import type { MarketAiCapability, RuntimeResolutionAction } from './types'

export class AiRuntimeContinuityError extends Error {
  readonly code: string
  readonly capability: MarketAiCapability
  readonly alternatives: RuntimeResolutionAction[]
  readonly retryable: boolean

  constructor(input: { code: string; capability: MarketAiCapability; message: string; alternatives: RuntimeResolutionAction[]; retryable?: boolean }) {
    super(input.message)
    this.name = 'AiRuntimeContinuityError'
    this.code = input.code
    this.capability = input.capability
    this.alternatives = input.alternatives
    this.retryable = input.retryable !== false
  }
}

export function defaultRuntimeAlternatives(capability: MarketAiCapability): RuntimeResolutionAction[] {
  const common: RuntimeResolutionAction[] = [
    { code: 'retry', label: 'Réessayer', description: 'Relancer la capacité avec la configuration courante.', authority: 'run' },
    { code: 'switch_provider', label: 'Changer de fournisseur', description: 'Choisir une affectation opérationnelle compatible.', authority: 'govern' },
    { code: 'configure_provider', label: 'Configurer le runtime', description: 'Ouvrir le contrôle des fournisseurs, modèles et credentials.', authority: 'manage' },
    { code: 'manual_mode', label: 'Continuer manuellement', description: 'Créer un travail interne humain sans interrompre le dossier.', authority: 'run' },
  ]
  if (capability === 'web_research' || capability === 'source_extraction') {
    common.splice(2, 0, { code: 'continue_without_research', label: 'Continuer sans recherche', description: 'Utiliser uniquement le contexte et les sources déjà disponibles.', authority: 'run' })
  }
  return common
}

export function runtimeMessage(error: unknown) {
  if (error instanceof AiRuntimeContinuityError) return error.message
  return error instanceof Error ? error.message : String(error || 'AI_RUNTIME_UNKNOWN_ERROR')
}
