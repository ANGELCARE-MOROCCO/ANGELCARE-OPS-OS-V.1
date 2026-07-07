import type { Metadata } from 'next'
import { ANGELCARE360_PRODUCT_NAME } from '@/lib/angelcare360/constants'

export const metadata: Metadata = {
  title: `Finance & Paiements · ${ANGELCARE360_PRODUCT_NAME}`,
  description: 'Espace finance scolaire français pour AngelCare 360.',
}

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
