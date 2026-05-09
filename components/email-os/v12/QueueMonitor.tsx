
export default function QueueMonitor() {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Delivery Queue Monitor</h2>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium">
          HEALTHY
        </span>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-4">
        {[
          "Queued",
          "Sending",
          "Failed",
          "Retried"
        ].map((item) => (
          <div key={item} className="rounded-xl border p-4">
            <div className="text-sm text-slate-500">{item}</div>
            <div className="mt-2 text-3xl font-bold">0</div>
          </div>
        ))}
      </div>
    </div>
  )
}
