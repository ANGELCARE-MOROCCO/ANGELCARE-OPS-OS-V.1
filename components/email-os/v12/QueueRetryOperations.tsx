
export default function QueueRetryOperations() {
  return (
    <div className="rounded-3xl border bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Queue Retry Operations</h2>
        <button className="rounded-xl border px-4 py-2 text-sm font-medium">Execute Retry Sweep</button>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {["Pending Retries", "Recovered Messages", "Permanent Failures"].map((item) => (
          <div key={item} className="rounded-2xl border p-4">
            <div className="text-sm text-slate-500">{item}</div>
            <div className="mt-2 text-3xl font-bold">0</div>
          </div>
        ))}
      </div>
    </div>
  )
}
