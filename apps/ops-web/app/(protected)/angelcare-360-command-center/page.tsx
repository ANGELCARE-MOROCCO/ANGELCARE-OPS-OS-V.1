import Angelcare360CommandCenterView from '@/components/angelcare360/Angelcare360CommandCenterView'
import { requireUser } from '@/lib/auth/session'
import { buildAngelcare360AccessProfile, normalizeAngelcare360User } from '@/lib/angelcare360/permissions'

export const dynamic = 'force-dynamic'

export default async function Angelcare360CommandCenterPage() {
  const rawUser = await requireUser()
  const user = normalizeAngelcare360User(rawUser)

  if (!user) return null

  const access = buildAngelcare360AccessProfile(user)

  return <Angelcare360CommandCenterView user={user} access={access} variant="overview" />
}

