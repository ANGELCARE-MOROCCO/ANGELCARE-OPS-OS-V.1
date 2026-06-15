'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  MessageSquareText,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

type BoardItem = {
  id: string
  category: 'memo' | 'comment' | 'alert' | 'reminder'
  title: string
  body: string
  owner: string
  priority: 'Basse' | 'Normale' | 'Haute' | 'Critique'
  status: 'Ouvert' | 'En cours' | 'À suivre' | 'Acknowledged' | 'Clôturé'
  dueDate: string
  createdAt: string
  acknowledgedAt?: string
}

const STORAGE_KEY = 'angelcare-hr-departments-board-command-v1'

const categories = [
  { key: 'alert', label: 'Alertes actives', icon: AlertTriangle, tone: 'rose' },
  { key: 'memo', label: 'Mémos', icon: FileText, tone: 'violet' },
  { key: 'comment', label: 'Commentaires', icon: MessageSquareText, tone: 'cyan' },
  { key: 'reminder', label: 'Board reminders', icon: BellRing, tone: 'amber' },
] as const

function makeId() {
  return `board-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function todayPlus(days = 0) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
}

function seedItems(): BoardItem[] {
  return [
    {
      id: makeId(),
      category: 'alert',
      title: 'Revue urgente des départements sans responsable',
      body: 'Identifier les départements sans manager assigné et déclencher une validation RH.',
      owner: 'HR Command',
      priority: 'Haute',
      status: 'Ouvert',
      dueDate: todayPlus(1),
      createdAt: new Date().toISOString(),
    },
    {
      id: makeId(),
      category: 'reminder',
      title: 'Préparer le point board organisation RH',
      body: 'Consolider les changements de structure, effectifs, équipes et risques départementaux.',
      owner: 'HR Manager',
      priority: 'Normale',
      status: 'À suivre',
      dueDate: todayPlus(3),
      createdAt: new Date().toISOString(),
    },
    {
      id: makeId(),
      category: 'memo',
      title: 'Note structure organisationnelle',
      body: 'Toutes les créations de sous-départements et équipes doivent être alignées avec le modèle RH production.',
      owner: 'AngelCare HR',
      priority: 'Normale',
      status: 'Ouvert',
      dueDate: todayPlus(7),
      createdAt: new Date().toISOString(),
    },
  ]
}

function toneClasses(tone: string, active = false) {
  const tones: Record<string, string> = {
    rose: active ? 'border-rose-300 bg-rose-50 text-rose-800 ring-4 ring-rose-100' : 'border-rose-100 bg-rose-50 text-rose-700',
    violet: active ? 'border-violet-300 bg-violet-50 text-violet-800 ring-4 ring-violet-100' : 'border-violet-100 bg-violet-50 text-violet-700',
    cyan: active ? 'border-cyan-300 bg-cyan-50 text-cyan-800 ring-4 ring-cyan-100' : 'border-cyan-100 bg-cyan-50 text-cyan-700',
    amber: active ? 'border-amber-300 bg-amber-50 text-amber-800 ring-4 ring-amber-100' : 'border-amber-100 bg-amber-50 text-amber-700',
    emerald: active ? 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100' : 'border-emerald-100 bg-emerald-50 text-emerald-700',
    slate: active ? 'border-slate-300 bg-slate-50 text-slate-800 ring-4 ring-slate-100' : 'border-slate-200 bg-slate-50 text-slate-700',
  }
  return tones[tone] || tones.slate
}

function priorityTone(priority: string) {
  if (priority === 'Critique') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (priority === 'Haute') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (priority === 'Basse') return 'border-slate-200 bg-slate-50 text-slate-600'
  return 'border-emerald-100 bg-emerald-50 text-emerald-700'
}

function emptyDraft(category: BoardItem['category']): BoardItem {
  return {
    id: makeId(),
    category,
    title: '',
    body: '',
    owner: 'HR AngelCare',
    priority: category === 'alert' ? 'Haute' : 'Normale',
    status: 'Ouvert',
    dueDate: todayPlus(category === 'alert' ? 1 : 3),
    createdAt: new Date().toISOString(),
  }
}

export default function DepartmentsBoardCommandClient() {
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<BoardItem[]>([])
  const [activeCategory, setActiveCategory] = useState<BoardItem['category']>('alert')
  const [selectedId, setSelectedId] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<BoardItem>(emptyDraft('alert'))

  useEffect(() => {
    setMounted(true)
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
      if (Array.isArray(stored) && stored.length) {
        setItems(stored)
        setSelectedId(stored[0]?.id || '')
        return
      }
    } catch {
      // ignore invalid storage
    }

    const seeded = seedItems()
    setItems(seeded)
    setSelectedId(seeded[0]?.id || '')
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  }, [])

  function persist(next: BoardItem[]) {
    setItems(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // local storage unavailable
    }
  }

  const activeItems = items.filter((item) => item.category === activeCategory)
  const selected = items.find((item) => item.id === selectedId) || activeItems[0] || null

  const dashboard = useMemo(() => {
    const openAlerts = items.filter((item) => item.category === 'alert' && item.status !== 'Acknowledged' && item.status !== 'Clôturé').length
    const openItems = items.filter((item) => item.status !== 'Acknowledged' && item.status !== 'Clôturé').length
    const acknowledged = items.filter((item) => item.status === 'Acknowledged').length
    const critical = items.filter((item) => item.priority === 'Critique' || item.priority === 'Haute').length
    return { openAlerts, openItems, acknowledged, critical }
  }, [items])

  function startNew(category = activeCategory) {
    const next = emptyDraft(category)
    setDraft(next)
    setEditing(true)
    setSelectedId('')
  }

  function startEdit(item: BoardItem) {
    setDraft(item)
    setEditing(true)
    setSelectedId(item.id)
  }

  function saveDraft() {
    const clean: BoardItem = {
      ...draft,
      title: draft.title.trim() || 'Nouvelle note RH',
      body: draft.body.trim() || 'À compléter.',
      updatedAt: new Date().toISOString(),
    } as BoardItem

    const exists = items.some((item) => item.id === clean.id)
    const next = exists ? items.map((item) => (item.id === clean.id ? clean : item)) : [clean, ...items]
    persist(next)
    setSelectedId(clean.id)
    setActiveCategory(clean.category)
    setEditing(false)
  }

  function deleteItem(id: string) {
    const next = items.filter((item) => item.id !== id)
    persist(next)
    const fallback = next.find((item) => item.category === activeCategory) || next[0]
    setSelectedId(fallback?.id || '')
    setEditing(false)
  }

  function acknowledge(item: BoardItem) {
    const next = items.map((row) =>
      row.id === item.id
        ? { ...row, status: 'Acknowledged' as const, acknowledgedAt: new Date().toISOString() }
        : row,
    )
    persist(next)
  }

  function reopen(item: BoardItem) {
    const next = items.map((row) =>
      row.id === item.id
        ? { ...row, status: 'Ouvert' as const, acknowledgedAt: undefined }
        : row,
    )
    persist(next)
  }

  if (!mounted) {
    return (
      <section className="rounded-[34px] border border-white/80 bg-white p-6 shadow-xl shadow-slate-200/60">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-violet-700">Loading board command</p>
        <p className="mt-2 text-xl font-black text-slate-950">Preparing memos, alerts and reminders...</p>
      </section>
    )
  }

  return (
    <section className="w-full min-w-0 rounded-[38px] border border-white/80 bg-white p-5 shadow-2xl shadow-slate-200/70 ring-1 ring-slate-100 overflow-x-auto overflow-y-visible">
      <div className="flex min-w-0 flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-violet-700">Department board command</p>
          <h2 className="mt-2 max-w-5xl text-3xl font-black tracking-[-0.04em] text-slate-950 lg:text-4xl">Mémos, commentaires, alertes & board reminders</h2>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
            Gestion dynamique des notes d’organisation, rappels board, commentaires RH et alertes ouvertes.
            Les alertes restent visibles et animées jusqu’à lecture et acknowledgement.
          </p>
        </div>

        <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:max-w-[680px]">
          <div className={dashboard.openAlerts ? 'rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm animate-pulse' : 'rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-slate-700'}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em]">Alertes ouvertes</p>
            <p className="mt-1 text-3xl font-black">{dashboard.openAlerts}</p>
          </div>
          <div className="rounded-[24px] border border-violet-100 bg-violet-50 p-4 text-violet-800">
            <p className="text-[10px] font-black uppercase tracking-[0.18em]">Items actifs</p>
            <p className="mt-1 text-3xl font-black">{dashboard.openItems}</p>
          </div>
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
            <p className="text-[10px] font-black uppercase tracking-[0.18em]">Acknowledged</p>
            <p className="mt-1 text-3xl font-black">{dashboard.acknowledged}</p>
          </div>
          <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-4 text-amber-800">
            <p className="text-[10px] font-black uppercase tracking-[0.18em]">Prioritaires</p>
            <p className="mt-1 text-3xl font-black">{dashboard.critical}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-black text-slate-500">Workspace scroll enabled · swipe / trackpad left-right and scroll up-down when needed.</p>
        <div className="flex gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-600 ring-1 ring-slate-100">← horizontal</span>
          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-600 ring-1 ring-slate-100">vertical ↓</span>
        </div>
      </div>

      <div className="-mx-2 mt-4 max-h-[760px] overflow-x-auto overflow-y-auto px-2 pb-4"><div className="grid min-w-[1180px] gap-5 2xl:grid-cols-[300px_minmax(520px,1fr)_420px]">
        <aside className="min-w-0 rounded-[30px] border border-slate-200 bg-slate-50 p-3 max-h-[720px] overflow-y-auto">
          <div className="grid gap-2">
            {categories.map((category) => {
              const Icon = category.icon
              const count = items.filter((item) => item.category === category.key).length
              const open = items.filter((item) => item.category === category.key && item.status !== 'Acknowledged' && item.status !== 'Clôturé').length
              const active = activeCategory === category.key
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.key)
                    const first = items.find((item) => item.category === category.key)
                    setSelectedId(first?.id || '')
                    setEditing(false)
                  }}
                  className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${toneClasses(category.tone, active)} ${
                    category.key === 'alert' && open ? 'animate-pulse' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 h-5 w-5" />
                      <div>
                        <p className="text-sm font-black">{category.label}</p>
                        <p className="mt-1 text-xs font-bold opacity-70">{count} item(s) · {open} ouvert(s)</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-700">{count}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => startNew()}
            className="mt-3 w-full rounded-[22px] bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-lg transition hover:bg-violet-700"
          >
            <Plus className="mr-2 inline h-4 w-4" />
            Ajouter
          </button>
        </aside>

        <main className="min-w-0 rounded-[30px] border border-slate-200 bg-white p-4 max-h-[720px] overflow-y-auto">
          <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Live board queue</p>
              <h3 className="mt-1 text-2xl font-black text-slate-950 break-words">{categories.find((c) => c.key === activeCategory)?.label}</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => startNew('alert')} className="rounded-full border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">+ Alerte</button>
              <button type="button" onClick={() => startNew('memo')} className="rounded-full border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">+ Mémo</button>
              <button type="button" onClick={() => startNew('reminder')} className="rounded-full border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">+ Reminder</button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {activeItems.length ? activeItems.map((item) => {
              const isOpenAlert = item.category === 'alert' && item.status !== 'Acknowledged' && item.status !== 'Clôturé'
              const isSelected = selected?.id === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(item.id)
                    setEditing(false)
                  }}
                  className={`rounded-[26px] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-xl ${
                    isSelected ? 'border-violet-200 bg-violet-50' : 'border-slate-200 bg-slate-50/70'
                  } ${isOpenAlert ? 'animate-pulse ring-2 ring-rose-100' : ''}`}
                >
                  <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-base font-black text-slate-950">{item.title}</p>
                        {isOpenAlert ? <span className="rounded-full bg-rose-600 px-2 py-1 text-[10px] font-black text-white">FLASHING</span> : null}
                      </div>
                      <p className="mt-1 line-clamp-3 text-sm font-bold leading-6 text-slate-500">{item.body}</p>
                      <p className="mt-2 text-xs font-black text-slate-400">{item.owner} · échéance {item.dueDate}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${priorityTone(item.priority)}`}>{item.priority}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black text-slate-600">{item.status}</span>
                    </div>
                  </div>
                </button>
              )
            }) : (
              <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-lg font-black text-slate-950">Aucun item dans cette catégorie</p>
                <p className="mt-2 text-sm font-bold text-slate-500">Créez un mémo, commentaire, alerte ou reminder board.</p>
              </div>
            )}
          </div>
        </main>

        <aside className="min-w-0 rounded-[30px] border border-slate-200 bg-slate-50 p-4 max-h-[720px] overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{editing ? 'Edit mode' : 'Selected item'}</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">{editing ? 'Modifier / ajouter' : selected?.title || 'Aucun item'}</h3>
            </div>
            {selected && !editing ? (
              <button type="button" onClick={() => startEdit(selected)} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700">
                <Pencil className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {editing ? (
            <div className="mt-4 grid gap-3">
              <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Catégorie</span>
                <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as BoardItem['category'] })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold">
                  <option value="alert">Alerte</option>
                  <option value="memo">Mémo</option>
                  <option value="comment">Commentaire</option>
                  <option value="reminder">Board reminder</option>
                </select>
              </label>

              <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Titre</span>
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold" />
              </label>

              <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Détail</span>
                <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={5} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold" />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Priorité</span>
                  <select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as BoardItem['priority'] })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold">
                    <option>Basse</option>
                    <option>Normale</option>
                    <option>Haute</option>
                    <option>Critique</option>
                  </select>
                </label>

                <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Statut</span>
                  <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as BoardItem['status'] })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold">
                    <option>Ouvert</option>
                    <option>En cours</option>
                    <option>À suivre</option>
                    <option>Acknowledged</option>
                    <option>Clôturé</option>
                  </select>
                </label>
              </div>

              <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Échéance</span>
                <input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold" />
              </label>

              <label className="block rounded-2xl bg-white p-3 ring-1 ring-slate-100">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Owner</span>
                <input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold" />
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={saveDraft} className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white">
                  <Save className="mr-2 inline h-4 w-4" />
                  Save
                </button>
                <button type="button" onClick={() => setEditing(false)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                  <X className="mr-2 inline h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : selected ? (
            <div className="mt-4 grid gap-3">
              <div className={`rounded-[26px] border p-4 ${selected.category === 'alert' && selected.status !== 'Acknowledged' && selected.status !== 'Clôturé' ? 'border-rose-200 bg-rose-50 animate-pulse' : 'border-slate-200 bg-white'}`}>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${priorityTone(selected.priority)}`}>{selected.priority}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black text-slate-600">{selected.status}</span>
                </div>
                <p className="mt-4 text-sm font-bold leading-6 text-slate-600">{selected.body}</p>
                <p className="mt-4 text-xs font-black text-slate-400">Owner: {selected.owner} · Échéance: {selected.dueDate}</p>
                {selected.acknowledgedAt ? (
                  <p className="mt-2 text-xs font-black text-emerald-700">Acknowledged: {new Date(selected.acknowledgedAt).toLocaleString()}</p>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {selected.status === 'Acknowledged' ? (
                  <button type="button" onClick={() => reopen(selected)} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-black text-amber-700">
                    Reopen
                  </button>
                ) : (
                  <button type="button" onClick={() => acknowledge(selected)} className="rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black text-white">
                    <CheckCircle2 className="mr-2 inline h-4 w-4" />
                    Roger / Acknowledge
                  </button>
                )}

                <button type="button" onClick={() => startEdit(selected)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700">
                  <Eye className="mr-2 inline h-4 w-4" />
                  View / Edit
                </button>

                <button type="button" onClick={() => deleteItem(selected.id)} className="col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black text-rose-700">
                  <Trash2 className="mr-2 inline h-4 w-4" />
                  Delete item
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-500">
              Select or create an item.
            </div>
          )}
        </aside>
      </div></div>
    </section>
  )
}
