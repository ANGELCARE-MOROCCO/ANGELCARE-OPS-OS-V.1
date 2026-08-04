export type ActivationStatus = 'not_run' | 'running' | 'passed' | 'blocked' | 'failed'
export type ActivationCheckStatus = 'passed' | 'warning' | 'blocked'

export interface ActivationCheck {
  id: string
  check_key: string
  group_key: string
  label_fr: string
  status: ActivationCheckStatus
  required: boolean
  measured_value: number | null
  expected_value: number | null
  message: string
  evidence: Record<string, unknown>
}

export interface ActivationRun {
  id: string
  public_reference: string
  status: ActivationStatus
  score: number
  started_at: string
  completed_at: string | null
  summary: Record<string, unknown>
  checks: ActivationCheck[]
}

export interface ActivationReadiness {
  published_items: number
  items_with_media: number
  items_with_category: number
  items_with_price: number
  items_with_availability: number
  active_homepage_sections: number
  active_navigation_items: number
  active_merchandising_placements: number
  active_media_assets: number
  published_categories: number
  active_collections: number
  ready_for_activation: boolean
}

export interface ActivationCommandData {
  readiness: ActivationReadiness
  latestRun: ActivationRun | null
  publicRoutes: Array<{ label: string; href: string; purpose: string }>
  adminRoutes: Array<{ label: string; href: string; purpose: string }>
}
