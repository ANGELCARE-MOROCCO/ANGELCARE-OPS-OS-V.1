import type { Ac360WiringKey } from './action-wiring'

export type Ac360CustomerCommandField = {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'date'
  required?: boolean
  placeholder?: string
  options?: string[]
  defaultValue?: string | number
}

export type Ac360CustomerCommand = {
  key: string
  moduleKey: string
  label: string
  shortLabel: string
  description: string
  businessImpact: string
  wiringKey: Ac360WiringKey | string
  targetEndpoint: string
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  quantity: number
  creditSignal: string
  entitlementSignal: string
  riskSignal: string
  successMessage: string
  payloadTemplate: Record<string, unknown>
  fields: Ac360CustomerCommandField[]
  recommendedNext?: string[]
}

const phase = 'phase_3e_customer_command_execution'

const baseMeta = (moduleKey: string, commandKey: string) => ({
  source: 'ac360_customer_command_modal',
  phase,
  moduleKey,
  commandKey,
  locale: 'fr-MA',
})

export const ac360CustomerCommands: Ac360CustomerCommand[] = [
  {
    key: 'students.create',
    moduleKey: 'students-families',
    label: 'Créer un élève avec pré-vol AC360',
    shortLabel: 'Créer élève',
    description: 'Créer un nouveau dossier enfant uniquement après contrôle plan, capacité élèves, restrictions et audit.',
    businessImpact: 'Protège la capacité facturable et prépare le dossier 360 famille, classe, santé et finance.',
    wiringKey: 'ac360.school_ops.student.create' as any,
    targetEndpoint: '/api/ac360/school-ops/students',
    method: 'POST',
    quantity: 1,
    creditSignal: 'Capacité élève active · pas de crédit si création simple.',
    entitlementSignal: 'Nécessite accès Élèves & Familles inclus dans le plan.',
    riskSignal: 'Blocage si capacité élèves atteinte ou compte restreint.',
    successMessage: 'Dossier élève créé ou accepté par le runtime AC360.',
    fields: [
      { key: 'first_name', label: 'Prénom enfant', type: 'text', required: true, defaultValue: 'Sara' },
      { key: 'last_name', label: 'Nom enfant', type: 'text', required: true, defaultValue: 'Benali' },
      { key: 'level_label', label: 'Niveau souhaité', type: 'select', options: ['Petite Section', 'Moyenne Section', 'Grande Section', 'Primaire'], defaultValue: 'Petite Section' },
    ],
    payloadTemplate: { status: 'active', enrollment_status: 'enrolled', metadata_json: baseMeta('students-families', 'students.create') },
    recommendedNext: ['Lier un parent', 'Affecter une classe', 'Compléter documents et santé'],
  },
  {
    key: 'attendance.session.open',
    moduleKey: 'attendance',
    label: 'Ouvrir la session présence du jour',
    shortLabel: 'Ouvrir session',
    description: 'Ouvrir le daybook quotidien avec contrôle des droits, de la politique et de l’audit.',
    businessImpact: 'Structure la journée opérationnelle : présences, absences, retards, corrections et clôture.',
    wiringKey: 'ac360.school_attendance.session.open' as any,
    targetEndpoint: '/api/ac360/school-attendance/sessions/open',
    method: 'POST',
    quantity: 1,
    creditSignal: 'Action opérationnelle gouvernée · pas de message envoyé automatiquement.',
    entitlementSignal: 'Nécessite module Présence actif.',
    riskSignal: 'Blocage si restriction politique ou module non autorisé.',
    successMessage: 'Session présence ouverte ou confirmée.',
    fields: [
      { key: 'sessionKey', label: 'Type session', type: 'select', options: ['daily', 'morning', 'afternoon'], defaultValue: 'daily' },
      { key: 'sessionDate', label: 'Date session', type: 'date', defaultValue: new Date().toISOString().slice(0, 10) },
    ],
    payloadTemplate: { metadata: baseMeta('attendance', 'attendance.session.open') },
    recommendedNext: ['Enregistrer les présences', 'Surveiller absences non justifiées', 'Clôturer avec preuve'],
  },
  {
    key: 'finance.invoice.issue',
    moduleKey: 'finance',
    label: 'Émettre une facture gouvernée',
    shortLabel: 'Émettre facture',
    description: 'Émettre une facture avec préflight plan, Finance, droits utilisateur et audit.',
    businessImpact: 'Transforme la scolarité et les services en créance structurée et traçable.',
    wiringKey: 'ac360.school_finance.invoice.issue' as any,
    targetEndpoint: '/api/ac360/school-finance/invoices/issue',
    method: 'POST',
    quantity: 1,
    creditSignal: 'Émission facture incluse selon plan · notifications parent séparées consomment crédits.',
    entitlementSignal: 'Nécessite Finance active, droits facture et absence de restriction dure.',
    riskSignal: 'Ajustements et relances peuvent nécessiter validation ou crédits.',
    successMessage: 'Facture soumise au runtime Finance AC360.',
    fields: [
      { key: 'invoiceTitle', label: 'Libellé facture', type: 'text', required: true, defaultValue: 'Frais mensuels' },
      { key: 'amountMad', label: 'Montant MAD', type: 'number', required: true, defaultValue: 1200 },
      { key: 'dueDate', label: 'Échéance', type: 'date', defaultValue: new Date().toISOString().slice(0, 10) },
    ],
    payloadTemplate: { currency: 'MAD', metadata: baseMeta('finance', 'finance.invoice.issue') },
    recommendedNext: ['Notifier le parent', 'Créer promesse si nécessaire', 'Suivre en créances'],
  },
  {
    key: 'admissions.lead.create',
    moduleKey: 'admissions',
    label: 'Créer un lead admissions',
    shortLabel: 'Créer lead',
    description: 'Créer un prospect avec contrôle module Admissions, pipeline et capacité commerciale.',
    businessImpact: 'Capture une opportunité d’inscription et l’insère dans le pipeline de conversion.',
    wiringKey: 'ac360.school_admissions.lead.create' as any,
    targetEndpoint: '/api/ac360/school-admissions/leads/create',
    method: 'POST',
    quantity: 1,
    creditSignal: 'Création incluse · campagnes de relance consommeront crédits.',
    entitlementSignal: 'Admissions doit être inclus ou activé via Growth Menu.',
    riskSignal: 'Blocage si add-on non actif ou restriction compte.',
    successMessage: 'Lead admissions créé ou accepté par le CRM AC360.',
    fields: [
      { key: 'childFirstName', label: 'Prénom enfant', type: 'text', required: true, defaultValue: 'Yasmine' },
      { key: 'childLastName', label: 'Nom enfant', type: 'text', required: true, defaultValue: 'Alaoui' },
      { key: 'parentName', label: 'Nom parent', type: 'text', required: true, defaultValue: 'Mme Alaoui' },
      { key: 'parentPhone', label: 'Téléphone parent', type: 'text', defaultValue: '+212600000000' },
      { key: 'desiredLevel', label: 'Niveau demandé', type: 'select', options: ['Crèche', 'Petite Section', 'Moyenne Section', 'Grande Section'], defaultValue: 'Petite Section' },
    ],
    payloadTemplate: { sourceKey: 'manual', metadata: baseMeta('admissions', 'admissions.lead.create') },
    recommendedNext: ['Planifier visite', 'Créer suivi 48h', 'Générer offre si intérêt confirmé'],
  },
  {
    key: 'communication.campaign.create',
    moduleKey: 'communication',
    label: 'Créer une campagne parent',
    shortLabel: 'Créer campagne',
    description: 'Préparer une campagne avec audience, canal, consentement, estimation crédits et preuve.',
    businessImpact: 'Centralise les annonces, relances et communications parents avec gouvernance de livraison.',
    wiringKey: 'ac360.school_communication.campaign.create' as any,
    targetEndpoint: '/api/ac360/school-communication/campaigns/create',
    method: 'POST',
    quantity: 1,
    creditSignal: 'Création campagne incluse · dispatch WhatsApp/SMS consommera crédits.',
    entitlementSignal: 'Nécessite Communication active et respect consentements.',
    riskSignal: 'Canal bloqué si crédits insuffisants ou opt-out.',
    successMessage: 'Campagne créée en brouillon ou file AC360.',
    fields: [
      { key: 'campaignName', label: 'Nom campagne', type: 'text', required: true, defaultValue: 'Annonce parents' },
      { key: 'channel', label: 'Canal', type: 'select', options: ['push', 'email', 'whatsapp', 'sms'], defaultValue: 'push' },
      { key: 'audienceType', label: 'Audience', type: 'select', options: ['parents', 'classe', 'finance', 'admissions'], defaultValue: 'parents' },
    ],
    payloadTemplate: { status: 'draft', metadata: baseMeta('communication', 'communication.campaign.create') },
    recommendedNext: ['Rendre le modèle', 'Estimer crédits', 'Planifier dispatch'],
  },
  {
    key: 'documents.report.queue',
    moduleKey: 'documents',
    label: 'Mettre un rapport en file',
    shortLabel: 'Générer rapport',
    description: 'Créer une demande de rapport avec contrôle plan, crédits rapport, stockage et audit.',
    businessImpact: 'Produit un livrable de pilotage ou preuve opérationnelle pour direction, parents ou finance.',
    wiringKey: 'ac360.school_documents.report_job.queue',
    targetEndpoint: '/api/ac360/school-documents/reports/queue',
    method: 'POST',
    quantity: 1,
    creditSignal: 'Peut consommer crédits rapport selon plan et volume.',
    entitlementSignal: 'Nécessite Documents/Rapports et capacité stockage disponible.',
    riskSignal: 'Blocage si stockage plein ou rapports premium non inclus.',
    successMessage: 'Rapport mis en file de génération.',
    fields: [
      { key: 'reportType', label: 'Type rapport', type: 'select', options: ['direction_monthly', 'attendance_monthly', 'finance_summary', 'parenttrust'], defaultValue: 'direction_monthly' },
      { key: 'label', label: 'Libellé', type: 'text', defaultValue: 'Rapport Direction mensuel' },
    ],
    payloadTemplate: { metadata: baseMeta('documents', 'documents.report.queue') },
    recommendedNext: ['Vérifier artefact', 'Exporter PDF', 'Journaliser accès'],
  },
  {
    key: 'workflows.task.create',
    moduleKey: 'workflows',
    label: 'Créer une tâche opérationnelle',
    shortLabel: 'Créer tâche',
    description: 'Créer une tâche assignable avec gouvernance, priorité, deadline et preuve.',
    businessImpact: 'Transforme les risques et demandes en exécution suivie par responsable.',
    wiringKey: 'ac360.school_ops.task.create',
    targetEndpoint: '/api/ac360/school-ops/tasks',
    method: 'POST',
    quantity: 1,
    creditSignal: 'Action incluse · automatisations associées peuvent consommer crédits.',
    entitlementSignal: 'Tâches incluses selon plan, workflows avancés en add-on ou Command.',
    riskSignal: 'Blocage si module operations restreint.',
    successMessage: 'Tâche opérationnelle créée.',
    fields: [
      { key: 'title', label: 'Titre tâche', type: 'text', required: true, defaultValue: 'Action opérationnelle AC360' },
      { key: 'priority', label: 'Priorité', type: 'select', options: ['low', 'medium', 'high', 'critical'], defaultValue: 'high' },
      { key: 'due_date', label: 'Échéance', type: 'date', defaultValue: new Date().toISOString().slice(0, 10) },
    ],
    payloadTemplate: { status: 'open', metadata_json: baseMeta('workflows', 'workflows.task.create') },
    recommendedNext: ['Assigner responsable', 'Ajouter checklist', 'Lier à un workflow'],
  },
  {
    key: 'parenttrust.complaint.open',
    moduleKey: 'parenttrust',
    label: 'Ouvrir une réclamation ParentTrust',
    shortLabel: 'Ouvrir réclamation',
    description: 'Ouvrir un cas parent avec priorité, canal, responsable, délai et escalade.',
    businessImpact: 'Protège la confiance parent, la rétention et la réputation de l’établissement.',
    wiringKey: 'ac360.school_parenttrust.complaint.open' as any,
    targetEndpoint: '/api/ac360/school-parenttrust/complaints/open',
    method: 'POST',
    quantity: 1,
    creditSignal: 'Création incluse · réponses automatiques peuvent consommer crédits.',
    entitlementSignal: 'ParentTrust doit être actif ou accessible selon plan/add-on.',
    riskSignal: 'Réclamation critique crée alerte direction.',
    successMessage: 'Réclamation ParentTrust ouverte.',
    fields: [
      { key: 'subject', label: 'Sujet', type: 'text', required: true, defaultValue: 'Demande parent à traiter' },
      { key: 'severity', label: 'Sévérité', type: 'select', options: ['low', 'medium', 'high', 'critical'], defaultValue: 'high' },
      { key: 'channel', label: 'Canal', type: 'select', options: ['phone', 'whatsapp', 'email', 'front_desk'], defaultValue: 'whatsapp' },
    ],
    payloadTemplate: { status: 'open', metadata: baseMeta('parenttrust', 'parenttrust.complaint.open') },
    recommendedNext: ['Assigner responsable', 'Planifier rendez-vous', 'Mesurer satisfaction après résolution'],
  },
  {
    key: 'billing.addon.activate',
    moduleKey: 'billing-growth',
    label: 'Préparer activation add-on Growth Menu',
    shortLabel: 'Activer add-on',
    description: 'Pré-vol d’activation module avec lecture prix, annulation, conservation données et impact facture.',
    businessImpact: 'Transforme le besoin opérationnel en revenu récurrent ou usage contrôlé.',
    wiringKey: 'ac360.addon.activate' as any,
    targetEndpoint: '/api/ac360/addons',
    method: 'POST',
    quantity: 1,
    creditSignal: 'Ajout facturable mensuel ou usage selon module.',
    entitlementSignal: 'Nécessite droit propriétaire / direction.',
    riskSignal: 'Blocage si compte impayé ou restriction abonnement.',
    successMessage: 'Activation add-on soumise au runtime facturation.',
    fields: [
      { key: 'addonKey', label: 'Add-on', type: 'select', options: ['parenttrust_advanced', 'finance_power', 'admissions_growth', 'public_forms_lead_capture', 'transport_routes'], defaultValue: 'parenttrust_advanced' },
      { key: 'activationMode', label: 'Mode activation', type: 'select', options: ['monthly', 'trial', 'quote'], defaultValue: 'monthly' },
    ],
    payloadTemplate: { metadata: baseMeta('billing-growth', 'billing.addon.activate') },
    recommendedNext: ['Confirmer facturation', 'Afficher données conservées', 'Ajouter au Growth Menu actif'],
  },
]

export function getAc360CustomerCommandsForModule(moduleKey: string) {
  const direct = ac360CustomerCommands.filter((command) => command.moduleKey === moduleKey)
  if (direct.length > 0) return direct
  return [
    {
      ...ac360CustomerCommands.find((command) => command.key === 'workflows.task.create')!,
      moduleKey,
      key: `${moduleKey}.generic.task`,
      label: 'Créer une action opérationnelle gouvernée',
      shortLabel: 'Créer action',
      payloadTemplate: { status: 'open', metadata_json: baseMeta(moduleKey, `${moduleKey}.generic.task`) },
    },
  ]
}

export function getAc360PrimaryCustomerCommand(moduleKey: string) {
  return getAc360CustomerCommandsForModule(moduleKey)[0]
}

export function buildAc360CommandPayload(command: Ac360CustomerCommand, formValues: Record<string, string | number>) {
  return {
    ...command.payloadTemplate,
    ...formValues,
    metadata: {
      ...(typeof command.payloadTemplate.metadata === 'object' && command.payloadTemplate.metadata !== null ? command.payloadTemplate.metadata as Record<string, unknown> : {}),
      source: 'ac360_customer_command_modal',
      commandKey: command.key,
      moduleKey: command.moduleKey,
      executedFrom: 'customer_end_ui',
    },
    metadata_json: {
      ...(typeof command.payloadTemplate.metadata_json === 'object' && command.payloadTemplate.metadata_json !== null ? command.payloadTemplate.metadata_json as Record<string, unknown> : {}),
      source: 'ac360_customer_command_modal',
      commandKey: command.key,
      moduleKey: command.moduleKey,
      executedFrom: 'customer_end_ui',
    },
  }
}
