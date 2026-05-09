
export default function NotificationCommandCenter() {
  return (
    <div className="rounded-3xl border bg-white p-6">
      <h2 className="text-xl font-bold">Notification Command Center</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {["Critical Alerts", "Approval Requests", "Mailbox Failures", "Escalations", "Queue Retries", "Security Events"].map((item) => (
          <div key={item} className="rounded-2xl border p-4">
            <div className="text-sm text-slate-500">{item}</div>
            <div className="mt-2 text-2xl font-bold">0</div>
          </div>
        ))}
      </div>
    </div>
  )
}
