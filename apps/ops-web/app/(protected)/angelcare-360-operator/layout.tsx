import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ANGELCARE360_PRODUCT_NAME } from '@/lib/angelcare360/constants'
import { requireAngelcare360OperatorSession } from '@/lib/angelcare360/operator/access'
import Angelcare360OperatorShell from '@/components/angelcare360/operator/Angelcare360OperatorShell'

export const metadata: Metadata = {
  title: `Backoffice Opérateur · ${ANGELCARE360_PRODUCT_NAME}`,
  description: 'Backoffice interne AngelCare pour les clients SaaS, abonnements, facturation et service.',
}

export const dynamic = 'force-dynamic'

export default async function Angelcare360OperatorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAngelcare360OperatorSession()
  if (!session) {
    notFound()
  }

  return <Angelcare360OperatorShell user={session.user} access={session.access}>{children}</Angelcare360OperatorShell>
}

