import type { ReactNode } from 'react'
import { requireMarketplaceAdminPageContext } from '@/angelcare-marketplace/auth/context'
import { AdminShell } from '@/angelcare-marketplace/shells/AdminShell'

export default async function MarketplaceAdminLayout({ children }: { children: ReactNode }) {
  const context = await requireMarketplaceAdminPageContext('marketplace.admin.access')
  return <AdminShell context={context}>{children}</AdminShell>
}
