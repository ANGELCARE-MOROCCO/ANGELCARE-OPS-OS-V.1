import TrainingHubCommercialCommandCenter from '@/components/traininghub/commercial/TrainingHubCommercialCommandCenter'
import { requireTrainingHubPageContext } from '../traininghub-page-context'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TrainingHubCommercialPage() {
  await requireTrainingHubPageContext()
  return <TrainingHubCommercialCommandCenter />
}
