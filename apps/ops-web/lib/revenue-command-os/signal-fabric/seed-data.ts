import type { RevenueRawSignalEvent, RevenueScheduledScan, RevenueSignal, RevenueSignalContextSnapshot, RevenueSignalRule, RevenueSignalSource, RevenueSignalSourceHealth, RevenueSignalSubscription } from '../types'

export const REVENUE_SIGNAL_SEED_SOURCES = [
  {
    "id": "src-001",
    "code": "SRC-B2B-PROSPECTS",
    "name": "Prospects B2B",
    "sourceKind": "crm",
    "adapterKey": "b2b-prospects",
    "description": "Source gouvernée Prospects B2B pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS",
      "CORPORATES"
    ],
    "sourceTables": [
      "b2b_prospects"
    ],
    "supportedEventTypes": [
      "prospect.observed",
      "prospect.updated"
    ],
    "status": "healthy",
    "pollingMinutes": 15,
    "staleAfterMinutes": 60,
    "lastObservedAt": "2026-07-20T06:07:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T06:05:00.000Z",
    "lastCursor": "cursor-001",
    "recordCount24h": 128,
    "errorCount24h": 0,
    "containsSensitiveData": false,
    "minimumPermission": "revenue_os.signals.manage",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-002",
    "code": "SRC-B2B-CONTACTS",
    "name": "Contacts & décideurs B2B",
    "sourceKind": "crm",
    "adapterKey": "b2b-contacts",
    "description": "Source gouvernée Contacts & décideurs B2B pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS",
      "CORPORATES"
    ],
    "sourceTables": [
      "b2b_contacts"
    ],
    "supportedEventTypes": [
      "contact.observed",
      "decision-maker.identified"
    ],
    "status": "healthy",
    "pollingMinutes": 30,
    "staleAfterMinutes": 120,
    "lastObservedAt": "2026-07-20T05:14:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T05:10:00.000Z",
    "lastCursor": "cursor-002",
    "recordCount24h": 76,
    "errorCount24h": 0,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.manage",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-003",
    "code": "SRC-B2B-MEETINGS",
    "name": "Réunions B2B",
    "sourceKind": "calendar",
    "adapterKey": "b2b-meetings",
    "description": "Source gouvernée Réunions B2B pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY",
      "CORPORATES"
    ],
    "sourceTables": [
      "b2b_meetings"
    ],
    "supportedEventTypes": [
      "meeting.observed",
      "meeting.completed"
    ],
    "status": "healthy",
    "pollingMinutes": 15,
    "staleAfterMinutes": 60,
    "lastObservedAt": "2026-07-20T04:21:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T04:15:00.000Z",
    "lastCursor": "cursor-003",
    "recordCount24h": 18,
    "errorCount24h": 0,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.manage",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-004",
    "code": "SRC-B2B-PROPOSALS",
    "name": "Propositions B2B",
    "sourceKind": "crm",
    "adapterKey": "b2b-proposals",
    "description": "Source gouvernée Propositions B2B pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY",
      "CORPORATES"
    ],
    "sourceTables": [
      "b2b_proposals"
    ],
    "supportedEventTypes": [
      "proposal.observed",
      "proposal.sent",
      "proposal.accepted"
    ],
    "status": "healthy",
    "pollingMinutes": 15,
    "staleAfterMinutes": 60,
    "lastObservedAt": "2026-07-20T03:28:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T07:20:00.000Z",
    "lastCursor": "cursor-004",
    "recordCount24h": 24,
    "errorCount24h": 1,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.manage",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-005",
    "code": "SRC-BROWSER-OPPORTUNITIES",
    "name": "Opportunités extension navigateur",
    "sourceKind": "browser-extension",
    "adapterKey": "browser-opportunities",
    "description": "Source gouvernée Opportunités extension navigateur pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS",
      "CORPORATES"
    ],
    "sourceTables": [
      "browser_extension_b2b_opportunities"
    ],
    "supportedEventTypes": [
      "opportunity.observed",
      "opportunity.updated"
    ],
    "status": "healthy",
    "pollingMinutes": 10,
    "staleAfterMinutes": 45,
    "lastObservedAt": "2026-07-20T07:35:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T06:25:00.000Z",
    "lastCursor": "cursor-005",
    "recordCount24h": 94,
    "errorCount24h": 0,
    "containsSensitiveData": false,
    "minimumPermission": "revenue_os.signals.manage",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-006",
    "code": "SRC-REVENUE-PROSPECTS",
    "name": "Pipeline Revenue historique",
    "sourceKind": "crm",
    "adapterKey": "revenue-prospects",
    "description": "Source gouvernée Pipeline Revenue historique pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY",
      "HOME_SERVICE",
      "CORPORATES"
    ],
    "sourceTables": [
      "revenue_prospects"
    ],
    "supportedEventTypes": [
      "revenue.prospect.observed"
    ],
    "status": "degraded",
    "pollingMinutes": 30,
    "staleAfterMinutes": 180,
    "lastObservedAt": "2026-07-20T06:42:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T05:30:00.000Z",
    "lastCursor": "cursor-006",
    "recordCount24h": 46,
    "errorCount24h": 3,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.manage",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-007",
    "code": "SRC-REVENUE-APPOINTMENTS",
    "name": "Rendez-vous Revenue",
    "sourceKind": "calendar",
    "adapterKey": "revenue-appointments",
    "description": "Source gouvernée Rendez-vous Revenue pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY",
      "CORPORATES"
    ],
    "sourceTables": [
      "revenue_appointments"
    ],
    "supportedEventTypes": [
      "appointment.observed"
    ],
    "status": "healthy",
    "pollingMinutes": 15,
    "staleAfterMinutes": 90,
    "lastObservedAt": "2026-07-20T05:49:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T04:35:00.000Z",
    "lastCursor": "cursor-007",
    "recordCount24h": 14,
    "errorCount24h": 0,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.manage",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-008",
    "code": "SRC-REVENUE-PARTNERSHIPS",
    "name": "Partenariats actifs",
    "sourceKind": "crm",
    "adapterKey": "revenue-partnerships",
    "description": "Source gouvernée Partenariats actifs pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS",
      "HOSPITALITY"
    ],
    "sourceTables": [
      "revenue_partnerships"
    ],
    "supportedEventTypes": [
      "partnership.observed",
      "renewal.window"
    ],
    "status": "healthy",
    "pollingMinutes": 60,
    "staleAfterMinutes": 360,
    "lastObservedAt": "2026-07-20T04:56:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T07:40:00.000Z",
    "lastCursor": "cursor-008",
    "recordCount24h": 20,
    "errorCount24h": 0,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.manage",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-009",
    "code": "SRC-EMAIL-INBOX",
    "name": "Email OS — Inbox",
    "sourceKind": "email",
    "adapterKey": "email-inbox",
    "description": "Source gouvernée Email OS — Inbox pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS",
      "CORPORATES",
      "HOME_SERVICE"
    ],
    "sourceTables": [
      "email_os_core_inbox"
    ],
    "supportedEventTypes": [
      "email.received"
    ],
    "status": "healthy",
    "pollingMinutes": 5,
    "staleAfterMinutes": 30,
    "lastObservedAt": "2026-07-20T03:03:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T06:45:00.000Z",
    "lastCursor": "cursor-009",
    "recordCount24h": 183,
    "errorCount24h": 2,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.manage",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-010",
    "code": "SRC-EMAIL-OUTBOX",
    "name": "Email OS — Outbox",
    "sourceKind": "email",
    "adapterKey": "email-outbox",
    "description": "Source gouvernée Email OS — Outbox pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY",
      "FLASHCARDS",
      "CORPORATES"
    ],
    "sourceTables": [
      "email_os_core_outbox"
    ],
    "supportedEventTypes": [
      "email.outbound",
      "email.failed"
    ],
    "status": "healthy",
    "pollingMinutes": 5,
    "staleAfterMinutes": 30,
    "lastObservedAt": "2026-07-20T07:10:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T05:50:00.000Z",
    "lastCursor": "cursor-010",
    "recordCount24h": 142,
    "errorCount24h": 4,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.manage",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-011",
    "code": "SRC-TRAINING-SESSIONS",
    "name": "Sessions TrainingHub",
    "sourceKind": "academy",
    "adapterKey": "training-sessions",
    "description": "Source gouvernée Sessions TrainingHub pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY"
    ],
    "sourceTables": [
      "trn_sessions"
    ],
    "supportedEventTypes": [
      "training.session.observed",
      "training.capacity.changed"
    ],
    "status": "healthy",
    "pollingMinutes": 30,
    "staleAfterMinutes": 120,
    "lastObservedAt": "2026-07-20T06:17:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T04:55:00.000Z",
    "lastCursor": "cursor-011",
    "recordCount24h": 37,
    "errorCount24h": 0,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.manage",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-012",
    "code": "SRC-ACADEMY-TRAINERS",
    "name": "Capacité formateurs Academy",
    "sourceKind": "academy",
    "adapterKey": "academy-trainers",
    "description": "Source gouvernée Capacité formateurs Academy pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY"
    ],
    "sourceTables": [
      "academy_trainers",
      "academy_trainer_assignments"
    ],
    "supportedEventTypes": [
      "trainer.capacity.observed"
    ],
    "status": "degraded",
    "pollingMinutes": 30,
    "staleAfterMinutes": 120,
    "lastObservedAt": "2026-07-20T05:24:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T07:00:00.000Z",
    "lastCursor": "cursor-012",
    "recordCount24h": 21,
    "errorCount24h": 2,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.manage",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-013",
    "code": "SRC-FINANCE-INVOICES",
    "name": "Factures & échéances",
    "sourceKind": "finance",
    "adapterKey": "invoices",
    "description": "Source gouvernée Factures & échéances pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY",
      "CORPORATES",
      "HOME_SERVICE"
    ],
    "sourceTables": [
      "angelcare360_invoices"
    ],
    "supportedEventTypes": [
      "invoice.observed",
      "invoice.overdue"
    ],
    "status": "stale",
    "pollingMinutes": 60,
    "staleAfterMinutes": 180,
    "lastObservedAt": "2026-07-20T04:31:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T06:05:00.000Z",
    "lastCursor": "cursor-013",
    "recordCount24h": 39,
    "errorCount24h": 1,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.audit",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-014",
    "code": "SRC-FINANCE-PAYMENTS",
    "name": "Paiements reçus",
    "sourceKind": "finance",
    "adapterKey": "payments",
    "description": "Source gouvernée Paiements reçus pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "ACADEMY",
      "CORPORATES",
      "HOME_SERVICE"
    ],
    "sourceTables": [
      "angelcare360_payments"
    ],
    "supportedEventTypes": [
      "payment.observed",
      "payment.received"
    ],
    "status": "healthy",
    "pollingMinutes": 60,
    "staleAfterMinutes": 180,
    "lastObservedAt": "2026-07-20T03:38:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T05:10:00.000Z",
    "lastCursor": "cursor-014",
    "recordCount24h": 31,
    "errorCount24h": 0,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.audit",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "src-015",
    "code": "SRC-CUSTOMER-CLAIMS",
    "name": "Réclamations & risque client",
    "sourceKind": "operations",
    "adapterKey": "complaints",
    "description": "Source gouvernée Réclamations & risque client pour observation Revenue OS en mode Shadow.",
    "businessUnitCodes": [
      "HOME_SERVICE",
      "KINDERGARTEN",
      "CORPORATES"
    ],
    "sourceTables": [
      "angelcare360_reclamations"
    ],
    "supportedEventTypes": [
      "complaint.observed",
      "customer.risk"
    ],
    "status": "healthy",
    "pollingMinutes": 30,
    "staleAfterMinutes": 90,
    "lastObservedAt": "2026-07-20T07:45:00.000Z",
    "lastSuccessfulScanAt": "2026-07-20T04:15:00.000Z",
    "lastCursor": "cursor-015",
    "recordCount24h": 12,
    "errorCount24h": 0,
    "containsSensitiveData": true,
    "minimumPermission": "revenue_os.signals.audit",
    "enabled": true,
    "updatedAt": "2026-07-20T08:00:00.000Z"
  }
] as RevenueSignalSource[]
export const REVENUE_SIGNAL_SEED_RULES = [
  {
    "id": "rule-001",
    "code": "SIG-RULE-001",
    "name": "Intention forte reçue",
    "sourceCodes": [
      "SRC-EMAIL-INBOX"
    ],
    "eventTypes": [
      "email.received"
    ],
    "category": "account-intent",
    "signalType": "account.high-intent",
    "condition": "Les données de la source satisfont le pattern gouverné « Intention forte reçue ».",
    "severityLogic": "Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "qualification",
      "meeting-generation"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-002",
    "code": "SIG-RULE-002",
    "name": "Proposition sans suite",
    "sourceCodes": [
      "SRC-B2B-PROPOSALS"
    ],
    "eventTypes": [
      "proposal.observed"
    ],
    "category": "proposal",
    "signalType": "proposal.follow-up-window",
    "condition": "Les données de la source satisfont le pattern gouverné « Proposition sans suite ».",
    "severityLogic": "Sévérité par défaut medium, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "proposal-progression",
      "closing"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-003",
    "code": "SIG-RULE-003",
    "name": "Rendez-vous imminent",
    "sourceCodes": [
      "SRC-B2B-MEETINGS",
      "SRC-REVENUE-APPOINTMENTS"
    ],
    "eventTypes": [
      "meeting.observed",
      "appointment.observed"
    ],
    "category": "meeting",
    "signalType": "meeting.readiness",
    "condition": "Les données de la source satisfont le pattern gouverné « Rendez-vous imminent ».",
    "severityLogic": "Sévérité par défaut medium, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "meeting-diagnostic"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-004",
    "code": "SIG-RULE-004",
    "name": "Facture en retard",
    "sourceCodes": [
      "SRC-FINANCE-INVOICES"
    ],
    "eventTypes": [
      "invoice.overdue",
      "invoice.observed"
    ],
    "category": "payment",
    "signalType": "payment.overdue",
    "condition": "Les données de la source satisfont le pattern gouverné « Facture en retard ».",
    "severityLogic": "Sévérité par défaut critical, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "revenue-rescue",
      "collections"
    ],
    "expiryMinutes": 360,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-005",
    "code": "SIG-RULE-005",
    "name": "Risque client déclaré",
    "sourceCodes": [
      "SRC-CUSTOMER-CLAIMS"
    ],
    "eventTypes": [
      "complaint.observed",
      "customer.risk"
    ],
    "category": "customer-risk",
    "signalType": "customer.risk",
    "condition": "Les données de la source satisfont le pattern gouverné « Risque client déclaré ».",
    "severityLogic": "Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "customer-rescue",
      "retention"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-006",
    "code": "SIG-RULE-006",
    "name": "Capacité Academy contrainte",
    "sourceCodes": [
      "SRC-ACADEMY-TRAINERS",
      "SRC-TRAINING-SESSIONS"
    ],
    "eventTypes": [
      "trainer.capacity.observed",
      "training.capacity.changed"
    ],
    "category": "capacity",
    "signalType": "capacity.constraint",
    "condition": "Les données de la source satisfont le pattern gouverné « Capacité Academy contrainte ».",
    "severityLogic": "Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "capacity-protection"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-007",
    "code": "SIG-RULE-007",
    "name": "Nouveau prospect à potentiel",
    "sourceCodes": [
      "SRC-B2B-PROSPECTS",
      "SRC-BROWSER-OPPORTUNITIES"
    ],
    "eventTypes": [
      "prospect.observed",
      "opportunity.observed"
    ],
    "category": "market-opportunity",
    "signalType": "account.discovery",
    "condition": "Les données de la source satisfont le pattern gouverné « Nouveau prospect à potentiel ».",
    "severityLogic": "Sévérité par défaut medium, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "account-discovery",
      "segmentation"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-008",
    "code": "SIG-RULE-008",
    "name": "Fenêtre de renouvellement",
    "sourceCodes": [
      "SRC-REVENUE-PARTNERSHIPS"
    ],
    "eventTypes": [
      "renewal.window",
      "partnership.observed"
    ],
    "category": "renewal",
    "signalType": "renewal.window",
    "condition": "Les données de la source satisfont le pattern gouverné « Fenêtre de renouvellement ».",
    "severityLogic": "Sévérité par défaut medium, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "renewal",
      "upsell"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-009",
    "code": "SIG-RULE-009",
    "name": "Email sortant en échec",
    "sourceCodes": [
      "SRC-EMAIL-OUTBOX"
    ],
    "eventTypes": [
      "email.failed"
    ],
    "category": "execution",
    "signalType": "outreach.delivery-failure",
    "condition": "Les données de la source satisfont le pattern gouverné « Email sortant en échec ».",
    "severityLogic": "Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "channel-recovery"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-010",
    "code": "SIG-RULE-010",
    "name": "Décideur identifié",
    "sourceCodes": [
      "SRC-B2B-CONTACTS"
    ],
    "eventTypes": [
      "decision-maker.identified",
      "contact.observed"
    ],
    "category": "account-intent",
    "signalType": "decision-maker.identified",
    "condition": "Les données de la source satisfont le pattern gouverné « Décideur identifié ».",
    "severityLogic": "Sévérité par défaut medium, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "account-plan",
      "qualification"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-011",
    "code": "SIG-RULE-011",
    "name": "Paiement reçu",
    "sourceCodes": [
      "SRC-FINANCE-PAYMENTS"
    ],
    "eventTypes": [
      "payment.received",
      "payment.observed"
    ],
    "category": "payment",
    "signalType": "payment.confirmed",
    "condition": "Les données de la source satisfont le pattern gouverné « Paiement reçu ».",
    "severityLogic": "Sévérité par défaut info, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "delivery-handoff",
      "expansion"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-012",
    "code": "SIG-RULE-012",
    "name": "Session sous-remplie",
    "sourceCodes": [
      "SRC-TRAINING-SESSIONS"
    ],
    "eventTypes": [
      "training.session.observed"
    ],
    "category": "capacity",
    "signalType": "academy.capacity-underused",
    "condition": "Les données de la source satisfont le pattern gouverné « Session sous-remplie ».",
    "severityLogic": "Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "capacity-monetization",
      "campaign-activation"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-013",
    "code": "SIG-RULE-013",
    "name": "Partenariat inactif",
    "sourceCodes": [
      "SRC-REVENUE-PARTNERSHIPS"
    ],
    "eventTypes": [
      "partnership.observed"
    ],
    "category": "renewal",
    "signalType": "partner.reactivation",
    "condition": "Les données de la source satisfont le pattern gouverné « Partenariat inactif ».",
    "severityLogic": "Sévérité par défaut medium, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "partner-reactivation"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-014",
    "code": "SIG-RULE-014",
    "name": "Donnée source périmée",
    "sourceCodes": [],
    "eventTypes": [
      "source.stale"
    ],
    "category": "data-quality",
    "signalType": "source.stale",
    "condition": "Les données de la source satisfont le pattern gouverné « Donnée source périmée ».",
    "severityLogic": "Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "data-recovery"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-015",
    "code": "SIG-RULE-015",
    "name": "Doublon événement",
    "sourceCodes": [],
    "eventTypes": [
      "event.duplicate"
    ],
    "category": "data-quality",
    "signalType": "event.duplicate",
    "condition": "Les données de la source satisfont le pattern gouverné « Doublon événement ».",
    "severityLogic": "Sévérité par défaut low, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "data-quality"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  },
  {
    "id": "rule-016",
    "code": "SIG-RULE-016",
    "name": "Créneau commercial saisonnier",
    "sourceCodes": [],
    "eventTypes": [
      "seasonal.window"
    ],
    "category": "seasonality",
    "signalType": "seasonal.window",
    "condition": "Les données de la source satisfont le pattern gouverné « Créneau commercial saisonnier ».",
    "severityLogic": "Sévérité par défaut high, réévaluée selon urgence, valeur, récence et risque.",
    "confidenceLogic": "Confirmé si événement primaire et identifiant source présents; sinon confiance dégradée.",
    "scoreLogic": "35% urgence + 35% opportunité + 30% risque.",
    "recommendedCommandFamilies": [
      "seasonal-activation",
      "territory-capture"
    ],
    "expiryMinutes": 1440,
    "cooldownMinutes": 60,
    "enabled": true,
    "version": "1.0",
    "updatedAt": "2026-07-20T08:00:00.000Z"
  }
] as RevenueSignalRule[]
export const REVENUE_SIGNAL_SEED_SIGNALS = [
  {
    "id": "sig-0001",
    "code": "SIG-0001",
    "rawEventId": "raw-0001",
    "sourceCode": "SRC-EMAIL-INBOX",
    "category": "account-intent",
    "signalType": "account.high-intent",
    "title": "Direction de crèche demande les modalités Academy",
    "summary": "Réponse reçue après consultation du catalogue; besoin de rendez-vous rapide.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "RABAT",
    "territoryCode": "RABAT",
    "offerCode": "ACAD-ONSITE",
    "segmentCode": "CRECHE_PRIVATE",
    "severity": "high",
    "confidence": "confirmed",
    "priorityScore": 92,
    "urgencyScore": 88,
    "opportunityScore": 94,
    "riskScore": 25,
    "status": "new",
    "occurredAt": "2026-07-20T06:03:00.000Z",
    "detectedAt": "2026-07-20T06:03:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-001",
        "entityCode": "ACC-001",
        "label": "Direction de crèche demande les modalités Academy",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-EMAIL-INBOX",
        "label": "Événement normalisé",
        "value": "account.high-intent",
        "observedAt": "2026-07-20T06:03:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "qualification",
      "meeting-generation"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [
      "Validation humaine requise"
    ],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0002",
    "code": "SIG-0002",
    "rawEventId": "raw-0002",
    "sourceCode": "SRC-FINANCE-INVOICES",
    "category": "payment",
    "signalType": "payment.overdue",
    "title": "Échéance partenaire Academy dépassée",
    "summary": "Facture arrivée à échéance sans paiement ni promesse active.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "CASABLANCA",
    "territoryCode": "CASABLANCA",
    "offerCode": "ACAD-ONSITE",
    "segmentCode": "CRECHE_PRIVATE",
    "severity": "critical",
    "confidence": "confirmed",
    "priorityScore": 97,
    "urgencyScore": 96,
    "opportunityScore": 38,
    "riskScore": 95,
    "status": "new",
    "occurredAt": "2026-07-20T05:06:00.000Z",
    "detectedAt": "2026-07-20T05:06:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-002",
        "entityCode": "ACC-002",
        "label": "Échéance partenaire Academy dépassée",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-FINANCE-INVOICES",
        "label": "Événement normalisé",
        "value": "payment.overdue",
        "observedAt": "2026-07-20T05:06:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "revenue-rescue",
      "collections"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [
      "Validation humaine requise"
    ],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0003",
    "code": "SIG-0003",
    "rawEventId": "raw-0003",
    "sourceCode": "SRC-ACADEMY-TRAINERS",
    "category": "capacity",
    "signalType": "capacity.constraint",
    "title": "Capacité formateur Rabat sous seuil",
    "summary": "Deux créneaux seulement restent disponibles avant la pause estivale.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "RABAT",
    "territoryCode": "RABAT",
    "offerCode": "ACAD-ONSITE",
    "segmentCode": null,
    "severity": "high",
    "confidence": "high",
    "priorityScore": 88,
    "urgencyScore": 91,
    "opportunityScore": 55,
    "riskScore": 86,
    "status": "triaged",
    "occurredAt": "2026-07-20T04:09:00.000Z",
    "detectedAt": "2026-07-20T04:09:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-003",
        "entityCode": "ACC-003",
        "label": "Capacité formateur Rabat sous seuil",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-ACADEMY-TRAINERS",
        "label": "Événement normalisé",
        "value": "capacity.constraint",
        "observedAt": "2026-07-20T04:09:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "capacity-protection"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [
      "Validation humaine requise"
    ],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0004",
    "code": "SIG-0004",
    "rawEventId": "raw-0004",
    "sourceCode": "SRC-B2B-PROPOSALS",
    "category": "proposal",
    "signalType": "proposal.follow-up-window",
    "title": "Proposition envoyée sans prochaine action",
    "summary": "La proposition reste active mais aucun suivi n’est planifié.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "CASABLANCA",
    "territoryCode": "CASABLANCA",
    "offerCode": "ACAD-ONSITE",
    "segmentCode": "PRESCHOOL_PRIVATE",
    "severity": "high",
    "confidence": "confirmed",
    "priorityScore": 85,
    "urgencyScore": 84,
    "opportunityScore": 82,
    "riskScore": 48,
    "status": "new",
    "occurredAt": "2026-07-20T03:12:00.000Z",
    "detectedAt": "2026-07-20T03:12:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-004",
        "entityCode": "ACC-004",
        "label": "Proposition envoyée sans prochaine action",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-B2B-PROPOSALS",
        "label": "Événement normalisé",
        "value": "proposal.follow-up-window",
        "observedAt": "2026-07-20T03:12:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "proposal-progression",
      "closing"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [
      "Validation humaine requise"
    ],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0005",
    "code": "SIG-0005",
    "rawEventId": "raw-0005",
    "sourceCode": "SRC-CUSTOMER-CLAIMS",
    "category": "customer-risk",
    "signalType": "customer.risk",
    "title": "Réclamation parent susceptible d’affecter un renouvellement",
    "summary": "Un partenaire actif a ouvert une réclamation de niveau élevé.",
    "businessUnitCode": "HOME_SERVICE",
    "marketCode": "RABAT",
    "territoryCode": "RABAT",
    "offerCode": "HOME-RECURRING",
    "segmentCode": "FAMILY",
    "severity": "high",
    "confidence": "confirmed",
    "priorityScore": 91,
    "urgencyScore": 89,
    "opportunityScore": 24,
    "riskScore": 94,
    "status": "acknowledged",
    "occurredAt": "2026-07-20T02:15:00.000Z",
    "detectedAt": "2026-07-20T02:15:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-005",
        "entityCode": "ACC-005",
        "label": "Réclamation parent susceptible d’affecter un renouvellement",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-CUSTOMER-CLAIMS",
        "label": "Événement normalisé",
        "value": "customer.risk",
        "observedAt": "2026-07-20T02:15:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "customer-rescue",
      "retention"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [
      "Validation humaine requise"
    ],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0006",
    "code": "SIG-0006",
    "rawEventId": "raw-0006",
    "sourceCode": "SRC-BROWSER-OPPORTUNITIES",
    "category": "market-opportunity",
    "signalType": "account.discovery",
    "title": "Réseau préscolaire multi-site détecté",
    "summary": "Organisation avec plusieurs sites identifiée dans le contexte navigateur.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "CASABLANCA",
    "territoryCode": "CASABLANCA",
    "offerCode": "ACAD-BUNDLE",
    "segmentCode": "PRESCHOOL_NETWORK",
    "severity": "high",
    "confidence": "high",
    "priorityScore": 89,
    "urgencyScore": 78,
    "opportunityScore": 96,
    "riskScore": 30,
    "status": "context-ready",
    "occurredAt": "2026-07-20T07:18:00.000Z",
    "detectedAt": "2026-07-20T07:18:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-006",
        "entityCode": "ACC-006",
        "label": "Réseau préscolaire multi-site détecté",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-BROWSER-OPPORTUNITIES",
        "label": "Événement normalisé",
        "value": "account.discovery",
        "observedAt": "2026-07-20T07:18:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "account-discovery",
      "executive-account-plan"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [
      "Validation humaine requise"
    ],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0007",
    "code": "SIG-0007",
    "rawEventId": "raw-0007",
    "sourceCode": "SRC-B2B-MEETINGS",
    "category": "meeting",
    "signalType": "meeting.readiness",
    "title": "Diagnostic partenaire prévu demain",
    "summary": "Le dossier de réunion ne contient pas encore la synthèse des besoins.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "KENITRA",
    "territoryCode": "KENITRA",
    "offerCode": "ACAD-DIAGNOSTIC",
    "segmentCode": "CRECHE_PRIVATE",
    "severity": "medium",
    "confidence": "confirmed",
    "priorityScore": 72,
    "urgencyScore": 80,
    "opportunityScore": 70,
    "riskScore": 35,
    "status": "triaged",
    "occurredAt": "2026-07-20T06:21:00.000Z",
    "detectedAt": "2026-07-20T06:21:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-007",
        "entityCode": "ACC-007",
        "label": "Diagnostic partenaire prévu demain",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-B2B-MEETINGS",
        "label": "Événement normalisé",
        "value": "meeting.readiness",
        "observedAt": "2026-07-20T06:21:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "meeting-diagnostic"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0008",
    "code": "SIG-0008",
    "rawEventId": "raw-0008",
    "sourceCode": "SRC-TRAINING-SESSIONS",
    "category": "capacity",
    "signalType": "academy.capacity-underused",
    "title": "Cohorte Academy sous-remplie",
    "summary": "Une cohorte dispose encore de 14 places à monétiser.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "RABAT",
    "territoryCode": "RABAT",
    "offerCode": "ACAD-ELEARNING",
    "segmentCode": "CRECHE_PRIVATE",
    "severity": "high",
    "confidence": "confirmed",
    "priorityScore": 86,
    "urgencyScore": 74,
    "opportunityScore": 94,
    "riskScore": 22,
    "status": "new",
    "occurredAt": "2026-07-20T05:24:00.000Z",
    "detectedAt": "2026-07-20T05:24:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-008",
        "entityCode": "ACC-008",
        "label": "Cohorte Academy sous-remplie",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-TRAINING-SESSIONS",
        "label": "Événement normalisé",
        "value": "academy.capacity-underused",
        "observedAt": "2026-07-20T05:24:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "capacity-monetization",
      "campaign-activation"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [
      "Validation humaine requise"
    ],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0009",
    "code": "SIG-0009",
    "rawEventId": "raw-0009",
    "sourceCode": "SRC-EMAIL-OUTBOX",
    "category": "execution",
    "signalType": "outreach.delivery-failure",
    "title": "Séquence e-mail B2B en échec partiel",
    "summary": "Quatre messages de la vague Casablanca ont échoué à la livraison.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "CASABLANCA",
    "territoryCode": "CASABLANCA",
    "offerCode": null,
    "segmentCode": "CRECHE_PRIVATE",
    "severity": "high",
    "confidence": "high",
    "priorityScore": 81,
    "urgencyScore": 88,
    "opportunityScore": 60,
    "riskScore": 72,
    "status": "monitoring",
    "occurredAt": "2026-07-20T04:27:00.000Z",
    "detectedAt": "2026-07-20T04:27:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-009",
        "entityCode": "ACC-009",
        "label": "Séquence e-mail B2B en échec partiel",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-EMAIL-OUTBOX",
        "label": "Événement normalisé",
        "value": "outreach.delivery-failure",
        "observedAt": "2026-07-20T04:27:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "channel-recovery"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [
      "Validation humaine requise"
    ],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0010",
    "code": "SIG-0010",
    "rawEventId": "raw-0010",
    "sourceCode": "SRC-REVENUE-PARTNERSHIPS",
    "category": "renewal",
    "signalType": "renewal.window",
    "title": "Partenariat Flashcards arrive en fenêtre de renouvellement",
    "summary": "Renouvellement recommandé dans les 21 jours avec potentiel Academy.",
    "businessUnitCode": "FLASHCARDS",
    "marketCode": "RABAT",
    "territoryCode": "RABAT",
    "offerCode": "FLASH-PLV",
    "segmentCode": "CRECHE_PRIVATE",
    "severity": "medium",
    "confidence": "confirmed",
    "priorityScore": 78,
    "urgencyScore": 62,
    "opportunityScore": 90,
    "riskScore": 28,
    "status": "context-ready",
    "occurredAt": "2026-07-20T03:30:00.000Z",
    "detectedAt": "2026-07-20T03:30:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-010",
        "entityCode": "ACC-010",
        "label": "Partenariat Flashcards arrive en fenêtre de renouvellement",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-REVENUE-PARTNERSHIPS",
        "label": "Événement normalisé",
        "value": "renewal.window",
        "observedAt": "2026-07-20T03:30:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "renewal",
      "cross-sell"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0011",
    "code": "SIG-0011",
    "rawEventId": "raw-0011",
    "sourceCode": "SRC-B2B-CONTACTS",
    "category": "account-intent",
    "signalType": "decision-maker.identified",
    "title": "Décideur pédagogique identifié",
    "summary": "La directrice pédagogique a été confirmée comme co-décideuse.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "CASABLANCA",
    "territoryCode": "CASABLANCA",
    "offerCode": "ACAD-ONSITE",
    "segmentCode": "PRESCHOOL_PRIVATE",
    "severity": "medium",
    "confidence": "confirmed",
    "priorityScore": 75,
    "urgencyScore": 70,
    "opportunityScore": 84,
    "riskScore": 20,
    "status": "acknowledged",
    "occurredAt": "2026-07-20T02:33:00.000Z",
    "detectedAt": "2026-07-20T02:33:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-011",
        "entityCode": "ACC-011",
        "label": "Décideur pédagogique identifié",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-B2B-CONTACTS",
        "label": "Événement normalisé",
        "value": "decision-maker.identified",
        "observedAt": "2026-07-20T02:33:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "account-plan",
      "qualification"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0012",
    "code": "SIG-0012",
    "rawEventId": "raw-0012",
    "sourceCode": "SRC-FINANCE-PAYMENTS",
    "category": "payment",
    "signalType": "payment.confirmed",
    "title": "Paiement de réservation reçu",
    "summary": "Le paiement permet de passer au handoff Academy sous contrôle.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "RABAT",
    "territoryCode": "RABAT",
    "offerCode": "ACAD-ONSITE",
    "segmentCode": "CRECHE_PRIVATE",
    "severity": "info",
    "confidence": "confirmed",
    "priorityScore": 65,
    "urgencyScore": 55,
    "opportunityScore": 75,
    "riskScore": 8,
    "status": "resolved",
    "occurredAt": "2026-07-20T07:36:00.000Z",
    "detectedAt": "2026-07-20T07:36:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-012",
        "entityCode": "ACC-012",
        "label": "Paiement de réservation reçu",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-FINANCE-PAYMENTS",
        "label": "Événement normalisé",
        "value": "payment.confirmed",
        "observedAt": "2026-07-20T07:36:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "delivery-handoff",
      "expansion"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0013",
    "code": "SIG-0013",
    "rawEventId": "raw-0013",
    "sourceCode": "SRC-B2B-PROSPECTS",
    "category": "market-opportunity",
    "signalType": "account.discovery",
    "title": "Prospect clinique maternité à qualifier",
    "summary": "Nouvelle organisation qualifiée pour une offre partenaire parent-enfant.",
    "businessUnitCode": "KINDERGARTEN",
    "marketCode": "CASABLANCA",
    "territoryCode": "CASABLANCA",
    "offerCode": "MATERNITY-PARTNER",
    "segmentCode": "MATERNITY_CLINIC",
    "severity": "medium",
    "confidence": "high",
    "priorityScore": 74,
    "urgencyScore": 60,
    "opportunityScore": 83,
    "riskScore": 25,
    "status": "new",
    "occurredAt": "2026-07-20T06:39:00.000Z",
    "detectedAt": "2026-07-20T06:39:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-013",
        "entityCode": "ACC-013",
        "label": "Prospect clinique maternité à qualifier",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-B2B-PROSPECTS",
        "label": "Événement normalisé",
        "value": "account.discovery",
        "observedAt": "2026-07-20T06:39:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "account-discovery",
      "segmentation"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0014",
    "code": "SIG-0014",
    "rawEventId": "raw-0014",
    "sourceCode": "SRC-REVENUE-PROSPECTS",
    "category": "data-quality",
    "signalType": "source.stale",
    "title": "Fiche prospect sans mise à jour depuis 45 jours",
    "summary": "Le score et l’étape du prospect ne sont plus assez frais.",
    "businessUnitCode": "CORPORATES",
    "marketCode": "RABAT",
    "territoryCode": "RABAT",
    "offerCode": null,
    "segmentCode": "CORPORATE",
    "severity": "high",
    "confidence": "high",
    "priorityScore": 77,
    "urgencyScore": 70,
    "opportunityScore": 45,
    "riskScore": 78,
    "status": "blocked",
    "occurredAt": "2026-07-20T05:42:00.000Z",
    "detectedAt": "2026-07-20T05:42:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-014",
        "entityCode": "ACC-014",
        "label": "Fiche prospect sans mise à jour depuis 45 jours",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-REVENUE-PROSPECTS",
        "label": "Événement normalisé",
        "value": "source.stale",
        "observedAt": "2026-07-20T05:42:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "data-recovery"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [
      "Validation humaine requise"
    ],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0015",
    "code": "SIG-0015",
    "rawEventId": "raw-0015",
    "sourceCode": "SRC-B2B-PROPOSALS",
    "category": "proposal",
    "signalType": "proposal.accepted",
    "title": "Proposition Academy acceptée verbalement",
    "summary": "Accord verbal observé; validation écrite et paiement restent requis.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "KENITRA",
    "territoryCode": "KENITRA",
    "offerCode": "ACAD-ONSITE",
    "segmentCode": "CRECHE_PRIVATE",
    "severity": "high",
    "confidence": "medium",
    "priorityScore": 84,
    "urgencyScore": 88,
    "opportunityScore": 90,
    "riskScore": 42,
    "status": "monitoring",
    "occurredAt": "2026-07-20T04:45:00.000Z",
    "detectedAt": "2026-07-20T04:45:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-015",
        "entityCode": "ACC-015",
        "label": "Proposition Academy acceptée verbalement",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-B2B-PROPOSALS",
        "label": "Événement normalisé",
        "value": "proposal.accepted",
        "observedAt": "2026-07-20T04:45:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "closing",
      "payment-gate"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [
      "Validation humaine requise"
    ],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0016",
    "code": "SIG-0016",
    "rawEventId": "raw-0016",
    "sourceCode": "SRC-EMAIL-INBOX",
    "category": "engagement",
    "signalType": "account.question",
    "title": "Demande de catalogue détaillé reçue",
    "summary": "Le contact souhaite comparer les catégories de formation.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "TANGER",
    "territoryCode": "TANGER",
    "offerCode": "ACAD-CATALOGUE",
    "segmentCode": "PRESCHOOL_PRIVATE",
    "severity": "medium",
    "confidence": "confirmed",
    "priorityScore": 70,
    "urgencyScore": 72,
    "opportunityScore": 78,
    "riskScore": 18,
    "status": "new",
    "occurredAt": "2026-07-20T03:48:00.000Z",
    "detectedAt": "2026-07-20T03:48:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-016",
        "entityCode": "ACC-016",
        "label": "Demande de catalogue détaillé reçue",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-EMAIL-INBOX",
        "label": "Événement normalisé",
        "value": "account.question",
        "observedAt": "2026-07-20T03:48:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "catalogue-engagement",
      "qualification"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0017",
    "code": "SIG-0017",
    "rawEventId": "raw-0017",
    "sourceCode": "SRC-REVENUE-PARTNERSHIPS",
    "category": "referral",
    "signalType": "partner.referral-potential",
    "title": "Partenaire satisfait avec potentiel de recommandation",
    "summary": "Le partenaire a terminé un cycle avec retour positif.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "CASABLANCA",
    "territoryCode": "CASABLANCA",
    "offerCode": "ACAD-ONSITE",
    "segmentCode": "CRECHE_PRIVATE",
    "severity": "medium",
    "confidence": "high",
    "priorityScore": 73,
    "urgencyScore": 54,
    "opportunityScore": 88,
    "riskScore": 10,
    "status": "context-ready",
    "occurredAt": "2026-07-20T02:51:00.000Z",
    "detectedAt": "2026-07-20T02:51:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-017",
        "entityCode": "ACC-017",
        "label": "Partenaire satisfait avec potentiel de recommandation",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-REVENUE-PARTNERSHIPS",
        "label": "Événement normalisé",
        "value": "partner.referral-potential",
        "observedAt": "2026-07-20T02:51:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "referral",
      "account-expansion"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  },
  {
    "id": "sig-0018",
    "code": "SIG-0018",
    "rawEventId": "raw-0018",
    "sourceCode": "SRC-B2B-MEETINGS",
    "category": "meeting",
    "signalType": "meeting.no-show-risk",
    "title": "Rendez-vous non confirmé à moins de 6 heures",
    "summary": "Le décideur n’a pas confirmé le créneau; risque de no-show.",
    "businessUnitCode": "ACADEMY",
    "marketCode": "RABAT",
    "territoryCode": "RABAT",
    "offerCode": "ACAD-DIAGNOSTIC",
    "segmentCode": "CRECHE_PRIVATE",
    "severity": "high",
    "confidence": "high",
    "priorityScore": 82,
    "urgencyScore": 90,
    "opportunityScore": 68,
    "riskScore": 65,
    "status": "new",
    "occurredAt": "2026-07-20T07:54:00.000Z",
    "detectedAt": "2026-07-20T07:54:00.000Z",
    "expiresAt": "2026-07-21T08:00:00.000Z",
    "ownerRole": "Revenue Manager",
    "entities": [
      {
        "entityType": "account",
        "entityId": "entity-018",
        "entityCode": "ACC-018",
        "label": "Rendez-vous non confirmé à moins de 6 heures",
        "relationship": "primary"
      }
    ],
    "evidence": [
      {
        "source": "SRC-B2B-MEETINGS",
        "label": "Événement normalisé",
        "value": "meeting.no-show-risk",
        "observedAt": "2026-07-20T07:54:00.000Z"
      }
    ],
    "recommendedCommandFamilies": [
      "meeting-rescue"
    ],
    "recommendedNextActions": [
      "Construire un contexte minimisé",
      "Soumettre la prochaine action au futur moteur de commandes"
    ],
    "blockingReasons": [
      "Validation humaine requise"
    ],
    "metadata": {
      "seed": true,
      "shadowOnly": true
    }
  }
] as RevenueSignal[]
export const REVENUE_SIGNAL_SEED_RAW_EVENTS = [
  {
    "id": "raw-0001",
    "eventId": "EVT-SIG-0001",
    "sourceCode": "SRC-EMAIL-INBOX",
    "sourceRecordId": "record-0001",
    "eventType": "account.high-intent",
    "occurredAt": "2026-07-20T06:03:00.000Z",
    "receivedAt": "2026-07-20T06:03:00.000Z",
    "deduplicationKey": "dedup-0001",
    "payloadHash": "hash-0001",
    "payload": {
      "title": "Direction de crèche demande les modalités Academy",
      "status": "new",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0002",
    "eventId": "EVT-SIG-0002",
    "sourceCode": "SRC-FINANCE-INVOICES",
    "sourceRecordId": "record-0002",
    "eventType": "payment.overdue",
    "occurredAt": "2026-07-20T05:06:00.000Z",
    "receivedAt": "2026-07-20T05:06:00.000Z",
    "deduplicationKey": "dedup-0002",
    "payloadHash": "hash-0002",
    "payload": {
      "title": "Échéance partenaire Academy dépassée",
      "status": "new",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0003",
    "eventId": "EVT-SIG-0003",
    "sourceCode": "SRC-ACADEMY-TRAINERS",
    "sourceRecordId": "record-0003",
    "eventType": "capacity.constraint",
    "occurredAt": "2026-07-20T04:09:00.000Z",
    "receivedAt": "2026-07-20T04:09:00.000Z",
    "deduplicationKey": "dedup-0003",
    "payloadHash": "hash-0003",
    "payload": {
      "title": "Capacité formateur Rabat sous seuil",
      "status": "triaged",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0004",
    "eventId": "EVT-SIG-0004",
    "sourceCode": "SRC-B2B-PROPOSALS",
    "sourceRecordId": "record-0004",
    "eventType": "proposal.follow-up-window",
    "occurredAt": "2026-07-20T03:12:00.000Z",
    "receivedAt": "2026-07-20T03:12:00.000Z",
    "deduplicationKey": "dedup-0004",
    "payloadHash": "hash-0004",
    "payload": {
      "title": "Proposition envoyée sans prochaine action",
      "status": "new",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0005",
    "eventId": "EVT-SIG-0005",
    "sourceCode": "SRC-CUSTOMER-CLAIMS",
    "sourceRecordId": "record-0005",
    "eventType": "customer.risk",
    "occurredAt": "2026-07-20T02:15:00.000Z",
    "receivedAt": "2026-07-20T02:15:00.000Z",
    "deduplicationKey": "dedup-0005",
    "payloadHash": "hash-0005",
    "payload": {
      "title": "Réclamation parent susceptible d’affecter un renouvellement",
      "status": "acknowledged",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0006",
    "eventId": "EVT-SIG-0006",
    "sourceCode": "SRC-BROWSER-OPPORTUNITIES",
    "sourceRecordId": "record-0006",
    "eventType": "account.discovery",
    "occurredAt": "2026-07-20T07:18:00.000Z",
    "receivedAt": "2026-07-20T07:18:00.000Z",
    "deduplicationKey": "dedup-0006",
    "payloadHash": "hash-0006",
    "payload": {
      "title": "Réseau préscolaire multi-site détecté",
      "status": "context-ready",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0007",
    "eventId": "EVT-SIG-0007",
    "sourceCode": "SRC-B2B-MEETINGS",
    "sourceRecordId": "record-0007",
    "eventType": "meeting.readiness",
    "occurredAt": "2026-07-20T06:21:00.000Z",
    "receivedAt": "2026-07-20T06:21:00.000Z",
    "deduplicationKey": "dedup-0007",
    "payloadHash": "hash-0007",
    "payload": {
      "title": "Diagnostic partenaire prévu demain",
      "status": "triaged",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0008",
    "eventId": "EVT-SIG-0008",
    "sourceCode": "SRC-TRAINING-SESSIONS",
    "sourceRecordId": "record-0008",
    "eventType": "academy.capacity-underused",
    "occurredAt": "2026-07-20T05:24:00.000Z",
    "receivedAt": "2026-07-20T05:24:00.000Z",
    "deduplicationKey": "dedup-0008",
    "payloadHash": "hash-0008",
    "payload": {
      "title": "Cohorte Academy sous-remplie",
      "status": "new",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0009",
    "eventId": "EVT-SIG-0009",
    "sourceCode": "SRC-EMAIL-OUTBOX",
    "sourceRecordId": "record-0009",
    "eventType": "outreach.delivery-failure",
    "occurredAt": "2026-07-20T04:27:00.000Z",
    "receivedAt": "2026-07-20T04:27:00.000Z",
    "deduplicationKey": "dedup-0009",
    "payloadHash": "hash-0009",
    "payload": {
      "title": "Séquence e-mail B2B en échec partiel",
      "status": "monitoring",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0010",
    "eventId": "EVT-SIG-0010",
    "sourceCode": "SRC-REVENUE-PARTNERSHIPS",
    "sourceRecordId": "record-0010",
    "eventType": "renewal.window",
    "occurredAt": "2026-07-20T03:30:00.000Z",
    "receivedAt": "2026-07-20T03:30:00.000Z",
    "deduplicationKey": "dedup-0010",
    "payloadHash": "hash-0010",
    "payload": {
      "title": "Partenariat Flashcards arrive en fenêtre de renouvellement",
      "status": "context-ready",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0011",
    "eventId": "EVT-SIG-0011",
    "sourceCode": "SRC-B2B-CONTACTS",
    "sourceRecordId": "record-0011",
    "eventType": "decision-maker.identified",
    "occurredAt": "2026-07-20T02:33:00.000Z",
    "receivedAt": "2026-07-20T02:33:00.000Z",
    "deduplicationKey": "dedup-0011",
    "payloadHash": "hash-0011",
    "payload": {
      "title": "Décideur pédagogique identifié",
      "status": "acknowledged",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0012",
    "eventId": "EVT-SIG-0012",
    "sourceCode": "SRC-FINANCE-PAYMENTS",
    "sourceRecordId": "record-0012",
    "eventType": "payment.confirmed",
    "occurredAt": "2026-07-20T07:36:00.000Z",
    "receivedAt": "2026-07-20T07:36:00.000Z",
    "deduplicationKey": "dedup-0012",
    "payloadHash": "hash-0012",
    "payload": {
      "title": "Paiement de réservation reçu",
      "status": "resolved",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0013",
    "eventId": "EVT-SIG-0013",
    "sourceCode": "SRC-B2B-PROSPECTS",
    "sourceRecordId": "record-0013",
    "eventType": "account.discovery",
    "occurredAt": "2026-07-20T06:39:00.000Z",
    "receivedAt": "2026-07-20T06:39:00.000Z",
    "deduplicationKey": "dedup-0013",
    "payloadHash": "hash-0013",
    "payload": {
      "title": "Prospect clinique maternité à qualifier",
      "status": "new",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0014",
    "eventId": "EVT-SIG-0014",
    "sourceCode": "SRC-REVENUE-PROSPECTS",
    "sourceRecordId": "record-0014",
    "eventType": "source.stale",
    "occurredAt": "2026-07-20T05:42:00.000Z",
    "receivedAt": "2026-07-20T05:42:00.000Z",
    "deduplicationKey": "dedup-0014",
    "payloadHash": "hash-0014",
    "payload": {
      "title": "Fiche prospect sans mise à jour depuis 45 jours",
      "status": "blocked",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0015",
    "eventId": "EVT-SIG-0015",
    "sourceCode": "SRC-B2B-PROPOSALS",
    "sourceRecordId": "record-0015",
    "eventType": "proposal.accepted",
    "occurredAt": "2026-07-20T04:45:00.000Z",
    "receivedAt": "2026-07-20T04:45:00.000Z",
    "deduplicationKey": "dedup-0015",
    "payloadHash": "hash-0015",
    "payload": {
      "title": "Proposition Academy acceptée verbalement",
      "status": "monitoring",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0016",
    "eventId": "EVT-SIG-0016",
    "sourceCode": "SRC-EMAIL-INBOX",
    "sourceRecordId": "record-0016",
    "eventType": "account.question",
    "occurredAt": "2026-07-20T03:48:00.000Z",
    "receivedAt": "2026-07-20T03:48:00.000Z",
    "deduplicationKey": "dedup-0016",
    "payloadHash": "hash-0016",
    "payload": {
      "title": "Demande de catalogue détaillé reçue",
      "status": "new",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0017",
    "eventId": "EVT-SIG-0017",
    "sourceCode": "SRC-REVENUE-PARTNERSHIPS",
    "sourceRecordId": "record-0017",
    "eventType": "partner.referral-potential",
    "occurredAt": "2026-07-20T02:51:00.000Z",
    "receivedAt": "2026-07-20T02:51:00.000Z",
    "deduplicationKey": "dedup-0017",
    "payloadHash": "hash-0017",
    "payload": {
      "title": "Partenaire satisfait avec potentiel de recommandation",
      "status": "context-ready",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0018",
    "eventId": "EVT-SIG-0018",
    "sourceCode": "SRC-B2B-MEETINGS",
    "sourceRecordId": "record-0018",
    "eventType": "meeting.no-show-risk",
    "occurredAt": "2026-07-20T07:54:00.000Z",
    "receivedAt": "2026-07-20T07:54:00.000Z",
    "deduplicationKey": "dedup-0018",
    "payloadHash": "hash-0018",
    "payload": {
      "title": "Rendez-vous non confirmé à moins de 6 heures",
      "status": "new",
      "source_seed": true
    },
    "processingStatus": "normalized"
  },
  {
    "id": "raw-0019",
    "eventId": "EVT-SIG-0019",
    "sourceCode": "SRC-EMAIL-INBOX",
    "sourceRecordId": "record-0001",
    "eventType": "email.received",
    "occurredAt": "2026-07-20T06:03:00.000Z",
    "receivedAt": "2026-07-20T06:04:00.000Z",
    "deduplicationKey": "dedup-0001",
    "payloadHash": "hash-duplicate",
    "payload": {
      "subject": "duplicate"
    },
    "processingStatus": "duplicate",
    "duplicateOfEventId": "EVT-SIG-0001"
  },
  {
    "id": "raw-0020",
    "eventId": "EVT-SIG-0020",
    "sourceCode": "SRC-EMAIL-INBOX",
    "sourceRecordId": "record-0001",
    "eventType": "email.received",
    "occurredAt": "2026-07-20T06:03:00.000Z",
    "receivedAt": "2026-07-20T06:05:00.000Z",
    "deduplicationKey": "dedup-0001",
    "payloadHash": "hash-duplicate",
    "payload": {
      "subject": "duplicate"
    },
    "processingStatus": "duplicate",
    "duplicateOfEventId": "EVT-SIG-0001"
  },
  {
    "id": "raw-0021",
    "eventId": "EVT-SIG-0021",
    "sourceCode": "SRC-EMAIL-INBOX",
    "sourceRecordId": "record-0001",
    "eventType": "email.received",
    "occurredAt": "2026-07-20T06:03:00.000Z",
    "receivedAt": "2026-07-20T06:06:00.000Z",
    "deduplicationKey": "dedup-0001",
    "payloadHash": "hash-duplicate",
    "payload": {
      "subject": "duplicate"
    },
    "processingStatus": "duplicate",
    "duplicateOfEventId": "EVT-SIG-0001"
  }
] as RevenueRawSignalEvent[]
export const REVENUE_SIGNAL_SEED_SCANS = [
  {
    "id": "scan-001",
    "code": "SCAN-SRC-B2B-PROSPECTS",
    "name": "Scan incrémental · Prospects B2B",
    "sourceCode": "SRC-B2B-PROSPECTS",
    "scheduleExpression": "*/15 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 60,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T06:05:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 12,
    "consecutiveFailures": 0
  },
  {
    "id": "scan-002",
    "code": "SCAN-SRC-B2B-CONTACTS",
    "name": "Scan incrémental · Contacts & décideurs B2B",
    "sourceCode": "SRC-B2B-CONTACTS",
    "scheduleExpression": "*/30 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 60,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T05:10:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 7,
    "consecutiveFailures": 0
  },
  {
    "id": "scan-003",
    "code": "SCAN-SRC-B2B-MEETINGS",
    "name": "Scan incrémental · Réunions B2B",
    "sourceCode": "SRC-B2B-MEETINGS",
    "scheduleExpression": "*/15 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 60,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T04:15:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 1,
    "consecutiveFailures": 0
  },
  {
    "id": "scan-004",
    "code": "SCAN-SRC-B2B-PROPOSALS",
    "name": "Scan incrémental · Propositions B2B",
    "sourceCode": "SRC-B2B-PROPOSALS",
    "scheduleExpression": "*/15 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 60,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T07:20:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 2,
    "consecutiveFailures": 1
  },
  {
    "id": "scan-005",
    "code": "SCAN-SRC-BROWSER-OPPORTUNITIES",
    "name": "Scan incrémental · Opportunités extension navigateur",
    "sourceCode": "SRC-BROWSER-OPPORTUNITIES",
    "scheduleExpression": "*/10 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 60,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T06:25:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 9,
    "consecutiveFailures": 0
  },
  {
    "id": "scan-006",
    "code": "SCAN-SRC-REVENUE-PROSPECTS",
    "name": "Scan incrémental · Pipeline Revenue historique",
    "sourceCode": "SRC-REVENUE-PROSPECTS",
    "scheduleExpression": "*/30 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 60,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T05:30:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "partial",
    "lastCreatedSignals": 4,
    "consecutiveFailures": 3
  },
  {
    "id": "scan-007",
    "code": "SCAN-SRC-REVENUE-APPOINTMENTS",
    "name": "Scan incrémental · Rendez-vous Revenue",
    "sourceCode": "SRC-REVENUE-APPOINTMENTS",
    "scheduleExpression": "*/15 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 60,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T04:35:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 1,
    "consecutiveFailures": 0
  },
  {
    "id": "scan-008",
    "code": "SCAN-SRC-REVENUE-PARTNERSHIPS",
    "name": "Scan incrémental · Partenariats actifs",
    "sourceCode": "SRC-REVENUE-PARTNERSHIPS",
    "scheduleExpression": "*/60 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 120,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T07:40:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 2,
    "consecutiveFailures": 0
  },
  {
    "id": "scan-009",
    "code": "SCAN-SRC-EMAIL-INBOX",
    "name": "Scan incrémental · Email OS — Inbox",
    "sourceCode": "SRC-EMAIL-INBOX",
    "scheduleExpression": "*/5 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 60,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T06:45:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 18,
    "consecutiveFailures": 2
  },
  {
    "id": "scan-010",
    "code": "SCAN-SRC-EMAIL-OUTBOX",
    "name": "Scan incrémental · Email OS — Outbox",
    "sourceCode": "SRC-EMAIL-OUTBOX",
    "scheduleExpression": "*/5 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 60,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T05:50:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 14,
    "consecutiveFailures": 4
  },
  {
    "id": "scan-011",
    "code": "SCAN-SRC-TRAINING-SESSIONS",
    "name": "Scan incrémental · Sessions TrainingHub",
    "sourceCode": "SRC-TRAINING-SESSIONS",
    "scheduleExpression": "*/30 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 60,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T04:55:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 3,
    "consecutiveFailures": 0
  },
  {
    "id": "scan-012",
    "code": "SCAN-SRC-ACADEMY-TRAINERS",
    "name": "Scan incrémental · Capacité formateurs Academy",
    "sourceCode": "SRC-ACADEMY-TRAINERS",
    "scheduleExpression": "*/30 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 60,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T07:00:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "partial",
    "lastCreatedSignals": 2,
    "consecutiveFailures": 2
  },
  {
    "id": "scan-013",
    "code": "SCAN-SRC-FINANCE-INVOICES",
    "name": "Scan incrémental · Factures & échéances",
    "sourceCode": "SRC-FINANCE-INVOICES",
    "scheduleExpression": "*/60 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 120,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T06:05:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 3,
    "consecutiveFailures": 1
  },
  {
    "id": "scan-014",
    "code": "SCAN-SRC-FINANCE-PAYMENTS",
    "name": "Scan incrémental · Paiements reçus",
    "sourceCode": "SRC-FINANCE-PAYMENTS",
    "scheduleExpression": "*/60 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 120,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T05:10:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 3,
    "consecutiveFailures": 0
  },
  {
    "id": "scan-015",
    "code": "SCAN-SRC-CUSTOMER-CLAIMS",
    "name": "Scan incrémental · Réclamations & risque client",
    "sourceCode": "SRC-CUSTOMER-CLAIMS",
    "scheduleExpression": "*/30 * * * *",
    "timezone": "Africa/Casablanca",
    "scanMode": "incremental",
    "lookbackMinutes": 60,
    "maximumRecords": 100,
    "status": "active",
    "lastRunAt": "2026-07-20T04:15:00.000Z",
    "nextRunAt": "2026-07-20T08:15:00.000Z",
    "lastOutcome": "success",
    "lastCreatedSignals": 1,
    "consecutiveFailures": 0
  }
] as RevenueScheduledScan[]
export const REVENUE_SIGNAL_SEED_HEALTH = [
  {
    "id": "health-001",
    "sourceCode": "SRC-B2B-PROSPECTS",
    "status": "healthy",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 127,
    "freshnessMinutes": 28,
    "recordsObserved": 128,
    "normalizedSignals": 16,
    "duplicateEvents": 1,
    "failedEvents": 0,
    "lastError": null,
    "diagnostic": "Source exploitable en observation Shadow."
  },
  {
    "id": "health-002",
    "sourceCode": "SRC-B2B-CONTACTS",
    "status": "healthy",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 154,
    "freshnessMinutes": 36,
    "recordsObserved": 76,
    "normalizedSignals": 9,
    "duplicateEvents": 2,
    "failedEvents": 0,
    "lastError": null,
    "diagnostic": "Source exploitable en observation Shadow."
  },
  {
    "id": "health-003",
    "sourceCode": "SRC-B2B-MEETINGS",
    "status": "healthy",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 181,
    "freshnessMinutes": 44,
    "recordsObserved": 18,
    "normalizedSignals": 2,
    "duplicateEvents": 3,
    "failedEvents": 0,
    "lastError": null,
    "diagnostic": "Source exploitable en observation Shadow."
  },
  {
    "id": "health-004",
    "sourceCode": "SRC-B2B-PROPOSALS",
    "status": "healthy",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 208,
    "freshnessMinutes": 52,
    "recordsObserved": 24,
    "normalizedSignals": 3,
    "duplicateEvents": 0,
    "failedEvents": 1,
    "lastError": null,
    "diagnostic": "Source exploitable en observation Shadow."
  },
  {
    "id": "health-005",
    "sourceCode": "SRC-BROWSER-OPPORTUNITIES",
    "status": "healthy",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 235,
    "freshnessMinutes": 60,
    "recordsObserved": 94,
    "normalizedSignals": 11,
    "duplicateEvents": 1,
    "failedEvents": 0,
    "lastError": null,
    "diagnostic": "Source exploitable en observation Shadow."
  },
  {
    "id": "health-006",
    "sourceCode": "SRC-REVENUE-PROSPECTS",
    "status": "degraded",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 262,
    "freshnessMinutes": 68,
    "recordsObserved": 46,
    "normalizedSignals": 5,
    "duplicateEvents": 2,
    "failedEvents": 3,
    "lastError": "Erreurs partielles de lecture.",
    "diagnostic": "Intervention recommandée avant utilisation stratégique."
  },
  {
    "id": "health-007",
    "sourceCode": "SRC-REVENUE-APPOINTMENTS",
    "status": "healthy",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 289,
    "freshnessMinutes": 76,
    "recordsObserved": 14,
    "normalizedSignals": 1,
    "duplicateEvents": 3,
    "failedEvents": 0,
    "lastError": null,
    "diagnostic": "Source exploitable en observation Shadow."
  },
  {
    "id": "health-008",
    "sourceCode": "SRC-REVENUE-PARTNERSHIPS",
    "status": "healthy",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 316,
    "freshnessMinutes": 84,
    "recordsObserved": 20,
    "normalizedSignals": 2,
    "duplicateEvents": 0,
    "failedEvents": 0,
    "lastError": null,
    "diagnostic": "Source exploitable en observation Shadow."
  },
  {
    "id": "health-009",
    "sourceCode": "SRC-EMAIL-INBOX",
    "status": "healthy",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 343,
    "freshnessMinutes": 92,
    "recordsObserved": 183,
    "normalizedSignals": 22,
    "duplicateEvents": 1,
    "failedEvents": 2,
    "lastError": null,
    "diagnostic": "Source exploitable en observation Shadow."
  },
  {
    "id": "health-010",
    "sourceCode": "SRC-EMAIL-OUTBOX",
    "status": "healthy",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 370,
    "freshnessMinutes": 100,
    "recordsObserved": 142,
    "normalizedSignals": 17,
    "duplicateEvents": 2,
    "failedEvents": 4,
    "lastError": null,
    "diagnostic": "Source exploitable en observation Shadow."
  },
  {
    "id": "health-011",
    "sourceCode": "SRC-TRAINING-SESSIONS",
    "status": "healthy",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 397,
    "freshnessMinutes": 108,
    "recordsObserved": 37,
    "normalizedSignals": 4,
    "duplicateEvents": 3,
    "failedEvents": 0,
    "lastError": null,
    "diagnostic": "Source exploitable en observation Shadow."
  },
  {
    "id": "health-012",
    "sourceCode": "SRC-ACADEMY-TRAINERS",
    "status": "degraded",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 424,
    "freshnessMinutes": 116,
    "recordsObserved": 21,
    "normalizedSignals": 2,
    "duplicateEvents": 0,
    "failedEvents": 2,
    "lastError": "Erreurs partielles de lecture.",
    "diagnostic": "Intervention recommandée avant utilisation stratégique."
  },
  {
    "id": "health-013",
    "sourceCode": "SRC-FINANCE-INVOICES",
    "status": "stale",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 451,
    "freshnessMinutes": 124,
    "recordsObserved": 39,
    "normalizedSignals": 4,
    "duplicateEvents": 1,
    "failedEvents": 1,
    "lastError": "Source dépassant le seuil de fraîcheur.",
    "diagnostic": "Intervention recommandée avant utilisation stratégique."
  },
  {
    "id": "health-014",
    "sourceCode": "SRC-FINANCE-PAYMENTS",
    "status": "healthy",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 478,
    "freshnessMinutes": 132,
    "recordsObserved": 31,
    "normalizedSignals": 3,
    "duplicateEvents": 2,
    "failedEvents": 0,
    "lastError": null,
    "diagnostic": "Source exploitable en observation Shadow."
  },
  {
    "id": "health-015",
    "sourceCode": "SRC-CUSTOMER-CLAIMS",
    "status": "healthy",
    "checkedAt": "2026-07-20T08:00:00.000Z",
    "latencyMs": 505,
    "freshnessMinutes": 140,
    "recordsObserved": 12,
    "normalizedSignals": 1,
    "duplicateEvents": 3,
    "failedEvents": 0,
    "lastError": null,
    "diagnostic": "Source exploitable en observation Shadow."
  }
] as RevenueSignalSourceHealth[]
export const REVENUE_SIGNAL_SEED_CONTEXTS = [
  {
    "id": "ctx-001",
    "code": "CTX-SIG-0001",
    "signalCode": "SIG-0001",
    "purpose": "Préparer un contexte vérifiable pour recommandation future sans exécution externe.",
    "audienceRole": "Direction Revenue",
    "visibilityProfile": "executive",
    "status": "ready",
    "generatedAt": "2026-07-20T08:00:00.000Z",
    "expiresAt": "2026-07-20T14:00:00.000Z",
    "facts": [
      {
        "key": "signal",
        "label": "Signal principal",
        "value": "Direction de crèche demande les modalités Academy",
        "confidence": "confirmed",
        "sourceCode": "SRC-EMAIL-INBOX"
      },
      {
        "key": "business-unit",
        "label": "Unité commerciale",
        "value": "ACADEMY",
        "confidence": "confirmed",
        "sourceCode": "DIGITAL-TWIN"
      }
    ],
    "hypotheses": [
      {
        "key": "h1",
        "statement": "Ce signal peut justifier une action revenue prioritaire.",
        "validationMethod": "Vérifier le dossier, le décideur, la capacité et la doctrine applicable."
      }
    ],
    "constraints": [
      "Shadow mode: aucune communication externe",
      "Les prix et capacités non validés ne peuvent pas devenir des faits"
    ],
    "opportunities": [
      "Réponse reçue après consultation du catalogue; besoin de rendez-vous rapide."
    ],
    "risks": [
      "Validation humaine requise"
    ],
    "sources": [
      {
        "sourceType": "signal",
        "sourceCode": "SRC-EMAIL-INBOX",
        "label": "Signal normalisé",
        "authority": "primary",
        "freshness": "live",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      },
      {
        "sourceType": "digital-twin",
        "sourceCode": "AC-REVENUE-TWIN",
        "label": "Jumeau commercial",
        "authority": "approved",
        "freshness": "fresh",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      }
    ],
    "redactedFields": [
      "message.body",
      "credentials",
      "tokens"
    ],
    "completenessScore": 83,
    "freshnessScore": 89
  },
  {
    "id": "ctx-002",
    "code": "CTX-SIG-0002",
    "signalCode": "SIG-0002",
    "purpose": "Préparer un contexte vérifiable pour recommandation future sans exécution externe.",
    "audienceRole": "Direction Revenue",
    "visibilityProfile": "revenue-manager",
    "status": "ready",
    "generatedAt": "2026-07-20T08:00:00.000Z",
    "expiresAt": "2026-07-20T14:00:00.000Z",
    "facts": [
      {
        "key": "signal",
        "label": "Signal principal",
        "value": "Échéance partenaire Academy dépassée",
        "confidence": "confirmed",
        "sourceCode": "SRC-FINANCE-INVOICES"
      },
      {
        "key": "business-unit",
        "label": "Unité commerciale",
        "value": "ACADEMY",
        "confidence": "confirmed",
        "sourceCode": "DIGITAL-TWIN"
      }
    ],
    "hypotheses": [
      {
        "key": "h1",
        "statement": "Ce signal peut justifier une action revenue prioritaire.",
        "validationMethod": "Vérifier le dossier, le décideur, la capacité et la doctrine applicable."
      }
    ],
    "constraints": [
      "Shadow mode: aucune communication externe",
      "Les prix et capacités non validés ne peuvent pas devenir des faits"
    ],
    "opportunities": [
      "Facture arrivée à échéance sans paiement ni promesse active."
    ],
    "risks": [
      "Validation humaine requise"
    ],
    "sources": [
      {
        "sourceType": "signal",
        "sourceCode": "SRC-FINANCE-INVOICES",
        "label": "Signal normalisé",
        "authority": "primary",
        "freshness": "live",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      },
      {
        "sourceType": "digital-twin",
        "sourceCode": "AC-REVENUE-TWIN",
        "label": "Jumeau commercial",
        "authority": "approved",
        "freshness": "fresh",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      }
    ],
    "redactedFields": [
      "message.body",
      "credentials",
      "tokens"
    ],
    "completenessScore": 84,
    "freshnessScore": 88
  },
  {
    "id": "ctx-003",
    "code": "CTX-SIG-0003",
    "signalCode": "SIG-0003",
    "purpose": "Préparer un contexte vérifiable pour recommandation future sans exécution externe.",
    "audienceRole": "Direction Revenue",
    "visibilityProfile": "executive",
    "status": "ready",
    "generatedAt": "2026-07-20T08:00:00.000Z",
    "expiresAt": "2026-07-20T14:00:00.000Z",
    "facts": [
      {
        "key": "signal",
        "label": "Signal principal",
        "value": "Capacité formateur Rabat sous seuil",
        "confidence": "high",
        "sourceCode": "SRC-ACADEMY-TRAINERS"
      },
      {
        "key": "business-unit",
        "label": "Unité commerciale",
        "value": "ACADEMY",
        "confidence": "confirmed",
        "sourceCode": "DIGITAL-TWIN"
      }
    ],
    "hypotheses": [
      {
        "key": "h1",
        "statement": "Ce signal peut justifier une action revenue prioritaire.",
        "validationMethod": "Vérifier le dossier, le décideur, la capacité et la doctrine applicable."
      }
    ],
    "constraints": [
      "Shadow mode: aucune communication externe",
      "Les prix et capacités non validés ne peuvent pas devenir des faits"
    ],
    "opportunities": [
      "Deux créneaux seulement restent disponibles avant la pause estivale."
    ],
    "risks": [
      "Validation humaine requise"
    ],
    "sources": [
      {
        "sourceType": "signal",
        "sourceCode": "SRC-ACADEMY-TRAINERS",
        "label": "Signal normalisé",
        "authority": "primary",
        "freshness": "live",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      },
      {
        "sourceType": "digital-twin",
        "sourceCode": "AC-REVENUE-TWIN",
        "label": "Jumeau commercial",
        "authority": "approved",
        "freshness": "fresh",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      }
    ],
    "redactedFields": [
      "message.body",
      "credentials",
      "tokens"
    ],
    "completenessScore": 85,
    "freshnessScore": 87
  },
  {
    "id": "ctx-004",
    "code": "CTX-SIG-0004",
    "signalCode": "SIG-0004",
    "purpose": "Préparer un contexte vérifiable pour recommandation future sans exécution externe.",
    "audienceRole": "Direction Revenue",
    "visibilityProfile": "revenue-manager",
    "status": "ready",
    "generatedAt": "2026-07-20T08:00:00.000Z",
    "expiresAt": "2026-07-20T14:00:00.000Z",
    "facts": [
      {
        "key": "signal",
        "label": "Signal principal",
        "value": "Proposition envoyée sans prochaine action",
        "confidence": "confirmed",
        "sourceCode": "SRC-B2B-PROPOSALS"
      },
      {
        "key": "business-unit",
        "label": "Unité commerciale",
        "value": "ACADEMY",
        "confidence": "confirmed",
        "sourceCode": "DIGITAL-TWIN"
      }
    ],
    "hypotheses": [
      {
        "key": "h1",
        "statement": "Ce signal peut justifier une action revenue prioritaire.",
        "validationMethod": "Vérifier le dossier, le décideur, la capacité et la doctrine applicable."
      }
    ],
    "constraints": [
      "Shadow mode: aucune communication externe",
      "Les prix et capacités non validés ne peuvent pas devenir des faits"
    ],
    "opportunities": [
      "La proposition reste active mais aucun suivi n’est planifié."
    ],
    "risks": [
      "Validation humaine requise"
    ],
    "sources": [
      {
        "sourceType": "signal",
        "sourceCode": "SRC-B2B-PROPOSALS",
        "label": "Signal normalisé",
        "authority": "primary",
        "freshness": "live",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      },
      {
        "sourceType": "digital-twin",
        "sourceCode": "AC-REVENUE-TWIN",
        "label": "Jumeau commercial",
        "authority": "approved",
        "freshness": "fresh",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      }
    ],
    "redactedFields": [
      "message.body",
      "credentials",
      "tokens"
    ],
    "completenessScore": 86,
    "freshnessScore": 86
  },
  {
    "id": "ctx-005",
    "code": "CTX-SIG-0005",
    "signalCode": "SIG-0005",
    "purpose": "Préparer un contexte vérifiable pour recommandation future sans exécution externe.",
    "audienceRole": "Direction Revenue",
    "visibilityProfile": "executive",
    "status": "ready",
    "generatedAt": "2026-07-20T08:00:00.000Z",
    "expiresAt": "2026-07-20T14:00:00.000Z",
    "facts": [
      {
        "key": "signal",
        "label": "Signal principal",
        "value": "Réclamation parent susceptible d’affecter un renouvellement",
        "confidence": "confirmed",
        "sourceCode": "SRC-CUSTOMER-CLAIMS"
      },
      {
        "key": "business-unit",
        "label": "Unité commerciale",
        "value": "HOME_SERVICE",
        "confidence": "confirmed",
        "sourceCode": "DIGITAL-TWIN"
      }
    ],
    "hypotheses": [
      {
        "key": "h1",
        "statement": "Ce signal peut justifier une action revenue prioritaire.",
        "validationMethod": "Vérifier le dossier, le décideur, la capacité et la doctrine applicable."
      }
    ],
    "constraints": [
      "Shadow mode: aucune communication externe",
      "Les prix et capacités non validés ne peuvent pas devenir des faits"
    ],
    "opportunities": [
      "Un partenaire actif a ouvert une réclamation de niveau élevé."
    ],
    "risks": [
      "Validation humaine requise"
    ],
    "sources": [
      {
        "sourceType": "signal",
        "sourceCode": "SRC-CUSTOMER-CLAIMS",
        "label": "Signal normalisé",
        "authority": "primary",
        "freshness": "live",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      },
      {
        "sourceType": "digital-twin",
        "sourceCode": "AC-REVENUE-TWIN",
        "label": "Jumeau commercial",
        "authority": "approved",
        "freshness": "fresh",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      }
    ],
    "redactedFields": [
      "message.body",
      "credentials",
      "tokens"
    ],
    "completenessScore": 87,
    "freshnessScore": 85
  },
  {
    "id": "ctx-006",
    "code": "CTX-SIG-0006",
    "signalCode": "SIG-0006",
    "purpose": "Préparer un contexte vérifiable pour recommandation future sans exécution externe.",
    "audienceRole": "Direction Revenue",
    "visibilityProfile": "revenue-manager",
    "status": "ready",
    "generatedAt": "2026-07-20T08:00:00.000Z",
    "expiresAt": "2026-07-20T14:00:00.000Z",
    "facts": [
      {
        "key": "signal",
        "label": "Signal principal",
        "value": "Réseau préscolaire multi-site détecté",
        "confidence": "high",
        "sourceCode": "SRC-BROWSER-OPPORTUNITIES"
      },
      {
        "key": "business-unit",
        "label": "Unité commerciale",
        "value": "ACADEMY",
        "confidence": "confirmed",
        "sourceCode": "DIGITAL-TWIN"
      }
    ],
    "hypotheses": [
      {
        "key": "h1",
        "statement": "Ce signal peut justifier une action revenue prioritaire.",
        "validationMethod": "Vérifier le dossier, le décideur, la capacité et la doctrine applicable."
      }
    ],
    "constraints": [
      "Shadow mode: aucune communication externe",
      "Les prix et capacités non validés ne peuvent pas devenir des faits"
    ],
    "opportunities": [
      "Organisation avec plusieurs sites identifiée dans le contexte navigateur."
    ],
    "risks": [
      "Validation humaine requise"
    ],
    "sources": [
      {
        "sourceType": "signal",
        "sourceCode": "SRC-BROWSER-OPPORTUNITIES",
        "label": "Signal normalisé",
        "authority": "primary",
        "freshness": "live",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      },
      {
        "sourceType": "digital-twin",
        "sourceCode": "AC-REVENUE-TWIN",
        "label": "Jumeau commercial",
        "authority": "approved",
        "freshness": "fresh",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      }
    ],
    "redactedFields": [
      "message.body",
      "credentials",
      "tokens"
    ],
    "completenessScore": 88,
    "freshnessScore": 84
  },
  {
    "id": "ctx-007",
    "code": "CTX-SIG-0007",
    "signalCode": "SIG-0007",
    "purpose": "Préparer un contexte vérifiable pour recommandation future sans exécution externe.",
    "audienceRole": "Direction Revenue",
    "visibilityProfile": "executive",
    "status": "ready",
    "generatedAt": "2026-07-20T08:00:00.000Z",
    "expiresAt": "2026-07-20T14:00:00.000Z",
    "facts": [
      {
        "key": "signal",
        "label": "Signal principal",
        "value": "Diagnostic partenaire prévu demain",
        "confidence": "confirmed",
        "sourceCode": "SRC-B2B-MEETINGS"
      },
      {
        "key": "business-unit",
        "label": "Unité commerciale",
        "value": "ACADEMY",
        "confidence": "confirmed",
        "sourceCode": "DIGITAL-TWIN"
      }
    ],
    "hypotheses": [
      {
        "key": "h1",
        "statement": "Ce signal peut justifier une action revenue prioritaire.",
        "validationMethod": "Vérifier le dossier, le décideur, la capacité et la doctrine applicable."
      }
    ],
    "constraints": [
      "Shadow mode: aucune communication externe",
      "Les prix et capacités non validés ne peuvent pas devenir des faits"
    ],
    "opportunities": [
      "Le dossier de réunion ne contient pas encore la synthèse des besoins."
    ],
    "risks": [],
    "sources": [
      {
        "sourceType": "signal",
        "sourceCode": "SRC-B2B-MEETINGS",
        "label": "Signal normalisé",
        "authority": "primary",
        "freshness": "live",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      },
      {
        "sourceType": "digital-twin",
        "sourceCode": "AC-REVENUE-TWIN",
        "label": "Jumeau commercial",
        "authority": "approved",
        "freshness": "fresh",
        "retrievedAt": "2026-07-20T08:00:00.000Z",
        "redactions": []
      }
    ],
    "redactedFields": [
      "message.body",
      "credentials",
      "tokens"
    ],
    "completenessScore": 89,
    "freshnessScore": 83
  }
] as RevenueSignalContextSnapshot[]
export const REVENUE_SIGNAL_SEED_SUBSCRIPTIONS = [
  {
    "id": "sub-001",
    "code": "SUB-EXEC-CRITICAL",
    "name": "Alertes critiques Direction Revenue",
    "subscriberType": "role",
    "subscriberKey": "Direction Revenue",
    "categories": [
      "payment",
      "customer-risk",
      "capacity",
      "pipeline-risk"
    ],
    "severities": [
      "critical",
      "high"
    ],
    "businessUnitCodes": [],
    "territoryCodes": [],
    "deliveryMode": "approval-queue",
    "cooldownMinutes": 15,
    "active": true
  },
  {
    "id": "sub-002",
    "code": "SUB-ACADEMY-INTENT",
    "name": "Intentions Academy",
    "subscriberType": "workspace",
    "subscriberKey": "Academy Commercial",
    "categories": [
      "account-intent",
      "meeting",
      "proposal",
      "market-opportunity"
    ],
    "severities": [
      "critical",
      "high",
      "medium"
    ],
    "businessUnitCodes": [
      "ACADEMY"
    ],
    "territoryCodes": [
      "RABAT",
      "CASABLANCA",
      "KENITRA"
    ],
    "deliveryMode": "mission-proposal",
    "cooldownMinutes": 30,
    "active": true
  },
  {
    "id": "sub-003",
    "code": "SUB-FINANCE-RECOVERY",
    "name": "Récupération revenu",
    "subscriberType": "role",
    "subscriberKey": "Finance & Collections",
    "categories": [
      "payment"
    ],
    "severities": [
      "critical",
      "high"
    ],
    "businessUnitCodes": [],
    "territoryCodes": [],
    "deliveryMode": "in-app",
    "cooldownMinutes": 10,
    "active": true
  },
  {
    "id": "sub-004",
    "code": "SUB-WEEKLY-DIGEST",
    "name": "Digest hebdomadaire opportunités",
    "subscriberType": "workspace",
    "subscriberKey": "Vue stratégique",
    "categories": [
      "market-opportunity",
      "renewal",
      "referral",
      "seasonality"
    ],
    "severities": [
      "high",
      "medium",
      "low",
      "info"
    ],
    "businessUnitCodes": [],
    "territoryCodes": [],
    "deliveryMode": "digest",
    "cooldownMinutes": 10080,
    "active": true
  }
] as RevenueSignalSubscription[]
