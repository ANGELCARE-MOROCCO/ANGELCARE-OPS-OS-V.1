export default function EnterpriseLoadingShell({ label = "Loading Email-OS workspace..." }: { label?: string }) {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="h-4 w-64 rounded bg-slate-200" />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="h-24 rounded-2xl bg-slate-100" />
        <div className="h-24 rounded-2xl bg-slate-100" />
        <div className="h-24 rounded-2xl bg-slate-100" />
      </div>
      <p className="mt-4 text-sm font-bold text-slate-400">{label}</p>
    </div>
  )
}
