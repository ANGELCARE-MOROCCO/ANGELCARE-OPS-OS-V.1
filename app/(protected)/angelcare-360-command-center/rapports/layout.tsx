import type { Metadata } from 'next'
import { ANGELCARE360_PRODUCT_NAME } from '@/lib/angelcare360/constants'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server'

export const metadata: Metadata = {
  title: `Rapports, Exports & Documents · ${ANGELCARE360_PRODUCT_NAME}`,
  description: 'Cockpit de reporting, exports et gouvernance documentaire pour AngelCare 360.',
}

export const dynamic = 'force-dynamic'

export default async function Angelcare360RapportsLayout({ children }: { children: React.ReactNode }) {
  const context = await getAngelcare360AccessContext()
  if (context?.school) {
    await requireAngelcare360Permission('rapports.view', { context })
  }
  return <div style={layoutStyle}>{children}</div>
}

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}
