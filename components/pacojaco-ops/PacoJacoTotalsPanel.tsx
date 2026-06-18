'use client'

import { formatMoney } from '@/lib/pacojaco-ops/calculations'
import type { PacojacoDocumentComputedTotals } from '@/lib/pacojaco-ops/types'

export default function PacoJacoTotalsPanel({
  totals,
  currency = 'MAD',
  compact = false,
}: {
  totals: PacojacoDocumentComputedTotals
  currency?: string
  compact?: boolean
}) {
  const rows = [
    { label: 'Subtotal', value: formatMoney(totals.subtotal, currency) },
    { label: 'Discount', value: formatMoney(totals.discount_total, currency) },
    { label: 'Advance', value: formatMoney(totals.advance_amount, currency) },
    { label: 'Remaining', value: formatMoney(totals.remaining_amount, currency) },
  ]

  return (
    <aside className={`rounded-3xl border border-slate-200 bg-slate-50 p-4 ${compact ? 'shadow-none' : 'shadow-[0_10px_30px_rgba(15,23,42,0.05)]'}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">Live totals</div>
          <div className="mt-1 text-sm font-bold text-slate-900">Calculations recomputed server-side</div>
        </div>
        <div className="rounded-2xl bg-white px-4 py-2 text-right shadow-sm">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">Total TTC</div>
          <div className="text-xl font-black text-slate-900">{formatMoney(totals.total_ttc, currency)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
            <span className="font-semibold text-slate-600">{row.label}</span>
            <span className="font-black text-slate-900">{row.value}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
