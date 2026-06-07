import { requireAccess } from '@/lib/auth/requireAccess'
import { getAcademyCohortsDashboard } from '@/lib/academy-cohorts/repository'
import AcademyCohortsClient from './AcademyCohortsClient'

export const dynamic = 'force-dynamic'

export default async function AcademyCohortsPage() {
  await requireAccess('academy.view')
  const dashboard = await getAcademyCohortsDashboard()
  return <AcademyCohortsClient initialDashboard={dashboard} />
}
