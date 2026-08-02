import { SERVICE_DOCUMENT_SECTION_LABELS } from './templateRegistry'
import type { ServiceDocumentSectionKey, ServiceDocumentSource, ServiceDocumentSettings } from './types'

export interface PreviewBlock { key: ServiceDocumentSectionKey; title: string; height: number }
export interface PreviewPage { index: number; blocks: PreviewBlock[] }

const listHeight = (count: number, density: ServiceDocumentSettings['density']) => {
  const row = density === 'compact' ? 16 : density === 'detailed' ? 27 : 21
  return Math.max(42, Math.min(260, 34 + count * row))
}

function sectionHeight(key: ServiceDocumentSectionKey, source: ServiceDocumentSource, settings: ServiceDocumentSettings) {
  switch (key) {
    case 'executive_summary': return source.executiveSummary ? 110 : 72
    case 'identity': return 132
    case 'customer_beneficiary': return 116
    case 'objectives_outcomes': return listHeight(source.objectives.length + source.outcomes.length + source.painPoints.length, settings.density)
    case 'timeline': return Math.max(150, source.days.reduce((sum, day) => sum + 48 + day.blocks.length * (settings.density === 'compact' ? 24 : 34), 0))
    case 'multi_day_progression': return listHeight(source.days.length, settings.density)
    case 'activities_materials': return listHeight(source.activities.length + source.materials.length, settings.density)
    case 'staffing_competencies': return listHeight(source.staffing.length + source.competencies.length, settings.density)
    case 'safety_risks': return listHeight(source.safeguards.length + source.risks.length, settings.density)
    case 'checklists_reporting': return listHeight(source.checklists.length + source.reporting.length, settings.density)
    case 'route_transport': return listHeight(source.routes.length, settings.density)
    case 'commercial_package': return 150
    case 'pricing_economics': return listHeight(source.priceLines.length + 4, settings.density)
    case 'deployment_sites': return listHeight(source.sites.length + 1, settings.density)
    case 'quality_readiness': return listHeight(source.metrics.length + source.warnings.length, settings.density)
    case 'lineage_approvals': return listHeight(source.lineage.length + source.approvals.length + 1, settings.density)
    case 'notes_annexes': return listHeight(source.notes.length, settings.density)
  }
}

export function paginateServiceDocument(source: ServiceDocumentSource, settings: ServiceDocumentSettings): PreviewPage[] {
  const maxHeight = settings.orientation === 'landscape' ? 610 : 900
  const usable = maxHeight - 130
  const active = settings.sectionOrder.filter((key) => !settings.hiddenSections.includes(key))
  const blocks = active.map((key) => ({ key, title: SERVICE_DOCUMENT_SECTION_LABELS[key], height: sectionHeight(key, source, settings) }))
  const pages: PreviewPage[] = []
  let current: PreviewPage = { index: 0, blocks: [] }
  let used = 0
  blocks.forEach((block) => {
    if (block.key === 'timeline' && block.height > usable) {
      if (current.blocks.length) { pages.push(current); current = { index: pages.length, blocks: [] }; used = 0 }
      const chunks = Math.max(1, Math.ceil(block.height / usable))
      for (let index = 0; index < chunks; index += 1) pages.push({ index: pages.length, blocks: [{ ...block, title: `${block.title}${chunks > 1 ? ` · ${index + 1}/${chunks}` : ''}`, height: Math.min(usable, block.height / chunks) }] })
      current = { index: pages.length, blocks: [] }
      return
    }
    if (used + block.height > usable && current.blocks.length) {
      pages.push(current)
      current = { index: pages.length, blocks: [] }
      used = 0
    }
    current.blocks.push(block)
    used += block.height + 12
  })
  if (current.blocks.length || !pages.length) pages.push(current)
  return pages.map((page, index) => ({ ...page, index }))
}
