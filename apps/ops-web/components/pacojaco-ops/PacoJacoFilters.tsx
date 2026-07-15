'use client'

import { Search, RotateCcw, SlidersHorizontal } from 'lucide-react'

export type PacoJacoFiltersState = {
  q: string
  document_type: 'all' | 'invoice' | 'quote'
  status: 'all' | string
  date_from: string
  date_to: string
  min_amount: string
  max_amount: string
}

export default function PacoJacoFilters({
  value,
  onChange,
  onReset,
  onRefresh,
  loading = false,
}: {
  value: PacoJacoFiltersState
  onChange: (patch: Partial<PacoJacoFiltersState>) => void
  onReset: () => void
  onRefresh: () => void
  loading?: boolean
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-500">Filters</div>
          <h2 className="mt-1 text-lg font-black text-slate-900">Search and refine documents</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-6">
        <label className="lg:col-span-2">
          <span className="mb-1 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Search</span>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={value.q}
              onChange={(event) => onChange({ q: event.target.value })}
              placeholder="Document number, client, object"
              className="w-full border-0 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </label>

        <label>
          <span className="mb-1 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Type</span>
          <select
            value={value.document_type}
            onChange={(event) => onChange({ document_type: event.target.value as PacoJacoFiltersState['document_type'] })}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none"
          >
            <option value="all">All</option>
            <option value="invoice">Facture</option>
            <option value="quote">Devis</option>
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Status</span>
          <select
            value={value.status}
            onChange={(event) => onChange({ status: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partially paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Date from</span>
          <input
            type="date"
            value={value.date_from}
            onChange={(event) => onChange({ date_from: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Date to</span>
          <input
            type="date"
            value={value.date_to}
            onChange={(event) => onChange({ date_to: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Min amount</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.min_amount}
            onChange={(event) => onChange({ min_amount: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none"
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Max amount</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={value.max_amount}
            onChange={(event) => onChange({ max_amount: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none"
          />
        </label>
      </div>

      {loading ? (
        <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
          Refreshing documents...
        </div>
      ) : null}
    </section>
  )
}

