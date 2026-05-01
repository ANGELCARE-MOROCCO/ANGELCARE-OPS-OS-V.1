export type WorkforceForecast = {
  id?: string
  city?: string | null
  required: number
  current: number
  priority?: string | null
}

export function rankCitiesByGap(data: WorkforceForecast[]): WorkforceForecast[] {
  return [...data].sort((a, b) => {
    const gapB = Number(b.required || 0) - Number(b.current || 0)
    const gapA = Number(a.required || 0) - Number(a.current || 0)
    return gapB - gapA
  })
}

export function getWorkforceGap(item: WorkforceForecast): number {
  return Number(item.required || 0) - Number(item.current || 0)
}

export function getGapSeverity(item: WorkforceForecast): 'critical' | 'high' | 'medium' | 'controlled' {
  const gap = getWorkforceGap(item)

  if (gap >= 15) return 'critical'
  if (gap >= 8) return 'high'
  if (gap >= 3) return 'medium'
  return 'controlled'
}

export function getWarRoomRecommendation(item: WorkforceForecast): string {
  const severity = getGapSeverity(item)

  if (severity === 'critical') {
    return 'Launch immediate recruitment sprint and activate Academy acceleration.'
  }

  if (severity === 'high') {
    return 'Open targeted hiring wave and prepare backup deployable profiles.'
  }

  if (severity === 'medium') {
    return 'Monitor pipeline and prepare reserve candidates.'
  }

  return 'Coverage is controlled. Maintain monitoring.'
}
