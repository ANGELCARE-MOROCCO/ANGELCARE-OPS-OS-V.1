import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/session'
import Angelcare360Shell from '@/components/angelcare360/layout/Angelcare360Shell'
import { buildAngelcare360AccessProfile, normalizeAngelcare360User } from '@/lib/angelcare360/permissions'
import { ANGELCARE360_PRODUCT_NAME } from '@/lib/angelcare360/constants'

export const metadata: Metadata = {
  title: ANGELCARE360_PRODUCT_NAME,
  description: 'Cockpit de direction français et indépendant pour AngelCare 360.',
}

export default async function Angelcare360CommandCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const rawUser = await requireUser()
  const user = normalizeAngelcare360User(rawUser)

  if (!user) {
    return null
  }

  const access = buildAngelcare360AccessProfile(user)

  return <Angelcare360Shell user={user} access={access}>{children}</Angelcare360Shell>
}

