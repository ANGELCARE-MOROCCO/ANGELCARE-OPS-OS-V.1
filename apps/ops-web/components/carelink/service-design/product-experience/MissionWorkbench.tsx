'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Clock3,
  Copy,
  GripVertical,
  Layers3,
  Loader2,
  Lock,
  Maximize2,
  Minus,
  Plus,
  Redo2,
  RefreshCw,
  Trash2,
  Undo2,
  Unlock,
  WandSparkles,
} from 'lucide-react'
import type {
  ProductExperienceAudience,
  ProductExperienceDraft,
  ProductExperienceTimelineBlock,
} from '@/types/service-design-product-experience'
import { StudioChip, StudioHero, StudioSurface } from '../studio2030'
import { productExperienceApi } from './client'
import { AudiencePreview } from './AudiencePreview'
import { PeekInspector } from './PeekInspector'
import { PermanentDeleteButton } from './PermanentDeleteButton'

const SNAP = 5
const TRANSFORMATIONS = [
  'Rendre plus calme',
  'Rendre plus actif',
  'Réduire le coût',
  'Simplifier l’exécution',
  'Renforcer le langage',
  'Ajouter de la variété',
  'Réduire les transitions',
  'Créer une version premium',
  'Adapter à une fratrie',
  'Transformer en programme 5 jours',
]

function minute(value: number) {
  const safe = Math.max(0, Math.min(1439, Math.round(value)))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function MissionWorkbench({ scenarioId, workspaceKey: workspaceKeyProp, draftId }: { scenarioId?: string; workspaceKey?: string; draftId?: string }) {
  const [draft, setDraft] = useState<ProductExperienceDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [activeDayId, setActiveDayId] = useState('')
  const [selectedBlock, setSelectedBlock] = useState<ProductExperienceTimelineBlock | null>(null)
  const [audience, setAudience] = useState<ProductExperienceAudience>('designer')
  const [activities, setActivities] = useState<Array<Record<string, unknown>>>([])
  const [activityOpen, setActivityOpen] = useState(false)
  const [transforming, setTransforming] = useState('')
  const [transformationProposal, setTransformationProposal] = useState<{ command: string; result: Record<string, unknown>; actualModel: string } | null>(null)
  const [history, setHistory] = useState<ProductExperienceDraft[]>([])
  const [future, setFuture] = useState<ProductExperienceDraft[]>([])
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const workspaceKey = workspaceKeyProp || `scenario:${scenarioId || ''}`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productExperienceApi<ProductExperienceDraft>(
draftId
          ? `/api/carelink-ops/service-design/product-experience/workbench?draftId=${encodeURIComponent(draftId)}`
          : workspaceKeyProp
            ? `/api/carelink-ops/service-design/product-experience/workbench?workspaceKey=${encodeURIComponent(workspaceKeyProp)}`
            : `/api/carelink-ops/service-design/product-experience/workbench?scenarioId=${encodeURIComponent(scenarioId || '')}`,
      )
      setDraft(data)
      setActiveDayId((current) => current || data.days[0]?.id || '')
      const categoryCode = String(data.state.categoryCode || '')
      if (categoryCode) {
        const list = await productExperienceApi<Array<Record<string, unknown>>>(
          `/api/carelink-ops/service-design/product-experience/inspector?entityType=activity-list&categoryCode=${encodeURIComponent(categoryCode)}`,
        ).catch(() => [])
        setActivities(list)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Workbench impossible à charger.')
    } finally {
      setLoading(false)
    }
  }, [scenarioId, workspaceKeyProp, draftId])

  useEffect(() => {
    void load()
  }, [load])

  const activeDay = draft?.days.find((day) => day.id === activeDayId) || draft?.days[0]

  function scheduleDraftSave(next: ProductExperienceDraft) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveState('saving')
    saveTimer.current = setTimeout(() => {
      void productExperienceApi('/api/carelink-ops/service-design/product-experience/workbench', {
        method: 'PATCH',
        body: JSON.stringify({
          id: next.id,
          state: next.state,
          title: next.title,
          isDirty: false,
          revision: next.revision + 1,
        }),
      })
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'))
    }, 700)
  }

  function commitLocal(next: ProductExperienceDraft) {
    if (draft) {
      setHistory((items) => [...items.slice(-29), clone(draft)])
      setFuture([])
    }
    setDraft(next)
    scheduleDraftSave(next)
  }

  async function reloadAfter(action: () => Promise<unknown>) {
    try {
      setSaveState('saving')
      await action()
      await load()
      setSaveState('saved')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action impossible.')
      setSaveState('error')
    }
  }

  async function patchBlock(block: ProductExperienceTimelineBlock, patch: Partial<ProductExperienceTimelineBlock>) {
    if (!draft) return
    const next = clone(draft)
    const day = next.days.find((item) => item.id === block.dayId)
    const index = day?.blocks.findIndex((item) => item.id === block.id) ?? -1
    if (day && index >= 0) day.blocks[index] = { ...day.blocks[index], ...patch }
    commitLocal(next)
    try {
      await productExperienceApi('/api/carelink-ops/service-design/product-experience/timeline', {
        method: 'PATCH',
        body: JSON.stringify({ kind: 'block', draftId: draft.id, id: block.id, ...patch }),
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Modification impossible.')
    }
  }

  async function duplicateVariant() {
    if (!draft) return
    const result = await productExperienceApi<{ draft: { id: string } }>('/api/carelink-ops/service-design/product-experience/workbench', {
      method: 'POST', body: JSON.stringify({ action: 'duplicate', sourceDraftId: draft.id, title: `${draft.title} · variante` }),
    })
    location.assign(`/carelink-ops/service-design/workbench/draft/${result.draft.id}`)
  }

  async function renameDraft() {
    if (!draft) return
    const title = window.prompt('Nouveau nom du workbench', draft.title)?.trim()
    if (!title || title === draft.title) return
    await productExperienceApi('/api/carelink-ops/service-design/product-experience/workbench', { method: 'PATCH', body: JSON.stringify({ id: draft.id, title }) })
    await load()
  }

  async function createBlock() {
    if (!draft || !activeDay) return
    const start = activeDay.blocks.length
      ? Math.min(
          activeDay.endMinute - 30,
          Math.max(...activeDay.blocks.map((block) => block.startMinute + block.durationMinutes)),
        )
      : activeDay.startMinute
    await reloadAfter(() =>
      productExperienceApi('/api/carelink-ops/service-design/product-experience/timeline', {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_block',
          draftId: draft.id,
          dayId: activeDay.id,
          label: 'Nouveau bloc contrôlé',
          blockType: 'custom',
          startMinute: start,
          durationMinutes: 30,
        }),
      }),
    )
  }

  async function addActivityBlock(row: Record<string, unknown>) {
    if (!draft || !activeDay) return
    const start = activeDay.blocks.length
      ? Math.min(activeDay.endMinute - 30, Math.max(...activeDay.blocks.map((block) => block.startMinute + block.durationMinutes)))
      : activeDay.startMinute
    await reloadAfter(() => productExperienceApi('/api/carelink-ops/service-design/product-experience/timeline', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create_block', draftId: draft.id, dayId: activeDay.id,
        sourceActivityId: String(row.id || ''), sourceCode: String(row.code || ''), blockType: 'activity',
        label: String(row.name || row.label || row.title || 'Activité locale'), objective: String(row.objective || row.description || ''),
        startMinute: start, durationMinutes: Math.max(5, Number(row.default_duration_minutes || row.duration_minutes || row.duration || 45)), metadata: row,
      }),
    }))
  }

  async function deleteBlock(block: ProductExperienceTimelineBlock) {
    if (!draft || !window.confirm(`Supprimer définitivement le bloc « ${block.label} » ?`)) return
    await reloadAfter(() =>
      productExperienceApi(
        `/api/carelink-ops/service-design/product-experience/timeline?kind=block&id=${encodeURIComponent(block.id)}&draftId=${encodeURIComponent(draft.id)}`,
        { method: 'DELETE' },
      ),
    )
    setSelectedBlock(null)
  }

  async function duplicateDay() {
    if (!draft || !activeDay) return
    const date = activeDay.serviceDate ? new Date(`${activeDay.serviceDate}T12:00:00`) : new Date()
    date.setDate(date.getDate() + 1)
    await reloadAfter(() =>
      productExperienceApi('/api/carelink-ops/service-design/product-experience/timeline', {
        method: 'POST',
        body: JSON.stringify({
          action: 'duplicate_day',
          draftId: draft.id,
          dayId: activeDay.id,
          serviceDate: date.toISOString().slice(0, 10),
          label: `${activeDay.label} · copie`,
        }),
      }),
    )
  }

  async function rebalance() {
    if (!draft || !activeDay) return
    await reloadAfter(() =>
      productExperienceApi('/api/carelink-ops/service-design/product-experience/timeline', {
        method: 'POST',
        body: JSON.stringify({ action: 'rebalance', draftId: draft.id, dayId: activeDay.id }),
      }),
    )
  }

  async function persistSnapshot(next: ProductExperienceDraft) {
    setDraft(next)
    await productExperienceApi('/api/carelink-ops/service-design/product-experience/timeline', {
      method: 'POST',
      body: JSON.stringify({ action: 'replace_all', draftId: next.id, days: next.days }),
    })
    await load()
  }

  async function undo() {
    if (!draft || !history.length) return
    const previous = history[history.length - 1]
    setFuture((items) => [clone(draft), ...items].slice(0, 30))
    setHistory((items) => items.slice(0, -1))
    await persistSnapshot(previous)
  }

  async function redo() {
    if (!draft || !future.length) return
    const next = future[0]
    setHistory((items) => [...items, clone(draft)].slice(-30))
    setFuture((items) => items.slice(1))
    await persistSnapshot(next)
  }

  async function transform(command: string) {
    if (!draft) return
    setTransforming(command)
    setMessage('')
    try {
      const response = await productExperienceApi<{
        result: Record<string, unknown>
        actualModel: string
      }>('/api/carelink-ops/service-design/product-experience/scenarios/transform', {
        method: 'POST',
        body: JSON.stringify({ workspaceKey, command, allowedActivities: activities }),
      })
      setTransformationProposal({ command, result: response.result, actualModel: response.actualModel })
      setMessage(`Transformation proposée par ${response.actualModel}. Vérifiez puis appliquez ou ignorez.`)
      const next = clone(draft)
      next.state = { ...next.state, lastTransformation: { command, ...response } }
      commitLocal(next)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Transformation impossible.')
    } finally {
      setTransforming('')
    }
  }

  async function applyTransformation() {
    if (!draft || !transformationProposal) return
    const rawDays = Array.isArray(transformationProposal.result.days) ? transformationProposal.result.days : []
    if (!rawDays.length) {
      setMessage('La transformation ne contient aucune journée exploitable.')
      return
    }
    const days = rawDays.map((rawDay, dayIndex) => {
      const day = rawDay && typeof rawDay === 'object' ? rawDay as Record<string, unknown> : {}
      const sourceBlocks = Array.isArray(day.blocks) ? day.blocks : Array.isArray(day.timeline) ? day.timeline : []
      const fallbackDay = draft.days[Math.min(dayIndex, draft.days.length - 1)]
      const startMinute = Number(day.startMinute ?? fallbackDay?.startMinute ?? 480)
      const endMinute = Number(day.endMinute ?? fallbackDay?.endMinute ?? 960)
      return {
        id: fallbackDay?.id || `transform-day-${dayIndex}`,
        draftId: draft.id,
        sourceDayId: fallbackDay?.sourceDayId || null,
        serviceDate: String(day.serviceDate || fallbackDay?.serviceDate || '') || null,
        label: String(day.label || day.objective || fallbackDay?.label || `Jour ${dayIndex + 1}`),
        startMinute,
        endMinute,
        sortOrder: dayIndex * 100,
        metadata: { ...((fallbackDay?.metadata || {}) as Record<string, unknown>), transformation: transformationProposal.command },
        blocks: sourceBlocks.map((rawBlock, blockIndex) => {
          const block = rawBlock && typeof rawBlock === 'object' ? rawBlock as Record<string, unknown> : {}
          const fallback = fallbackDay?.blocks[blockIndex]
          return {
            id: fallback?.id || `transform-block-${dayIndex}-${blockIndex}`,
            dayId: fallbackDay?.id || `transform-day-${dayIndex}`,
            sourceActivityId: block.sourceActivityId ? String(block.sourceActivityId) : block.source_activity_id ? String(block.source_activity_id) : fallback?.sourceActivityId || null,
            sourceCode: block.sourceCode ? String(block.sourceCode) : block.source_code ? String(block.source_code) : fallback?.sourceCode || null,
            blockType: String(block.blockType || block.block_type || block.type || fallback?.blockType || 'activity') as ProductExperienceTimelineBlock['blockType'],
            label: String(block.label || block.name || fallback?.label || `Bloc ${blockIndex + 1}`),
            objective: String(block.objective || block.detail || fallback?.objective || ''),
            startMinute: Number(block.startMinute ?? fallback?.startMinute ?? (startMinute + blockIndex * 45)),
            durationMinutes: Math.max(5, Number(block.durationMinutes ?? block.duration_minutes ?? fallback?.durationMinutes ?? 45)),
            locked: Boolean(block.locked ?? fallback?.locked ?? false),
            sortOrder: blockIndex * 100,
            metadata: block,
          }
        }),
      }
    })
    await reloadAfter(() => productExperienceApi('/api/carelink-ops/service-design/product-experience/timeline', {
      method: 'POST',
      body: JSON.stringify({ action: 'replace_all', draftId: draft.id, days }),
    }))
    setTransformationProposal(null)
    setMessage('Transformation appliquée au workbench et sauvegardée.')
  }

  function dropBlock(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    if (!activeDay) return
    const id = event.dataTransfer.getData('text/block-id')
    const block = activeDay.blocks.find((item) => item.id === id)
    if (!block) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    const value = Math.round((activeDay.startMinute + ratio * (activeDay.endMinute - activeDay.startMinute)) / SNAP) * SNAP
    void patchBlock(block, {
      startMinute: Math.min(
        activeDay.endMinute - block.durationMinutes,
        Math.max(activeDay.startMinute, value),
      ),
    })
  }

  if (loading) {
    return <div className="grid min-h-[600px] place-items-center"><Loader2 size={30} className="animate-spin text-blue-600" /></div>
  }

  if (!draft) {
    return <StudioSurface title="Workbench indisponible"><p className="text-sm font-bold text-rose-700">{message || 'Scénario introuvable.'}</p></StudioSurface>
  }

  const coverage = activeDay ? activeDay.blocks.reduce((sum, block) => sum + block.durationMinutes, 0) : 0
  const windowMinutes = activeDay ? activeDay.endMinute - activeDay.startMinute : 0
  const overlaps = activeDay
    ? activeDay.blocks.filter((block, index, all) =>
        all.some(
          (other, otherIndex) =>
            otherIndex !== index &&
            block.startMinute < other.startMinute + other.durationMinutes &&
            other.startMinute < block.startMinute + block.durationMinutes,
        ),
      ).length
    : 0

  return (
    <div className="space-y-6">
      <StudioHero
        eyebrow="ANGELCARE · Direct Manipulation Workbench"
        title={draft.title}
        description="Déplacez, redimensionnez, dupliquez, remplacez et supprimez les blocs réels. Chaque action persiste sans workflow d’approbation."
        actions={
          <>
            <Link href="/carelink-ops/service-design/planning/scenarios" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black text-white"><ArrowLeft size={15} />Scénarios</Link>
            <Link href={`/carelink-ops/service-design/documents?kind=custom&id=${encodeURIComponent(draft.id)}`} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white"><Maximize2 size={15} />A4 & PDF</Link>
          </>
        }
        chips={
          <>
            <StudioChip tone={saveState === 'saved' ? 'emerald' : saveState === 'error' ? 'rose' : 'blue'}>{saveState === 'saving' ? 'Sauvegarde…' : saveState === 'saved' ? 'Sauvegardé' : saveState === 'error' ? 'Erreur sauvegarde' : 'Workbench live'}</StudioChip>
            <StudioChip tone={overlaps ? 'rose' : 'emerald'}>{overlaps ? `${overlaps} chevauchement(s)` : 'Aucun chevauchement'}</StudioChip>
            <StudioChip tone={coverage === windowMinutes ? 'emerald' : 'amber'}>{coverage}/{windowMinutes} min planifiées</StudioChip>
          </>
        }
      />

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => void undo()} disabled={!history.length} className="px-tool"><Undo2 size={14} />Annuler</button>
          <button onClick={() => void redo()} disabled={!future.length} className="px-tool"><Redo2 size={14} />Rétablir</button>
          <button onClick={() => void renameDraft()} className="px-tool">Renommer</button>
          <button onClick={() => void duplicateVariant()} className="px-tool"><Copy size={14} />Dupliquer la variante</button>
          <button onClick={() => void duplicateDay()} className="px-tool"><Copy size={14} />Dupliquer le jour</button>
          <button onClick={() => void rebalance()} className="px-tool"><RefreshCw size={14} />Rééquilibrer</button>
          <button onClick={() => void createBlock()} className="px-tool px-primary"><Plus size={14} />Ajouter un bloc</button>
        </div>
        <PermanentDeleteButton entityType="workbench_draft" entityId={draft.id} label={draft.title} compact onDeleted={() => location.assign('/carelink-ops/service-design/my-work')} />
      </section>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section className="flex gap-2 overflow-x-auto rounded-[24px] border border-slate-200 bg-white p-2">
            {draft.days.map((day, index) => (
              <button key={day.id} onClick={() => setActiveDayId(day.id)} className={`min-w-[190px] rounded-2xl border px-4 py-3 text-left ${activeDay?.id === day.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-600">Jour {index + 1} · {day.serviceDate || 'Date'}</p>
                <p className="mt-1 text-sm font-black">{day.label}</p>
                <p className="mt-1 text-[10px] font-semibold text-slate-500">{minute(day.startMinute)}–{minute(day.endMinute)} · {day.blocks.length} blocs</p>
              </button>
            ))}
          </section>

          {activeDay ? (
            <StudioSurface
              title="Mission Timeline Composer"
              subtitle="Glissez les blocs sur l’axe. Ajustez la durée avec les contrôles du bloc. Les routines verrouillées restent stables."
              action={<StudioChip tone="blue">Snap {SNAP} min</StudioChip>}
            >
              <div className="overflow-x-auto">
                <div className="min-w-[980px]">
                  <div className="mb-3 flex justify-between text-[9px] font-black text-slate-400">
                    {Array.from({ length: Math.max(2, Math.ceil((activeDay.endMinute - activeDay.startMinute) / 60) + 1) }, (_, index) => (
                      <span key={index}>{minute(activeDay.startMinute + index * 60)}</span>
                    ))}
                  </div>
                  <div
                    onDragOver={(event: React.DragEvent<HTMLDivElement>) => event.preventDefault()}
                    onDrop={dropBlock}
                    className="relative h-[460px] rounded-[26px] border border-slate-200 bg-[linear-gradient(to_right,rgba(148,163,184,.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.10)_1px,transparent_1px)] bg-[size:8.333%_100%,100%_58px]"
                  >
                    {activeDay.blocks.map((block, index) => {
                      const left = ((block.startMinute - activeDay.startMinute) / (activeDay.endMinute - activeDay.startMinute)) * 100
                      const width = Math.max(3, (block.durationMinutes / (activeDay.endMinute - activeDay.startMinute)) * 100)
                      return (
                        <div
                          key={block.id}
                          draggable={!block.locked}
                          onDragStart={(event: React.DragEvent<HTMLDivElement>) => event.dataTransfer.setData('text/block-id', block.id)}
                          onClick={() => setSelectedBlock(block)}
                          className={`absolute cursor-pointer rounded-2xl border p-3 shadow-md transition hover:-translate-y-0.5 ${selectedBlock?.id === block.id ? 'border-blue-500 bg-blue-600 text-white ring-4 ring-blue-100' : 'border-slate-200 bg-white text-slate-900'} ${block.locked ? 'cursor-not-allowed' : ''}`}
                          style={{ left: `${left}%`, width: `${width}%`, top: `${20 + (index % 6) * 66}px`, minWidth: '92px' }}
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical size={14} className="mt-0.5 shrink-0 opacity-50" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[10px] font-black">{block.label}</p>
                              <p className={`mt-1 text-[9px] font-semibold ${selectedBlock?.id === block.id ? 'text-blue-100' : 'text-slate-500'}`}>{minute(block.startMinute)}–{minute(block.startMinute + block.durationMinutes)} · {block.durationMinutes} min</p>
                            </div>
                            {block.locked ? <Lock size={12} /> : null}
                          </div>
                          <div className="mt-2 flex gap-1">
                            <button title="Réduire 5 minutes" onClick={(event: React.MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); void patchBlock(block, { durationMinutes: Math.max(5, block.durationMinutes - SNAP) }) }} className="px-mini"><Minus size={10} /></button>
                            <button title="Augmenter 5 minutes" onClick={(event: React.MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); void patchBlock(block, { durationMinutes: block.durationMinutes + SNAP }) }} className="px-mini"><Plus size={10} /></button>
                            <button title={block.locked ? 'Déverrouiller' : 'Verrouiller'} onClick={(event: React.MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); void patchBlock(block, { locked: !block.locked }) }} className="px-mini">{block.locked ? <Unlock size={10} /> : <Lock size={10} />}</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </StudioSurface>
          ) : null}

          <AudiencePreview draft={draft} active={audience} onChange={setAudience} />
        </div>

        <aside className="space-y-5">
          <StudioSurface title="Inspecteur du bloc" subtitle="Édition directe, source locale, durée et suppression réelle.">
            {selectedBlock ? (
              <div className="space-y-4">
                <label className="block">
                  <span className="px-field-label">Libellé</span>
                  <input value={selectedBlock.label} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSelectedBlock({ ...selectedBlock, label: event.target.value })} onBlur={() => void patchBlock(selectedBlock, { label: selectedBlock.label })} className="px-field" />
                </label>
                <label className="block">
                  <span className="px-field-label">Objectif</span>
                  <textarea value={selectedBlock.objective} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setSelectedBlock({ ...selectedBlock, objective: event.target.value })} onBlur={() => void patchBlock(selectedBlock, { objective: selectedBlock.objective })} rows={3} className="px-field" />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => void patchBlock(selectedBlock, { startMinute: Math.max(activeDay?.startMinute || 0, selectedBlock.startMinute - SNAP) })} className="px-tool justify-center"><Clock3 size={13} />− {SNAP} min</button>
                  <button onClick={() => void patchBlock(selectedBlock, { startMinute: selectedBlock.startMinute + SNAP })} className="px-tool justify-center"><Clock3 size={13} />+ {SNAP} min</button>
                </div>
                {selectedBlock.sourceActivityId ? (
                  <button onClick={() => setActivityOpen(true)} className="px-tool px-primary w-full justify-center"><Layers3 size={14} />Inspecter / remplacer activité</button>
                ) : null}
                <button onClick={() => void deleteBlock(selectedBlock)} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black text-rose-700"><Trash2 size={14} />Supprimer définitivement le bloc</button>
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-500">Cliquez un bloc réel. Les contrôles restent inactifs lorsqu’aucun bloc n’est sélectionné.</p>
            )}
          </StudioSurface>

          {transformationProposal ? (
            <StudioSurface title="Transformation prête à appliquer" subtitle={`${transformationProposal.command} · ${transformationProposal.actualModel}`} tone="blue">
              <div className="space-y-3">
                <p className="text-xs font-semibold leading-5 text-slate-600">{String(transformationProposal.result.summary || 'Modification structurée prête.')}</p>
                <div className="grid gap-2">
                  {(Array.isArray(transformationProposal.result.changes) ? transformationProposal.result.changes : []).slice(0, 8).map((raw, index) => {
                    const change = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
                    return <div key={index} className="rounded-2xl bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-900">{String(change.type || 'Changement')} · {String(change.detail || '')}</div>
                  })}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void applyTransformation()} className="px-tool px-primary flex-1 justify-center"><WandSparkles size={14} />Appliquer réellement</button>
                  <button onClick={() => setTransformationProposal(null)} className="px-tool flex-1 justify-center">Ignorer</button>
                </div>
              </div>
            </StudioSurface>
          ) : null}

          <StudioSurface title="Smart Activity Recommendation Drawer" subtitle="Activités locales réelles, classées pour insertion ou remplacement direct.">
            {activities.length ? <div className="grid gap-2">{activities.slice(0, 8).map((row) => {
              const id = String(row.id || '')
              const label = String(row.name || row.label || row.title || row.code || id)
              return <div key={id} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2"><button onClick={() => { setSelectedBlock(selectedBlock); setActivityOpen(true) }} className="min-w-0 flex-1 text-left"><p className="truncate text-[10px] font-black text-slate-900">{label}</p><p className="mt-1 truncate text-[9px] font-semibold text-slate-400">{String(row.code || 'LOCAL')} · {String(row.duration_minutes || row.default_duration_minutes || 'durée catalogue')}</p></button><button onClick={() => void addActivityBlock(row)} className="px-tool px-primary shrink-0">Ajouter</button></div>
            })}</div> : <p className="rounded-2xl bg-amber-50 p-3 text-xs font-bold text-amber-900">Aucune activité locale compatible n’est disponible pour cette catégorie.</p>}
          </StudioSurface>

          <StudioSurface title="Transformations intelligentes" subtitle="Commandes contrôlées, sans prompt libre.">
            <div className="grid gap-2">
              {TRANSFORMATIONS.map((command) => (
                <button key={command} onClick={() => void transform(command)} disabled={Boolean(transforming)} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-[10px] font-black text-slate-700 hover:border-violet-300 hover:bg-violet-50">
                  <span>{command}</span>
                  {transforming === command ? <Loader2 size={13} className="animate-spin" /> : <WandSparkles size={13} className="text-violet-600" />}
                </button>
              ))}
            </div>
          </StudioSurface>

          {message ? <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs font-bold text-blue-900">{message}</div> : null}
        </aside>
      </div>

      <PeekInspector
        entityType="activity"
        entityId={selectedBlock?.sourceActivityId || ''}
        open={activityOpen && Boolean(selectedBlock?.sourceActivityId)}
        onClose={() => setActivityOpen(false)}
        onReplace={(row) => {
          if (selectedBlock) {
            void patchBlock(selectedBlock, {
              sourceActivityId: String(row.id || ''),
              sourceCode: String(row.code || ''),
              label: String(row.name || row.label || selectedBlock.label),
            })
          }
          setActivityOpen(false)
        }}
        onDelete={() => {
          if (selectedBlock) void deleteBlock(selectedBlock)
          setActivityOpen(false)
        }}
      />

      <style>{`
        .px-tool{display:inline-flex;align-items:center;gap:.45rem;border:1px solid rgb(226 232 240);border-radius:1rem;background:white;padding:.65rem .85rem;font-size:.65rem;font-weight:900;color:rgb(51 65 85);transition:.18s}
        .px-tool:hover{border-color:rgb(147 197 253);color:rgb(29 78 216)}
        .px-tool:disabled{opacity:.35}
        .px-tool.px-primary{border-color:rgb(37 99 235);background:rgb(37 99 235);color:white}
        .px-mini{display:grid;height:1.5rem;width:1.5rem;place-items:center;border-radius:.5rem;border:1px solid rgba(148,163,184,.35);background:rgba(255,255,255,.16)}
        .px-field-label{display:block;margin-bottom:.4rem;font-size:.58rem;font-weight:900;text-transform:uppercase;letter-spacing:.14em;color:rgb(100 116 139)}
        .px-field{width:100%;border:1px solid rgb(226 232 240);border-radius:1rem;background:white;padding:.75rem;font-size:.75rem;font-weight:700}
      `}</style>
    </div>
  )
}
