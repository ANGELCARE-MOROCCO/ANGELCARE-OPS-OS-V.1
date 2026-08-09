import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listComplianceReviews } from '@/angelcare-marketplace/trust-quality/repository'
import { ComplianceAuthority } from '@/angelcare-marketplace/trust-quality/components/TrustRegisters'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.compliance.review');return <ComplianceAuthority items={await listComplianceReviews(context)}/>}