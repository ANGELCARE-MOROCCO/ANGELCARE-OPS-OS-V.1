import { createClient } from '@/lib/supabase/server'
import { marketingCommandData } from '@/lib/market-os/marketing-command-center-data'

type AnyRow = Record<string, any>

function rows(value: any): AnyRow[] {
  return Array.isArray(value) ? value : []
}

function first(
  row: AnyRow,
  keys: string[],
  fallback: string = '—'
): string {
  for (const key of keys) {
    if (
      row?.[key] !== undefined &&
      row?.[key] !== null &&
      String(row[key]).trim() !== ''
    ) {
      return String(row[key])
    }
  }

  return fallback
}

function money(value: number) {
  if (!Number.isFinite(value)) return '0 MAD'
  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M MAD`
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K MAD`
  return `${Math.round(value)} MAD`
}

async function safeSelect(table: string, query = '*', limit = 100) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from(table).select(query).limit(limit)
    if (error) return []
    return rows(data)
  } catch {
    return []
  }
}

export async function getMarketingLiveSnapshot() {
  const [
    campaigns,
    leads,
    sales,
    services,
    families,
    contentTasks,
    revenueItems,
    tasks,
  ] = await Promise.all([
    safeSelect('marketing_campaigns', '*', 100),
    safeSelect('leads', '*', 150),
    safeSelect('sales', '*', 120),
    safeSelect('services', '*', 100),
    safeSelect('families', '*', 150),
    safeSelect('content_tasks', '*', 100),
    safeSelect('revenue_opportunities', '*', 120),
    safeSelect('tasks', '*', 120),
  ])

  const openLeads = leads.filter((x) => !['closed', 'won', 'lost', 'done'].includes(String(first(x, ['status', 'stage'], '')).toLowerCase()))
  const activeCampaigns = campaigns.filter((x) => !['archived', 'paused', 'closed'].includes(String(first(x, ['status'], '')).toLowerCase()))
  const openTasks = tasks.filter((x) => !['done', 'closed', 'completed'].includes(String(first(x, ['status'], '')).toLowerCase()))

  const revenueValue = revenueItems.reduce((sum, row) => {
    const raw = Number(
      first(row, ['amount', 'value', 'revenue_mad', 'estimated_value'], '0')
    )
    return sum + (Number.isFinite(raw) ? raw : 0)
  }, 0)

  const contentPublished = contentTasks.filter((x) =>
    ['published', 'done', 'complete', 'completed'].includes(String(first(x, ['status'], '')).toLowerCase())
  ).length

  const kpis = [
    {
      label: 'Total Campaigns',
      value: String(activeCampaigns.length || marketingCommandData.kpis[0].value),
      trend: activeCampaigns.length ? 'Live' : marketingCommandData.kpis[0].trend,
      href: '/market-os/campaign-lifecycle',
      icon: '🎯',
    },
    {
      label: 'Total Leads Generated',
      value: String(openLeads.length || marketingCommandData.kpis[1].value),
      trend: openLeads.length ? 'Live' : marketingCommandData.kpis[1].trend,
      href: '/leads',
      icon: '👥',
    },
    {
      label: 'Revenue Influenced',
      value: revenueValue ? money(revenueValue) : marketingCommandData.kpis[2].value,
      trend: revenueValue ? 'Live' : marketingCommandData.kpis[2].trend,
      href: '/revenue-command-center',
      icon: '💰',
    },
    {
      label: 'Content Published',
      value: String(contentPublished || marketingCommandData.kpis[3].value),
      trend: contentPublished ? 'Live' : marketingCommandData.kpis[3].trend,
      href: '/market-os/content-command-center',
      icon: '📄',
    },
    {
      label: 'Engagement Rate',
      value: marketingCommandData.kpis[4].value,
      trend: marketingCommandData.kpis[4].trend,
      href: '/reports',
      icon: '💜',
    },
  ]

  const topCampaigns = activeCampaigns.slice(0, 6).map((campaign) => ({
    title: String(first(campaign, ['title', 'name', 'campaign_name'], 'Campaign')),
    type: String(first(campaign, ['type', 'channel', 'objective'], 'Marketing campaign')),
    leads: `${String(first(campaign, ['leads_count', 'leads', 'conversions'], '0'))} Leads`,
    growth: String(first(campaign, ['growth', 'trend'], 'Live')),
    href: '/market-os/campaign-lifecycle',
  }))

  const priorities = [
    ...openTasks.slice(0, 4).map((task) => ({
      title: String(first(task, ['title', 'name', 'description'], 'Marketing task')),
      priority: String(first(task, ['priority'], 'Medium')),
      href: '/revenue-command-center/tasks',
    })),
    ...openLeads.slice(0, 3).map((lead) => ({
      title: `Follow up lead: ${String(first(lead, ['full_name', 'name', 'contact_name'], 'new lead'))}`,
      priority: 'High',
      href: '/leads',
    })),
  ].slice(0, 7)

  const activity = [
    ...openLeads.slice(0, 3).map((lead) => ({
      title: `New marketing lead: ${String(first(lead, ['full_name', 'name', 'contact_name'], 'lead'))}`,
      time: String(first(lead, ['updated_at', 'created_at'], 'recent')),
      href: '/leads',
    })),
    ...activeCampaigns.slice(0, 3).map((campaign) => ({
      title: `Campaign active: ${String(first(campaign, ['title', 'name'], 'campaign'))}`,
      time: String(first(campaign, ['updated_at', 'created_at'], 'recent')),
      href: '/market-os/campaign-lifecycle',
    })),
  ].slice(0, 8)

  return {
    loadedAt: new Date().toISOString(),
    mode: campaigns.length || leads.length || sales.length || services.length || families.length ? 'live-partial' : 'fallback',
    kpis,
    topCampaigns: topCampaigns.length ? topCampaigns : marketingCommandData.campaigns,
    priorities: priorities.length ? priorities : marketingCommandData.priorities,
    activity: activity.length ? activity : marketingCommandData.activity,
    counts: {
      campaigns: campaigns.length,
      leads: leads.length,
      sales: sales.length,
      services: services.length,
      families: families.length,
      contentTasks: contentTasks.length,
      revenueItems: revenueItems.length,
      tasks: tasks.length,
    },
    sync: [
      { module: 'Campaigns', table: 'marketing_campaigns', count: campaigns.length, href: '/market-os/campaign-lifecycle' },
      { module: 'Leads', table: 'leads', count: leads.length, href: '/leads' },
      { module: 'Sales', table: 'sales', count: sales.length, href: '/sales' },
      { module: 'Services', table: 'services', count: services.length, href: '/services' },
      { module: 'Families', table: 'families', count: families.length, href: '/families' },
      { module: 'Content', table: 'content_tasks', count: contentTasks.length, href: '/market-os/content-command-center' },
      { module: 'Revenue', table: 'revenue_opportunities', count: revenueItems.length, href: '/revenue-command-center' },
      { module: 'Tasks', table: 'tasks', count: tasks.length, href: '/revenue-command-center/tasks' },
    ],
  }
}