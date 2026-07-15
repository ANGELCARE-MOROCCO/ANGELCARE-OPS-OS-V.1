import { requireUser } from '@/lib/auth/session'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import { buildAngelcare360AccessProfile, normalizeAngelcare360User } from './permissions'

export async function requireAngelcare360Session() {
  const user = (await requireUser().catch(() => null)) as Angelcare360SessionUser | null
  if (!user) return null
  const normalized = normalizeAngelcare360User(user)
  if (!normalized) return null
  return {
    user: normalized,
    access: buildAngelcare360AccessProfile(normalized),
  }
}

export function resolveAngelcare360Access(user: Angelcare360SessionUser | null | undefined): Angelcare360AccessProfile {
  return buildAngelcare360AccessProfile(user || null)
}

