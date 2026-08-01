import type { ReactNode } from 'react'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { FamilyShell } from '@/angelcare-marketplace/family-experience/components/FamilyShell'

export default async function Layout({ children }: { children: ReactNode }) {
  await requireMarketplacePageContext('marketplace.family.access')
  return <FamilyShell>{children}</FamilyShell>
}
