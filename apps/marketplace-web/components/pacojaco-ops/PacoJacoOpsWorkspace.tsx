'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Quote, RefreshCcw, Sparkles, Users } from 'lucide-react'
import PacoJacoDashboardCards from './PacoJacoDashboardCards'
import PacoJacoFilters, { type PacoJacoFiltersState } from './PacoJacoFilters'
import PacoJacoDocumentsTable from './PacoJacoDocumentsTable'
import PacoJacoDocumentModal from './PacoJacoDocumentModal'
import PacoJacoDocumentPreview from './PacoJacoDocumentPreview'
import PacoJacoDocumentPreviewModal from './PacoJacoDocumentPreviewModal'
import PacoJacoClientModal from './PacoJacoClientModal'
import { calculateDocumentTotals, normalizeDocumentItems, safeNumber } from '@/lib/pacojaco-ops/calculations'
import type {
  PacojacoClient,
  PacojacoClientDraft,
  PacojacoDocumentFormState,
  PacojacoDocumentRow,
  PacojacoDocumentStats,
  PacojacoDocumentType,
  PacojacoPrintableDocument,
} from '@/lib/pacojaco-ops/types'
import { PACOJACO_DEFAULT_LEGAL_FOOTER } from '@/lib/pacojaco-ops/types'
import ActionProgressPanel from '@/components/shared/ActionProgressPanel'
import { useActionProgress } from '@/hooks/useActionProgress'

type Props = {
  initialDocuments: PacojacoDocumentRow[]
  initialStats: PacojacoDocumentStats
  hasLogo: boolean
  currentUserName: string
}

const defaultFilters: PacoJacoFiltersState = {
  q: '',
  document_type: 'all',
  status: 'all',
  date_from: '',
  date_to: '',
  min_amount: '',
  max_amount: '',
}

type EditorState = {
  mode: 'create' | 'edit' | 'view'
  document: PacojacoDocumentRow | null
  loading: boolean
  initialType: PacojacoDocumentType
}

type ClientEditorState = {
  mode: 'create' | 'edit'
  client: PacojacoClient | null
}

function toPrintableDocument(document: PacojacoDocumentRow): PacojacoPrintableDocument {
  const items = normalizeDocumentItems(
    (document.items || []).map((item) => ({
      id: item.id,
      sort_order: item.sort_order,
      ref: item.ref,
      designation: item.designation,
      description: item.description,
      category: item.category,
      unit_price: item.unit_price,
      quantity: item.quantity,
      unit: item.unit,
    }))
  )

  const totals = calculateDocumentTotals({
    items,
    discountType: document.discount_type || null,
    discountValue: document.discount_value,
    taxRate: document.tax_rate,
    advanceAmount: document.advance_amount,
  })

  return {
    document_type: document.document_type,
    document_number: document.document_number,
    status: document.status,
    issue_date: document.issue_date,
    due_date: document.due_date,
    validity_date: document.validity_date,
    object: document.object,
    client_name: document.client_name,
    client_company: document.client_company,
    client_ice: document.client_ice,
    client_email: document.client_email,
    client_phone: document.client_phone,
    region: document.region,
    zone: document.zone,
    intervention_address: document.intervention_address,
    contact_name: document.contact_name,
    imm: document.imm,
    service_dates_text: document.service_dates_text,
    schedule_text: document.schedule_text,
    payment_info: document.payment_info,
    payment_method: document.payment_method,
    payment_date: document.payment_date,
    notes: document.notes,
    conditions: document.conditions,
    subtotal: totals.subtotal,
    discount_total: totals.discount_total,
    tax_total: totals.tax_total,
    total_ttc: totals.total_ttc,
    advance_amount: totals.advance_amount,
    remaining_amount: totals.remaining_amount,
    currency: document.currency,
    legal_footer: document.legal_footer || PACOJACO_DEFAULT_LEGAL_FOOTER,
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
    interventions: (document.interventions || [])
      .filter((item) =>
        [item.title, item.service_type, item.region, item.zone, item.address, item.contact_name, item.imm, item.service_dates_text, item.schedule_text, item.notes].some(
          (value) => String(value || '').trim().length > 0
        )
      )
      .map((item) => ({
        title: item.title,
        service_type: item.service_type,
        region: item.region,
      zone: item.zone,
      address: item.address,
      contact_name: item.contact_name,
      imm: item.imm,
      service_dates_text: item.service_dates_text,
      schedule_text: item.schedule_text,
      notes: item.notes,
      })),
  }
}

function emptyDraft(type: PacojacoDocumentType): PacojacoDocumentFormState {
  return {
    id: null,
    document_type: type,
    document_number: '',
    status: 'draft',
    issue_date: new Date().toISOString().slice(0, 10),
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
    items: [],
    interventions: [
      {
        id: crypto.randomUUID(),
        sort_order: 0,
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
      },
    ],
  }
}

function fetchJson(path: string, options?: RequestInit) {
  return fetch(path, {
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  }).then(async (response) => {
    const payload = await response.json().catch(() => null)
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || payload?.message || `Request failed: ${response.status}`)
    }
    return payload
  })
}

function buildQuery(filters: PacoJacoFiltersState) {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.document_type !== 'all') params.set('document_type', filters.document_type)
  if (filters.status !== 'all') params.set('status', filters.status)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.min_amount) params.set('min_amount', filters.min_amount)
  if (filters.max_amount) params.set('max_amount', filters.max_amount)
  params.set('limit', '250')
  return params.toString()
}

export default function PacoJacoOpsWorkspace({ initialDocuments, initialStats, hasLogo, currentUserName }: Props) {
  const [documents, setDocuments] = useState<PacojacoDocumentRow[]>(initialDocuments)
  const [stats, setStats] = useState<PacojacoDocumentStats>(initialStats)
  const [filters, setFilters] = useState<PacoJacoFiltersState>(defaultFilters)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<{ kind: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [preview, setPreview] = useState<PacojacoPrintableDocument | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [savedPreviewDocument, setSavedPreviewDocument] = useState<PacojacoDocumentRow | null>(null)
  const [savedPreviewOpen, setSavedPreviewOpen] = useState(false)
  const [clients, setClients] = useState<PacojacoClient[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientEditor, setClientEditor] = useState<ClientEditorState | null>(null)
  const [appliedClient, setAppliedClient] = useState<PacojacoClient | null>(null)
  const [appliedClientRevision, setAppliedClientRevision] = useState(0)
  const actionProgress = useActionProgress()

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshDocuments()
    }, 250)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  useEffect(() => {
    void refreshClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!banner) return
    const timer = setTimeout(() => setBanner(null), 4000)
    return () => clearTimeout(timer)
  }, [banner])

  async function refreshDocuments(showProgress = false) {
    try {
      setLoading(true)
      if (showProgress) {
        actionProgress.startAction({
          title: 'Refresh PACOJACO Dashboard',
          subtitle: 'Reloading documents, totals and dashboard indicators.',
          steps: [
            { id: 'load', label: 'Load saved documents', percent: 45 },
            { id: 'stats', label: 'Update dashboard stats', percent: 80 },
            { id: 'complete', label: 'Refresh complete', percent: 100 },
          ],
        })
        actionProgress.setStep('load', 'running', 'Loading documents from database…', 45)
      }
      const payload = await fetchJson(`/api/pacojaco-ops/documents?${buildQuery(filters)}`)
      setDocuments(payload.documents || [])
      if (payload.stats) setStats(payload.stats)
      if (showProgress) {
        actionProgress.setStep('stats', 'done', 'Dashboard stats updated.', 85)
        actionProgress.completeAction('PACOJACO dashboard refreshed successfully.', {
          documents: payload.documents?.length || 0,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load PACOJACO documents.'
      setBanner({ kind: 'error', message })
      if (showProgress) actionProgress.failAction(message)
    } finally {
      setLoading(false)
    }
  }

  async function refreshClients(showProgress = false) {
    try {
      setClientsLoading(true)
      if (showProgress) {
        actionProgress.startAction({
          title: 'Refresh PACOJACO Clients',
          subtitle: 'Reloading saved client records.',
          steps: [
            { id: 'load', label: 'Load clients', percent: 70 },
            { id: 'complete', label: 'Clients ready', percent: 100 },
          ],
        })
        actionProgress.setStep('load', 'running', 'Loading clients from database…', 70)
      }
      const payload = await fetchJson('/api/pacojaco-ops/clients?limit=500')
      setClients(payload.clients || [])
      if (showProgress) actionProgress.completeAction('PACOJACO clients refreshed successfully.', { clients: payload.clients?.length || 0 })
    } catch (error) {
      setBanner({ kind: 'error', message: error instanceof Error ? error.message : 'Unable to load PACOJACO clients.' })
    } finally {
      setClientsLoading(false)
    }
  }

  async function loadDocument(id: string) {
    const payload = await fetchJson(`/api/pacojaco-ops/documents/${id}`)
    return payload.document as PacojacoDocumentRow
  }

  function openCreate(type: PacojacoDocumentType) {
    setEditor({ mode: 'create', document: null, loading: false, initialType: type })
  }

  function openClientCreate(prefill?: Partial<PacojacoClientDraft>) {
    setClientEditor({
      mode: 'create',
      client: prefill
        ? {
            id: prefill.id || crypto.randomUUID(),
            client_name: prefill.client_name || '',
            client_company: prefill.client_company || '',
            client_ice: prefill.client_ice || '',
            client_email: prefill.client_email || '',
            client_phone: prefill.client_phone || '',
            client_address: prefill.client_address || '',
            contact_name: prefill.contact_name || '',
            child_name: prefill.child_name || '',
            region: prefill.region || '',
            zone: prefill.zone || '',
            default_intervention_address: prefill.default_intervention_address || '',
            default_imm: prefill.default_imm || '',
            notes: prefill.notes || '',
            payload: {},
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : null,
    })
  }

  function openClientEdit(client: PacojacoClient) {
    setClientEditor({ mode: 'edit', client })
  }

  async function openDetail(document: PacojacoDocumentRow, mode: 'edit' | 'view') {
    setEditor({ mode, document: null, loading: true, initialType: document.document_type })
    try {
      const full = await loadDocument(document.id)
      setEditor({ mode, document: full, loading: false, initialType: full.document_type })
    } catch (error) {
      setBanner({ kind: 'error', message: error instanceof Error ? error.message : 'Unable to load document detail.' })
      setEditor(null)
    }
  }

  function closeEditor() {
    setEditor(null)
  }

  async function saveDocument(draft: PacojacoDocumentFormState, action: 'draft' | 'changes') {
    try {
      setSaving(true)
      actionProgress.startAction({
        title: draft.document_type === 'quote' ? 'Save Quotation' : 'Save Invoice',
        subtitle: 'Validating document, saving rows and refreshing the dashboard.',
        steps: [
          { id: 'validate', label: 'Validate document', percent: 15 },
          { id: 'calculate', label: 'Calculate totals', percent: 30 },
          { id: 'save', label: 'Save document', percent: 60 },
          { id: 'relations', label: 'Save items and interventions', percent: 80 },
          { id: 'refresh', label: 'Refresh dashboard', percent: 95 },
          { id: 'complete', label: 'Document saved', percent: 100 },
        ],
      })
      actionProgress.setStep('validate', 'running', 'Checking client, items and required document fields…', 15)
      const payload = {
        ...draft,
        status: action === 'draft' ? 'draft' : draft.status,
        items: draft.items.map((item, index) => ({
          ...item,
          sort_order: index,
        })),
        interventions: draft.interventions.map((item, index) => ({
          ...item,
          sort_order: index,
        })),
      }

      actionProgress.setStep('calculate', 'done', 'Totals calculated and payload prepared.', 35)

      if (!editor || editor.mode === 'create') {
        actionProgress.setStep('save', 'running', 'Creating saved document…', 60)
        const response = await fetchJson('/api/pacojaco-ops/documents', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      await refreshDocuments();
        if (response.document) {
          setSavedPreviewDocument(response.document as PacojacoDocumentRow)
          setSavedPreviewOpen(true)
        }
      } else if (editor.document?.id) {
        actionProgress.setStep('save', 'running', 'Updating saved document…', 60)
        const response = await fetchJson(`/api/pacojaco-ops/documents/${editor.document.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      await refreshDocuments();
        if (response.document) {
          setSavedPreviewDocument(response.document as PacojacoDocumentRow)
          setSavedPreviewOpen(true)
        }
      }

      actionProgress.setStep('relations', 'done', 'Items and interventions saved.', 82)
      closeEditor()
      setPreviewOpen(false)
      actionProgress.setStep('refresh', 'running', 'Refreshing dashboard list…', 95)
      actionProgress.setStep('refresh', 'running', 'Refreshing dashboard list…', 95)
      await refreshDocuments();
      actionProgress.completeAction('Document saved successfully.', {
        type: draft.document_type,
        items: draft.items.length,
        interventions: draft.interventions.length,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save document.'
      setBanner({ kind: 'error', message })
      actionProgress.failAction(message)
    } finally {
      setSaving(false)
    }
  }

  async function saveClient(draft: PacojacoClientDraft) {
    try {
      setSaving(true)
      const isEditing = clientEditor?.mode === 'edit' && clientEditor.client?.id
      actionProgress.startAction({
        title: isEditing ? 'Update Client' : 'Create Client',
        subtitle: 'Saving PACOJACO client information.',
        steps: [
          { id: 'validate', label: 'Validate client', percent: 20 },
          { id: 'save', label: 'Save client', percent: 65 },
          { id: 'refresh', label: 'Refresh clients', percent: 90 },
          { id: 'complete', label: 'Client saved', percent: 100 },
        ],
      })
      actionProgress.setStep('validate', 'running', 'Checking client fields…', 20)
      actionProgress.setStep('save', 'running', 'Saving client record…', 65)
      const response = await fetchJson(isEditing ? `/api/pacojaco-ops/clients/${clientEditor?.client?.id}` : '/api/pacojaco-ops/clients', {
        method: isEditing ? 'PATCH' : 'POST',
        body: JSON.stringify(draft),
      })

      const client = response.client as PacojacoClient
      setBanner({ kind: 'success', message: `${isEditing ? 'Updated' : 'Created'} client ${client.client_name}.` })
      setClientEditor(null)
      setAppliedClient(client)
      setAppliedClientRevision((value) => value + 1)
      actionProgress.setStep('refresh', 'running', 'Refreshing client list…', 90)
      await refreshClients()
      actionProgress.completeAction(`${isEditing ? 'Updated' : 'Created'} client ${client.client_name}.`, { client: client.client_name })
      if (editor) {
        setEditor((current) => (current ? { ...current } : current))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save client.'
      setBanner({ kind: 'error', message })
      actionProgress.failAction(message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteClient(client: PacojacoClient) {
    const confirmed = window.confirm(`Delete client ${client.client_name}? This is blocked if any document still references it.`)
    if (!confirmed) return
    try {
      setSaving(true)
      await fetchJson(`/api/pacojaco-ops/clients/${client.id}`, { method: 'DELETE' })
      setBanner({ kind: 'success', message: `Deleted ${client.client_name}.` })
      setClientEditor(null)
      await refreshClients()
    } catch (error) {
      setBanner({ kind: 'error', message: error instanceof Error ? error.message : 'Unable to delete client.' })
    } finally {
      setSaving(false)
    }
  }

  async function duplicateDocument(document: PacojacoDocumentRow) {
    try {
      setSaving(true)
      actionProgress.startAction({
        title: 'Duplicate Document',
        subtitle: `Duplicating ${document.document_number}.`,
        steps: [
          { id: 'load', label: 'Load original document', percent: 25 },
          { id: 'duplicate', label: 'Create duplicate draft', percent: 70 },
          { id: 'refresh', label: 'Refresh dashboard', percent: 95 },
          { id: 'complete', label: 'Duplicate ready', percent: 100 },
        ],
      })
      actionProgress.setStep('load', 'running', 'Preparing source document…', 25)
      actionProgress.setStep('duplicate', 'running', 'Creating duplicated document…', 70)
      const response = await fetchJson(`/api/pacojaco-ops/documents/${document.id}/duplicate`, {
        method: 'POST',
      })
      await refreshDocuments();
      if (response.document) {
        setEditor({ mode: 'edit', document: response.document, loading: false, initialType: response.document.document_type })
      }
    } catch (error) {
      setBanner({ kind: 'error', message: error instanceof Error ? error.message : 'Unable to duplicate document.' })
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(document: PacojacoDocumentRow, nextStatus?: string) {
    const allowed = ['draft', 'issued', 'sent', 'accepted', 'rejected', 'paid', 'partially_paid', 'cancelled']
    const requested = nextStatus || window.prompt(`Enter a status: ${allowed.join(', ')}`, document.status || 'draft')
    if (!requested) return
    if (!allowed.includes(requested)) {
      setBanner({ kind: 'error', message: 'Invalid status selected.' })
      return
    }

    try {
      setSaving(true)
      await fetchJson(`/api/pacojaco-ops/documents/${document.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: requested }),
      })
      setBanner({ kind: 'success', message: `Status updated to ${requested.replace(/_/g, ' ')}.` })
      await refreshDocuments();
    } catch (error) {
      setBanner({ kind: 'error', message: error instanceof Error ? error.message : 'Unable to change status.' })
    } finally {
      setSaving(false)
    }
  }

  async function cancelDocument(document: PacojacoDocumentRow) {
    const confirmed = window.confirm(`Cancel ${document.document_number}? This document becomes read-only.`)
    if (!confirmed) return
    await changeStatus(document, 'cancelled')
  }

  async function deleteDocument(document: PacojacoDocumentRow) {
    const confirmed = window.confirm(`Delete ${document.document_number}? This cannot be undone.`)
    if (!confirmed) return

    try {
      setSaving(true)
      actionProgress.startAction({
        title: 'Delete Document',
        subtitle: `Deleting ${document.document_number}.`,
        steps: [
          { id: 'delete', label: 'Delete saved document', percent: 65 },
          { id: 'refresh', label: 'Refresh dashboard', percent: 95 },
          { id: 'complete', label: 'Deletion complete', percent: 100 },
        ],
      })
      actionProgress.setStep('delete', 'running', 'Deleting saved document…', 65)
      await fetchJson(`/api/pacojaco-ops/documents/${document.id}`, {
        method: 'DELETE',
      })
      setBanner({ kind: 'success', message: `Deleted ${document.document_number}.` })
      actionProgress.setStep('refresh', 'running', 'Refreshing dashboard…', 95)
      await refreshDocuments();
      actionProgress.completeAction(`Deleted ${document.document_number}.`, { document: document.document_number })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete document.'
      setBanner({ kind: 'error', message })
      actionProgress.failAction(message)
    } finally {
      setSaving(false)
    }
  }

  async function openPreviewFromDocument(document: PacojacoDocumentRow) {
    try {
      actionProgress.startAction({
        title: 'Open Document Preview',
        subtitle: `Loading ${document.document_number}.`,
        steps: [
          { id: 'load', label: 'Load saved document', percent: 55 },
          { id: 'render', label: 'Prepare A4 preview', percent: 90 },
          { id: 'complete', label: 'Preview ready', percent: 100 },
        ],
      })
      actionProgress.setStep('load', 'running', 'Loading full document details…', 55)
      const full = await loadDocument(document.id)
      setPreviewOpen(false)
      setSavedPreviewDocument(full)
      setSavedPreviewOpen(true)
      actionProgress.setStep('render', 'done', 'Preview data prepared.', 90)
      actionProgress.completeAction('Document preview is ready.', { document: full.document_number })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open preview.'
      setBanner({ kind: 'error', message })
      actionProgress.failAction(message)
    }
  }

  function buildPrintableFromDraft(draft: PacojacoDocumentFormState): PacojacoPrintableDocument {
    const items = normalizeDocumentItems(
      draft.items.map((item, index) => ({
        id: item.id,
        sort_order: index,
        ref: item.ref,
        designation: item.designation,
        description: item.description,
        category: item.category,
        unit_price: safeNumber(item.unit_price),
        quantity: safeNumber(item.quantity),
        unit: item.unit,
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
      document_number: draft.document_number || 'Draft',
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

  function openPreviewFromDraft(draft: PacojacoDocumentFormState) {
    setPreview(buildPrintableFromDraft(draft))
    setPreviewOpen(true)
  }

  async function printPreviewFromDraft(draft: PacojacoDocumentFormState) {
    actionProgress.startAction({
      title: 'Prepare Print Preview',
      subtitle: 'Generating A4 printable preview.',
      steps: [
        { id: 'build', label: 'Build printable document', percent: 45 },
        { id: 'render', label: 'Render preview', percent: 75 },
        { id: 'print', label: 'Open print dialog', percent: 100 },
      ],
    })
    actionProgress.setStep('build', 'running', 'Building printable A4 document…', 45)
    setPreview(buildPrintableFromDraft(draft))
    setPreviewOpen(true)
    actionProgress.setStep('render', 'running', 'Waiting for preview rendering…', 75)
    await new Promise((resolve) => window.setTimeout(resolve, 250))
    actionProgress.setStep('print', 'done', 'Opening browser print dialog…', 100)
    window.print()
    actionProgress.completeAction('Print preview prepared. Complete printing from the browser dialog.')
  }

  const activeCount = useMemo(() => documents.length, [documents.length])

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f5f7fb_100%)] px-3 py-4 text-slate-900 sm:px-4 lg:px-6">
      <ActionProgressPanel progress={actionProgress.progress} onClose={actionProgress.closeProgress} />
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <header className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <div className="bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_50%,#ffffff_100%)] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  PACOJACO OPS
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">PACOJACO OPS</h1>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 sm:text-base">
                  Factures, devis, clients, and interventions for the PACOJACO workflow. Signed in as {currentUserName || 'current user'}.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={() => openCreate('invoice')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle Facture
                </button>
                <button
                  type="button"
                  onClick={() => openCreate('quote')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <Quote className="h-4 w-4" />
                  Nouveau Devis
                </button>
                <button
                  type="button"
                  onClick={() => openClientCreate()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <Users className="h-4 w-4" />
                  Nouveau Client
                </button>
                <button
                  type="button"
                  onClick={() => void refreshDocuments(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  Rafraîchir
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <Metric label="Documents" value={activeCount} />
              <Metric label="Clients" value={stats.totalClients} />
              <Metric label="Docs liés" value={stats.documentsLinkedToClients} />
              <Metric label="Invoices" value={stats.totalInvoices} />
              <Metric label="Quotes" value={stats.totalQuotes} />
              <Metric label="Paid" value={stats.paidDocuments} />
            </div>
          </div>
        </header>

        {banner ? (
          <div
            className={`rounded-3xl border px-4 py-3 text-sm font-semibold ${
              banner.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : banner.kind === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            {banner.message}
          </div>
        ) : null}

        <PacoJacoDashboardCards stats={stats} />

        <PacoJacoFilters
          value={filters}
          onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
          onReset={() => setFilters(defaultFilters)}
          onRefresh={() => void refreshDocuments()}
          loading={loading}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.7fr)]">
          <PacoJacoDocumentsTable
            documents={documents}
            onView={(document) => void openPreviewFromDocument(document)}
            onEdit={(document) => void openDetail(document, 'edit')}
            onDuplicate={(document) => void duplicateDocument(document)}
            onPrint={(document) => void openPreviewFromDocument(document)}
            onStatus={(document) => void changeStatus(document)}
            onCancel={(document) => void cancelDocument(document)}
            onDelete={(document) => void deleteDocument(document)}
            onEditClient={(client) => void openClientEdit(client)}
            isReadOnlyDocument={(document) => document.status === 'cancelled'}
          />

          <aside className="grid gap-4">
            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">Client panel</div>
              <div className="mt-2 text-lg font-black text-slate-900">Recent clients</div>
              <div className="mt-1 text-sm font-medium text-slate-500">
                Select a client inside the document modal or open the client editor directly.
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Loaded clients</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">{clients.length}</div>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshClients(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  {clientsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  Refresh
                </button>
              </div>
              <div className="mt-4 grid gap-2">
                {clients.slice(0, 5).map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => openClientEdit(client)}
                    className="rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div className="text-sm font-black text-slate-900">{client.client_name}</div>
                    <div className="mt-1 text-xs font-medium text-slate-500">
                      {[client.client_company, client.client_phone, client.client_email].filter(Boolean).join(' • ') || 'No contact details'}
                    </div>
                  </button>
                ))}
                {!clients.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-500">
                    No clients loaded yet.
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>

      <PacoJacoDocumentModal
        open={Boolean(editor)}
        mode={editor?.mode || 'create'}
        document={editor?.document || null}
        initialType={editor?.initialType || 'invoice'}
        hasLogo={hasLogo}
        saving={saving}
        loading={Boolean(editor?.loading)}
        clients={clients}
        onClose={closeEditor}
        onSave={saveDocument}
        onPreview={openPreviewFromDraft}
        onPrint={printPreviewFromDraft}
        onRequestCreateClient={openClientCreate}
        onRequestEditClient={openClientEdit}
        appliedClient={appliedClient}
        appliedClientRevision={appliedClientRevision}
      />

      <PacoJacoClientModal
        open={Boolean(clientEditor)}
        mode={clientEditor?.mode || 'create'}
        client={clientEditor?.client || null}
        saving={saving}
        onClose={() => setClientEditor(null)}
        onSave={saveClient}
        onDelete={clientEditor?.client ? deleteClient : undefined}
      />

      <PacoJacoDocumentPreviewModal
        open={savedPreviewOpen}
        document={savedPreviewDocument}
        hasLogo={hasLogo}
        onClose={() => setSavedPreviewOpen(false)}
        onEdit={(document) => {
          setSavedPreviewOpen(false)
          void openDetail(document, 'edit')
        }}
      />

      <PacoJacoDocumentPreview
        open={previewOpen}
        document={preview}
        hasLogo={hasLogo}
        onClose={() => setPreviewOpen(false)}
        onPrint={() => window.print()}
      />
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
    </div>
  )
}
