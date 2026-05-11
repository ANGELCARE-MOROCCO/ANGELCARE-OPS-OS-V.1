"use client"

type Props = {
  items: any[]
}

export function QueueStatusPanel({ items }: Props) {
  return (
    <div className="space-y-3">
      {items.map((row) => (
        <div
          key={row.id}
          className="rounded-2xl border border-slate-200 p-4"
        >
          <div className="font-bold">{row.subject}</div>

          <div className="mt-2 text-sm text-slate-500">
            {row.to_email}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">
              {row.status}
            </div>

            {row.last_error ? (
              <div className="text-xs text-red-500">
                {row.last_error}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
