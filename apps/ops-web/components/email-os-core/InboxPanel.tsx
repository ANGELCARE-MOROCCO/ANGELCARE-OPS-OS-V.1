"use client"

type Props = {
  inbox: any[]
}

export function InboxPanel({ inbox }: Props) {
  return (
    <div className="space-y-3">
      {inbox.map((row) => (
        <div
          key={row.id}
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="font-bold text-slate-900">
            {row.subject}
          </div>

          <div className="mt-1 text-sm text-slate-500">
            {row.from_email}
          </div>

          <div className="mt-3 text-sm text-slate-700">
            {row.preview}
          </div>

          <div className="mt-4 text-xs uppercase text-slate-400">
            {row.status}
          </div>
        </div>
      ))}
    </div>
  )
}
