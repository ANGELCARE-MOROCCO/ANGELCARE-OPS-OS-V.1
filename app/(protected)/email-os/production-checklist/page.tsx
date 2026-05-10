export default function Page() {
  const items = [
    "Supabase URL configured",
    "Supabase service role configured for server APIs",
    "email_os_core SQL tables applied",
    "SMTP host/user/password configured",
    "IMAP host/user/password configured",
    "Queue retry tested",
    "IMAP sync tested",
    "Approvals tested",
    "Audit logs tested",
    "Delete confirmation tested",
    "Build passes locally",
    "Vercel environment variables match local"
  ]

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Email-OS Production Checklist</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Use this before deploying Email-OS to production operations.
        </p>
        <div className="mt-6 grid gap-3">
          {items.map((item) => (
            <label key={item} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4">
              <input type="checkbox" className="h-4 w-4 cursor-pointer" />
              <span className="text-sm font-bold text-slate-700">{item}</span>
            </label>
          ))}
        </div>
      </section>
    </main>
  )
}
