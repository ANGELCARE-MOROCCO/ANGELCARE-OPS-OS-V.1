import { getAc360CustomerWorkspace, type Ac360WorkspaceRecord } from './customer-workspace-model'

export type Ac360CustomerLiveRecordTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate'

export type Ac360CustomerLiveRecordColumn = {
  key: string
  label: string
  role: 'reference' | 'primary' | 'secondary' | 'status' | 'owner' | 'amount' | 'due' | 'risk' | 'proof'
  widthClass: string
}

export type Ac360CustomerLiveRecord = {
  id: string
  reference: string
  primary: string
  secondary: string
  owner: string
  status: string
  statusTone: Ac360CustomerLiveRecordTone
  amount: string
  due: string
  risk: string
  proof: string
  source: 'live' | 'fallback'
}

export type Ac360CustomerActionFormField = {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea'
  required?: boolean
  placeholder?: string
  defaultValue?: string | number
  options?: string[]
}

export type Ac360CustomerModuleActionForm = {
  key: string
  title: string
  description: string
  commandHint: string
  endpointHint: string
  guardSignal: string
  billingSignal: string
  fields: Ac360CustomerActionFormField[]
  payloadHints: string[]
  nextSteps: string[]
}

export type Ac360CustomerLiveRecordSpec = {
  moduleKey: string
  title: string
  subtitle: string
  sourceLabel: string
  expectedCollections: string[]
  columns: Ac360CustomerLiveRecordColumn[]
  actionForms: Ac360CustomerModuleActionForm[]
  fallbackRecords: Ac360CustomerLiveRecord[]
  liveSignals: string[]
  governanceSignals: string[]
}

export type Ac360CustomerLiveRecordsResult = {
  mode: 'live' | 'fallback' | 'empty' | 'error'
  title: string
  message: string
  discoveredCollections: string[]
  records: Ac360CustomerLiveRecord[]
  rawCount: number
}

type JsonObject = Record<string, unknown>

const baseColumns: Ac360CustomerLiveRecordColumn[] = [
  { key: 'reference', label: 'Réf.', role: 'reference', widthClass: 'min-w-[120px]' },
  { key: 'primary', label: 'Dossier live', role: 'primary', widthClass: 'min-w-[260px]' },
  { key: 'owner', label: 'Owner', role: 'owner', widthClass: 'min-w-[140px]' },
  { key: 'status', label: 'Statut', role: 'status', widthClass: 'min-w-[130px]' },
  { key: 'amount', label: 'Montant / volume', role: 'amount', widthClass: 'min-w-[150px]' },
  { key: 'due', label: 'Échéance', role: 'due', widthClass: 'min-w-[140px]' },
  { key: 'proof', label: 'Preuve', role: 'proof', widthClass: 'min-w-[170px]' },
]

function isObject(value: unknown): value is JsonObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function valueOf(obj: JsonObject, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    if (typeof value === 'boolean') return value ? 'oui' : 'non'
  }
  return fallback
}

function dateValue(obj: JsonObject, keys: string[], fallback = '—'): string {
  const raw = valueOf(obj, keys)
  if (!raw) return fallback
  try {
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return raw
    return new Intl.DateTimeFormat('fr-MA', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
  } catch {
    return raw
  }
}

function amountValue(obj: JsonObject, keys: string[], fallback = '—'): string {
  const raw = valueOf(obj, keys)
  if (!raw) return fallback
  const asNumber = Number(raw)
  if (Number.isFinite(asNumber)) return `${new Intl.NumberFormat('fr-MA').format(asNumber)} MAD`
  return raw
}

function toneForStatus(status: string): Ac360CustomerLiveRecordTone {
  const lower = status.toLowerCase()
  if (/(paid|payé|active|actif|completed|done|clôturé|resolved|connecté|validé|approved)/.test(lower)) return 'emerald'
  if (/(overdue|impayé|late|retard|critical|critique|blocked|bloqué|rejected|incident)/.test(lower)) return 'rose'
  if (/(pending|attente|draft|brouillon|planned|scheduled|ouvert|open|review)/.test(lower)) return 'amber'
  if (/(premium|command|addon|add-on|automation|ai)/.test(lower)) return 'violet'
  if (/(archived|archive|cancelled|annulé|disabled)/.test(lower)) return 'slate'
  return 'blue'
}

function fallbackFromWorkspace(moduleKey: string): Ac360CustomerLiveRecord[] {
  const workspace = getAc360CustomerWorkspace(moduleKey)
  return workspace.records.map((record) => ({
    id: record.id,
    reference: record.id,
    primary: record.title,
    secondary: record.signal,
    owner: record.owner,
    status: record.status,
    statusTone: toneForStatus(record.status),
    amount: record.amount || '—',
    due: record.due || '—',
    risk: record.priority,
    proof: 'fallback structuré',
    source: 'fallback',
  }))
}

const formLibrary: Record<string, Ac360CustomerModuleActionForm[]> = {
  finance: [
    {
      key: 'finance.invoice.issue.deep',
      title: 'Formulaire métier · facture gouvernée',
      description: 'Préparer une facture complète avec montant MAD, échéance, preuve, notification séparée et impact crédits.',
      commandHint: 'Émettre facture',
      endpointHint: '/api/ac360/school-finance/invoices/issue',
      guardSignal: 'Préflight Finance + droits facture + restriction compte',
      billingSignal: 'Notification WhatsApp/SMS séparée et créditée après confirmation',
      fields: [
        { key: 'student_reference', label: 'Référence élève / famille', type: 'text', required: true, defaultValue: 'ELV-001' },
        { key: 'invoiceTitle', label: 'Libellé facture', type: 'text', required: true, defaultValue: 'Frais mensuels' },
        { key: 'amountMad', label: 'Montant MAD', type: 'number', required: true, defaultValue: 1200 },
        { key: 'dueDate', label: 'Date échéance', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
        { key: 'collection_policy', label: 'Politique relance', type: 'select', options: ['standard', 'finance_power', 'serenite_plus'], defaultValue: 'standard' },
      ],
      payloadHints: ['currency=MAD', 'audit=invoice.issue', 'notification séparée', 'créance suivie'],
      nextSteps: ['Affecter paiement', 'Créer promesse', 'Relancer parent', 'Rapport créances'],
    },
  ],
  admissions: [
    {
      key: 'admissions.lead.create.deep',
      title: 'Formulaire métier · lead admissions',
      description: 'Créer un prospect complet avec source, niveau souhaité, urgence commerciale, prochaine action et valeur pipeline.',
      commandHint: 'Créer lead',
      endpointHint: '/api/ac360/school-admissions/leads/create',
      guardSignal: 'Préflight Admissions + pipeline + capacité commerciale',
      billingSignal: 'Campagnes de relance ultérieures à l’usage',
      fields: [
        { key: 'childFirstName', label: 'Prénom enfant', type: 'text', required: true, defaultValue: 'Yasmine' },
        { key: 'childLastName', label: 'Nom enfant', type: 'text', required: true, defaultValue: 'Alaoui' },
        { key: 'parentName', label: 'Nom parent', type: 'text', required: true, defaultValue: 'Mme Alaoui' },
        { key: 'parentPhone', label: 'Téléphone', type: 'text', defaultValue: '+212600000000' },
        { key: 'desiredLevel', label: 'Niveau demandé', type: 'select', options: ['Crèche', 'Petite Section', 'Moyenne Section', 'Grande Section', 'Primaire'], defaultValue: 'Petite Section' },
        { key: 'sourceKey', label: 'Source', type: 'select', options: ['manual', 'website', 'facebook', 'walk_in', 'whatsapp'], defaultValue: 'manual' },
      ],
      payloadHints: ['pipeline=default', 'followup=48h', 'duplicate_scan=recommandé'],
      nextSteps: ['Scanner doublons', 'Planifier visite', 'Créer suivi 48h', 'Générer offre'],
    },
  ],
  attendance: [
    {
      key: 'attendance.event.record.deep',
      title: 'Formulaire métier · événement présence',
      description: 'Préparer un événement de présence ou correction avec session, élève/staff, type, heure et preuve.',
      commandHint: 'Ouvrir session',
      endpointHint: '/api/ac360/school-attendance/events/record',
      guardSignal: 'Préflight Présence + session + correction policy',
      billingSignal: 'Alerte parent séparée si notification envoyée',
      fields: [
        { key: 'sessionKey', label: 'Session', type: 'select', options: ['daily', 'morning', 'afternoon'], defaultValue: 'daily' },
        { key: 'eventType', label: 'Type événement', type: 'select', options: ['check_in', 'check_out', 'absence', 'late', 'correction'], defaultValue: 'check_in' },
        { key: 'subjectReference', label: 'Référence élève / staff', type: 'text', required: true, defaultValue: 'ELV-001' },
        { key: 'eventDate', label: 'Date', type: 'date', defaultValue: new Date().toISOString().slice(0, 10) },
      ],
      payloadHints: ['daybook=actif', 'audit=attendance.event', 'correction si anomalie'],
      nextSteps: ['Notifier parent', 'Valider correction', 'Clôturer session', 'Rapport mensuel'],
    },
  ],
  'students-families': [
    {
      key: 'student.create.deep',
      title: 'Formulaire métier · dossier Élève 360',
      description: 'Créer un dossier élève prêt à lier famille, classe, documents, santé, facturation et pickup.',
      commandHint: 'Créer élève',
      endpointHint: '/api/ac360/school-ops/students',
      guardSignal: 'Préflight capacité élèves + droits administration',
      billingSignal: 'Blocage si capacité plan dépassée',
      fields: [
        { key: 'first_name', label: 'Prénom', type: 'text', required: true, defaultValue: 'Sara' },
        { key: 'last_name', label: 'Nom', type: 'text', required: true, defaultValue: 'Benali' },
        { key: 'level_label', label: 'Niveau', type: 'select', options: ['Crèche', 'Petite Section', 'Moyenne Section', 'Grande Section', 'Primaire'], defaultValue: 'Petite Section' },
        { key: 'family_reference', label: 'Référence famille', type: 'text', defaultValue: 'FAM-001' },
      ],
      payloadHints: ['status=active', 'archive-not-delete', 'family link recommandé'],
      nextSteps: ['Lier guardian', 'Affecter classe', 'Créer compte parent', 'Contrôler documents'],
    },
  ],
  parenttrust: [
    {
      key: 'parenttrust.complaint.open.deep',
      title: 'Formulaire métier · réclamation ParentTrust',
      description: 'Créer un cas relation parent avec sévérité, canal, owner, SLA, preuve et suite de rétention.',
      commandHint: 'Ouvrir réclamation',
      endpointHint: '/api/ac360/school-parenttrust/complaints/open',
      guardSignal: 'Préflight ParentTrust + droits relation parent',
      billingSignal: 'Surveys et messages peuvent consommer crédits',
      fields: [
        { key: 'parentReference', label: 'Référence parent', type: 'text', required: true, defaultValue: 'PAR-001' },
        { key: 'complaintTitle', label: 'Objet réclamation', type: 'text', required: true, defaultValue: 'Demande suivi parent' },
        { key: 'severity', label: 'Sévérité', type: 'select', options: ['low', 'medium', 'high', 'critical'], defaultValue: 'high' },
        { key: 'channel', label: 'Canal', type: 'select', options: ['phone', 'whatsapp', 'email', 'appointment', 'in_person'], defaultValue: 'whatsapp' },
        { key: 'summary', label: 'Résumé', type: 'textarea', placeholder: 'Résumé de la demande parent...' },
      ],
      payloadHints: ['sla=24h si high/critical', 'timeline relation', 'owner requis'],
      nextSteps: ['Assigner owner', 'Planifier RDV', 'Notifier direction', 'Mesurer satisfaction'],
    },
  ],
  'billing-growth': [
    {
      key: 'growth.addon.activate.deep',
      title: 'Formulaire métier · activation add-on',
      description: 'Préparer une activation Growth Menu avec prix MAD, préservation données, usage et impact abonnement.',
      commandHint: 'Activer add-on',
      endpointHint: '/api/ac360/addons',
      guardSignal: 'Préflight billing + droits owner + restrictions paiement',
      billingSignal: 'Mensuel / usage / Sérénité selon add-on',
      fields: [
        { key: 'addonKey', label: 'Add-on', type: 'select', options: ['finance_power', 'parenttrust_advanced', 'admissions_crm', 'transport', 'academy_training', 'public_forms_lead_capture'], defaultValue: 'finance_power' },
        { key: 'billingMode', label: 'Mode', type: 'select', options: ['monthly', 'usage', 'serenite'], defaultValue: 'monthly' },
        { key: 'confirmation', label: 'Confirmation direction', type: 'text', required: true, defaultValue: 'confirmé' },
      ],
      payloadHints: ['data_preservation=read_only_after_cancel', 'invoice_line=add_on', 'audit=billing'],
      nextSteps: ['Activer module', 'Mettre à jour droits', 'Afficher usage', 'Créer ligne facture'],
    },
  ],
}

function specTitle(moduleKey: string): { title: string; subtitle: string; sourceLabel: string } {
  const titles: Record<string, { title: string; subtitle: string; sourceLabel: string }> = {
    finance: {
      title: 'Données live finance',
      subtitle: 'Factures, paiements, créances, promesses et alertes lues depuis le runtime Finance quand disponible.',
      sourceLabel: 'Finance runtime',
    },
    admissions: {
      title: 'Données live admissions',
      subtitle: 'Leads, visites, offres, applications et doublons issus du CRM Admissions.',
      sourceLabel: 'Admissions runtime',
    },
    attendance: {
      title: 'Données live présence',
      subtitle: 'Daybook, sessions, événements, corrections et alertes du jour.',
      sourceLabel: 'Présence runtime',
    },
    'students-families': {
      title: 'Dossiers live élèves & familles',
      subtitle: 'Étudiants, guardians, classes, documents et signaux de capacité depuis School Ops.',
      sourceLabel: 'School Ops runtime',
    },
    parenttrust: {
      title: 'Données live ParentTrust',
      subtitle: 'Surveys, réclamations, rendez-vous, témoignages et alertes relation parent.',
      sourceLabel: 'ParentTrust runtime',
    },
    'billing-growth': {
      title: 'Données live facturation & Growth Menu',
      subtitle: 'Plan, add-ons, crédits, restrictions, factures et recommandations commerciales.',
      sourceLabel: 'Billing runtime',
    },
  }
  return titles[moduleKey] || {
    title: 'Données live du module',
    subtitle: 'Lecture des objets runtime disponibles, avec fallback sécurisé et structure opérationnelle.',
    sourceLabel: 'Runtime AC360',
  }
}

function expectedCollections(moduleKey: string): string[] {
  const map: Record<string, string[]> = {
    finance: ['invoices', 'payments', 'receivables', 'alerts', 'payment_promises'],
    admissions: ['leads', 'visits', 'offers', 'applications', 'alerts'],
    attendance: ['sessions', 'events', 'corrections', 'alerts', 'daybooks'],
    'students-families': ['students', 'guardians', 'classes', 'documents', 'alerts'],
    parenttrust: ['complaints', 'surveys', 'appointments', 'testimonials', 'alerts'],
    'billing-growth': ['subscription', 'addons', 'credits', 'invoices', 'restrictions'],
    communication: ['campaigns', 'templates', 'notifications', 'delivery_jobs'],
    documents: ['documents', 'reports', 'exports', 'storage_snapshots'],
    workflows: ['tasks', 'approvals', 'workflow_instances', 'tickets'],
    hr: ['staff', 'shifts', 'leave_requests', 'contracts'],
    safety: ['incidents', 'health_profiles', 'pickup_events', 'alerts'],
    transport: ['routes', 'vehicles', 'drivers', 'route_runs'],
  }
  return map[moduleKey] || ['records', 'items', 'alerts', 'snapshots']
}

export function getAc360CustomerLiveRecordSpec(moduleKey: string): Ac360CustomerLiveRecordSpec {
  const titles = specTitle(moduleKey)
  return {
    moduleKey,
    title: titles.title,
    subtitle: titles.subtitle,
    sourceLabel: titles.sourceLabel,
    expectedCollections: expectedCollections(moduleKey),
    columns: baseColumns,
    actionForms: formLibrary[moduleKey] || [
      {
        key: `${moduleKey}.generic.deep`,
        title: 'Formulaire métier spécialisé',
        description: 'Préparer une action contextualisée avec droits, payload, usage, preuve et audit.',
        commandHint: 'Créer action gouvernée',
        endpointHint: 'Endpoint module dédié',
        guardSignal: 'Préflight AC360 obligatoire',
        billingSignal: 'Usage mesuré selon action exécutée',
        fields: [
          { key: 'title', label: 'Titre action', type: 'text', required: true, defaultValue: 'Action AC360' },
          { key: 'priority', label: 'Priorité', type: 'select', options: ['low', 'medium', 'high', 'critical'], defaultValue: 'high' },
          { key: 'dueDate', label: 'Échéance', type: 'date', defaultValue: new Date().toISOString().slice(0, 10) },
        ],
        payloadHints: ['metadata=phase_3g', 'guard=required', 'audit=enabled'],
        nextSteps: ['Préflight', 'Exécution gardée', 'Preuve', 'Suivi'],
      },
    ],
    fallbackRecords: fallbackFromWorkspace(moduleKey),
    liveSignals: ['endpoint interrogé', 'collections détectées', 'fallback sécurisé si vide', 'records normalisés'],
    governanceSignals: ['aucune action sans pré-vol', 'données live non destructives', 'preuve et usage visibles', 'FR Maroc natif'],
  }
}

function collectObjectArrays(input: unknown, prefix = 'root', depth = 0, output: Array<{ path: string; rows: JsonObject[] }> = []): Array<{ path: string; rows: JsonObject[] }> {
  if (depth > 4) return output
  if (Array.isArray(input)) {
    const rows = input.filter(isObject)
    if (rows.length) output.push({ path: prefix, rows })
    return output
  }
  if (!isObject(input)) return output
  for (const [key, value] of Object.entries(input)) {
    const nextPath = prefix === 'root' ? key : `${prefix}.${key}`
    if (Array.isArray(value)) {
      const rows = value.filter(isObject)
      if (rows.length) output.push({ path: nextPath, rows })
    } else if (isObject(value)) {
      collectObjectArrays(value, nextPath, depth + 1, output)
    }
  }
  return output
}

function statusFromObject(row: JsonObject): string {
  return valueOf(row, ['status', 'state', 'stage', 'stage_key', 'payment_status', 'lifecycle_status', 'risk_status', 'runtime_status'], 'live')
}

function primaryFromObject(row: JsonObject, moduleKey: string): string {
  const explicit = valueOf(row, ['title', 'label', 'name', 'display_name', 'student_name', 'child_name', 'parent_name', 'campaign_name', 'invoice_title', 'route_name', 'complaint_title'])
  if (explicit) return explicit
  if (moduleKey === 'finance') return `Facture / créance ${valueOf(row, ['invoice_number', 'id', 'code'], 'live')}`
  if (moduleKey === 'admissions') return `Lead ${valueOf(row, ['lead_code', 'id', 'code'], 'admissions')}`
  if (moduleKey === 'attendance') return `Événement présence ${valueOf(row, ['event_type', 'session_key', 'id'], 'live')}`
  return `Dossier ${valueOf(row, ['id', 'code', 'reference'], 'runtime')}`
}

function normalizeObjectRecord(row: JsonObject, moduleKey: string, index: number, collectionPath: string): Ac360CustomerLiveRecord {
  const status = statusFromObject(row)
  const id = valueOf(row, ['reference', 'code', 'invoice_number', 'student_code', 'lead_code', 'task_code', 'id'], `${moduleKey.toUpperCase()}-${String(index + 1).padStart(3, '0')}`)
  const owner = valueOf(row, ['owner', 'owner_name', 'assignee_name', 'responsible_name', 'staff_name', 'created_by_name'], 'Owner non assigné')
  return {
    id,
    reference: id.length > 22 ? `${id.slice(0, 19)}…` : id,
    primary: primaryFromObject(row, moduleKey),
    secondary: valueOf(row, ['description', 'summary', 'notes', 'detail', 'message', 'source_key', 'channel'], collectionPath),
    owner,
    status,
    statusTone: toneForStatus(status),
    amount: amountValue(row, ['amount_mad', 'amountMad', 'total_mad', 'total_amount_mad', 'balance_mad', 'monthly_value_mad', 'price_mad', 'monthly_price_mad'], '—'),
    due: dateValue(row, ['due_date', 'dueDate', 'scheduled_at', 'start_at', 'created_at', 'updated_at'], '—'),
    risk: valueOf(row, ['priority', 'risk_level', 'severity', 'tone'], 'normal'),
    proof: dateValue(row, ['updated_at', 'created_at', 'recorded_at', 'decided_at'], 'preuve runtime'),
    source: 'live',
  }
}

export function normalizeAc360CustomerLiveRecords(moduleKey: string, payload: unknown): Ac360CustomerLiveRecordsResult {
  if (!payload) {
    return {
      mode: 'empty',
      title: 'Endpoint vide',
      message: 'Le runtime a répondu sans données exploitables. Le fallback structuré reste affiché.',
      discoveredCollections: [],
      records: fallbackFromWorkspace(moduleKey),
      rawCount: 0,
    }
  }

  if (isObject(payload) && payload.ok === false) {
    return {
      mode: 'error',
      title: 'Endpoint en erreur contrôlée',
      message: valueOf(payload, ['error', 'message'], 'Erreur runtime AC360 contrôlée.'),
      discoveredCollections: [],
      records: fallbackFromWorkspace(moduleKey),
      rawCount: 0,
    }
  }

  const collections = collectObjectArrays(payload)
  const best = collections.sort((a, b) => b.rows.length - a.rows.length)[0]
  if (!best) {
    return {
      mode: 'fallback',
      title: 'Aucune collection ligne détectée',
      message: 'Le dashboard live expose plutôt des agrégats. Les dossiers fallback restent disponibles pour exécution UI.',
      discoveredCollections: collections.map((collection) => collection.path),
      records: fallbackFromWorkspace(moduleKey),
      rawCount: 0,
    }
  }

  return {
    mode: 'live',
    title: 'Records live normalisés',
    message: `${best.rows.length} objet(s) détecté(s) dans ${best.path}.`,
    discoveredCollections: collections.map((collection) => `${collection.path} (${collection.rows.length})`).slice(0, 8),
    records: best.rows.slice(0, 18).map((row, index) => normalizeObjectRecord(row, moduleKey, index, best.path)),
    rawCount: best.rows.length,
  }
}

export function buildAc360CustomerFormPreview(form: Ac360CustomerModuleActionForm, values: Record<string, string | number>) {
  return {
    command: form.commandHint,
    endpoint: form.endpointHint,
    payload: values,
    metadata: {
      phase: 'phase_3g_live_records_forms',
      guard: 'preflight_required',
      locale: 'fr-MA',
    },
  }
}
