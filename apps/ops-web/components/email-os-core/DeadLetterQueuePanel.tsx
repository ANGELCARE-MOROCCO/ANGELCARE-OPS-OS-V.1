"use client"

type Props = {
  items: any[]
}

export function DeadLetterQueuePanel({ items }: Props) {
  return (
    <div className="space-y-3">
      {items.map((row) => (
        <div
          key={row.id}
          className="rounded-2xl border border-red-200 bg-red-50 p-4"
        >
          <div className="font-bold text-red-700">
            Queue Failure
          </div>

          <div className="mt-2 text-sm text-slate-700">
            {row.error}
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Queue ID: {row.queue_id}
          </div>
        </div>
      ))}
    </div>
  )
}
