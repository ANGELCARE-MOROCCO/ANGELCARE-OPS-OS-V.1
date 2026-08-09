'use client'

import type { Ac360CustomerOutcome } from '@/lib/ac360/customer-table-hardening-model'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function SmallBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]', className)}>{children}</span>
}

function statusClass(status: Ac360CustomerOutcome['status']) {
  if (status === 'exécuté') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'bloqué') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (status === 'pré-vol') return 'border-blue-200 bg-blue-50 text-blue-800'
  return 'border-amber-200 bg-amber-50 text-amber-800'
}

export function Ac360CustomerOutcomeDrawer({
  outcome,
  open,
  onClose,
  onRunPreflight,
}: {
  outcome: Ac360CustomerOutcome | null
  open: boolean
  onClose: () => void
  onRunPreflight?: () => void
}) {
  if (!open || !outcome) return null

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-blue-100/70 backdrop-blur-sm" data-ac360-phase3f="outcome-drawer">
      <button type="button" aria-label="Fermer le tiroir résultat" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="relative h-full w-full max-w-[520px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-5 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SmallBadge className={statusClass(outcome.status)}>{outcome.status}</SmallBadge>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950">{outcome.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{outcome.subtitle}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800">Fermer</button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
            <SmallBadge className="border-blue-200 bg-white text-blue-800">Référence preuve</SmallBadge>
            <p className="mt-3 text-xl font-black text-slate-950">{outcome.proofReference}</p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">Tiroir résultat : aucune donnée supprimée, chaque action reste gouvernée par pré-vol, droits, usage, crédits et audit.</p>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Signaux de preuve</p>
            <div className="mt-4 grid gap-2">
              {outcome.proofSignals.map((signal) => (
                <div key={signal} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold leading-5 text-slate-700">{signal}</div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Timeline audit</p>
            <div className="mt-4 space-y-3">
              {outcome.auditTrail.map((item, index) => (
                <div key={`${item}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-[11px] font-black text-white">{index + 1}</span>
                    {index < outcome.auditTrail.length - 1 ? <span className="h-7 w-px bg-slate-200" /> : null}
                  </div>
                  <p className="pt-1 text-sm font-bold leading-5 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-800">Impact facturation / usage</p>
            <div className="mt-4 grid gap-2">
              {outcome.billingImpacts.map((impact) => (
                <div key={impact} className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-bold leading-5 text-slate-700">{impact}</div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">Suites recommandées</p>
            <div className="mt-4 grid gap-2">
              {outcome.nextSteps.map((step) => (
                <button key={step} type="button" onClick={onRunPreflight} className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-left text-sm font-black text-slate-750 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800">{step}</button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
