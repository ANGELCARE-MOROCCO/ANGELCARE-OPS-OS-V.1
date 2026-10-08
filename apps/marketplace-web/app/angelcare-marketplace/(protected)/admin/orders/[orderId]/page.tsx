import { notFound } from 'next/navigation'
import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { orderMegaDossier } from '@/angelcare-marketplace/enterprise-command/repository'
import { OrderMegaCommand } from '@/angelcare-marketplace/enterprise-command/components/OrderMegaCommand'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const context = await requireMarketplacePageContext('marketplace.operations.view')
  const { orderId } = await params
  const dossier = await orderMegaDossier(orderId).catch(() => null)
  if (!dossier) notFound()
  return <OrderMegaCommand
    orderId={orderId}
    initialData={dossier}
    permissions={{
      createOrder: hasMarketplacePermission(context, 'marketplace.operations.missions.create'),
      manageOrder: hasMarketplacePermission(context, 'marketplace.operations.missions.manage'),
      manageLines: hasMarketplacePermission(context, 'marketplace.operations.missions.manage'),
      manageFinance: hasMarketplacePermission(context, 'marketplace.finance.manage'),
      exportDocuments: true,
    }}
  />
}
