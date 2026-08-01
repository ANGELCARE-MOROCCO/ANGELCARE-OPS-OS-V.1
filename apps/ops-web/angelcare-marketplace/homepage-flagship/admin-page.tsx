import { requireMarketplacePageContext } from '../auth/context'
import { getHomepageAdminData } from './repository'
import { HomepageAdminCommand } from './components/HomepageAdminCommand'

export async function HomepageAdminPage({ mode = 'overview' }: { mode?: string }) {
  const context = await requireMarketplacePageContext('marketplace.cms.pages.manage')
  const data = await getHomepageAdminData(context.territoryId)
  return <HomepageAdminCommand initialData={data} mode={mode}/>
}
