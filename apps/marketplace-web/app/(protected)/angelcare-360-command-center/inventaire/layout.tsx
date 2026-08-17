import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server/context'

export const metadata: Metadata = {
  title: 'Inventaire · SANILA Material Command',
  description: 'Système institutionnel de contrôle matériel, stock, mouvements et responsabilité SANILA.',
}
export const dynamic = 'force-dynamic'

export default async function MaterialCommandLayout({ children }: { children: React.ReactNode }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  await requireAngelcare360Permission('inventaire.view', { context })
  return children
}
