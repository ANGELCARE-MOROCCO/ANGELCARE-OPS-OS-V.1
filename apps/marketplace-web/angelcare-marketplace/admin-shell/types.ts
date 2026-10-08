export type AdminShellIndicatorTone = 'neutral' | 'positive' | 'attention' | 'critical'
export type AdminShellIndicatorCategory = 'commercial' | 'control'

export type AdminShellIndicator = {
  key: string
  label: string
  value: string
  hint: string
  href: string
  category: AdminShellIndicatorCategory
  tone: AdminShellIndicatorTone
}

export type AdminShellNotificationSeverity = 'info' | 'attention' | 'critical' | 'positive'

export type AdminShellNotification = {
  id: string
  kind: 'order' | 'customer' | 'inquiry' | 'sanila' | 'approval' | 'blocker'
  title: string
  detail: string
  href: string
  createdAt: string
  severity: AdminShellNotificationSeverity
}

export type AdminShellSnapshot = {
  generatedAt: string
  indicators: AdminShellIndicator[]
  notifications: AdminShellNotification[]
  notificationCount: number
}

export type AdminShellWorkspace = {
  href: string
  domain: string
  label: string
  dynamic: boolean
}
