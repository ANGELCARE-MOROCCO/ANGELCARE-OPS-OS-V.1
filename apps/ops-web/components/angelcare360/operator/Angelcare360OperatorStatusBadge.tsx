import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'

type Props = {
  status: string
}

export default function Angelcare360OperatorStatusBadge({ status }: Props) {
  const normalized = status.toLowerCase()
  const style = getBadgeStyle(normalized)
  return <span style={{ ...badgeBaseStyle, ...style }}>{getBadgeLabel(normalized, status)}</span>
}

function getBadgeStyle(status: string) {
  if (['active', 'enabled', 'confirmed', 'paid', 'signed', 'resolved', 'renewed', 'done', 'live'].includes(status)) {
    return { background: ANGELCARE360_OPERATOR_COLORS.greenSoft, color: ANGELCARE360_OPERATOR_COLORS.green, border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.greenBorder}` }
  }
  if (['online_processing', 'manual_pending'].includes(status)) {
    return { background: ANGELCARE360_OPERATOR_COLORS.blueSoft, color: ANGELCARE360_OPERATOR_COLORS.blueDeep, border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.blueBorder}` }
  }
  if (['pilot', 'trial', 'draft', 'new', 'todo', 'upcoming', 'scheduled', 'requires_configuration', 'pending'].includes(status)) {
    return { background: ANGELCARE360_OPERATOR_COLORS.blueSoft, color: ANGELCARE360_OPERATOR_COLORS.blue, border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.blueBorder}` }
  }
  if (['warning', 'at_risk', 'past_due', 'blocked', 'triage', 'waiting_client', 'waiting_internal', 'in_discussion', 'proposed', 'proposal_sent'].includes(status)) {
    return { background: ANGELCARE360_OPERATOR_COLORS.amberSoft, color: ANGELCARE360_OPERATOR_COLORS.amber, border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.amberBorder}` }
  }
  if (['suspended', 'cancelled', 'archived', 'lost', 'rejected', 'expired', 'closed', 'locked', 'disabled'].includes(status)) {
    return { background: ANGELCARE360_OPERATOR_COLORS.redSoft, color: ANGELCARE360_OPERATOR_COLORS.red, border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.redBorder}` }
  }
  return { background: ANGELCARE360_OPERATOR_COLORS.background, color: ANGELCARE360_OPERATOR_COLORS.navy, border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}` }
}

function getBadgeLabel(normalized: string, fallback: string) {
  const labels: Record<string, string> = {
    active: 'Actif',
    enabled: 'Activé',
    confirmed: 'Confirmé',
    paid: 'Payé',
    signed: 'Signé',
    resolved: 'Résolu',
    renewed: 'Renouvelé',
    done: 'Terminé',
    live: 'En ligne',
    pilot: 'Pilote',
    trial: 'Essai',
    draft: 'Brouillon',
    new: 'Nouvelle',
    todo: 'À faire',
    upcoming: 'À venir',
    scheduled: 'Planifié',
    online_processing: 'Traitement en ligne',
    manual_pending: 'Validation manuelle',
    requires_configuration: 'Configuration requise',
    pending: 'En attente',
    warning: 'À surveiller',
    at_risk: 'À risque',
    past_due: 'En retard',
    blocked: 'Bloqué',
    triage: 'Triage',
    waiting_client: 'En attente client',
    waiting_internal: 'En attente interne',
    in_discussion: 'En discussion',
    proposed: 'Proposition envoyée',
    proposal_sent: 'Proposition envoyée',
    suspended: 'Suspendu',
    cancelled: 'Annulé',
    archived: 'Archivé',
    lost: 'Perdu',
    rejected: 'Rejeté',
    expired: 'Expiré',
    closed: 'Clos',
    locked: 'Verrouillé',
    disabled: 'Désactivé',
    informational: 'Information',
    info: 'Information',
  }

  return labels[normalized] || fallback
}

const badgeBaseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '7px 11px',
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.2,
  whiteSpace: 'nowrap',
}
