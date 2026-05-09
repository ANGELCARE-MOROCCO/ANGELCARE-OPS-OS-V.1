
export default function MailboxHealthDashboard() {
  return (
    <div className="rounded-3xl border bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Mailbox Health Dashboard</h2>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold">STABLE</span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {["SMTP", "IMAP", "Queue", "Automation"].map((item) => (
          <div key={item} className="rounded-2xl border p-4">
            <div className="text-sm text-slate-500">{item}</div>
            <div className="mt-2 text-2xl font-bold">OK</div>
          </div>
        ))}
      </div>
    </div>
  )
}
