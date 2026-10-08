import type { ReactNode } from 'react'
import { requireMarketplaceAdminPageContext } from '@/angelcare-marketplace/auth/context'
import { AdminShell } from '@/angelcare-marketplace/shells/AdminShell'
import type { Metadata } from 'next'

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } }

export default async function MarketplaceAdminLayout({ children }: { children: ReactNode }) {
  const context = await requireMarketplaceAdminPageContext('marketplace.admin.access')
  return <AdminShell context={context}>{children}</AdminShell>
}
