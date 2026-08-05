export type SchoolAdminTone = 'neutral' | 'info' | 'success' | 'warning' | 'critical' | 'approval'

export type SchoolAdminBreadcrumbItem = {
  key: string
  label: string
  onSelect?: () => void
}

export type SchoolAdminAttentionItem = {
  key: string
  label: string
  detail?: string | null
  tone?: SchoolAdminTone
  actionLabel?: string | null
  onAction?: (() => void) | null
}

export type SchoolAdminNextActionConfig = {
  title: string
  detail: string
  label: string
  onAction: () => void
  disabled?: boolean
  disabledReason?: string | null
  tone?: SchoolAdminTone
}
