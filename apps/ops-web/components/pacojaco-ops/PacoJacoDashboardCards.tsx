'use client'

import { BadgeDollarSign, FileText, Link2, ReceiptText, Users, Clock3, CircleCheckBig, TriangleAlert, TrendingUp } from 'lucide-react'
import { formatMoney } from '@/lib/pacojaco-ops/calculations'
import type { PacojacoDocumentStats } from '@/lib/pacojaco-ops/types'

type StatCard = {
  label: string
  value: string
  accent: string
  icon: React.ReactNode
  hint?: string
}

function cardTone(accent: string) {
  const map: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }
  return map[accent] || map.slate
}

export default function PacoJacoDashboardCards({ stats }: { stats: PacojacoDocumentStats }) {
  const cards: StatCard[] = [
    { label: 'Total clients', value: String(stats.totalClients), accent: 'blue', icon: <Users className="h-4 w-4" />, hint: 'Saved PACOJACO clients' },
    {
      label: 'Docs linked to clients',
      value: String(stats.documentsLinkedToClients),
      accent: 'emerald',
      icon: <Link2 className="h-4 w-4" />,
      hint: 'Documents with client_id',
    },
    { label: 'Total invoices', value: String(stats.totalInvoices), accent: 'blue', icon: <ReceiptText className="h-4 w-4" /> },
    { label: 'Total quotes', value: String(stats.totalQuotes), accent: 'amber', icon: <FileText className="h-4 w-4" /> },
    { label: 'Draft documents', value: String(stats.draftDocuments), accent: 'slate', icon: <Clock3 className="h-4 w-4" /> },
    { label: 'Issued documents', value: String(stats.issuedDocuments), accent: 'blue', icon: <TrendingUp className="h-4 w-4" /> },
    { label: 'Paid documents', value: String(stats.paidDocuments), accent: 'emerald', icon: <CircleCheckBig className="h-4 w-4" /> },
    { label: 'Partially paid', value: String(stats.partiallyPaidDocuments), accent: 'amber', icon: <TriangleAlert className="h-4 w-4" /> },
    { label: 'Cancelled', value: String(stats.cancelledDocuments), accent: 'rose', icon: <TriangleAlert className="h-4 w-4" /> },
    { label: 'Total billed MAD', value: formatMoney(stats.totalBilledMad, 'MAD'), accent: 'emerald', icon: <BadgeDollarSign className="h-4 w-4" /> },
    { label: 'Remaining MAD', value: formatMoney(stats.totalRemainingMad, 'MAD'), accent: 'rose', icon: <BadgeDollarSign className="h-4 w-4" /> },
    { label: 'This month billed', value: formatMoney(stats.thisMonthBilledMad, 'MAD'), accent: 'blue', icon: <BadgeDollarSign className="h-4 w-4" /> },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">{card.label}</div>
              <div className="mt-3 break-words text-2xl font-black tracking-tight text-slate-900">{card.value}</div>
              {card.hint ? <div className="mt-2 text-xs font-medium text-slate-500">{card.hint}</div> : null}
            </div>
            <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${cardTone(card.accent)}`}>{card.icon}</div>
          </div>
        </article>
      ))}
    </section>
  )
}
