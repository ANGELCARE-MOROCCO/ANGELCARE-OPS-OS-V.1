import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server'

export const metadata: Metadata = {
  title: 'Réclamations · SANILA Trust Resolution OS',
  description: 'Centre de confiance, résolution de service et qualité relationnelle de l’établissement.',
}

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClaimsLayout({ children }: { children: React.ReactNode }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  await requireAngelcare360Permission('reclamations.view', { context })
  return children
}
