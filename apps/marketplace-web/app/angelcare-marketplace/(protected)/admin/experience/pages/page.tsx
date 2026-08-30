import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { PageRegistry } from '@/angelcare-marketplace/experience-builder/components/PageRegistry'
import { listPages } from '@/angelcare-marketplace/experience-builder/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.cms.view');return <><PageHeader eyebrow="BOUTIQUE · CONTENT PORTFOLIO" title="Pages, versions et territoires" description="Registre opératoire des pages publiques, traductions, propriétaires et cycles de publication."/><PageRegistry pages={await listPages()} canCreate={hasMarketplacePermission(context,'marketplace.cms.create')}/></>}
