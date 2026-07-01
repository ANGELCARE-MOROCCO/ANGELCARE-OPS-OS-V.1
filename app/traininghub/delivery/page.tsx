import TrainingHubShell from '@/components/traininghub/TrainingHubShell'
import TrainingHubDeliveryWorkspaceClient from '@/components/traininghub/TrainingHubDeliveryWorkspaceClient'
import { requireTrainingHubPageContext } from '../traininghub-page-context'
import { getTrainingHubDeliveryWorkspaceUiData } from '@/lib/traininghub/ui'

export default async function TrainingHubDeliveryPage() {
  const context = await requireTrainingHubPageContext()
  const data = await getTrainingHubDeliveryWorkspaceUiData()

  return (
    <TrainingHubShell
      context={context}
      active="delivery"
      title="Training Delivery Command Center"
      subtitle="Fulfillment terrain premium: sessions, staff participants, attendance, kit readiness, certificates, refresh e-learning et aftersales — sans mélange avec OpsOS."
      rightSlot={<a href="/api/traininghub/sessions" style={apiButtonStyle}>Sessions API</a>}
    >
      <TrainingHubDeliveryWorkspaceClient {...data} />
    </TrainingHubShell>
  )
}

const apiButtonStyle = {
  borderRadius: 16,
  padding: '11px 14px',
  background: '#0f2a52',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 950,
  boxShadow: '0 14px 30px rgba(15,42,82,.18)',
}
