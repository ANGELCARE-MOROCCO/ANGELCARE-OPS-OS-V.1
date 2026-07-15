import TrainingHubOffersCommandCenter from '@/components/traininghub/offres/TrainingHubOffersCommandCenter'
import { requireTrainingHubPageContext } from '../traininghub-page-context'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TrainingHubOffresPage() {
  await requireTrainingHubPageContext()
  return <TrainingHubOffersCommandCenter />
}
