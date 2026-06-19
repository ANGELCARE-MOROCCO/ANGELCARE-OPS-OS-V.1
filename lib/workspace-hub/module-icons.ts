export type WorkspaceIconKey =
  | 'shield'
  | 'users'
  | 'map'
  | 'receipt'
  | 'mail'
  | 'graduation'
  | 'handshake'
  | 'chart'
  | 'banknote'
  | 'command'
  | 'briefcase'
  | 'grid'

export function getWorkspaceIconKey(moduleKey: string): WorkspaceIconKey {
  const key = String(moduleKey || '').toLowerCase()

  if (key.includes('ceo') || key.includes('system-control')) return 'shield'
  if (key.includes('user')) return 'users'
  if (key.includes('carelink')) return 'map'
  if (key.includes('pacojaco')) return 'receipt'
  if (key.includes('email')) return 'mail'
  if (key.includes('academy')) return 'graduation'
  if (key.includes('b2b') || key.includes('partner')) return 'handshake'
  if (key.includes('sales')) return 'chart'
  if (key.includes('revenue') || key.includes('finance') || key.includes('capital')) return 'banknote'
  if (key.includes('command')) return 'command'
  if (key.includes('hr')) return 'briefcase'

  return 'grid'
}

export function formatModuleLabel(value: string) {
  return String(value || '')
    .replace(/^\/+/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
