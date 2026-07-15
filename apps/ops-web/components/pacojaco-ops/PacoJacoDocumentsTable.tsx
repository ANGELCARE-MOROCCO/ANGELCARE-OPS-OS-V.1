'use client'

import { Copy, Eye, Pencil, Printer, RefreshCcw, Trash2 } from 'lucide-react'
import { formatMoney } from '@/lib/pacojaco-ops/calculations'
import type { PacojacoClient, PacojacoDocumentRow } from '@/lib/pacojaco-ops/types'
import PacoJacoMobileDocumentCards from './PacoJacoMobileDocumentCards'

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

export default function PacoJacoDocumentsTable({
  documents,
  onView,
  onEdit,
  onDuplicate,
  onPrint,
  onStatus,
  onCancel,
  onDelete,
  onEditClient,
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
  onEditClient?: (client: PacojacoClient) => void
  isReadOnlyDocument?: (document: PacojacoDocumentRow) => boolean
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-500">Document history</div>
          <h2 className="mt-1 text-lg font-black text-slate-900">Latest documents</h2>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[1280px] w-full border-collapse text-left">
            <thead className="bg-slate-50">
              <tr className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                <th className="px-4 py-3">Document number</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Issue date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Object</th>
                <th className="px-4 py-3">Total TTC</th>
                <th className="px-4 py-3">Remaining</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Updated at</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const readOnly = isReadOnlyDocument(doc)
                return (
                <tr
                  key={doc.id}
                  onClick={() => onView(doc)}
                  className="cursor-pointer hover:bg-slate-50/80"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onView(doc)
                    }
                  }}
                >
                  <td className="px-4 py-3 font-black text-slate-900">{doc.document_number}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{doc.document_type === 'invoice' ? 'Facture' : 'Devis'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] ${statusChip(doc.status)}`}>
                      {doc.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{displayDate(doc.issue_date)}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{doc.client_name}</div>
                    <div className="text-xs font-medium text-slate-500">{doc.client_company || '—'}</div>
                    {doc.client?.id && onEditClient ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onEditClient(doc.client as PacojacoClient)
                        }}
                        className="mt-2 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit client
                      </button>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-[260px] truncate font-semibold text-slate-700">{doc.object || '—'}</div>
                  </td>
                  <td className="px-4 py-3 font-black text-slate-900">{formatMoney(doc.total_ttc, doc.currency)}</td>
                  <td className="px-4 py-3 font-black text-slate-900">{formatMoney(doc.remaining_amount, doc.currency)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{doc.currency}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{displayDate(doc.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={(event) => { event.stopPropagation(); onView(doc) }} className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); onEdit(doc) }} disabled={readOnly} className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                        <Pencil className="h-3.5 w-3.5" /> {readOnly ? 'Not connected yet' : 'Edit'}
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); onDuplicate(doc) }} className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                        <Copy className="h-3.5 w-3.5" /> Duplicate
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); onPrint(doc) }} className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
                        <Printer className="h-3.5 w-3.5" /> Print
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); onStatus(doc) }} disabled={readOnly} className="inline-flex items-center gap-1 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 disabled:cursor-not-allowed disabled:opacity-60">
                        <RefreshCcw className="h-3.5 w-3.5" /> {readOnly ? 'Not connected yet' : 'Change status'}
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); onCancel(doc) }} disabled={readOnly} className="inline-flex items-center gap-1 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
                        <Trash2 className="h-3.5 w-3.5" /> {readOnly ? 'Not connected yet' : 'Cancel'}
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); onDelete(doc) }} className="inline-flex items-center gap-1 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
                )
              })}
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center text-sm font-medium text-slate-500">
                    No documents match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <PacoJacoMobileDocumentCards
        documents={documents}
        onView={onView}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onPrint={onPrint}
        onStatus={onStatus}
        onCancel={onCancel}
        onDelete={onDelete}
      />
    </section>
  )
}
