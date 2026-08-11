"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Archive,
  BookOpenText,
  CheckCircle2,
  FileUp,
  FolderPlus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Undo2,
} from "lucide-react"
import { cx, EmptyState, ModalFrame, NoticeBanner, StatusPill, Surface, SurfaceHeader } from "./ACWhatsAppUI"
import { acApi, friendlyAcError } from "./useAcWhatsApp"

type Notice = ReturnType<typeof friendlyAcError> & { tone?: "success" | "danger" | "warning" | "info" }
type Category = { id: string; name: string; description?: string | null; status: string; color?: string | null; sort_order?: number }
type ResponseRow = {
  id: string
  name: string
  body: string
  category_id?: string | null
  category?: Category | null
  shortcut?: string | null
  language?: string | null
  description?: string | null
  service_line?: string | null
  tags?: string[] | null
  status?: string
  approval_status?: string
  usage_count?: number
  updated_at?: string
}

const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[10px] font-bold text-slate-950 outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200"

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  const source = text.replace(/\r\n?/g, "\n")
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { cell += '"'; index += 1 }
      else quoted = !quoted
    } else if (char === "," && !quoted) {
      row.push(cell); cell = ""
    } else if (char === "\n" && !quoted) {
      row.push(cell); rows.push(row); row = []; cell = ""
    } else cell += char
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const meaningful = rows.filter((values) => values.some((value) => value.trim()))
  if (!meaningful.length) return []
  const headers = meaningful[0].map((value) => value.trim())
  return meaningful.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""])))
}

export default function ResponseLibraryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [responses, setResponses] = useState<ResponseRow[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [query, setQuery] = useState("")
  const [categoryId, setCategoryId] = useState("all")
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [categoryEdit, setCategoryEdit] = useState<Category | null>(null)
  const [responseOpen, setResponseOpen] = useState(false)
  const [selected, setSelected] = useState<ResponseRow | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  async function refresh() {
    try {
      const [categoryRows, responseRows, importJobs] = await Promise.all([
        acApi<Category[]>("/api/ac-whatsapp/response-categories?include_archived=true"),
        acApi<ResponseRow[]>("/api/ac-whatsapp/templates?include_archived=true"),
        acApi<any[]>("/api/ac-whatsapp/templates/import"),
      ])
      setCategories(categoryRows || [])
      setResponses(responseRows || [])
      setJobs(importJobs || [])
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
  }

  useEffect(() => { void refresh() }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return responses.filter((row) => {
      if (categoryId !== "all" && row.category_id !== categoryId) return false
      if (!needle) return true
      return `${row.name} ${row.body} ${row.shortcut || ""} ${(row.tags || []).join(" ")} ${row.service_line || ""}`.toLowerCase().includes(needle)
    })
  }, [responses, categoryId, query])

  async function mutate(id: string, action: string) {
    try {
      await acApi("/api/ac-whatsapp/templates", { method: "PATCH", body: JSON.stringify({ id, action, reason: `Action administrateur: ${action}` }) })
      await refresh()
      setNotice({ tone: "success", title: "Réponse mise à jour", description: `L’action « ${action} » a été appliquée et auditée.` })
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
  }

  async function mutateCategory(row: Category, action: "archive" | "restore") {
    try {
      await acApi("/api/ac-whatsapp/response-categories", { method: "PATCH", body: JSON.stringify({ id: row.id, action, reason: `Action administrateur: ${action}` }) })
      await refresh()
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
  }

  return (
    <div className="space-y-4">
      {notice ? <NoticeBanner tone={notice.tone || "info"} title={notice.title} description={notice.description} onClose={() => setNotice(null)} /> : null}

      <Surface>
        <SurfaceHeader
          eyebrow="Governed response library"
          title="Catégories, réponses, approbation & import"
          icon={BookOpenText}
          action={(
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { setCategoryEdit(null); setCategoryOpen(true) }} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[10px] font-black text-slate-800"><FolderPlus className="mr-1 inline h-3.5 w-3.5" />Catégorie</button>
              <button type="button" onClick={() => setImportOpen(true)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-[10px] font-black text-slate-800"><FileUp className="mr-1 inline h-3.5 w-3.5" />Importer CSV</button>
              <button type="button" onClick={() => { setSelected(null); setResponseOpen(true) }} className="rounded-xl bg-rose-600 px-3 py-2 text-[10px] font-black text-white"><Plus className="mr-1 inline h-3.5 w-3.5" />Nouvelle réponse</button>
            </div>
          )}
        />

        <div className="mt-4 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-[14px] border border-slate-200 bg-slate-50 p-2.5">
            <CategoryButton active={categoryId === "all"} label="Toutes les réponses" count={responses.length} onClick={() => setCategoryId("all")} />
            <div className="mt-2 space-y-1">
              {categories.map((category) => {
                const count = responses.filter((row) => row.category_id === category.id).length
                return (
                  <div key={category.id} className={cx("group flex items-center gap-1 rounded-xl", category.status === "archived" && "opacity-60")}>
                    <div className="min-w-0 flex-1"><CategoryButton active={categoryId === category.id} label={category.name} count={count} onClick={() => setCategoryId(category.id)} /></div>
                    <button type="button" title="Modifier la catégorie" onClick={() => { setCategoryEdit(category); setCategoryOpen(true) }} className="grid h-8 w-8 place-items-center rounded-lg border border-transparent text-slate-400 hover:border-slate-200 hover:bg-white hover:text-slate-950"><Pencil className="h-3.5 w-3.5" /></button>
                    {category.status === "archived" ? (
                      <button type="button" title="Restaurer" onClick={() => void mutateCategory(category, "restore")} className="grid h-8 w-8 place-items-center rounded-lg text-blue-600 hover:bg-blue-50"><Undo2 className="h-3.5 w-3.5" /></button>
                    ) : (
                      <button type="button" title="Archiver" onClick={() => void mutateCategory(category, "archive")} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-rose-600"><Archive className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>

          <div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre, raccourci, tag, contenu…" className="min-w-0 flex-1 bg-transparent text-[10px] font-bold text-slate-950 outline-none placeholder:text-slate-400" />
              <span className="text-[10px] font-black text-slate-400">{filtered.length} résultat(s)</span>
            </div>

            <div className="mt-3 space-y-1.5">
              {filtered.length ? filtered.map((row) => (
                <article key={row.id} className="acw-apex-row rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[.13em] text-rose-600">{row.category?.name || "Sans catégorie"}</p>
                      <h3 className="mt-2 truncate text-[12px] font-black text-slate-950">{row.name}</h3>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500">{row.shortcut || "Sans raccourci"} · {row.usage_count || 0} utilisation(s)</p>
                    </div>
                    <div className="flex gap-1"><StatusPill status={row.approval_status || "draft"} compact /><StatusPill status={row.status || "draft"} compact /></div>
                  </div>
                  <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-[9px] font-semibold leading-4 text-slate-700">{row.body}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => { setSelected(row); setResponseOpen(true) }} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px] font-black text-slate-700"><Pencil className="mr-1 inline h-3 w-3" />Modifier</button>
                    {row.approval_status !== "approved" ? <button type="button" onClick={() => void mutate(row.id, "approve")} className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-black text-emerald-700"><ShieldCheck className="mr-1 inline h-3 w-3" />Approuver</button> : null}
                    {row.status !== "archived" ? <button type="button" onClick={() => void mutate(row.id, "archive")} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px] font-black text-slate-600"><Archive className="mr-1 inline h-3 w-3" />Archiver</button> : <button type="button" onClick={() => void mutate(row.id, "restore")} className="rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-[10px] font-black text-blue-700"><Undo2 className="mr-1 inline h-3 w-3" />Restaurer</button>}
                  </div>
                </article>
              )) : <div><EmptyState title="Aucune réponse" description="Créez une catégorie puis une réponse, ou importez un CSV après prévisualisation." icon={BookOpenText} /></div>}
            </div>
          </div>
        </div>
      </Surface>

      {jobs.length ? (
        <Surface>
          <SurfaceHeader eyebrow="Import history" title="Lots importés & rollback" icon={FileUp} />
          <div className="mt-4 grid gap-2 lg:grid-cols-2">
            {jobs.slice(0, 8).map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <div><p className="text-[9px] font-black text-slate-900">{job.file_name || "Import réponses"}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{job.total_rows} lignes · {job.created_count} créées · {job.updated_count} mises à jour</p></div>
                <div className="flex items-center gap-2"><StatusPill status={job.status} compact />{job.status === "committed" ? <button type="button" onClick={async () => { try { await acApi("/api/ac-whatsapp/templates/import", { method: "POST", body: JSON.stringify({ action: "rollback", job_id: job.id, reason: "Rollback administrateur" }) }); await refresh(); setNotice({ tone: "success", title: "Import annulé", description: "Les créations sont archivées et les mises à jour restaurées." }) } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) } }} className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-[10px] font-black text-amber-800"><RotateCcw className="mr-1 inline h-3 w-3" />Rollback</button> : null}</div>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}

      {categoryOpen ? <CategoryModal category={categoryEdit} onClose={() => setCategoryOpen(false)} onSaved={async () => { setCategoryOpen(false); await refresh() }} /> : null}
      {responseOpen ? <ResponseModal categories={categories} response={selected} onClose={() => setResponseOpen(false)} onSaved={async () => { setResponseOpen(false); await refresh() }} /> : null}
      {importOpen ? <ImportModal categories={categories.filter((row) => row.status === "active")} onClose={() => setImportOpen(false)} onCommitted={async () => { setImportOpen(false); await refresh() }} /> : null}
    </div>
  )
}

function CategoryButton({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cx("flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[9px] font-black", active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-white")}><span className="truncate">{label}</span><span className={cx("ml-2 rounded-full px-2 py-0.5 text-[10px]", active ? "bg-white/10" : "bg-white")}>{count}</span></button>
}

function CategoryModal({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ id: category?.id || "", name: category?.name || "", description: category?.description || "", color: category?.color || "#0f172a" })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  async function save() {
    setBusy(true)
    try {
      await acApi("/api/ac-whatsapp/response-categories", { method: category ? "PATCH" : "POST", body: JSON.stringify(form) })
      onSaved()
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
    finally { setBusy(false) }
  }
  return (
    <ModalFrame title={category ? "Modifier la catégorie" : "Créer une catégorie"} eyebrow="Response taxonomy" description="La catégorie devient le conteneur gouverné des réponses et des imports." onClose={onClose} footer={<button type="button" disabled={busy || !form.name.trim()} onClick={() => void save()} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">{category ? "Enregistrer" : "Créer la catégorie"}</button>}>
      {notice ? <NoticeBanner tone={notice.tone || "danger"} title={notice.title} description={notice.description} /> : null}
      <div className="grid gap-4"><Field label="Nom"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Description"><textarea className={inputClass} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field></div>
    </ModalFrame>
  )
}

function ResponseModal({ categories, response, onClose, onSaved }: { categories: Category[]; response: ResponseRow | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ id: response?.id || "", name: response?.name || "", category_id: response?.category_id || categories.find((row) => row.status === "active")?.id || "", body: response?.body || "", shortcut: response?.shortcut || "", language: response?.language || "fr", tags: (response?.tags || []).join("; "), description: response?.description || "", service_line: response?.service_line || "" })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  async function save() {
    setBusy(true)
    try {
      const payload = { ...form, tags: form.tags.split(/[;,]/).map((value) => value.trim()).filter(Boolean), status: response?.status || "draft", approval_status: response?.approval_status || "draft" }
      await acApi("/api/ac-whatsapp/templates", { method: response ? "PATCH" : "POST", body: JSON.stringify(payload) })
      onSaved()
    } catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
    finally { setBusy(false) }
  }
  return (
    <ModalFrame wide title={response ? "Modifier la réponse" : "Créer une réponse"} eyebrow="Governed response" description="Les nouvelles réponses restent en brouillon jusqu’à approbation." onClose={onClose} footer={<button type="button" disabled={busy || !form.name.trim() || !form.body.trim() || !form.category_id} onClick={() => void save()} className="rounded-xl bg-rose-600 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">Enregistrer</button>}>
      {notice ? <NoticeBanner tone={notice.tone || "danger"} title={notice.title} description={notice.description} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Titre"><input className={inputClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
        <Field label="Catégorie"><select className={inputClass} value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })}><option value="">Choisir…</option>{categories.filter((row) => row.status !== "archived").map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
        <Field label="Raccourci"><input className={inputClass} placeholder="/tarif-creche" value={form.shortcut} onChange={(event) => setForm({ ...form, shortcut: event.target.value })} /></Field>
        <Field label="Tags"><input className={inputClass} placeholder="b2b; tarif; rentrée" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} /></Field>
        <Field label="Langue"><select className={inputClass} value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}><option value="fr">Français</option><option value="ar">Arabe</option><option value="en">Anglais</option></select></Field>
        <Field label="Ligne de service"><input className={inputClass} value={form.service_line} onChange={(event) => setForm({ ...form, service_line: event.target.value })} /></Field>
        <div className="md:col-span-2"><Field label="Description interne"><input className={inputClass} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field></div>
        <div className="md:col-span-2"><Field label="Corps de réponse"><textarea className={inputClass} rows={9} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></Field><p className="mt-2 text-[10px] font-semibold text-slate-500">Variables autorisées : {'{{contact_name}}'}, {'{{organization}}'}, {'{{city}}'}, {'{{service}}'}, {'{{operator_name}}'}.</p></div>
      </div>
    </ModalFrame>
  )
}

function ImportModal({ categories, onClose, onCommitted }: { categories: Category[]; onClose: () => void; onCommitted: () => void }) {
  const [category, setCategory] = useState(categories[0]?.id || "")
  const [rows, setRows] = useState<any[]>([])
  const [fileName, setFileName] = useState("")
  const [preview, setPreview] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  async function analyze() {
    setBusy(true)
    try { setPreview(await acApi("/api/ac-whatsapp/templates/import", { method: "POST", body: JSON.stringify({ category_id: category, rows, file_name: fileName, commit: false }) })) }
    catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
    finally { setBusy(false) }
  }
  async function commit() {
    setBusy(true)
    try { await acApi("/api/ac-whatsapp/templates/import", { method: "POST", body: JSON.stringify({ category_id: category, rows, file_name: fileName, commit: true }) }); onCommitted() }
    catch (cause) { setNotice({ ...friendlyAcError(cause), tone: "danger" }) }
    finally { setBusy(false) }
  }
  return (
    <ModalFrame wide title="Importer des réponses CSV" eyebrow="Category-first import studio" description="Choisissez d’abord la catégorie. Le fichier est analysé avant toute écriture." onClose={onClose} footer={<div className="flex gap-2"><button type="button" disabled={busy || !category || !rows.length} onClick={() => void analyze()} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[9px] font-black text-slate-800 disabled:opacity-40">Prévisualiser</button><button type="button" disabled={busy || !preview || Number(preview.summary?.rejected || 0) > 0} onClick={() => void commit()} className="rounded-xl bg-rose-600 px-4 py-2.5 text-[9px] font-black text-white disabled:opacity-40">Valider l’import</button></div>}>
      {notice ? <NoticeBanner tone="danger" title={notice.title} description={notice.description} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Catégorie destination"><select className={inputClass} value={category} onChange={(event) => { setCategory(event.target.value); setPreview(null) }}><option value="">Choisir…</option>{categories.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></Field>
        <Field label="Fichier CSV"><input type="file" accept=".csv,text/csv" className={inputClass} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setFileName(file.name); setRows(parseCsv(await file.text())); setPreview(null) }} /></Field>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black text-slate-800">Colonnes reconnues</p><p className="mt-2 text-[10px] font-semibold leading-5 text-slate-600">title, body, shortcut, language, tags, description, status, service_line</p><p className="mt-2 text-[10px] font-bold text-slate-500">{rows.length} ligne(s) chargée(s). Aucun enregistrement n’est écrit avant validation.</p></div>
      {preview ? <div className="mt-4 grid gap-3 sm:grid-cols-4"><Count label="Total" value={preview.summary.total} /><Count label="Valides" value={preview.summary.valid} /><Count label="Avertissements" value={preview.summary.warnings} /><Count label="Rejetées" value={preview.summary.rejected} /></div> : null}
    </ModalFrame>
  )
}

function Count({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-200 p-3"><p className="text-lg font-black text-slate-950">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p></div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.14em] text-slate-600">{label}</span>{children}</label> }
