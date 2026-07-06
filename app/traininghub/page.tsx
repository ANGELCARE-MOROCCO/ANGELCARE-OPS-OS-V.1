import TrainingHubCommandCenterDynamicPremium from '@/components/traininghub/internal/TrainingHubCommandCenterDynamicPremium'
import { requireTrainingHubPageContext } from './traininghub-page-context'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  await requireTrainingHubPageContext()

  return <TrainingHubCommandCenterDynamicPremium />
}
