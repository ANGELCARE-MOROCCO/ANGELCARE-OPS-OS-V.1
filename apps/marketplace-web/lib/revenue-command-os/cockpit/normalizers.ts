export const rowPayload = <T extends Record<string, unknown> = Record<string, unknown>>(row: any): T => ((row?.payload && typeof row.payload === 'object' ? row.payload : row || {}) as T)

export const text = (value: unknown, fallback = ''): string => typeof value === 'string' && value.trim() ? value.trim() : fallback
export const numberValue = (value: unknown, fallback = 0): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
export const booleanValue = (value: unknown, fallback = false): boolean => typeof value === 'boolean' ? value : fallback
export const stringArray = (value: unknown): string[] => Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : typeof value === 'string' && value.trim() ? [value.trim()] : []
export const objectArray = (value: unknown): Array<Record<string, unknown>> => Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) : []
export const recordValue = (value: unknown): Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
export const isoDate = (value: unknown): string | undefined => {
  if (!value) return undefined
  const date = new Date(String(value))
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined
}
export const clampPercent = (value: unknown): number => Math.max(0, Math.min(100, Math.round(numberValue(value))))
export const ratioPercent = (numerator: number, denominator: number): number => denominator > 0 ? Math.max(0, Math.min(999, Math.round((numerator / denominator) * 100))) : 0
export const latestByDate = <T>(rows: T[], getter: (row: T) => unknown): T | undefined => [...rows].sort((a, b) => new Date(String(getter(b) || 0)).getTime() - new Date(String(getter(a) || 0)).getTime())[0]
export const countBy = <T>(rows: T[], predicate: (row: T) => boolean): number => rows.reduce((total, row) => total + (predicate(row) ? 1 : 0), 0)
export const unique = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)))
export const money = (value: unknown): number => Math.round(numberValue(value) * 100) / 100
export const firstPresent = (...values: unknown[]): unknown => values.find((value) => value !== undefined && value !== null && value !== '')
