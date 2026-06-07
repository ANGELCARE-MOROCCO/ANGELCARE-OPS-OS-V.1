import { requireAccess } from '@/lib/auth/requireAccess'
import { getAcademyProgramsDashboard } from '@/lib/academy-programs/repository'
import AcademyProgramsClient from './AcademyProgramsClient'

export const dynamic = 'force-dynamic'

export default async function AcademyProgramsPage() {
  await requireAccess('academy.view')
  const dashboard = await getAcademyProgramsDashboard()
  return <AcademyProgramsClient initialDashboard={dashboard} />
}
