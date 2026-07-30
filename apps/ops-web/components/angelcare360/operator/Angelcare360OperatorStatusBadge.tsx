import styles from './Angelcare360OperatorExperience.module.css'

type Props = { status: string }

type Tone = 'success' | 'info' | 'warning' | 'critical' | 'neutral'

export default function Angelcare360OperatorStatusBadge({ status }: Props) {
  const normalized = status.toLowerCase()
  const tone = getTone(normalized)
  const toneClass = tone === 'success'
    ? styles.statusSuccess
    : tone === 'info'
      ? styles.statusInfo
      : tone === 'warning'
        ? styles.statusWarning
        : tone === 'critical'
          ? styles.statusCritical
          : styles.statusNeutral

  return <span className={`${styles.status} ${toneClass}`}>{getBadgeLabel(normalized, status)}</span>
}

function getTone(status: string): Tone {
  if (['active', 'enabled', 'confirmed', 'paid', 'signed', 'resolved', 'renewed', 'done', 'live', 'completed', 'healthy'].includes(status)) return 'success'
  if (['online_processing', 'manual_pending', 'pilot', 'trial', 'draft', 'new', 'todo', 'upcoming', 'scheduled', 'pending', 'informational', 'info', 'in_progress', 'provisioning'].includes(status)) return 'info'
  if (['warning', 'at_risk', 'past_due', 'blocked', 'triage', 'waiting_client', 'waiting_internal', 'in_discussion', 'proposed', 'proposal_sent', 'medium'].includes(status)) return 'warning'
  if (['critical', 'urgent', 'suspended', 'cancelled', 'archived', 'lost', 'rejected', 'expired', 'closed', 'locked', 'disabled', 'failed', 'high'].includes(status)) return 'critical'
  return 'neutral'
}

function getBadgeLabel(normalized: string, fallback: string) {
  const labels: Record<string, string> = {
    active: 'Actif', enabled: 'Activé', confirmed: 'Confirmé', paid: 'Payé', signed: 'Signé', resolved: 'Résolu', renewed: 'Renouvelé', done: 'Terminé', live: 'En ligne', completed: 'Terminé', healthy: 'Sain',
    pilot: 'Pilote', trial: 'Essai', draft: 'Brouillon', new: 'Nouvelle', todo: 'À faire', upcoming: 'À venir', scheduled: 'Planifié', online_processing: 'Traitement en ligne', manual_pending: 'Validation manuelle', requires_configuration: 'Configuration requise', pending: 'En attente', in_progress: 'En cours', provisioning: 'Provisionnement',
    warning: 'À surveiller', at_risk: 'À risque', past_due: 'En retard', blocked: 'Bloqué', triage: 'Triage', waiting_client: 'En attente client', waiting_internal: 'En attente interne', in_discussion: 'En discussion', proposed: 'Proposition', proposal_sent: 'Proposition envoyée', medium: 'Moyen',
    critical: 'Critique', urgent: 'Urgent', suspended: 'Suspendu', cancelled: 'Annulé', archived: 'Archivé', lost: 'Perdu', rejected: 'Rejeté', expired: 'Expiré', closed: 'Clos', locked: 'Verrouillé', disabled: 'Désactivé', failed: 'Échec', high: 'Élevé', informational: 'Information', info: 'Information',
  }
  return labels[normalized] || fallback.replaceAll('_', ' ')
}
