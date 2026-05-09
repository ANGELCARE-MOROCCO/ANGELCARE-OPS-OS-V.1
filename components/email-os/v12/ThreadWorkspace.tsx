
export default function ThreadWorkspace() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 rounded-2xl border bg-white p-4 lg:col-span-3">
        <h2 className="text-lg font-semibold">Conversation Intelligence</h2>
        <p className="text-sm text-slate-500">SLA, sentiment, escalation, approvals and customer profile.</p>
      </div>
      <div className="col-span-12 rounded-2xl border bg-white p-4 lg:col-span-6">
        <h2 className="text-lg font-semibold">Thread Timeline</h2>
        <p className="text-sm text-slate-500">Gmail-style conversation execution workspace.</p>
      </div>
      <div className="col-span-12 rounded-2xl border bg-white p-4 lg:col-span-3">
        <h2 className="text-lg font-semibold">Execution Actions</h2>
        <ul className="mt-2 space-y-2 text-sm"><li>Assign owner</li><li>Create follow-up</li><li>Escalate</li><li>Approve send</li><li>Archive</li></ul>
      </div>
    </div>
  )
}
