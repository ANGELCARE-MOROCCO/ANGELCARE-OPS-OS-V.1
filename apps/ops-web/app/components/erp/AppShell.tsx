'use client'
import OperationCompletionEngine from '@/components/operation-completion/OperationCompletionEngine'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { usePermissionNavigation } from '@/components/navigation/PermissionNavigationProvider'
import CommercialExperienceControls from '@/components/commercial-core/CommercialExperienceControls'

type PermissionLink = {
  label?: string
  name?: string
  title?: string
  href?: string
  path?: string
  url?: string
  permission?: string
  icon?: string
  badge?: string
  group?: string
  module?: string
}

type NavItem = {
  label: string
  href: string
  icon: string
  badge?: string
  keywords?: string[]
  permission?: string
}

type NavGroup = {
  group: string
  accent: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Control Center',
    accent: '#38bdf8',
    items: [
      { label: 'Dashboard', href: '/', icon: '📡', badge: 'Live', keywords: ['home', 'command', 'overview'] },
    ],
  },
  {
    group: 'Sales CRM',
    accent: '#f97316',
    items: [
      { label: 'Sales Cockpit', href: '/sales', icon: '🚀', badge: 'New', keywords: ['sales', 'crm', 'pipeline'] },
      { label: 'Families CRM', href: '/families', icon: '🏡', keywords: ['parents', 'customers', 'clients'] },
      { label: 'Institutions', href: '/sales#institutions', icon: '🏫', keywords: ['schools', 'partners', 'b2b'] },
      { label: 'Orders', href: '/sales/orders', icon: '🧾', keywords: ['orders', 'sales orders'] },
      { label: 'New Order', href: '/sales/orders/new', icon: '➕', keywords: ['create order'] },
    ],
  },
  {
    group: 'Revenue Command',
    accent: '#a855f7',
    items: [
      { label: 'Revenue Command OS', href: '/revenue-command-os', icon: '🧠', badge: 'P1', keywords: ['revenue', 'strategy', 'orchestration', 'intelligence'] },
      { label: 'Revenue Center', href: '/revenue-command-center', icon: '💎', badge: 'OS', keywords: ['revenue', 'command'] },
      { label: 'Tasks', href: '/revenue-command-center/tasks', icon: '✅', keywords: ['tasks', 'execution'] },
      { label: 'Pipeline', href: '/revenue-command-center/pipeline', icon: '🧬', keywords: ['pipeline'] },
      { label: 'Forecast', href: '/revenue-command-center/forecast', icon: '📉', keywords: ['forecast'] },
    ],
  },
  {
    group: 'Market OS',
    accent: '#22c55e',
    items: [
      { label: 'Market OS Home', href: '/market-os', icon: '🌐', badge: 'MKT', keywords: ['marketing', 'market'] },
      { label: 'Campaign Lifecycle', href: '/market-os/campaign-lifecycle', icon: '🎯', keywords: ['campaigns', 'lifecycle'] },
      { label: 'SEO Blog Workspace', href: '/market-os/seo-blog-workspace', icon: '✍️', keywords: ['seo', 'blog', 'content'] },
      { label: 'Content Command', href: '/market-os/content-command-center', icon: '🧠', keywords: ['content', 'copy'] },
      { label: 'Automation Control', href: '/market-os/automation-control', icon: '⚙️', keywords: ['automation', 'rules'] },
      { label: 'Ambassadors', href: '/market-os/ambassador-program', icon: '🤝', keywords: ['ambassador', 'program'] },
      { label: 'Partners Network', href: '/market-os/partners-network', icon: '🏢', keywords: ['partners', 'network'] },
      { label: 'Marketing Calendar', href: '/market-os/calendar', icon: '🗓️', keywords: ['calendar', 'planning'] },
    ],
  },
  {
    group: 'Operations',
    accent: '#06b6d4',
    items: [
    ],
  },
  {
    group: 'Contracts & Billing',
    accent: '#eab308',
    items: [
      { label: 'Contracts', href: '/contracts', icon: '📦', keywords: ['contracts'] },
      { label: 'Billing Center', href: '/billing', icon: '🧾', badge: 'Ready', keywords: ['billing', 'invoice'] },
      { label: 'Print Center', href: '/print', icon: '🖨️', keywords: ['print', 'documents'] },
    ],
  },
  {
    group: 'Workforce',
    accent: '#ec4899',
    items: [
      { label: 'Field Portal', href: '/my-space', icon: '📱', keywords: ['field', 'portal'] },
      { label: 'Academy Hub', href: '/academy', icon: '🎓', keywords: ['training', 'academy'] },
    ],
  },
  {
    group: 'Quality & Incidents',
    accent: '#ef4444',
    items: [
      { label: 'Risk Signals', href: '/market-os/risk-signals', icon: '🛡️', keywords: ['risk', 'signals'] },
      { label: 'Archive Center', href: '/admin/archive-center', icon: '🗄️', keywords: ['archive'] },
    ],
  },
  {
    group: 'Products & Services',
    accent: '#14b8a6',
    items: [
      { label: 'Service Catalog', href: '/services', icon: '🧩', badge: 'ERP', keywords: ['catalog', 'services'] },
      { label: 'New Service', href: '/services/new', icon: '➕', keywords: ['create service'] },
    ],
  },
  {
    group: 'Administration',
    accent: '#64748b',
    items: [
      { label: 'Users', href: '/users', icon: '🔐', keywords: ['users', 'permissions'] },
      { label: 'B2B Partnerships', href: '/b2b-partnerships', icon: '🤝', keywords: ['b2b', 'partnerships', 'hotels', 'clinics', 'prospects', 'campaigns'] },
      { label: 'Config Admin', href: '/market-os/config-admin-control', icon: '🧰', keywords: ['settings', 'admin', 'config'] },
    ],
  },
]

const QUICK_CREATE = [
  { label: 'Contract', href: '/contracts/new', icon: '📦' },
  { label: 'Family', href: '/families/new', icon: '🏡' },
  { label: 'Campaign', href: '/market-os/campaign-lifecycle/new', icon: '🎯' },
  { label: 'Service', href: '/services/new', icon: '🧩' },
]

function normalizePermissionLinks(links?: PermissionLink[]): NavGroup[] | null {
  if (!links?.length) return null

  const grouped = new Map<string, NavItem[]>()

  for (const link of links) {
    const href = link.href || link.path || link.url
    const label = link.label || link.name || link.title
    if (!href || !label) continue

    const group = link.group || link.module || guessGroup(href)
    const item: NavItem = {
      label,
      href,
      icon: link.icon || guessIcon(href, label),
      badge: link.badge,
      permission: link.permission,
      keywords: [label, href, group],
    }

    grouped.set(group, [...(grouped.get(group) || []), item])
  }

  const groups = Array.from(grouped.entries()).map(([group, items], index) => ({
    group,
    accent: ['#38bdf8', '#f97316', '#22c55e', '#a855f7', '#ec4899', '#eab308'][index % 6],
    items,
  }))

  return groups.length ? groups : null
}

function guessGroup(href: string) {
  if (href.includes('market-os')) return 'Market OS'
  if (href.includes('sales') || href.includes('lead') || href.includes('famil')) return 'Sales CRM'
  if (href.includes('revenue')) return 'Revenue Command'
  if (href.includes('mission') || href.includes('operation') || href.includes('pointage')) return 'Operations'
  if (href.includes('contract') || href.includes('billing')) return 'Contracts & Billing'
  if (href.includes('caregiver') || href.includes('hr') || href.includes('academy')) return 'Workforce'
  if (href.includes('incident') || href.includes('archive')) return 'Quality & Incidents'
  if (href.includes('service')) return 'Products & Services'
  if (href.includes('user') || href.includes('profile') || href.includes('admin')) return 'Administration'
  return 'Workspace'
}

function guessIcon(href: string, label: string) {
  const text = `${href} ${label}`.toLowerCase()
  if (text.includes('market')) return '🌐'
  if (text.includes('campaign')) return '🎯'
  if (text.includes('sales')) return '🚀'
  if (text.includes('lead')) return '📈'
  if (text.includes('revenue')) return '💎'
  if (text.includes('mission')) return '🛫'
  if (text.includes('contract')) return '📦'
  if (text.includes('billing')) return '🧾'
  if (text.includes('caregiver')) return '👩‍👧'
  if (text.includes('incident')) return '🚨'
  if (text.includes('service')) return '🧩'
  if (text.includes('user')) return '🔐'
  if (text.includes('profile')) return '👤'
  return '✨'
}

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  const cleanHref = href.split('#')[0]
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`)
}

type CommercialModuleKey = 'services' | 'sales' | 'billing'

type CommercialContext = {
  module: CommercialModuleKey
  label: string
  ownership: string
  links: Array<{ label: string; href: string }>
}

const COMMERCIAL_CONTEXTS: Record<CommercialModuleKey, CommercialContext> = {
  services: {
    module: 'services',
    label: 'Services',
    ownership: 'Offre, tarification et capacité de livraison',
    links: [
      { label: 'Portfolio', href: '/services' },
      { label: 'Blueprints', href: '/services/blueprints' },
      { label: 'Tarification', href: '/services/pricing-engine' },
      { label: 'Delivery readiness', href: '/services/operations' },
      { label: 'Gouvernance', href: '/services/configuration' },
      { label: 'Executive', href: '/services/enterprise' },
    ],
  },
  sales: {
    module: 'sales',
    label: 'Sales',
    ownership: 'Clients, commandes et exécution commerciale',
    links: [
      { label: 'Revenue Command', href: '/sales' },
      { label: 'Clients', href: '/sales/clients' },
      { label: 'Commandes', href: '/sales/orders' },
      { label: 'Nouvelle commande', href: '/sales/orders/new' },
      { label: 'Management', href: '/sales/management' },
      { label: 'Configuration', href: '/sales/configuration' },
    ],
  },
  billing: {
    module: 'billing',
    label: 'Billing',
    ownership: 'Facturation, échéances et recouvrement',
    links: [
      { label: 'Accounts receivable', href: '/billing' },
      { label: 'Vue exécutive', href: '/billing/overview' },
      { label: 'Collections', href: '/billing/activation' },
      { label: 'Contrats', href: '/contracts' },
    ],
  },
}

const SERVICE_OS_EMBEDDED_HEADER_ROUTES = new Set([
  '/services',
  '/services/blueprints',
  '/services/enterprise',
  '/services/configuration',
  '/services/rules',
  '/services/operations',
  '/services/workflows',
  '/services/incidents',
  '/services/commercial',
  '/services/pricing-engine',
  '/services/subscriptions',
  '/services/live-ops',
  '/services/capacity',
  '/services/expansion',
  '/services/client-journey',
  '/services/contracts',
  '/services/compliance',
  '/services/ai-matching',
  '/services/ai-strategy',
  '/services/market-intelligence',
])

function getCommercialContext(pathname: string): CommercialContext | null {
  if (pathname === '/services' || pathname.startsWith('/services/')) return COMMERCIAL_CONTEXTS.services
  if (pathname === '/sales' || pathname.startsWith('/sales/')) return COMMERCIAL_CONTEXTS.sales
  if (pathname === '/billing' || pathname.startsWith('/billing/')) return COMMERCIAL_CONTEXTS.billing
  if (/^\/contracts\/[^/]+\/activation(?:\/|$)/.test(pathname)) return COMMERCIAL_CONTEXTS.billing
  return null
}

function hasEmbeddedCommercialHeader(pathname: string) {
  if (SERVICE_OS_EMBEDDED_HEADER_ROUTES.has(pathname)) return true
  if (pathname === '/sales' || pathname === '/billing' || pathname === '/billing/overview' || pathname === '/billing/activation') return true
  return /^\/contracts\/[^/]+\/activation(?:\/|$)/.test(pathname)
}

export default function AppShell({
  hideSidebar = false,
  children,
  title = 'AngelCare OpsOS',
  subtitle = 'Premium ERP command system',
  breadcrumbs = [],
  actions,
  links,
}: {
  children: React.ReactNode
  hideSidebar?: boolean
  title?: string
  subtitle?: string
  breadcrumbs?: { label: string; href?: string }[]
  actions?: React.ReactNode
  links?: PermissionLink[]
}) {
  const pathname = usePathname()
  const commercialContext = getCommercialContext(pathname)
  const commercialMode = commercialContext !== null
  const contentCommandMode = pathname === '/market-os/content-command-center' || pathname.startsWith('/market-os/content-command-center/')
  const liberatedShellMode = commercialMode || contentCommandMode
  const sidebarSuppressed = hideSidebar || liberatedShellMode
  const embeddedCommercialHeader = commercialMode && hasEmbeddedCommercialHeader(pathname)
  const embeddedExperienceHeader = embeddedCommercialHeader || contentCommandMode
  const contextLinks = usePermissionNavigation()
  const [search, setSearch] = useState('')
  const [quickOpen, setQuickOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const navGroups = useMemo(() => normalizePermissionLinks(contextLinks.length ? contextLinks : links) || NAV_GROUPS, [contextLinks, links])

  const smartStats = useMemo(() => {
    const totalItems = navGroups.reduce((sum, group) => sum + group.items.length, 0)
    return {
      groups: navGroups.length,
      items: totalItems,
      activeGroup: navGroups.find((group) => group.items.some((item) => isActive(pathname, item.href)))?.group || 'Command',
    }
  }, [navGroups, pathname])

  const flatNav = useMemo(
    () => navGroups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.group }))),
    [navGroups]
  )

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return flatNav.slice(0, 10)
    return flatNav
      .filter((item) => `${item.label} ${item.group} ${item.href} ${(item.keywords || []).join(' ')}`.toLowerCase().includes(q))
      .slice(0, 12)
  }, [search, flatNav])

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({ ...prev, [group]: !(prev[group] ?? true) }))
  }

  return (
    <div
      data-hide-sidebar={sidebarSuppressed ? 'true' : 'false'}
      data-commercial-shell={commercialMode ? 'true' : undefined}
      data-content-command-shell={contentCommandMode ? 'true' : undefined}
      style={liberatedShellMode ? commercialShellStyle : shellStyle}
    >
      {!sidebarSuppressed && (
<aside style={{ ...sidebarStyle, width: collapsed ? 92 : 330, minWidth: collapsed ? 92 : 330 }}>
        <div style={brandBlockStyle}>
          <Link href="/" style={brandStyle} aria-label="Go to AngelCare dashboard">
            <div style={logoWrapperStyle}>
              <Image
                src="/brand/angelcare-official.webp"
                alt="AngelCare"
                width={250}
                height={96}
                priority
                style={logoImageStyle}
              />
            </div>
          </Link>

          <button type="button" onClick={() => setCollapsed(!collapsed)} style={collapseButtonStyle}>
            {collapsed ? '»' : '«'}
          </button>

          {!collapsed ? (
            <div style={sideIntelligenceStyle}>
              <div>
                <span style={sideTinyLabelStyle}>ACTIVE WORKSPACE</span>
                <strong>{smartStats.activeGroup}</strong>
              </div>
              <div style={sideMiniGridStyle}>
                <span>{smartStats.groups} groups</span>
                <span>{smartStats.items} links</span>
              </div>
            </div>
          ) : null}
        </div>

        {!collapsed ? (
          <div style={sideSearchStyle}>
            <span>⌘</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workspace..."
              style={sideSearchInputStyle}
            />
          </div>
        ) : null}

        <div style={sideScrollStyle}>
          {navGroups.map((group) => {
            const visible = openGroups[group.group] ?? true
            const groupActive = group.items.some((item) => isActive(pathname, item.href))

            return (
              <section key={group.group} style={navGroupStyle}>
                {!collapsed ? (
                  <button type="button" onClick={() => toggleGroup(group.group)} style={navGroupTitleButtonStyle}>
                    <span style={{ ...groupAccentStyle, background: group.accent }} />
                    <span style={navGroupTitleStyle}>{group.group}</span>
                    <span style={groupCountStyle}>{group.items.length}</span>
                    <span style={chevronStyle}>{visible ? '⌄' : '›'}</span>
                  </button>
                ) : groupActive ? (
                  <div style={{ ...collapsedActiveRailStyle, background: group.accent }} />
                ) : null}

                {(visible || collapsed) ? (
                  <div style={{ display: 'grid', gap: 7 }}>
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href)

                      return (
                        <Link
                          key={`${group.group}-${item.href}-${item.label}`}
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          style={{
                            ...navItemStyle,
                            ...(active ? activeNavItemStyle : null),
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            padding: collapsed ? '12px 10px' : '11px 12px',
                          }}
                        >
                          <span style={{ ...navIconStyle, ...(active ? activeNavIconStyle : null) }}>{item.icon}</span>
                          {!collapsed ? (
                            <>
                              <span style={{ flex: 1, minWidth: 0 }}>{item.label}</span>
                              {item.badge ? <span style={navBadgeStyle}>{item.badge}</span> : null}
                              {active ? <span style={{ ...activeDotStyle, background: group.accent }} /> : null}
                            </>
                          ) : null}
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      </aside>
)}

      <div style={mainShellStyle}>
        <header style={liberatedShellMode ? commercialTopbarStyle : topbarStyle}>
          <div style={searchWrapStyle}>
            <span style={{ fontSize: 18 }}>⌘</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules, clients, missions, contracts..."
              style={searchInputStyle}
            />
            {search ? (
              <div style={searchResultsStyle}>
                {searchResults.length ? (
                  searchResults.map((item) => (
                    <Link key={`${item.group}-${item.href}-${item.label}`} href={item.href} style={searchItemStyle}>
                      <span style={searchResultIconStyle}>{item.icon}</span>
                      <div>
                        <div style={{ fontWeight: 950, color: '#0f172a' }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>{item.group}</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div style={emptySearchStyle}>No workspace found</div>
                )}
              </div>
            ) : null}
          </div>

          <div style={topbarActionsStyle}>
            {commercialMode ? <CommercialExperienceControls /> : null}
            <button type="button" onClick={() => setQuickOpen(!quickOpen)} style={quickButtonStyle}>
              {commercialMode ? 'Créer' : contentCommandMode ? 'Créer dans Market OS' : '＋ Quick Create'}
            </button>
          </div>

          {quickOpen ? (
            <div style={quickPanelStyle}>
              <div style={quickPanelHeaderStyle}>
                <strong>Quick execution</strong>
                <span>Create operational records fast</span>
              </div>
              {QUICK_CREATE.map((item) => (
                <Link key={item.href} href={item.href} style={quickItemStyle}>
                  <span style={quickIconStyle}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </header>

        {commercialContext && !embeddedCommercialHeader ? (
          <section style={commercialRouteBarStyle} aria-label={`Navigation ${commercialContext.label}`}>
            <div style={commercialRouteIdentityStyle}>
              <span style={commercialRouteEyebrowStyle}>SANILA Commercial Core</span>
              <strong style={commercialRouteTitleStyle}>{commercialContext.label}</strong>
              <small style={commercialRouteOwnershipStyle}>{commercialContext.ownership}</small>
            </div>
            <nav style={commercialRouteNavStyle} aria-label={`Workspaces ${commercialContext.label}`}>
              {commercialContext.links.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    style={{ ...commercialRouteLinkStyle, ...(active ? commercialRouteActiveStyle : null) }}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </section>
        ) : null}

        {!embeddedExperienceHeader ? <section data-commercial-page-header={commercialMode ? 'true' : undefined} data-commercial-focus-hide={commercialMode ? 'true' : undefined} style={commercialMode ? commercialPageHeaderStyle : pageHeaderStyle}>
          <div>
            <div style={breadcrumbStyle}>
              <Link href="/" style={{ textDecoration: 'none', color: '#64748b' }}>Home</Link>
              {breadcrumbs.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span>/</span>
                  {crumb.href ? (
                    <Link href={crumb.href} style={{ textDecoration: 'none', color: '#64748b' }}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>
            <h1 style={pageTitleStyle}>{title}</h1>
            <p style={pageSubtitleStyle}>{subtitle}</p>
          </div>
          <div style={pageActionsStyle}>{actions}</div>
        </section> : null}

        <main data-commercial-canvas={commercialMode ? 'true' : undefined} data-content-command-canvas={contentCommandMode ? 'true' : undefined} style={contentCommandMode ? contentCommandContentStyle : commercialMode ? commercialContentStyle : contentStyle}>{children}
      <OperationCompletionEngine /></main>
      </div>
    </div>
  )
}

export function PageAction({
  href,
  children,
  variant = 'dark',
}: {
  href: string
  children: React.ReactNode
  variant?: 'dark' | 'light' | 'danger'
}) {
  const style = variant === 'dark' ? actionDarkStyle : variant === 'danger' ? actionDangerStyle : actionLightStyle
  return <Link href={href} style={style}>{children}</Link>
}

const OVERHEAD_HEIGHT = 86
const shellStyle: React.CSSProperties = { minHeight: '100vh', display: 'flex', paddingTop: OVERHEAD_HEIGHT, background: '#eef2f7', color: '#0f172a', fontFamily: 'Inter, Arial, sans-serif' }
const commercialShellStyle: React.CSSProperties = { minHeight: `calc(100dvh - ${OVERHEAD_HEIGHT}px)`, display: 'flex', paddingTop: 0, width: '100%', background: 'linear-gradient(180deg, #f3f7fb 0%, #eef4f9 100%)', color: '#0f172a', fontFamily: 'Inter, Arial, sans-serif' }
const sidebarStyle: React.CSSProperties = { height: `calc(100vh - ${OVERHEAD_HEIGHT}px)`, position: 'sticky', top: OVERHEAD_HEIGHT, background: 'linear-gradient(180deg, #050b14 0%, #07111f 44%, #0f172a 100%)', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.10)', transition: 'width .22s ease, min-width .22s ease', boxShadow: '22px 0 55px rgba(2,6,23,.18)', zIndex: 8 }
const brandBlockStyle: React.CSSProperties = { padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative' }
const brandStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', textDecoration: 'none' }
const logoWrapperStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: 6, overflow: 'visible', background: 'transparent' }
const logoImageStyle: React.CSSProperties = { width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: 78, objectFit: 'contain', display: 'block' }
const collapseButtonStyle: React.CSSProperties = { position: 'absolute', right: -13, top: 22, width: 28, height: 28, borderRadius: 999, border: '1px solid rgba(255,255,255,.16)', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer', boxShadow: '0 10px 28px rgba(0,0,0,.22)' }
const sideIntelligenceStyle: React.CSSProperties = { marginTop: 12, padding: 12, borderRadius: 18, background: 'linear-gradient(135deg, rgba(34,197,94,.12), rgba(56,189,248,.10))', border: '1px solid rgba(148,163,184,.18)', display: 'grid', gap: 8 }
const sideTinyLabelStyle: React.CSSProperties = { display: 'block', color: '#93c5fd', fontSize: 10, fontWeight: 950, letterSpacing: 1, marginBottom: 4 }
const sideMiniGridStyle: React.CSSProperties = { display: 'flex', gap: 8, color: '#cbd5e1', fontSize: 11, fontWeight: 850 }
const sideSearchStyle: React.CSSProperties = { margin: '12px 14px 8px', height: 42, borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 9, padding: '0 11px', color: '#cbd5e1' }
const sideSearchInputStyle: React.CSSProperties = { flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: '#fff', fontWeight: 800 }
const sideScrollStyle: React.CSSProperties = { overflowY: 'auto', padding: '10px 14px 24px' }
const navGroupStyle: React.CSSProperties = { marginBottom: 12, position: 'relative' }
const navGroupTitleButtonStyle: React.CSSProperties = { width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 8px 8px 10px', border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }
const groupAccentStyle: React.CSSProperties = { width: 8, height: 8, borderRadius: 999, boxShadow: '0 0 18px currentColor' }
const navGroupTitleStyle: React.CSSProperties = { flex: 1, textAlign: 'left', color: '#94a3b8', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 1 }
const groupCountStyle: React.CSSProperties = { fontSize: 10, padding: '3px 7px', borderRadius: 999, color: '#cbd5e1', background: 'rgba(255,255,255,.06)', fontWeight: 900 }
const chevronStyle: React.CSSProperties = { color: '#64748b', fontWeight: 950 }
const collapsedActiveRailStyle: React.CSSProperties = { position: 'absolute', left: -14, top: 8, bottom: 8, width: 4, borderRadius: 999 }
const navItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, borderRadius: 16, color: '#e2e8f0', textDecoration: 'none', fontSize: 13, fontWeight: 850, background: 'transparent', border: '1px solid transparent', position: 'relative', transition: 'background .16s ease, border .16s ease, transform .16s ease' }
const activeNavItemStyle: React.CSSProperties = { background: 'linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.07))', border: '1px solid rgba(255,255,255,.16)', color: '#fff', boxShadow: '0 14px 28px rgba(2,6,23,.20)' }
const navIconStyle: React.CSSProperties = { width: 29, minWidth: 29, height: 29, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.07)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.04)' }
const activeNavIconStyle: React.CSSProperties = { background: '#fff', color: '#0f172a' }
const navBadgeStyle: React.CSSProperties = { fontSize: 10, padding: '4px 7px', borderRadius: 999, background: '#dbeafe', color: '#1e3a8a', fontWeight: 950 }
const activeDotStyle: React.CSSProperties = { width: 8, height: 8, borderRadius: 999, boxShadow: '0 0 18px rgba(255,255,255,.45)' }
const mainShellStyle: React.CSSProperties = { flex: 1, minWidth: 0 }
const topbarStyle: React.CSSProperties = { height: 74, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 24px', background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #dbe3ee', position: 'sticky', top: OVERHEAD_HEIGHT, zIndex: 10 }
const commercialTopbarStyle: React.CSSProperties = { ...topbarStyle, width: '100%', padding: '12px clamp(16px, 2vw, 34px)', background: 'rgba(255,255,255,.94)', borderBottom: '1px solid #d6e2ed', boxShadow: '0 10px 30px rgba(15,40,78,.055)', zIndex: 40 }
const searchWrapStyle: React.CSSProperties = { position: 'relative', flex: 1, maxWidth: 740, display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #dbe3ee', borderRadius: 18, padding: '0 14px', height: 48 }
const searchInputStyle: React.CSSProperties = { flex: 1, border: 'none', outline: 'none', background: 'transparent', color: '#0f172a', fontWeight: 750, fontSize: 14 }
const searchResultsStyle: React.CSSProperties = { position: 'absolute', top: 56, left: 0, right: 0, background: '#fff', border: '1px solid #dbe3ee', borderRadius: 18, padding: 10, boxShadow: '0 22px 50px rgba(15,23,42,.14)', zIndex: 20, display: 'grid', gap: 8 }
const searchItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, textDecoration: 'none', background: '#f8fafc' }
const searchResultIconStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#fff', border: '1px solid #e2e8f0' }
const emptySearchStyle: React.CSSProperties = { padding: 14, color: '#64748b', fontWeight: 850 }
const topbarActionsStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }
const quickButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '12px 14px', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }
const iconButtonStyle: React.CSSProperties = { width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#f8fafc', border: '1px solid #dbe3ee', textDecoration: 'none' }
const notificationButtonStyle: React.CSSProperties = { ...iconButtonStyle, position: 'relative' }
const notificationDotStyle: React.CSSProperties = { position: 'absolute', top: 9, right: 9, width: 9, height: 9, borderRadius: 999, background: '#ef4444', border: '2px solid #fff' }
const profileButtonStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 14, border: '1px solid #dbe3ee', background: '#fff', textDecoration: 'none', color: '#0f172a', fontWeight: 900 }
const avatarStyle: React.CSSProperties = { width: 30, height: 30, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#e0f2fe', color: '#075985', fontWeight: 950 }
const quickPanelStyle: React.CSSProperties = { position: 'absolute', top: 62, right: 24, width: 300, background: '#fff', border: '1px solid #dbe3ee', borderRadius: 20, padding: 10, boxShadow: '0 22px 50px rgba(15,23,42,.14)', zIndex: 30, display: 'grid', gap: 8 }
const quickPanelHeaderStyle: React.CSSProperties = { display: 'grid', gap: 3, padding: '9px 10px 6px', color: '#0f172a' }
const quickItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: 11, borderRadius: 14, textDecoration: 'none', color: '#0f172a', fontWeight: 900, background: '#f8fafc' }
const quickIconStyle: React.CSSProperties = { width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0' }
const pageHeaderStyle: React.CSSProperties = { padding: '28px 28px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }
const breadcrumbStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, fontWeight: 800, marginBottom: 10 }
const pageTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 42, lineHeight: 1.02, fontWeight: 950, letterSpacing: -1.3 }
const pageSubtitleStyle: React.CSSProperties = { margin: '10px 0 0', color: '#475569', fontWeight: 700, lineHeight: 1.6, maxWidth: 760 }
const pageActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const contentStyle: React.CSSProperties = { padding: '0 28px 34px' }
const commercialPageHeaderStyle: React.CSSProperties = { padding: '22px clamp(16px, 2vw, 34px) 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap', borderBottom: '1px solid rgba(203,213,225,.72)', background: 'rgba(248,251,254,.9)' }
const commercialContentStyle: React.CSSProperties = { width: '100%', minWidth: 0, padding: '16px clamp(14px, 1.8vw, 32px) 40px', overflow: 'clip' }
const contentCommandContentStyle: React.CSSProperties = { width: '100%', minWidth: 0, padding: 0, overflow: 'clip' }
const commercialRouteBarStyle: React.CSSProperties = { position: 'sticky', top: OVERHEAD_HEIGHT + 74, zIndex: 32, display: 'flex', alignItems: 'center', gap: 18, width: '100%', minWidth: 0, padding: '10px clamp(16px, 2vw, 34px)', borderBottom: '1px solid #d7e3ee', background: 'rgba(247,250,253,.96)', backdropFilter: 'blur(16px)', boxShadow: '0 12px 28px rgba(15,40,78,.05)' }
const commercialRouteIdentityStyle: React.CSSProperties = { display: 'grid', minWidth: 210, gap: 1 }
const commercialRouteEyebrowStyle: React.CSSProperties = { color: '#2f6da8', fontSize: 9, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase' }
const commercialRouteTitleStyle: React.CSSProperties = { color: '#0b2748', fontSize: 16, fontWeight: 950, letterSpacing: '-.02em' }
const commercialRouteOwnershipStyle: React.CSSProperties = { color: '#64748b', fontSize: 10, fontWeight: 750 }
const commercialRouteNavStyle: React.CSSProperties = { display: 'flex', flex: 1, minWidth: 0, gap: 6, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'thin' }
const commercialRouteLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', minWidth: 'max-content', minHeight: 34, padding: '8px 11px', border: '1px solid transparent', borderRadius: 11, color: '#52657d', background: 'transparent', textDecoration: 'none', fontSize: 11, fontWeight: 850 }
const commercialRouteActiveStyle: React.CSSProperties = { borderColor: '#b9cee1', color: '#fff', background: '#0d315c', boxShadow: '0 8px 20px rgba(13,49,92,.16)' }
const actionDarkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 950 }
const actionLightStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee', textDecoration: 'none', fontWeight: 950 }
const actionDangerStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', textDecoration: 'none', fontWeight: 950 }
