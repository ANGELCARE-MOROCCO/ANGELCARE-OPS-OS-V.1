"use client"

type Props = {
  outbox: any[]
}

export function OutboxPanel({ outbox }: Props) {
  return (
    <div className="space-y-3">
      {outbox.map((row) => (
        <div
          key={row.id}
          className="rounded-2xl border border-slate-200 p-4"
        >
          <div className="font-bold">{row.subject}</div>
          <div className="text-sm text-slate-500">{row.to_email}</div>
          <div className="mt-2 text-xs uppercase text-slate-400">
            {row.status}
          </div>
        </div>
      ))}
    </div>
  )
}
