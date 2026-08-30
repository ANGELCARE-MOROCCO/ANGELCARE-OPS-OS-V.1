import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { commerceStudioData } from '@/angelcare-marketplace/commerce-studio/repository'
import { listPublicationJobs } from '@/angelcare-marketplace/experience-builder/repository'
import { homepageReleaseSnapshot } from '@/angelcare-marketplace/homepage-final/repository'
import { LocalizationCockpit } from '@/angelcare-marketplace/localization-intelligence/components/LocalizationCockpit'
import { localizationSummary } from '@/angelcare-marketplace/localization-intelligence/repository'

export default async function Page() {
  const context = await requireMarketplacePageContext('marketplace.localization.access')
  const [summary, jobs, commerce, homepage] = await Promise.all([
    localizationSummary(),
    listPublicationJobs(),
    commerceStudioData(context),
    homepageReleaseSnapshot(),
  ])
  return <LocalizationCockpit
    summary={summary}
    publicationJobs={jobs}
    publicationEvents={commerce.publicationEvents}
    homepageReleases={homepage.releases}
    canRunScan={hasMarketplacePermission(context, 'marketplace.localization.scans.run')}
    canPublish={hasMarketplacePermission(context, 'marketplace.publication.manage')}
  />
}
