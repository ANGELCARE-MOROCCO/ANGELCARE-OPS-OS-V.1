'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './B2BPartnershipsModuleShell.module.css'

const navItems = [
  {
    label: 'Command Center',
    href: '/b2b-partnerships',
    icon: '📊',
    description: 'Executive cockpit',
  },
  {
    label: 'Prospect Directory',
    href: '/b2b-partnerships/prospects',
    icon: '🏢',
    description: 'Hotels, clinics, decision makers',
  },
  {
    label: 'Pipeline Board',
    href: '/b2b-partnerships/pipeline',
    icon: '🎯',
    description: 'Deal stages and priorities',
  },
  {
    label: 'Outreach Cockpit',
    href: '/b2b-partnerships/outreach',
    icon: '📨',
    description: 'Calls, emails, WhatsApp, scripts',
  },
  {
    label: 'Integration Hub',
    href: '/b2b-partnerships/integration',
    icon: '🧭',
    description: 'Direct actions, timeline and configurable execution',
  },
  {
    label: 'Templates & Scripts',
    href: '/b2b-partnerships/templates',
    icon: '✍️',
    description: 'French email, WhatsApp and call library',
  },
  {
    label: 'Campaigns & Sequences',
    href: '/b2b-partnerships/campaigns',
    icon: '🚀',
    description: 'Multi-step B2B outreach campaigns',
  },
  {
    label: 'Import Hub',
    href: '/b2b-partnerships/imports',
    icon: '📥',
    description: 'CSV intake and prospect staging',
  },
  {
    label: 'Automation & Scoring',
    href: '/b2b-partnerships/automation',
    icon: '⚙️',
    description: 'Rules, scores, follow-ups and triggers',
  },
  {
    label: 'Meetings & Follow-ups',
    href: '/b2b-partnerships/meetings',
    icon: '📅',
    description: 'Discovery and next steps',
  },
  {
    label: 'Tasks & Assignments',
    href: '/b2b-partnerships/tasks',
    icon: '✅',
    description: 'Daily execution board',
  },
  {
    label: 'Intern Execution OS',
    href: '/b2b-partnerships/execution',
    icon: '⚡',
    description: 'Targets, cadence, discipline',
  },
  {
    label: 'Partnership Proposals',
    href: '/b2b-partnerships/proposals',
    icon: '📄',
    description: 'Deal desk and offers',
  },
  {
    label: 'Partner Programs',
    href: '/b2b-partnerships/programs',
    icon: '🤝',
    description: 'Hotel and clinic B2B offers',
  },
  {
    label: 'Reports & KPIs',
    href: '/b2b-partnerships/reports',
    icon: '📈',
    description: 'Weekly reporting suite',
  },
  {
    label: 'Executive KPIs',
    href: '/b2b-partnerships/kpis',
    icon: '🏆',
    description: 'Leadership performance view',
  },

  {
    label: 'Executive Intelligence',
    href: '/b2b-partnerships/intelligence',
    icon: '🧠',
    description: 'Leadership control tower and risks',
  },
  {
    label: 'Quality Center',
    href: '/b2b-partnerships/quality',
    icon: '🛡️',
    description: 'System health and QA checks',
  },
  {
    label: 'Settings & Controls',
    href: '/b2b-partnerships/settings',
    icon: '🛠️',
    description: 'Configuration and governance',
  },
]

function isActive(pathname: string, href: string) {
  if (href === '/b2b-partnerships') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function B2BPartnershipsModuleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const activeItem = navItems.find((item) => isActive(pathname, item.href)) || navItems[0]

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <span className={styles.brandPill}>ANGELCARE B2B</span>
          <h2>Partnerships OS</h2>
          <p>Hospitality partnerships, pediatric clinic alliances, strategic accounts and measurable execution.</p>
        </div>
        <nav className={styles.nav} aria-label="B2B Partnerships navigation">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.active : ''}`}>
                <span className={styles.navIcon}>{item.icon}</span>
                <span><strong>{item.label}</strong><small>{item.description}</small></span>
              </Link>
            )
          })}
        </nav>
        <div className={styles.sidebarPanel}>
          <span className={styles.panelLabel}>B2B Growth Sprint</span>
          <strong>Hotels + pediatric clinics first</strong>
          <p>Weekly operating rhythm for qualified prospects, real meetings, serious proposals and signed pilots.</p>
          <div className={styles.panelStats}><span>80 outreach / week</span><span>15 meetings / month</span><span>5 proposals / month</span></div>
        </div>
      </aside>
      <main className={styles.main}>
        <div className={styles.moduleHeader}>
          <div><span className={styles.eyebrow}>B2B Partnerships Workspace</span><h1>{activeItem.label}</h1><p>{activeItem.description}</p></div>
          <div className={styles.headerActions}>
            <Link href="/b2b-partnerships/prospects" className={styles.secondaryAction}>CRM</Link>
            <Link href="/b2b-partnerships/outreach" className={styles.secondaryAction}>Outreach</Link>
            <Link href="/b2b-partnerships/proposals" className={styles.primaryAction}>Créer proposition</Link>
          </div>
        </div>
        <section className={styles.content}>{children}</section>
      </main>
    </div>
  )
}
