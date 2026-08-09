import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { QualityCheckRegistry } from '@/angelcare-marketplace/b2b-verticals/components/SpecializedBoards'
import { listEstablishmentQualityChecks } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.establishments.quality_review');return <QualityCheckRegistry checks={await listEstablishmentQualityChecks(context)}/>}
