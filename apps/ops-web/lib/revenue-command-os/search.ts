import { REVENUE_OS_STATUS_DICTIONARY } from './statuses'
import type { RevenueOsFoundationBootstrap, RevenueOsSearchResult } from './types'

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function buildRevenueOsSearchIndex(bootstrap: RevenueOsFoundationBootstrap): RevenueOsSearchResult[] {
  const workspaces: RevenueOsSearchResult[] = bootstrap.workspaces.map((item) => ({
    id: `workspace:${item.key}`,
    type: 'workspace',
    title: item.label,
    subtitle: item.description,
    href: item.href,
    badge: item.status,
    keywords: [item.label, item.description, item.key, item.permission, ...item.contractScope],
  }))

  const objectives: RevenueOsSearchResult[] = bootstrap.objectives.map((item) => ({
    id: `objective:${item.id}`,
    type: 'objective',
    title: item.title,
    subtitle: `${item.businessUnit} · ${item.targetMarket} · ${item.horizon}`,
    href: '/revenue-command-os/revenue-objectives',
    badge: item.status,
    keywords: [item.code, item.title, item.mandate, item.businessUnit, item.targetMarket, item.horizon, item.owner],
  }))

  const audits: RevenueOsSearchResult[] = bootstrap.auditEvents.map((item) => ({
    id: `audit:${item.id}`,
    type: 'audit',
    title: item.summary,
    subtitle: `${item.action} · ${item.actor} · ${item.eventId}`,
    href: '/revenue-command-os/audit',
    badge: item.outcome,
    keywords: [item.summary, item.action, item.actor, item.eventId, item.resourceType, item.resourceId || ''],
  }))

  const featureFlags: RevenueOsSearchResult[] = bootstrap.featureFlags.map((item) => ({
    id: `flag:${item.key}`,
    type: 'feature-flag',
    title: item.label,
    subtitle: item.description,
    href: '/revenue-command-os/settings',
    badge: item.enabled ? 'activé' : 'désactivé',
    keywords: [item.key, item.label, item.description, item.riskClass, item.environment],
  }))

  const statuses: RevenueOsSearchResult[] = REVENUE_OS_STATUS_DICTIONARY.map((item) => ({
    id: `status:${item.domain}:${item.key}`,
    type: 'status',
    title: item.label,
    subtitle: `Dictionnaire ${item.domain} · sévérité ${item.severity}`,
    href: '/revenue-command-os/settings',
    badge: item.key,
    keywords: [item.domain, item.key, item.label],
  }))

  return [...workspaces, ...objectives, ...audits, ...featureFlags, ...statuses]
}

export function searchRevenueOs(index: RevenueOsSearchResult[], query: string, limit = 12) {
  const term = normalize(query)
  if (!term) return index.slice(0, limit)

  return index
    .map((item) => {
      const title = normalize(item.title)
      const subtitle = normalize(item.subtitle)
      const keywords = normalize(item.keywords.join(' '))
      const score = title === term
        ? 100
        : title.startsWith(term)
          ? 70
          : title.includes(term)
            ? 55
            : subtitle.includes(term)
              ? 35
              : keywords.includes(term)
                ? 20
                : 0
      return { item, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'fr'))
    .slice(0, limit)
    .map((entry) => entry.item)
}
