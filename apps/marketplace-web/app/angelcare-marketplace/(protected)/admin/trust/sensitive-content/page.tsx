import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listSensitiveReviews } from '@/angelcare-marketplace/trust-quality/repository'
import { SensitiveContentCommand } from '@/angelcare-marketplace/trust-quality/components/SensitiveContentCommand'
import { SensitiveReviewDecisionDesk } from '@/angelcare-marketplace/trust-quality/components/TrustDecisionDesk'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.sensitive_content.review');const items=await listSensitiveReviews(context);return <><SensitiveContentCommand items={items}/><SensitiveReviewDecisionDesk items={items} canApprove={hasMarketplacePermission(context,'marketplace.sensitive_content.approve')}/></>}
