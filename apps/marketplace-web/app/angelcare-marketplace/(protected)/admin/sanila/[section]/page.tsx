import { notFound } from 'next/navigation'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { getSanilaAdminSnapshot } from '@/angelcare-marketplace/sanila-admin/repository'
import { SanilaWorkspace } from '@/angelcare-marketplace/sanila-admin/components/SanilaWorkspace'
import { getSanilaWorldState } from '@/angelcare-marketplace/sanila-world/repository'
import { SANILA_WORLD_SECTIONS } from '@/angelcare-marketplace/sanila-world/contract'

export const dynamic = 'force-dynamic'

export default async function SanilaWorkspaceSectionPage({ params }: { params: Promise<{ section: string }> }) {
  await requireMarketplacePageContext('marketplace.public.inquiries.manage')
  const { section } = await params
  if (!SANILA_WORLD_SECTIONS.includes(section as never) || section === 'command') notFound()
  const [snapshot, world] = await Promise.all([getSanilaAdminSnapshot(), getSanilaWorldState()])
  return <SanilaWorkspace section={section} snapshot={snapshot} initialWorld={world} />
}
