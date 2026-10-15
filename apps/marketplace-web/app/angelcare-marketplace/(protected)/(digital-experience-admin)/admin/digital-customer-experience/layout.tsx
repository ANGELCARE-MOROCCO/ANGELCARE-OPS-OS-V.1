import type { ReactNode } from 'react'
import { requireMarketplaceAdminPageContext } from '@/angelcare-marketplace/auth/context'
import { AdminShell } from '@/angelcare-marketplace/shells/AdminShell'
export const dynamic='force-dynamic'
export default async function Layout({children}:{children:ReactNode}){const context=await requireMarketplaceAdminPageContext('marketplace.digital_experience.view');return <AdminShell context={context}>{children}</AdminShell>}
