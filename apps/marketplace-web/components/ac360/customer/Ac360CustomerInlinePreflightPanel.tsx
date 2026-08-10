import type { Ac360CommandValidationResult, Ac360PreflightInsight } from '@/lib/ac360/customer-command-validation'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function SmallBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={cx('inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em]', className)}>{children}</span>
}

function scoreClass(score: number) {
  if (score >= 85) return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (score >= 60) return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-rose-200 bg-rose-50 text-rose-800'
}

export function Ac360CustomerInlinePreflightPanel({
  validation,
  insight,
  loading,
}: {
  validation: Ac360CommandValidationResult
  insight?: Ac360PreflightInsight | null
  loading?: boolean
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4" data-ac360-phase3h="inline-preflight-results">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SmallBadge className={scoreClass(validation.score)}>Préparation {validation.score}%</SmallBadge>
        <SmallBadge className={validation.ok ? 'border-blue-200 bg-white text-blue-800' : 'border-rose-200 bg-white text-rose-800'}>{validation.readinessLabel}</SmallBadge>
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-slate-700">{validation.businessImpact}</p>

      {validation.issues.length ? (
        <div className="mt-3 space-y-2">
          {validation.issues.map((issue) => (
            <div key={`${issue.fieldKey}-${issue.message}`} className={cx('rounded-2xl border bg-white p-3 text-xs font-bold leading-5', issue.severity === 'bloquant' ? 'border-rose-100 text-rose-800' : 'border-amber-100 text-amber-800')}>
              <span className="font-black">{issue.label}</span> · {issue.message}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SmallBadge className={loading ? 'border-amber-200 bg-amber-50 text-amber-800' : insight?.allowed ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : insight ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-slate-200 bg-slate-50 text-slate-700'}>
            {loading ? 'pré-vol en cours' : insight?.statusLabel || 'pré-vol non lancé'}
          </SmallBadge>
          {insight?.proofReference ? <SmallBadge className="border-slate-200 bg-slate-50 text-slate-700">preuve {insight.proofReference}</SmallBadge> : null}
        </div>
        <h4 className="mt-3 text-sm font-black text-slate-950">{insight?.headline || 'Le pré-vol AC360 affichera ici les droits, crédits, restrictions et politique avant exécution.'}</h4>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{insight?.explanation || 'Aucune commande sérieuse ne doit partir sans lecture explicite du runtime AC360.'}</p>
        {insight?.guardSignals?.length ? (
          <div className="mt-3 grid gap-2">
            {insight.guardSignals.map((signal) => <div key={signal} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">{signal}</div>)}
          </div>
        ) : null}
      </div>
    </div>
  )
}
