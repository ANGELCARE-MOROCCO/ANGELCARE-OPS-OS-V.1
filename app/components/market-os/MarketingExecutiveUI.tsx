'use client'

import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import Link from 'next/link'

type KPIItem = [string, string, string, string, string, string]
type NavItem = [string, string, string, string]
type ActivityItem = { title: string; channel?: string; region?: string; tag?: string; time?: string; href: string }
type SyncItem = { module: string; href: string; count?: number; ok?: boolean }
type ExpansionItem = { title: string; status?: string; owner?: string; metric?: string; href: string }
type MarketingExpansionSync = {
  ok: boolean
  loadedAt?: string
  seo: {
    keywords: number
    blogPosts: number
    seoPages: number
    contentTasks: number
    articles: ExpansionItem[]
    keywordBoard: ExpansionItem[]
    technicalQueue: ExpansionItem[]
  }
  ambassadors: {
    ambassadors: number
    applications: number
    tasks: number
    partnerships: number
    activeBoard: ExpansionItem[]
    applicationQueue: ExpansionItem[]
    activationTasks: ExpansionItem[]
  }
}

const marketNav: NavItem[] = [
  ['Marketing Home', '/market-os/marketing-home', '🏠', 'HOME'],
  ['Market-OS', '/market-os', '◎', 'OS'],
  ['Campaign Lifecycle', '/market-os/campaign-lifecycle', '🎯', ''],
  ['Content Command', '/market-os/content-command-center', '🧠', ''],
  ['SEO Blog Workspace', '/market-os/seo-blog-workspace', '✍️', ''],
  ['Ambassador Program', '/market-os/ambassadors', '🤝', ''],
]

const syncNav: NavItem[] = [
  ['Revenue Command', '/revenue-command-center', '💎', 'SYNC'],
  ['Leads', '/leads', '📈', ''],
  ['Sales CRM', '/sales', '🚀', ''],
  ['Services', '/services', '🧩', ''],
  ['Families CRM', '/families', '🏡', ''],
  ['Voice Center', '/voice-center', '☎️', 'LIVE'],
  ['Reports', '/reports', '📊', ''],
]

const fallbackKpis: KPIItem[] = [
  ['Revenue Impact', '12.64M MAD', '+28.4%', '/revenue-command-center', '#22c55e', '💰'],
  ['New Leads', '1,842', '+35.7%', '/leads', '#38bdf8', '👥'],
  ['Marketing ROI', '385%', '+18.2%', '/reports', '#a855f7', '📊'],
  ['CAC Control', '98 MAD', '-14.6%', '/reports', '#f59e0b', '🎯'],
  ['Conversion Rate', '7.62%', '+9.3%', '/reports', '#22d3ee', '⚡'],
  ['LTV / CAC', '8.7x', '+21.5%', '/reports', '#c084fc', '💎'],
]

const campaigns = [
  ['Ramadan Awareness 2025', 'Facebook Ads', 'Reach 1.2M', '186 conversions', '2.48M MAD', '412%', '/market-os/campaign-lifecycle'],
  ['Elderly Care Services', 'Google Ads', 'Reach 875K', '142 conversions', '1.87M MAD', '378%', '/market-os/campaign-lifecycle'],
  ['Post-Surgery Recovery', 'Meta', 'Reach 642K', '98 conversions', '1.24M MAD', '352%', '/market-os/campaign-lifecycle'],
  ['AngelCare Home Care', 'Organic', 'Reach 521K', '76 conversions', '890K MAD', '290%', '/market-os/content-command-center'],
]

const channelRows = [
  ['Facebook Ads', '32.6%', '4.12M MAD', '#3b82f6'],
  ['Google Ads', '24.8%', '3.13M MAD', '#ec4899'],
  ['TikTok Ads', '18.7%', '2.36M MAD', '#f59e0b'],
  ['Instagram', '12.9%', '1.63M MAD', '#ef4444'],
  ['Email / WhatsApp', '6.1%', '770K MAD', '#22c55e'],
  ['Organic / SEO', '4.9%', '620K MAD', '#64748b'],
]

const aiActions = [
  ['Budget Reallocation', 'Shift 15% from weak generic ads to high-intent Google/Meta search demand.', 'High impact', '+22% ROI', '/revenue-command-center'],
  ['B2B Kindergarten Push', 'Activate partner decision-makers in Rabat and Casablanca this week.', 'Strategic', '+18% leads', '/market-os/ambassadors'],
  ['Content Authority Gap', 'Prioritize proof-based family trust reels and caregiver credibility assets.', 'Content', '+32% engagement', '/market-os/content-command-center'],
  ['Lead Recovery Sequence', 'Re-engage dormant family leads through WhatsApp and voice follow-up.', 'Automation', '+15% conversion', '/market-os/campaign-lifecycle'],
]

const funnel = [
  ['Impressions', '2.45M', '+12.5%'],
  ['Clicks', '125.6K', '+18.3%'],
  ['Landing Views', '47.3K', '+21.7%'],
  ['Leads', '1,842', '+35.7%'],
  ['Conversions', '312', '+28.1%'],
]

const content = [
  ['Home Care Services Video', '128K', '8.7%', '96/100'],
  ['Patient Testimonial – Fatima', '96K', '7.2%', '89/100'],
  ['Caregiver Training Tips', '74K', '6.1%', '82/100'],
  ['Post-Surgery Recovery Guide', '61K', '5.3%', '78/100'],
]

function ago(value?: string) {
  if (!value) return 'live'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function MarketingExecutiveUI() {
  const [snapshot, setSnapshot] = useState<any>(null)
  const [status, setStatus] = useState<'loading' | 'live' | 'safe'>('loading')
  const [tick, setTick] = useState(0)
  const [expansion, setExpansion] = useState<MarketingExpansionSync | null>(null)
  const [view, setView] = useState<'Revenue' | 'Leads' | 'Conversion'>('Revenue')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const res = await fetch('/api/marketing/deep-sync', { cache: 'no-store' })
        const json = await res.json()
        if (!active) return

        if (json?.ok) {
          setSnapshot(json)
          setStatus(json.mode === 'deep-live' ? 'live' : 'safe')
        } else {
          setStatus('safe')
        }

        try {
          const expansionRes = await fetch('/api/marketing/expansion-sync', { cache: 'no-store' })
          const expansionJson = await expansionRes.json()
          if (active && expansionJson?.ok) setExpansion(expansionJson)
        } catch {
          if (active) setExpansion(null)
        }
      } catch {
        if (active) setStatus('safe')
      }
    }

    load()
    const syncTimer = setInterval(load, 30000)
    const clockTimer = setInterval(() => setTick((v) => v + 1), 15000)

    return () => {
      active = false
      clearInterval(syncTimer)
      clearInterval(clockTimer)
    }
  }, [])

  const kpis = useMemo<KPIItem[]>(() => {
    if (!snapshot?.kpis?.length) return fallbackKpis
    return snapshot.kpis.slice(0, 6).map((k: any, i: number): KPIItem => [
      String(k.label),
      String(k.value),
      String(k.delta || k.trend || '+ live'),
      String(k.href || '/reports'),
      ['#22c55e', '#38bdf8', '#a855f7', '#f59e0b', '#22d3ee', '#c084fc'][i],
      ['💰', '👥', '📊', '🎯', '⚡', '💎'][i],
    ])
  }, [snapshot])

  const activity: ActivityItem[] = snapshot?.activity?.length
    ? snapshot.activity
    : [
        { title: 'New lead generated', channel: 'Website Form', region: 'Casablanca', tag: 'Hot', time: new Date(Date.now() - 120000).toISOString(), href: '/leads' },
        { title: 'Campaign hit 100K impressions', channel: 'Facebook Ads', region: 'Rabat', tag: 'Info', time: new Date(Date.now() - 480000).toISOString(), href: '/market-os/campaign-lifecycle' },
        { title: 'Content asset published', channel: 'Content Studio', region: 'Organic', tag: 'Success', time: new Date(Date.now() - 900000).toISOString(), href: '/market-os/content-command-center' },
        { title: 'Budget approved', channel: 'Google Ads', region: '4.20M MAD', tag: 'Finance', time: new Date(Date.now() - 1320000).toISOString(), href: '/revenue-command-center' },
      ]

  const sync: SyncItem[] = snapshot?.sync?.length
    ? snapshot.sync
    : [
        { module: 'Market-OS', href: '/market-os', ok: true },
        { module: 'Revenue', href: '/revenue-command-center', ok: true },
        { module: 'Leads', href: '/leads', ok: true },
        { module: 'Sales', href: '/sales', ok: true },
        { module: 'Services', href: '/services', ok: true },
        { module: 'Families', href: '/families', ok: true },
      ]

  return (
    <div style={page}>
      <aside style={sidebar}>
        <div style={brand}>
          <div style={logo}>♡</div>
          <div>
            <strong>AngelCare</strong>
            <span>Marketing OS</span>
          </div>
        </div>

        <NavGroup title="MARKET-OS" items={marketNav} active="Marketing Home" />
        <NavGroup title="INTEGRATED MODULES" items={syncNav} />

        <div style={assistant}>
          <div style={assistantIcon}>✦</div>
          <b>AI Marketing Assistant</b>
          <span>Online · Market intelligence ready</span>
          <input placeholder="Ask about campaigns, leads, CAC..." style={assistantInput} />
        </div>

        <div style={workspace}>
          <b>Marketing Workspace</b>
          <span>All systems operational</span>
          <i />
        </div>
      </aside>

      <main style={main}>
        <header style={topbar}>
          <div style={search}>⌕ Search across Market-OS, campaigns, leads, partners, content...</div>
          <div style={topButtons}>
            <Link href="/market-os/campaign-lifecycle">+ New Campaign</Link>
            <Link href="/reports">Export</Link>
            <Link href="/market-os">All Workspaces</Link>
          </div>
        </header>

        <section style={hero}>
          <div style={heroIdentity}>
            <div style={heroIcon}>✦</div>
            <div>
              <span style={eyebrow}>MARKETING COMMAND HQ</span>
              <h1><span>AngelCare Marketing</span> Growth Control Center</h1>
              <p>Daily acquisition, campaigns, content, partnerships and revenue influence — synchronized for execution.</p>

              <div style={heroActions}>
                <Link href="/market-os/campaign-lifecycle"><span>🎯</span> Campaign Control</Link>
                <Link href="/market-os/content-command-center"><span>🧠</span> Content Studio</Link>
                <Link href="/revenue-command-center"><span>💎</span> Revenue Influence</Link>
              </div>
            </div>
          </div>

          <div style={liveCard}>
            <div style={liveTop}>
              <b><span>●</span> Market-OS Sync</b>
              <span>{status === 'live' ? 'LIVE' : 'SAFE'}</span>
            </div>
            <strong>{status === 'live' ? 'Operationally synchronized' : 'Safe operating mode'}</strong>
            <p>Updated {snapshot?.loadedAt ? new Date(snapshot.loadedAt).toLocaleTimeString() : 'initializing'}</p>
            <div style={syncMiniGrid}>
              <span>🎯 Campaigns</span>
              <span>📈 Leads</span>
              <span>💰 Revenue</span>
              <span>🤝 Partners</span>
            </div>
            <div style={pulse}><i /></div>
          </div>
        </section>

        <section style={kpiGrid}>
          {kpis.map(([label, value, delta, href, color, icon]) => (
            <Link key={label} href={href} style={kpiCard}>
              <div style={kpiTop}><span>{label}</span><b style={{ color }}>{icon}</b></div>
              <strong>{value}</strong>
              <em style={{ color }}>{delta} vs prev period</em>
              <svg viewBox="0 0 160 34" width="100%" height="34">
                <path d="M2 26 C20 20,34 23,52 16 C75 7,88 23,108 10 C130 -2,138 16,158 8" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
              </svg>
            </Link>
          ))}
        </section>


        <section style={expansionHeader}>
          <div>
            <span style={eyebrow}>SEO + AMBASSADOR EXPANSION LAYERS</span>
            <h2>Organic Authority, Blog Growth & Ambassador Activation</h2>
            <p>Live-synchronized control layer for SEO/blog operations and ambassador growth workstreams.</p>
          </div>
          <div style={expansionSyncCard}>
            <b>Expansion Sync</b>
            <span>{expansion?.loadedAt ? new Date(expansion.loadedAt).toLocaleTimeString() : 'waiting for records'}</span>
          </div>
        </section>

        <section style={seoGrid}>
          <Panel title="SEO Authority Command" action={<Link href="/market-os/seo-blog-workspace">Open SEO Workspace</Link>}>
            <div style={seoStats}>
              <Metric label="Keywords" value={String(expansion?.seo.keywords ?? 0)} icon="🔎" />
              <Metric label="SEO Pages" value={String(expansion?.seo.seoPages ?? 0)} icon="🧭" />
              <Metric label="Blog Posts" value={String(expansion?.seo.blogPosts ?? 0)} icon="✍️" />
              <Metric label="Content Tasks" value={String(expansion?.seo.contentTasks ?? 0)} icon="🧠" />
            </div>
            <LiveList items={expansion?.seo.keywordBoard || []} empty="No live keyword records found yet." />
          </Panel>

          <Panel title="Blog Production Pipeline" action={<Link href="/market-os/content-command-center">Open Content Command</Link>}>
            <LiveList items={expansion?.seo.articles || []} empty="No live blog/content records found yet." />
            <div style={sectionDock}>
              <Link href="/market-os/content-command-center">Create / Review Content</Link>
              <Link href="/market-os/seo-blog-workspace">SEO Blog Workspace</Link>
              <Link href="/reports">Content Report</Link>
            </div>
          </Panel>

          <Panel title="Technical SEO & Publishing QA" action={<Link href="/reports">SEO Report</Link>}>
            <LiveList items={expansion?.seo.technicalQueue || []} empty="No technical SEO queue records found yet." />
            <div style={qaMatrix}>
              <span>Indexing</span><b>{(expansion?.seo.seoPages ?? 0) > 0 ? 'Tracked' : 'No records'}</b>
              <span>Publishing</span><b>{(expansion?.seo.blogPosts ?? 0) > 0 ? 'Active' : 'No posts'}</b>
              <span>Content Ops</span><b>{(expansion?.seo.contentTasks ?? 0) > 0 ? 'Synced' : 'Empty'}</b>
            </div>
          </Panel>
        </section>

        <section style={ambassadorGrid}>
          <Panel title="Ambassador Growth Command" action={<Link href="/market-os/ambassadors">Open Ambassadors</Link>}>
            <div style={seoStats}>
              <Metric label="Ambassadors" value={String(expansion?.ambassadors.ambassadors ?? 0)} icon="🤝" />
              <Metric label="Applications" value={String(expansion?.ambassadors.applications ?? 0)} icon="📥" />
              <Metric label="Tasks" value={String(expansion?.ambassadors.tasks ?? 0)} icon="✅" />
              <Metric label="Partners" value={String(expansion?.ambassadors.partnerships ?? 0)} icon="🏢" />
            </div>
            <LiveList items={expansion?.ambassadors.activeBoard || []} empty="No live ambassador records found yet." />
          </Panel>

          <Panel title="Ambassador Applications & Vetting" action={<Link href="/market-os/ambassadors">Review Queue</Link>}>
            <LiveList items={expansion?.ambassadors.applicationQueue || []} empty="No ambassador applications detected yet." />
            <div style={sectionDock}>
              <Link href="/market-os/ambassadors">Ambassador Backoffice</Link>
              <Link href="/market-os/ambassadors">Partners Network</Link>
              <Link href="/reports">Ambassador Report</Link>
            </div>
          </Panel>

          <Panel title="Activation Missions & Field Influence" action={<Link href="/market-os/ambassadors">Partner Activation</Link>}>
            <LiveList items={expansion?.ambassadors.activationTasks || []} empty="No live ambassador activation tasks found yet." />
            <div style={qaMatrix}>
              <span>Activation</span><b>{(expansion?.ambassadors.tasks ?? 0) > 0 ? 'In motion' : 'No tasks'}</b>
              <span>Partner Sync</span><b>{(expansion?.ambassadors.partnerships ?? 0) > 0 ? 'Connected' : 'No partners'}</b>
              <span>Field Layer</span><b>{(expansion?.ambassadors.ambassadors ?? 0) > 0 ? 'Active' : 'Empty'}</b>
            </div>
          </Panel>
        </section>

        <section style={commandGrid}>
          <Panel title="Performance Intelligence" action={
            <div style={segmented}>
              {(['Revenue', 'Leads', 'Conversion'] as const).map((item) => (
                <button key={item} onClick={() => setView(item)} style={item === view ? activeSeg : seg}>{item}</button>
              ))}
            </div>
          }>
            <PerformanceChart view={view} />
          </Panel>

          <Panel title="Channel Performance" action={<Link href="/reports">View channels</Link>}>
            <div style={channelShell}>
              <div style={donut}><b>12.64M<br /><small>Total Revenue</small></b></div>
              <div style={channelList}>
                {channelRows.map(([name, pct, value, color]) => (
                  <Link href="/reports" key={name}>
                    <i style={{ background: color }} />
                    <span>{name}</span>
                    <b>{pct}</b>
                    <em>{value}</em>
                  </Link>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Funnel Analytics" action={<Link href="/reports">Full funnel</Link>}>
            <div style={funnelBox}>
              {funnel.map(([label, value, delta], i) => (
                <div key={label} style={{ ...funnelStep, width: `${100 - i * 9}%` }}>
                  <span>{label}</span>
                  <b>{value}</b>
                  <em>{delta}</em>
                </div>
              ))}
            </div>
            <div style={conversion}><span>Conversion Rate</span><b>7.62%</b><em>+9.3%</em></div>
          </Panel>
        </section>

        <section style={secondGrid}>
          <Panel title="Top Campaigns" action={<Link href="/market-os/campaign-lifecycle">View all</Link>}>
            {campaigns.map(([name, channel, reach, conv, revenue, roas, href], i) => (
              <Link href={href} key={name} style={campaignRow}>
                <div style={rank}>{i + 1}</div>
                <div><b>{name}</b><span>{channel}</span></div>
                <span>{reach}</span>
                <span>{conv}</span>
                <strong>{revenue}</strong>
                <em>{roas}</em>
              </Link>
            ))}
          </Panel>

          <Panel title="AI Insights & Recommendations" action={<Link href="/reports">View all</Link>}>
            {aiActions.map(([title, desc, tag, impact, href]) => (
              <Link href={href} key={title} style={insightRow}>
                <b>{title}</b>
                <p>{desc}</p>
                <span>{tag}</span>
                <em>{impact}</em>
              </Link>
            ))}
          </Panel>
        </section>

        <section style={thirdGrid}>
          <Panel title="Audience Intelligence" action={<Link href="/reports">Full report</Link>}>
            <div style={audienceShell}>
              <div style={audienceDonut}><b>126.4K</b><span>Total Audience</span></div>
              <div style={audienceList}>
                {['Women 62.3%', 'Men 37.1%', '18-34 years 41.8%', 'Casablanca 28.4%', 'Rabat 18.7%', 'Marrakech 12.9%'].map((x) => <p key={x}>{x}</p>)}
              </div>
            </div>
          </Panel>

          <Panel title="Content Performance" action={<Link href="/market-os/content-command-center">View all</Link>}>
            {content.map(([title, views, engagement, score]) => (
              <Link key={title} href="/market-os/content-command-center" style={contentRow}>
                <b>{title}</b><span>{views}</span><span>{engagement}</span><em>{score}</em>
              </Link>
            ))}
          </Panel>

          <Panel title="Budget Command" action={<Link href="/revenue-command-center">Finance view</Link>}>
            <div style={budgetGauge}><b>8.42M MAD</b><span>Total spent of 12M MAD</span></div>
            <div style={budgetRows}>
              <p><span>Spent</span><b>8.42M MAD</b></p>
              <p><span>Committed</span><b>2.11M MAD</b></p>
              <p><span>Remaining</span><b>1.47M MAD</b></p>
            </div>
          </Panel>
        </section>

        <section style={bottomGrid}>
          <Panel title="Recent Activity Feed" action={<Link href="/reports">All activity</Link>}>
            {activity.slice(0, 5).map((item) => (
              <Link key={`${item.title}-${item.time}`} href={item.href} style={activityRow}>
                <span>{ago(item.time)}</span>
                <b>{item.title}</b>
                <em>{item.channel}</em>
                <small>{item.region}</small>
                <strong>{item.tag}</strong>
              </Link>
            ))}
          </Panel>

          <Panel title="Quick Actions" action={null}>
            <div style={quickActions}>
              {[
                ['New Campaign', '/market-os/campaign-lifecycle', '📣'],
                ['Create Audience', '/leads', '👥'],
                ['Content Studio', '/market-os/content-command-center', '📝'],
                ['Automation Rule', '/market-os/campaign-lifecycle', '⚙️'],
                ['Generate Report', '/reports', '📄'],
                ['All Workspaces', '/market-os', '▦'],
              ].map(([label, href, icon]) => (
                <Link key={label} href={href} style={quickAction}><span>{icon}</span><b>{label}</b></Link>
              ))}
            </div>
          </Panel>
        </section>

        <div style={syncDock}>
          <b>Market-OS Sync Status</b>
          {sync.slice(0, 7).map((item) => (
            <Link href={String(item.href)} key={String(item.module)}>
              {item.module}<span>✓</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}


function Metric({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={metricCard}>
      <span>{icon}</span>
      <b>{value}</b>
      <em>{label}</em>
    </div>
  )
}

function LiveList({ items, empty }: { items: ExpansionItem[]; empty: string }) {
  if (!items.length) return <div style={emptyState}>{empty}</div>

  return (
    <div style={liveList}>
      {items.slice(0, 5).map((item) => (
        <Link href={item.href} key={`${item.title}-${item.metric || item.status || item.owner}`} style={liveListRow}>
          <div>
            <b>{item.title}</b>
            <span>{item.owner || item.status || 'Live record'}</span>
          </div>
          <em>{item.metric || item.status || 'Open'}</em>
        </Link>
      ))}
    </div>
  )
}

function NavGroup({ title, items, active }: { title: string; items: NavItem[]; active?: string }) {
  return (
    <div style={navGroup}>
      <p>{title}</p>
      {items.map(([label, href, icon, badge]) => (
        <Link key={label} href={href} style={label === active ? navActive : navItem}>
          <span>{icon}</span>
          <b>{label}</b>
          {badge ? <em>{badge}</em> : null}
        </Link>
      ))}
    </div>
  )
}

function Panel({ title, action, children }: { title: string; action: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={panel}>
      <header style={panelHeader}>
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

function PerformanceChart({ view }: { view: 'Revenue' | 'Leads' | 'Conversion' }) {
  const path = view === 'Revenue'
    ? 'M30 230 C105 170,170 160,245 150 C335 135,360 88,450 90 C555 92,585 130,670 105 C735 82,770 88,830 55'
    : view === 'Leads'
      ? 'M30 245 C100 190,165 185,245 145 C330 108,390 152,470 120 C560 86,610 155,705 112 C755 92,790 128,830 84'
      : 'M30 250 C120 230,170 205,250 190 C330 170,365 135,455 142 C555 150,615 115,700 96 C760 84,790 78,830 70'

  return (
    <div style={chartBox}>
      <svg viewBox="0 0 860 340" width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mainLine" x1="0" x2="1">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="mainArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,197,94,.25)" />
            <stop offset="100%" stopColor="rgba(14,165,233,0)" />
          </linearGradient>
        </defs>
        {[60, 110, 160, 210, 260, 310].map((y) => <line key={y} x1="30" y1={y} x2="830" y2={y} stroke="rgba(148,163,184,.14)" />)}
        <path d={`${path} L830 315 L30 315 Z`} fill="url(#mainArea)" />
        <path d={path} fill="none" stroke="url(#mainLine)" strokeWidth="5" strokeLinecap="round" />
        <path d="M30 260 C120 225,175 210,260 205 C350 200,410 160,520 170 C645 182,710 135,830 124" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="12 12" opacity=".78" />
        <path d="M30 285 C140 260,200 240,300 225 C400 210,460 185,560 175 C675 160,725 130,830 105" fill="none" stroke="#a855f7" strokeWidth="3" opacity=".65" />
      </svg>
      <div style={legend}><span>Revenue</span><span>Leads</span><span>Conversions</span></div>
    </div>
  )
}


const expansionHeader: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 270px',
  gap: 16,
  alignItems: 'center',
  padding: 22,
  borderRadius: 24,
  background: 'linear-gradient(135deg,rgba(14,165,233,.12),rgba(124,58,237,.16))',
  border: '1px solid rgba(148,163,184,.16)',
  boxShadow: '0 24px 72px rgba(0,0,0,.22)',
}

const expansionSyncCard: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: 'rgba(255,255,255,.055)',
  border: '1px solid rgba(148,163,184,.15)',
  display: 'grid',
  gap: 8,
}

const seoGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
  gap: 14,
}

const ambassadorGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
  gap: 14,
}

const seoStats: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
  gap: 9,
  marginBottom: 12,
}

const metricCard: React.CSSProperties = {
  minHeight: 92,
  padding: 12,
  borderRadius: 15,
  background: 'rgba(255,255,255,.045)',
  border: '1px solid rgba(148,163,184,.12)',
  display: 'grid',
  gap: 4,
  textAlign: 'center',
  placeItems: 'center',
}

const liveList: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const liveListRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: 12,
  borderRadius: 14,
  background: 'rgba(255,255,255,.04)',
  color: '#fff',
  textDecoration: 'none',
  border: '1px solid rgba(148,163,184,.10)',
}

const emptyState: React.CSSProperties = {
  padding: 16,
  borderRadius: 14,
  background: 'rgba(255,255,255,.035)',
  border: '1px dashed rgba(148,163,184,.22)',
  color: '#94a3b8',
  fontWeight: 800,
}

const sectionDock: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
  gap: 8,
  marginTop: 12,
}

const qaMatrix: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: 10,
  marginTop: 12,
  padding: 12,
  borderRadius: 14,
  background: 'rgba(2,6,23,.28)',
}


const page: React.CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '300px 1fr', background: 'radial-gradient(circle at 90% 20%,rgba(124,58,237,.13),transparent 32%),radial-gradient(circle at 15% 0%,rgba(14,165,233,.12),transparent 28%),#040b16', color: '#e5eefc', fontFamily: 'Inter, Arial, sans-serif' }
const sidebar: React.CSSProperties = { height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', padding: 22, background: 'linear-gradient(180deg,#06111f,#040816)', borderRight: '1px solid rgba(148,163,184,.16)', display: 'grid', alignContent: 'start', gap: 18 }
const brand: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, fontSize: 23, paddingBottom: 10 }
const logo: React.CSSProperties = { width: 52, height: 52, borderRadius: 18, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', boxShadow: '0 0 34px rgba(124,58,237,.42)' }
const navGroup: React.CSSProperties = { display: 'grid', gap: 7 }
const navItem: React.CSSProperties = { display: 'grid', gridTemplateColumns: '26px 1fr auto', gap: 10, alignItems: 'center', padding: '11px 13px', borderRadius: 13, color: '#cbd5e1', textDecoration: 'none', background: 'rgba(255,255,255,.035)', fontWeight: 850 }
const navActive: React.CSSProperties = { ...navItem, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', boxShadow: '0 0 28px rgba(124,58,237,.35)' }
const assistant: React.CSSProperties = { padding: 16, borderRadius: 18, background: 'linear-gradient(180deg,rgba(124,58,237,.18),rgba(14,165,233,.08))', border: '1px solid rgba(124,58,237,.28)', display: 'grid', gap: 8 }
const assistantIcon: React.CSSProperties = { width: 38, height: 38, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(124,58,237,.30)' }
const assistantInput: React.CSSProperties = { padding: '12px 13px', borderRadius: 12, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(2,6,23,.45)', color: '#fff' }
const workspace: React.CSSProperties = { padding: 16, borderRadius: 18, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(148,163,184,.12)', display: 'grid', gap: 8 }
const main: React.CSSProperties = { padding: 22, display: 'grid', gap: 16 }
const topbar: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }
const search: React.CSSProperties = { padding: '15px 17px', borderRadius: 15, background: '#0d1726', border: '1px solid rgba(148,163,184,.14)', color: '#94a3b8' }
const topButtons: React.CSSProperties = { display: 'flex', gap: 10 }
const hero: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 350px', gap: 20, padding: 28, borderRadius: 26, background: 'radial-gradient(circle at 48% 0%,rgba(124,58,237,.30),transparent 44%),radial-gradient(circle at 8% 10%,rgba(14,165,233,.18),transparent 30%),linear-gradient(135deg,#0d1726,#101827)', border: '1px solid rgba(124,58,237,.38)', boxShadow: '0 34px 100px rgba(0,0,0,.30)' }
const eyebrow: React.CSSProperties = { color: '#67e8f9', fontWeight: 1000, fontSize: 12, letterSpacing: 1.7 }

const heroIdentity: React.CSSProperties = { display: 'grid', gridTemplateColumns: '74px 1fr', gap: 18, alignItems: 'center' }
const heroIcon: React.CSSProperties = { width: 70, height: 70, borderRadius: 24, display: 'grid', placeItems: 'center', fontSize: 30, background: 'linear-gradient(135deg,#06b6d4,#7c3aed)', boxShadow: '0 0 42px rgba(124,58,237,.45)' }
const syncMiniGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginTop: 4 }

const heroActions: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }
const liveCard: React.CSSProperties = { padding: 18, borderRadius: 20, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(148,163,184,.18)', display: 'grid', gap: 10 }
const liveTop: React.CSSProperties = { display: 'flex', justifyContent: 'space-between' }
const pulse: React.CSSProperties = { height: 10, borderRadius: 999, background: 'linear-gradient(90deg,#22c55e,#38bdf8,#8b5cf6)' }
const kpiGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }
const kpiCard: React.CSSProperties = { padding: 16, borderRadius: 18, background: 'linear-gradient(180deg,#101827,#0b1320)', border: '1px solid rgba(148,163,184,.16)', color: '#fff', textDecoration: 'none', display: 'grid', gap: 8, minHeight: 142, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)' }
const kpiTop: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 10 }
const commandGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.25fr .95fr .95fr', gap: 14 }
const secondGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 14 }
const thirdGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '.85fr 1fr .85fr', gap: 14 }
const bottomGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.35fr .85fr', gap: 14 }
const panel: React.CSSProperties = { padding: 18, borderRadius: 20, background: 'linear-gradient(180deg,#0d1726,#09111e)', border: '1px solid rgba(14,165,233,.20)', boxShadow: '0 24px 72px rgba(0,0,0,.26)' }
const panelHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }
const segmented: React.CSSProperties = { display: 'flex', gap: 6, padding: 4, borderRadius: 12, background: 'rgba(255,255,255,.04)' }
const seg: React.CSSProperties = { border: 'none', borderRadius: 10, padding: '8px 11px', background: 'transparent', color: '#94a3b8', fontWeight: 900, cursor: 'pointer' }
const activeSeg: React.CSSProperties = { ...seg, background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)', color: '#fff' }
const chartBox: React.CSSProperties = { height: 350, borderRadius: 16, background: 'radial-gradient(circle at 40% 20%,rgba(34,197,94,.17),transparent 45%),rgba(2,6,23,.34)', overflow: 'hidden', position: 'relative' }
const legend: React.CSSProperties = { position: 'absolute', left: 20, bottom: 16, display: 'flex', gap: 18, fontWeight: 900, color: '#cbd5e1' }
const channelShell: React.CSSProperties = { display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'center' }
const donut: React.CSSProperties = { width: 210, height: 210, borderRadius: '50%', display: 'grid', placeItems: 'center', textAlign: 'center', background: 'conic-gradient(#3b82f6 0 33%,#22c55e 33% 58%,#f59e0b 58% 77%,#ec4899 77% 90%,#64748b 90% 100%)' }
const channelList: React.CSSProperties = { display: 'grid', gap: 9 }
const funnelBox: React.CSSProperties = { display: 'grid', justifyItems: 'center', gap: 7 }
const funnelStep: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'linear-gradient(90deg,rgba(59,130,246,.24),rgba(34,197,94,.18))', borderRadius: 12 }
const conversion: React.CSSProperties = { marginTop: 14, padding: 14, borderRadius: 13, background: 'rgba(255,255,255,.04)', display: 'flex', justifyContent: 'space-between' }
const campaignRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '40px 1fr auto auto auto auto', gap: 10, alignItems: 'center', padding: 12, borderRadius: 14, background: 'rgba(255,255,255,.045)', color: '#fff', textDecoration: 'none', marginBottom: 8 }
const rank: React.CSSProperties = { width: 34, height: 34, borderRadius: 12, background: 'rgba(124,58,237,.35)', display: 'grid', placeItems: 'center', fontWeight: 1000 }
const insightRow: React.CSSProperties = { display: 'grid', gap: 6, padding: 13, borderRadius: 14, background: 'rgba(255,255,255,.045)', color: '#fff', textDecoration: 'none', marginBottom: 8 }
const audienceShell: React.CSSProperties = { display: 'grid', gridTemplateColumns: '170px 1fr', gap: 14, alignItems: 'center' }
const audienceDonut: React.CSSProperties = { width: 155, height: 155, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'conic-gradient(#8b5cf6 0 40%,#0ea5e9 40% 70%,#22c55e 70% 100%)', textAlign: 'center' }
const audienceList: React.CSSProperties = { display: 'grid', gap: 5 }
const contentRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, padding: 11, color: '#fff', textDecoration: 'none', borderBottom: '1px solid rgba(148,163,184,.12)' }
const budgetGauge: React.CSSProperties = { height: 150, borderRadius: '150px 150px 20px 20px', display: 'grid', placeItems: 'center', background: 'conic-gradient(from 270deg,#3b82f6 0 70%,#22c55e 70% 88%,#1f2937 88% 100%)', textAlign: 'center' }
const budgetRows: React.CSSProperties = { display: 'grid', gap: 6, marginTop: 10 }
const activityRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '84px 1fr 150px 110px 70px', gap: 10, padding: 11, color: '#fff', textDecoration: 'none', borderBottom: '1px solid rgba(148,163,184,.12)' }
const quickActions: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }
const quickAction: React.CSSProperties = { minHeight: 92, borderRadius: 16, background: 'rgba(255,255,255,.045)', color: '#fff', textDecoration: 'none', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 12, border: '1px solid rgba(148,163,184,.12)' }
const syncDock: React.CSSProperties = { justifySelf: 'center', display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', padding: '16px 24px', borderRadius: 22, background: 'rgba(13,23,38,.9)', border: '1px solid rgba(148,163,184,.18)', boxShadow: '0 20px 60px rgba(0,0,0,.24)' }
