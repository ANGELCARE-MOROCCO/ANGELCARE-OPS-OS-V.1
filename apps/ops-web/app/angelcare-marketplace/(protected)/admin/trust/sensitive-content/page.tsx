import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listSensitiveReviews } from '@/angelcare-marketplace/trust-quality/repository'
import { SensitiveContentCommand } from '@/angelcare-marketplace/trust-quality/components/SensitiveContentCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.sensitive_content.review');return <SensitiveContentCommand items={await listSensitiveReviews(context)}/>}