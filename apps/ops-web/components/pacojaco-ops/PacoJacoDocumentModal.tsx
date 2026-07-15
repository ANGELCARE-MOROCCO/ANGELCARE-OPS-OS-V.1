'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CheckSquare,
  Copy,
  Eye,
  Loader2,
  Minus,
  Plus,
  Printer,
  Save,
  Search,
  Square,
  UserPlus,
  PencilLine,
  Trash2,
  X,
} from 'lucide-react'
import { calculateDocumentTotals, formatMoney, normalizeDocumentItems, round2, safeNumber } from '@/lib/pacojaco-ops/calculations'
import {
  PACOJACO_DEFAULT_LEGAL_FOOTER,
  type PacojacoClient,
  type PacojacoClientDraft,
  type PacojacoDocumentFormState,
  type PacojacoDocumentInterventionDraft,
  type PacojacoDocumentRow,
  type PacojacoDocumentType,
  type PacojacoPrintableDocument,
} from '@/lib/pacojaco-ops/types'
import { todayIsoDate } from '@/lib/pacojaco-ops/validation'
import PacoJacoTotalsPanel from './PacoJacoTotalsPanel'
import PacoJacoA4PrintDocument from './PacoJacoA4PrintDocument'

type SaveAction = 'draft' | 'changes'

type Props = {
  open: boolean
  mode: 'create' | 'edit' | 'view'
  document: PacojacoDocumentRow | null
  initialType?: PacojacoDocumentType
  hasLogo?: boolean
  saving?: boolean
  loading?: boolean
  clients?: PacojacoClient[]
  appliedClient?: PacojacoClient | null
  appliedClientRevision?: number
  onClose: () => void
  onSave: (draft: PacojacoDocumentFormState, action: SaveAction) => Promise<void>
  onPreview: (draft: PacojacoDocumentFormState) => void
  onPrint: (draft: PacojacoDocumentFormState) => void
  onRequestCreateClient: (prefill?: Partial<PacojacoClientDraft>) => void
  onRequestEditClient: (client: PacojacoClient) => void
}

function emptyItem(index = 0) {
  return {
    id: crypto.randomUUID(),
    client_id: crypto.randomUUID(),
    sort_order: index,
    ref: '',
    designation: '',
    description: '',
    category: 'SVC',
    unit_price: '0',
    quantity: '1',
    unit: 'pcs',
  }
}

function emptyIntervention(index = 0): PacojacoDocumentInterventionDraft {
  return {
    id: crypto.randomUUID(),
    sort_order: index,
    title: '',
    service_type: '',
    region: '',
    zone: '',
    address: '',
    contact_name: '',
    imm: '',
    service_dates_text: '',
    schedule_text: '',
    notes: '',
  }
}

function createDraft(type: PacojacoDocumentType = 'invoice'): PacojacoDocumentFormState {
  return {
    id: null,
    document_type: type,
    document_number: '',
    status: 'draft',
    issue_date: todayIsoDate(),
    due_date: '',
    validity_date: '',
    object: '',
    client_id: '',
    client_name: '',
    client_company: '',
    client_ice: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    child_name: '',
    region: '',
    zone: '',
    intervention_address: '',
    contact_name: '',
    imm: '',
    service_dates_text: '',
    schedule_text: '',
    payment_info: '',
    payment_method: '',
    payment_date: '',
    notes: '',
    conditions: '',
    discount_type: '',
    discount_value: '0',
    tax_rate: '0',
    advance_amount: '0',
    currency: 'MAD',
    legal_footer: PACOJACO_DEFAULT_LEGAL_FOOTER,
    items: [emptyItem(0)],
    interventions: [emptyIntervention(0)],
  }
}

function fromDocument(doc: PacojacoDocumentRow, fallbackType: PacojacoDocumentType = doc.document_type): PacojacoDocumentFormState {
  const interventions = doc.interventions || []
  return {
    id: doc.id,
    document_type: doc.document_type || fallbackType,
    document_number: doc.document_number || '',
    status: doc.status || 'draft',
    issue_date: doc.issue_date || todayIsoDate(),
    due_date: doc.due_date || '',
    validity_date: doc.validity_date || '',
    object: doc.object || '',
    client_id: doc.client_id || '',
    client_name: doc.client_name || '',
    client_company: doc.client_company || '',
    client_ice: doc.client_ice || '',
    client_email: doc.client_email || '',
    client_phone: doc.client_phone || '',
    client_address: doc.client_address || '',
    child_name: doc.child_name || '',
    region: doc.region || '',
    zone: doc.zone || '',
    intervention_address: doc.intervention_address || '',
    contact_name: doc.contact_name || '',
    imm: doc.imm || '',
    service_dates_text: doc.service_dates_text || '',
    schedule_text: doc.schedule_text || '',
    payment_info: doc.payment_info || '',
    payment_method: doc.payment_method || '',
    payment_date: doc.payment_date || '',
    notes: doc.notes || '',
    conditions: doc.conditions || '',
    discount_type: doc.discount_type || '',
    discount_value: String(doc.discount_value ?? '0'),
    tax_rate: String(doc.tax_rate ?? '0'),
    advance_amount: String(doc.advance_amount ?? '0'),
    currency: doc.currency || 'MAD',
    legal_footer: doc.legal_footer || PACOJACO_DEFAULT_LEGAL_FOOTER,
    items: (doc.items || []).map((item, index) => ({
      id: item.id,
      client_id: crypto.randomUUID(),
      sort_order: index,
      ref: item.ref || '',
      designation: item.designation || '',
      description: item.description || '',
      category: item.category || 'SVC',
      unit_price: String(item.unit_price ?? 0),
      quantity: String(item.quantity ?? 1),
      unit: item.unit || 'pcs',
    })),
    interventions: interventions.length
      ? interventions.map((item, index) => ({
          id: item.id,
          sort_order: item.sort_order ?? index,
          title: item.title || '',
          service_type: item.service_type || '',
          region: item.region || '',
          zone: item.zone || '',
          address: item.address || '',
          contact_name: item.contact_name || '',
          imm: item.imm || '',
          service_dates_text: item.service_dates_text || '',
          schedule_text: item.schedule_text || '',
          notes: item.notes || '',
        }))
      : [emptyIntervention(0)],
  }
}

function draftToPrintable(draft: PacojacoDocumentFormState): PacojacoPrintableDocument {
  const items = normalizeDocumentItems(
    draft.items.map((item, index) => ({
      id: item.id,
      sort_order: item.sort_order ?? index,
      ref: item.ref || null,
      designation: item.designation || '',
      description: item.description || null,
      category: item.category || 'SVC',
      unit_price: safeNumber(item.unit_price),
      quantity: safeNumber(item.quantity || 1),
      unit: item.unit || null,
    }))
  )
  const totals = calculateDocumentTotals({
    items,
    discountType: draft.discount_type || null,
    discountValue: draft.discount_value,
    taxRate: draft.tax_rate,
    advanceAmount: draft.advance_amount,
  })

  const interventions = draft.interventions.filter((item) =>
    [item.title, item.service_type, item.region, item.zone, item.address, item.contact_name, item.imm, item.service_dates_text, item.schedule_text, item.notes].some(
      (value) => String(value || '').trim().length > 0
    )
  )

  return {
    document_type: draft.document_type,
    document_number: draft.document_number || '—',
    status: draft.status,
    issue_date: draft.issue_date,
    due_date: draft.due_date || null,
    validity_date: draft.validity_date || null,
    object: draft.object || null,
    client_name: draft.client_name || '',
    client_company: draft.client_company || null,
    client_ice: draft.client_ice || null,
    client_email: draft.client_email || null,
    client_phone: draft.client_phone || null,
    region: draft.region || null,
    zone: draft.zone || null,
    intervention_address: draft.intervention_address || null,
    contact_name: draft.contact_name || null,
    imm: draft.imm || null,
    service_dates_text: draft.service_dates_text || null,
    schedule_text: draft.schedule_text || null,
    payment_info: draft.payment_info || null,
    payment_method: draft.payment_method || null,
    payment_date: draft.payment_date || null,
    notes: draft.notes || null,
    conditions: draft.conditions || null,
    subtotal: totals.subtotal,
    discount_total: totals.discount_total,
    tax_total: totals.tax_total,
    total_ttc: totals.total_ttc,
    advance_amount: totals.advance_amount,
    remaining_amount: totals.remaining_amount,
    currency: draft.currency || 'MAD',
    legal_footer: draft.legal_footer || PACOJACO_DEFAULT_LEGAL_FOOTER,
    items: items.map((item) => ({
      ref: item.ref,
      designation: item.designation,
      description: item.description,
      category: item.category,
      unit_price: item.unit_price,
      quantity: item.quantity,
      unit: item.unit,
      total: item.total,
    })),
    interventions: interventions.map((item) => ({
      title: item.title || null,
      service_type: item.service_type || null,
      region: item.region || null,
      zone: item.zone || null,
      address: item.address || null,
      contact_name: item.contact_name || null,
      imm: item.imm || null,
      service_dates_text: item.service_dates_text || null,
      schedule_text: item.schedule_text || null,
      notes: item.notes || null,
    })),
  }
}

function fieldClass(readOnly = false) {
  return `w-full rounded-2xl border px-3 py-2.5 text-sm font-medium outline-none transition ${
    readOnly
      ? 'border-slate-200 bg-slate-100 text-slate-500'
      : 'border-slate-200 bg-white text-slate-900 focus:border-blue-400 focus:ring-4 focus:ring-blue-100'
  }`
}

function sectionCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">{title}</div>
        </div>
        {badge ? <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-600">{badge}</span> : null}
      </div>
      {children}
    </section>
  )
}

function inputGroup(label: string, children: React.ReactNode, helper?: string) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      {children}
      {helper ? <span className="mt-1 block text-[11px] font-medium text-slate-400">{helper}</span> : null}
    </label>
  )
}

function statusTone(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    issued: 'bg-blue-50 text-blue-700 border-blue-200',
    sent: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    partially_paid: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
  }
  return map[status] || map.draft
}

function selectTone(isSelected: boolean) {
  return isSelected ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'
}

export default function PacoJacoDocumentModal({
  open,
  mode,
  document,
  initialType = 'invoice',
  hasLogo = true,
  saving = false,
  loading = false,
  clients = [],
  appliedClient,
  appliedClientRevision = 0,
  onClose,
  onSave,
  onPreview,
  onPrint,
  onRequestCreateClient,
  onRequestEditClient,
}: Props) {
  const [draft, setDraft] = useState<PacojacoDocumentFormState>(() => (document ? fromDocument(document, initialType) : createDraft(initialType)))
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [selectedInterventionIds, setSelectedInterventionIds] = useState<string[]>([])
  const [clientQuery, setClientQuery] = useState('')
  const [clientMenuOpen, setClientMenuOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    if (document) {
      setDraft(fromDocument(document, initialType))
    } else if (mode === 'create') {
      setDraft(createDraft(initialType))
    }
    setSelectedItemIds([])
    setSelectedInterventionIds([])
  }, [document, initialType, mode, open])

  useEffect(() => {
    if (!open || !appliedClient || !appliedClientRevision) return
    setDraft((current) => applyClientToDraft(current, appliedClient))
    setClientQuery(displayClient(appliedClient))
  }, [appliedClient, appliedClientRevision, open])

  useEffect(() => {
    if (!open) return
    const selected = clients.find((client) => client.id === draft.client_id)
    if (selected) {
      setClientQuery(displayClient(selected))
    }
  }, [clients, draft.client_id, open])

  const isReadOnly = mode === 'view' || draft.status === 'cancelled'

  const totals = useMemo(() => {
    const items = draft.items.map((item, index) => ({
      sort_order: item.sort_order ?? index,
      quantity: safeNumber(item.quantity || 0),
      unit_price: safeNumber(item.unit_price || 0),
    }))
    return calculateDocumentTotals({
      items,
      discountType: draft.discount_type || null,
      discountValue: draft.discount_value,
      taxRate: draft.tax_rate,
      advanceAmount: draft.advance_amount,
    })
  }, [draft.advance_amount, draft.discount_type, draft.discount_value, draft.items, draft.tax_rate])

  const printable = useMemo(() => draftToPrintable(draft), [draft])
  const selectedClient = clients.find((client) => client.id === draft.client_id) || null
  const filteredClients = useMemo(() => {
    const needle = clientQuery.trim().toLowerCase()
    if (!needle) return clients.slice(0, 12)
    return clients.filter((client) => displayClient(client).toLowerCase().includes(needle)).slice(0, 12)
  }, [clientQuery, clients])

  if (!open) return null

  if (loading && mode !== 'create' && !document) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm">
        <div className="flex h-full w-full items-center justify-center p-4">
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-[0_30px_120px_rgba(15,23,42,0.24)]">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading document...
            </div>
          </div>
        </div>
      </div>
    )
  }

  function updateField<K extends keyof PacojacoDocumentFormState>(key: K, value: PacojacoDocumentFormState[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function applyClientToDraft(current: PacojacoDocumentFormState, client: PacojacoClient) {
    return {
      ...current,
      client_id: client.id,
      client_name: client.client_name || current.client_name,
      client_company: client.client_company || '',
      client_ice: client.client_ice || '',
      client_email: client.client_email || '',
      client_phone: client.client_phone || '',
      client_address: client.client_address || '',
      contact_name: client.contact_name || '',
      child_name: client.child_name || '',
      region: client.region || '',
      zone: client.zone || '',
      intervention_address: client.default_intervention_address || '',
      imm: client.default_imm || '',
    }
  }

  function selectClient(client: PacojacoClient) {
    setDraft((current) => applyClientToDraft(current, client))
    setClientQuery(displayClient(client))
    setClientMenuOpen(false)
  }

  function clearClientSelection() {
    setDraft((current) => ({
      ...current,
      client_id: '',
    }))
    setClientQuery('')
  }

  function updateItem(id: string, patch: Partial<PacojacoDocumentFormState['items'][number]>) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }

  function updateIntervention(id: string, patch: Partial<PacojacoDocumentInterventionDraft>) {
    setDraft((current) => ({
      ...current,
      interventions: current.interventions.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }

  function addItem() {
    setDraft((current) => ({ ...current, items: [...current.items, emptyItem(current.items.length)] }))
  }

  function addIntervention() {
    setDraft((current) => ({ ...current, interventions: [...current.interventions, emptyIntervention(current.interventions.length)] }))
  }

  function duplicateItem(id: string) {
    setDraft((current) => {
      const item = current.items.find((entry) => entry.id === id)
      if (!item) return current
      const next = { ...item, id: crypto.randomUUID(), client_id: crypto.randomUUID(), sort_order: current.items.length }
      return { ...current, items: [...current.items, next] }
    })
  }

  function duplicateIntervention(id: string) {
    setDraft((current) => {
      const item = current.interventions.find((entry) => entry.id === id)
      if (!item) return current
      const next = { ...item, id: crypto.randomUUID(), sort_order: current.interventions.length }
      return { ...current, interventions: [...current.interventions, next] }
    })
  }

  function moveEntry<T extends { id: string; sort_order: number }>(items: T[], id: string, direction: 'up' | 'down') {
    const index = items.findIndex((entry) => entry.id === id)
    if (index < 0) return items
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= items.length) return items
    const next = [...items]
    const [picked] = next.splice(index, 1)
    next.splice(target, 0, picked)
    return next.map((item, idx) => ({ ...item, sort_order: idx }))
  }

  function moveItem(id: string, direction: 'up' | 'down') {
    setDraft((current) => ({ ...current, items: moveEntry(current.items, id, direction) }))
  }

  function moveIntervention(id: string, direction: 'up' | 'down') {
    setDraft((current) => ({ ...current, interventions: moveEntry(current.interventions, id, direction) }))
  }

  function removeItem(id: string) {
    setDraft((current) => {
      const next = current.items.filter((item) => item.id !== id)
      return { ...current, items: next.length ? next : [emptyItem(0)] }
    })
    setSelectedItemIds((current) => current.filter((selectedId) => selectedId !== id))
  }

  function removeIntervention(id: string) {
    setDraft((current) => {
      const next = current.interventions.filter((item) => item.id !== id)
      return { ...current, interventions: next.length ? next : [emptyIntervention(0)] }
    })
    setSelectedInterventionIds((current) => current.filter((selectedId) => selectedId !== id))
  }

  function duplicateSelectedItems() {
    if (!selectedItemIds.length) return
    setDraft((current) => {
      const clones = current.items
        .filter((item) => selectedItemIds.includes(item.id))
        .map((item, index) => ({
          ...item,
          id: crypto.randomUUID(),
          client_id: crypto.randomUUID(),
          sort_order: current.items.length + index,
        }))
      return { ...current, items: [...current.items, ...clones] }
    })
  }

  function duplicateSelectedInterventions() {
    if (!selectedInterventionIds.length) return
    setDraft((current) => {
      const clones = current.interventions
        .filter((item) => selectedInterventionIds.includes(item.id))
        .map((item, index) => ({
          ...item,
          id: crypto.randomUUID(),
          sort_order: current.interventions.length + index,
        }))
      return { ...current, interventions: [...current.interventions, ...clones] }
    })
  }

  function removeSelectedItems() {
    if (!selectedItemIds.length) return
    const confirmed = window.confirm(`Remove ${selectedItemIds.length} selected item(s)?`)
    if (!confirmed) return
    setDraft((current) => {
      const next = current.items.filter((item) => !selectedItemIds.includes(item.id))
      return { ...current, items: next.length ? next : [emptyItem(0)] }
    })
    setSelectedItemIds([])
  }

  function removeSelectedInterventions() {
    if (!selectedInterventionIds.length) return
    const confirmed = window.confirm(`Remove ${selectedInterventionIds.length} selected intervention(s)?`)
    if (!confirmed) return
    setDraft((current) => {
      const next = current.interventions.filter((item) => !selectedInterventionIds.includes(item.id))
      return { ...current, interventions: next.length ? next : [emptyIntervention(0)] }
    })
    setSelectedInterventionIds([])
  }

  async function submit(action: SaveAction) {
    await onSave(draft, action)
  }

  const statusOptions = ['draft', 'issued', 'sent', 'accepted', 'rejected', 'paid', 'partially_paid', 'cancelled'] as const

  const sectionStates = {
    document: [draft.document_type, draft.document_number, draft.issue_date, draft.object, draft.status].filter(Boolean).length,
    client: [draft.client_name, draft.client_company, draft.client_email, draft.client_phone].filter(Boolean).length,
    interventions: draft.interventions.filter((item) => [item.title, item.service_type, item.region, item.zone, item.address, item.contact_name].some((value) => String(value || '').trim().length > 0)).length,
    items: draft.items.filter((item) => item.designation.trim()).length,
    totals: 1,
    payment: [draft.payment_method, draft.payment_date, draft.payment_info].filter(Boolean).length,
    conditions: [draft.conditions, draft.legal_footer].filter(Boolean).length,
    preview: 1,
  }

  const saveDisabledReason = isReadOnly ? 'This document is read-only in its current status.' : saving ? 'Saving in progress.' : ''

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm">
      <div className="flex h-full w-full flex-col bg-[linear-gradient(180deg,#f8fbff_0%,#f5f7fb_100%)]">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-500">
                {mode === 'create' ? 'New document' : mode === 'edit' ? 'Edit document' : 'View document'}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-lg font-black text-slate-900">
                <span>{draft.document_type === 'invoice' ? 'Facture' : 'Devis'}</span>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] ${statusTone(draft.status)}`}>
                  {draft.status.replace(/_/g, ' ')}
                </span>
                <span className="text-slate-400">•</span>
                <span>{draft.document_number || 'Auto number'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onRequestCreateClient({
                    client_name: draft.client_name,
                    client_company: draft.client_company,
                    client_ice: draft.client_ice,
                    client_email: draft.client_email,
                    client_phone: draft.client_phone,
                    client_address: draft.client_address,
                    contact_name: draft.contact_name,
                    child_name: draft.child_name,
                    region: draft.region,
                    zone: draft.zone,
                    default_intervention_address: draft.intervention_address,
                    default_imm: draft.imm,
                    notes: draft.notes,
                  })
                }
                disabled={isReadOnly}
                title={isReadOnly ? 'Client creation is disabled in read-only mode.' : 'Create a new client'}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UserPlus className="h-4 w-4" />
                New client
              </button>
              <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>
        </div>

        {draft.status === 'cancelled' ? (
          <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            This document is cancelled. Editing is disabled; duplicate or delete remains available from the history list.
          </div>
        ) : null}

        <div className="flex-1 overflow-auto p-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_420px]">
            <div className="grid gap-4">
              <div className="grid gap-4 xl:grid-cols-2">
                {sectionCard({
                  title: 'Document Identity',
                  badge: `${sectionStates.document}/5`,
                  children: (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {inputGroup('Type', <select value={draft.document_type} onChange={(event) => updateField('document_type', event.target.value as PacojacoDocumentType)} disabled={isReadOnly} className={fieldClass(isReadOnly)}><option value="invoice">Facture</option><option value="quote">Devis</option></select>)}
                      {inputGroup('Document number', <input value={draft.document_number} onChange={(event) => updateField('document_number', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} placeholder="Auto-generated if empty" />)}
                      {inputGroup('Issue date', <input type="date" value={draft.issue_date} onChange={(event) => updateField('issue_date', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                      {inputGroup('Status', <select value={draft.status} onChange={(event) => updateField('status', event.target.value as PacojacoDocumentFormState['status'])} disabled={isReadOnly} className={fieldClass(isReadOnly)}>{statusOptions.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}</select>)}
                      {inputGroup('Due date', <input type="date" value={draft.due_date} onChange={(event) => updateField('due_date', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} />, 'Invoice due date')}
                      {inputGroup('Validity date', <input type="date" value={draft.validity_date} onChange={(event) => updateField('validity_date', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} />, 'Quote validity')}
                      <div className="sm:col-span-2">{inputGroup('Object / Objet', <textarea value={draft.object} onChange={(event) => updateField('object', event.target.value)} disabled={isReadOnly} className={`${fieldClass(isReadOnly)} min-h-[96px]`} placeholder="Service or commercial object" />)}</div>
                    </div>
                  ),
                })}

                {sectionCard({
                  title: 'Client Information',
                  badge: `${sectionStates.client}/4`,
                  children: (
                    <div className="grid gap-4">
                      <div className="relative">
                        <label className="block">
                          <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Client selector</span>
                          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                              value={clientQuery}
                              onChange={(event) => {
                                setClientQuery(event.target.value)
                                setClientMenuOpen(true)
                              }}
                              onFocus={() => setClientMenuOpen(true)}
                              disabled={isReadOnly}
                              placeholder={clients.length ? 'Search existing client...' : 'No clients available yet'}
                              className="w-full border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                            />
                          </div>
                        </label>
                        {clientMenuOpen && !isReadOnly ? (
                          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                            {filteredClients.length ? (
                              filteredClients.map((client) => (
                                <button
                                  key={client.id}
                                  type="button"
                                  onClick={() => selectClient(client)}
                                  className={`mb-1 w-full rounded-2xl border px-3 py-2 text-left transition ${selectTone(client.id === draft.client_id)}`}
                                >
                                  <div className="text-sm font-black text-slate-900">{displayClient(client)}</div>
                                  <div className="mt-1 text-xs font-medium text-slate-500">
                                    {[client.client_phone, client.client_email, client.contact_name].filter(Boolean).join(' • ') || 'Tap to auto-fill'}
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-500">
                                No matching clients found.
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onRequestCreateClient({
                              client_name: draft.client_name,
                              client_company: draft.client_company,
                              client_ice: draft.client_ice,
                              client_email: draft.client_email,
                              client_phone: draft.client_phone,
                              client_address: draft.client_address,
                              contact_name: draft.contact_name,
                              child_name: draft.child_name,
                              region: draft.region,
                              zone: draft.zone,
                              default_intervention_address: draft.intervention_address,
                              default_imm: draft.imm,
                              notes: draft.notes,
                            })
                          }
                          disabled={isReadOnly}
                          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <UserPlus className="h-4 w-4" />
                          Create new client
                        </button>
                        <button
                          type="button"
                          onClick={() => selectedClient && onRequestEditClient(selectedClient)}
                          disabled={isReadOnly || !selectedClient}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <PencilLine className="h-4 w-4" />
                          Edit selected client
                        </button>
                        <button
                          type="button"
                          onClick={clearClientSelection}
                          disabled={isReadOnly || !draft.client_id}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Clear client selection
                        </button>
                      </div>

                      {inputGroup('Client name', <input value={draft.client_name} onChange={(event) => updateField('client_name', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                      {inputGroup('Company / enterprise', <input value={draft.client_company} onChange={(event) => updateField('client_company', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {inputGroup('ICE', <input value={draft.client_ice} onChange={(event) => updateField('client_ice', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                        {inputGroup('Contact person', <input value={draft.contact_name} onChange={(event) => updateField('contact_name', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                        {inputGroup('Email', <input value={draft.client_email} onChange={(event) => updateField('client_email', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                        {inputGroup('Phone', <input value={draft.client_phone} onChange={(event) => updateField('client_phone', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                      </div>
                      {inputGroup('Address', <textarea value={draft.client_address} onChange={(event) => updateField('client_address', event.target.value)} disabled={isReadOnly} className={`${fieldClass(isReadOnly)} min-h-[96px]`} />)}
                      {inputGroup('Child name', <input value={draft.child_name} onChange={(event) => updateField('child_name', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                    </div>
                  ),
                })}
              </div>

              {sectionCard({
                title: 'Interventions & Services',
                badge: `${sectionStates.interventions} rows`,
                children: (
                  <div className="grid gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-slate-500">
                        Each intervention is stored separately and prints as its own operational block.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={addIntervention} disabled={isReadOnly} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60">
                          <Plus className="h-4 w-4" />
                          Add intervention
                        </button>
                        <button type="button" onClick={duplicateSelectedInterventions} disabled={isReadOnly || selectedInterventionIds.length === 0} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60" title={selectedInterventionIds.length ? 'Duplicate selected interventions' : 'Select interventions first'}>
                          <Copy className="h-4 w-4" />
                          Duplicate selected
                        </button>
                        <button type="button" onClick={removeSelectedInterventions} disabled={isReadOnly || selectedInterventionIds.length === 0} className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60" title={selectedInterventionIds.length ? 'Remove selected interventions' : 'Select interventions first'}>
                          <Trash2 className="h-4 w-4" />
                          Remove selected
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {draft.interventions.map((item, index) => {
                        const selected = selectedInterventionIds.includes(item.id)
                        return (
                          <div key={item.id} className={`rounded-[26px] border p-4 ${selected ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-slate-50'}`}>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedInterventionIds((current) =>
                                      current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
                                    )
                                  }
                                  className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white"
                                  aria-label={selected ? 'Unselect intervention' : 'Select intervention'}
                                >
                                  {selected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                                </button>
                                Intervention #{index + 1}
                              </label>
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => moveIntervention(item.id, 'up')} disabled={isReadOnly || index === 0} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">
                                  Up
                                </button>
                                <button type="button" onClick={() => moveIntervention(item.id, 'down')} disabled={isReadOnly || index === draft.interventions.length - 1} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">
                                  Down
                                </button>
                                <button type="button" onClick={() => duplicateIntervention(item.id)} disabled={isReadOnly} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">
                                  <Copy className="inline h-3.5 w-3.5" /> Duplicate
                                </button>
                                <button type="button" onClick={() => removeIntervention(item.id)} disabled={isReadOnly} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50">
                                  <Minus className="inline h-3.5 w-3.5" /> Remove
                                </button>
                              </div>
                            </div>
                            <div className="grid gap-3 lg:grid-cols-6">
                              {inputGroup('Title', <input value={item.title} onChange={(event) => updateIntervention(item.id, { title: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                              {inputGroup('Service type', <input value={item.service_type} onChange={(event) => updateIntervention(item.id, { service_type: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                              {inputGroup('Region', <input value={item.region} onChange={(event) => updateIntervention(item.id, { region: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                              {inputGroup('Zone', <input value={item.zone} onChange={(event) => updateIntervention(item.id, { zone: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                              {inputGroup('IMM', <input value={item.imm} onChange={(event) => updateIntervention(item.id, { imm: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                              {inputGroup('Contact', <input value={item.contact_name} onChange={(event) => updateIntervention(item.id, { contact_name: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                              <div className="lg:col-span-2">{inputGroup('Address', <textarea value={item.address} onChange={(event) => updateIntervention(item.id, { address: event.target.value })} disabled={isReadOnly} className={`${fieldClass(isReadOnly)} min-h-[84px]`} />)}</div>
                              <div className="lg:col-span-2">{inputGroup('Service dates', <input value={item.service_dates_text} onChange={(event) => updateIntervention(item.id, { service_dates_text: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}</div>
                              <div className="lg:col-span-2">{inputGroup('Schedule', <input value={item.schedule_text} onChange={(event) => updateIntervention(item.id, { schedule_text: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}</div>
                              <div className="lg:col-span-4">{inputGroup('Notes', <textarea value={item.notes} onChange={(event) => updateIntervention(item.id, { notes: event.target.value })} disabled={isReadOnly} className={`${fieldClass(isReadOnly)} min-h-[84px]`} />)}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
                      <span>{selectedInterventionIds.length ? `${selectedInterventionIds.length} intervention(s) selected` : 'Select one or more interventions to duplicate or remove.'}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedInterventionIds([])}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"
                      >
                        Clear selection
                      </button>
                    </div>
                  </div>
                ),
              })}

              {sectionCard({
                title: 'Items',
                badge: `${draft.items.filter((item) => item.designation.trim()).length} lines`,
                children: (
                  <div className="grid gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-slate-500">Billing line items remain separate from interventions.</div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={addItem} disabled={isReadOnly} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60">
                          <Plus className="h-4 w-4" />
                          Add item
                        </button>
                        <button type="button" onClick={duplicateSelectedItems} disabled={isReadOnly || selectedItemIds.length === 0} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60" title={selectedItemIds.length ? 'Duplicate selected items' : 'Select items first'}>
                          <Copy className="h-4 w-4" />
                          Duplicate selected
                        </button>
                        <button type="button" onClick={removeSelectedItems} disabled={isReadOnly || selectedItemIds.length === 0} className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60" title={selectedItemIds.length ? 'Remove selected items' : 'Select items first'}>
                          <Trash2 className="h-4 w-4" />
                          Remove selected
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {draft.items.map((item, index) => {
                        const selected = selectedItemIds.includes(item.id)
                        const filled = Boolean(item.designation.trim())
                        return (
                          <div key={item.id} className={`rounded-[26px] border p-4 ${filled ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50'} ${selected ? 'ring-2 ring-blue-200' : ''}`}>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedItemIds((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]))
                                  }
                                  className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white"
                                  aria-label={selected ? 'Unselect item' : 'Select item'}
                                >
                                  {selected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                                </button>
                                Item #{index + 1}
                              </label>
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => moveItem(item.id, 'up')} disabled={isReadOnly || index === 0} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">
                                  Up
                                </button>
                                <button type="button" onClick={() => moveItem(item.id, 'down')} disabled={isReadOnly || index === draft.items.length - 1} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">
                                  Down
                                </button>
                                <button type="button" onClick={() => duplicateItem(item.id)} disabled={isReadOnly} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50">
                                  <Copy className="inline h-3.5 w-3.5" /> Duplicate
                                </button>
                                <button type="button" onClick={() => removeItem(item.id)} disabled={isReadOnly} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-50">
                                  <Minus className="inline h-3.5 w-3.5" /> Remove
                                </button>
                              </div>
                            </div>
                            <div className="grid gap-3 lg:grid-cols-6">
                              {inputGroup('Ref', <input value={item.ref} onChange={(event) => updateItem(item.id, { ref: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                              <div className="lg:col-span-2">{inputGroup('Designation', <input value={item.designation} onChange={(event) => updateItem(item.id, { designation: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}</div>
                              <div className="lg:col-span-2">{inputGroup('Description', <textarea value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} disabled={isReadOnly} className={`${fieldClass(isReadOnly)} min-h-[84px]`} />)}</div>
                              {inputGroup('Category', <input value={item.category} onChange={(event) => updateItem(item.id, { category: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                              {inputGroup('P.U', <input type="number" step="0.01" inputMode="decimal" value={item.unit_price} onChange={(event) => updateItem(item.id, { unit_price: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                              {inputGroup('QTY', <input type="number" step="0.01" inputMode="decimal" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                              {inputGroup('Unit', <input value={item.unit} onChange={(event) => updateItem(item.id, { unit: event.target.value })} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                              {inputGroup('Total', <input value={formatMoney(round2(safeNumber(item.quantity) * safeNumber(item.unit_price)), draft.currency)} disabled className={fieldClass(true)} />)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ),
              })}

              {sectionCard({
                title: 'Payment Information',
                badge: `${sectionStates.payment}/3`,
                children: (
                  <div className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {inputGroup('Payment method', <input value={draft.payment_method} onChange={(event) => updateField('payment_method', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                      {inputGroup('Payment date', <input type="date" value={draft.payment_date} onChange={(event) => updateField('payment_date', event.target.value)} disabled={isReadOnly} className={fieldClass(isReadOnly)} />)}
                    </div>
                    {inputGroup('Payment info', <textarea value={draft.payment_info} onChange={(event) => updateField('payment_info', event.target.value)} disabled={isReadOnly} className={`${fieldClass(isReadOnly)} min-h-[96px]`} placeholder="Bank transfer note / payment instructions" />)}
                  </div>
                ),
              })}

              {sectionCard({
                title: 'Conditions & Legal Footer',
                badge: `${sectionStates.conditions}/2`,
                children: (
                  <div className="grid gap-4">
                    {inputGroup('Conditions', <textarea value={draft.conditions} onChange={(event) => updateField('conditions', event.target.value)} disabled={isReadOnly} className={`${fieldClass(isReadOnly)} min-h-[92px]`} placeholder="Terms, cancellation notes, validity notes" />)}
                    {inputGroup('Legal footer', <textarea value={draft.legal_footer} onChange={(event) => updateField('legal_footer', event.target.value)} disabled={isReadOnly} className={`${fieldClass(isReadOnly)} min-h-[114px]`} />)}
                  </div>
                ),
              })}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4">
                <PacoJacoTotalsPanel totals={totals} currency={draft.currency} />
                <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">Preview</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">Live document summary</div>
                    </div>
                    <button type="button" onClick={() => onPreview(draft)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                      <Eye className="h-4 w-4" />
                      Open
                    </button>
                  </div>
                  <div className="overflow-auto rounded-[20px] border border-slate-200 bg-slate-50 p-3">
                    <div style={{ transform: 'scale(0.36)', transformOrigin: 'top left', width: '210mm', height: 'auto' }}>
                      <PacoJacoA4PrintDocument document={printable} hasLogo={hasLogo} />
                    </div>
                  </div>
                </section>
              </div>

              <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">History</div>
                <div className="grid gap-3">
                  {(document?.events || []).length ? (document?.events || []).map((event) => (
                    <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-sm font-black text-slate-900">{event.event_type}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">{event.created_at ? new Date(event.created_at).toLocaleString('fr-FR') : '—'}</div>
                      <div className="mt-2 text-sm font-medium text-slate-700">{event.message || '—'}</div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-500">
                      No history entries yet.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-500">
              {saveDisabledReason || 'All calculations update live before saving.'}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => submit('draft')}
                disabled={saving || isReadOnly}
                className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                title={isReadOnly ? saveDisabledReason : 'Save as draft'}
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => submit('changes')}
                disabled={saving || isReadOnly}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                title={isReadOnly ? saveDisabledReason : mode === 'create' ? 'Save new document' : 'Update document'}
              >
                <Save className="h-4 w-4" />
                {mode === 'create' ? 'Save Changes' : 'Update Document'}
              </button>
              <button
                type="button"
                onClick={() => onPreview(draft)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                type="button"
                onClick={() => onPrint(draft)}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function displayClient(client: PacojacoClient) {
  return [client.client_name, client.client_company, client.client_phone].filter(Boolean).join(' • ')
}
