'use client'

import { Copy, Eye, Pencil, Printer, RefreshCcw, Trash2 } from 'lucide-react'
import { formatMoney } from '@/lib/pacojaco-ops/calculations'
import type { PacojacoDocumentRow } from '@/lib/pacojaco-ops/types'

function displayDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

function statusChip(status: string) {
  const tones: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    issued: 'bg-blue-50 text-blue-700 border-blue-200',
    sent: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    partially_paid: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
  }
  return tones[status] || tones.draft
}

export default function PacoJacoMobileDocumentCards({
  documents,
  onView,
  onEdit,
  onDuplicate,
  onPrint,
  onStatus,
  onCancel,
  onDelete,
  isReadOnlyDocument = () => false,
}: {
  documents: PacojacoDocumentRow[]
  onView: (document: PacojacoDocumentRow) => void
  onEdit: (document: PacojacoDocumentRow) => void
  onDuplicate: (document: PacojacoDocumentRow) => void
  onPrint: (document: PacojacoDocumentRow) => void
  onStatus: (document: PacojacoDocumentRow) => void
  onCancel: (document: PacojacoDocumentRow) => void
  onDelete: (document: PacojacoDocumentRow) => void
  isReadOnlyDocument?: (document: PacojacoDocumentRow) => boolean
}) {
  if (!documents.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <div className="text-lg font-black text-slate-900">No documents found</div>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Use New Facture or New Devis to start the module.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:hidden">
      {documents.map((doc) => {
        const readOnly = isReadOnlyDocument(doc)
        return (
        <article
          key={doc.id}
          role="button"
          tabIndex={0}
          onClick={() => onView(doc)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onView(doc)
            }
          }}
          className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-black text-slate-900">{doc.document_number}</div>
              <div className="mt-1 text-sm font-medium text-slate-500">{doc.client_name}</div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] ${statusChip(doc.status)}`}>
              {doc.status.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Type</div>
              <div className="mt-1 font-bold text-slate-900">{doc.document_type === 'invoice' ? 'Facture' : 'Devis'}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Total TTC</div>
              <div className="mt-1 font-bold text-slate-900">{formatMoney(doc.total_ttc, doc.currency)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Remaining</div>
              <div className="mt-1 font-bold text-slate-900">{formatMoney(doc.remaining_amount, doc.currency)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Updated</div>
              <div className="mt-1 font-bold text-slate-900">{displayDate(doc.updated_at)}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Object</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">{doc.object || '—'}</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={(event) => { event.stopPropagation(); onView(doc) }} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
              <Eye className="h-4 w-4" /> Preview
            </button>
            <button type="button" onClick={(event) => { event.stopPropagation(); onEdit(doc) }} disabled={readOnly} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Pencil className="h-4 w-4" /> {readOnly ? 'Not connected yet' : 'Edit'}
            </button>
            <button type="button" onClick={(event) => { event.stopPropagation(); onDuplicate(doc) }} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
              <Copy className="h-4 w-4" /> Duplicate
            </button>
            <button type="button" onClick={(event) => { event.stopPropagation(); onPrint(doc) }} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
              <Printer className="h-4 w-4" /> Print
            </button>
            <button type="button" onClick={(event) => { event.stopPropagation(); onStatus(doc) }} disabled={readOnly} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCcw className="h-4 w-4" /> {readOnly ? 'Not connected yet' : 'Status'}
            </button>
            <button type="button" onClick={(event) => { event.stopPropagation(); onCancel(doc) }} disabled={readOnly} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Trash2 className="h-4 w-4" /> {readOnly ? 'Not connected yet' : 'Cancel'}
            </button>
            <button type="button" onClick={(event) => { event.stopPropagation(); onDelete(doc) }} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-700">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </article>
        )
      })}
    </div>
  )
}
