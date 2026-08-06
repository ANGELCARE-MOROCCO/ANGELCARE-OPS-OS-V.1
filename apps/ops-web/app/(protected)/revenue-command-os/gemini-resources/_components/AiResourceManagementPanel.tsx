'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, Beaker, Copy, Database, Loader2, Pencil, Play, Plus, Power, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { emitRevenueAction, managedRevenueHeaders, revenueActionId } from '../../_components/action-center/action-events'

type ResourceRow = {
  id: string
  code: string
  version: string
  status: string
  purpose: string
  allowed_data_class: string
  content: Record<string, any>
  updated_at: string
}

type Draft = {
  id?: string
  code: string
  version: string
  name: string
  resourceType: string
  description: string
  domain: string
  provider: string
  modelName: string
  promptVersion: string
  contentReference: string
  contextAdapter: string
  toolName: string
  maxTokens: string
  temperature: string
  allowedDataClass: string
  tags: string
}

const blank: Draft = { code: '', version: '1.0', name: '', resourceType: 'context-adapter', description: '', domain: 'revenue', provider: 'gemini', modelName: '', promptVersion: '1.0', contentReference: '', contextAdapter: '', toolName: '', maxTokens: '12000', temperature: '0.2', allowedDataClass: 'internal', tags: '' }

async function request(path: string, init?: RequestInit) {
  const response = await fetch(path, init)
  const body = await response.json().catch(() => ({}))
  if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Opération impossible.')
  return body.data
}

export default function AiResourceManagementPanel({ onChanged }: { onChanged?: () => void }) {
  const [resources, setResources] = useState<ResourceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [message, setMessage] = useState('')
  const [testResult, setTestResult] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await request(`/api/revenue-command-os/ai-resources?q=${encodeURIComponent(query)}`, { cache: 'no-store' })
      setResources(Array.isArray(data?.resources) ? data.resources : [])
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)) }
    finally { setLoading(false) }
  }, [query])

  useEffect(() => { const timer = setTimeout(() => { void load() }, 180); return () => clearTimeout(timer) }, [load])

  const metrics = useMemo(() => ({ active: resources.filter((item) => item.status === 'active').length, inactive: resources.filter((item) => item.status === 'inactive').length, archived: resources.filter((item) => item.status === 'archived').length }), [resources])

  async function mutate(title: string, action: string, payload: Record<string, unknown>) {
    const actionId = revenueActionId('ai-resource')
    const startedAt = new Date().toISOString()
    setBusy(`${action}:${String(payload.id || payload.code || '')}`)
    setMessage('')
    emitRevenueAction({ id: actionId, title, workspace: 'gemini-resources', state: 'running', step: 'Synchronisation du registre', progress: 38, startedAt })
    try {
      const data = await request('/api/revenue-command-os/ai-resources', {
        method: 'POST',
        headers: managedRevenueHeaders({ 'Content-Type': 'application/json', 'x-revenue-action-id': actionId }),
        body: JSON.stringify({ action, payload }),
      })
      emitRevenueAction({ id: actionId, title, workspace: 'gemini-resources', state: 'success', step: 'Registre synchronisé', progress: 100, startedAt, completedAt: new Date().toISOString(), resultHref: '/revenue-command-os/gemini-resources', auditHref: '/revenue-command-os/audit', dismissible: true })
      window.dispatchEvent(new CustomEvent('revenue-os:operation-completed', { detail: data }))
      await load()
      onChanged?.()
      return data
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      emitRevenueAction({ id: actionId, title, workspace: 'gemini-resources', state: 'failure', step: 'Échec', progress: 100, startedAt, completedAt: new Date().toISOString(), error: detail, auditHref: '/revenue-command-os/audit', dismissible: true })
      setMessage(detail)
      throw error
    } finally { setBusy('') }
  }

  function edit(row: ResourceRow) {
    setDraft({
      id: row.id, code: row.code, version: row.version, name: String(row.content?.name || row.purpose), resourceType: String(row.content?.resourceType || ''), description: String(row.content?.description || row.purpose), domain: String(row.content?.domain || ''), provider: String(row.content?.provider || 'gemini'), modelName: String(row.content?.modelName || ''), promptVersion: String(row.content?.promptVersion || '1.0'), contentReference: String(row.content?.contentReference || ''), contextAdapter: String(row.content?.contextAdapter || ''), toolName: String(row.content?.toolName || ''), maxTokens: String(row.content?.maxTokens || 12000), temperature: String(row.content?.temperature ?? 0.2), allowedDataClass: row.allowed_data_class || 'internal', tags: Array.isArray(row.content?.tags) ? row.content.tags.join('|') : '',
    })
  }

  async function save() {
    if (!draft) return
    await mutate(draft.id ? 'Ressource mise à jour' : 'Ressource créée', draft.id ? 'update' : 'create', {
      ...draft,
      maxTokens: Number(draft.maxTokens || 12000), temperature: Number(draft.temperature || 0.2), tags: draft.tags.split('|').map((item) => item.trim()).filter(Boolean),
    })
    setDraft(null)
  }

  async function test(row: ResourceRow) {
    const result = await mutate('Contrôle structurel terminé', 'test', { id: row.id })
    setTestResult(result)
  }

  return <section className="revenue-ai-resource-studio mt-7 rounded-[34px] border border-blue-200 bg-white p-5 shadow-[0_24px_75px_rgba(30,64,175,.08)] sm:p-7">
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-700">Resource Operations Studio</p><h2 className="mt-2 text-2xl font-black text-slate-950">Créer, modifier, contrôler et activer les ressources IA.</h2><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">Chaque ressource conserve son code, sa version, son type, ses schémas, son modèle et sa référence de contenu. Les mutations sont persistées et auditées.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setDraft({ ...blank })} className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-xs font-black text-white"><Plus size={16}/>Nouvelle ressource</button><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}Actualiser</button></div></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">{[['Actives', metrics.active, 'text-emerald-700'], ['Inactives', metrics.inactive, 'text-amber-700'], ['Archivées', metrics.archived, 'text-slate-700']].map(([label, value, tone]) => <div key={String(label)} className="rounded-2xl bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><p className={`mt-2 text-2xl font-black ${tone}`}>{value}</p></div>)}</div>
    <label className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><Search size={16} className="text-slate-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Code, nom, type, domaine…" className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"/></label>
    {message ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{message}</p> : null}
    {testResult ? <div className={`mt-4 rounded-2xl border p-4 ${testResult.valid ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><p className="text-xs font-black text-slate-950">Contrôle structurel {testResult.code} · {testResult.valid ? 'exploitable' : 'à compléter'}</p><div className="mt-2 flex flex-wrap gap-2">{(testResult.checks || []).map((check: any) => <span key={check.key} className={`rounded-full px-2.5 py-1 text-[9px] font-black ${check.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{check.label}</span>)}</div></div> : null}
    <div className="mt-5 grid gap-4 xl:grid-cols-2">{resources.map((row) => <article key={row.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[10px] font-black text-blue-700">{row.code}@{row.version}</p><h3 className="mt-2 text-sm font-black text-slate-950">{row.content?.name || row.purpose}</h3><p className="mt-1 text-[11px] font-semibold text-slate-500">{row.content?.resourceType || 'resource'} · {row.content?.provider || 'gemini'} · {row.content?.domain || 'revenue'}</p></div><span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase ${row.status === 'active' ? 'bg-emerald-100 text-emerald-800' : row.status === 'archived' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'}`}>{row.status}</span></div><p className="mt-4 text-xs font-semibold leading-5 text-slate-700">{row.content?.description || row.purpose}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => edit(row)} className="action"><Pencil size={13}/>Modifier</button><button type="button" onClick={() => void test(row)} className="action"><Beaker size={13}/>Contrôler</button><button type="button" onClick={() => void mutate('Ressource dupliquée', 'duplicate', { id: row.id })} className="action"><Copy size={13}/>Dupliquer</button><button type="button" onClick={() => void mutate(row.status === 'active' ? 'Ressource désactivée' : 'Ressource activée', row.status === 'active' ? 'deactivate' : 'activate', { id: row.id })} className={`action ${row.status === 'active' ? '!bg-amber-50 !text-amber-800' : '!bg-emerald-50 !text-emerald-800'}`}><Power size={13}/>{row.status === 'active' ? 'Désactiver' : 'Activer'}</button><button type="button" onClick={() => void mutate('Ressource archivée', 'archive', { id: row.id })} className="action"><Archive size={13}/>Archiver</button><button type="button" onClick={() => { if (window.confirm(`Supprimer ${row.code} ?`)) void mutate('Ressource supprimée', 'delete', { id: row.id }) }} className="action !bg-rose-50 !text-rose-800"><Trash2 size={13}/>Supprimer</button></div></article>)}{!loading && !resources.length ? <div className="col-span-full rounded-[24px] border border-dashed border-slate-300 p-10 text-center"><Database className="mx-auto text-slate-300"/><h3 className="mt-3 text-sm font-black text-slate-950">Aucune ressource persistée</h3><p className="mt-1 text-xs font-semibold text-slate-500">Créez ou importez la première ressource IA Revenue OS.</p></div> : null}</div>

    {draft ? <div className="fixed inset-0 z-[145] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[30px] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-blue-700">Dossier ressource IA</p><h3 className="mt-1 text-xl font-black text-slate-950">{draft.id ? 'Modifier la ressource' : 'Créer une ressource'}</h3></div><button type="button" onClick={() => setDraft(null)} className="rounded-xl border border-slate-200 p-2 text-slate-500"><X size={18}/></button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Code"><input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} disabled={Boolean(draft.id)} className="field"/></Field><Field label="Version"><input value={draft.version} onChange={(event) => setDraft({ ...draft, version: event.target.value })} className="field"/></Field><Field label="Nom"><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="field"/></Field><Field label="Type"><input value={draft.resourceType} onChange={(event) => setDraft({ ...draft, resourceType: event.target.value })} className="field"/></Field><div className="md:col-span-2"><Field label="Description"><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="field min-h-24"/></Field></div><Field label="Domaine"><input value={draft.domain} onChange={(event) => setDraft({ ...draft, domain: event.target.value })} className="field"/></Field><Field label="Fournisseur"><input value={draft.provider} onChange={(event) => setDraft({ ...draft, provider: event.target.value })} className="field"/></Field><Field label="Modèle"><input value={draft.modelName} onChange={(event) => setDraft({ ...draft, modelName: event.target.value })} className="field"/></Field><Field label="Version prompt"><input value={draft.promptVersion} onChange={(event) => setDraft({ ...draft, promptVersion: event.target.value })} className="field"/></Field><Field label="Référence contenu"><input value={draft.contentReference} onChange={(event) => setDraft({ ...draft, contentReference: event.target.value })} className="field"/></Field><Field label="Context adapter"><input value={draft.contextAdapter} onChange={(event) => setDraft({ ...draft, contextAdapter: event.target.value })} className="field"/></Field><Field label="Tool name"><input value={draft.toolName} onChange={(event) => setDraft({ ...draft, toolName: event.target.value })} className="field"/></Field><Field label="Max tokens"><input type="number" value={draft.maxTokens} onChange={(event) => setDraft({ ...draft, maxTokens: event.target.value })} className="field"/></Field><Field label="Température"><input type="number" step="0.1" value={draft.temperature} onChange={(event) => setDraft({ ...draft, temperature: event.target.value })} className="field"/></Field><Field label="Classe de données"><input value={draft.allowedDataClass} onChange={(event) => setDraft({ ...draft, allowedDataClass: event.target.value })} className="field"/></Field><Field label="Tags séparés par |"><input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} className="field"/></Field></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setDraft(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700">Annuler</button><button type="button" onClick={() => void save()} disabled={Boolean(busy) || !draft.name || !draft.resourceType} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-xs font-black text-white disabled:opacity-40">{busy ? <Loader2 size={14} className="animate-spin"/> : <Play size={14}/>}Enregistrer</button></div></div></div> : null}
    <style>{`.revenue-ai-resource-studio .action{display:inline-flex;align-items:center;gap:6px;border-radius:12px;background:#f8fafc;padding:8px 10px;font-size:10px;font-weight:900;color:#334155}.revenue-ai-resource-studio .field{width:100%;border:1px solid #e2e8f0;border-radius:14px;padding:11px 12px;font-size:12px;font-weight:700;color:#0f172a;outline:none}.revenue-ai-resource-studio .field:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1)}.revenue-ai-resource-studio .field:disabled{background:#f8fafc;color:#64748b}`}</style>
  </section>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[.1em] text-slate-500">{label}</span>{children}</label> }
