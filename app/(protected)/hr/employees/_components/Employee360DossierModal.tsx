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

  const storageKey = `angelcare-employee-hr-workspace-${employeeId || value(employee, ['email'], 'unknown')}`

  const categories = [
    {
      key: 'payments',
      label: 'Paie & paiements',
      subtitle: 'Primes, avances, régularisations, notes de frais',
      color: 'violet',
      synced: Number(employee?.__sync?.payroll || 0),
      templates: [
        'Préparer la validation de paie mensuelle',
        'Ajouter une avance exceptionnelle',
        'Contrôler les éléments variables',
        'Créer une régularisation de paiement',
        'Vérifier prime / bonus collaborateur',
      ],
    },
    {
      key: 'leave',
      label: 'Congés & absences',
      subtitle: 'Demandes, justificatifs, soldes, absences',
      color: 'amber',
      synced: Number(employee?.__sync?.leave || 0),
      templates: [
        'Créer une demande de congé',
        'Demander un justificatif d’absence',
        'Valider une absence exceptionnelle',
        'Planifier un retour de congé',
        'Contrôler solde et calendrier',
      ],
    },
    {
      key: 'attendance',
      label: 'Présence',
      subtitle: 'Pointage, retards, anomalies, assiduité',
      color: 'emerald',
      synced: Number(employee?.__sync?.attendance || 0),
      templates: [
        'Régulariser une anomalie de pointage',
        'Contrôler les retards récurrents',
        'Valider présence exceptionnelle',
        'Analyser l’assiduité hebdomadaire',
        'Créer un suivi disciplinaire présence',
      ],
    },
    {
      key: 'schedule',
      label: 'Planning',
      subtitle: 'Horaires, shifts, roster, rotations',
      color: 'cyan',
      synced: Number(employee?.__sync?.roster || 0),
      templates: [
        'Ajouter un shift exceptionnel',
        'Modifier planning hebdomadaire',
        'Dupliquer planning existant',
        'Préparer remplacement opérationnel',
        'Valider rotation équipe',
      ],
    },
    {
      key: 'documents',
      label: 'Documents',
      subtitle: 'Pièces RH, justificatifs, fichiers obligatoires',
      color: 'blue',
      synced: Number(employee?.__sync?.documents || 0),
      templates: [
        'Demander document manquant',
        'Ajouter pièce au dossier RH',
        'Contrôler validité document',
        'Relancer signature ou justificatif',
        'Classer document validé',
      ],
    },
    {
      key: 'contracts',
      label: 'Contrats',
      subtitle: 'Contrat, avenant, période, statut contractuel',
      color: 'rose',
      synced: Number(employee?.__sync?.contracts || 0),
      templates: [
        'Créer suivi de contrat',
        'Préparer avenant',
        'Contrôler date de fin',
        'Valider statut contractuel',
        'Planifier renouvellement',
      ],
    },
    {
      key: 'performance',
      label: 'Performance',
      subtitle: 'Évaluation, objectifs, feedback, coaching',
      color: 'fuchsia',
      synced: Number(employee?.__sync?.performance || 0),
      templates: [
        'Créer revue de performance',
        'Ajouter objectif individuel',
        'Planifier point manager',
        'Créer plan d’amélioration',
        'Valider feedback trimestriel',
      ],
    },
    {
      key: 'training',
      label: 'Formation',
      subtitle: 'Parcours, compétences, onboarding, certification',
      color: 'teal',
      synced: Number(employee?.__sync?.training || 0),
      templates: [
        'Assigner formation obligatoire',
        'Créer parcours de montée en compétence',
        'Valider complétion de module',
        'Planifier coaching ciblé',
        'Préparer certification interne',
      ],
    },
  ]

  const activeCategory = categories.find((category) => category.key === active) || categories[0]
  const categoryActions = actions.filter((action) => action.category === active)
  const selectedAction = actions.find((action) => action.id === selectedActionId) || categoryActions[0] || null

  useEffect(() => {
    const existing = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(storageKey) || '[]')
      } catch {
        return []
      }
    })()

    if (Array.isArray(existing) && existing.length) {
      setActions(existing)
      setSelectedActionId(existing[0]?.id || '')
      return
    }

    const seed = categories.flatMap((category) =>
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
      })),
    )

    setActions(seed)
    setSelectedActionId(seed[0]?.id || '')
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(seed))
    } catch {
      // ignore local persistence failure
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId])

  function persist(next: EmployeeHRAction[], message = 'Workspace RH sauvegardé.') {
    setActions(next)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next))
    } catch {
      // ignore local persistence failure
    }
    setWorkspaceMessage(message)
  }

  async function saveToProduction(nextActions = actions) {
    if (!employeeId) {
      setWorkspaceMessage('Identifiant employé manquant. Sauvegarde locale uniquement.')
      return
    }

    try {
      setSavingWorkspace(true)
      setWorkspaceMessage('Sauvegarde du workspace RH en cours...')

      const response = await fetch(`/api/hr/employees?id=${encodeURIComponent(employeeId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            ...(employee?.metadata || {}),
            hr_management_workspace: nextActions,
            hr_management_workspace_updated_at: new Date().toISOString(),
          },
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        setWorkspaceMessage('Sauvegarde locale effectuée. API employé non configurée pour metadata workspace.')
        return
      }

      setWorkspaceMessage('Workspace RH sauvegardé dans le dossier employé.')
      onSaved?.()
    } catch {
      setWorkspaceMessage('Sauvegarde locale effectuée. Synchronisation production à revoir côté API.')
    } finally {
      setSavingWorkspace(false)
    }
  }

  function createAction(title?: string) {
    const next: EmployeeHRAction = {
      id: makeActionId(),
      category: active,
      title: title || `Nouvelle action ${activeCategory.label}`,
      owner: 'HR AngelCare',
      status: 'À traiter',
      priority: activeCategory.synced > 0 ? 'Normale' : 'Haute',
      due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      amount: '',
      notes: `Nouvelle action ${activeCategory.label} pour ${employeeName}.`,
    }
    const nextActions = [next, ...actions]
    persist(nextActions, 'Nouvelle action créée.')
    setSelectedActionId(next.id)
  }

  function updateAction(id: string, patch: Partial<EmployeeHRAction>) {
    const next = actions.map((action) => (action.id === id ? { ...action, ...patch } : action))
    persist(next, 'Action mise à jour.')
  }

  function duplicateAction(action: EmployeeHRAction) {
    const copy = {
      ...action,
      id: makeActionId(),
      title: `${action.title} — copie`,
      status: 'À traiter',
      due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    }
    const next = [copy, ...actions]
    persist(next, 'Action dupliquée.')
    setSelectedActionId(copy.id)
  }

  function deleteAction(actionId: string) {
    const next = actions.filter((action) => action.id !== actionId)
    persist(next, 'Action supprimée.')
    setSelectedActionId(next.find((action) => action.category === active)?.id || next[0]?.id || '')
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

  return (
    <section className="mt-6 rounded-[34px] border border-white/80 bg-white p-5 shadow-xl shadow-slate-200/70">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-violet-700">Employee HR file workspace</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Workspace opérationnel RH collaborateur</h3>
          <p className="mt-2 max-w-4xl text-sm font-bold leading-6 text-slate-500">
            Gestion directe des paiements, congés, présence, planning, documents, contrats, performance et formation.
            Chaque action est contextualisée, éditable, duplicable, supprimable et sauvegardée par collaborateur.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[520px]">
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Actions</p>
            <p className="mt-1 text-2xl font-black">{actions.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sync</p>
            <p className="mt-1 text-2xl font-black">{activeCategory.synced}</p>
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

      <div className="mt-5 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_380px]">
        <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-3">
          <div className="grid gap-2">
            {categories.map((category) => {
              const count = actions.filter((action) => action.category === category.key).length
              const isActive = category.key === active
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => {
                    setActive(category.key)
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
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-700">{count}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="rounded-[28px] border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Catégorie active</p>
              <h4 className="mt-1 text-2xl font-black text-slate-950">{activeCategory.label}</h4>
              <p className="mt-1 text-sm font-bold text-slate-500">{activeCategory.subtitle}</p>
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
                + Action libre
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {categoryActions.length ? categoryActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => setSelectedActionId(action.id)}
                className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${
                  selectedAction?.id === action.id ? 'border-violet-200 bg-violet-50' : 'border-slate-200 bg-slate-50/80'
                }`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-base font-black text-slate-950">{action.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{action.owner} · échéance {action.due_date || 'non définie'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-black">
                    <span className="rounded-full bg-white px-3 py-1 text-slate-700 ring-1 ring-slate-100">{action.status}</span>
                    <span className={action.priority === 'Haute' ? 'rounded-full bg-rose-50 px-3 py-1 text-rose-700 ring-1 ring-rose-100' : 'rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100'}>{action.priority}</span>
                    {action.amount ? <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-amber-100">{action.amount}</span> : null}
                  </div>
                </div>
              </button>
            )) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-lg font-black text-slate-950">Aucune action dans cette catégorie</p>
                <p className="mt-2 text-sm font-bold text-slate-500">Créez une action libre ou utilisez un modèle préintégré.</p>
              </div>
            )}
          </div>
        </main>

        <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Fiche action</p>
              <h4 className="mt-1 text-xl font-black text-slate-950">{selectedAction ? 'Modifier action' : 'Aucune action'}</h4>
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
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Date</span>
                  <input type="date" value={selectedAction.due_date} onChange={(event) => updateAction(selectedAction.id, { due_date: event.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none" />
                </label>
                <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Montant</span>
                  <input value={selectedAction.amount} onChange={(event) => updateAction(selectedAction.id, { amount: event.target.value })} placeholder="Ex: 1500 MAD" className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none" />
                </label>
              </div>

              <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Notes</span>
                <textarea value={selectedAction.notes} onChange={(event) => updateAction(selectedAction.id, { notes: event.target.value })} rows={5} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:ring-4 focus:ring-violet-100" />
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => saveToProduction(actions)} className="rounded-2xl bg-violet-600 px-3 py-2 text-xs font-black text-white">Save</button>
                <button type="button" onClick={() => duplicateAction(selectedAction)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">Duplicate</button>
                <button type="button" onClick={() => deleteAction(selectedAction.id)} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">Delete</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-500">
              Sélectionnez ou créez une action.
            </div>
          )}
        </aside>
      </div>
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
    <div className="fixed inset-0 z-[99999] isolate bg-slate-950/70 p-4 backdrop-blur-xl print:static print:bg-white print:p-0">
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
              <h2 className="mt-3 truncate text-3xl font-black tracking-[-0.04em] text-slate-950 xl:text-5xl">{name}</h2>
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
