import type { RevenueSignalSectionDefinition } from '../types'

export const REVENUE_SIGNAL_RELEASE_CODE = 'AC-REVENUE-OS-MZ04-SIGNAL-FABRIC'
export const REVENUE_SIGNAL_MODULE_VERSION = '4.0.0-phase4'
export const REVENUE_SIGNAL_MODEL_VERSION = 'AC-REVENUE-SIGNAL-FABRIC-2026.07-V1'
export const REVENUE_SIGNAL_EXECUTION_POSTURE = 'shadow-observation' as const

export const REVENUE_SIGNAL_SECTIONS: RevenueSignalSectionDefinition[] = [
  { key: 'overview', label: 'Vue d’ensemble', description: 'Lecture exécutive des signaux, de leur origine, de leur fiabilité et de leur disponibilité pour les futures commandes.', href: '/revenue-command-os/signals', icon: 'RadioTower', status: 'ready' },
  { key: 'live-stream', label: 'Flux en direct', description: 'Signaux normalisés, priorisés et reliés aux comptes, offres, marchés et risques de revenu.', href: '/revenue-command-os/signals/live-stream', icon: 'Activity', status: 'ready' },
  { key: 'source-control', label: 'Sources & connecteurs', description: 'Registre gouverné des sources CRM, B2B, Email OS, Academy, Finance, opérations et événements internes.', href: '/revenue-command-os/signals/source-control', icon: 'Cable', status: 'ready' },
  { key: 'source-health', label: 'Santé des sources', description: 'Disponibilité, latence, fraîcheur, volumes, erreurs et diagnostic de chaque source autorisée.', href: '/revenue-command-os/signals/source-health', icon: 'HeartPulse', status: 'needs-attention' },
  { key: 'classification', label: 'Classification', description: 'Règles explicables de catégorie, sévérité, confiance, opportunité, risque et familles de commandes recommandées.', href: '/revenue-command-os/signals/classification', icon: 'SlidersHorizontal', status: 'ready' },
  { key: 'deduplication', label: 'Déduplication', description: 'Empreintes, collisions, regroupement et protection idempotente contre les événements répétés.', href: '/revenue-command-os/signals/deduplication', icon: 'CopyCheck', status: 'ready' },
  { key: 'scheduled-scans', label: 'Scans programmés', description: 'Scans incrémentaux, fenêtres de reprise, curseurs, limites, échecs consécutifs et prochaine exécution.', href: '/revenue-command-os/signals/scheduled-scans', icon: 'CalendarClock', status: 'ready' },
  { key: 'context-snapshots', label: 'Snapshots de contexte', description: 'Paquets de faits, contraintes, doctrines, hypothèses et preuves minimisés pour la future liaison IA.', href: '/revenue-command-os/signals/context-snapshots', icon: 'PanelsTopLeft', status: 'ready' },
  { key: 'stale-data', label: 'Données périmées', description: 'Détection de sources, signaux et contextes devenus trop anciens pour soutenir une décision stratégique.', href: '/revenue-command-os/signals/stale-data', icon: 'TimerOff', status: 'needs-attention' },
  { key: 'subscriptions', label: 'Abonnements', description: 'Routage interne des signaux vers rôles, workspaces, digests et futures propositions de missions.', href: '/revenue-command-os/signals/subscriptions', icon: 'BellRing', status: 'ready' },
  { key: 'data-access', label: 'Accès & confidentialité', description: 'Profils de visibilité, redaction, minimisation, journal d’accès et interdiction de centraliser des secrets.', href: '/revenue-command-os/signals/data-access', icon: 'ShieldCheck', status: 'ready' },
  { key: 'model-validation', label: 'Validation du tissu', description: 'Contrôle de couverture, fraîcheur, classification, déduplication, confidentialité, contexte et fiabilité des scans.', href: '/revenue-command-os/signals/model-validation', icon: 'BadgeCheck', status: 'needs-attention' },
]

export const REVENUE_SIGNAL_SENSITIVE_FIELD_PATTERNS = [
  'password', 'passphrase', 'secret', 'token', 'access_token', 'refresh_token', 'api_key', 'credential', 'cookie', 'authorization',
  'private_key', 'service_role', 'smtp_password', 'imap_password', 'whatsapp_session', 'bank_account', 'card_number', 'cvv',
]

export const REVENUE_SIGNAL_MESSAGE_CONTENT_FIELDS = ['body', 'html', 'text', 'content', 'raw_message', 'mime_message']
export const REVENUE_SIGNAL_MUTABLE_STATES = new Set(['new', 'triaged', 'acknowledged', 'context-ready', 'monitoring', 'resolved', 'dismissed', 'blocked'])
export const REVENUE_SIGNAL_VISIBILITY_PROFILES = ['executive', 'revenue-manager', 'commercial-agent', 'auditor'] as const

export const REVENUE_SIGNAL_SOURCE_TABLE_ALLOWLIST = new Set([
  'b2b_prospects', 'b2b_contacts', 'b2b_meetings', 'b2b_proposals',
  'browser_extension_b2b_opportunities', 'revenue_prospects', 'revenue_appointments', 'revenue_partnerships', 'revenue_activities',
  'email_os_core_inbox', 'email_os_core_outbox', 'trn_sessions', 'academy_trainers', 'academy_trainer_assignments',
  'angelcare360_invoices', 'angelcare360_payments', 'bill_proposals', 'angelcare360_reclamations',
])
