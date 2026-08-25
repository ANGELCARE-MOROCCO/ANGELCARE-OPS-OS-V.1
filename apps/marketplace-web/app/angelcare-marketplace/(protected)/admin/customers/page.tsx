import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { adminCustomerList } from '@/angelcare-marketplace/admin-control-plane/repository'
import { CustomerCommand } from '@/angelcare-marketplace/admin-control-plane/components/CustomerCommand'

export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: { searchParams?: Promise<{ customerId?: string | string[]; create?: string | string[] }> }) {
  await requireMarketplacePageContext('marketplace.admin.access')
  const params = searchParams ? await searchParams : {}
  const customerId = Array.isArray(params.customerId) ? params.customerId[0] : params.customerId
  const create = Array.isArray(params.create) ? params.create[0] : params.create
  return <CustomerCommand initial={await adminCustomerList()} initialCustomerId={customerId || null} initialCreateKind={create || null} />
}
