import { requireUser } from '@/lib/auth/session'
import { loadAuthorizedWorkspaceHub } from '@/lib/workspace-hub/authorized-modules'
import AuthorizedWorkspaceHub from '@/components/workspace-hub/AuthorizedWorkspaceHub'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireUser()
  const data = await loadAuthorizedWorkspaceHub(user)

  return <AuthorizedWorkspaceHub initialData={data} />
}
