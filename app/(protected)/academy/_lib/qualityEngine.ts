export type QualityScore = {
  label: string
  score: number
  risk: 'low' | 'medium' | 'high'
  recommendation: string
}

export function calculateAttendanceQuality(logs: any[] = []): QualityScore {
  if (!logs.length) {
    return { label: 'No data', score: 0, risk: 'high', recommendation: 'Start attendance tracking immediately.' }
  }
  const present = logs.filter((l) => l.status === 'present').length
  const late = logs.filter((l) => l.status === 'late').length
  const absent = logs.filter((l) => l.status === 'absent').length
  const score = Math.max(0, Math.round((present / logs.length) * 100 - late * 4 - absent * 12))
  return {
    label: score >= 85 ? 'Strong delivery discipline' : score >= 65 ? 'Monitor closely' : 'Critical retention risk',
    score,
    risk: score >= 85 ? 'low' : score >= 65 ? 'medium' : 'high',
    recommendation: score >= 85 ? 'Maintain current rhythm.' : score >= 65 ? 'Call trainee and trainer to prevent deterioration.' : 'Escalate to Academy manager today.',
  }
}

export function calculateTrainerLoad(groups: any[] = []) {
  const byTrainer = groups.reduce<Record<string, number>>((acc, group) => {
    const key = group.trainer_id || 'unassigned'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  return Object.entries(byTrainer).map(([trainerId, count]) => ({
    trainerId,
    groupCount: count,
    risk: count >= 5 ? 'overloaded' : count >= 3 ? 'watch' : 'normal',
  }))
}
