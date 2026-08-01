import type {
  MarketplaceAuditEvent,
  MarketplaceModule,
  MarketplaceReadinessCheck,
} from '@/angelcare-marketplace/domain/types'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { FoundationCockpit } from '@/angelcare-marketplace/features/admin/FoundationCockpit'
import {
  listMarketplaceAuditEvents,
  listMarketplaceModules,
  listMarketplaceReadiness,
  marketplaceFoundationHealth,
} from '@/angelcare-marketplace/server/repository'

export const metadata = { title: 'Cockpit de fondation' }

export default async function MarketplaceAdminPage() {
  await requireMarketplacePageContext('marketplace.admin.access')
  let modules: MarketplaceModule[] = []
  let readiness: MarketplaceReadinessCheck[] = []
  let auditEvents: MarketplaceAuditEvent[] = []
  const health = await marketplaceFoundationHealth()
  try { modules = await listMarketplaceModules() } catch {}
  try { readiness = await listMarketplaceReadiness() } catch {}
  try { auditEvents = await listMarketplaceAuditEvents({ limit: 10 }) } catch {}
  return <FoundationCockpit modules={modules} readiness={readiness} auditEvents={auditEvents} health={health} />
}
