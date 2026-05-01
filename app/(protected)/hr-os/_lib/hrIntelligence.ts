export type HrEntity = {
  id?: string
  status?: string | null
  priority?: string | null
  module?: string | null
  title?: string | null
  notes?: string | null
  owner?: string | null
  created_at?: string | null
}

export function getHrRiskLevel(item: HrEntity) {
  const text = `${item.title || ''} ${item.notes || ''}`.toLowerCase()
  if (item.priority === 'high') return 'critical'
  if (text.includes('block') || text.includes('missing') || text.includes('urgent') || text.includes('incident')) return 'high'
  if (item.status === 'open') return 'medium'
  return 'stable'
}

export function getNextBestAction(item: HrEntity) {
  const text = `${item.title || ''} ${item.notes || ''}`.toLowerCase()
  if (text.includes('document') || text.includes('compliance') || text.includes('missing')) return 'Request missing document and block deployment until validated'
  if (text.includes('candidate') || text.includes('recruit')) return 'Assign recruiter and schedule qualification call'
  if (text.includes('academy') || text.includes('training')) return 'Route profile to Academy and monitor certification readiness'
  if (text.includes('mission') || text.includes('allocation')) return 'Confirm availability and match against urgent mission need'
  if (text.includes('incident')) return 'Assign investigator, document decision and close with corrective action'
  return 'Assign owner, define deadline and update action status'
}

export function getReadinessScore(item: HrEntity) {
  let score = 70
  if (item.priority === 'high') score -= 25
  if (!item.owner) score -= 15
  if (item.status === 'closed') score += 20
  if ((item.notes || '').length > 20) score += 10
  return Math.max(0, Math.min(100, score))
}

export function getHrCommandSignals(actions: HrEntity[]) {
  const open = actions.filter(a => a.status !== 'closed')
  const critical = open.filter(a => getHrRiskLevel(a) === 'critical' || getHrRiskLevel(a) === 'high')
  const unowned = open.filter(a => !a.owner)
  const academy = open.filter(a => `${a.module} ${a.title} ${a.notes}`.toLowerCase().includes('academy'))
  const compliance = open.filter(a => `${a.module} ${a.title} ${a.notes}`.toLowerCase().includes('compliance') || `${a.title} ${a.notes}`.toLowerCase().includes('document'))

  return [
    { label: 'Open HR Actions', value: open.length, tone: '#2563eb', insight: 'Current active execution workload' },
    { label: 'Critical Signals', value: critical.length, tone: '#ef4444', insight: 'Requires management intervention' },
    { label: 'Unowned Actions', value: unowned.length, tone: '#f59e0b', insight: 'Needs immediate owner assignment' },
    { label: 'Academy Linked', value: academy.length, tone: '#7c3aed', insight: 'Training / certification dependencies' },
    { label: 'Compliance Exposure', value: compliance.length, tone: '#dc2626', insight: 'Documentation or validation risk' },
  ]
}

export function generateSystemRecommendations(actions: HrEntity[]) {
  const recommendations = []
  const signals = getHrCommandSignals(actions)
  const critical = signals.find(s => s.label === 'Critical Signals')?.value || 0
  const unowned = signals.find(s => s.label === 'Unowned Actions')?.value || 0
  const compliance = signals.find(s => s.label === 'Compliance Exposure')?.value || 0

  if (critical > 0) recommendations.push('Open critical HR actions and assign a responsible owner before end of shift.')
  if (unowned > 0) recommendations.push('Assign ownership to all unowned HR actions to remove execution ambiguity.')
  if (compliance > 0) recommendations.push('Run compliance gate review and block deployment for incomplete files.')
  if (!recommendations.length) recommendations.push('HR execution layer stable. Maintain monitoring and prepare next recruitment sprint.')

  return recommendations
}
