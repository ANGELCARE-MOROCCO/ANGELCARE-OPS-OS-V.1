
export default function TeamAssignmentBoard() {
  return (
    <div className="rounded-3xl border bg-white p-6">
      <h2 className="text-xl font-bold">Team Assignment Board</h2>
      <div className="mt-6 grid grid-cols-3 gap-4">{["Operations", "HR", "Legal"].map((team) => (<div key={team} className="rounded-2xl border p-4"><div className="font-semibold">{team}</div><div className="mt-2 text-sm text-slate-500">Active collaboration workspace and ownership assignments.</div></div>))}</div>
    </div>
  )
}
