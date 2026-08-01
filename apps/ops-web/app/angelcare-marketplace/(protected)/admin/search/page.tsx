import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { GlobalSearchClient } from '@/angelcare-marketplace/sovereign-control/components/GlobalSearchClient'
export const metadata={title:'Recherche globale · ANGELCARE'}
export default async function Page(){await requireMarketplacePageContext('marketplace.backoffice.search');return <><PageHeader eyebrow="SOVEREIGN SEARCH" title="Rechercher tout le Marketplace" description="Une recherche gouvernée sur les objets opérationnels, leurs propriétaires, statuts et prochaines actions."/><GlobalSearchClient/></>}
