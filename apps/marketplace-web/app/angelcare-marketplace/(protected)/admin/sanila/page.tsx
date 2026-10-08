import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { getSanilaAdminSnapshot } from '@/angelcare-marketplace/sanila-admin/repository'
import { SanilaWorkspace } from '@/angelcare-marketplace/sanila-admin/components/SanilaWorkspace'
import { getSanilaWorldState } from '@/angelcare-marketplace/sanila-world/repository'

export const dynamic = 'force-dynamic'

export default async function SanilaWorkspacePage() {
  await requireMarketplacePageContext('marketplace.public.inquiries.manage')
  const [snapshot, world] = await Promise.all([getSanilaAdminSnapshot(), getSanilaWorldState()])
  return <SanilaWorkspace section="command" snapshot={snapshot} initialWorld={world} />
}
