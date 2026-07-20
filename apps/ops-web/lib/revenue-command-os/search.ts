import { REVENUE_OS_STATUS_DICTIONARY } from './statuses'
import type { RevenueKnowledgeBootstrap, RevenueOsFoundationBootstrap, RevenueOsSearchResult, RevenueSignalBootstrap } from './types'

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


export function buildRevenueKnowledgeSearchIndex(bootstrap: RevenueKnowledgeBootstrap): RevenueOsSearchResult[] {
  const doctrines: RevenueOsSearchResult[] = bootstrap.doctrines.map((item) => ({
    id: `doctrine:${item.id}`,
    type: 'doctrine',
    title: item.title,
    subtitle: `${item.knowledgeType} · ${item.department} · v${item.version}`,
    href: '/revenue-command-os/memory-learning/doctrine-library',
    badge: item.status,
    keywords: [item.code, item.title, item.summary, item.ownerRole, item.department, item.sourceAuthority, ...item.businessUnitCodes, ...item.tags, ...item.applicableCommandFamilies],
  }))

  const assets: RevenueOsSearchResult[] = bootstrap.assets.map((item) => ({
    id: `knowledge-asset:${item.id}`,
    type: 'knowledge-asset',
    title: item.title,
    subtitle: `${item.assetType} · ${item.language} · v${item.version}`,
    href: '/revenue-command-os/memory-learning/knowledge-assets',
    badge: item.indexStatus,
    keywords: [item.code, item.title, item.description, item.ownerRole, item.fileName || '', ...item.businessUnitCodes, ...item.tags, ...item.linkedDoctrineCodes],
  }))

  const playbooks: RevenueOsSearchResult[] = bootstrap.playbooks.map((item) => ({
    id: `playbook:${item.id}`,
    type: 'playbook',
    title: item.name,
    subtitle: `${item.objective} · ${item.steps.length} étapes`,
    href: '/revenue-command-os/memory-learning/playbooks-sops',
    badge: item.status,
    keywords: [item.code, item.name, item.objective, item.trigger, item.ownerRole, ...item.businessUnitCodes, ...item.segmentCodes, ...item.preconditions],
  }))

  const conflicts: RevenueOsSearchResult[] = bootstrap.conflicts.map((item) => ({
    id: `knowledge-conflict:${item.id}`,
    type: 'knowledge-conflict',
    title: item.summary,
    subtitle: `${item.conflictType} · ${item.risk}`,
    href: '/revenue-command-os/memory-learning/conflict-resolver',
    badge: item.status,
    keywords: [item.code, item.summary, item.risk, item.recommendedResolution, item.conflictType, item.resolution || '', item.leftResourceCode, item.rightResourceCode],
  }))

  return [...doctrines, ...assets, ...playbooks, ...conflicts]
}


export function buildRevenueSignalSearchIndex(bootstrap: RevenueSignalBootstrap): RevenueOsSearchResult[] {
  const signals: RevenueOsSearchResult[] = bootstrap.signals.map((item) => ({
    id: `revenue-signal:${item.id}`,
    type: 'revenue-signal',
    title: item.title,
    subtitle: `${item.category} · ${item.sourceCode} · priorité ${item.priorityScore}`,
    href: '/revenue-command-os/signals/live-stream',
    badge: item.severity,
    keywords: [item.code, item.title, item.summary, item.category, item.signalType, item.sourceCode, item.businessUnitCode || '', item.marketCode || '', item.offerCode || '', item.segmentCode || '', ...item.recommendedCommandFamilies],
  }))
  const sources: RevenueOsSearchResult[] = bootstrap.sources.map((item) => ({
    id: `signal-source:${item.id}`,
    type: 'signal-source',
    title: item.name,
    subtitle: `${item.sourceKind} · ${item.adapterKey} · ${item.status}`,
    href: '/revenue-command-os/signals/source-control',
    badge: item.status,
    keywords: [item.code, item.name, item.description, item.sourceKind, item.adapterKey, ...item.businessUnitCodes, ...item.sourceTables, ...item.supportedEventTypes],
  }))
  const contexts: RevenueOsSearchResult[] = bootstrap.contextSnapshots.map((item) => ({
    id: `context-snapshot:${item.id}`,
    type: 'context-snapshot',
    title: item.code,
    subtitle: `${item.signalCode} · ${item.visibilityProfile} · ${item.status}`,
    href: '/revenue-command-os/signals/context-snapshots',
    badge: item.status,
    keywords: [item.code, item.signalCode, item.purpose, item.audienceRole, item.visibilityProfile, ...item.constraints, ...item.opportunities, ...item.risks],
  }))
  return [...signals, ...sources, ...contexts]
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
