import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { ReusableExperienceStudio } from '@/angelcare-marketplace/experience-builder/components/ReusableExperienceStudio'
import { listPages, listTemplates } from '@/angelcare-marketplace/experience-builder/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.cms.view');const[templates,pages]=await Promise.all([listTemplates(),listPages()]);return <><PageHeader eyebrow="EXPERIENCE · REUSABLE COMPOSITION" title="Templates" description="Compositions versionnées, créées depuis de vraies révisions de pages. Aucun code caché, aucune publication implicite."/><ReusableExperienceStudio mode="templates" initialItems={templates} pages={pages} canManage={hasMarketplacePermission(context,'marketplace.cms.pages.manage')}/></>}
