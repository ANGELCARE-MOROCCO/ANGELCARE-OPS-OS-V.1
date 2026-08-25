import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { adminCustomerList } from '@/angelcare-marketplace/admin-control-plane/repository'
import { ManualOrderCommand } from '@/angelcare-marketplace/admin-control-plane/components/ManualOrderCommand'

export const dynamic = 'force-dynamic'

export default async function Page() {
  await requireMarketplacePageContext('marketplace.operations.missions.create')
  const customers = await adminCustomerList({ limit: 500 })
  return <ManualOrderCommand customers={customers.customers.map((customer) => ({ id: customer.id, public_reference: customer.public_reference, display_name: customer.display_name, email: customer.email }))} />
}
