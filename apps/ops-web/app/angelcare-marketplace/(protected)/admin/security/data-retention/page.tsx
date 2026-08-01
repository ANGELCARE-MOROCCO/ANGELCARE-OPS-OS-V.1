import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listRetentionPolicies } from '@/angelcare-marketplace/analytics-security/repository'
import { RetentionAuthority } from '@/angelcare-marketplace/analytics-security/components/SecurityRegisters'
export default async function Page(){await requireMarketplacePageContext('marketplace.security.view');return <RetentionAuthority items={await listRetentionPolicies()}/>}