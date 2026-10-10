import type { ReactNode } from 'react'
import {CommerceFrame} from '@/angelcare-marketplace/customer-experience/CommerceFrame'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { getFamilyDashboard } from '@/angelcare-marketplace/family-experience/repository'
import { FamilyShell } from '@/angelcare-marketplace/family-experience/components/FamilyShell'

export default async function Layout({ children }: { children: ReactNode }) {
  const context=await requireMarketplacePageContext('marketplace.family.access')
  const data=await getFamilyDashboard(context)
  return <CommerceFrame locale={data.account.preferred_locale}><FamilyShell locale={data.account.preferred_locale}>{children}</FamilyShell></CommerceFrame>
}
