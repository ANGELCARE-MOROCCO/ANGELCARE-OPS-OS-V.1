import type { RevenueKnowledgeBootstrap, RevenueKnowledgeStatus } from '@/lib/revenue-command-os/types'

export function memoryMode(knowledge: RevenueKnowledgeBootstrap, error?: string) {
  if (error) return 'degraded'
  return knowledge.storageMode === 'supabase' ? 'live' : 'contract-seed'
}

export function memoryWarnings(knowledge: RevenueKnowledgeBootstrap, error?: string) {
  const warnings: string[] = []
  if (error) warnings.push(error)
  if (knowledge.storageMode === 'contract-seed') warnings.push('Référentiel contractuel : ne pas interpréter comme une mémoire persistée en direct.')
  if (knowledge.counters.openConflicts > 0) warnings.push(`${knowledge.counters.openConflicts} conflit(s) ouvert(s)`)
  return warnings
}

export function formatMemoryDate(value?: string) {
  if (!value) return 'Indisponible'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Indisponible' : date.toLocaleString('fr-FR')
}

export function statusLabel(status: RevenueKnowledgeStatus | string) {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    'in-review': 'En revue',
    approved: 'Approuvé',
    effective: 'Effectif',
    suspended: 'Suspendu',
    retired: 'Retiré',
    rejected: 'Rejeté',
    pending: 'En attente',
    indexed: 'Indexé',
    queued: 'En file',
    processing: 'Traitement',
    'not-indexed': 'Non indexé',
    failed: 'Échec',
    blocked: 'Bloqué',
    open: 'Ouvert',
    'under-review': 'Sous revue',
    resolved: 'Résolu',
    'accepted-risk': 'Risque accepté',
    dismissed: 'Écarté',
    acknowledged: 'Reconnu',
    waived: 'Dérogation',
    'changes-requested': 'Correction requise',
  }
  return labels[status] || status
}

export function readinessTone(value: number) {
  if (value >= 85) return 'emerald' as const
  if (value >= 65) return 'amber' as const
  return 'rose' as const
}
