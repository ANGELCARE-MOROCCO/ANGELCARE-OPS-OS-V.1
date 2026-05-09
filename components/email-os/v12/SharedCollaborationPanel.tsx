
export default function SharedCollaborationPanel() {
  return (
    <div className="rounded-3xl border bg-white p-5">
      <h2 className="text-lg font-semibold">Shared Collaboration Workspace</h2>
      <div className="mt-5 space-y-4">
        {["Assigned Team", "Live Notes", "Approval Timeline"].map((item) => (
          <div key={item} className="rounded-2xl border p-4"><div className="font-medium">{item}</div><div className="mt-2 text-sm text-slate-500">Multi-user collaboration, annotations and governance actions.</div></div>
        ))}
      </div>
    </div>
  )
}
