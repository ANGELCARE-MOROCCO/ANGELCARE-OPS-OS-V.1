export type B2BTemplateRecord = {
  id: string
  name: string
  category: string
  channel: string
  prospect_segment: string
  objective?: string | null
  subject?: string | null
  body: string
  short_body?: string | null
  cta?: string | null
  recommended_next_step?: string | null
  variables?: string[] | null
  tags?: string[] | null
  usage_notes?: string | null
  is_active?: boolean
  is_default?: boolean
}

export type B2BTemplateContext = Record<string, string | number | null | undefined>

export function renderB2BTemplateText(text: string | null | undefined, context: B2BTemplateContext) {
  if (!text) return ''
  return text.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => {
    const value = context[key]
    return value === null || value === undefined || value === '' ? `{{${key}}}` : String(value)
  })
}

export function normalizeTemplateArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item)).filter(Boolean)
}

export function inferProspectSegment(prospect: any) {
  const sector = String(prospect?.sector || '').toLowerCase()
  if (['hotel', 'resort', 'family hotel', 'boutique hotel', 'event venue'].includes(sector)) return 'Hotels & Resorts'
  if (sector.includes('pediatric') || sector.includes('clinic')) return 'Cliniques pédiatriques'
  if (sector.includes('pediatrician')) return 'Pédiatres'
  if (sector.includes('orthophonist')) return 'Orthophonistes'
  if (sector.includes('psychomotor')) return 'Psychomotriciens'
  if (sector.includes('school')) return 'Écoles maternelles'
  if (sector.includes('nursery')) return 'Crèches privées'
  return 'General'
}

export function buildTemplateContext(params: { prospect?: any; contact?: any; actor?: any; extra?: B2BTemplateContext }) {
  const prospect = params.prospect || {}
  const contact = params.contact || {}
  const actor = params.actor || {}
  return {
    prospect_name: prospect.name || prospect.prospect_name || '',
    company_name: prospect.name || '',
    city: prospect.city || '',
    sector: prospect.sector || '',
    decision_maker_name: contact.name || prospect.decision_maker_name || prospect.main_contact_name || 'Madame, Monsieur',
    decision_maker_role: contact.role || prospect.decision_maker_role || prospect.main_contact_role || '',
    assigned_owner: actor.full_name || actor.email || 'ANGELCARE',
    program_name: params.extra?.program_name || '',
    meeting_date: params.extra?.meeting_date || '',
    next_step: params.extra?.next_step || prospect.next_action || '',
    pain_points: params.extra?.pain_points || prospect.pain_points || '',
    opportunity_description: params.extra?.opportunity_description || prospect.opportunity_description || '',
    ...params.extra,
  }
}
