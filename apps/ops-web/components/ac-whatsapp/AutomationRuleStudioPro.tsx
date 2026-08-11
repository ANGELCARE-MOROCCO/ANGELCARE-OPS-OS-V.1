"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  Archive,
  Bot,
  CirclePause,
  CirclePlay,
  FlaskConical,
  Plus,
  ShieldCheck,
  Upload,
  Workflow,
} from "lucide-react"
import { EmptyState, ModalFrame, NoticeBanner, StatusPill, Surface, SurfaceHeader } from "./ACWhatsAppUI"
import { acApi, friendlyAcError, formatRelative } from "./useAcWhatsApp"

type Notice = ReturnType<typeof friendlyAcError> & { tone?: "success" | "danger" | "warning" | "info" }

type AutomationRule = {
  id: string
  name: string
  description?: string | null
  trigger_type: string
  account_id?: string | null
  template_id?: string | null
  template?: { id?: string; name?: string; body?: string } | null
  conditions?: Record<string, unknown> | null
  schedule_config?: Record<string, unknown> | null
  priority?: number
  cooldown_seconds?: number
  max_runs_per_conversation?: number
  approval_status?: string
  status?: string
}

type Template = { id: string; name: string; body: string; approval_status?: string; status?: string }
type Account = { id: string; name: string }

const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[10px] font-bold text-slate-950 outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
const TRIGGERS = [
  ["inbound_message", "Chaque message entrant"],
  ["new_conversation", "Nouvelle conversation"],
  ["first_inbound", "Premier message entrant"],
  ["keyword", "Mot-clé / phrase"],
  ["outside_business_hours", "Hors horaires"],
] as const

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  const source = text.replace(/\r\n?/g, "\n")
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (char === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i += 1 }
      else quoted = !quoted
    } else if (char === "," && !quoted) {
      row.push(cell); cell = ""
    } else if (char === "\n" && !quoted) {
      row.push(cell); rows.push(row); row = []; cell = ""
    } else cell += char
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const clean = rows.filter((values) => values.some((value) => value.trim()))
  if (!clean.length) return []
  const headers = clean[0].map((value) => value.trim())
  return clean.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""])))
}

export default function AutomationRuleStudioPro({ accounts }: { accounts: Account[] }) {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [executions, setExecutions] = useState<any[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [importJobs, setImportJobs] = useState<any[]>([])
  const [editorOpen, setEditorOpen] = useState(false)
  const [selected, setSelected] = useState<AutomationRule | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  async function refresh() {
    try {
      const [automation, templateRows, jobs] = await Promise.all([
        acApi<any>("/api/ac-whatsapp/automation"),
        acApi<Template[]>("/api/ac-whatsapp/templates?status=active"),
        acApi<any[]>("/api/ac-whatsapp/automation/import"),
      ])
      setRules(automation.rules || [])
      setExecutions(automation.executions || [])
      setTemplates((templateRows || []).filter((row) => row.approval_status === "approved" && row.status === "active"))
      setImportJobs(jobs || [])
    } catch (cause) {
      setNotice({ ...friendlyAcError(cause), tone: "danger" })
    }
  }

  useEffect(() => { void refresh() }, [])

  async function action(id: string, actionName: string) {
    try {
      await acApi("/api/ac-whatsapp/automation", {
        method: "PATCH",
        body: JSON.stringify({ id, action: actionName, reason: `Action administrateur: ${actionName}` }),
      })
      await refresh()
      setNotice({ tone: "success", title: "Automatisation mise à jour", description: `L’action « ${actionName} » a été appliquée et auditée.` })
    } catch (cause) {
      setNotice({ ...friendlyAcError(cause), tone: "danger" })
    }
  }

  return (
    <div className="space-y-4">
      {notice ? <NoticeBanner tone={notice.tone || "info"} title={notice.title} description={notice.description} onClose={() => setNotice(null)} /> : null}

      <Surface>
        <SurfaceHeader
          eyebrow="Governed automation"
          title="Règles, simulations & contrôle humain"
          icon={Workflow}
          action={(
            <div className="flex gap-2">
              <button type="button" onClick={() => setImportOpen(true)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[10px] font-black text-slate-800">
                <Upload className="mr-1 inline h-3.5 w-3.5" />Importer CSV
              </button>
              <button type="button" onClick={() => { setSelected(null); setEditorOpen(true) }} className="rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black text-white">
                <Plus className="mr-1 inline h-3.5 w-3.5" />Nouvelle règle
              </button>
            </div>
          )}
        />
        <div className="mt-4 space-y-2">
          {rules.length ? rules.map((rule) => (
            <article key={rule.id} className="acw-apex-row rounded-[16px] border border-slate-200 bg-white p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.13em] text-violet-600">{rule.trigger_type}</p>
                  <h3 className="mt-2 text-[12px] font-black text-slate-950">{rule.name}</h3>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">Priorité {rule.priority || 100} · cooldown {rule.cooldown_seconds || 0}s · max {rule.max_runs_per_conversation || 1}/conversation</p>
                </div>
                <StatusPill status={rule.status || "draft"} compact />
              </div>
              <div className="mt-3 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-[1fr_1fr_1.3fr]">
                <LogicCell label="WHEN" value={TRIGGERS.find(([value]) => value === rule.trigger_type)?.[1] || rule.trigger_type} />
                <LogicCell label="IF" value={Array.isArray((rule.conditions as any)?.keywords) && (rule.conditions as any).keywords.length ? `Mots-clés · ${(rule.conditions as any).keywords.join(", ")}` : rule.account_id ? "Compte ciblé" : "Conditions générales"} />
                <LogicCell label="THEN" value={rule.template?.name || "Réponse à sélectionner"} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button type="button" onClick={() => { setSelected(rule); setEditorOpen(true) }} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px] font-black text-slate-700">Modifier</button>
                {rule.approval_status !== "approved" ? (
                  <button type="button" onClick={() => void action(rule.id, "approve")} className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black text-emerald-700"><ShieldCheck className="mr-1 inline h-3 w-3" />Approuver</button>
                ) : null}
                {rule.status === "active" ? (
                  <button type="button" onClick={() => void action(rule.id, "pause")} className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[10px] font-black text-amber-800"><CirclePause className="mr-1 inline h-3 w-3" />Pause</button>
                ) : rule.approval_status === "approved" ? (
                  <button type="button" onClick={() => void action(rule.id, "activate")} className="rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-[10px] font-black text-blue-700"><CirclePlay className="mr-1 inline h-3 w-3" />Activer</button>
                ) : null}
                <button type="button" onClick={() => void action(rule.id, "archive")} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px] font-black text-slate-600"><Archive className="mr-1 inline h-3 w-3" />Archiver</button>
              </div>
            </article>
          )) : (
            <div><EmptyState title="Aucune règle" description="Créez une règle, simulez-la, approuvez-la puis activez-la. Aucun import n’est actif par défaut." icon={Bot} /></div>
          )}
        </div>
      </Surface>

      {importJobs.length ? (
        <Surface>
          <SurfaceHeader eyebrow="Import governance" title="Lots Auto Reply importés" icon={Upload} />
          <div className="mt-4 grid gap-2 lg:grid-cols-2">
            {importJobs.slice(0, 8).map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <div><p className="text-[9px] font-black text-slate-900">{job.file_name || "Import Auto Reply"}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{job.total_rows || 0} règle(s) · toutes importées en brouillon/test</p></div>
                <div className="flex items-center gap-2"><StatusPill status={job.status || "preview"} compact />{job.status === "committed" ? <button type="button" onClick={async () => { try { await acApi("/api/ac-whatsapp/automation/import", { method: "POST", body: JSON.stringify({ action: "rollback", job_id: job.id, reason: "Rollback administrateur" }) }); await refresh(); setNotice({ tone: "success", title: "Import Auto Reply annulé", description: "Les règles créées par ce lot ont été archivées et désactivées." }) } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) } }} className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[10px] font-black text-amber-800">Rollback</button> : null}</div>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}

      <Surface>
        <SurfaceHeader eyebrow="Execution evidence" title="Dernières décisions automatiques" icon={Activity} />
        <div className="mt-4 space-y-2">
          {executions.slice(0, 12).map((row) => (
            <div key={row.id} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[120px_1fr_120px]">
              <StatusPill status={row.execution_status || "unknown"} compact />
              <p className="text-[9px] font-bold text-slate-700">Règle {String(row.rule_id || "—").slice(0, 8)} · conversation {String(row.conversation_id || "—").slice(0, 8)}</p>
              <p className="text-right text-[10px] font-semibold text-slate-500">{formatRelative(row.created_at)}</p>
            </div>
          ))}
          {!executions.length ? <p className="text-[9px] font-semibold text-slate-500">Aucune exécution enregistrée.</p> : null}
        </div>
      </Surface>

      {editorOpen ? <RuleModal accounts={accounts} templates={templates} rule={selected} onClose={() => setEditorOpen(false)} onSaved={async () => { setEditorOpen(false); await refresh() }} /> : null}
      {importOpen ? <AutomationImportModal templates={templates} onClose={() => setImportOpen(false)} onSaved={async () => { setImportOpen(false); await refresh() }} /> : null}
    </div>
  )
}

function RuleModal({ accounts, templates, rule, onClose, onSaved }: { accounts: Account[]; templates: Template[]; rule: AutomationRule | null; onClose: () => void; onSaved: () => void }) {
  const conditions = (rule?.conditions || {}) as Record<string, any>
  const schedule = (rule?.schedule_config || {}) as Record<string, any>
  const [form, setForm] = useState({
    id: rule?.id || "",
    name: rule?.name || "",
    description: rule?.description || "",
    trigger_type: rule?.trigger_type || "inbound_message",
    account_id: rule?.account_id || "",
    template_id: rule?.template_id || "",
    keywords: Array.isArray(conditions.keywords) ? conditions.keywords.join("; ") : "",
    priority: Number(rule?.priority || 100),
    cooldown_seconds: Number(rule?.cooldown_seconds || 300),
    max_runs_per_conversation: Number(rule?.max_runs_per_conversation || 1),
    start: String(schedule.start || "09:00"),
    end: String(schedule.end || "18:00"),
  })
  const [busy, setBusy] = useState(false)
  const [simulation, setSimulation] = useState<any>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  function payload() {
    return {
      ...form,
      conditions: { keywords: form.keywords.split(/[;,]/).map((value) => value.trim()).filter(Boolean) },
      schedule_config: { timezone: "Africa/Casablanca", start: form.start, end: form.end, weekdays: [1, 2, 3, 4, 5, 6] },
    }
  }

  async function save() {
    setBusy(true)
    try {
      await acApi("/api/ac-whatsapp/automation", { method: rule ? "PATCH" : "POST", body: JSON.stringify(payload()) })
      onSaved()
    } catch (cause) {
      setNotice({ ...friendlyAcError(cause), tone: "danger" })
    } finally { setBusy(false) }
  }

  async function simulate() {
    if (!rule?.id) return
    setBusy(true)
    try {
      setSimulation(await acApi("/api/ac-whatsapp/automation/simulate", {
        method: "POST",
        body: JSON.stringify({ id: rule.id, text: "Bonjour, je souhaite des informations sur vos services", contact: { tags: ["prospect"] }, conversation: { assigned_user_id: null, message_count: 1 }, is_new_conversation: true }),
      }))
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
    finally { setBusy(false) }
  }

  return (
    <ModalFrame
      wide
      title={rule ? "Modifier la règle" : "Créer une règle"}
      eyebrow="Automation governance"
      description="Une règle reste en brouillon/test jusqu’à approbation puis activation explicite."
      onClose={onClose}
      footer={(
        <div className="flex gap-2">
          <button type="button" disabled={!rule?.id || busy} onClick={() => void simulate()} className="rounded-xl border border-violet-300 bg-violet-50 px-4 py-2.5 text-[9px] font-black text-violet-800 disabled:opacity-40"><FlaskConical className="mr-1 inline h-3.5 w-3.5" />Simuler</button>
          <button type="button" disabled={busy || !form.name || !form.template_id} onClick={() => void save()} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">Enregistrer en brouillon</button>
        </div>
      )}
    >
      {notice ? <NoticeBanner tone={notice.tone || "danger"} title={notice.title} description={notice.description} /> : null}
      {simulation ? <NoticeBanner tone={simulation.matched ? "success" : "warning"} title={simulation.matched ? "La règle correspond" : "La règle ne correspond pas"} description="Simulation uniquement : aucun message n’a été envoyé." /> : null}
      <div className="mb-4 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 md:grid-cols-3"><LogicCell label="WHEN" value={TRIGGERS.find(([value]) => value === form.trigger_type)?.[1] || form.trigger_type} /><LogicCell label="IF" value={form.keywords.trim() ? `Mots-clés · ${form.keywords}` : form.account_id ? "Compte sélectionné" : "Tous comptes autorisés"} /><LogicCell label="THEN" value={templates.find((template) => template.id === form.template_id)?.name || "Choisir une réponse approuvée"} /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nom"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Déclencheur"><select className={inputClass} value={form.trigger_type} onChange={(event) => setForm({ ...form, trigger_type: event.target.value })}>{TRIGGERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        <Field label="Compte"><select className={inputClass} value={form.account_id} onChange={(event) => setForm({ ...form, account_id: event.target.value })}><option value="">Tous les comptes autorisés</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></Field>
        <Field label="Réponse approuvée"><select className={inputClass} value={form.template_id} onChange={(event) => setForm({ ...form, template_id: event.target.value })}><option value="">Choisir…</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></Field>
        <Field label="Mots-clés"><input className={inputClass} value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} placeholder="tarif; prix; disponibilité" /></Field>
        <Field label="Priorité"><input type="number" className={inputClass} value={form.priority} onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })} /></Field>
        <Field label="Cooldown (secondes)"><input type="number" min={0} className={inputClass} value={form.cooldown_seconds} onChange={(event) => setForm({ ...form, cooldown_seconds: Number(event.target.value) })} /></Field>
        <Field label="Maximum / conversation"><input type="number" min={1} className={inputClass} value={form.max_runs_per_conversation} onChange={(event) => setForm({ ...form, max_runs_per_conversation: Number(event.target.value) })} /></Field>
        <Field label="Horaire début"><input type="time" className={inputClass} value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} /></Field>
        <Field label="Horaire fin"><input type="time" className={inputClass} value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} /></Field>
        <div className="md:col-span-2"><Field label="Description interne"><textarea rows={3} className={inputClass} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field></div>
      </div>
    </ModalFrame>
  )
}

function AutomationImportModal({ templates, onClose, onSaved }: { templates: Template[]; onClose: () => void; onSaved: () => void }) {
  const [rows, setRows] = useState<any[]>([])
  const [fileName, setFileName] = useState("")
  const [preview, setPreview] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  async function previewImport() {
    setBusy(true)
    try { setPreview(await acApi("/api/ac-whatsapp/automation/import", { method: "POST", body: JSON.stringify({ rows, file_name: fileName, commit: false }) })) }
    catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
    finally { setBusy(false) }
  }

  async function commitImport() {
    setBusy(true)
    try {
      await acApi("/api/ac-whatsapp/automation/import", { method: "POST", body: JSON.stringify({ rows, file_name: fileName, commit: true }) })
      onSaved()
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
    finally { setBusy(false) }
  }

  return (
    <ModalFrame
      wide
      title="Importer des règles Auto Reply"
      eyebrow="Safe CSV import"
      description="Les règles importées sont toujours créées en DRAFT + mode test. Aucune règle importée n’envoie automatiquement."
      onClose={onClose}
      footer={(
        <div className="flex gap-2">
          <button type="button" disabled={busy || !rows.length} onClick={() => void previewImport()} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-800 disabled:opacity-40">Prévisualiser</button>
          <button type="button" disabled={busy || !preview || Number(preview.summary?.rejected || 0) > 0} onClick={() => void commitImport()} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">Importer en brouillons</button>
        </div>
      )}
    >
      {notice ? <NoticeBanner tone={notice.tone || "danger"} title={notice.title} description={notice.description} /> : null}
      <Field label="Fichier CSV">
        <input type="file" accept=".csv,text/csv" className={inputClass} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setFileName(file.name); setRows(parseCsv(await file.text())); setPreview(null) }} />
      </Field>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[9px] font-black text-slate-900">Contrat CSV</p>
        <p className="mt-2 text-[10px] font-semibold leading-5 text-slate-600">name, trigger_type, template_id, account_id, keywords, priority, cooldown_seconds, max_runs_per_conversation</p>
        <p className="mt-2 text-[10px] font-bold text-slate-500">{rows.length} ligne(s). Réponses actives disponibles : {templates.length}.</p>
      </div>
      {preview ? <div className="mt-4 grid gap-3 sm:grid-cols-4"><Count label="Total" value={preview.summary?.total || 0} /><Count label="Valides" value={preview.summary?.valid || 0} /><Count label="Avertissements" value={preview.summary?.warnings || 0} /><Count label="Rejetées" value={preview.summary?.rejected || 0} /></div> : null}
    </ModalFrame>
  )
}

function LogicCell({ label, value }: { label: string; value: string }) {
  return <div className="bg-white p-3"><p className="text-[10px] font-black uppercase tracking-[.14em] text-violet-600">{label}</p><p className="mt-1 text-[9px] font-black leading-4 text-slate-900">{value}</p></div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.14em] text-slate-600">{label}</span>{children}</label>
}

function Count({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-slate-200 p-3"><p className="text-lg font-black text-slate-950">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p></div>
}
