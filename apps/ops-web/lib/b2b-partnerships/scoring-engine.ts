type ProspectLike = Record<string, any>
type RuleLike = { field_key: string; operator: string; field_value?: string | null; score_delta: number }

export function scoreProspect(prospect: ProspectLike, rules: RuleLike[]) {
  let score = 0
  const matched: string[] = []
  for (const rule of rules) {
    const value = prospect[rule.field_key]
    let hit = false
    if (rule.operator === 'equals') hit = String(value ?? '') === String(rule.field_value ?? '')
    if (rule.operator === 'in') hit = String(rule.field_value ?? '').split(',').map((v) => v.trim()).includes(String(value ?? ''))
    if (rule.operator === 'not_empty') hit = Boolean(String(value ?? '').trim())
    if (rule.operator === 'gte') hit = Number(value ?? 0) >= Number(rule.field_value ?? 0)
    if (rule.operator === 'past') hit = value ? new Date(value).getTime() < Date.now() : false
    if (hit) {
      score += Number(rule.score_delta || 0)
      matched.push(`${rule.field_key}:${rule.operator}`)
    }
  }
  return { score: Math.max(0, Math.min(100, score)), matched }
}
