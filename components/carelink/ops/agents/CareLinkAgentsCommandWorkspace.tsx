'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  Archive,
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  Filter,
  History,
  IdCard,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react'

type AnyRecord = Record<string, any>

const tabs = [
  { key: 'overview', label: 'Vue 360°', icon: Activity },
  { key: 'identity', label: 'Identité', icon: IdCard },
  { key: 'missions', label: 'Missions', icon: BriefcaseBusiness },
  { key: 'payments', label: 'Paiements', icon: CreditCard },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'compliance', label: 'Conformité', icon: ShieldCheck },
  { key: 'messages', label: 'Dispatch', icon: MessageSquare },
  { key: 'alerts', label: 'Alertes', icon: AlertTriangle },
  { key: 'mobile', label: 'Mobile Sync', icon: Bell },
  { key: 'history', label: 'Historique', icon: History },
  { key: 'print', label: 'Rapports', icon: Printer },
]

const emptyForm = {
  fullName: '',
  phone: '',
  city: '',
  zone: '',
  status: 'available',
  skillsSummary: '',
  skillTags: '',
  languageTags: '',
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function text(value: unknown, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function number(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function money(value: unknown) {
  return `${number(value).toLocaleString('fr-MA')} DH`
}

function list(value: unknown) {
  return Array.isArray(value) ? value : []
}

function statusTone(status: string) {
  const normalized = status.toLowerCase()
  if (['available', 'ready', 'active'].includes(normalized)) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (['blocked', 'archived', 'suspended'].includes(normalized)) return 'bg-rose-50 text-rose-700 border-rose-100'
  if (['in_mission', 'busy'].includes(normalized)) return 'bg-sky-50 text-sky-700 border-sky-100'
  return 'bg-amber-50 text-amber-700 border-amber-100'
}

function Metric({ label, value, helper, icon }: { label: string; value: string | number; helper?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p>
          {helper ? <p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p> : null}
        </div>
        {icon ? <div className="rounded-2xl bg-slate-50 p-3 text-slate-600">{icon}</div> : null}
      </div>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  tone = 'slate',
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  tone?: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose'
  disabled?: boolean
}) {
  const tones = {
    slate: 'bg-slate-950 text-white hover:bg-slate-800',
    blue: 'bg-blue-600 text-white hover:bg-blue-700',
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
    amber: 'bg-amber-500 text-white hover:bg-amber-600',
    rose: 'bg-rose-600 text-white hover:bg-rose-700',
  }
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx('inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition active:scale-[0.99]', tones[tone], disabled && 'opacity-60')}
    >
      {children}
    </button>
  )
}

function GhostButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function Section({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <p className="font-black text-slate-800">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">{body}</p>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  )
}

export function CareLinkAgentsCommandWorkspace() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [payload, setPayload] = useState<AnyRecord>({ agents: [], summary: {} })
  const [selectedAgent, setSelectedAgent] = useState<AnyRecord | null>(null)
  const [dossier, setDossier] = useState<AnyRecord | null>(null)
  const [dossierLoading, setDossierLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [actionMessage, setActionMessage] = useState('')
  const [actionTitle, setActionTitle] = useState('')
  const [actionType, setActionType] = useState<'notify' | 'message' | 'alert' | 'document' | 'training' | 'readiness' | null>(null)

  async function loadAgents() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/carelink/ops/agents', { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Impossible de charger les agents.')
      setPayload(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement agents.')
    } finally {
      setLoading(false)
    }
  }

  async function openDossier(agent: AnyRecord) {
    setSelectedAgent(agent)
    setActiveTab('overview')
    setDossierLoading(true)
    setDossier(null)
    try {
      const response = await fetch(`/api/carelink/ops/agents/${agent.id}`, { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Impossible de charger le dossier agent.')
      setDossier(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur dossier agent.')
    } finally {
      setDossierLoading(false)
    }
  }

  async function submitCreate() {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/carelink/ops/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...form,
          skillTags: form.skillTags.split(',').map((item) => item.trim()).filter(Boolean),
          languageTags: form.languageTags.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      })
      const json = await response.json()
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Création agent impossible.')
      setCreateOpen(false)
      setForm(emptyForm)
      await loadAgents()
      await openDossier(json.agent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création agent impossible.')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(agent: AnyRecord) {
    setSelectedAgent(agent)
    setForm({
      fullName: text(agent.fullName, ''),
      phone: text(agent.phone, ''),
      city: text(agent.city, ''),
      zone: text(agent.zone, ''),
      status: text(agent.status, 'available'),
      skillsSummary: text(agent.skillsSummary, ''),
      skillTags: list(agent.skills).join(', '),
      languageTags: list(agent.languages).join(', '),
    })
    setEditOpen(true)
  }

  async function submitEdit() {
    if (!selectedAgent?.id) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/carelink/ops/agents/${selectedAgent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...form,
          skillTags: form.skillTags.split(',').map((item) => item.trim()).filter(Boolean),
          languageTags: form.languageTags.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      })
      const json = await response.json()
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Modification agent impossible.')
      setEditOpen(false)
      await loadAgents()
      await openDossier(json.agent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modification agent impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function archiveAgent(agent: AnyRecord) {
    const ok = window.confirm(`Archiver ${agent.fullName} ? L’agent ne sera plus proposé dans les opérations actives.`)
    if (!ok) return
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/carelink/ops/agents/${agent.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ reason: 'Archived from CareLink Ops Agents workspace' }),
      })
      const json = await response.json()
      if (!response.ok || !json?.ok) throw new Error(json?.error || 'Archivage impossible.')
      setSelectedAgent(null)
      setDossier(null)
      await loadAgents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archivage impossible.')
    } finally {
      setSaving(false)
    }
  }

  function openAction(type: typeof actionType, agent: AnyRecord) {
    setSelectedAgent(agent)
    setActionType(type)
    setActionTitle('')
    setActionMessage('')
  }

  async function submitAction() {
    if (!selectedAgent?.id || !actionType) return
    setSaving(true)
    setError(null)

    const endpointByType: Record<string, string> = {
      notify: `/api/carelink/ops/agents/${selectedAgent.id}/notify`,
      message: `/api/carelink/ops/agents/${selectedAgent.id}/dispatch-message`,
      alert: `/api/carelink/ops/agents/${selectedAgent.id}/create-alert`,
      document: `/api/carelink/ops/agents/${selectedAgent.id}/request-document`,
      training: `/api/carelink/ops/agents/${selectedAgent.id}/request-training`,
      readiness: `/api/carelink/ops/agents/${selectedAgent.id}/readiness`,
    }

    try {
      const response = await fetch(endpointByType[actionType], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          title: actionTitle || undefined,
          subject: actionTitle || undefined,
          body: actionMessage || undefined,
          message: actionMessage || undefined,
          priority: actionType === 'alert' ? 'high' : 'normal',
          status: actionType === 'readiness' ? 'available' : undefined,
          note: actionMessage || undefined,
        }),
      })
      const json = await response.json()
      if (!response.ok || json?.ok === false) throw new Error(json?.error || 'Action impossible.')
      setActionType(null)
      await loadAgents()
      if (selectedAgent) await openDossier(selectedAgent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible.')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadAgents()
  }, [])

  const agents = list(payload.agents || payload.records)

  const filteredAgents = useMemo(() => {
    const q = query.trim().toLowerCase()
    return agents.filter((agent) => {
      const matchesQuery = !q || [agent.fullName, agent.phone, agent.city, agent.zone, agent.skillsSummary, ...(list(agent.skills))].join(' ').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || String(agent.status).toLowerCase() === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [agents, query, statusFilter])

  const summary = payload.summary || {}

  return (
    <main className="text-slate-950">
      <div className="w-full space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-blue-600">CareLink Ops · Workforce Command</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Agents Command Center</h1>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-500">
                Gestion complète des caregivers, agents terrain, readiness, missions, documents, paiements, alertes, messages dispatch et synchronisation mobile.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <GhostButton onClick={loadAgents}><RefreshCw size={16} /> Refresh</GhostButton>
              <ActionButton onClick={() => setCreateOpen(true)} tone="blue"><Plus size={16} /> Créer agent</ActionButton>
            </div>
          </div>
        </header>

        {error ? (
          <div className="mt-5 rounded-3xl border border-rose-100 bg-rose-50 p-4 text-sm font-black text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Agents total" value={summary.total || 0} helper="Caregivers actifs dans le référentiel" icon={<Users size={20} />} />
          <Metric label="Disponibles" value={summary.available || 0} helper="Prêts pour assignation terrain" icon={<CheckCircle2 size={20} />} />
          <Metric label="En mission" value={summary.inMission || 0} helper="Agents avec missions actives" icon={<Activity size={20} />} />
          <Metric label="Risques ouverts" value={(summary.alertsOpen || 0) + (summary.documentsExpired || 0)} helper="Alertes, documents expirés, blocages" icon={<AlertTriangle size={20} />} />
        </section>

        <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search agents, phone, city, zone, skill..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="bg-transparent text-sm font-black text-slate-700 outline-none"
              >
                <option value="all">Tous statuts</option>
                <option value="available">Disponible</option>
                <option value="busy">Occupé</option>
                <option value="blocked">Bloqué</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Section
            title="Live Agents Directory"
            subtitle="Table opérationnelle connectée au référentiel caregivers et aux résumés missions/mobile."
            action={<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{filteredAgents.length} affichés</span>}
          >
            {loading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={28} />
              </div>
            ) : filteredAgents.length ? (
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
                <table className="w-full min-w-[980px] border-collapse bg-white text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.24em] text-slate-500">
                    <tr>
                      <th className="px-4 py-4">Agent</th>
                      <th className="px-4 py-4">Zone</th>
                      <th className="px-4 py-4">Readiness</th>
                      <th className="px-4 py-4">Missions</th>
                      <th className="px-4 py-4">Risques</th>
                      <th className="px-4 py-4">Paiements</th>
                      <th className="px-4 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map((agent) => (
                      <tr key={agent.id} className="border-t border-slate-100 align-top hover:bg-slate-50/70">
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white">
                              {text(agent.fullName, 'A').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-slate-950">{agent.fullName}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">{agent.phone || 'No phone'} · #{agent.id}</p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {list(agent.skills).slice(0, 4).map((skill) => (
                                  <span key={skill} className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">{skill}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-black text-slate-800">{agent.city}</p>
                          <p className="text-xs font-semibold text-slate-500">{agent.zone}</p>
                          <span className={cx('mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase', statusTone(String(agent.status)))}>
                            {agent.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xl font-black text-slate-950">{agent.readinessScore}%</p>
                          <p className="text-xs font-semibold text-slate-500">Reliability {agent.reliabilityScore}%</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-black text-slate-950">{agent.summary?.activeMissions || 0} active</p>
                          <p className="text-xs font-semibold text-slate-500">{agent.summary?.totalMissions || 0} total</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-black text-slate-950">{agent.summary?.openAlerts || 0} alertes</p>
                          <p className="text-xs font-semibold text-slate-500">{agent.summary?.expiredDocuments || 0} docs expirés</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-black text-slate-950">{money(agent.summary?.allowanceTotal)}</p>
                          <p className="text-xs font-semibold text-slate-500">{agent.summary?.paymentDisputes || 0} litiges</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <GhostButton onClick={() => openDossier(agent)}>Dossier <ChevronRight size={14} /></GhostButton>
                            <GhostButton onClick={() => openEdit(agent)}>Edit</GhostButton>
                            <button onClick={() => archiveAgent(agent)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="Aucun agent actif affiché"
                body="Le centre agents reste prêt pour créer des caregivers, gérer leurs dossiers, leurs missions, documents, paiements, alertes et synchronisation mobile."
              />
            )}
          </Section>

          <Section title="Action Center" subtitle="Commandes rapides agents, dispatch, readiness et conformité.">
            <div className="grid gap-3">
              <ActionButton onClick={() => setCreateOpen(true)} tone="blue"><Plus size={16} /> Créer un agent</ActionButton>
              <GhostButton onClick={loadAgents}><RefreshCw size={16} /> Synchroniser le référentiel</GhostButton>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-900">Capacités actives</p>
                <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600">
                  <p>✓ Dossier agent complet</p>
                  <p>✓ Missions, paiements, documents</p>
                  <p>✓ Notifications, alertes, dispatch</p>
                  <p>✓ Readiness et mobile sync</p>
                  <p>✓ Impression rapport agent</p>
                </div>
              </div>
            </div>
          </Section>
        </section>
      </div>

      {createOpen ? (
        <AgentFormModal
          title="Créer un agent CareLink"
          form={form}
          setForm={setForm}
          saving={saving}
          close={() => setCreateOpen(false)}
          submit={submitCreate}
        />
      ) : null}

      {editOpen ? (
        <AgentFormModal
          title={`Modifier ${selectedAgent?.fullName || 'agent'}`}
          form={form}
          setForm={setForm}
          saving={saving}
          close={() => setEditOpen(false)}
          submit={submitEdit}
        />
      ) : null}

      {selectedAgent ? (
        <AgentDossierModal
          agent={selectedAgent}
          dossier={dossier}
          loading={dossierLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          close={() => {
            setSelectedAgent(null)
            setDossier(null)
          }}
          openEdit={() => openEdit(selectedAgent)}
          archiveAgent={() => archiveAgent(selectedAgent)}
          openAction={openAction}
        />
      ) : null}

      {actionType && selectedAgent ? (
        <ActionModal
          type={actionType}
          agent={selectedAgent}
          title={actionTitle}
          message={actionMessage}
          setTitle={setActionTitle}
          setMessage={setActionMessage}
          saving={saving}
          close={() => setActionType(null)}
          submit={submitAction}
        />
      ) : null}
    </main>
  )
}

function AgentFormModal({
  title,
  form,
  setForm,
  saving,
  close,
  submit,
}: {
  title: string
  form: typeof emptyForm
  setForm: (form: typeof emptyForm) => void
  saving: boolean
  close: () => void
  submit: () => void
}) {
  const [section, setSection] = useState('identity')
  const update = (key: keyof typeof emptyForm, value: string) => setForm({ ...form, [key]: value })

  const sections = [
    { key: 'identity', label: 'Identity', helper: 'Core agent profile', icon: IdCard },
    { key: 'coverage', label: 'Coverage', helper: 'City, zones, availability', icon: CalendarDays },
    { key: 'skills', label: 'Skills & Services', helper: 'Eligibility and languages', icon: ShieldCheck },
    { key: 'operations', label: 'Operations', helper: 'Missions, readiness, mobile', icon: Activity },
    { key: 'payments', label: 'Payments', helper: 'Allowances and finance', icon: CreditCard },
    { key: 'documents', label: 'Documents', helper: 'Compliance readiness', icon: FileText },
    { key: 'review', label: 'Review', helper: 'Confirm and create', icon: BadgeCheck },
  ]

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1500px] overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">Agent enterprise record</p>
              <h3 className="mt-2 text-3xl font-black text-slate-950">{sections.find((item) => item.key === section)?.label}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Create or update the live caregiver record used by missions, dispatch, mobile, readiness and payment workflows.
              </p>
            </div>
            <button onClick={close} className="rounded-2xl bg-slate-100 p-3 text-slate-600">
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-6">
            {section === 'identity' ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <Section title="Core identity" subtitle="Primary caregiver information used by Ops, Dispatch and Mobile.">
                  <div className="grid gap-4">
                    <Field label="Nom complet" value={form.fullName} onChange={(value) => update('fullName', value)} />
                    <Field label="Téléphone" value={form.phone} onChange={(value) => update('phone', value)} />
                    <Field label="Statut opérationnel" value={form.status} onChange={(value) => update('status', value)} />
                  </div>
                </Section>
                <Section title="Operational identity preview" subtitle="How this agent will appear inside CareLink Ops.">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-lg font-black text-white">
                        {text(form.fullName || 'AG', 'AG').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-950">{form.fullName || 'Nouvel agent'}</p>
                        <p className="text-sm font-bold text-slate-500">{form.phone || 'Téléphone à compléter'}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Info label="Status" value={form.status || 'available'} />
                      <Info label="Mobile" value="Ready after creation" />
                    </div>
                  </div>
                </Section>
              </div>
            ) : null}

            {section === 'coverage' ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <Section title="Coverage & availability" subtitle="City, operational zone and field assignment coverage.">
                  <div className="grid gap-4">
                    <Field label="Ville" value={form.city} onChange={(value) => update('city', value)} />
                    <Field label="Zone" value={form.zone} onChange={(value) => update('zone', value)} />
                  </div>
                </Section>
                <Section title="Coverage usage" subtitle="These fields will be used by matching, dispatch and mission assignment.">
                  <div className="grid gap-3">
                    <Info label="Mission matching" value="City + zone + status" />
                    <Info label="Dispatch board" value="Agent pool and availability" />
                    <Info label="Mobile app" value="Agent profile and assigned missions" />
                  </div>
                </Section>
              </div>
            ) : null}

            {section === 'skills' ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <Section title="Skills & services" subtitle="Service eligibility tags used by AngelCare mission matching.">
                  <div className="grid gap-4">
                    <Field label="Compétences tags séparés par virgule" value={form.skillTags} onChange={(value) => update('skillTags', value)} />
                    <Field label="Langues séparées par virgule" value={form.languageTags} onChange={(value) => update('languageTags', value)} />
                    <Field label="Résumé compétences" value={form.skillsSummary} onChange={(value) => update('skillsSummary', value)} />
                  </div>
                </Section>
                <Section title="AngelCare service coverage" subtitle="Suggested tags for operational matching.">
                  <div className="grid grid-cols-2 gap-3">
                    {['H.S', 'PP', 'SEN', 'SCHOOL', 'HYBRID', 'ANIMATION', 'EXCURSION', 'FLASHCARDS'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = form.skillTags.split(',').map((item) => item.trim()).filter(Boolean)
                          if (!current.includes(tag)) update('skillTags', [...current, tag].join(', '))
                        }}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </Section>
              </div>
            ) : null}

            {section === 'operations' ? (
              <div className="grid gap-5 lg:grid-cols-3">
                <Section title="Readiness setup" subtitle="Initial operational status.">
                  <Info label="Readiness default" value="Calculated from status and future documents" />
                </Section>
                <Section title="Mission integration" subtitle="After creation, this agent can be assigned to mission dossiers.">
                  <Info label="Assignment field" value="missions.caregiver_id" />
                </Section>
                <Section title="Mobile integration" subtitle="Agent becomes available for mobile mission distribution.">
                  <Info label="Mobile scope" value="Missions, notifications, alerts, messages" />
                </Section>
              </div>
            ) : null}

            {section === 'payments' ? (
              <Section title="Payments & allowances profile" subtitle="Payment records will be generated from mission allowances and validated reports.">
                <div className="grid gap-4 md:grid-cols-3">
                  <Info label="Currency" value="MAD / DH" />
                  <Info label="Allowance source" value="mission_allowances" />
                  <Info label="Dispute workflow" value="carelink_payment_disputes" />
                </div>
              </Section>
            ) : null}

            {section === 'documents' ? (
              <Section title="Documents & compliance" subtitle="Compliance records will be managed after the caregiver exists.">
                <div className="grid gap-4 md:grid-cols-3">
                  <Info label="Documents" value="carelink_agent_documents" />
                  <Info label="Review" value="Approve / reject / request" />
                  <Info label="Readiness impact" value="Blocks service eligibility if required" />
                </div>
              </Section>
            ) : null}

            {section === 'review' ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_.75fr]">
                <Section title="Final review" subtitle="Confirm the operational record before creating the agent.">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Info label="Nom" value={form.fullName || '—'} />
                    <Info label="Téléphone" value={form.phone || '—'} />
                    <Info label="Ville" value={form.city || '—'} />
                    <Info label="Zone" value={form.zone || '—'} />
                    <Info label="Status" value={form.status || 'available'} />
                    <Info label="Skills" value={form.skillTags || '—'} />
                  </div>
                </Section>
                <Section title="Ready to save" subtitle="This creates/updates the live caregiver record.">
                  <div className="space-y-3 text-sm font-bold text-slate-600">
                    <p>✓ Will appear in Agents Command Center</p>
                    <p>✓ Will become available for dispatch matching</p>
                    <p>✓ Will have a full agent dossier</p>
                    <p>✓ Will be compatible with mobile assignment</p>
                  </div>
                </Section>
              </div>
            ) : null}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white p-5">
            <p className="text-xs font-bold text-slate-500">
              No fake data. This writes to the live caregivers table and audit trail.
            </p>
            <div className="flex gap-3">
              <GhostButton onClick={close}>Annuler</GhostButton>
              <ActionButton onClick={submit} disabled={saving} tone="blue">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <BadgeCheck size={16} />}
                Enregistrer agent
              </ActionButton>
            </div>
          </footer>
        </section>
      </div>
    </div>
  )
}


function AgentDossierModal({
  agent,
  dossier,
  loading,
  activeTab,
  setActiveTab,
  close,
  openEdit,
  archiveAgent,
  openAction,
}: {
  agent: AnyRecord
  dossier: AnyRecord | null
  loading: boolean
  activeTab: string
  setActiveTab: (key: string) => void
  close: () => void
  openEdit: () => void
  archiveAgent: () => void
  openAction: (type: 'notify' | 'message' | 'alert' | 'document' | 'training' | 'readiness', agent: AnyRecord) => void
}) {
  const d = dossier || {}
  const currentAgent = d.agent || agent
  const summary = d.summary || agent.summary || {}

  return (
    <div className="fixed inset-0 z-[9998] bg-slate-950/45 p-4">
      <div className="mx-auto flex h-full max-w-[1500px] overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <aside className="w-[290px] shrink-0 border-r border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-lg font-black text-white">
              {text(currentAgent.fullName, 'A').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-black text-slate-950">{currentAgent.fullName}</p>
              <p className="text-xs font-bold text-slate-500">Agent #{currentAgent.id}</p>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition',
                    activeTab === tab.key ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-600 hover:bg-white',
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          <div className="mt-6 grid gap-2">
            <ActionButton tone="blue" onClick={() => openAction('message', currentAgent)}><Send size={15} /> Message</ActionButton>
            <GhostButton onClick={openEdit}>Modifier</GhostButton>
            <button onClick={archiveAgent} className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700">
              Archiver agent
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-600">Dossier agent entreprise</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">{currentAgent.fullName}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{currentAgent.city} · {currentAgent.zone} · {currentAgent.phone}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <GhostButton onClick={() => window.print()}><Printer size={16} /> Imprimer</GhostButton>
                <GhostButton onClick={() => openAction('notify', currentAgent)}><Bell size={16} /> Notifier</GhostButton>
                <GhostButton onClick={() => openAction('alert', currentAgent)}><AlertTriangle size={16} /> Alerte</GhostButton>
                <button onClick={close} className="rounded-2xl bg-slate-100 p-3 text-slate-600"><X size={18} /></button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-6">
            {loading ? (
              <div className="grid min-h-[420px] place-items-center">
                <Loader2 className="animate-spin text-blue-600" size={30} />
              </div>
            ) : (
              <DossierTab
                activeTab={activeTab}
                agent={currentAgent}
                dossier={d}
                summary={summary}
                openAction={openAction}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function DossierTab({
  activeTab,
  agent,
  dossier,
  summary,
  openAction,
}: {
  activeTab: string
  agent: AnyRecord
  dossier: AnyRecord
  summary: AnyRecord
  openAction: (type: 'notify' | 'message' | 'alert' | 'document' | 'training' | 'readiness', agent: AnyRecord) => void
}) {
  const missions = list(dossier.missions)
  const documents = list(dossier.documents)
  const alerts = list(dossier.alerts)
  const messages = list(dossier.messages)
  const reports = list(dossier.reports)
  const allowances = list(dossier.allowances)
  const disputes = list(dossier.paymentDisputes)
  const events = list(dossier.events)

  if (activeTab === 'overview') {
    return (
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="Readiness" value={`${agent.readinessScore || 0}%`} helper="Operational readiness" icon={<ShieldCheck size={18} />} />
          <Metric label="Missions" value={summary.totalMissions || 0} helper={`${summary.activeMissions || 0} active`} icon={<BriefcaseBusiness size={18} />} />
          <Metric label="Paiements" value={money(summary.allowanceTotal)} helper={`${summary.paymentDisputes || 0} litiges`} icon={<CreditCard size={18} />} />
          <Metric label="Risques" value={(summary.openAlerts || 0) + (summary.incidents || 0)} helper="Alertes + incidents" icon={<AlertTriangle size={18} />} />
        </div>
        <Section title="Commandes agent" subtitle="Actions synchronisées avec Ops et mobile.">
          <div className="flex flex-wrap gap-3">
            <ActionButton tone="blue" onClick={() => openAction('message', agent)}><MessageSquare size={16} /> Envoyer message</ActionButton>
            <ActionButton tone="amber" onClick={() => openAction('alert', agent)}><AlertTriangle size={16} /> Créer alerte</ActionButton>
            <GhostButton onClick={() => openAction('document', agent)}><FileText size={16} /> Demander document</GhostButton>
            <GhostButton onClick={() => openAction('training', agent)}><Sparkles size={16} /> Demander formation</GhostButton>
            <GhostButton onClick={() => openAction('readiness', agent)}><BadgeCheck size={16} /> Mettre readiness</GhostButton>
          </div>
        </Section>
      </div>
    )
  }

  if (activeTab === 'identity') {
    return (
      <Section title="Identité & couverture" subtitle="Profil opérationnel agent, zones et compétences.">
        <div className="grid gap-4 md:grid-cols-2">
          <Info label="Nom" value={agent.fullName} />
          <Info label="Téléphone" value={agent.phone} />
          <Info label="Ville" value={agent.city} />
          <Info label="Zone" value={agent.zone} />
          <Info label="Statut" value={agent.status} />
          <Info label="Compétences" value={list(agent.skills).join(', ') || '—'} />
          <Info label="Langues" value={list(agent.languages).join(', ') || '—'} />
          <Info label="Résumé" value={agent.skillsSummary || '—'} />
        </div>
      </Section>
    )
  }

  if (activeTab === 'missions') return <ListPanel title="Missions agent" items={missions} empty="Aucune mission liée à cet agent pour le moment." />
  if (activeTab === 'payments') return <ListPanel title="Paiements, indemnités et litiges" items={[...allowances, ...disputes]} empty="Aucune ligne paiement ou litige actuellement." />
  if (activeTab === 'documents') return <ListPanel title="Documents agent" items={documents} empty="Aucun document agent enregistré." />
  if (activeTab === 'compliance') return <ListPanel title="Conformité & readiness" items={list(dossier.compliance?.blockers)} empty="Aucun blocage conformité détecté." />
  if (activeTab === 'messages') return <ListPanel title="Messages dispatch" items={messages} empty="Aucun message dispatch lié à cet agent." />
  if (activeTab === 'alerts') return <ListPanel title="Alertes agent" items={alerts} empty="Aucune alerte agent ouverte." />
  if (activeTab === 'mobile') return <ListPanel title="Synchronisation mobile" items={[...list(dossier.mobile?.notifications), ...list(dossier.mobile?.alerts), ...list(dossier.mobile?.messages)]} empty="Aucune activité mobile récente." />
  if (activeTab === 'history') return <ListPanel title="Historique & audit" items={events} empty="Aucun événement mission lié à cet agent." />

  return (
    <Section title="Rapports & impression" subtitle="Dossier imprimable agent pour management, conformité et opérations.">
      <div className="rounded-[1.5rem] bg-white p-6">
        <h3 className="text-2xl font-black text-slate-950">{agent.fullName}</h3>
        <p className="mt-2 text-sm font-semibold text-slate-500">{agent.city} · {agent.zone} · {agent.phone}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Info label="Missions" value={summary.totalMissions || 0} />
          <Info label="Readiness" value={`${agent.readinessScore || 0}%`} />
          <Info label="Paiements" value={money(summary.allowanceTotal)} />
        </div>
        <div className="mt-6">
          <ActionButton onClick={() => window.print()} tone="slate"><Printer size={16} /> Imprimer le dossier agent</ActionButton>
        </div>
      </div>
    </Section>
  )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-black text-slate-900">{value}</p>
    </div>
  )
}

function ListPanel({ title, items, empty }: { title: string; items: AnyRecord[]; empty: string }) {
  return (
    <Section title={title} subtitle="Vue live connectée aux tables CareLink Ops et mission engine.">
      {items.length ? (
        <div className="grid gap-3">
          {items.slice(0, 80).map((item, index) => (
            <article key={item.id || index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-black text-slate-950">{item.title || item.label || item.subject || item.service_type || item.status || item.action || `Record #${item.id || index + 1}`}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{item.body || item.description || item.notes || item.created_at || item.mission_date || 'Live operational record'}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{item.status || item.priority || item.type || 'live'}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title={empty} body="Cette section reste prête à afficher les données live dès que les opérations, missions, documents ou actions mobiles seront disponibles." />
      )}
    </Section>
  )
}

function ActionModal({
  type,
  agent,
  title,
  message,
  setTitle,
  setMessage,
  saving,
  close,
  submit,
}: {
  type: string
  agent: AnyRecord
  title: string
  message: string
  setTitle: (value: string) => void
  setMessage: (value: string) => void
  saving: boolean
  close: () => void
  submit: () => void
}) {
  const labels: Record<string, string> = {
    notify: 'Notifier agent',
    message: 'Message dispatch',
    alert: 'Créer alerte',
    document: 'Demander document',
    training: 'Demander formation',
    readiness: 'Mettre à jour readiness',
  }

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-slate-950/50 p-5">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-blue-600">Action agent</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{labels[type] || 'Action'} · {agent.fullName}</h2>
          </div>
          <button onClick={close} className="rounded-2xl bg-slate-100 p-3 text-slate-600"><X size={18} /></button>
        </div>
        <div className="mt-6 grid gap-4">
          <Field label="Titre / Sujet" value={title} onChange={setTitle} />
          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Message / Note</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <GhostButton onClick={close}>Annuler</GhostButton>
          <ActionButton onClick={submit} disabled={saving} tone={type === 'alert' ? 'amber' : 'blue'}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            Exécuter
          </ActionButton>
        </div>
      </div>
    </div>
  )
}
