import type { MarketplaceReadinessCheck } from '@/angelcare-marketplace/domain/types'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { FoundationUnavailable } from '@/angelcare-marketplace/components/FoundationUnavailable'
import { ReadinessClient } from '@/angelcare-marketplace/features/admin/ReadinessClient'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { listMarketplaceReadiness } from '@/angelcare-marketplace/server/repository'

export const metadata = { title: 'Préparation & sign-off' }

export default async function MarketplaceReadinessPage() {
  const context = await requireMarketplacePageContext('marketplace.readiness.view')
  let checks: MarketplaceReadinessCheck[] = []
  let available = true
  try { checks = await listMarketplaceReadiness() } catch { available = false }
  return (
    <>
      <PageHeader
        eyebrow="Assurance contractuelle"
        title="Préparation Mega ZIP 01"
        description="Chaque contrôle indique son statut, son propriétaire, sa preuve, son blocage et sa prochaine action. Le sign-off reste conditionnel tant qu’un contrôle obligatoire n’est pas prêt."
      />
      {available
        ? (
          <ReadinessClient
            initialChecks={checks}
            canUpdate={context.permissions.includes('marketplace.readiness.update')}
            canSignOff={context.permissions.includes('marketplace.readiness.sign_off')}
          />
        )
        : <FoundationUnavailable />}
    </>
  )
}
