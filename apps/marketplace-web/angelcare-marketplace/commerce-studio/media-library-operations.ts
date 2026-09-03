export const MEDIA_MAX_BYTES = 40 * 1024 * 1024
export const MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm,application/pdf'
export const MEDIA_ALLOWED_MIME = new Set(MEDIA_ACCEPT.split(','))
export type MediaRole = 'primary' | 'gallery'
export type DuplicatePolicy = 'USE_EXISTING' | 'REPLACE_EXISTING' | 'UPLOAD_ANYWAY'
export type QueueState = 'PENDING' | 'READY' | 'UPLOADING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'

export type MediaManifestRow = {
  fileName: string
  productReference: string
  role: MediaRole
  altTextFr: string
  folderSlug: string
}

export function detectProductReference(fileName: string): string {
  return fileName.toUpperCase().match(/(?:^|[^A-Z0-9])([A-Z]{2,8}-[A-Z]{2,8}-\d{2,6})(?=$|[^A-Z0-9])/)?.[1] || ''
}

function csvCells(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"' && line[index + 1] === '"' && quoted) { cell += '"'; index += 1 }
    else if (character === '"') quoted = !quoted
    else if (character === ',' && !quoted) { cells.push(cell.trim()); cell = '' }
    else cell += character
  }
  cells.push(cell.trim())
  return cells
}

export function parseMediaManifest(source: string): { rows: MediaManifestRow[]; errors: string[] } {
  const lines = source.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim())
  if (!lines.length) return { rows: [], errors: ['Le manifeste est vide.'] }
  const headers = csvCells(lines[0]).map(value => value.toLowerCase())
  const required = ['file_name', 'product_reference', 'role', 'alt_text_fr', 'folder_slug']
  const missing = required.filter(header => !headers.includes(header))
  if (missing.length) return { rows: [], errors: [`Colonnes manquantes: ${missing.join(', ')}.`] }
  const rows: MediaManifestRow[] = []
  const errors: string[] = []
  for (let index = 1; index < lines.length; index += 1) {
    const values = csvCells(lines[index])
    const value = (key: string) => values[headers.indexOf(key)]?.trim() || ''
    const fileName = value('file_name')
    const role = value('role').toLowerCase()
    if (!fileName) { errors.push(`Ligne ${index + 1}: file_name requis.`); continue }
    if (role && role !== 'primary' && role !== 'gallery') { errors.push(`Ligne ${index + 1}: role invalide.`); continue }
    rows.push({ fileName, productReference: value('product_reference'), role: role === 'primary' ? 'primary' : 'gallery', altTextFr: value('alt_text_fr'), folderSlug: value('folder_slug') })
  }
  return { rows, errors }
}

export function matchManifestFiles(fileNames: string[], rows: MediaManifestRow[]) {
  const byName = new Map(rows.map(row => [row.fileName.toLowerCase(), row]))
  const matches = fileNames.map(fileName => ({ fileName, row: byName.get(fileName.toLowerCase()) || null }))
  const selected = new Set(fileNames.map(value => value.toLowerCase()))
  return { matches, unmatchedFiles: matches.filter(match => !match.row).map(match => match.fileName), unmatchedRows: rows.filter(row => !selected.has(row.fileName.toLowerCase())) }
}

export async function sha256File(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('')
}

export async function runBounded<T>(items: readonly T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
  const pending = [...items]
  const count = Math.max(1, Math.min(6, Math.floor(concurrency)))
  await Promise.all(Array.from({ length: Math.min(count, pending.length) }, async () => {
    while (pending.length) {
      const item = pending.shift()
      if (item !== undefined) await worker(item)
    }
  }))
}

export function csvEscape(value: unknown): string {
  const text = String(value ?? '')
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
