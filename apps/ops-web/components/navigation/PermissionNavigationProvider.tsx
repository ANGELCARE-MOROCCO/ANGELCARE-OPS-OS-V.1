'use client'

import { createContext, useContext } from 'react'

export type PermissionNavLink = {
  label: string
  href: string
  permission: string
  group?: string
  module?: string
  icon?: string
  badge?: string
  order?: number
}

const PermissionNavigationContext = createContext<PermissionNavLink[]>([])

export function PermissionNavigationProvider({
  links,
  children,
}: {
  links: PermissionNavLink[]
  children: React.ReactNode
}) {
  return (
    <PermissionNavigationContext.Provider value={links}>
      {children}
    </PermissionNavigationContext.Provider>
  )
}

export function usePermissionNavigation() {
  return useContext(PermissionNavigationContext)
}
