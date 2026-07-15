import TrainingHubPartnerPortalWorkspace from '@/components/traininghub/TrainingHubPartnerPortalWorkspace'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'
import { buildTrainingHubPartnerPortalSummary, listTrainingHubPartnerRequests } from '@/lib/traininghub/partner-portal-sync'
import { requireTrainingHubExperiencePageContext } from '../traininghub-page-context'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TrainingHubPartnerPortalPage() {
  const context = await requireTrainingHubExperiencePageContext('partner')
  const supabase = await createTrainingHubUserClient()

  const [summary, requests] = await Promise.all([
    buildTrainingHubPartnerPortalSummary(supabase, context),
    listTrainingHubPartnerRequests(supabase, context).catch(() => []),
  ])

  return (
    <TrainingHubPartnerPortalWorkspace
      context={context as any}
      initialSummary={summary}
      initialRequests={requests}
      queryWarnings={summary.warnings}
      adminPreview={context.isInternal || context.isSuperAdmin}
    />
  )
}
