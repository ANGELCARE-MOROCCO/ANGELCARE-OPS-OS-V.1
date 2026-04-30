'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import OverheadPanel from '@/app/components/erp/OverheadPanel'

type NavItem = {
  label: string
  href: string
  icon: string
  badge?: string
}

type NavGroup = {
  group: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'Control Center',
    items: [
      { label: 'Dashboard', href: '/', icon: '📡', badge: 'Live' },
      { label: 'Operations Hub', href: '/operations', icon: '🧭' },
      { label: 'Reports', href: '/reports', icon: '📊' },
    ],
  },
  {
    group: 'Sales CRM',
    items: [
      { label: 'Sales Cockpit', href: '/sales', icon: '🚀', badge: 'New' },
      { label: 'Leads', href: '/leads', icon: '📈' },
      { label: 'Families CRM', href: '/families', icon: '🏡' },
      { label: 'Institutions', href: '/sales#institutions', icon: '🏫' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Missions', href: '/missions', icon: '🛫' },
      { label: 'Pointage', href: '/pointage', icon: '🕒' },
      { label: 'Availability', href: '/operations/availability', icon: '🟢' },
      { label: 'Replacements', href: '/operations/replacements', icon: '🔄' },
    ],
  },
  {
    group: 'Contracts & Billing',
    items: [
      { label: 'Contracts', href: '/contracts', icon: '📦' },
      { label: 'Billing Center', href: '/billing', icon: '🧾', badge: 'Ready' },
      { label: 'Print Center', href: '/print', icon: '🖨️' },
    ],
  },
  {
    group: 'Workforce',
    items: [
      { label: 'Caregivers', href: '/caregivers', icon: '👩‍👧' },
      { label: 'Field Portal', href: '/my-space', icon: '📱' },
    ],
  },
  {
    group: 'Quality & Incidents',
    items: [
      { label: 'Incidents', href: '/incidents', icon: '🚨' },
      { label: 'Archive Center', href: '/admin/archive-center', icon: '🗄️' },
    ],
  },
  {
    group: 'Products & Services',
    items: [
      { label: 'Service Catalog', href: '/services', icon: '🧩', badge: 'ERP' },
      { label: 'New Service', href: '/services/new', icon: '➕' },
    ],
  },
  {
    group: 'Academy',
    items: [{ label: 'Academy Hub', href: '/academy', icon: '🎓' }],
  },
  {
    group: 'Administration',
    items: [
      { label: 'Users', href: '/users', icon: '🔐' },
      { label: 'Profile', href: '/profile', icon: '👤' },
      { label: 'Locations', href: '/locations', icon: '📍' },
    ],
  },
]

const QUICK_CREATE = [
  { label: 'Mission', href: '/missions/new', icon: '🛫' },
  { label: 'Contract', href: '/contracts/new', icon: '📦' },
  { label: 'Lead', href: '/leads/new', icon: '📈' },
  { label: 'Family', href: '/families/new', icon: '🏡' },
  { label: 'Incident', href: '/incidents/new', icon: '🚨' },
  { label: 'Service', href: '/services/new', icon: '🧩' },
]

export default function AppShell({
  children,
  title = 'AngelCare OpsOS',
  subtitle = 'Premium ERP command system',
  breadcrumbs = [],
  actions,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
  breadcrumbs?: { label: string; href?: string }[]
  actions?: React.ReactNode
}) {
  const [search, setSearch] = useState('')
  const [quickOpen, setQuickOpen] = useState(false)

  const flatNav = useMemo(
    () => NAV_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, group: group.group }))),
    []
  )

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return flatNav.slice(0, 8)
    return flatNav
      .filter((item) => `${item.label} ${item.group}`.toLowerCase().includes(q))
      .slice(0, 10)
  }, [search, flatNav])

  return (
    <div style={shellStyle}>
      <OverheadPanel />

      <aside style={sidebarStyle}>
        <Link href="/" style={brandStyle} aria-label="Go to AngelCare dashboard">
          <div style={logoImageBoxStyle}>
            <Image
              src="/logo.png"
              alt="AngelCare"
              width={250}
              height={96}
              priority
              style={logoImageStyle}
            />
          </div>
        </Link>

        <div style={sideScrollStyle}>
          {NAV_GROUPS.map((group) => (
            <section key={group.group} style={navGroupStyle}>
              <div style={navGroupTitleStyle}>{group.group}</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href} style={navItemStyle}>
                    <span style={navIconStyle}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge ? <span style={navBadgeStyle}>{item.badge}</span> : null}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </aside>

      <div style={mainShellStyle}>
        <header style={topbarStyle}>
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
                {searchResults.map((item) => (
                  <Link key={`${item.group}-${item.href}`} href={item.href} style={searchItemStyle}>
                    <span>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 900, color: '#0f172a' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{item.group}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <div style={topbarActionsStyle}>
            <button type="button" onClick={() => setQuickOpen(!quickOpen)} style={quickButtonStyle}>
              ＋ Quick Create
            </button>
            <Link href="/reports" style={iconButtonStyle}>📊</Link>
            <Link href="/incidents" style={notificationButtonStyle}>
              🔔<span style={notificationDotStyle} />
            </Link>
            <Link href="/profile" style={profileButtonStyle}>
              <span style={avatarStyle}>A</span>
              <span>Profile</span>
            </Link>
          </div>

          {quickOpen ? (
            <div style={quickPanelStyle}>
              {QUICK_CREATE.map((item) => (
                <Link key={item.href} href={item.href} style={quickItemStyle}>
                  <span style={quickIconStyle}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </header>

        <section style={pageHeaderStyle}>
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
        </section>

        <main style={contentStyle}>{children}</main>
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
const sidebarStyle: React.CSSProperties = { width: 310, minWidth: 310, height: `calc(100vh - ${OVERHEAD_HEIGHT}px)`, position: 'sticky', top: OVERHEAD_HEIGHT, background: 'linear-gradient(180deg, #07111f 0%, #0f172a 100%)', color: '#fff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)' }
const brandStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '14px 16px 16px', color: '#fff', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)' }
const logoImageBoxStyle: React.CSSProperties = { width: '100%', height: 94, borderRadius: 24, display: 'grid', placeItems: 'center', overflow: 'hidden', background: '#fff', boxShadow: '0 18px 38px rgba(2,6,23,.30)', border: '1px solid rgba(255,255,255,.18)' }
const logoImageStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }
const sideScrollStyle: React.CSSProperties = { overflowY: 'auto', padding: '14px 14px 24px' }
const navGroupStyle: React.CSSProperties = { marginBottom: 18 }
const navGroupTitleStyle: React.CSSProperties = { color: '#94a3b8', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: 1, padding: '8px 10px' }
const navItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', borderRadius: 14, color: '#e2e8f0', textDecoration: 'none', fontSize: 13, fontWeight: 800, background: 'transparent' }
const navIconStyle: React.CSSProperties = { width: 26, height: 26, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.06)' }
const navBadgeStyle: React.CSSProperties = { fontSize: 10, padding: '4px 7px', borderRadius: 999, background: '#dbeafe', color: '#1e3a8a', fontWeight: 950 }
const mainShellStyle: React.CSSProperties = { flex: 1, minWidth: 0 }
const topbarStyle: React.CSSProperties = { height: 74, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 24px', background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #dbe3ee', position: 'sticky', top: OVERHEAD_HEIGHT, zIndex: 10 }
const searchWrapStyle: React.CSSProperties = { position: 'relative', flex: 1, maxWidth: 680, display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', border: '1px solid #dbe3ee', borderRadius: 18, padding: '0 14px', height: 48 }
const searchInputStyle: React.CSSProperties = { flex: 1, border: 'none', outline: 'none', background: 'transparent', color: '#0f172a', fontWeight: 700, fontSize: 14 }
const searchResultsStyle: React.CSSProperties = { position: 'absolute', top: 56, left: 0, right: 0, background: '#fff', border: '1px solid #dbe3ee', borderRadius: 18, padding: 10, boxShadow: '0 22px 50px rgba(15,23,42,.14)', zIndex: 20, display: 'grid', gap: 8 }
const searchItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, textDecoration: 'none', background: '#f8fafc' }
const topbarActionsStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }
const quickButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '12px 14px', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }
const iconButtonStyle: React.CSSProperties = { width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#f8fafc', border: '1px solid #dbe3ee', textDecoration: 'none' }
const notificationButtonStyle: React.CSSProperties = { ...iconButtonStyle, position: 'relative' }
const notificationDotStyle: React.CSSProperties = { position: 'absolute', top: 9, right: 9, width: 9, height: 9, borderRadius: 999, background: '#ef4444', border: '2px solid #fff' }
const profileButtonStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 14, border: '1px solid #dbe3ee', background: '#fff', textDecoration: 'none', color: '#0f172a', fontWeight: 900 }
const avatarStyle: React.CSSProperties = { width: 30, height: 30, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#e0f2fe', color: '#075985', fontWeight: 950 }
const quickPanelStyle: React.CSSProperties = { position: 'absolute', top: 62, right: 24, width: 280, background: '#fff', border: '1px solid #dbe3ee', borderRadius: 18, padding: 10, boxShadow: '0 22px 50px rgba(15,23,42,.14)', zIndex: 30, display: 'grid', gap: 8 }
const quickItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: 11, borderRadius: 14, textDecoration: 'none', color: '#0f172a', fontWeight: 900, background: '#f8fafc' }
const quickIconStyle: React.CSSProperties = { width: 32, height: 32, display: 'grid', placeItems: 'center', borderRadius: 10, background: '#fff', border: '1px solid #e2e8f0' }
const pageHeaderStyle: React.CSSProperties = { padding: '28px 28px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }
const breadcrumbStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, fontWeight: 800, marginBottom: 10 }
const pageTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 42, lineHeight: 1.02, fontWeight: 950, letterSpacing: -1.3 }
const pageSubtitleStyle: React.CSSProperties = { margin: '10px 0 0', color: '#475569', fontWeight: 700, lineHeight: 1.6, maxWidth: 760 }
const pageActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const contentStyle: React.CSSProperties = { padding: '0 28px 34px' }
const actionDarkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 950 }
const actionLightStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee', textDecoration: 'none', fontWeight: 950 }
const actionDangerStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', textDecoration: 'none', fontWeight: 950 }
