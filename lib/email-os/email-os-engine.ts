import { EMAIL_CONTEXTS, EmailContext, EmailPriority } from './email-os-types'

const urgentWords = ['urgent','incident','plainte','réclamation','annulation','remboursement','retard','absence','critical','escalation']
const billingWords = ['facture','payment','paiement','invoice','reçu','impayé','relance']
const missionWords = ['mission','planning','horaire','remplacement','intervention','shift']
const hrWords = ['document','contrat travail','absence','congé','paie','payroll','staff','caregiver']

export function classifyEmail(input: { subject?: string; body?: string; from?: string }): { context: EmailContext; priority: EmailPriority; confidence: number; reasons: string[] } {
  const text = `${input.subject || ''} ${input.body || ''} ${input.from || ''}`.toLowerCase()
  const reasons: string[] = []
  let context: EmailContext = 'family_support'
  if (billingWords.some(w => text.includes(w))) { context = 'billing'; reasons.push('billing vocabulary detected') }
  if (missionWords.some(w => text.includes(w))) { context = 'mission_operation'; reasons.push('mission/planning vocabulary detected') }
  if (hrWords.some(w => text.includes(w))) { context = 'hr'; reasons.push('HR/caregiver vocabulary detected') }
  if (text.includes('incident') || text.includes('plainte') || text.includes('réclamation')) { context = 'incident'; reasons.push('quality/incident vocabulary detected') }
  if (text.includes('partenaire') || text.includes('partner')) { context = 'partnership'; reasons.push('partnership vocabulary detected') }
  if (text.includes('devis') || text.includes('lead') || text.includes('prospect')) { context = 'sales'; reasons.push('sales/prospect vocabulary detected') }
  let priority: EmailPriority = 'normal'
  const urgent = urgentWords.some(w => text.includes(w))
  if (urgent) { priority = context === 'incident' ? 'critical' : 'urgent'; reasons.push('urgent vocabulary detected') }
  else if (['billing','contract','mission_operation'].includes(context)) priority = 'important'
  return { context: EMAIL_CONTEXTS.includes(context) ? context : 'family_support', priority, confidence: reasons.length ? Math.min(.95, .55 + reasons.length * .14) : .42, reasons }
}

export function renderTemplate(body: string, vars: Record<string, string | number | null | undefined>) {
  return body.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => String(vars[key] ?? ''))
}

export function requiresApproval(context: string, priority: string) {
  return ['incident','contract','partnership','hr'].includes(context) || ['critical'].includes(priority)
}
