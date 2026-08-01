import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ExperienceCommand } from '@/angelcare-marketplace/experience-builder/components/ExperienceCommand'
import { listPages, listPublicationJobs } from '@/angelcare-marketplace/experience-builder/repository'

export default async function Page() {
  await requireMarketplacePageContext('marketplace.cms.view')
  const [pages, jobs] = await Promise.all([listPages(), listPublicationJobs()])
  return <ExperienceCommand pages={pages} jobs={jobs} />
}
