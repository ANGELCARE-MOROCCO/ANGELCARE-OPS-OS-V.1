'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileBadge2,
  FileText,
  Fingerprint,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Printer,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react'

type EmployeeRecord = Record<string, any>

function value(row: EmployeeRecord | null | undefined, fields: string[], fallback = '') {
  if (!row) return fallback
  for (const field of fields) {
    const found = row?.[field]
    if (found !== undefined && found !== null && String(found).trim() !== '') return String(found).trim()
  }
  return fallback
}

function pct(input: unknown) {
  const n = Number(input || 0)
  return `${Math.max(0, Math.min(100, Math.round(n)))}%`
}

function percentNumber(input: unknown) {
  const n = Number(input || 0)
  return Math.max(0, Math.min(100, Math.round(n)))
}

function dossierRef(employee: EmployeeRecord | null | undefined) {
  const rawId = value(employee, ['id', 'employee_id', 'email'], 'NOREF')
  const clean = rawId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()
  const year = new Date().getFullYear()
  return `AC-HR-360-${year}-${clean || 'NOREF'}`
}

function today() {
  return new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: '2-digit' })
}

function statusTone(status: string) {
  const s = status.toLowerCase()
  if (s.includes('active')) return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (s.includes('pending')) return 'bg-amber-50 text-amber-700 ring-amber-100'
  if (s.includes('archiv')) return 'bg-slate-100 text-slate-600 ring-slate-200'
  return 'bg-violet-50 text-violet-700 ring-violet-100'
}

function syncItemsFor(employee: EmployeeRecord | null | undefined) {
  return [
    ['Présence', 'attendance', employee?.__sync?.attendance],
    ['Congés', 'leave', employee?.__sync?.leave],
    ['Paie', 'payroll', employee?.__sync?.payroll],
    ['Documents', 'documents', employee?.__sync?.documents],
    ['Contrats', 'contracts', employee?.__sync?.contracts],
    ['Roster', 'roster', employee?.__sync?.roster],
    ['Formation', 'training', employee?.__sync?.training],
    ['Performance', 'performance', employee?.__sync?.performance],
  ] as const
}

function syncCount(employee: EmployeeRecord | null | undefined) {
  return syncItemsFor(employee).filter(([, , count]) => Number(count || 0) > 0).length
}

function normalizePatch(form: EmployeeRecord) {
  return {
    full_name: value(form, ['full_name', 'name']),
    first_name: value(form, ['first_name']),
    last_name: value(form, ['last_name']),
    email: value(form, ['email']),
    phone: value(form, ['phone', 'mobile']),
    department: value(form, ['department']),
    position: value(form, ['position', 'job_title', 'role']),
    job_title: value(form, ['job_title', 'position', 'role']),
    city: value(form, ['city', 'location']),
    location: value(form, ['location', 'city']),
    employment_status: value(form, ['employment_status', 'status'], 'active'),
    status: value(form, ['status', 'employment_status'], 'active'),
    nationality: value(form, ['nationality']),
    date_of_birth: value(form, ['date_of_birth', 'birth_date']),
    address: value(form, ['address']),
    emergency_contact_name: value(form, ['emergency_contact_name']),
    emergency_contact_phone: value(form, ['emergency_contact_phone']),
  }
}

function dataRows(employee: EmployeeRecord | null | undefined) {
  if (!employee) return []
  const blocked = new Set(['__sync', 'metadata', 'data'])
  return Object.entries(employee)
    .filter(([key, val]) => !blocked.has(key) && val !== null && val !== undefined && String(val).trim() !== '')
    .slice(0, 36)
}

function Field({
  label,
  value,
  onChange,
  editing,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  editing: boolean
  type?: string
}) {
  return (
    <label className="block rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-100 hover:shadow-md">
      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
      {editing ? (
        <input
          value={value}
          type={type}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none ring-violet-200 focus:ring-4"
        />
      ) : (
        <span className="mt-2 block min-h-11 text-sm font-black text-slate-900">{value || 'Non renseigné'}</span>
      )}
    </label>
  )
}

function MetricCard({
  label,
  value,
  subtitle,
  tone,
  icon: Icon,
}: {
  label: string
  value: string
  subtitle: string
  tone: string
  icon: any
}) {
  return (
    <div className={`rounded-[26px] border p-4 shadow-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-2 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string
  subtitle: string
  icon: any
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl bg-violet-50 p-2 text-violet-700 ring-1 ring-violet-100">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-black tracking-tight text-slate-950">{title}</h3>
          <p className="mt-1 text-sm font-bold text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}


type EmployeeHRAction = {
  id: string
  category: string
  title: string
  owner: string
  status: string
  priority: string
  due_date: string
  amount: string
  notes: string
  case_type?: string
  workflow_status?: string
  validation_status?: string
  payment_method?: string
  period?: string
  reference?: string
  evidence?: string
  start_date?: string
  end_date?: string
  duration?: string
  impact?: string
  validator?: string
  printed_at?: string
  contract_kind?: string
  contract_city?: string
  contract_date?: string
  company_legal_name?: string
  company_address?: string
  company_rc?: string
  company_if?: string
  company_ice?: string
  company_tp?: string
  business_unit_name?: string
  business_unit_address?: string
  employee_civility?: string
  employee_birth_date?: string
  employee_birth_place?: string
  employee_cin?: string
  employee_address?: string
  contract_role?: string
  contract_pole?: string
  contract_start_date?: string
  contract_end_date?: string
  trial_start_date?: string
  trial_end_date?: string
  trial_days?: string
  remuneration_text?: string
  displacement_text?: string
  leave_text?: string
  schedule_text?: string
  termination_text?: string
  confidentiality_text?: string
  disputes_text?: string
  footer_reference?: string
  attestation_kind?: string
  attestation_city?: string
  attestation_date?: string
  attestation_company_name?: string
  attestation_company_address?: string
  attestation_employee_civility?: string
  attestation_employee_cin?: string
  attestation_employee_address?: string
  attestation_role?: string
  attestation_start_date?: string
  attestation_end_date?: string
  attestation_intro_text?: string
  attestation_quality_text?: string
  attestation_result_text?: string
  attestation_purpose_text?: string
  attestation_footer_legal?: string
}

function makeActionId() {
  return `hr-action-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function EmployeeMegaHRWorkspace({
  employee,
  employeeId,
  employeeName,
  onSaved,
}: {
  employee: EmployeeRecord
  employeeId: string
  employeeName: string
  onSaved?: () => void
}) {
  const [active, setActive] = useState('payments')
  const [actions, setActions] = useState<EmployeeHRAction[]>([])
  const [selectedActionId, setSelectedActionId] = useState('')
  const [savingWorkspace, setSavingWorkspace] = useState(false)
  const [workspaceMessage, setWorkspaceMessage] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [contractModalOpen, setContractModalOpen] = useState(false)
  const [attestationModalOpen, setAttestationModalOpen] = useState(false)

  const categories = [
    {
      key: 'payments',
      label: 'Paie & paiements',
      subtitle: 'Honoraires, avances, primes, compensations et régularisations.',
      color: 'violet',
      synced: Number(employee?.__sync?.payroll || 0),
      printTitle: 'NOTE DE PAIEMENT',
      documentRef: 'PAY',
      caseTypes: ['Salaire / paie mensuelle', 'Honoraires', 'Prime', 'Avance', 'Indemnité', 'Compensation exceptionnelle', 'Remboursement frais', 'Régularisation'],
      methods: ['Virement bancaire', 'Espèces', 'Chèque', 'Mobile money', 'À définir'],
      templates: [
        'Préparer la validation de paie mensuelle',
        'Ajouter une avance exceptionnelle',
        'Contrôler les éléments variables',
        'Créer une régularisation de paiement',
        'Valider honoraires / compensation',
      ],
      workflow: ['Brouillon', 'À vérifier', 'Validation manager', 'Validation finance', 'Validé', 'Payé', 'Clôturé'],
      fields: ['amount', 'period', 'payment_method', 'reference', 'validator'],
    },
    {
      key: 'leave',
      label: 'Congés & absences',
      subtitle: 'Demandes, justificatifs, soldes et impact planning.',
      color: 'amber',
      synced: Number(employee?.__sync?.leave || 0),
      printTitle: 'NOTE DE CONGÉ / ABSENCE',
      documentRef: 'LEA',
      caseTypes: ['Congé payé', 'Congé maladie', 'Absence justifiée', 'Absence non justifiée', 'Autorisation', 'Urgence familiale', 'Maternité / parental'],
      methods: [],
      templates: [
        'Créer une demande de congé',
        'Demander un justificatif d’absence',
        'Valider une absence exceptionnelle',
        'Planifier un retour de congé',
        'Contrôler solde et calendrier',
      ],
      workflow: ['Brouillon', 'Justificatif requis', 'En validation', 'Approuvé', 'Refusé', 'Clôturé'],
      fields: ['start_date', 'end_date', 'duration', 'evidence', 'impact', 'validator'],
    },
    {
      key: 'attendance',
      label: 'Présence',
      subtitle: 'Pointage, retards, anomalies et corrections validées.',
      color: 'emerald',
      synced: Number(employee?.__sync?.attendance || 0),
      printTitle: 'NOTE DE PRÉSENCE',
      documentRef: 'ATT',
      caseTypes: ['Retard', 'Départ anticipé', 'Pointage manquant', 'Correction manuelle', 'Absence anomalie', 'Validation présence exceptionnelle'],
      methods: [],
      templates: [
        'Régulariser une anomalie de pointage',
        'Contrôler les retards récurrents',
        'Valider présence exceptionnelle',
        'Analyser l’assiduité hebdomadaire',
        'Créer un suivi disciplinaire présence',
      ],
      workflow: ['Brouillon', 'À vérifier', 'Manager review', 'Correction validée', 'Rejeté', 'Clôturé'],
      fields: ['start_date', 'end_date', 'duration', 'evidence', 'impact', 'validator'],
    },
    {
      key: 'schedule',
      label: 'Planning',
      subtitle: 'Horaires, shifts, roster, remplacements et rotations.',
      color: 'cyan',
      synced: Number(employee?.__sync?.roster || 0),
      printTitle: 'NOTE DE PLANNING',
      documentRef: 'SCH',
      caseTypes: ['Shift exceptionnel', 'Modification horaire', 'Remplacement', 'Rotation équipe', 'Affectation site', 'Planning hebdomadaire'],
      methods: [],
      templates: [
        'Ajouter un shift exceptionnel',
        'Modifier planning hebdomadaire',
        'Dupliquer planning existant',
        'Préparer remplacement opérationnel',
        'Valider rotation équipe',
      ],
      workflow: ['Brouillon', 'Planifié', 'Confirmé', 'En exécution', 'Modifié', 'Clôturé'],
      fields: ['start_date', 'end_date', 'duration', 'reference', 'impact', 'validator'],
    },
    {
      key: 'documents',
      label: 'Documents',
      subtitle: 'Pièces RH, justificatifs, fichiers obligatoires et conformité.',
      color: 'blue',
      synced: Number(employee?.__sync?.documents || 0),
      printTitle: 'BORDEREAU DOCUMENT RH',
      documentRef: 'DOC',
      caseTypes: ['Attestation de stage', 'Document manquant', 'Document reçu', 'Document expiré', 'Signature requise', 'Justificatif obligatoire', 'Classement dossier'],
      methods: [],
      templates: [
        'Créer attestation de stage',
        'Demander document manquant',
        'Ajouter pièce au dossier RH',
        'Contrôler validité document',
        'Relancer signature ou justificatif',
        'Classer document validé',
      ],
      workflow: ['Brouillon', 'Demandé', 'Reçu', 'En contrôle', 'Validé', 'Expiré', 'Clôturé'],
      fields: ['reference', 'evidence', 'start_date', 'end_date', 'validator'],
    },
    {
      key: 'contracts',
      label: 'Contrats',
      subtitle: 'Contrat, avenant, renouvellement, période et statut contractuel.',
      color: 'rose',
      synced: Number(employee?.__sync?.contracts || 0),
      printTitle: 'NOTE CONTRACTUELLE',
      documentRef: 'CTR',
      caseTypes: ['Nouveau contrat', 'Avenant', 'Renouvellement', 'Fin de contrat', 'Période d’essai', 'Changement statut'],
      methods: [],
      templates: [
        'Créer suivi de contrat',
        'Préparer avenant',
        'Contrôler date de fin',
        'Valider statut contractuel',
        'Planifier renouvellement',
      ],
      workflow: ['Brouillon', 'Préparation', 'Signature requise', 'Validé RH', 'Actif', 'Archivé'],
      fields: ['start_date', 'end_date', 'reference', 'evidence', 'impact', 'validator'],
    },
    {
      key: 'performance',
      label: 'Performance',
      subtitle: 'Évaluation, objectifs, feedback, coaching et amélioration.',
      color: 'fuchsia',
      synced: Number(employee?.__sync?.performance || 0),
      printTitle: 'NOTE PERFORMANCE',
      documentRef: 'PER',
      caseTypes: ['Revue performance', 'Objectif individuel', 'Feedback manager', 'Coaching', 'Plan d’amélioration', 'Promotion recommandée'],
      methods: [],
      templates: [
        'Créer revue de performance',
        'Ajouter objectif individuel',
        'Planifier point manager',
        'Créer plan d’amélioration',
        'Valider feedback trimestriel',
      ],
      workflow: ['Brouillon', 'En évaluation', 'Manager review', 'Calibration RH', 'Validé', 'Plan suivi', 'Clôturé'],
      fields: ['period', 'reference', 'impact', 'evidence', 'validator'],
    },
    {
      key: 'training',
      label: 'Formation',
      subtitle: 'Parcours, compétences, onboarding, certification et validation.',
      color: 'teal',
      synced: Number(employee?.__sync?.training || 0),
      printTitle: 'NOTE FORMATION',
      documentRef: 'TRN',
      caseTypes: ['Formation obligatoire', 'Montée en compétence', 'Certification', 'Coaching ciblé', 'Onboarding', 'Évaluation formation'],
      methods: [],
      templates: [
        'Assigner formation obligatoire',
        'Créer parcours de montée en compétence',
        'Valider complétion de module',
        'Planifier coaching ciblé',
        'Préparer certification interne',
      ],
      workflow: ['Brouillon', 'Assigné', 'En cours', 'Complété', 'Validé formateur', 'Certifié', 'Clôturé'],
      fields: ['start_date', 'end_date', 'duration', 'reference', 'evidence', 'validator'],
    },
  ]

  const activeCategory = categories.find((category) => category.key === active) || categories[0]

  function buildContractDefaults(seed?: Partial<EmployeeHRAction>) {
    const fullName = employeeName || value(employee, ['full_name', 'name'], 'Collaborateur')
    const cleanName = fullName.toUpperCase()
    const todayIso = new Date().toISOString().slice(0, 10)

    return {
      contract_kind: 'Contrat de stage opérationnel',
      contract_city: 'TEMARA',
      contract_date: todayIso,
      company_legal_name: 'ARTAB S.A.R.L a.u',
      company_address: 'N° 44 RUE AGUELMANE SIDI ALI N° 7 1ER ÉTAGE BAS AGDAL, Rabat',
      company_rc: '137987',
      company_if: '37514792',
      company_ice: '002176718000041',
      company_tp: '25702977',
      business_unit_name: 'UNITÉ D’AFFAIRE ANGELCARE - Centre d’opérations et traitement de service',
      business_unit_address: 'Av. Hassan 2 Quartier Alawyn Imm N°13 Rue Kuwait 1er étage bureau n°3, centre ville Témara',
      employee_civility: 'Mlle',
      employee_birth_date: value(employee, ['date_of_birth', 'birth_date'], ''),
      employee_birth_place: value(employee, ['birth_place', 'place_of_birth'], ''),
      employee_cin: value(employee, ['cin', 'national_id', 'identity_number'], ''),
      employee_address: value(employee, ['address'], ''),
      contract_role: value(employee, ['position', 'job_title', 'role'], 'Stagiaire'),
      contract_pole: value(employee, ['department'], 'Pôle opérationnel'),
      contract_start_date: '',
      contract_end_date: '',
      trial_start_date: '',
      trial_end_date: '',
      trial_days: '05',
      remuneration_text: "Ce stage n'est pas rémunéré.",
      displacement_text: `${cleanName} devra effectuer les déplacements quotidiens du domicile aux locaux ARTAB / ANGELCARE à sa charge.`,
      leave_text: `${cleanName} n’est pas éligible pour bénéficier des congés durant cette période de stage, sauf validation expresse de l’administration.`,
      schedule_text: 'Horaire administrative standard:\nPlanning A: Du lundi au vendredi, de 09h00 à 17h00 avec 01 heure de pause déjeuner, et 30 minutes durant la journée.\nPlanning B: Du lundi au vendredi, de 11h00 à 19h00 avec 01 heure de pause déjeuner, et 30 minutes durant la journée.\nHoraires flexibles selon besoin opérationnel: À discuter avec l’administration.',
      termination_text: 'Le présent contrat pourra prendre fin dans les conditions suivantes :\n- Résiliation avec un préavis de 05 jours.\n- A l’arrivée à terme du contrat.\n- Résiliation par la société en cas d’insuffisance professionnelle, de fautes graves ou de conditions économiques extrêmes.\n- La résiliation sera notifiée conformément aux règles internes applicables.',
      confidentiality_text: `${cleanName} s’engage à ne communiquer aucune information dont il/elle aura eu connaissance dans le cadre des opérations effectuées pour la société ARTAB via son unité ANGELCARE, aussi bien pendant la durée du présent contrat que postérieurement à son expiration.`,
      disputes_text: 'Tous litiges ou contestations portant sur l’exécution du présent contrat sont portés, à défaut de solution amiable, devant le tribunal compétent de Rabat.',
      footer_reference: `ARTAB / OPC-TMR / R.H / CONTRAT / UNITÉ ANGELCARE / ${cleanName}`,
      ...seed,
    }
  }

  function buildAttestationDefaults(seed?: Partial<EmployeeHRAction>) {
    const fullName = employeeName || value(employee, ['full_name', 'name'], 'Collaborateur')
    const cleanName = fullName.toUpperCase()
    const todayIso = new Date().toISOString().slice(0, 10)

    return {
      attestation_kind: 'Attestation de stage',
      attestation_city: 'Témara',
      attestation_date: todayIso,
      attestation_company_name: 'ARTAB',
      attestation_company_address: '13 Secteur Hay Masrour 077 apt3',
      attestation_employee_civility: 'Mme.',
      attestation_employee_cin: value(employee, ['cin', 'national_id', 'identity_number'], ''),
      attestation_employee_address: value(employee, ['address'], ''),
      attestation_role: value(employee, ['position', 'job_title', 'role'], 'agent marketing stratégique et communication digitale'),
      attestation_start_date: '',
      attestation_end_date: '',
      attestation_intro_text: `Nous soussignés ARTAB, 13 Secteur Hay Masrour 077 apt3, certifie que ${cleanName} titulaire de CIN, demeurant à l’adresse indiquée, a effectué un stage dans notre entreprise.`,
      attestation_quality_text: `Par son enthousiasme, sa créativité, sa rigueur, ses qualités professionnelles et humaines, ${cleanName} a rempli tous les objectifs durant son stage.`,
      attestation_result_text: 'Sa présence et ses réalisations ont été satisfaisantes à tous points de vue.',
      attestation_purpose_text: 'Pour servir et valoir ce que de droit.',
      attestation_footer_legal: 'ARTAB S.A.R.L (A.U) CAPITAL 100.000.00Dhs SIEGE : N°44 RUE, AGULEMANE SIDI ALI N°7 1ER ETAGE BAS AGDAL RABAT, MAROC R.C : 137987 / IF : 37514792 / ICE : 002176718000041 / TAXE : 25702977 / CNSS : 1507193 / +212 695342566 E-MAIL : BACKOFFICE@ANGELCAREHUB.COM',
      ...seed,
    }
  }

  const categoryActions = actions.filter((action) => action.category === active)
  const filteredActions = categoryActions.filter((action) => {
    const q = query.trim().toLowerCase()
    const haystack = [action.title, action.owner, action.status, action.priority, action.case_type, action.notes, action.reference]
      .join(' ')
      .toLowerCase()
    const matchQuery = !q || haystack.includes(q)
    const matchStatus = statusFilter === 'all' || action.status === statusFilter || action.workflow_status === statusFilter || action.validation_status === statusFilter
    const matchPriority = priorityFilter === 'all' || action.priority === priorityFilter
    const matchType = typeFilter === 'all' || action.case_type === typeFilter
    return matchQuery && matchStatus && matchPriority && matchType
  })
  const selectedAction = useMemo(() => {
    if (!selectedActionId) return null
    return actions.find((action) => action.id === selectedActionId) || null
  }, [actions, selectedActionId])

  useEffect(() => {
    if (!selectedActionId) {
      const first = filteredActions[0] || categoryActions[0] || null
      if (first?.id) setSelectedActionId(first.id)
      return
    }

    const exists = actions.some((action) => action.id === selectedActionId)
    if (!exists) {
      const first = filteredActions[0] || categoryActions[0] || null
      setSelectedActionId(first?.id || '')
      setContractModalOpen(false)
      setAttestationModalOpen(false)
    }
  }, [selectedActionId, actions, filteredActions, categoryActions])

  function seedActions() {
    return categories.flatMap((category) =>
      category.templates.slice(0, 2).map((title, index) => ({
        id: makeActionId(),
        category: category.key,
        title,
        owner: 'HR AngelCare',
        status: index === 0 ? 'À traiter' : 'Planifié',
        priority: category.synced > 0 ? 'Normale' : 'Haute',
        due_date: new Date(Date.now() + (index + 1) * 86400000).toISOString().slice(0, 10),
        amount: '',
        notes: `Action préintégrée pour ${employeeName}. Synchronisation détectée : ${category.synced} objet(s).`,
        case_type: category.caseTypes[0],
        workflow_status: category.workflow[0],
        validation_status: 'En attente',
        payment_method: category.methods[0] || '',
        period: new Date().toISOString().slice(0, 7),
        reference: `${category.documentRef}-${Date.now().toString().slice(-6)}-${index + 1}`,
        evidence: '',
        start_date: '',
        end_date: '',
        duration: '',
        impact: '',
        validator: 'Manager RH',
      })),
    )
  }

  useEffect(() => {
    const stored =
      employee?.metadata?.hr_management_workspace ||
      employee?.data?.hr_management_workspace ||
      employee?.hr_management_workspace ||
      []

    if (Array.isArray(stored) && stored.length) {
      setActions(stored)
      setSelectedActionId(stored[0]?.id || '')
      setWorkspaceMessage('Workspace RH chargé depuis le dossier employé synchronisé.')
      return
    }

    const seed = seedActions()
    setActions(seed)
    setSelectedActionId(seed[0]?.id || '')
    setWorkspaceMessage('Workspace RH initialisé depuis les modèles opérationnels. Cliquez sur Sauvegarder tout pour synchroniser.')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId])

  function persist(next: EmployeeHRAction[], message = 'Action mise à jour. Sauvegarde production requise.') {
    setActions(next)
    setWorkspaceMessage(message)
  }

  async function saveToProduction(nextActions = actions) {
    if (!employeeId) {
      setWorkspaceMessage('Identifiant employé manquant. Impossible de synchroniser le workspace RH.')
      return
    }

    try {
      setSavingWorkspace(true)
      setWorkspaceMessage('Sauvegarde production du workspace RH en cours...')

      const response = await fetch(`/api/hr/employees?id=${encodeURIComponent(employeeId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          metadata: {
            ...(employee?.metadata || {}),
            hr_management_workspace: nextActions,
            hr_management_workspace_updated_at: new Date().toISOString(),
            hr_management_workspace_source: 'employee_360_dossier_modal',
          },
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        setWorkspaceMessage(payload?.error || 'Erreur API: le workspace RH n’a pas été sauvegardé en production.')
        return
      }

      setActions(nextActions)
      setWorkspaceMessage('Workspace RH sauvegardé en production dans le dossier employé.')
      onSaved?.()
    } catch {
      setWorkspaceMessage('Erreur réseau: sauvegarde production non confirmée.')
    } finally {
      setSavingWorkspace(false)
    }
  }

  function isAttestationAction(action?: Partial<EmployeeHRAction> | null) {
    return String(action?.case_type || action?.title || '').toLowerCase().includes('attestation')
  }

  function hydrateAttestationAction(actionId: string) {
    const action = actions.find((item) => item.id === actionId)
    if (!action) return

    const hydrated = {
      ...buildAttestationDefaults(action),
      ...action,
      category: 'documents',
      case_type: 'Attestation de stage',
      attestation_kind: action.attestation_kind || 'Attestation de stage',
      title: action.title || 'Créer attestation de stage',
    }

    const next = actions.map((item) => (item.id === actionId ? hydrated : item))
    setActions(next)
    setSelectedActionId(actionId)
    setWorkspaceMessage('Attestation de stage chargée avec le modèle A4 complet.')
  }

  function createAction(title?: string) {
    const next: EmployeeHRAction = {
      id: makeActionId(),
      category: active,
      title: title || `Nouvelle opération ${activeCategory.label}`,
      owner: 'HR AngelCare',
      status: 'À traiter',
      priority: activeCategory.synced > 0 ? 'Normale' : 'Haute',
      due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      amount: '',
      notes: `Nouvelle opération ${activeCategory.label} pour ${employeeName}.`,
      case_type: activeCategory.caseTypes[0],
      workflow_status: activeCategory.workflow[0],
      validation_status: 'En attente',
      payment_method: activeCategory.methods[0] || '',
      period: new Date().toISOString().slice(0, 7),
      reference: `${activeCategory.documentRef}-${Date.now().toString().slice(-8)}`,
      evidence: '',
      start_date: '',
      end_date: '',
      duration: '',
      impact: '',
      validator: 'Manager RH',
      ...(active === 'contracts' ? buildContractDefaults({ contract_kind: 'Contrat de stage opérationnel' }) : {}),
      ...(active === 'documents' && String(title || '').toLowerCase().includes('attestation') ? buildAttestationDefaults({ attestation_kind: 'Attestation de stage', case_type: 'Attestation de stage', title: title || 'Créer attestation de stage' }) : {}),
    }
    const nextActions = [next, ...actions]
    persist(nextActions, 'Nouvelle opération créée. Sauvegardez pour synchroniser.')
    setSelectedActionId(next.id)
  }

  function updateAction(id: string, patch: Partial<EmployeeHRAction>) {
    const next = actions.map((action) => (action.id === id ? { ...action, ...patch } : action))
    persist(next, 'Modification appliquée. Sauvegardez pour synchroniser.')
  }

  function duplicateAction(action: EmployeeHRAction) {
    const copy = {
      ...action,
      id: makeActionId(),
      title: `${action.title} — copie`,
      status: 'À traiter',
      validation_status: 'En attente',
      workflow_status: activeCategory.workflow[0],
      due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      reference: `${activeCategory.documentRef}-${Date.now().toString().slice(-8)}`,
    }
    const next = [copy, ...actions]
    persist(next, 'Opération dupliquée. Sauvegardez pour synchroniser.')
    setSelectedActionId(copy.id)
  }

  function validateAction(action: EmployeeHRAction) {
    const next = actions.map((item) =>
      item.id === action.id
        ? {
            ...item,
            status: 'Validé',
            workflow_status: activeCategory.key === 'payments' ? 'Validé' : 'Validé',
            validation_status: 'Validé RH',
            validator: item.validator || 'Manager RH',
          }
        : item,
    )
    persist(next, 'Opération validée. Sauvegardez pour confirmer en production.')
  }

  function deleteAction(actionId: string) {
    setContractModalOpen(false)
    setAttestationModalOpen(false)
    const next = actions.filter((action) => action.id !== actionId)
    persist(next, 'Opération supprimée. Sauvegardez pour confirmer la suppression en production.')
    setSelectedActionId(next.find((action) => action.category === active)?.id || next[0]?.id || '')
  }

  
function buildAttestationStageRef(seed?: unknown) {
  const base = String(seed || Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `AC-STAGE-${day}-${base}`
}


function printAction(action: EmployeeHRAction) {
    const category = categories.find((item) => item.key === action.category) || activeCategory

    if (action.category === 'documents' && String(action.case_type || action.title || '').toLowerCase().includes('attestation')) {
      const a = buildAttestationDefaults(action)
      const fullName = employeeName || value(employee, ['full_name', 'name'], 'Collaborateur')
      const displayName = fullName.replace(/\s+/g, ' ').trim()
      const generatedAt = new Date().toLocaleString('fr-FR')
      const attestationDate = a.attestation_date ? new Date(a.attestation_date).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : today()
      const startDate = a.attestation_start_date || action.start_date || '____/____/______'
      const endDate = a.attestation_end_date || action.end_date || '____/____/______'
      const ref = action.reference || `DOC-ATT-${employeeId || 'NOID'}-${Date.now().toString().slice(-6)}`

      const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Attestation de stage - ${displayName}</title>
<style>
@page { size: A4; margin: 17mm 18mm 14mm 18mm; }
* { box-sizing: border-box; }
body { margin: 0; background: #fff; color: #050505; font-family: Arial, Helvetica, sans-serif; font-size: 18px; line-height: 1.45; }
.actions { position: fixed; top: 8px; right: 8px; z-index: 5; }
.actions button { border: 0; border-radius: 9px; background: #020617; color: white; padding: 8px 11px; font-size: 11px; font-weight: 900; }
.page { min-height: 263mm; position: relative; padding: 0 0 20mm; }
.logoRow { display: flex; align-items: center; gap: 18px; min-height: 76px; margin-bottom: 34px; }
.logoRow img { object-fit: contain; }
.artabLogo { width: 112px; height: 64px; }
.angelLogo { width: 172px; height: 64px; }
h1 { text-align: center; font-size: 28px; margin: 0 0 42px; font-weight: 900; letter-spacing: .02em; text-transform: uppercase; }
.content { max-width: 720px; margin: 0 auto; }
p { margin: 0 0 18px; }
.identity { font-weight: 700; }
b { font-weight: 900; }
.dateLine { margin-top: 38px; }
.rightBlock { margin-top: 18px; }
.footerLegal { position: absolute; left: 0; right: 0; bottom: 0; border-top: 1px solid #111; padding-top: 8px; font-size: 9px; line-height: 1.25; font-weight: 700; text-align: center; }
.meta { margin-top: 20px; color: #64748b; font-size: 8px; text-align: right; }
.contractRef { min-width: 142px; border: 1px solid #111827; border-radius: 8px; padding: 6px 8px; text-align: right; color: #050505; }
.contractRef small { display: block; font-size: 6.5px; letter-spacing: .16em; font-weight: 900; color: #475569; }
.contractRef strong { display: block; margin-top: 3px; font-size: 8.5px; font-weight: 900; }
.contractRef span { display: block; margin-top: 2px; font-size: 6.4px; color: #64748b; font-weight: 700; }
@media print { .actions { display: none; } }

/* ANGELCARE PREMIUM ATTESTATION PRINT FIX */
@page {
  size: A4;
  margin: 12mm 13mm;
}

html,
body {
  margin: 0 !important;
  padding: 0 !important;
  background: #ffffff !important;
  font-family: Calibri, "Segoe UI", Arial, sans-serif !important;
  color: #000000 !important;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

* {
  font-family: Calibri, "Segoe UI", Arial, sans-serif !important;
  box-sizing: border-box !important;
}

.stage-attestation-page,
.attestation-stage-page,
.attestation-page,
.document-page,
body > main,
body > .page {
  width: 184mm !important;
  min-height: 270mm !important;
  margin: 0 auto !important;
  padding: 12mm 14mm 16mm !important;
  position: relative !important;
  background: #ffffff !important;
}

.stage-attestation-ref,
.attestation-ref,
.document-ref {
  position: absolute !important;
  top: 12mm !important;
  right: 14mm !important;
  border: 1px solid #d7dee8 !important;
  border-radius: 8px !important;
  padding: 6px 9px !important;
  font-size: 8.5pt !important;
  line-height: 1.25 !important;
  font-weight: 700 !important;
  color: #111827 !important;
  background: #f8fafc !important;
  text-align: right !important;
  letter-spacing: .02em !important;
}

.logo-row,
.attestation-logo-row,
.stage-logo-row,
.document-logo-row,
header {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 10px !important;
  margin: 0 0 14mm !important;
  min-height: 18mm !important;
}

/* Remove duplicated logo but keep the first one */
.logo-row img:nth-of-type(n+2),
.attestation-logo-row img:nth-of-type(n+2),
.stage-logo-row img:nth-of-type(n+2),
.document-logo-row img:nth-of-type(n+2),
header img:nth-of-type(n+2),
body img:nth-of-type(n+2) {
  display: none !important;
}

.logo-row img,
.attestation-logo-row img,
.stage-logo-row img,
.document-logo-row img,
header img,
body img:first-of-type {
  max-width: 84mm !important;
  max-height: 36mm !important;
  object-fit: contain !important;
}

h1,
.attestation-title,
.stage-title {
  text-align: center !important;
  margin: 8mm 0 18mm !important;
  font-size: 21pt !important;
  line-height: 1.15 !important;
  font-weight: 800 !important;
  letter-spacing: .01em !important;
}

.attestation-body,
.stage-attestation-body,
.document-body,
main,
article {
  width: 100% !important;
  max-width: 154mm !important;
  margin: 0 auto !important;
  padding-top: 6mm !important;
  padding: 0 !important;
  font-size: 13pt !important;
  line-height: 1.42 !important;
  text-align: left !important;
}

.attestation-body p,
.stage-attestation-body p,
.document-body p,
p {
  margin: 0 0 8mm !important;
  font-size: 13pt !important;
  line-height: 1.42 !important;
}

strong,
b {
  font-weight: 800 !important;
}

.footer,
.attestation-footer,
.stage-footer,
.document-footer,
footer {
  position: absolute !important;
  left: 14mm !important;
  right: 14mm !important;
  bottom: 10mm !important;
  font-size: 6.8pt !important;
  line-height: 1.25 !important;
  text-align: center !important;
  color: #000000 !important;
  border-top: 1px solid #111827 !important;
  padding-top: 2.5mm !important;
}



/* ANGELCARE ATTESTATION FINAL SPACING OVERRIDE */
.logo-row img,
.attestation-logo-row img,
.stage-logo-row img,
.document-logo-row img,
header img,
body img:first-of-type {
  max-width: 84mm !important;
  max-height: 36mm !important;
}

h1,
.attestation-title,
.stage-title {
  margin-top: 8mm !important;
  margin-bottom: 18mm !important;
}

.attestation-body,
.stage-attestation-body,
.document-body,
main article,
article {
  max-width: 154mm !important;
  margin-left: auto !important;
  margin-right: auto !important;
  padding-top: 6mm !important;
}

</style>
</head>
<body>
<div class="actions"><button onclick="window.print()">Imprimer A4</button></div>
<main class="page">
  <div class="logoRow">
    <img class="artabLogo" src="/pacojaco/logo.png" /></div>

  <section class="content">
    <h1>ATTESTATION DE STAGE</h1>

    <p>${a.attestation_intro_text}</p>

    <p class="identity">
      Nous certifions que ${a.attestation_employee_civility || 'Mme.'} <b>${displayName}</b>,
      titulaire de CIN <b>${a.attestation_employee_cin || '__________'}</b>,
      demeurant <b>${a.attestation_employee_address || 'adresse non renseignée'}</b>,
      a effectué un stage dans notre entreprise en qualité de
      <b>${a.attestation_role || 'stagiaire'}</b>, pour une période: du
      <b>${startDate}</b> jusqu’au <b>${endDate}</b>.
    </p>

    <p>${a.attestation_quality_text}</p>

    <p>${a.attestation_result_text}</p>

    <p class="dateLine">Fait à ${a.attestation_city || 'Témara'}, le ${attestationDate}.</p>

    <p class="rightBlock">${a.attestation_purpose_text || 'Pour servir et valoir ce que de droit.'}</p>

    <div class="meta">Référence document: ${ref} · Généré depuis Employee 360 le ${generatedAt}</div>
  </section>

  <footer class="footerLegal">${a.attestation_footer_legal}</footer>
</main>
</body>
</html>`

      const win = window.open('', '_blank', 'width=900,height=1100')
      if (!win) {
        setWorkspaceMessage('Fenêtre impression bloquée par le navigateur. Autorisez les popups pour imprimer l’attestation.')
        return
      }
      win.document.open()
      win.document.write(html)
      win.document.close()
      win.focus()
      return
    }

    if (action.category === 'contracts') {
      const c = buildContractDefaults(action)
      const fullName = employeeName || value(employee, ['full_name', 'name'], 'Collaborateur')
      const upperName = fullName.toUpperCase()
      const generatedAt = new Date().toLocaleString('fr-FR')
      const contractStart = c.contract_start_date || action.start_date || '____/____/______'
      const contractEnd = c.contract_end_date || action.end_date || '____/____/______'
      const trialStart = c.trial_start_date || contractStart
      const trialEnd = c.trial_end_date || '____/____/______'
      const madeAt = c.contract_city || 'TEMARA'
      const madeDate = c.contract_date ? new Date(c.contract_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: '2-digit' }) : today()
      const ref = action.reference || `CTR-${employeeId || 'NOID'}-${Date.now().toString().slice(-6)}`

      const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Contrat - ${upperName}</title>
<style>
@page { size: A4; margin: 10mm 13mm 9mm 13mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #050505; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 9.6px; line-height: 1.24; }
.actions { position: fixed; top: 8px; right: 8px; z-index: 5; }
.actions button { border: 0; border-radius: 9px; background: #020617; color: white; padding: 8px 11px; font-size: 11px; font-weight: 900; }
.page { width: 100%; min-height: 278mm; padding: 0 0 8mm; position: relative; display: flex; flex-direction: column; }
.logoRow { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; min-height: 54px; margin-bottom: 6px; }
.logoRow img { object-fit: contain; }
.artabLogo { width: 92px; height: 48px; }
.angelLogo { width: 126px; height: 48px; }
.titleBand { color: #9ca3af; text-align: center; font-size: 18px; font-weight: 900; line-height: 1.06; letter-spacing: .03em; padding: 2px 0 3px; margin: 2px 0 12px; }
.titleBand div { padding: 1px 0; }
p { margin: 0 0 5.8px; }
b, strong { font-weight: 900; }
.u { text-decoration: underline; font-weight: 900; }
.article { margin: 6px 0 0; }
.articleTitle { font-weight: 900; text-decoration: underline; margin-bottom: 2px; }
.small { font-size: 8px; }
.signatureIntro { margin-top: 14px; font-weight: 900; }
.signTable { width: 100%; border-collapse: collapse; margin-top: 7px; table-layout: fixed; }
.signTable th { background: #050505; color: #fff; border: 1px solid #050505; padding: 3px; font-size: 9px; }
.signTable td { border: 1px solid #050505; vertical-align: top; text-align: center; height: 24px; padding: 3px; font-size: 8.5px; }
.signTable .signBox td { height: 76px; vertical-align: top; font-style: italic; font-size: 7.4px; }
.footer { margin-top: auto; padding-top: 8px; display: flex; justify-content: space-between; gap: 14px; font-size: 6.8px; font-weight: 900; border-top: 1px solid #e5e7eb; }
.meta { color: #475569; font-size: 6.6px; margin-top: 4px; text-align: right; }
@media print { .actions { display: none; } }
</style>
</head>
<body>
<div class="actions"><button onclick="window.print()">Imprimer A4</button></div>
<main class="page">
  <div class="logoRow">
    <img class="artabLogo" src="/pacojaco/logo.png" /></div>

  <section class="titleBand">
    <div>*************************CONTRAT DE STAGE*************************</div>
    <div>******************************OPÉRATIONNEL*****************************</div>
  </section>

  <p><span class="u">Entre :</span></p>
  <p>*La société <b>${c.company_legal_name}</b>, Siège social ${c.company_address}, R.C : ${c.company_rc} / IF : ${c.company_if} / ICE : ${c.company_ice} / T.P : ${c.company_tp}.</p>
  <p>*${c.business_unit_name}: ${c.business_unit_address}.</p>

  <p style="margin-top:8px;"><span class="u">Et :</span></p>
  <p>${c.employee_civility || 'Mlle'} <b>${upperName}</b> * Née le: <b>${c.employee_birth_date || '____/____/______'}</b> à <b>${c.employee_birth_place || '________________'}</b>, CIN n° *<b>${c.employee_cin || '__________'}</b>*, Résidant à *<b>${c.employee_address || 'Adresse non renseignée'}</b>*.</p>

  <p style="margin-top:7px;"><i><b>Il a été convenu ce qui suit</b></i></p>

  <section class="article"><div class="articleTitle">Article 1 : Engagement</div>
    <p>${c.employee_civility || 'Mlle'} <b>${upperName}</b>, a été désignée en tant que stagiaire en <b>${c.contract_role}</b>, ${c.contract_pole ? `pôle ${c.contract_pole}` : ''}, du <b>${contractStart}</b> au <b>${contractEnd}</b>.</p>
  </section>

  <section class="article"><div class="articleTitle">Article 2 : Attributions</div>
    <p>${c.employee_civility || 'Mlle'} <b>${upperName}</b> effectuera les tâches afférentes aux différentes fonctions, en <b>${c.contract_pole || c.contract_role}</b>, et qui seront définies par la fiche métier du poste. Ces tâches seront évolutives et seront effectuées depuis son poste de travail, situé au centre d’opérations et traitement de service situé à Témara.</p>
  </section>

  <section class="article"><div class="articleTitle">Article 3 : Durée du stage</div>
    <p>${c.employee_civility || 'Mlle'} <b>${upperName}</b> est en période de stage, pour une durée déterminée, après avoir complété <b>${c.trial_days || '05'}(jrs)</b> en période d'essai du <b>${trialStart}</b> jusqu’au <b>${trialEnd}</b>. Ensuite, le présent contrat peut être résilié dans le cas où les compétences et les performances du stagiaire ne correspondent pas aux critères et attentes du poste en question.</p>
  </section>

  <section class="article"><div class="articleTitle">Article 4 : Rémunération</div><p>${c.remuneration_text}</p></section>
  <section class="article"><div class="articleTitle">Article 5 : Déplacements</div><p>${c.displacement_text}</p></section>
  <section class="article"><div class="articleTitle">Article 6 : Congés</div><p>${c.leave_text}</p></section>
  <section class="article"><div class="articleTitle">Article 7 : Horaires appliqués</div><p style="white-space:pre-wrap;">${c.schedule_text}</p></section>
  <section class="article"><div class="articleTitle">Article 8 : Résiliation du contrat</div><p style="white-space:pre-wrap;">${c.termination_text}</p></section>
  <section class="article"><div class="articleTitle">Article 9 : Secret professionnel</div><p>${c.confidentiality_text}</p></section>
  <section class="article"><div class="articleTitle">Article 10 : Litiges et contestation</div><p>${c.disputes_text}</p></section>

  <p class="signatureIntro">Fait à ${madeAt}, le ${madeDate},</p>

  <table class="signTable">
    <tr><th>Raison sociale</th><th></th><th>Le / La stagiaire</th></tr>
    <tr>
      <td>*${c.company_legal_name}*</td>
      <td>*ANGELCARE*</td>
      <td>${c.employee_civility || 'Mlle'} ${upperName}</td>
    </tr>
    <tr>
      <td>*R.C : ${c.company_rc} / RESSOURCES HUMAINES*</td>
      <td>*I.F: 53237789 - T.P: 20113706*</td>
      <td>*${c.employee_cin || 'CIN'}*</td>
    </tr>
    <tr class="signBox">
      <td>SIGNATURE / CACHET</td>
      <td>SIGNATURE / LU ET APPROUVÉ</td>
      <td>SIGNATURE / LU ET APPROUVÉ</td>
    </tr>
  </table>

  <div class="meta">Référence dossier: ${ref} · Généré depuis Employee 360 le ${generatedAt}</div>

  <footer class="footer">
    <span>${c.footer_reference}</span>
    <span>WWW.ANGELCAREHUB.COM</span>
  </footer>
</main>
</body>
</html>`

      const win = window.open('', '_blank', 'width=900,height=1100')
      if (!win) {
        setWorkspaceMessage('Fenêtre impression bloquée par le navigateur. Autorisez les popups pour imprimer le document.')
        return
      }
      win.document.open()
      win.document.write(html)
      win.document.close()
      win.focus()
      return
    }
    const generatedAt = new Date().toLocaleString('fr-FR')
    const ref = action.reference || `${category.documentRef}-${employeeId || 'NOID'}`
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${category.printTitle} - ${employeeName}</title>
<style>
@page { size: A5; margin: 8mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #0f172a; font-size: 8px; background: #fff; }
.page { width: 100%; min-height: 100%; border: 1px solid #dbe3ef; border-radius: 14px; padding: 12px; }
.header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
.brand { display: flex; align-items: center; gap: 8px; }
.brand img { width: 34px; height: 34px; object-fit: contain; }
.brand b { display: block; font-size: 9px; letter-spacing: .16em; text-transform: uppercase; }
.brand span { display: block; color: #64748b; font-weight: 700; margin-top: 2px; }
.ref { text-align: right; background: #020617; color: white; border-radius: 12px; padding: 8px 10px; min-width: 118px; }
.ref small { display: block; opacity: .65; text-transform: uppercase; letter-spacing: .14em; }
.ref strong { display: block; font-size: 10px; margin-top: 4px; }
h1 { font-size: 15px; margin: 12px 0 3px; letter-spacing: -.02em; }
.subtitle { color: #475569; font-weight: 700; margin-bottom: 10px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 7px; min-height: 34px; }
.box label { display: block; color: #64748b; text-transform: uppercase; letter-spacing: .12em; font-weight: 900; font-size: 6.5px; margin-bottom: 4px; }
.box div { font-weight: 800; font-size: 8px; white-space: pre-wrap; }
.notes { grid-column: 1 / -1; min-height: 62px; }
.footer { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.sign { border: 1px dashed #94a3b8; border-radius: 10px; height: 48px; padding: 7px; color: #64748b; font-weight: 800; }
.meta { margin-top: 10px; color: #64748b; font-weight: 700; display: flex; justify-content: space-between; gap: 8px; }
.actions { position: fixed; top: 8px; right: 8px; }
.actions button { font-size: 11px; padding: 8px 10px; border-radius: 10px; border: 0; background: #020617; color: white; font-weight: 900; }
@media print { .actions { display: none; } }
</style>
</head>
<body>
<div class="actions"><button onclick="window.print()">Imprimer A5</button></div>
<main class="page">
  <section class="header">
    <div class="brand">
      <img src="/logo.png" />
      <div><b>AngelCare HR</b><span>Dossier collaborateur 360</span></div>
    </div>
    <div class="ref"><small>Référence document</small><strong>${ref}</strong><small>${generatedAt}</small></div>
  </section>

  <h1>${category.printTitle}</h1>
  <div class="subtitle">${employeeName} · ${value(employee, ['position', 'job_title', 'role'], 'Fonction non renseignée')} · ${value(employee, ['department'], 'Département non renseigné')}</div>

  <section class="grid">
    <div class="box"><label>Type opération</label><div>${action.case_type || category.label}</div></div>
    <div class="box"><label>Statut</label><div>${action.status || ''} · ${action.validation_status || ''}</div></div>
    <div class="box"><label>Responsable</label><div>${action.owner || ''}</div></div>
    <div class="box"><label>Validateur</label><div>${action.validator || ''}</div></div>
    <div class="box"><label>Date / échéance</label><div>${action.due_date || ''}</div></div>
    <div class="box"><label>Période</label><div>${action.period || action.start_date || ''}${action.end_date ? ' → ' + action.end_date : ''}</div></div>
    <div class="box"><label>Montant / durée</label><div>${action.amount || action.duration || 'N/A'}</div></div>
    <div class="box"><label>Méthode / référence</label><div>${action.payment_method || ''} ${action.reference || ''}</div></div>
    <div class="box notes"><label>Résumé opérationnel</label><div>${action.notes || ''}</div></div>
    <div class="box notes"><label>Impact / preuve</label><div>${action.impact || action.evidence || 'N/A'}</div></div>
  </section>

  <section class="footer">
    <div class="sign">Signature Manager / Responsable</div>
    <div class="sign">Cachet & validation RH</div>
  </section>

  <div class="meta">
    <span>Source: Employee 360 Dossier Modal</span>
    <span>Body font: 8px · Format A5</span>
  </div>
</main>
</body>
</html>`
    const win = window.open('', '_blank', 'noopener,noreferrer,width=760,height=900')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  const colorClass: Record<string, string> = {
    violet: 'bg-violet-50 text-violet-800 border-violet-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-100',
    blue: 'bg-blue-50 text-blue-800 border-blue-100',
    rose: 'bg-rose-50 text-rose-800 border-rose-100',
    fuchsia: 'bg-fuchsia-50 text-fuchsia-800 border-fuchsia-100',
    teal: 'bg-teal-50 text-teal-800 border-teal-100',
  }

  const statuses = Array.from(new Set(['all', ...activeCategory.workflow, ...categoryActions.map((action) => action.status || '').filter(Boolean), ...categoryActions.map((action) => action.validation_status || '').filter(Boolean)]))
  const priorities = ['all', 'Basse', 'Normale', 'Haute', 'Critique']

  return (
    <section className="mt-6 rounded-[34px] border border-white/80 bg-white p-5 shadow-xl shadow-slate-200/70">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-violet-700">Employee HR case operations center</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Centre opérationnel RH collaborateur</h3>
          <p className="mt-2 max-w-5xl text-sm font-bold leading-6 text-slate-500">
            Paie, congés, présence, planning, documents, contrats, performance et formation sont traités comme des cas RH structurés:
            création, édition, validation, suppression, historique filtrable, sauvegarde production et impression A5.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-4 xl:min-w-[640px]">
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Cas total</p>
            <p className="mt-1 text-2xl font-black">{actions.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sync source</p>
            <p className="mt-1 text-2xl font-black">{activeCategory.synced}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-800">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">À valider</p>
            <p className="mt-1 text-2xl font-black">{actions.filter((action) => String(action.validation_status || '').toLowerCase().includes('attente')).length}</p>
          </div>
          <button
            type="button"
            disabled={savingWorkspace}
            onClick={() => saveToProduction(actions)}
            className="rounded-2xl bg-violet-600 p-4 text-left text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-50"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Production</p>
            <p className="mt-1 text-sm font-black">{savingWorkspace ? 'Sauvegarde...' : 'Sauvegarder tout'}</p>
          </button>
        </div>
      </div>

      {workspaceMessage ? (
        <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-3 text-sm font-black text-cyan-800">
          {workspaceMessage}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_430px]">
        <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-2">
            {categories.map((category) => {
              const count = actions.filter((action) => action.category === category.key).length
              const valid = actions.filter((action) => action.category === category.key && String(action.validation_status || '').toLowerCase().includes('valid')).length
              const isActive = category.key === active
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => {
                    setActive(category.key)
                    setTypeFilter('all')
                    setStatusFilter('all')
                    setPriorityFilter('all')
                    setSelectedActionId(actions.find((action) => action.category === category.key)?.id || '')
                  }}
                  className={`rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    isActive ? colorClass[category.color] : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">{category.label}</p>
                      <p className="mt-1 text-xs font-bold opacity-70">{category.subtitle}</p>
                      <p className="mt-2 text-[10px] font-black opacity-70">{valid}/{count} validé(s)</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-700">{count}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="rounded-[28px] border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Catégorie active</p>
              <h4 className="mt-1 text-2xl font-black text-slate-950">{activeCategory.label}</h4>
              <p className="mt-1 max-w-2xl text-sm font-bold text-slate-500">{activeCategory.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeCategory.templates.slice(0, 3).map((template) => (
                <button
                  key={template}
                  type="button"
                  onClick={() => createAction(template)}
                  className="rounded-full border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 hover:bg-violet-100"
                >
                  + {template}
                </button>
              ))}
              <button
                type="button"
                onClick={() => createAction()}
                className="rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-violet-700"
              >
                + Cas libre
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 p-3">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filtrer titre, responsable, référence, notes..."
                className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-violet-100"
              />
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none">
                <option value="all">Tous types</option>
                {activeCategory.caseTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none">
                {statuses.map((status) => <option key={status} value={status}>{status === 'all' ? 'Tous statuts' : status}</option>)}
              </select>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none">
                {priorities.map((priority) => <option key={priority} value={priority}>{priority === 'all' ? 'Toutes priorités' : priority}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {filteredActions.length ? filteredActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  setSelectedActionId(action.id)
                  if (activeCategory.key === 'contracts') setContractModalOpen(true)
                  if (activeCategory.key === 'documents' && isAttestationAction(action)) {
                    hydrateAttestationAction(action.id)
                    setAttestationModalOpen(true)
                  }
                }}
                className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                  selectedAction?.id === action.id ? 'border-violet-200 bg-violet-50' : 'border-slate-200 bg-slate-50/80'
                }`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-base font-black text-slate-950">{action.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{action.case_type || activeCategory.label} · {action.owner} · échéance {action.due_date || 'non définie'}</p>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{action.reference || 'Référence à générer'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-black">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700 ring-1 ring-slate-100">{action.status}</span>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700 ring-1 ring-cyan-100">{action.validation_status || 'En attente'}</span>
                    <span className={action.priority === 'Haute' || action.priority === 'Critique' ? 'rounded-full bg-rose-50 px-3 py-1 text-rose-700 ring-1 ring-rose-100' : 'rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100'}>{action.priority}</span>
                    {action.amount ? <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-amber-100">{action.amount}</span> : null}
                  </div>
                </div>
              </button>
            )) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-lg font-black text-slate-950">Aucun cas trouvé</p>
                <p className="mt-2 text-sm font-bold text-slate-500">Créez un cas libre ou changez les filtres.</p>
              </div>
            )}
          </div>
        </main>

        <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Fiche opération</p>
              <h4 className="mt-1 text-xl font-black text-slate-950">{selectedAction ? 'Modifier cas RH' : 'Aucun cas'}</h4>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${colorClass[activeCategory.color]}`}>
              {activeCategory.label}
            </span>
          </div>

          {selectedAction ? (
            <div className="mt-4 grid gap-3">
              <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Titre</span>
                <input value={selectedAction.title} onChange={(event) => updateAction(selectedAction.id, { title: event.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:ring-4 focus:ring-violet-100" />
              </label>

              <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Type opération</span>
                <select value={selectedAction.case_type || activeCategory.caseTypes[0]} onChange={(event) => updateAction(selectedAction.id, { case_type: event.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none">
                  {activeCategory.caseTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>

              <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Responsable</span>
                <input value={selectedAction.owner} onChange={(event) => updateAction(selectedAction.id, { owner: event.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:ring-4 focus:ring-violet-100" />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Statut</span>
                  <select value={selectedAction.status} onChange={(event) => updateAction(selectedAction.id, { status: event.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none">
                    <option>À traiter</option>
                    <option>Planifié</option>
                    <option>En cours</option>
                    <option>En attente</option>
                    <option>Validé</option>
                    <option>Clôturé</option>
                    <option>Annulé</option>
                  </select>
                </label>
                <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Priorité</span>
                  <select value={selectedAction.priority} onChange={(event) => updateAction(selectedAction.id, { priority: event.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none">
                    <option>Basse</option>
                    <option>Normale</option>
                    <option>Haute</option>
                    <option>Critique</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Workflow</span>
                  <select value={selectedAction.workflow_status || activeCategory.workflow[0]} onChange={(event) => updateAction(selectedAction.id, { workflow_status: event.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none">
                    {activeCategory.workflow.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Validation</span>
                  <select value={selectedAction.validation_status || 'En attente'} onChange={(event) => updateAction(selectedAction.id, { validation_status: event.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none">
                    <option>En attente</option>
                    <option>À revoir</option>
                    <option>Validé RH</option>
                    <option>Validé manager</option>
                    <option>Rejeté</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Date</span>
                  <input type="date" value={selectedAction.due_date} onChange={(event) => updateAction(selectedAction.id, { due_date: event.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none" />
                </label>
                <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Montant / valeur</span>
                  <input value={selectedAction.amount || ''} onChange={(event) => updateAction(selectedAction.id, { amount: event.target.value })} placeholder="Ex: 1500 MAD" className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none" />
                </label>
              </div>

              {activeCategory.fields.includes('payment_method') ? (
                <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Mode paiement</span>
                  <select value={selectedAction.payment_method || activeCategory.methods[0] || ''} onChange={(event) => updateAction(selectedAction.id, { payment_method: event.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none">
                    {activeCategory.methods.map((method) => <option key={method}>{method}</option>)}
                  </select>
                </label>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Période / début</span>
                  <input value={selectedAction.period || selectedAction.start_date || ''} onChange={(event) => updateAction(selectedAction.id, { period: event.target.value, start_date: event.target.value })} placeholder="2026-06 ou date" className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none" />
                </label>
                <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Fin / durée</span>
                  <input value={selectedAction.end_date || selectedAction.duration || ''} onChange={(event) => updateAction(selectedAction.id, { end_date: event.target.value, duration: event.target.value })} placeholder="Fin ou durée" className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none" />
                </label>
              </div>

              <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Référence / preuve</span>
                <input value={selectedAction.reference || ''} onChange={(event) => updateAction(selectedAction.id, { reference: event.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none" />
              </label>

              <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Impact / justification</span>
                <textarea value={selectedAction.impact || selectedAction.evidence || ''} onChange={(event) => updateAction(selectedAction.id, { impact: event.target.value, evidence: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-violet-100" />
              </label>

              <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Notes</span>
                <textarea value={selectedAction.notes} onChange={(event) => updateAction(selectedAction.id, { notes: event.target.value })} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-violet-100" />
              </label>

              {activeCategory.key === 'contracts' ? (
                <button type="button" onClick={() => setContractModalOpen(true)} className="rounded-2xl bg-slate-950 px-3 py-3 text-xs font-black text-white">
                  Ouvrir constructeur contrat A4
                </button>
              ) : null}

              {activeCategory.key === 'documents' && String(selectedAction.case_type || selectedAction.title || '').toLowerCase().includes('attestation') ? (
                <button type="button" onClick={() => { hydrateAttestationAction(selectedAction.id); setAttestationModalOpen(true) }} className="rounded-2xl bg-slate-950 px-3 py-3 text-xs font-black text-white">
                  Ouvrir constructeur attestation A4
                </button>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => validateAction(selectedAction)} className="rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-black text-white">Valider</button>
                <button type="button" onClick={() => printAction(selectedAction)} className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">{activeCategory.key === 'contracts' ? 'Print A4' : 'Print A5'}</button>
                <button type="button" onClick={() => saveToProduction(actions)} className="rounded-2xl bg-violet-600 px-3 py-2 text-xs font-black text-white">Save</button>
                <button type="button" onClick={() => duplicateAction(selectedAction)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">Duplicate</button>
                <button type="button" onClick={() => deleteAction(selectedAction.id)} className="col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">Delete permanently</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-500">
              Sélectionnez ou créez un cas RH.
            </div>
          )}
        </aside>
      </div>

      {attestationModalOpen && selectedAction && activeCategory.key === 'documents' ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[94vh] w-full max-w-7xl overflow-auto rounded-[32px] border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white p-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-blue-600">Attestation RH · constructeur A4</p>
                <h3 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">Attestation de stage collaborateur</h3>
                <p className="mt-1 max-w-4xl text-sm font-bold leading-6 text-slate-500">
                  Remplissez les champs selon le modèle d’attestation de stage ARTAB / ANGELCARE. Le document imprimé sort en A4 avec identité, période, appréciation, date et footer légal.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => validateAction(selectedAction)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Valider attestation</button>
                <button type="button" onClick={() => saveToProduction(actions)} className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white">Save</button>
                <button type="button" onClick={() => printAction(selectedAction)} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Print A4</button>
                <button type="button" onClick={() => { deleteAction(selectedAction.id); setAttestationModalOpen(false) }} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">Delete permanently</button>
                <button type="button" onClick={() => setAttestationModalOpen(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Fermer</button>
              </div>
            </div>

            <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="grid gap-4">
                <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Informations attestation</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Nature document</span><input value={selectedAction.attestation_kind || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_kind: e.target.value, case_type: 'Attestation de stage' })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Ville</span><input value={selectedAction.attestation_city || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_city: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Date attestation</span><input type="date" value={selectedAction.attestation_date || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_date: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold" /></label>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Émetteur ARTAB / ANGELCARE</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Nom société</span><input value={selectedAction.attestation_company_name || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_company_name: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Adresse courte</span><input value={selectedAction.attestation_company_address || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_company_address: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Identité stagiaire</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Civilité</span><input value={selectedAction.attestation_employee_civility || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_employee_civility: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">CIN</span><input value={selectedAction.attestation_employee_cin || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_employee_cin: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Fonction stage</span><input value={selectedAction.attestation_role || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_role: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 md:col-span-3"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Adresse stagiaire</span><input value={selectedAction.attestation_employee_address || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_employee_address: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Période, appréciation et texte officiel</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Début stage</span><input type="date" value={selectedAction.attestation_start_date || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_start_date: e.target.value, start_date: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Fin stage</span><input type="date" value={selectedAction.attestation_end_date || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_end_date: e.target.value, end_date: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 md:col-span-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Introduction</span><textarea rows={3} value={selectedAction.attestation_intro_text || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_intro_text: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 md:col-span-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Appréciation</span><textarea rows={3} value={selectedAction.attestation_quality_text || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_quality_text: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 md:col-span-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Résultat</span><textarea rows={2} value={selectedAction.attestation_result_text || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_result_text: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 md:col-span-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Footer légal</span><textarea rows={3} value={selectedAction.attestation_footer_legal || ''} onChange={(e) => updateAction(selectedAction.id, { attestation_footer_legal: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold" /></label>
                  </div>
                </section>
              </div>

              <aside className="sticky top-24 h-max rounded-[28px] border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl [&_*:not(button):not(button_*)]:!text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] !text-white/70">A4 preview logic</p>
                <h4 className="mt-3 text-2xl font-black">Attestation prête à imprimer</h4>
                <div className="mt-5 grid gap-3 text-sm font-bold !text-white">
                  <div className="rounded-2xl bg-white/10 p-4 !text-white"><b className="block !text-white">Stagiaire</b><span className="block !text-white/90">{employeeName}</span></div>
                  <div className="rounded-2xl bg-white/10 p-4 !text-white"><b className="block !text-white">CIN</b><span className="block !text-white/90">{selectedAction.attestation_employee_cin || 'Non renseigné'}</span></div>
                  <div className="rounded-2xl bg-white/10 p-4 !text-white"><b className="block !text-white">Période</b><span className="block !text-white/90">{selectedAction.attestation_start_date || 'Début'} → {selectedAction.attestation_end_date || 'Fin'}</span></div>
                  <div className="rounded-2xl bg-white/10 p-4 !text-white"><b className="block !text-white">Référence</b><span className="block !text-white/90">{selectedAction.reference || 'À générer'}</span></div>
                </div>
                <button type="button" onClick={() => printAction(selectedAction)} className="mt-5 w-full rounded-2xl bg-white px-4 py-4 text-sm font-black text-slate-950">Imprimer l’attestation A4</button>
              </aside>
            </div>
          </div>
        </div>
      ) : null}

      {contractModalOpen && selectedAction && activeCategory.key === 'contracts' ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[94vh] w-full max-w-7xl overflow-auto rounded-[32px] border border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white p-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.26em] text-rose-600">Contrat RH · constructeur A4</p>
                <h3 className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950">Contrat opérationnel collaborateur</h3>
                <p className="mt-1 max-w-4xl text-sm font-bold leading-6 text-slate-500">
                  Remplissez les champs selon le modèle contractuel ARTAB / ANGELCARE. Le document imprimé sort en A4 structuré avec articles, identité, dates et signatures.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => validateAction(selectedAction)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Valider contrat</button>
                <button type="button" onClick={() => saveToProduction(actions)} className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white">Save</button>
                <button type="button" onClick={() => printAction(selectedAction)} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Print A4</button>
                <button type="button" onClick={() => { deleteAction(selectedAction.id); setContractModalOpen(false) }} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">Delete permanently</button>
                <button type="button" onClick={() => setContractModalOpen(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">Fermer</button>
              </div>
            </div>

            <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="grid gap-4">
                <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Informations contrat</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Nature contrat</span><input value={selectedAction.contract_kind || ''} onChange={(e) => updateAction(selectedAction.id, { contract_kind: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Ville signature</span><input value={selectedAction.contract_city || ''} onChange={(e) => updateAction(selectedAction.id, { contract_city: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Date signature</span><input type="date" value={selectedAction.contract_date || ''} onChange={(e) => updateAction(selectedAction.id, { contract_date: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold" /></label>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Société & unité AngelCare</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Raison sociale</span><input value={selectedAction.company_legal_name || ''} onChange={(e) => updateAction(selectedAction.id, { company_legal_name: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Adresse société</span><input value={selectedAction.company_address || ''} onChange={(e) => updateAction(selectedAction.id, { company_address: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">RC</span><input value={selectedAction.company_rc || ''} onChange={(e) => updateAction(selectedAction.id, { company_rc: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">IF / ICE / TP</span><input value={`${selectedAction.company_if || ''} / ${selectedAction.company_ice || ''} / ${selectedAction.company_tp || ''}`} readOnly className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-500" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 md:col-span-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Unité d’affaire</span><input value={selectedAction.business_unit_name || ''} onChange={(e) => updateAction(selectedAction.id, { business_unit_name: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 md:col-span-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Adresse unité</span><input value={selectedAction.business_unit_address || ''} onChange={(e) => updateAction(selectedAction.id, { business_unit_address: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Identité collaborateur / stagiaire</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Civilité</span><input value={selectedAction.employee_civility || ''} onChange={(e) => updateAction(selectedAction.id, { employee_civility: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Date naissance</span><input value={selectedAction.employee_birth_date || ''} onChange={(e) => updateAction(selectedAction.id, { employee_birth_date: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Lieu naissance</span><input value={selectedAction.employee_birth_place || ''} onChange={(e) => updateAction(selectedAction.id, { employee_birth_place: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">CIN</span><input value={selectedAction.employee_cin || ''} onChange={(e) => updateAction(selectedAction.id, { employee_cin: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 md:col-span-2"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Adresse</span><input value={selectedAction.employee_address || ''} onChange={(e) => updateAction(selectedAction.id, { employee_address: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                  </div>
                </section>

                <section className="rounded-[28px] border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Engagement, durée, horaires et clauses</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Fonction</span><input value={selectedAction.contract_role || ''} onChange={(e) => updateAction(selectedAction.id, { contract_role: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Pôle</span><input value={selectedAction.contract_pole || ''} onChange={(e) => updateAction(selectedAction.id, { contract_pole: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Jours essai</span><input value={selectedAction.trial_days || ''} onChange={(e) => updateAction(selectedAction.id, { trial_days: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Début contrat</span><input type="date" value={selectedAction.contract_start_date || ''} onChange={(e) => updateAction(selectedAction.id, { contract_start_date: e.target.value, start_date: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Fin contrat</span><input type="date" value={selectedAction.contract_end_date || ''} onChange={(e) => updateAction(selectedAction.id, { contract_end_date: e.target.value, end_date: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Référence</span><input value={selectedAction.reference || ''} onChange={(e) => updateAction(selectedAction.id, { reference: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 md:col-span-3"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Rémunération</span><textarea rows={2} value={selectedAction.remuneration_text || ''} onChange={(e) => updateAction(selectedAction.id, { remuneration_text: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 md:col-span-3"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Horaires appliqués</span><textarea rows={4} value={selectedAction.schedule_text || ''} onChange={(e) => updateAction(selectedAction.id, { schedule_text: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 md:col-span-3"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Résiliation</span><textarea rows={4} value={selectedAction.termination_text || ''} onChange={(e) => updateAction(selectedAction.id, { termination_text: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold" /></label>
                    <label className="block rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 md:col-span-3"><span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Secret professionnel</span><textarea rows={3} value={selectedAction.confidentiality_text || ''} onChange={(e) => updateAction(selectedAction.id, { confidentiality_text: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold" /></label>
                  </div>
                </section>
              </div>

              <aside className="sticky top-24 h-max rounded-[28px] border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl [&_*:not(button):not(button_*)]:!text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] !text-white/70">A4 preview logic</p>
                <h4 className="mt-3 text-2xl font-black">Contrat prêt à imprimer</h4>
                <div className="mt-5 grid gap-3 text-sm font-bold !text-white">
                  <div className="rounded-2xl bg-white/10 p-4 !text-white"><b className="block !text-white">Collaborateur</b><span className="block !text-white/90">{employeeName}</span></div>
                  <div className="rounded-2xl bg-white/10 p-4 !text-white"><b className="block !text-white">Fonction</b><span className="block !text-white/90">{selectedAction.contract_role || 'Non renseigné'}</span></div>
                  <div className="rounded-2xl bg-white/10 p-4 !text-white"><b className="block !text-white">Période</b><span className="block !text-white/90">{selectedAction.contract_start_date || 'Début'} → {selectedAction.contract_end_date || 'Fin'}</span></div>
                  <div className="rounded-2xl bg-white/10 p-4 !text-white"><b className="block !text-white">Référence</b><span className="block !text-white/90">{selectedAction.reference || 'À générer'}</span></div>
                </div>
                <button type="button" onClick={() => printAction(selectedAction)} className="mt-5 w-full rounded-2xl bg-white px-4 py-4 text-sm font-black text-slate-950">Imprimer le contrat A4</button>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default function Employee360DossierModal({
  employee,
  open,
  onClose,
  onSaved,
}: {
  employee: EmployeeRecord | null
  open: boolean
  onClose: () => void
  onSaved?: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EmployeeRecord>(employee || {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setForm(employee || {})
    setEditing(false)
    setError('')
    setConfirmDelete(false)
  }, [employee])

  const name = value(form, ['full_name', 'name', 'email'], 'Collaborateur')
  const firstName = value(form, ['first_name'], name.split(' ')[0] || '')
  const lastName = value(form, ['last_name'], name.split(' ').slice(1).join(' ') || '')
  const email = value(form, ['email'])
  const phone = value(form, ['phone', 'mobile'])
  const department = value(form, ['department'], 'Département non renseigné')
  const role = value(form, ['position', 'job_title', 'role'], 'Fonction non renseignée')
  const city = value(form, ['city', 'location'], 'Ville non renseignée')
  const status = value(form, ['employment_status', 'status'], 'active')
  const ref = dossierRef(employee)
  const ready = percentNumber(employee?.__sync?.readiness || 0)
  const risk = percentNumber(employee?.__sync?.risk || 0)
  const evidence = syncCount(employee)
  const evidencePct = Math.round((evidence / 8) * 100)
  const id = value(employee, ['id', 'employee_id'])

  const syncItems = useMemo(() => syncItemsFor(employee), [employee])
  const liveRows = useMemo(() => dataRows(employee), [employee])

  if (!open || !employee) return null

  function patch(field: string, next: string) {
    setForm((current) => ({ ...current, [field]: next }))
  }

  async function save() {
    if (!id) {
      setError('Impossible de sauvegarder : identifiant employé manquant.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const response = await fetch(`/api/hr/employees?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizePatch(form)),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `Sauvegarde impossible (${response.status})`)
      }

      setEditing(false)
      onSaved?.()
    } catch (err: any) {
      setError(err?.message || 'Impossible de sauvegarder le dossier employé.')
    } finally {
      setSaving(false)
    }
  }

  async function deletePermanently() {
    if (!id) {
      setError('Impossible de supprimer : identifiant employé manquant.')
      return
    }

    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    try {
      setSaving(true)
      setError('')

      const response = await fetch(`/api/hr/employees?id=${encodeURIComponent(id)}&permanent=true`, {
        method: 'DELETE',
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || `Suppression impossible (${response.status})`)
      }

      onClose()
      onSaved?.()
    } catch (err: any) {
      setError(err?.message || 'Impossible de supprimer définitivement ce dossier.')
    } finally {
      setSaving(false)
    }
  }

  function printDossier() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-[99999] isolate bg-slate-950/70 p-4 -xl print:static print:bg-white print:p-0">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .employee-a4-print, .employee-a4-print * { visibility: visible !important; }
          .employee-a4-print {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            background: white !important;
            color: #0f172a !important;
            overflow: visible !important;
          }
          .employee-a4-page {
            width: 210mm !important;
            min-height: 297mm !important;
            padding: 14mm !important;
            page-break-after: always !important;
            background: white !important;
          }
          .employee-a4-page:last-child { page-break-after: auto !important; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 0; }
        }
        @media screen {
          .employee-a4-print { display: none; }
        }
      `}</style>

      <div className="relative z-[100000] mx-auto flex max-h-[94vh] max-w-[1680px] flex-col overflow-hidden rounded-[40px] border border-white/80 bg-white shadow-[0_60px_220px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/70 print:hidden">
        <div className="no-print border-b border-slate-100 bg-gradient-to-r from-white via-violet-50/80 to-cyan-50/80 px-6 py-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">Employee 360</span>
                <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Live synced dossier</span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">{ref}</span>
              </div>
              <h2 style={{ color: "#020617" }} className="mt-3 truncate text-3xl font-black tracking-[-0.04em] !text-slate-950 xl:text-5xl">{name}</h2>
              <p className="mt-1 text-sm font-black text-slate-500">{role} · {department} · {city} · dossier A4 synchronisé</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:flex xl:flex-wrap xl:justify-end">
              <button onClick={() => setEditing((v) => !v)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50">
                {editing ? 'Annuler édition' : 'Modifier dossier'}
              </button>

              {editing ? (
                <button disabled={saving} onClick={save} className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-50">
                  <Save className="mr-2 inline h-4 w-4" />
                  {saving ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              ) : null}

              <button onClick={printDossier} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg transition hover:bg-slate-800">
                <Printer className="mr-2 inline h-4 w-4" />
                Imprimer A4 McKinsey
              </button>

              <button disabled={saving} onClick={deletePermanently} className={confirmDelete ? 'rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-200' : 'rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 shadow-sm transition hover:bg-rose-100'}>
                <Trash2 className="mr-2 inline h-4 w-4" />
                {confirmDelete ? 'Confirmer suppression' : 'Supprimer définitivement'}
              </button>

              <button onClick={onClose} className="grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="no-print mx-6 mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-700">
            <AlertTriangle className="mr-2 inline h-4 w-4" />
            {error}
          </div>
        ) : null}

        <div className="overflow-auto bg-slate-50/70 p-6">
          <header className="rounded-[34px] border border-white/80 bg-gradient-to-br from-white via-violet-50/70 to-cyan-50/70 p-6 shadow-xl shadow-slate-200/70">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.34em] text-violet-700">AngelCare HR Command OS</p>
                <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">Dossier collaborateur 360</h1>
                <p className="mt-2 text-lg font-black text-slate-600">{name}</p>
                <p className="mt-1 text-sm font-bold text-slate-500">{role} · {department} · {city}</p>
              </div>

              <div className="rounded-[30px] bg-slate-950 px-6 py-5 text-right text-white shadow-2xl shadow-slate-300">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Référence dossier</p>
                <p className="mt-2 text-xl font-black">{ref}</p>
                <p className="mt-3 text-xs font-bold text-white/55">Édité le {today()}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              <MetricCard label="Readiness" value={pct(ready)} subtitle="Qualité globale du profil" tone="border-emerald-100 bg-emerald-50 text-emerald-700" icon={BadgeCheck} />
              <MetricCard label="Risque" value={pct(risk)} subtitle="Exposition opérationnelle" tone="border-rose-100 bg-rose-50 text-rose-700" icon={ShieldCheck} />
              <MetricCard label="Evidence" value={`${evidence}/8`} subtitle={`${pct(evidencePct)} de couverture sync`} tone="border-cyan-100 bg-cyan-50 text-cyan-700" icon={FileBadge2} />
              <MetricCard label="Statut RH" value={status} subtitle="État employé live" tone={`border-emerald-100 ${statusTone(status)}`} icon={CheckCircle2} />
            </div>
          </header>

          <section className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <SectionCard title="Identité et contact" subtitle="Informations personnelles, coordonnées et identité RH." icon={UserRound}>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Prénom" value={firstName} editing={editing} onChange={(v) => patch('first_name', v)} />
                <Field label="Nom" value={lastName} editing={editing} onChange={(v) => patch('last_name', v)} />
                <Field label="Nom complet" value={name} editing={editing} onChange={(v) => patch('full_name', v)} />
                <Field label="Email" value={email} editing={editing} onChange={(v) => patch('email', v)} />
                <Field label="Téléphone" value={phone} editing={editing} onChange={(v) => patch('phone', v)} />
                <Field label="Nationalité" value={value(form, ['nationality'], 'Moroccan')} editing={editing} onChange={(v) => patch('nationality', v)} />
                <Field label="Date de naissance" value={value(form, ['date_of_birth', 'birth_date'])} editing={editing} onChange={(v) => patch('date_of_birth', v)} type="date" />
                <Field label="Adresse" value={value(form, ['address'])} editing={editing} onChange={(v) => patch('address', v)} />
              </div>
            </SectionCard>

            <SectionCard title="Affectation professionnelle" subtitle="Rôle, département, ville et statut opérationnel." icon={BriefcaseBusiness}>
              <div className="grid gap-3">
                <Field label="Fonction" value={role} editing={editing} onChange={(v) => patch('position', v)} />
                <Field label="Département" value={department} editing={editing} onChange={(v) => patch('department', v)} />
                <Field label="Ville / site" value={city} editing={editing} onChange={(v) => patch('city', v)} />
                <Field label="Statut employé" value={status} editing={editing} onChange={(v) => patch('employment_status', v)} />
              </div>
            </SectionCard>
          </section>

          <section className="mt-6 grid gap-5 xl:grid-cols-3">
            <SectionCard title="Sync opérationnel" subtitle="Couverture des objets RH connectés." icon={Activity}>
              <div className="space-y-3">
                {syncItems.map(([label, , count]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-black text-slate-700">{label}</span>
                    <span className={Number(count || 0) > 0 ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100' : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500'}>
                      {Number(count || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Contrôle risque" subtitle="Lecture synthétique des signaux de conformité." icon={ShieldCheck}>
              <p className="text-sm font-bold leading-6 text-slate-600">
                Ce score combine les signaux de complétude du profil, documents, contrat, présence,
                paie, formation et performance. Les dossiers à risque doivent être revus avant clôture RH.
              </p>
              <div className="mt-5 h-3 rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: pct(risk) }} />
              </div>
              <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-black text-rose-800">
                Priorité : compléter les preuves manquantes, vérifier contrat / paie et réduire les zones de risque.
              </div>
            </SectionCard>

            <SectionCard title="Synthèse dossier" subtitle="Contact, référence et résumé opérationnel." icon={FileText}>
              <div className="space-y-3 text-sm font-bold text-slate-700">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-violet-500" />{email || 'Email non renseigné'}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-500" />{phone || 'Téléphone non renseigné'}</div>
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-cyan-500" />{department}</div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-500" />{city}</div>
                <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-500" />Dossier généré le {today()}</div>
                <div className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-rose-500" />Référence {ref}</div>
              </div>
            </SectionCard>
          </section>

          <EmployeeMegaHRWorkspace
            employee={employee}
            employeeId={id}
            employeeName={name}
            onSaved={onSaved}
          />
        </div>
      </div>

      <div className="employee-a4-print">
        <section className="employee-a4-page">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, borderBottom: '3px solid #0f172a', paddingBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 4, fontWeight: 900, color: '#2563eb', textTransform: 'uppercase' }}>AngelCare HR Command OS</div>
              <h1 style={{ margin: '10px 0 0', fontSize: 34, lineHeight: 1, letterSpacing: -1.5 }}>Dossier collaborateur 360</h1>
              <div style={{ marginTop: 10, fontSize: 18, fontWeight: 900 }}>{name}</div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#475569', fontWeight: 700 }}>{role} · {department} · {city}</div>
            </div>
            <div style={{ background: '#0f172a', color: 'white', borderRadius: 22, padding: '16px 20px', textAlign: 'right', minWidth: 230 }}>
              <div style={{ fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', opacity: 0.55, fontWeight: 900 }}>Référence dossier</div>
              <div style={{ marginTop: 8, fontSize: 17, fontWeight: 900 }}>{ref}</div>
              <div style={{ marginTop: 8, fontSize: 10, opacity: 0.65, fontWeight: 700 }}>Édité le {today()}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 20 }}>
            {[
              ['Readiness', pct(ready), 'Qualité profil'],
              ['Risque', pct(risk), 'Exposition RH'],
              ['Evidence', `${evidence}/8`, `${pct(evidencePct)} sync`],
              ['Statut', status, 'État live'],
            ].map(([a, b, c]) => (
              <div key={a} style={{ border: '1px solid #e2e8f0', borderRadius: 18, padding: 14, background: '#f8fafc' }}>
                <div style={{ fontSize: 9, letterSpacing: 2.4, textTransform: 'uppercase', color: '#64748b', fontWeight: 900 }}>{a}</div>
                <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900 }}>{b}</div>
                <div style={{ marginTop: 4, fontSize: 10, color: '#64748b', fontWeight: 700 }}>{c}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 14, marginTop: 18 }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 20, padding: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Identité et contact</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                {[
                  ['Prénom', firstName],
                  ['Nom', lastName],
                  ['Nom complet', name],
                  ['Email', email],
                  ['Téléphone', phone],
                  ['Nationalité', value(form, ['nationality'], 'Moroccan')],
                  ['Date naissance', value(form, ['date_of_birth', 'birth_date']) || 'Non renseigné'],
                  ['Adresse', value(form, ['address']) || 'Non renseigné'],
                ].map(([a, b]) => (
                  <div key={a} style={{ background: '#f8fafc', borderRadius: 12, padding: 10 }}>
                    <div style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', fontWeight: 900 }}>{a}</div>
                    <div style={{ marginTop: 5, fontSize: 11, fontWeight: 800 }}>{b || 'Non renseigné'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 20, padding: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Affectation professionnelle</h2>
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                {[
                  ['Fonction', role],
                  ['Département', department],
                  ['Ville / site', city],
                  ['Statut employé', status],
                ].map(([a, b]) => (
                  <div key={a} style={{ background: '#f8fafc', borderRadius: 12, padding: 10 }}>
                    <div style={{ fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: '#64748b', fontWeight: 900 }}>{a}</div>
                    <div style={{ marginTop: 5, fontSize: 11, fontWeight: 800 }}>{b || 'Non renseigné'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 20, padding: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Sync opérationnel</h2>
              <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                {syncItems.map(([label, , count]) => (
                  <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', borderRadius: 12, padding: '8px 10px', fontSize: 11, fontWeight: 800 }}>
                    <span>{label}</span>
                    <span>{Number(count || 0)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: 20, padding: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Recommandations RH</h2>
              <div style={{ marginTop: 12, display: 'grid', gap: 10, fontSize: 11, lineHeight: 1.55, fontWeight: 700 }}>
                <div>1. Compléter les champs manquants et vérifier l’alignement fonction / département.</div>
                <div>2. Valider les preuves opérationnelles : contrat, documents, présence, paie, formation.</div>
                <div>3. Maintenir le dossier prêt pour audit interne, reporting RH et suivi managérial.</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, border: '1px solid #e2e8f0', borderRadius: 20, padding: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Synthèse exécutive</h2>
            <p style={{ marginTop: 10, fontSize: 11, lineHeight: 1.7, color: '#334155', fontWeight: 700 }}>
              Ce dossier présente une vue structurée et synchronisée du collaborateur, destinée au suivi RH,
              à la préparation d’audit, au contrôle de conformité, à la coordination managériale et au reporting interne.
              Les indicateurs sont calculés à partir des données disponibles dans le module Employees Command Center.
            </p>
          </div>
        </section>

        <section className="employee-a4-page">
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 4, fontWeight: 900, color: '#2563eb', textTransform: 'uppercase' }}>AngelCare HR Command OS</div>
              <h1 style={{ margin: '8px 0 0', fontSize: 28, letterSpacing: -1 }}>Annexe données live</h1>
            </div>
            <div style={{ fontWeight: 900, fontSize: 13 }}>{ref}</div>
          </div>

          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {liveRows.slice(0, 34).map(([key, val]) => (
              <div key={key} style={{ border: '1px solid #e2e8f0', borderRadius: 14, padding: 10, background: '#f8fafc' }}>
                <div style={{ fontSize: 8, letterSpacing: 1.8, textTransform: 'uppercase', color: '#64748b', fontWeight: 900 }}>{key.replaceAll('_', ' ')}</div>
                <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 800, wordBreak: 'break-word' }}>{String(val)}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
