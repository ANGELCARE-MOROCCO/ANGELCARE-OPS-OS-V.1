import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listSecurityEvents } from '@/angelcare-marketplace/analytics-security/repository'
import { SecurityEvents } from '@/angelcare-marketplace/analytics-security/components/SecurityRegisters'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.security.events.view');return <SecurityEvents items={await listSecurityEvents(context)}/>}