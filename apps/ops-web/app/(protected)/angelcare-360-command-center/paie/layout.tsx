import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server'
import { ANGELCARE360_PRODUCT_NAME } from '@/lib/angelcare360/constants'

export const metadata: Metadata = {
  title: `Paie & Rémunérations · ${ANGELCARE360_PRODUCT_NAME}`,
  description: 'Espace paie et rémunérations ANGELCARE 360.',
}

export const dynamic = 'force-dynamic'

export default async function Angelcare360PayrollLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  await requireAngelcare360Permission('paie.view', { context })
  return <div style={layoutStyle}>{children}</div>
}

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}
