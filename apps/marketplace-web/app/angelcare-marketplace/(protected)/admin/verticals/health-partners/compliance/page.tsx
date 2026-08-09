import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { HealthComplianceBoard } from '@/angelcare-marketplace/b2b-verticals/components/SpecializedBoards'
import { listHealthBoundaries } from '@/angelcare-marketplace/b2b-verticals/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.b2b.health_partners.compliance_review');const data=await listHealthBoundaries(context);return <HealthComplianceBoard boundaries={data.boundaries} consents={data.consents}/>}
