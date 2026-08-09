'use client'

import { useMemo } from 'react'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
import { getAngelcare360AccessLevel, getAngelcare360RoleLabel } from '@/lib/angelcare360/permissions'

export function useAngelcare360Session(user: Angelcare360SessionUser | null, access: Angelcare360AccessProfile) {
  return useMemo(() => {
    const displayName = user?.full_name || user?.name || user?.email || 'Utilisateur connecté'
    const roleLabel = access?.roleLabel || getAngelcare360RoleLabel(user)
    const accessLevel = access?.accessLevel || getAngelcare360AccessLevel(user)

    return {
      user,
      displayName,
      roleLabel,
      accessLevel,
      summary: access?.summary || `${roleLabel} · ${accessLevel}`,
      scopeLabel: access?.scopeLabel || 'Périmètre opérationnel',
    }
  }, [access, user])
}

