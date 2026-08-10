import { notFound } from 'next/navigation'
import Angelcare360OperatorHealthPanel from '@/components/angelcare360/operator/Angelcare360OperatorHealthPanel'
import Angelcare360OperatorPageShell from '@/components/angelcare360/operator/Angelcare360OperatorPageShell'
import Angelcare360OperatorTimeline from '@/components/angelcare360/operator/Angelcare360OperatorTimeline'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import { getOperatorCustomerHealthDashboard } from '@/lib/angelcare360/operator/health'
import { listOperatorServiceEvents } from '@/lib/angelcare360/operator/service'

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorCustomerHealthPage() {
  const session = await requireAngelcare360OperatorSession()
  if (!session) notFound()

  const [health, events] = await Promise.all([getOperatorCustomerHealthDashboard(), listOperatorServiceEvents()])

  return (
    <Angelcare360OperatorPageShell
      badge="Santé clients"
      statusLabel={health.scoreLabel}
      title="Santé client"
      subtitle="Score opérationnel indicatif calculé uniquement à partir de signaux réels disponibles."
    >
      <Angelcare360OperatorHealthPanel health={health} />
      <Angelcare360OperatorTimeline
        title="Événements de service récents"
        items={events.slice(0, 12).map((event) => ({
          title: `${event.title} · ${event.event_type}`,
          detail: event.description || event.status,
          timestamp: event.occurred_at,
          tone: event.severity === 'critical' ? 'critical' : event.severity === 'warning' ? 'warning' : event.severity === 'info' ? 'info' : 'success',
        }))}
      />
    </Angelcare360OperatorPageShell>
  )
}
