import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/session'
import { buildAngelcare360AccessProfile, normalizeAngelcare360User } from '@/lib/angelcare360/permissions'
import Angelcare360AdministrationChrome from '@/components/angelcare360/administration/Angelcare360AdministrationChrome'
import { ANGELCARE360_PRODUCT_NAME } from '@/lib/angelcare360/constants'

export const metadata: Metadata = {
  title: `Administration · ${ANGELCARE360_PRODUCT_NAME}`,
  description: 'Plan de contrôle administratif français pour AngelCare 360.',
}

export const dynamic = 'force-dynamic'

export default async function Angelcare360AdministrationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const rawUser = await requireUser()
  const user = normalizeAngelcare360User(rawUser)
  if (!user) return null
  const access = buildAngelcare360AccessProfile(user)

  return <Angelcare360AdministrationChrome user={user} access={access}>{children}</Angelcare360AdministrationChrome>
}

