import { requireUser } from '@/lib/auth/session'
import { loadAuthorizedWorkspaceHub } from '@/lib/workspace-hub/authorized-modules'
import AuthorizedWorkspaceHub from '@/components/workspace-hub/AuthorizedWorkspaceHub'
import AuthorizedResourceFamilyCards from '@/components/workspace-hub/AuthorizedResourceFamilyCards'
import { loadAuthorizedIndependentResources } from '@/lib/workspace-hub/authorized-resources'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireUser()
  const [data, independentResources] = await Promise.all([
    loadAuthorizedWorkspaceHub(user),
    loadAuthorizedIndependentResources(user),
  ])

  const representedRoutes = new Set(data.modules.flatMap((module) => module.routes.map((route) => route.href)))
  const supplementalIndependentResources = independentResources.filter((resource) => !representedRoutes.has(resource.href))

  return (
    <>
      <AuthorizedWorkspaceHub initialData={data} />
      <AuthorizedResourceFamilyCards resources={supplementalIndependentResources} />
    </>
  )
}
