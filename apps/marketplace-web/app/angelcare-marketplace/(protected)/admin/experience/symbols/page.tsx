import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { ReusableExperienceStudio } from '@/angelcare-marketplace/experience-builder/components/ReusableExperienceStudio'
import { listPages, listSymbols } from '@/angelcare-marketplace/experience-builder/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.cms.view');const[symbols,pages]=await Promise.all([listSymbols(),listPages()]);return <><PageHeader eyebrow="EXPERIENCE · GLOBAL CONTENT" title="Symboles versionnés" description="Identités réutilisables avec current/published distincts, historique immutable, restauration et Where Used avant archivage."/><ReusableExperienceStudio mode="symbols" initialItems={symbols} pages={pages} canManage={hasMarketplacePermission(context,'marketplace.cms.blocks.manage')}/></>}
