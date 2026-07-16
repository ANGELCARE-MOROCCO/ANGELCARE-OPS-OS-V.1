export type BackendHealth = {
  state: 'unknown' | 'online' | 'offline'
  label: string
  statusCode?: number
  data?: unknown
}
