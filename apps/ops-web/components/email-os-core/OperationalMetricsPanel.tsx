"use client"

type Props = {
  metrics: {
    sent: number
    failed: number
    queued: number
    synced: number
  }
}

export function OperationalMetricsPanel({ metrics }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card title="Emails envoyés" value={metrics.sent} />
      <Card title="Échecs" value={metrics.failed} />
      <Card title="En attente" value={metrics.queued} />
      <Card title="Synchronisés" value={metrics.synced} />
    </div>
  )
}

function Card({
  title,
  value
}: {
  title: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm font-semibold text-slate-500">
        {title}
      </div>

      <div className="mt-3 text-3xl font-black text-slate-900">
        {value}
      </div>
    </div>
  )
}
