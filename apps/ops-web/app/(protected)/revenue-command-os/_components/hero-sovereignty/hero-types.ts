import type { LucideIcon } from 'lucide-react'

export type HeroTruthState = 'LIVE' | 'SHADOW' | 'PREVIEW' | 'DEGRADED' | 'EMPTY' | 'LOCKED' | 'OFFLINE' | 'INITIALIZING'
export type HeroTone = 'navy' | 'blue' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate'

export type HeroMetric = {
  label: string
  value: string | number
  note?: string
  tone?: HeroTone
}

export type HeroAction = {
  label: string
  href?: string
  onClick?: () => void
  disabled?: boolean
  reason?: string
  kind?: 'primary' | 'secondary' | 'danger'
  icon?: LucideIcon
}

export type SovereignHeroProps = {
  state: HeroTruthState
  posture: string
  authority: string
  summary: string
  metrics?: HeroMetric[]
  actions?: HeroAction[]
  freshness?: string
  warning?: string
  className?: string
}
