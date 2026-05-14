'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type LiveActivityItem = {
  title: string
  time?: string
  href: string
  icon?: string
  sub?: string
}

function formatRelativeTime(value?: string) {
  if (!value) return 'live'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function iconForHref(href: string) {
  if (href.includes('lead')) return '👥'
  if (href.includes('incident')) return '⚠️'
  if (href.includes('service')) return '🛡️'
  if (href.includes('voice')) return '📞'
  if (href.includes('revenue')) return '💰'
  return '◌'
}


const sidebarMain = [
  ['Command Center', '/csa-home', '⌘', ''],
  ['Mission Control', '/revenue-command-center/tasks', '◇', ''],
  ['Families', '/families', '✤', '32'],
  ['Leads', '/leads', '✥', '47'],
  ['Services', '/services', '✣', '22'],
  ['Incidents', '/incidents', '⚠', '15'],
  ['Revenue Command', '/revenue-command-center', '◈', '41.8K MAD'],
  ['Revenue Control Tower', '/revenue-command-center/control-tower', '▣', 'Live'],
  ['Revenue Prospects', '/revenue-command-center/prospects', '◎', '42'],
  ['Revenue Follow Ups', '/revenue-command-center/follow-ups', '↗', '31'],
  ['AI Revenue Scoring', '/revenue-command-center/ai-scoring', '✦', 'AI'],
  ['Sales Pipeline', '/sales', '🚀', 'Sync'],
  ['Voice Center', '/voice-center', '☎', 'Live'],
  ['Tasks & Approvals', '/revenue-command-center/tasks', '☑', '23'],
  ['Reports & Analytics', '/reports', '▥', ''],
  ['Intelligence Hub', '/reports', '◎', ''],
]

const sidebarOps = [
  ['Recovery Operations', '/revenue-command-center', '✧', ''],
  ['Escalations Board', '/incidents', '▣', '11'],
  ['CSA Workflows', '/services', '⌬', ''],
  ['Sales Executive Control', '/sales', '🚀', 'Live'],
  ['Knowledge Base', '/staff-services', '▤', ''],
]

const kpis = [
  ['Priority Families', '32', 'High attention', '+12%', '👥', '#8b5cf6'],
  ['Lead Follow-ups', '47', 'Awaiting action', '+18%', '👤', '#0ea5e9'],
  ['Active Services', '22', 'In progress', '+8%', '🧩', '#22c55e'],
  ['Open Incidents', '15', 'Requires action', '-5%', '⚠️', '#ef4444'],
  ['Revenue at Risk', '41.8K MAD', 'Potential impact', '+22%', '💰', '#f59e0b'],
  ['Recoveries Today', '12.6K MAD', 'Recovered', '+35%', '🛡️', '#22c55e'],
  ['Sales Handoffs', '18', 'Qualified transfers', '+16%', '🚀', '#38bdf8'],
]

const recoveryRows = [
  ['FM', 'Famille El Mansouri', 'Payment overdue · 12 days', '3.85K MAD', 'At Risk', '#6366f1'],
  ['NB', 'New Lead - Pamela B.', 'Proposal sent · 3 days', '2.1K MAD', 'Follow up', '#ef4444'],
  ['FB', 'Famille Benali', 'Service interruption risk', '1.75K MAD', 'Escalated', '#f59e0b'],
  ['FI', 'Famille Idrissi', 'Payment overdue · 8 days', '4.2K MAD', 'At Risk', '#22c55e'],
  ['FT', 'Famille Test', 'Waiting for documents', '1.25K MAD', 'Pending', '#f97316'],
]

const moduleCards = [
  ['Families', '32', 'Connected', '👥', '/families'],
  ['Leads', '47', 'Connected', '👤', '/leads'],
  ['Services', '22', 'Connected', '🧰', '/services'],
  ['Incidents', '15', 'Connected', '🚨', '/incidents'],
  ['Revenue', '41.8K MAD', 'Connected', '💰', '/revenue-command-center'],
  ['Sales Pipeline', '18', 'Connected', '🚀', '/sales'],
  ['Voice Center', 'Live', 'Connected', '📞', '/voice-center'],
  ['Tasks', '23', 'Connected', '☑️', '/revenue-command-center/tasks'],
  ['Reports', '18', 'Connected', '📊', '/reports'],
  ['Documents', '34', 'Connected', '📄', '/print'],
]

const activity = [
  ['New lead assigned', 'Pamela B. assigned to you', '2 min ago', '👥', '/leads'],
  ['Payment received', '2.35K MAD from Famille Benali', '5 min ago', '💬', '/revenue-command-center'],
  ['Service activated', 'Habilitation · 12h completed', '8 min ago', '🛡️', '/services'],
  ['Escalation created', 'High priority escalation #ESC-158', '12 min ago', '⚠️', '/incidents'],
  ['Voice call completed', 'Recovery call · 18 min', '15 min ago', '📞', '/voice-center'],
  ['Sales handoff completed', 'Qualified family transferred to sales', '22 min ago', '🚀', '/sales'],
]

const recommendations = [
  ['High Revenue Risk', '7 families at high risk', 'Potential impact: 18.65K MAD', 'Take Action', '#ef4444', '/revenue-command-center'],
  ['Follow-up Priority', '12 leads need follow-up', 'Conversion opportunity', 'View Leads', '#f59e0b', '/leads'],
  ['Escalation Alert', '3 escalations urgent', 'Requires immediate action', 'View Escalations', '#0ea5e9', '/incidents'],
  ['Recovery Opportunity', '12.6K MAD recoverable today', 'Based on AI analysis', 'View Opportunities', '#22c55e', '/revenue-command-center'],
  ['Service Attention', '2 services at risk', 'Prevent disruption', 'View Services', '#a855f7', '/services'],
  ['Sales Handoff Priority', '18 qualified opportunities', 'Move high-intent families to sales pipeline', 'Open Sales', '#38bdf8', '/sales'],
]

const revenueCommandRoutes = [
  ['Control Tower', '/revenue-command-center/control-tower', 'Strategic revenue cockpit', 'LIVE', '#38bdf8'],
  ['Prospects', '/revenue-command-center/prospects', 'Prospect intelligence and qualification', '42', '#8b5cf6'],
  ['Appointments', '/revenue-command-center/appointments', 'Meetings, calls and conversion moments', '18', '#22c55e'],
  ['Partnerships', '/revenue-command-center/partnerships', 'B2B institutions and strategic accounts', '7', '#f59e0b'],
  ['B2C Workflow', '/revenue-command-center/b2c-workflow', 'Family conversion workflow', 'ACTIVE', '#ec4899'],
  ['Daily Tasks', '/revenue-command-center/daily-tasks', 'Daily revenue execution queue', '23', '#14b8a6'],
  ['Follow Ups', '/revenue-command-center/follow-ups', 'Follow-up pipeline and recovery rhythm', '31', '#f97316'],
  ['AI Scoring', '/revenue-command-center/ai-scoring', 'AI lead score and opportunity priority', 'AI', '#a855f7'],
]

const revenueCommandMetrics = [
  ['Pipeline Value', '2.48M MAD', '+22%', '#22c55e'],
  ['Prospects in Motion', '42', '+14%', '#38bdf8'],
  ['Appointments Booked', '18', '+9%', '#8b5cf6'],
  ['Partnership Value', '410K MAD', '+17%', '#f59e0b'],
  ['B2C Conversion', '7.7%', '+2.1%', '#ec4899'],
  ['AI Score Avg.', '84/100', '+8 pts', '#a855f7'],
]


const performanceViews = ['Execution', 'Revenue', 'Leads', 'Services', 'SLA'] as const
const performanceRanges = ['Live', 'Today', '7D', '30D'] as const
const performanceLayers = ['Today', 'Yesterday', 'SLA Trend'] as const

const performanceModel = {
  Execution: {
    title: 'Execution Pulse',
    subtitle: 'Calls, follow-ups, task completion and CSA execution pressure.',
    score: '91%',
    insight: 'Execution velocity is strongest when recovery calls happen before escalation aging reaches 24h.',
    metrics: [
      ['Calls Made', '28', '+27% vs yesterday'],
      ['Follow-ups Closed', '12/15', '80% completion'],
      ['Task Velocity', '23', '+14% today'],
      ['Recovery Actions', '6', '4 urgent left'],
    ],
  },
  Revenue: {
    title: 'Revenue Recovery',
    subtitle: 'Revenue-at-risk, recoveries, objections and follow-up value.',
    score: '84%',
    insight: 'Revenue risk is concentrated around proposal hesitation and delayed follow-up windows.',
    metrics: [
      ['Revenue at Risk', '41.8K MAD', '12 active risks'],
      ['Recovered Today', '12.6K MAD', '+35%'],
      ['Pipeline Assisted', '2.48M MAD', 'CSA influenced'],
      ['High-Intent Deals', '18', 'ready for handoff'],
    ],
  },
  Leads: {
    title: 'Lead Recovery',
    subtitle: 'Lead follow-up pressure, response delay and qualification pace.',
    score: '78%',
    insight: '18 leads need same-day handling before conversion probability drops.',
    metrics: [
      ['Open Leads', '47', '18 urgent'],
      ['New Leads', '7', 'live intake'],
      ['Contacted', '31', '66% reached'],
      ['AI Hot Leads', '12', 'priority calls'],
    ],
  },
  Services: {
    title: 'Service Activation',
    subtitle: 'Activation readiness, blocked services and launch quality.',
    score: '92%',
    insight: '6 services are ready, but blockers should be cleared before end of day.',
    metrics: [
      ['Active Services', '22', 'in progress'],
      ['Ready to Start', '6', 'activation window'],
      ['Blocked', '3', 'needs owner'],
      ['Quality Score', '94%', 'stable'],
    ],
  },
  SLA: {
    title: 'SLA & Escalation Control',
    subtitle: 'Response time, escalation aging and satisfaction protection.',
    score: '96%',
    insight: 'SLA is healthy, but 3 high-priority escalations need immediate closure ownership.',
    metrics: [
      ['SLA Score', '96%', '+5%'],
      ['Open Escalations', '11', '3 high priority'],
      ['Avg Response', '4 min', 'excellent'],
      ['Resolved Today', '8', '+18%'],
    ],
  },
} as const


type ChartPoint = { x: number; y: number; label: string }

const chartProfiles: Record<string, Record<string, ChartPoint[]>> = {
  Execution: {
    Live: [
      { x: 65, y: 275, label: '00:00' },
      { x: 245, y: 218, label: '06:00' },
      { x: 420, y: 162, label: '09:00' },
      { x: 610, y: 118, label: '12:00' },
      { x: 815, y: 92, label: '18:00' },
      { x: 940, y: 58, label: '24:00' },
    ],
    Today: [
      { x: 65, y: 280, label: '00:00' },
      { x: 245, y: 230, label: '06:00' },
      { x: 420, y: 175, label: '09:00' },
      { x: 610, y: 130, label: '12:00' },
      { x: 815, y: 105, label: '18:00' },
      { x: 940, y: 72, label: '24:00' },
    ],
    '7D': [
      { x: 65, y: 245, label: 'Mon' },
      { x: 245, y: 225, label: 'Tue' },
      { x: 420, y: 190, label: 'Wed' },
      { x: 610, y: 158, label: 'Thu' },
      { x: 815, y: 112, label: 'Fri' },
      { x: 940, y: 86, label: 'Sun' },
    ],
    '30D': [
      { x: 65, y: 265, label: 'W1' },
      { x: 245, y: 235, label: 'W2' },
      { x: 420, y: 198, label: 'W3' },
      { x: 610, y: 155, label: 'W4' },
      { x: 815, y: 118, label: 'W5' },
      { x: 940, y: 96, label: 'Now' },
    ],
  },
  Revenue: {
    Live: [
      { x: 65, y: 260, label: '00:00' },
      { x: 245, y: 245, label: '06:00' },
      { x: 420, y: 180, label: '09:00' },
      { x: 610, y: 206, label: '12:00' },
      { x: 815, y: 112, label: '18:00' },
      { x: 940, y: 72, label: '24:00' },
    ],
    Today: [
      { x: 65, y: 272, label: '00:00' },
      { x: 245, y: 235, label: '06:00' },
      { x: 420, y: 210, label: '09:00' },
      { x: 610, y: 160, label: '12:00' },
      { x: 815, y: 98, label: '18:00' },
      { x: 940, y: 86, label: '24:00' },
    ],
    '7D': [
      { x: 65, y: 255, label: 'Mon' },
      { x: 245, y: 210, label: 'Tue' },
      { x: 420, y: 240, label: 'Wed' },
      { x: 610, y: 135, label: 'Thu' },
      { x: 815, y: 115, label: 'Fri' },
      { x: 940, y: 76, label: 'Sun' },
    ],
    '30D': [
      { x: 65, y: 285, label: 'W1' },
      { x: 245, y: 220, label: 'W2' },
      { x: 420, y: 188, label: 'W3' },
      { x: 610, y: 135, label: 'W4' },
      { x: 815, y: 80, label: 'W5' },
      { x: 940, y: 60, label: 'Now' },
    ],
  },
  Leads: {
    Live: [
      { x: 65, y: 250, label: '00:00' },
      { x: 245, y: 188, label: '06:00' },
      { x: 420, y: 215, label: '09:00' },
      { x: 610, y: 150, label: '12:00' },
      { x: 815, y: 170, label: '18:00' },
      { x: 940, y: 118, label: '24:00' },
    ],
    Today: [
      { x: 65, y: 270, label: '00:00' },
      { x: 245, y: 198, label: '06:00' },
      { x: 420, y: 160, label: '09:00' },
      { x: 610, y: 132, label: '12:00' },
      { x: 815, y: 145, label: '18:00' },
      { x: 940, y: 100, label: '24:00' },
    ],
    '7D': [
      { x: 65, y: 210, label: 'Mon' },
      { x: 245, y: 248, label: 'Tue' },
      { x: 420, y: 190, label: 'Wed' },
      { x: 610, y: 220, label: 'Thu' },
      { x: 815, y: 130, label: 'Fri' },
      { x: 940, y: 110, label: 'Sun' },
    ],
    '30D': [
      { x: 65, y: 260, label: 'W1' },
      { x: 245, y: 245, label: 'W2' },
      { x: 420, y: 225, label: 'W3' },
      { x: 610, y: 180, label: 'W4' },
      { x: 815, y: 140, label: 'W5' },
      { x: 940, y: 128, label: 'Now' },
    ],
  },
  Services: {
    Live: [
      { x: 65, y: 230, label: '00:00' },
      { x: 245, y: 220, label: '06:00' },
      { x: 420, y: 210, label: '09:00' },
      { x: 610, y: 140, label: '12:00' },
      { x: 815, y: 118, label: '18:00' },
      { x: 940, y: 90, label: '24:00' },
    ],
    Today: [
      { x: 65, y: 255, label: '00:00' },
      { x: 245, y: 232, label: '06:00' },
      { x: 420, y: 185, label: '09:00' },
      { x: 610, y: 152, label: '12:00' },
      { x: 815, y: 116, label: '18:00' },
      { x: 940, y: 92, label: '24:00' },
    ],
    '7D': [
      { x: 65, y: 280, label: 'Mon' },
      { x: 245, y: 235, label: 'Tue' },
      { x: 420, y: 210, label: 'Wed' },
      { x: 610, y: 205, label: 'Thu' },
      { x: 815, y: 130, label: 'Fri' },
      { x: 940, y: 86, label: 'Sun' },
    ],
    '30D': [
      { x: 65, y: 270, label: 'W1' },
      { x: 245, y: 240, label: 'W2' },
      { x: 420, y: 198, label: 'W3' },
      { x: 610, y: 170, label: 'W4' },
      { x: 815, y: 130, label: 'W5' },
      { x: 940, y: 78, label: 'Now' },
    ],
  },
  SLA: {
    Live: [
      { x: 65, y: 105, label: '00:00' },
      { x: 245, y: 95, label: '06:00' },
      { x: 420, y: 98, label: '09:00' },
      { x: 610, y: 90, label: '12:00' },
      { x: 815, y: 84, label: '18:00' },
      { x: 940, y: 82, label: '24:00' },
    ],
    Today: [
      { x: 65, y: 120, label: '00:00' },
      { x: 245, y: 108, label: '06:00' },
      { x: 420, y: 102, label: '09:00' },
      { x: 610, y: 92, label: '12:00' },
      { x: 815, y: 90, label: '18:00' },
      { x: 940, y: 86, label: '24:00' },
    ],
    '7D': [
      { x: 65, y: 130, label: 'Mon' },
      { x: 245, y: 118, label: 'Tue' },
      { x: 420, y: 124, label: 'Wed' },
      { x: 610, y: 100, label: 'Thu' },
      { x: 815, y: 92, label: 'Fri' },
      { x: 940, y: 80, label: 'Sun' },
    ],
    '30D': [
      { x: 65, y: 150, label: 'W1' },
      { x: 245, y: 132, label: 'W2' },
      { x: 420, y: 120, label: 'W3' },
      { x: 610, y: 102, label: 'W4' },
      { x: 815, y: 90, label: 'W5' },
      { x: 940, y: 78, label: 'Now' },
    ],
  },
}

function makeSmoothPath(points: ChartPoint[]) {
  return points
    .map((point, index) => {
      if (index === 0) return `M${point.x} ${point.y}`
      const prev = points[index - 1]
      const cx = (prev.x + point.x) / 2
      return `C${cx} ${prev.y}, ${cx} ${point.y}, ${point.x} ${point.y}`
    })
    .join(' ')
}

function makeAreaPath(points: ChartPoint[]) {
  const line = makeSmoothPath(points)
  const first = points[0]
  const last = points[points.length - 1]
  return `${line} L${last.x} 305 L${first.x} 305 Z`
}

function offsetPoints(points: ChartPoint[], yOffset: number) {
  return points.map((point) => ({ ...point, y: Math.min(295, Math.max(45, point.y + yOffset)) }))
}

export default function CSADarkExecutiveDuplicate() {
  const [performanceView, setPerformanceView] = useState<(typeof performanceViews)[number]>('Execution')
  const [performanceRange, setPerformanceRange] = useState<(typeof performanceRanges)[number]>('Live')
  const [enabledLayers, setEnabledLayers] = useState<string[]>(['Today', 'Yesterday', 'SLA Trend'])
  const [deepSyncData, setDeepSyncData] = useState<any>(null)
  const [deepSyncStatus, setDeepSyncStatus] = useState<'loading' | 'live' | 'safe'>('loading')

  useEffect(() => {
    let active = true

    async function loadDeepSync() {
      try {
        const res = await fetch('/api/csa/deep-sync', { cache: 'no-store' })
        const json = await res.json()
        if (!active) return

        if (json?.ok) {
          setDeepSyncData(json)
          setDeepSyncStatus(json.mode === 'deep-live' ? 'live' : 'safe')
        } else {
          setDeepSyncStatus('safe')
        }
      } catch {
        if (active) setDeepSyncStatus('safe')
      }
    }

    loadDeepSync()
    const timer = setInterval(loadDeepSync, 30000)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  const activePerformance = performanceModel[performanceView]

  const livePerformanceMetrics = useMemo(() => {
    const base = activePerformance.metrics.map((metric) => [...metric])

    if (!deepSyncData) return base

    if (performanceView === 'Revenue' && deepSyncData.revenueCommand) {
      return [
        ['Revenue at Risk', deepSyncData.revenueCommand.valueAtRisk || base[0][1], 'live revenue risk'],
        ['Prospects', String(deepSyncData.revenueCommand.prospects ?? base[1][1]), 'deep-sync prospects'],
        ['Follow-ups', String(deepSyncData.revenueCommand.followUps ?? base[2][1]), 'recovery queue'],
        ['AI Score Avg.', `${deepSyncData.revenueCommand.aiScoreAverage ?? 84}/100`, 'opportunity quality'],
      ]
    }

    if (performanceView === 'Leads' && Array.isArray(deepSyncData.leadRecoveryQueue)) {
      return [
        ['Open Leads', String(deepSyncData.rawCounts?.leads ?? base[0][1]), 'live lead table'],
        ['Recovery Queue', String(deepSyncData.leadRecoveryQueue.length), 'prioritized'],
        ['Urgent Leads', String(deepSyncData.leadRecoveryQueue.filter((x: any) => Number(x.score || 0) >= 65).length), 'AI-scored'],
        ['Top Score', `${Math.max(0, ...deepSyncData.leadRecoveryQueue.map((x: any) => Number(x.score || 0)))}/100`, 'best opportunity'],
      ]
    }

    if (performanceView === 'Services' && deepSyncData.servicesActivation) {
      return [
        ['Active Services', String(deepSyncData.servicesActivation.open ?? base[0][1]), 'live service table'],
        ['Ready to Start', String(deepSyncData.servicesActivation.ready ?? base[1][1]), 'launchable'],
        ['Blocked', String(deepSyncData.servicesActivation.blocked ?? base[2][1]), 'needs owner'],
        ['Total Services', String(deepSyncData.servicesActivation.total ?? base[3][1]), 'all records'],
      ]
    }

    if (performanceView === 'SLA' && deepSyncData.rawCounts) {
      return [
        ['Open Escalations', String(deepSyncData.rawCounts.incidents ?? base[0][1]), 'live incidents'],
        ['Tasks Open', String(deepSyncData.rawCounts.tasks ?? base[1][1]), 'execution load'],
        ['Voice Logs', String(deepSyncData.rawCounts.voiceLogs ?? base[2][1]), 'call activity'],
        ['Follow-ups', String(deepSyncData.rawCounts.followups ?? base[3][1]), 'CSA followups'],
      ]
    }

    if (performanceView === 'Execution' && deepSyncData.rawCounts) {
      return [
        ['Execution Load', String((deepSyncData.rawCounts.tasks || 0) + (deepSyncData.rawCounts.followups || 0)), 'tasks + follow-ups'],
        ['Lead Pressure', String(deepSyncData.rawCounts.leads ?? base[1][1]), 'lead records'],
        ['Family Coverage', String(deepSyncData.rawCounts.families ?? base[2][1]), 'family records'],
        ['Incidents', String(deepSyncData.rawCounts.incidents ?? base[3][1]), 'risk records'],
      ]
    }

    return base
  }, [activePerformance, deepSyncData, performanceView])

  const primaryChartPoints = chartProfiles[performanceView]?.[performanceRange] || chartProfiles.Execution.Live
  const yesterdayChartPoints = offsetPoints(primaryChartPoints, 42)
  const slaChartPoints = offsetPoints(primaryChartPoints, performanceView === 'SLA' ? 12 : 72)
  const primaryChartPath = makeSmoothPath(primaryChartPoints)
  const primaryAreaPath = makeAreaPath(primaryChartPoints)
  const yesterdayChartPath = makeSmoothPath(yesterdayChartPoints)
  const slaChartPath = makeSmoothPath(slaChartPoints)

  const toggleLayer = (layer: string) => {
    setEnabledLayers((current) =>
      current.includes(layer)
        ? current.filter((item) => item !== layer)
        : [...current, layer]
    )
  }

  const [liveActivity, setLiveActivity] = useState<LiveActivityItem[]>([])
  const [clockTick, setClockTick] = useState(0)
  const [activityStatus, setActivityStatus] = useState<'loading' | 'live' | 'fallback'>('loading')

  useEffect(() => {
    let active = true

    async function loadActivity() {
      try {
        const res = await fetch('/api/csa/deep-sync', { cache: 'no-store' })
        const json = await res.json()

        if (!active) return

        if (json?.ok && Array.isArray(json.activity)) {
          setLiveActivity(json.activity)
          setActivityStatus(json.mode === 'deep-live' ? 'live' : 'fallback')
        } else {
          setActivityStatus('fallback')
        }
      } catch {
        if (active) setActivityStatus('fallback')
      }
    }

    loadActivity()
    const syncTimer = setInterval(loadActivity, 30000)
    const clockTimer = setInterval(() => setClockTick((value) => value + 1), 15000)

    return () => {
      active = false
      clearInterval(syncTimer)
      clearInterval(clockTimer)
    }
  }, [])

  const visibleActivity = useMemo(() => {
    if (liveActivity.length > 0) {
      return liveActivity.slice(0, 7).map((item) => [
        item.title,
        item.sub || item.title,
        formatRelativeTime(item.time),
        item.icon || iconForHref(item.href),
        item.href,
      ])
    }

    return activity
  }, [liveActivity, clockTick])

  return (
    <div style={page}>
      <aside style={sidebar}>
        <div style={brand}>
          <div style={brandLogo}>🪽</div>
          <div>
            <strong style={brandTitle}>ANGELCARE</strong>
            <p style={brandSub}>CUSTOMER SUCCESS</p>
          </div>
        </div>

        <Section title="Executive Command" items={sidebarMain} />
        <Section title="Operational Hub" items={sidebarOps} />

        <div style={systemBlock}>
          <div style={systemTop}>
            <strong>LIVE SYNC ENGINE</strong>
            <span>×</span>
          </div>
          <b>v3.2.1</b>
          <p>All modules synchronized</p>
          <small>45 seconds ago</small>
          <div style={okDot}>●</div>
        </div>
      </aside>

      <main style={main}>
        <header style={topbar}>
          <div style={statusRow}>
            {['SYSTEM: ONLINE', 'VOICE: CONNECTED', 'OPS: LIVE SYNC', 'DATA: REAL-TIME'].map((x) => (
              <span key={x} style={statusPill}>● {x}</span>
            ))}
          </div>
          <div style={timeBlock}>19:42:18</div>
          <div style={search}>⌕ Search across modules... <kbd>⌘ K</kbd></div>
          <Link href="/profile" style={profile}>CSA Executive · Online</Link>
        </header>

        <section style={heroGrid}>
          <div style={hero}>
            <span style={eyebrow}>CUSTOMER SUCCESS AUTHORITY</span>
            <div style={heroTitleRow}>
              <h1>CSA EXECUTIVE COMMAND CENTER</h1>
              <b>v6.0 PREMIUM</b>
            </div>
            <p>AI-native operational command center for Families, Leads, Services, Revenue Recovery, Voice & Escalations.</p>
            <div style={heroActions}>
              <Link href="/voice-center" style={purpleBtn}>Voice Recovery Room</Link>
              <Link href="/revenue-command-center" style={orangeBtn}>Revenue Risk Center</Link>
              <Link href="/revenue-command-center/control-tower" style={orangeBtn}>Control Tower</Link>
              <Link href="/revenue-command-center/ai-scoring" style={cyanBtn}>AI Scoring</Link>
              <Link href="/api/csa/live-snapshot" style={blueBtn}>Live Snapshot</Link>
              <Link href="/sales" style={cyanBtn}>Sales Pipeline</Link>
              <Link href="/revenue-command-center/tasks" style={cyanBtn}>AI Recommendations</Link>
            </div>
          </div>

          <div style={mission}>
            <div style={missionHead}>
              <strong>MISSION STATUS</strong>
              <span>Boardroom</span>
            </div>
            <h2>Operational Excellence <b>92%</b></h2>
            <div style={progress}><span /></div>
            <div style={missionStats}>
              <Mini label="SLA Compliance" value="96%" color="#22c55e" />
              <Mini label="Escalations Open" value="11" color="#ef4444" />
              <Mini label="Revenue at Risk" value="41.8K MAD" color="#f59e0b" />
              <Mini label="Recoveries Today" value="12.6K MAD" color="#22c55e" />
              <Mini label="Sales Handoffs" value="18" color="#38bdf8" />
            </div>
          </div>

          <div style={aiInsight}>
            <div style={aiHead}><strong>AI COMMAND INSIGHT</strong><span>×</span></div>
            <b>23 actions recommended</b>
            <ul>
              <li>High revenue risk detected in 7 families</li>
              <li>3 escalations require immediate attention</li>
              <li>2 services at risk of disruption</li>
            </ul>
            <Link href="/revenue-command-center/tasks">View AI Command Center</Link>
          </div>
        </section>

        <section style={kpiGrid}>
          {kpis.map(([label, value, detail, trend, icon, color]) => (
            <Link key={label} href={label.includes('Sales') ? '/sales' : label.includes('Lead') ? '/leads' : label.includes('Service') ? '/services' : label.includes('Incident') ? '/incidents' : label.includes('Revenue') || label.includes('Recover') ? '/revenue-command-center' : '/families'} style={kpi}>
              <div style={{ ...kpiIcon, background: `${color}22`, borderColor: `${color}55` }}>{icon}</div>
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
                <p>{detail}</p>
                <em style={{ color }}>{trend}</em>
              </div>
              <div style={spark}><i style={{ background: color }} /></div>
            </Link>
          ))}
        </section>

        <section style={dashboard}>
          <Panel title="RECOVERY OPERATIONS BOARD" sub="Critical recoveries in progress" href="/revenue-command-center" action="Live">
            {recoveryRows.map(([initials, name, note, value, status, color]) => (
              <Link key={name} href="/revenue-command-center" style={recoveryRow}>
                <div style={{ ...avatar, background: color }}>{initials}</div>
                <div style={{ flex: 1 }}>
                  <strong>{name}</strong>
                  <p>{note}</p>
                </div>
                <div style={money}>
                  <b>{value}</b>
                  <span>{status}</span>
                </div>
              </Link>
            ))}
            <Link href="/revenue-command-center" style={wideButton}>View Full Recovery Board →</Link>
          </Panel>

          <Panel title="MODULE SYNCHRONIZATION MATRIX" sub="Real-time module status" href="/reports" action="Real-time">
            <div style={moduleGrid}>
              {moduleCards.map(([name, value, status, icon, href]) => (
                <Link key={name} href={href} style={moduleCard}>
                  <div style={moduleIcon}>{icon}</div>
                  <strong>{name}</strong>
                  <b>{value}</b>
                  <span>✓ {status}</span>
                </Link>
              ))}
            </div>
            <Link href="/reports" style={wideButton}>View All Modules →</Link>
          </Panel>

          <Panel title="LIVE ACTIVITY STREAM" sub={activityStatus === "live" ? "Live deep-sync operational feed" : "Fallback feed · waiting for live events"} href="/reports" action={activityStatus === "live" ? "LIVE" : "SAFE"}>
            {visibleActivity.map(([title, sub, time, icon, href]) => (
              <Link key={title} href={href} style={activityRow}>
                <div style={activityIcon}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <strong>{title}</strong>
                  <p>{sub}</p>
                </div>
                <span>{time}</span>
              </Link>
            ))}
            <Link href="/reports" style={wideButton}>View All Activity →</Link>
          </Panel>

          <div style={rightStack}>
            <Panel title="ESCALATIONS CENTER" sub="11 Open escalations" href="/incidents" action="">
              {[
                ['High Priority', '3', '#ef4444'],
                ['Medium Priority', '5', '#f59e0b'],
                ['Low Priority', '3', '#2dd4bf'],
              ].map(([l, v, c]) => (
                <div key={l} style={escalationRow}>
                  <span style={{ color: c }}>● {l}</span>
                  <b>{v}</b>
                </div>
              ))}
              <Link href="/incidents" style={wideButton}>View Escalations Board →</Link>
            </Panel>

            <Panel title="TODAY'S OBJECTIVES" sub="" href="/revenue-command-center/tasks" action="">
              <div style={objectiveWrap}>
                <div style={ring}>78%</div>
                <div style={objectiveList}>
                  <span>✓ Recovery Calls <b>4/6</b></span>
                  <span>✓ Follow-ups <b>12/15</b></span>
                  <span>✓ Escalations <b>2/4</b></span>
                  <span>✓ Proposals <b>3/5</b></span>
                </div>
              </div>
              <Link href="/revenue-command-center/tasks" style={wideButton}>View All Objectives →</Link>
            </Panel>
          </div>
        </section>


        <section style={revenueCommandLayer}>
          <div style={revenueCommandHeader}>
            <div>
              <span style={revenueEyebrow}>REVENUE COMMAND CENTER SYNC</span>
              <h2>Premium Revenue Access Layer</h2>
              <p>Direct synchronized access to every revenue execution submodule connected to the CSA recovery workflow.</p>
            </div>
            <Link href="/revenue-command-center" style={revenueMasterButton}>Open Main Revenue Center →</Link>
          </div>

          <div style={revenueMetricGrid}>
            {revenueCommandMetrics.map(([label, value, trend, color]) => (
              <Link key={label} href="/revenue-command-center" style={revenueMetricCard}>
                <span>{label}</span>
                <strong>{value}</strong>
                <em style={{ color }}>{trend}</em>
                <div style={revenueMiniBar}><i style={{ background: color }} /></div>
              </Link>
            ))}
          </div>

          <div style={revenueAccessGrid}>
            {revenueCommandRoutes.map(([label, href, detail, badge, color]) => (
              <Link key={label} href={href} style={revenueAccessCard}>
                <div style={revenueAccessTop}>
                  <span style={{ ...revenueAccessIcon, background: `${color}22`, borderColor: `${color}55`, color }}>{label.slice(0, 2).toUpperCase()}</span>
                  <b style={{ color }}>{badge}</b>
                </div>
                <strong>{label}</strong>
                <p>{detail}</p>
                <em>Open synchronized module →</em>
              </Link>
            ))}
          </div>

          <div style={revenueGraphPanel}>
            <div style={revenueGraphHeader}>
              <strong>Revenue Command Performance Graph</strong>
              <span>Control Tower · Prospects · Appointments · Partnerships · B2C · Follow-ups · AI Score</span>
            </div>
            <svg viewBox="0 0 900 210" width="100%" height="210" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueLine" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="45%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
                <linearGradient id="revenueArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(139,92,246,.45)" />
                  <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                </linearGradient>
              </defs>
              {[45, 85, 125, 165].map((y) => (
                <line key={y} x1="35" y1={y} x2="870" y2={y} stroke="rgba(148,163,184,.16)" strokeWidth="1" />
              ))}
              <path d="M40 172 C120 150, 155 120, 235 132 C320 145, 345 78, 430 92 C510 108, 555 55, 640 70 C725 82, 760 38, 865 48 L865 190 L40 190 Z" fill="url(#revenueArea)" />
              <path d="M40 172 C120 150, 155 120, 235 132 C320 145, 345 78, 430 92 C510 108, 555 55, 640 70 C725 82, 760 38, 865 48" fill="none" stroke="url(#revenueLine)" strokeWidth="5" strokeLinecap="round" />
              {[[235,132],[430,92],[640,70],[865,48]].map(([x,y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="#8b5cf6" stroke="#fff" strokeWidth="2" />
              ))}
            </svg>
          </div>
        </section>

        <section style={bottomGrid}>
          <Panel title="AI RECOMMENDATIONS ENGINE" sub="Intelligent actions to drive results" href="/revenue-command-center/tasks" action="">
            <div style={recommendationGrid}>
              {recommendations.map(([title, detail, sub, btn, color, href]) => (
                <Link key={title} href={href} style={{ ...recommendation, borderColor: `${color}55`, background: `${color}11` }}>
                  <strong style={{ color }}>{title}</strong>
                  <p>{detail}</p>
                  <span>{sub}</span>
                  <b style={{ color }}>{btn}</b>
                </Link>
              ))}
            </div>
            <Link href="/revenue-command-center/tasks" style={wideButton}>View AI Command Center →</Link>
          </Panel>

          <Panel title="SMART PERFORMANCE CONSOLE" sub={`${activePerformance.title} · ${performanceRange} · ${deepSyncStatus === 'live' ? 'deep live sync' : 'safe mode'}`} href="/reports" action={deepSyncStatus === 'live' ? 'LIVE SYNC' : 'SAFE'}>
            <div style={smartConsoleHeader}>
              <div>
                <strong>{activePerformance.title}</strong>
                <p>{activePerformance.subtitle}</p>
              </div>
              <div style={smartScore}>
                <span>Focus Score</span>
                <b>{activePerformance.score}</b>
              </div>
            </div>

            <div style={smartControls}>
              <div style={controlGroup}>
                <span>Time range</span>
                <div style={segmentedControl}>
                  {performanceRanges.map((item) => (
                    <button key={item} type="button" onClick={() => setPerformanceRange(item)} style={item === performanceRange ? segmentedActiveButton : segmentedPlainButton}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div style={controlGroup}>
                <span>Performance view</span>
                <div style={segmentedControl}>
                  {performanceViews.map((item) => (
                    <button key={item} type="button" onClick={() => setPerformanceView(item)} style={item === performanceView ? segmentedActiveButton : segmentedPlainButton}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div style={controlGroup}>
                <span>Chart layers</span>
                <div style={layerButtons}>
                  {performanceLayers.map((item) => (
                    <button key={item} type="button" onClick={() => toggleLayer(item)} style={enabledLayers.includes(item) ? layerActive : layerButton}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={smartMetricGrid}>
              {livePerformanceMetrics.map(([label, value, detail]) => (
                <div key={label} style={smartMetricCard}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <em>{detail}</em>
                </div>
              ))}
            </div>

            <div style={smartChartShell}>
              <div style={smartChartTopline}>
                <span>{performanceView} intelligence curve</span>
                <b>{deepSyncData?.loadedAt ? `Updated ${new Date(deepSyncData.loadedAt).toLocaleTimeString()}` : 'Waiting for sync'}</b>
              </div>

              <svg viewBox="0 0 980 330" width="100%" height="100%" preserveAspectRatio="none" style={advancedChartSvg}>
                <defs>
                  <linearGradient id="smartMain" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="45%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <linearGradient id="smartArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(139,92,246,.42)" />
                    <stop offset="100%" stopColor="rgba(14,165,233,0)" />
                  </linearGradient>
                  <filter id="smartGlow">
                    <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {[55, 110, 165, 220, 275].map((y) => (
                  <line key={y} x1="60" y1={y} x2="940" y2={y} stroke="rgba(148,163,184,.18)" strokeWidth="1" />
                ))}

                {enabledLayers.includes('Today') && (
                  <>
                    <path d={primaryAreaPath} fill="url(#smartArea)" />
                    <path d={primaryChartPath} fill="none" stroke="url(#smartMain)" strokeWidth="6" strokeLinecap="round" filter="url(#smartGlow)" />
                  </>
                )}

                {enabledLayers.includes('Yesterday') && (
                  <path d={yesterdayChartPath} fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 14" opacity=".72" />
                )}

                {enabledLayers.includes('SLA Trend') && (
                  <path d={slaChartPath} fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" opacity=".55" />
                )}

                {primaryChartPoints.slice(1).map((point) => (
                  <g key={`${point.x}-${point.y}-${point.label}`}>
                    <circle cx={point.x} cy={point.y} r="9" fill="#8b5cf6" stroke="#fff" strokeWidth="3" filter="url(#smartGlow)" />
                    <text x={point.x} y={Number(point.y) - 18} fill="#cbd5e1" fontSize="13" textAnchor="middle" fontWeight="700">{point.label}</text>
                  </g>
                ))}
              </svg>

              <div style={smartChartFooter}>
                {primaryChartPoints.map((point) => (
                  <span key={point.label}>{point.label}</span>
                ))}
              </div>
            </div>

            <div style={smartInsightBar}>
              <div>
                <strong>AI Reading</strong>
                <p>{activePerformance.insight}</p>
              </div>
              <div style={internalNavigator}>
                <button type="button" onClick={() => setPerformanceView('Revenue')}>Inspect Revenue</button>
                <button type="button" onClick={() => setPerformanceView('Leads')}>Inspect Leads</button>
                <button type="button" onClick={() => setPerformanceView('Services')}>Inspect Services</button>
                <button type="button" onClick={() => setPerformanceView('SLA')}>Inspect SLA</button>
              </div>
            </div>
          </Panel>
        </section>
      </main>
    </div>
  )
}

function Section({ title, items }: { title: string; items: string[][] }) {
  return (
    <section style={section}>
      <h3>{title}</h3>
      {items.map(([label, href, icon, badge]) => (
        <Link key={label} href={href} style={sideLink}>
          <span>{icon}</span>
          <b>{label}</b>
          {badge ? <em>{badge}</em> : null}
        </Link>
      ))}
    </section>
  )
}

function Panel({ title, sub, href, action, children }: { title: string; sub: React.ReactNode; href: string; action: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={panel}>
      <header style={panelHeader}>
        <div>
          <h2>{title}</h2>
          {sub ? <p>{sub}</p> : null}
        </div>
        {action ? <Link href={href}>{action}</Link> : null}
      </header>
      {children}
    </section>
  )
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={mini}>
      <span>{label}</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  )
}

const page: React.CSSProperties = { minHeight: '100vh', display: 'grid', gridTemplateColumns: '286px 1fr', background: '#050b14', color: '#e5eefc', fontFamily: 'Inter, Arial, sans-serif' }
const sidebar: React.CSSProperties = { background: 'linear-gradient(180deg,#07111f,#050b14)', borderRight: '1px solid rgba(148,163,184,.14)', padding: 22, display: 'grid', alignContent: 'start', gap: 22 }
const brand: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0 18px' }
const brandLogo: React.CSSProperties = { width: 56, height: 56, borderRadius: 18, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', boxShadow: '0 0 34px rgba(124,58,237,.45)', fontSize: 28 }
const brandTitle: React.CSSProperties = { display: 'block', fontSize: 18, fontWeight: 1000, letterSpacing: 1 }
const brandSub: React.CSSProperties = { margin: 0, fontSize: 11, color: '#cbd5e1', fontWeight: 900 }
const section: React.CSSProperties = { display: 'grid', gap: 8 }
const sideLink: React.CSSProperties = { display: 'grid', gridTemplateColumns: '26px 1fr auto', alignItems: 'center', gap: 10, minHeight: 42, padding: '0 12px', borderRadius: 12, color: '#dbeafe', textDecoration: 'none', fontWeight: 900, background: 'rgba(255,255,255,.025)' }
const systemBlock: React.CSSProperties = { marginTop: 12, padding: 18, borderRadius: 18, background: 'linear-gradient(180deg,rgba(14,165,233,.14),rgba(14,165,233,.06))', border: '1px solid rgba(14,165,233,.26)', position: 'relative', display: 'grid', gap: 8 }
const systemTop: React.CSSProperties = { display: 'flex', justifyContent: 'space-between' }
const okDot: React.CSSProperties = { position: 'absolute', right: 16, bottom: 16, color: '#22c55e' }
const main: React.CSSProperties = { padding: 18, display: 'grid', gap: 16 }
const topbar: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto 360px auto', gap: 16, alignItems: 'center', height: 44 }
const statusRow: React.CSSProperties = { display: 'flex', gap: 10 }
const statusPill: React.CSSProperties = { padding: '8px 12px', borderRadius: 10, background: 'rgba(34,197,94,.11)', border: '1px solid rgba(34,197,94,.22)', color: '#86efac', fontWeight: 1000, fontSize: 12 }
const timeBlock: React.CSSProperties = { fontSize: 22, fontWeight: 1000, color: '#fff' }
const search: React.CSSProperties = { height: 40, borderRadius: 12, background: '#0d1624', border: '1px solid rgba(148,163,184,.16)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px', color: '#94a3b8' }
const profile: React.CSSProperties = { color: '#fff', textDecoration: 'none', fontWeight: 900 }
const heroGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.7fr 1fr .95fr', gap: 12 }
const hero: React.CSSProperties = { borderRadius: 16, padding: 24, background: 'linear-gradient(135deg,rgba(15,23,42,.98),rgba(2,6,23,.95))', border: '1px solid rgba(124,58,237,.45)', boxShadow: '0 0 60px rgba(124,58,237,.14)' }
const eyebrow: React.CSSProperties = { color: '#c4b5fd', fontSize: 12, fontWeight: 1000, letterSpacing: 1.7 }
const heroTitleRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14 }
const heroActions: React.CSSProperties = { display: 'flex', gap: 12, marginTop: 18 }
const purpleBtn: React.CSSProperties = { padding: '13px 16px', borderRadius: 12, background: '#7c3aed', color: '#fff', textDecoration: 'none', fontWeight: 1000 }
const orangeBtn: React.CSSProperties = { ...purpleBtn, background: 'rgba(249,115,22,.24)', color: '#fdba74' }
const blueBtn: React.CSSProperties = { ...purpleBtn, background: 'rgba(37,99,235,.25)', color: '#93c5fd' }
const cyanBtn: React.CSSProperties = { ...purpleBtn, background: 'rgba(6,182,212,.20)', color: '#67e8f9' }
const mission: React.CSSProperties = { borderRadius: 16, padding: 22, background: 'linear-gradient(180deg,#0b1726,#06111f)', border: '1px solid rgba(14,165,233,.25)' }
const missionHead: React.CSSProperties = { display: 'flex', justifyContent: 'space-between' }
const progress: React.CSSProperties = { height: 9, borderRadius: 999, background: '#1f2937', overflow: 'hidden' }
const missionStats: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 18 }
const mini: React.CSSProperties = { display: 'grid', gap: 4 }
const aiInsight: React.CSSProperties = { borderRadius: 16, padding: 22, background: 'linear-gradient(180deg,#0d1022,#111827)', border: '1px solid rgba(124,58,237,.3)' }
const aiHead: React.CSSProperties = { display: 'flex', justifyContent: 'space-between' }
const kpiGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 12 }
const kpi: React.CSSProperties = { minHeight: 132, borderRadius: 15, padding: 18, display: 'grid', gridTemplateColumns: '56px 1fr', gap: 14, background: 'linear-gradient(180deg,#101827,#0b1320)', border: '1px solid rgba(148,163,184,.14)', color: '#fff', textDecoration: 'none' }
const kpiIcon: React.CSSProperties = { width: 54, height: 54, borderRadius: 16, display: 'grid', placeItems: 'center', border: '1px solid' }
const spark: React.CSSProperties = { gridColumn: '1 / -1', height: 22, opacity: .9 }
const dashboard: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr .9fr', gap: 12, alignItems: 'start' }
const panel: React.CSSProperties = { borderRadius: 15, padding: 18, background: 'linear-gradient(180deg,#0d1726,#09111e)', border: '1px solid rgba(14,165,233,.24)', boxShadow: '0 22px 70px rgba(0,0,0,.24)' }
const panelHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 14 }
const recoveryRow: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,.04)', color: '#fff', textDecoration: 'none', marginBottom: 9 }
const avatar: React.CSSProperties = { width: 42, height: 42, borderRadius: 999, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 1000 }
const money: React.CSSProperties = { textAlign: 'right', display: 'grid', gap: 3, color: '#f87171' }
const wideButton: React.CSSProperties = { marginTop: 12, display: 'block', padding: '13px 14px', borderRadius: 12, background: 'rgba(59,130,246,.10)', border: '1px solid rgba(59,130,246,.18)', color: '#dbeafe', textAlign: 'center', textDecoration: 'none', fontWeight: 900 }
const moduleGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }
const moduleCard: React.CSSProperties = { padding: 13, borderRadius: 12, background: 'rgba(255,255,255,.04)', color: '#fff', textDecoration: 'none', display: 'grid', gap: 5 }
const moduleIcon: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, background: 'rgba(14,165,233,.15)', display: 'grid', placeItems: 'center' }
const activityRow: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,.035)', color: '#fff', textDecoration: 'none', marginBottom: 8 }
const activityIcon: React.CSSProperties = { width: 38, height: 38, borderRadius: 12, background: 'rgba(124,58,237,.22)', display: 'grid', placeItems: 'center' }
const rightStack: React.CSSProperties = { display: 'grid', gap: 12 }
const escalationRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: 13, borderRadius: 12, background: 'rgba(255,255,255,.04)', marginBottom: 8 }
const objectiveWrap: React.CSSProperties = { display: 'grid', gridTemplateColumns: '100px 1fr', gap: 16, alignItems: 'center' }
const ring: React.CSSProperties = { width: 88, height: 88, borderRadius: 999, display: 'grid', placeItems: 'center', border: '8px solid #22c55e', fontWeight: 1000, fontSize: 22 }
const objectiveList: React.CSSProperties = { display: 'grid', gap: 7 }
const bottomGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(420px,.75fr)', gap: 12, alignItems: 'stretch', paddingBottom: 96 }
const recommendationGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }
const recommendation: React.CSSProperties = { padding: 16, borderRadius: 14, border: '1px solid', color: '#fff', textDecoration: 'none', display: 'grid', gap: 8 }
const performanceStats: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: 16 }



const liveChartShell: React.CSSProperties = { position: 'relative', height: 260, marginTop: 18, borderRadius: 18, overflow: 'hidden', background: 'radial-gradient(circle at 30% 20%, rgba(124,58,237,.28), transparent 35%), linear-gradient(180deg,rgba(15,23,42,.96),rgba(8,15,28,.98))', border: '1px solid rgba(148,163,184,.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' }
const liveChartSvg: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' }
const chartAxis: React.CSSProperties = { position: 'absolute', left: 42, right: 28, bottom: 38, display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 11, fontWeight: 800 }
const livePerformanceChartLegend: React.CSSProperties = { position: 'absolute', left: 0, right: 0, bottom: 12, display: 'flex', justifyContent: 'center', gap: 24, color: '#cbd5e1', fontSize: 12, fontWeight: 900 }


const revenueCommandLayer: React.CSSProperties = { borderRadius: 18, padding: 18, background: 'linear-gradient(180deg,#08111f,#0b1628)', border: '1px solid rgba(14,165,233,.28)', boxShadow: '0 26px 80px rgba(0,0,0,.26)', display: 'grid', gap: 14 }
const revenueCommandHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18 }
const revenueEyebrow: React.CSSProperties = { color: '#67e8f9', fontWeight: 1000, letterSpacing: 1.4, fontSize: 12 }
const revenueMasterButton: React.CSSProperties = { padding: '13px 16px', borderRadius: 14, background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', color: '#fff', textDecoration: 'none', fontWeight: 1000, whiteSpace: 'nowrap' }
const revenueMetricGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10 }
const revenueMetricCard: React.CSSProperties = { padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(148,163,184,.14)', color: '#fff', textDecoration: 'none', display: 'grid', gap: 7 }
const revenueMiniBar: React.CSSProperties = { height: 6, borderRadius: 999, background: 'rgba(148,163,184,.16)', overflow: 'hidden' }
const revenueAccessGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }
const revenueAccessCard: React.CSSProperties = { padding: 15, borderRadius: 16, background: 'linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.03))', border: '1px solid rgba(148,163,184,.14)', color: '#fff', textDecoration: 'none', display: 'grid', gap: 8 }
const revenueAccessTop: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const revenueAccessIcon: React.CSSProperties = { width: 42, height: 42, borderRadius: 13, display: 'grid', placeItems: 'center', border: '1px solid', fontWeight: 1000, fontSize: 12 }
const revenueGraphPanel: React.CSSProperties = { borderRadius: 16, padding: 16, background: 'radial-gradient(circle at 35% 10%,rgba(124,58,237,.22),transparent 38%),rgba(2,6,23,.55)', border: '1px solid rgba(148,163,184,.14)' }
const revenueGraphHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', color: '#dbeafe', marginBottom: 8 }


const performanceToolbar: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 16 }
const segmentedControl: React.CSSProperties = { display: 'flex', gap: 8, padding: 5, borderRadius: 14, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(148,163,184,.14)' }
const segmentedButton: React.CSSProperties = { padding: '9px 13px', borderRadius: 10, color: '#94a3b8', textDecoration: 'none', fontWeight: 900 }
const segmentedActive: React.CSSProperties = { ...segmentedButton, background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)', color: '#fff', boxShadow: '0 0 22px rgba(124,58,237,.35)' }
const performanceActions: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const controlButton: React.CSSProperties = { padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(148,163,184,.14)', color: '#dbeafe', textDecoration: 'none', fontWeight: 900 }
const controlPrimary: React.CSSProperties = { ...controlButton, background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', color: '#fff' }
const performanceLayerGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10, marginBottom: 16 }
const performanceLayerCard: React.CSSProperties = { padding: 14, borderRadius: 16, background: 'linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.035))', border: '1px solid rgba(148,163,184,.14)', color: '#fff', textDecoration: 'none', display: 'grid', gap: 7 }
const advancedPerformanceShell: React.CSSProperties = { display: 'grid', gridTemplateColumns: '112px 1fr 220px', gap: 14, minHeight: 360 }
const chartLeftRail: React.CSSProperties = { display: 'grid', alignContent: 'start', gap: 9 }
const railMetric: React.CSSProperties = { padding: '12px 10px', borderRadius: 13, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(148,163,184,.12)', color: '#94a3b8', textDecoration: 'none', fontWeight: 900, textAlign: 'center' }
const railMetricActive: React.CSSProperties = { ...railMetric, color: '#fff', background: 'rgba(124,58,237,.22)', borderColor: 'rgba(124,58,237,.44)' }
const chartStage: React.CSSProperties = { position: 'relative', minHeight: 360, borderRadius: 20, overflow: 'hidden', background: 'radial-gradient(circle at 45% 8%,rgba(124,58,237,.30),transparent 42%), linear-gradient(180deg,rgba(15,23,42,.98),rgba(8,15,28,.98))', border: '1px solid rgba(148,163,184,.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' }
const advancedChartSvg: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' }
const chartOverlayTop: React.CSSProperties = { position: 'absolute', top: 14, left: 18, right: 18, display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: 12, fontWeight: 900 }
const chartAxisAdvanced: React.CSSProperties = { position: 'absolute', left: 58, right: 40, bottom: 46, display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 12, fontWeight: 900 }
const advancedLegend: React.CSSProperties = { position: 'absolute', left: 0, right: 0, bottom: 16, display: 'flex', justifyContent: 'center', gap: 22, color: '#cbd5e1', fontSize: 12, fontWeight: 900 }
const chartInsightPanel: React.CSSProperties = { display: 'grid', gap: 10, alignContent: 'start', padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.045)', border: '1px solid rgba(148,163,184,.14)' }
const chartInsightBox: React.CSSProperties = { marginTop: 6, padding: 13, borderRadius: 16, background: 'rgba(34,197,94,.10)', border: '1px solid rgba(34,197,94,.22)', color: '#bbf7d0' }


const smartConsoleHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 18, marginBottom: 16 }
const smartScore: React.CSSProperties = { minWidth: 140, padding: 14, borderRadius: 16, background: 'rgba(124,58,237,.16)', border: '1px solid rgba(124,58,237,.28)', display: 'grid', gap: 5, textAlign: 'right' }
const smartControls: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'end', marginBottom: 16 }
const controlGroup: React.CSSProperties = { display: 'grid', gap: 8 }
const segmentedPlainButton: React.CSSProperties = { border: 'none', cursor: 'pointer', padding: '10px 13px', borderRadius: 11, background: 'transparent', color: '#94a3b8', fontWeight: 950 }
const segmentedActiveButton: React.CSSProperties = { ...segmentedPlainButton, background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)', color: '#fff', boxShadow: '0 0 22px rgba(124,58,237,.35)' }
const layerButtons: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const layerButton: React.CSSProperties = { border: '1px solid rgba(148,163,184,.14)', cursor: 'pointer', padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.045)', color: '#94a3b8', fontWeight: 900 }
const layerActive: React.CSSProperties = { ...layerButton, color: '#fff', background: 'rgba(34,197,94,.14)', borderColor: 'rgba(34,197,94,.32)' }
const smartMetricGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: 16 }
const smartMetricCard: React.CSSProperties = { padding: 14, borderRadius: 16, background: 'linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.035))', border: '1px solid rgba(148,163,184,.14)', display: 'grid', gap: 7 }
const smartChartShell: React.CSSProperties = { position: 'relative', minHeight: 390, borderRadius: 20, overflow: 'hidden', background: 'radial-gradient(circle at 45% 8%,rgba(124,58,237,.30),transparent 42%), linear-gradient(180deg,rgba(15,23,42,.98),rgba(8,15,28,.98))', border: '1px solid rgba(148,163,184,.18)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)' }
const smartChartTopline: React.CSSProperties = { position: 'absolute', zIndex: 3, top: 14, left: 18, right: 18, display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: 12, fontWeight: 900 }
const smartChartFooter: React.CSSProperties = { position: 'absolute', left: 58, right: 40, bottom: 18, display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 12, fontWeight: 900 }
const smartInsightBar: React.CSSProperties = { marginTop: 14, display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center', padding: 16, borderRadius: 18, background: 'rgba(34,197,94,.10)', border: '1px solid rgba(34,197,94,.20)' }
const internalNavigator: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
