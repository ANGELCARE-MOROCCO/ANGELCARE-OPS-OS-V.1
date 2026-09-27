import type { ReactNode } from 'react'
import type { MarketplaceRequestContext } from '../domain/types'
import { ADMIN_WORKSPACE_REGISTRY } from '../admin-excellence/workspace-registry'
import { getAdminShellSnapshot } from '../admin-shell/repository'
import type { AdminShellWorkspace } from '../admin-shell/types'
import { AdminShellChrome } from './AdminShellChrome'

const SANILA_WORKSPACES: AdminShellWorkspace[] = [
  { href: '/angelcare-marketplace/admin/sanila', domain: 'sanila', label: 'SANILA · Commandement', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/demo', domain: 'sanila', label: 'SANILA · Demo Control', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/requests', domain: 'sanila', label: 'SANILA · Demandes live', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/access', domain: 'sanila', label: 'SANILA · Accès & PIN', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/sessions', domain: 'sanila', label: 'SANILA · Sessions', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/prospects', domain: 'sanila', label: 'SANILA · Prospects', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/public-world', domain: 'sanila', label: 'SANILA · Public World', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/studio', domain: 'sanila', label: 'SANILA · World Studio', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/pages', domain: 'sanila', label: 'SANILA · Pages', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/shell', domain: 'sanila', label: 'SANILA · Shell', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/navigation', domain: 'sanila', label: 'SANILA · Navigation', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/forms', domain: 'sanila', label: 'SANILA · Forms', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/media', domain: 'sanila', label: 'SANILA · Media', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/seo', domain: 'sanila', label: 'SANILA · SEO', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/publication', domain: 'sanila', label: 'SANILA · Publication', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/audit', domain: 'sanila', label: 'SANILA · Audit', dynamic: false },
  { href: '/angelcare-marketplace/admin/sanila/health', domain: 'sanila', label: 'SANILA · Health', dynamic: false },
]


const IMPORT_WORKSPACES: AdminShellWorkspace[] = [
  { href: '/angelcare-marketplace/admin/imports', domain: 'imports', label: 'Imports · Commandement', dynamic: false },
  { href: '/angelcare-marketplace/admin/imports/product', domain: 'imports', label: 'Imports · Product 360', dynamic: false },
  { href: '/angelcare-marketplace/admin/imports/category-native', domain: 'imports', label: 'Imports · Category-Native', dynamic: false },
  { href: '/angelcare-marketplace/admin/imports/media', domain: 'imports', label: 'Imports · Media Vault', dynamic: false },
  { href: '/angelcare-marketplace/admin/imports/localization', domain: 'imports', label: 'Imports · Localisation', dynamic: false },
  { href: '/angelcare-marketplace/admin/imports/wallet', domain: 'imports', label: 'Imports · Wallet', dynamic: false },
  { href: '/angelcare-marketplace/admin/imports/expert-commerce', domain: 'imports', label: 'Imports · Commerce expert', dynamic: false },
]

function workspaces(): AdminShellWorkspace[] {
  const existing = ADMIN_WORKSPACE_REGISTRY.map(({ href, domain, label, dynamic }) => ({ href, domain, label, dynamic }))
  const seen = new Set(existing.map((item) => item.href))
  const withSanila = [...existing, ...SANILA_WORKSPACES.filter((item) => !seen.has(item.href))]
  const seenAll = new Set(withSanila.map((item) => item.href))
  return [...withSanila, ...IMPORT_WORKSPACES.filter((item) => !seenAll.has(item.href))]
}

export async function AdminShell({ context, children }: { context: MarketplaceRequestContext; children: ReactNode }) {
  const snapshot = await getAdminShellSnapshot()
  return (
    <AdminShellChrome
      actorDisplayName={context.actor.displayName}
      actorEmail={context.actor.email}
      roleKeys={context.roleKeys}
      territoryId={context.territoryId}
      permissionCount={context.permissions.length}
      snapshot={snapshot}
      workspaces={workspaces()}
    >
      {children}
    </AdminShellChrome>
  )
}
