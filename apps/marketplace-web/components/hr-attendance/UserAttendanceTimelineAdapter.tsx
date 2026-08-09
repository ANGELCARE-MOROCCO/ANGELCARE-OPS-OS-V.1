export default function UserAttendanceTimelineAdapter({ records }: { records: any[] }) {
  return <div className="space-y-3">
    {records.map((r) => <div key={r.id || `${r.user_id}-${r.work_date}`} className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold text-slate-950">{r.work_date}</div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{r.status || 'unknown'}</div>
      </div>
      <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-4">
        <span>In: {r.punch_in_at ? new Date(r.punch_in_at).toLocaleTimeString() : '—'}</span>
        <span>Out: {r.punch_out_at ? new Date(r.punch_out_at).toLocaleTimeString() : '—'}</span>
        <span>Hours: {Math.round((Number(r.total_minutes)||0)/60*10)/10}</span>
        <span>Late: {r.late_minutes || 0} min</span>
      </div>
    </div>)}
  </div>
}
