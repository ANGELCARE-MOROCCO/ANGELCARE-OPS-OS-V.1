import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PortfolioRegistry } from '@/angelcare-marketplace/b2b-verticals/components/PortfolioRegistry'
import { listOrganizations } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.view');const organizations=await listOrganizations({context});return <PortfolioRegistry title="Registre des organisations B2B" subtitle="Identité, statut, risque, programme et prochaine action." organizations={organizations} diagnostics={[]} programs={[]}/>}
