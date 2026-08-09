import TrainingHubPartnerBlueprintPortal from './TrainingHubPartnerBlueprintPortal'

type Props = {
  context?: any
  initialSummary?: any
  initialRequests?: any[]
  queryWarnings?: string[]
  adminPreview?: boolean
}

export default function TrainingHubPartnerPortalWorkspace({
  context,
  initialSummary,
  initialRequests = [],
  queryWarnings = [],
  adminPreview = false,
}: Props) {
  return (
    <TrainingHubPartnerBlueprintPortal
      context={context}
      initialData={initialSummary || null}
      initialRequests={initialRequests}
      queryWarnings={queryWarnings}
      adminPreview={adminPreview}
    />
  )
}
