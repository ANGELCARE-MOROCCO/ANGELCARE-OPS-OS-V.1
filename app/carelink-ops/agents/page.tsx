import { CareLinkOpsShell } from '@/components/carelink/ops/CareLinkOpsShell'
import { CareLinkAgentsCommandWorkspace } from '@/components/carelink/ops/agents/CareLinkAgentsCommandWorkspace'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function CareLinkOpsAgentsPage() {
  return (
    <CareLinkOpsShell
      title="Agents Command Center"
      subtitle="Workforce, caregivers, readiness, missions, payments, documents, incidents, dispatch and mobile synchronization."
    >
      <CareLinkAgentsCommandWorkspace />
    </CareLinkOpsShell>
  )
}
