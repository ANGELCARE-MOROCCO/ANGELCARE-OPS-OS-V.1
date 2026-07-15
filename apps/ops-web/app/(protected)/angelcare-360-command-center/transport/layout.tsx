import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ANGELCARE360_PRODUCT_NAME } from '@/lib/angelcare360/constants'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server'

export const metadata: Metadata = {
  title: `Transport & Sécurité · ${ANGELCARE360_PRODUCT_NAME}`,
  description: 'Espace transport et sécurité ANGELCARE 360.',
}

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) {
    redirect('/angelcare-360-command-center')
  }

  await requireAngelcare360Permission('transport.view', { context })
  return <div style={layoutStyle}>{children}</div>
}

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
}

