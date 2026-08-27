export type ZoneCDomain = 'finance' | 'reports'

export type ZoneCSurfaceKey =
  | 'finance-root'
  | 'finance-fees'
  | 'finance-fee-assignments'
  | 'finance-invoices'
  | 'finance-invoice-detail'
  | 'finance-payments'
  | 'finance-payment-detail'
  | 'finance-receipts'
  | 'finance-discounts'
  | 'finance-reminders'
  | 'finance-balances'
  | 'finance-statements'
  | 'finance-expenses'
  | 'finance-audit'
  | 'reports-root'
  | 'reports-catalogue'
  | 'reports-templates'
  | 'reports-requests'
  | 'reports-history'
  | 'reports-audit'

export type ZoneCCommandSurfaceId =
  | 'fee-builder'
  | 'fee-assignment'
  | 'invoice-quick'
  | 'invoice-review'
  | 'invoice-line'
  | 'payment-capture'
  | 'payment-allocation'
  | 'payment-evidence'
  | 'receipt-readiness'
  | 'discount-decision'
  | 'collections-followup'
  | 'balance-explanation'
  | 'family-financial-quickpeek'
  | 'statement-review'
  | 'expense-entry'
  | 'expense-evidence'
  | 'finance-integrity'
  | 'finance-history'
  | 'report-definition'
  | 'template-studio'
  | 'report-request-builder'
  | 'generation-readiness'
  | 'report-result'
  | 'report-evidence'

export type ZoneCRouteDescriptor = {
  key: ZoneCSurfaceKey
  domain: ZoneCDomain
  title: string
  eyebrow: string
  subtitle: string
  signature: string
  accent: 'navy' | 'emerald' | 'azure' | 'amber' | 'coral' | 'violet' | 'indigo' | 'slate'
  commands: ZoneCCommandSurfaceId[]
  truth: string[]
  attention: string
}

export const financeNav = [
  { label: 'Vue finance', hint: 'Tour de contrôle', href: '/angelcare-360-command-center/finance' },
  { label: 'Frais', hint: 'Architecture', href: '/angelcare-360-command-center/finance/frais' },
  { label: 'Affectations', hint: 'Application', href: '/angelcare-360-command-center/finance/affectations-frais' },
  { label: 'Factures', hint: 'Créances', href: '/angelcare-360-command-center/finance/factures' },
  { label: 'Paiements', hint: 'Encaissements', href: '/angelcare-360-command-center/finance/paiements' },
  { label: 'Reçus', hint: 'Traçabilité', href: '/angelcare-360-command-center/finance/recus' },
  { label: 'Soldes', hint: 'Explication', href: '/angelcare-360-command-center/finance/soldes-eleves' },
  { label: 'Relances', hint: 'Suivi', href: '/angelcare-360-command-center/finance/relances' },
  { label: 'Remises', hint: 'Décisions', href: '/angelcare-360-command-center/finance/remises' },
  { label: 'États compte', hint: 'Chronologie', href: '/angelcare-360-command-center/finance/etats-compte' },
  { label: 'Dépenses', hint: 'Contrôle', href: '/angelcare-360-command-center/finance/depenses' },
  { label: 'Audit', hint: 'Intégrité', href: '/angelcare-360-command-center/finance/audit' },
] as const

export const reportsNav = [
  { label: 'Pilotage', hint: 'Command room', href: '/angelcare-360-command-center/rapports' },
  { label: 'Catalogue', hint: 'Définitions', href: '/angelcare-360-command-center/rapports/catalogue' },
  { label: 'Modèles', hint: 'Atelier', href: '/angelcare-360-command-center/rapports/modeles' },
  { label: 'Demandes', hint: 'Opérations', href: '/angelcare-360-command-center/rapports/demandes' },
  { label: 'Historique', hint: 'Vault', href: '/angelcare-360-command-center/rapports/historique' },
  { label: 'Audit', hint: 'Preuves', href: '/angelcare-360-command-center/rapports/audit' },
] as const

const sharedFinanceTruth = [
  'Une facture émise ne signifie jamais un paiement reçu.',
  'Un paiement reçu ne signifie jamais une facture totalement réglée.',
  'Tout solde doit rester explicable par ses écritures sources.',
]

const sharedReportsTruth = [
  'Une définition de rapport ne signifie pas qu’un fichier a été généré.',
  'Un état prêt n’est affiché que si le backend le confirme réellement.',
  'Aucun PDF, export ou avancement de traitement n’est simulé.',
]

export const descriptors: Record<ZoneCSurfaceKey, ZoneCRouteDescriptor> = {
  'finance-root': {
    key: 'finance-root', domain: 'finance', title: 'Finance Control Tower', eyebrow: 'Zone C · Autorité financière',
    subtitle: 'Facturation, encaissements, soldes, exceptions et intégrité réunis dans un poste de commandement financier lisible, traçable et sans ambiguïté comptable.',
    signature: 'Cash & Receivables Runway', accent: 'navy', commands: ['invoice-quick','payment-capture','balance-explanation','finance-integrity'],
    truth: sharedFinanceTruth, attention: 'Priorité : comprendre et résoudre les écarts financiers avant de communiquer ou clôturer.'
  },
  'finance-fees': {
    key: 'finance-fees', domain: 'finance', title: 'Fee Architecture Studio', eyebrow: 'Zone C · Structure des frais',
    subtitle: 'Concevoir et lire la structure tarifaire sans confondre définition de frais, affectation élève et créance facturée.',
    signature: 'Fee Architecture Map', accent: 'azure', commands: ['fee-builder','fee-assignment','finance-history'],
    truth: ['Définition de frais ≠ affectation.', 'Affectation ≠ facture.', 'Toute modification doit rester historiquement reconstructible.'],
    attention: 'Vérifier la portée académique et l’impact avant toute modification de structure.'
  },
  'finance-fee-assignments': {
    key: 'finance-fee-assignments', domain: 'finance', title: 'Fee Assignment Command', eyebrow: 'Zone C · Affectation des frais',
    subtitle: 'Relier chaque frais au bon élève, à la bonne classe et à la bonne période avec un contexte d’impact explicite.',
    signature: 'Assignment Flow Control', accent: 'indigo', commands: ['fee-assignment','balance-explanation','invoice-quick'],
    truth: ['Un frais disponible n’est pas automatiquement appliqué.', 'Une affectation doit avoir une portée et une période explicites.', 'Les doublons doivent être évités par l’autorité existante.'],
    attention: 'Contrôler la cible, la période et les doublons avant création.'
  },
  'finance-invoices': {
    key: 'finance-invoices', domain: 'finance', title: 'Invoice Operations Board', eyebrow: 'Zone C · Créances scolaires',
    subtitle: 'Piloter les factures par état réel, échéance et solde restant, avec accès immédiat au dossier et aux paiements affectés.',
    signature: 'Invoice Settlement Lanes', accent: 'amber', commands: ['invoice-quick','invoice-review','payment-allocation','collections-followup'],
    truth: ['Émise ≠ réglée.', 'Partiellement réglée reste une créance ouverte.', 'Le solde doit provenir des lignes et affectations réelles.'],
    attention: 'Concentrer le travail sur les créances ouvertes, partielles et arrivées à échéance.'
  },
  'finance-invoice-detail': {
    key: 'finance-invoice-detail', domain: 'finance', title: 'Invoice Control Dossier', eyebrow: 'Zone C · Dossier facture',
    subtitle: 'Une lecture souveraine de la facture : lignes, paiements, affectations, remises, relances et historique dans un seul contexte.',
    signature: 'Invoice Evidence Stack', accent: 'amber', commands: ['invoice-review','invoice-line','payment-allocation','finance-history'],
    truth: ['Le montant original reste distinct des paiements et remises.', 'Les affectations expliquent le règlement réel.', 'L’historique ne doit jamais être écrasé.'],
    attention: 'Toute décision commence par la décomposition du montant et des affectations.'
  },
  'finance-payments': {
    key: 'finance-payments', domain: 'finance', title: 'Payment Command Ledger', eyebrow: 'Zone C · Encaissements',
    subtitle: 'Enregistrer, vérifier et affecter les paiements sans transformer automatiquement un encaissement en règlement complet.',
    signature: 'Allocation Integrity Flow', accent: 'emerald', commands: ['payment-capture','payment-allocation','payment-evidence','finance-integrity'],
    truth: ['Paiement reçu ≠ allocation.', 'Allocation partielle ≠ facture réglée.', 'Une référence de paiement reste une preuve, pas une conclusion.'],
    attention: 'Priorité aux paiements non affectés ou partiellement affectés.'
  },
  'finance-payment-detail': {
    key: 'finance-payment-detail', domain: 'finance', title: 'Payment Evidence Dossier', eyebrow: 'Zone C · Preuve d’encaissement',
    subtitle: 'Montant, méthode, référence, affectations et historique réunis pour expliquer exactement ce que le paiement a réglé.',
    signature: 'Payment Evidence Chain', accent: 'emerald', commands: ['payment-evidence','payment-allocation','receipt-readiness','finance-history'],
    truth: ['Le paiement reste distinct de ses affectations.', 'Une facture peut rester partiellement ouverte.', 'Le reçu dépend d’un contexte de paiement cohérent.'],
    attention: 'Vérifier l’affectation avant de considérer le règlement comme complet.'
  },
  'finance-receipts': {
    key: 'finance-receipts', domain: 'finance', title: 'Receipt Control Desk', eyebrow: 'Zone C · Traçabilité des reçus',
    subtitle: 'Distinguer le registre de reçu de la capacité documentaire : aucune génération PDF n’est présentée comme active sans moteur réel.',
    signature: 'Receipt Readiness Shield', accent: 'slate', commands: ['receipt-readiness','payment-evidence','finance-history'],
    truth: ['Registre de reçu ≠ fichier PDF.', 'PDF non activé tant que le moteur documentaire n’est pas validé.', 'Le paiement source reste consultable.'],
    attention: 'La traçabilité reste disponible même lorsque le document PDF ne l’est pas.'
  },
  'finance-discounts': {
    key: 'finance-discounts', domain: 'finance', title: 'Discount & Exception Authority', eyebrow: 'Zone C · Remises contrôlées',
    subtitle: 'Examiner l’exception financière avec son motif, son autorité et son impact exact sur la créance avant décision.',
    signature: 'Before / After Impact Lens', accent: 'violet', commands: ['discount-decision','balance-explanation','finance-history'],
    truth: ['Demandée ≠ approuvée.', 'Approuvée ≠ appliquée sans mutation canonique.', 'L’impact sur le solde doit être explicite.'],
    attention: 'Une remise est une décision financière sensible et doit rester attribuée et justifiée.'
  },
  'finance-reminders': {
    key: 'finance-reminders', domain: 'finance', title: 'Collections & Follow-up Command', eyebrow: 'Zone C · Relances responsables',
    subtitle: 'Organiser les suivis de créances sans prétendre qu’un message externe a été livré si le moteur de communication ne le confirme pas.',
    signature: 'Collections Follow-up Timeline', accent: 'coral', commands: ['collections-followup','family-financial-quickpeek','balance-explanation'],
    truth: ['Relance préparée ≠ relance livrée.', 'Le solde financier reste autorité Finance.', 'La continuité de relation reste autorité Relation Parents.'],
    attention: 'Le suivi doit être factuel, respectueux et relié à la créance exacte.'
  },
  'finance-balances': {
    key: 'finance-balances', domain: 'finance', title: 'Student & Family Balance Command', eyebrow: 'Zone C · Soldes explicables',
    subtitle: 'Chaque solde devient une histoire financière compréhensible : factures, paiements, remises et reste dû.',
    signature: 'Pourquoi ce solde ?', accent: 'azure', commands: ['balance-explanation','family-financial-quickpeek','statement-review'],
    truth: ['Aucun solde orphelin.', 'Le solde doit ouvrir ses écritures contributrices.', 'Le terme dette élève est évité : le contexte est familial et institutionnel.'],
    attention: 'Un montant sans explication n’est jamais une expérience financière acceptable.'
  },
  'finance-statements': {
    key: 'finance-statements', domain: 'finance', title: 'Account Statement Atelier', eyebrow: 'Zone C · Chronologie financière',
    subtitle: 'Lire la relation financière dans le temps : factures, paiements, remises, affectations et solde courant sans inventer de fichier exporté.',
    signature: 'Chronological Ledger Rail', accent: 'indigo', commands: ['statement-review','balance-explanation','finance-history'],
    truth: ['Prévisualisation ≠ PDF.', 'La chronologie doit conserver les états historiques.', 'Chaque écriture reste reliée à sa source.'],
    attention: 'Le relevé doit expliquer le solde, pas seulement l’afficher.'
  },
  'finance-expenses': {
    key: 'finance-expenses', domain: 'finance', title: 'Expense Control Board', eyebrow: 'Zone C · Dépenses',
    subtitle: 'Saisir et examiner les dépenses avec preuve, catégorie, motif et historique sans prétendre remplacer une comptabilité générale.',
    signature: 'Expense Evidence Grid', accent: 'coral', commands: ['expense-entry','expense-evidence','finance-integrity'],
    truth: ['Dépense saisie ≠ dépense validée.', 'Dépense validée ≠ paiement bancaire.', 'La preuve et l’historique restent distincts de l’écriture.'],
    attention: 'Contrôler l’existence de la dépense et sa preuve avant interprétation.'
  },
  'finance-audit': {
    key: 'finance-audit', domain: 'finance', title: 'Financial Integrity Lens', eyebrow: 'Zone C · Audit financier',
    subtitle: 'Reconstruire les changements de factures, paiements, affectations, remises, reçus et dépenses sans perdre l’état précédent.',
    signature: 'Financial Evidence Timeline', accent: 'slate', commands: ['finance-integrity','finance-history','payment-evidence','invoice-review'],
    truth: ['Correction ≠ suppression de l’original.', 'Avant / après doit rester reconstructible.', 'L’acteur et le moment sont des éléments de preuve.'],
    attention: 'L’audit sert à expliquer, pas à masquer ou réécrire l’histoire.'
  },
  'reports-root': {
    key: 'reports-root', domain: 'reports', title: 'Reporting Command Room', eyebrow: 'Zone C · Reporting Intelligence Studio',
    subtitle: 'Piloter définitions, demandes, readiness, résultats réels et historique avec une séparation stricte entre donnée disponible et fichier réellement généré.',
    signature: 'Report Truth Runway', accent: 'indigo', commands: ['report-definition','report-request-builder','generation-readiness','report-evidence'],
    truth: sharedReportsTruth, attention: 'La vérité du traitement prime toujours sur l’apparence de progression.'
  },
  'reports-catalogue': {
    key: 'reports-catalogue', domain: 'reports', title: 'Report Catalogue Gallery', eyebrow: 'Zone C · Catalogue rapports',
    subtitle: 'Comprendre ce que chaque rapport répond, quelles données il utilise et si sa production réelle est disponible.',
    signature: 'Definition Cards & Readiness', accent: 'azure', commands: ['report-definition','report-request-builder','generation-readiness'],
    truth: ['Catalogue ≠ résultat.', 'Définition disponible ≠ génération active.', 'Les paramètres proviennent du modèle réel.'],
    attention: 'Choisir le rapport par question de pilotage, pas par effet visuel.'
  },
  'reports-templates': {
    key: 'reports-templates', domain: 'reports', title: 'Template Atelier', eyebrow: 'Zone C · Gouvernance des modèles',
    subtitle: 'Gérer l’identité, la portée, les paramètres et les versions de modèles sans simuler un éditeur de document inexistant.',
    signature: 'Version Stack Atelier', accent: 'violet', commands: ['template-studio','report-definition','report-evidence'],
    truth: ['Modèle ≠ rapport produit.', 'Version actuelle doit rester identifiable.', 'Aucun WYSIWYG fictif.'],
    attention: 'La gouvernance du modèle doit précéder toute promesse de rendu.'
  },
  'reports-requests': {
    key: 'reports-requests', domain: 'reports', title: 'Report Request Operations', eyebrow: 'Zone C · Demandes de rapports',
    subtitle: 'Préparer et suivre les demandes par état réel : demandé, traitement disponible ou bloqué, prêt, échec ou annulé.',
    signature: 'Request Lifecycle Lanes', accent: 'amber', commands: ['report-request-builder','generation-readiness','report-result','report-evidence'],
    truth: ['Demandé ≠ généré.', 'Traitement verrouillé n’a pas de faux pourcentage.', 'Prêt exige une preuve backend.'],
    attention: 'Chaque demande doit révéler clairement ce que la plateforme peut réellement produire.'
  },
  'reports-history': {
    key: 'reports-history', domain: 'reports', title: 'Reporting History Vault', eyebrow: 'Zone C · Historique reporting',
    subtitle: 'Retrouver les demandes, paramètres, états, erreurs et résultats réels sans fabriquer de fichier pour combler une absence.',
    signature: 'Evidence Vault Timeline', accent: 'slate', commands: ['report-result','report-evidence','generation-readiness'],
    truth: ['Historique de demande ≠ fichier historique.', 'Un résultat doit avoir une référence réelle.', 'Les échecs et blocages restent visibles.'],
    attention: 'Le vault raconte exactement ce qui s’est passé, y compris quand rien n’a été généré.'
  },
  'reports-audit': {
    key: 'reports-audit', domain: 'reports', title: 'Reporting Evidence Lens', eyebrow: 'Zone C · Audit reporting',
    subtitle: 'Reconstituer qui a demandé quoi, avec quels paramètres, quelle source, quel état et quel résultat réel.',
    signature: 'Request-to-Evidence Graph', accent: 'slate', commands: ['report-evidence','report-result','report-definition'],
    truth: ['La demande et le résultat restent distincts.', 'Les paramètres doivent être reconstructibles.', 'Un blocage réel reste un résultat d’audit valable.'],
    attention: 'La traçabilité est complète même quand la génération n’est pas disponible.'
  },
}

export function resolveZoneCSurface(pathname: string): ZoneCSurfaceKey {
  const p = pathname.replace(/\/$/, '')
  if (p.startsWith('/angelcare-360-command-center/rapports')) {
    if (p.endsWith('/catalogue')) return 'reports-catalogue'
    if (p.endsWith('/modeles')) return 'reports-templates'
    if (p.endsWith('/demandes')) return 'reports-requests'
    if (p.endsWith('/historique')) return 'reports-history'
    if (p.endsWith('/audit')) return 'reports-audit'
    return 'reports-root'
  }
  if (/\/finance\/factures\/[^/]+$/.test(p)) return 'finance-invoice-detail'
  if (/\/finance\/paiements\/[^/]+$/.test(p)) return 'finance-payment-detail'
  if (p.endsWith('/finance/frais') || /\/finance\/frais\/[^/]+$/.test(p)) return 'finance-fees'
  if (p.endsWith('/finance/affectations-frais')) return 'finance-fee-assignments'
  if (p.endsWith('/finance/factures')) return 'finance-invoices'
  if (p.endsWith('/finance/paiements')) return 'finance-payments'
  if (p.endsWith('/finance/recus')) return 'finance-receipts'
  if (p.endsWith('/finance/remises')) return 'finance-discounts'
  if (p.endsWith('/finance/relances')) return 'finance-reminders'
  if (p.endsWith('/finance/soldes-eleves')) return 'finance-balances'
  if (p.endsWith('/finance/etats-compte')) return 'finance-statements'
  if (p.endsWith('/finance/depenses')) return 'finance-expenses'
  if (p.endsWith('/finance/audit')) return 'finance-audit'
  return 'finance-root'
}

export const commandPaletteItems = [
  ['FC','Tour de contrôle Finance','/angelcare-360-command-center/finance'],
  ['FR','Architecture des frais','/angelcare-360-command-center/finance/frais'],
  ['AF','Affectations de frais','/angelcare-360-command-center/finance/affectations-frais'],
  ['FA','Factures','/angelcare-360-command-center/finance/factures'],
  ['PA','Paiements','/angelcare-360-command-center/finance/paiements'],
  ['RE','Reçus','/angelcare-360-command-center/finance/recus'],
  ['SO','Soldes élèves & familles','/angelcare-360-command-center/finance/soldes-eleves'],
  ['RL','Relances','/angelcare-360-command-center/finance/relances'],
  ['RM','Remises','/angelcare-360-command-center/finance/remises'],
  ['EC','États de compte','/angelcare-360-command-center/finance/etats-compte'],
  ['DE','Dépenses','/angelcare-360-command-center/finance/depenses'],
  ['FI','Intégrité financière','/angelcare-360-command-center/finance/audit'],
  ['RC','Reporting Command Room','/angelcare-360-command-center/rapports'],
  ['CA','Catalogue rapports','/angelcare-360-command-center/rapports/catalogue'],
  ['MO','Modèles rapports','/angelcare-360-command-center/rapports/modeles'],
  ['DR','Demandes rapports','/angelcare-360-command-center/rapports/demandes'],
  ['HR','Historique rapports','/angelcare-360-command-center/rapports/historique'],
  ['AR','Audit reporting','/angelcare-360-command-center/rapports/audit'],
] as const
