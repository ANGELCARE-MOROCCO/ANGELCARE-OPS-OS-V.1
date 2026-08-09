import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageHeader, ButtonLink } from '@/angelcare-marketplace/design-system/ui'
import { PageRegistry } from '@/angelcare-marketplace/experience-builder/components/PageRegistry'
import { listPages } from '@/angelcare-marketplace/experience-builder/repository'
export default async function Page(){await requireMarketplacePageContext('marketplace.cms.view');return <><PageHeader eyebrow="CONTENT PORTFOLIO" title="Pages, versions et territoires" description="Une source française, des variantes localisées, une publication gouvernée." actions={<ButtonLink href="/angelcare-marketplace/admin/experience/pages/new">Nouvelle page</ButtonLink>}/><PageRegistry pages={await listPages()}/></>}
