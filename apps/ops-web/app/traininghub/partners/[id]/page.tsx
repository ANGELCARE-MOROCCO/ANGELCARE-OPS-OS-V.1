import { TrainingHubInternalAdminPage } from '@/components/traininghub/internal/TrainingHubInternalAdminPage'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TrainingHubInternalAdminPage moduleKey="partner-dossier" entityId={id} />
}
