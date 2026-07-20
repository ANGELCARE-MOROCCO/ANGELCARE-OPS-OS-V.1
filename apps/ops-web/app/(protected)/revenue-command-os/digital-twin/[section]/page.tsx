import { notFound } from 'next/navigation'
import { REVENUE_TWIN_SECTIONS } from '@/lib/revenue-command-os/digital-twin/constants'
import type { RevenueTwinSectionKey } from '@/lib/revenue-command-os/types'
import DigitalTwinWorkspace from '../_components/DigitalTwinWorkspace'

export const dynamic = 'force-dynamic'

export default async function RevenueDigitalTwinSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const found = REVENUE_TWIN_SECTIONS.find((item) => item.key === section && item.key !== 'overview')
  if (!found) notFound()
  return <DigitalTwinWorkspace sectionKey={found.key as RevenueTwinSectionKey} />
}
