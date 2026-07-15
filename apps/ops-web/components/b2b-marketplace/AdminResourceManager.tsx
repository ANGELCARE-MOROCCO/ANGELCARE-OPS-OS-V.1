'use client'

import { FormEvent, useEffect, useMemo, useState, useTransition } from 'react'
import type { AdminResourceDefinition, AdminFieldDefinition } from '@/lib/b2b-marketplace/admin-resources'

type RecordRow = Record<string, any>
type SaveState = {
  kind: 'idle' | 'saving' | 'success' | 'error'
  title: string
  detail: string
  persistenceMode?: string
  warning?: string
  timestamp?: string
}

function stringifyValue(value: unknown, field: AdminFieldDefinition) {
  if (field.type === 'array') return Array.isArray(value) ? value.join(', ') : String(value || '')
  if (field.type === 'json') return JSON.stringify(value ?? {}, null, 2)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return value === null || value === undefined ? '' : String(value)
}

function parseValue(value: FormDataEntryValue | null, field: AdminFieldDefinition) {
  if (field.type === 'boolean') return value === 'on' || value === 'true'
  const raw = String(value ?? '').trim()
  if (field.type === 'number') return raw ? Number(raw) : 0
  if (field.type === 'array') return raw.split(',').map((item) => item.trim()).filter(Boolean)
  if (field.type === 'json') {
    try { return raw ? JSON.parse(raw) : {} } catch { return {} }
  }
  return raw
}

function broadcastMarketplaceSync(resource: string, action: string) {
  const payload = { resource, action, ts: Date.now() }
  try { localStorage.setItem('angelcare:b2b-marketplace:admin-sync', JSON.stringify(payload)) } catch {}
  try { new BroadcastChannel('angelcare:b2b-marketplace').postMessage(payload) } catch {}
}

function statusStyles(kind: SaveState['kind']) {
  if (kind === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  if (kind === 'error') return 'border-rose-200 bg-rose-50 text-rose-900'
  if (kind === 'saving') return 'border-blue-200 bg-blue-50 text-blue-950'
  return 'border-[#dbe7f6] bg-[#f9fbfe] text-[#0f2f5f]'
}

export default function AdminResourceManager({ definition, initialRows }: { definition: AdminResourceDefinition; initialRows: unknown }) {
  const [rows, setRows] = useState<RecordRow[]>(Array.isArray(initialRows) ? initialRows as RecordRow[] : initialRows ? [initialRows as RecordRow] : [])
  const [selected, setSelected] = useState<RecordRow | null>(rows[0] || null)
  const [filter, setFilter] = useState('')
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle', title: 'Prêt', detail: 'Aucune sauvegarde en cours.' })
  const [isPending, startTransition] = useTransition()

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q))
  }, [rows, filter])

  useEffect(() => {
    if (saveState.kind !== 'success') return
    const timeout = window.setTimeout(() => setSaveState((current) => current.kind === 'success' ? { ...current, title: 'Synchronisé', detail: current.detail } : current), 4000)
    return () => window.clearTimeout(timeout)
  }, [saveState.kind])

  async function refresh(keepSelectedId?: string) {
    const res = await fetch(`/api/b2b-marketplace/admin/${definition.resource}?t=${Date.now()}`, { cache: 'no-store' })
    const payload = await res.json()
    const nextRows = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : []
    setRows(nextRows)
    if (keepSelectedId) {
      setSelected(nextRows.find((row: RecordRow) => String(row[definition.idField] || row[definition.keyField || '']) === keepSelectedId) || nextRows[0] || null)
    } else {
      setSelected(nextRows[0] || null)
    }
    return payload
  }

  async function save(formData: FormData) {
    setSaveState({ kind: 'saving', title: 'Sauvegarde réelle en cours...', detail: 'Écriture admin + invalidation du front public + refresh des données.' })
    const body: RecordRow = {}
    for (const field of definition.fields) body[field.name] = parseValue(formData.get(field.name), field)
    const id = formData.get('__id')?.toString()
    const method = id ? 'PATCH' : 'POST'
    if (id) body[definition.idField] = id
    const startedAt = Date.now()

    const res = await fetch(`/api/b2b-marketplace/admin/${definition.resource}${id ? `?id=${encodeURIComponent(id)}` : ''}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await res.json().catch(() => ({}))

    if (!res.ok || !payload.ok) {
      setSaveState({
        kind: 'error',
        title: 'Sauvegarde échouée',
        detail: payload.error || 'Aucune confirmation API reçue. Rien ne sera considéré comme sauvegardé.',
        timestamp: new Date().toLocaleTimeString('fr-FR'),
      })
      return
    }

    const savedId = String(payload.data?.[definition.idField] || payload.data?.[definition.keyField || ''] || id || '')
    await refresh(savedId)
    broadcastMarketplaceSync(definition.resource, payload.action || method.toLowerCase())

    const duration = Date.now() - startedAt
    setSaveState({
      kind: 'success',
      title: '✅ Sauvegarde confirmée',
      detail: `Écriture validée, ${definition.resource} rafraîchi, front public invalidé. Temps: ${duration}ms.`,
      persistenceMode: payload.persistenceMode || 'unknown',
      warning: payload.warning,
      timestamp: new Date().toLocaleTimeString('fr-FR'),
    })
  }

  async function remove(row: RecordRow) {
    const id = String(row[definition.idField] || row[definition.keyField || ''] || '')
    if (!id) return
    const confirmed = window.confirm('Supprimer cet enregistrement ? Cette action impacte le front public après synchronisation.')
    if (!confirmed) return
    setSaveState({ kind: 'saving', title: 'Suppression en cours...', detail: 'Suppression admin + invalidation front public.' })
    const res = await fetch(`/api/b2b-marketplace/admin/${definition.resource}?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok || !payload.ok) {
      setSaveState({ kind: 'error', title: 'Suppression échouée', detail: payload.error || 'Suppression impossible.', timestamp: new Date().toLocaleTimeString('fr-FR') })
      return
    }
    await refresh()
    broadcastMarketplaceSync(definition.resource, 'delete')
    setSaveState({ kind: 'success', title: '✅ Suppression confirmée', detail: 'Record supprimé et front public invalidé.', persistenceMode: payload.persistenceMode, warning: payload.warning, timestamp: new Date().toLocaleTimeString('fr-FR') })
  }

  function duplicate(row: RecordRow) {
    const clone = { ...row }
    delete clone[definition.idField]
    if (definition.keyField && clone[definition.keyField]) clone[definition.keyField] = `${clone[definition.keyField]}-copy-${Date.now()}`
    if ('slug' in clone && clone.slug) clone.slug = `${clone.slug}-copy-${Date.now()}`
    if ('reference_code' in clone && clone.reference_code) clone.reference_code = `${clone.reference_code}-COPY-${Date.now().toString().slice(-4)}`
    setSelected(clone)
    setSaveState({ kind: 'idle', title: 'Duplicata prêt', detail: 'Vérifiez la référence/slug puis sauvegardez pour créer un vrai nouveau record.' })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
      <section className="rounded-[34px] border border-[#dbe7f6] bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Records synchronisés</h2>
            <p className="mt-1 text-sm text-slate-500">{filteredRows.length} / {rows.length} éléments · source active: API admin</p>
          </div>
          <button onClick={() => setSelected({})} className="rounded-full bg-[#0f2f5f] px-5 py-3 text-sm font-black text-white">+ Nouveau</button>
        </div>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrer par titre, ref, slug, prix..." className="mt-5 w-full rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold outline-none focus:border-[#0f2f5f]" />
        <div className="mt-5 grid max-h-[760px] gap-3 overflow-auto pr-1">
          {filteredRows.map((row, index) => {
            const title = String(row.title || row.name || row.label || row.reference_code || row.section_key || row.gateway_key || row.template_key || row.setting_key || row.id || 'Record')
            const subtitle = String(row.subtitle || row.short_description || row.description || row.href || row.slug || '')
            const status = String(row.status || (row.is_visible === false ? 'hidden' : row.is_active === false ? 'inactive' : 'active'))
            const id = String(row[definition.idField] || `${title}-${index}`)
            return (
              <article key={id} className={`rounded-[26px] border p-4 transition ${selected === row ? 'border-[#0f2f5f] bg-[#eef4ff]' : 'border-[#edf2f8] bg-[#f9fbfe] hover:border-[#cbdced]'}`}>
                <button onClick={() => setSelected(row)} className="block w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-950">{title}</h3>
                      {subtitle ? <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{subtitle}</p> : null}
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#0f2f5f]">{status}</span>
                  </div>
                </button>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => setSelected(row)} className="rounded-full border border-[#d7e3f3] bg-white px-3 py-1.5 text-xs font-black text-[#0f2f5f]">Éditer</button>
                  <button onClick={() => duplicate(row)} className="rounded-full border border-[#d7e3f3] bg-white px-3 py-1.5 text-xs font-black text-slate-700">Dupliquer</button>
                  <button onClick={() => startTransition(() => { void remove(row) })} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700">Supprimer</button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="rounded-[34px] border border-[#dbe7f6] bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-[#0f2f5f]">Backoffice opérationnel</div>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{selected && Object.keys(selected).length ? 'Modifier record' : 'Créer nouveau record'}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{definition.publicImpact}</p>
          </div>
          <button onClick={() => startTransition(() => { void refresh() })} className="rounded-full border border-[#d7e3f3] bg-[#f9fbfe] px-4 py-2 text-xs font-black text-[#0f2f5f]">Rafraîchir</button>
        </div>

        <div className={`mt-5 rounded-3xl border px-5 py-4 text-sm shadow-sm ${statusStyles(saveState.kind)}`}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-black">{saveState.kind === 'saving' ? '⏳ ' : ''}{saveState.title}</div>
              <div className="mt-1 leading-6 opacity-80">{saveState.detail}</div>
              {saveState.warning ? <div className="mt-2 rounded-2xl bg-white/70 px-3 py-2 text-xs font-black">Mode local activé: {saveState.warning}</div> : null}
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide">
              {saveState.persistenceMode ? <span className="rounded-full bg-white/70 px-3 py-1">{saveState.persistenceMode}</span> : null}
              {saveState.timestamp ? <span className="rounded-full bg-white/70 px-3 py-1">{saveState.timestamp}</span> : null}
            </div>
          </div>
        </div>

        <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const formData = new FormData(event.currentTarget); startTransition(() => { void save(formData) }) }} className="mt-6 grid gap-4 md:grid-cols-2">
          {selected?.[definition.idField] ? <input type="hidden" name="__id" value={String(selected[definition.idField])} /> : null}
          {definition.fields.map((field) => <FieldEditor key={`${field.name}-${String(selected?.[definition.idField] || selected?.[definition.keyField || 'new'] || 'new')}`} field={field} value={selected?.[field.name]} />)}
          <div className="md:col-span-2 flex flex-wrap gap-3 border-t border-[#edf2f8] pt-5">
            <button disabled={isPending} className="rounded-full bg-[#0f2f5f] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/15 disabled:cursor-not-allowed disabled:opacity-60">{isPending || saveState.kind === 'saving' ? 'Sauvegarde réelle...' : 'Sauvegarder + synchroniser le front'}</button>
            <a href="/b2b-marketplace" target="_blank" className="rounded-full border border-[#d7e3f3] bg-white px-6 py-3 text-sm font-black text-[#0f2f5f]">Prévisualiser public</a>
            <button type="button" onClick={() => setSelected({})} className="rounded-full border border-[#d7e3f3] bg-[#f9fbfe] px-6 py-3 text-sm font-black text-slate-700">Nouveau vide</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function FieldEditor({ field, value }: { field: AdminFieldDefinition; value: unknown }) {
  const common = 'w-full rounded-2xl border border-[#dbe7f6] bg-[#f9fbfe] px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-[#0f2f5f]'
  return (
    <label className={field.wide || field.type === 'textarea' || field.type === 'json' ? 'md:col-span-2' : ''}>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">{field.label}{field.required ? ' *' : ''}</span>
      {field.type === 'textarea' ? <textarea name={field.name} defaultValue={stringifyValue(value, field)} rows={4} className={common} /> : null}
      {field.type === 'json' ? <textarea name={field.name} defaultValue={stringifyValue(value, field)} rows={8} className={`${common} font-mono text-xs`} /> : null}
      {field.type === 'boolean' ? <input name={field.name} type="checkbox" defaultChecked={Boolean(value)} className="h-6 w-6 rounded border-[#dbe7f6] accent-[#0f2f5f]" /> : null}
      {field.type === 'select' ? (
        <select name={field.name} defaultValue={stringifyValue(value, field)} className={common}>
          <option value="">Sélectionner</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : null}
      {field.type !== 'textarea' && field.type !== 'json' && field.type !== 'boolean' && field.type !== 'select' ? (
        <input name={field.name} type={field.type === 'number' ? 'number' : field.type === 'color' ? 'color' : 'text'} defaultValue={stringifyValue(value, field)} className={field.type === 'color' ? 'h-12 w-full rounded-2xl border border-[#dbe7f6] bg-white p-2' : common} />
      ) : null}
      {field.help ? <span className="mt-1 block text-xs text-slate-400">{field.help}</span> : null}
    </label>
  )
}
