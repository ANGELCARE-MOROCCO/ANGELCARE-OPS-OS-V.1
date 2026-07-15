import type { Ac360ExecutionRecovery, Ac360PreflightInsight } from '@/lib/ac360/customer-command-validation'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function SmallBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]', className)}>{children}</span>
}

export function Ac360CustomerErrorRecoveryPanel({
  insight,
  recovery,
  onRetryPreflight,
  onReviewPayload,
  onClose,
}: {
  insight?: Ac360PreflightInsight | null
  recovery?: Ac360ExecutionRecovery | null
  onRetryPreflight: () => void
  onReviewPayload: () => void
  onClose: () => void
}) {
  const actions = recovery?.actions || insight?.recoveryActions || []
  const severity = recovery?.severity || (insight?.allowed ? 'succès' : 'bloquant')
  return (
    <div className={cx('rounded-[1.5rem] border p-4', severity === 'succès' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50')} data-ac360-phase3h="customer-error-recovery">
      <div className="flex flex-wrap items-center gap-2">
        <SmallBadge className={severity === 'succès' ? 'border-emerald-200 bg-white text-emerald-800' : 'border-rose-200 bg-white text-rose-800'}>{severity === 'succès' ? 'preuve succès' : 'récupération guidée'}</SmallBadge>
        {(recovery?.proofReference || insight?.proofReference) ? <SmallBadge className="border-slate-200 bg-white text-slate-700">{recovery?.proofReference || insight?.proofReference}</SmallBadge> : null}
      </div>
      <h4 className="mt-3 text-base font-black text-slate-950">{recovery?.headline || insight?.headline || 'Action à régulariser'}</h4>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{recovery?.explanation || insight?.explanation || 'Le runtime demande une correction ou une régularisation avant exécution.'}</p>
      {actions.length ? (
        <div className="mt-3 grid gap-2">
          {actions.map((action) => <div key={action} className="rounded-2xl border border-white/70 bg-white px-3 py-2 text-xs font-black text-slate-700">{action}</div>)}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onRetryPreflight} className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white hover:bg-blue-800">Relancer pré-vol</button>
        <button type="button" onClick={onReviewPayload} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700 hover:border-blue-200 hover:bg-blue-50">Corriger payload</button>
        <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800">Fermer</button>
      </div>
    </div>
  )
}
