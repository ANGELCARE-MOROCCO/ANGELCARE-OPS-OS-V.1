import { notFound } from 'next/navigation'
import { hasMarketplacePermission, requireMarketplacePageContext } from '../auth/context'
import { customerMegaDossier } from '../enterprise-command/repository'
import { CustomerCommandPage } from '../enterprise-command/components/CustomerCommandPage'
import type { CustomerDossierTab } from '../enterprise-command/components/CustomerMegaDossier'
import { listTerritories } from '../territory-os/repository'
import { customerRelationshipOverview } from './repository'
import { CustomerRegistryWorkspace } from './components/CustomerRegistryWorkspace'
import { CustomerCreateWorkspace, CustomerHealthWorkspace } from './components/CustomerApprovedWorkspaces'
import { SegmentIntelligenceWorkspace } from './components/SegmentIntelligenceWorkspace'
import { CustomerCasesWorkspace } from './components/CustomerCasesWorkspace'
import type { MarketplaceRequestContext } from '../domain/types'
import type { CustomerDossierPermissions } from '../enterprise-command/customer-permissions'

function customerPermissions(context: MarketplaceRequestContext): CustomerDossierPermissions {
  return {
    manageCustomer: hasMarketplacePermission(context, 'marketplace.admin.access'),
    manageFamily: hasMarketplacePermission(context, 'marketplace.family.admin.manage'),
    createOrder: hasMarketplacePermission(context, 'marketplace.operations.missions.manage'),
    createBooking: hasMarketplacePermission(context, 'marketplace.operations.missions.create'),
    manageBooking: hasMarketplacePermission(context, 'marketplace.operations.missions.manage'),
    manageFinance: hasMarketplacePermission(context, 'marketplace.finance.manage'),
    approveFinanceException: hasMarketplacePermission(context, 'marketplace.finance.exceptions.approve'),
    transitionOpportunity: hasMarketplacePermission(context, 'marketplace.crm.opportunities.transition'),
    manageQuotes: hasMarketplacePermission(context, 'marketplace.crm.quotes.manage'),
    approveQuotes: hasMarketplacePermission(context, 'marketplace.crm.quotes.approve'),
    commentOnCustomer: hasMarketplacePermission(context, 'marketplace.backoffice.objects.comment'),
    manageCrmTasks: hasMarketplacePermission(context, 'marketplace.crm.tasks.manage'),
    logCrmCommunications: hasMarketplacePermission(context, 'marketplace.crm.communications.log'),
    exportCustomer: hasMarketplacePermission(context, 'marketplace.admin.access'),
  }
}

export async function CustomerRegistryPage() {
  const context = await requireMarketplacePageContext('marketplace.admin.access')
  return <CustomerRegistryWorkspace snapshot={await customerRelationshipOverview()} permissions={customerPermissions(context)} canCreate={hasMarketplacePermission(context, 'marketplace.admin.access')}/>
}

export async function CustomerCreatePage() {
  const context = await requireMarketplacePageContext('marketplace.admin.access')
  const territories = await listTerritories(context).catch(() => [])
  return <CustomerCreateWorkspace
    canManage={hasMarketplacePermission(context, 'marketplace.admin.access')}
    territories={territories.map((territory) => ({ id: territory.id, label: territory.name, reference: territory.public_reference }))}
  />
}

export async function CustomerDossierPage({ customerId, tab = '360' }: { customerId: string; tab?: CustomerDossierTab }) {
  const context = await requireMarketplacePageContext('marketplace.admin.access')
  const dossier = await customerMegaDossier(customerId).catch(() => null)
  if (!dossier) notFound()
  return <CustomerCommandPage customerId={customerId} initialTab={tab} initialData={dossier} permissions={customerPermissions(context)}/>
}

export async function CustomerSegmentsPage() {
  const context = await requireMarketplacePageContext('marketplace.admin.access')
  return <SegmentIntelligenceWorkspace snapshot={await customerRelationshipOverview()} canManage={hasMarketplacePermission(context, 'marketplace.admin.access')} canActivate={hasMarketplacePermission(context, 'marketplace.merchandising.manage')}/>
}

export async function CustomerSupportPage() {
  const context = await requireMarketplacePageContext('marketplace.admin.access')
  return <CustomerCasesWorkspace snapshot={await customerRelationshipOverview()} canManageCase={hasMarketplacePermission(context, 'marketplace.operating_kernel.manage')}/>
}

export async function CustomerHealthPage() {
  const context = await requireMarketplacePageContext('marketplace.admin.access')
  return <CustomerHealthWorkspace snapshot={await customerRelationshipOverview()} permissions={customerPermissions(context)}/>
}
