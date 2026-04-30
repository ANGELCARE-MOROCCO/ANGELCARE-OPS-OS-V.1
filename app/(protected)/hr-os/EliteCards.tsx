import type { ReactNode } from "react";
export function MetricCard({ label, value, delta, status, interpretation, action }: { label:string; value:string; delta?:string; status?:string; interpretation?:string; action?:string }) {
  return <div className="rounded-[1.5rem] border border-white/10 bg-white/[.06] p-5 shadow-xl backdrop-blur">
    <div className="flex items-start justify-between gap-3"><p className="text-xs uppercase tracking-[.22em] text-slate-400">{label}</p><span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] uppercase text-slate-200">{status}</span></div>
    <div className="mt-3 flex items-end gap-3"><strong className="text-3xl font-semibold">{value}</strong>{delta && <span className="mb-1 text-sm text-emerald-300">{delta}</span>}</div>
    {interpretation && <p className="mt-3 text-sm text-slate-300">{interpretation}</p>}
    {action && <p className="mt-3 rounded-xl bg-slate-950/70 p-3 text-xs text-slate-200"><b className="text-emerald-300">Next action:</b> {action}</p>}
  </div>;
}
export function WorkCard({ title, eyebrow, children, footer }: { title:string; eyebrow?:string; children:ReactNode; footer?:ReactNode }) {
  return <section className="rounded-[1.75rem] border border-white/10 bg-white/[.055] p-5 shadow-2xl backdrop-blur">
    {eyebrow && <p className="text-xs uppercase tracking-[.24em] text-emerald-300">{eyebrow}</p>}
    <h2 className="mt-1 text-xl font-semibold">{title}</h2>
    <div className="mt-4">{children}</div>
    {footer && <div className="mt-4 border-t border-white/10 pt-4">{footer}</div>}
  </section>;
}
export function ActionButton({ children }: { children:ReactNode }) { return <button className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-300/20">{children}</button> }
export function RiskBadge({ risk }: { risk:string }) { return <span className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-200">{risk}</span> }
