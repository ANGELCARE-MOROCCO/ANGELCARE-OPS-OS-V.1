import type { ReactNode } from 'react'
import type { MarketplaceRequestContext } from '../domain/types'
import { AdminShellChrome } from './AdminShellChrome'

export function AdminShell({ context, children }: { context: MarketplaceRequestContext; children: ReactNode }) {
  return (
    <AdminShellChrome
      actorDisplayName={context.actor.displayName}
      actorEmail={context.actor.email}
      roleKeys={context.roleKeys}
      territoryId={context.territoryId}
      permissionCount={context.permissions.length}
    >
      {children}
    </AdminShellChrome>
  )
}
