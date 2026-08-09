import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { AssessmentCommand } from '@/angelcare-marketplace/academy-engine/components/AssessmentCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.academy.view');void context;return <AssessmentCommand />}
