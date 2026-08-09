import crypto from 'node:crypto'
import { HSD_IMPORT_TYPES } from '@/lib/homeservice-design/constants'
import { HsdValidationError } from './validation'

export interface CsvValidationResult {
  headers: string[]
  rows: Array<Record<string, string>>
  issues: Array<{ rowNumber: number; field: string; code: string; message: string; severity: 'error' | 'warning' }>
  checksum: string
  validRows: number
  invalidRows: number
  duplicateRows: number
}

const schemas: Record<string, { required: string[]; unique: string[] }> = {
  service_categories: { required: ['family_code', 'category_code', 'commercial_name', 'operational_name'], unique: ['category_code'] },
  doctrine_rules: { required: ['category_code', 'rule_code', 'rule_type', 'title', 'description'], unique: ['category_code', 'rule_code'] },
  capacity_rules: { required: ['category_code', 'minimum_hours', 'maximum_hours', 'max_beneficiaries_per_agent'], unique: ['category_code'] },
  features: { required: ['category_code', 'feature_code', 'feature_name', 'feature_type'], unique: ['category_code', 'feature_code'] },
  topups: { required: ['category_code', 'item_code', 'item_name', 'pricing_basis'], unique: ['category_code', 'item_code'] },
  upsells: { required: ['category_code', 'item_code', 'item_name', 'pricing_basis'], unique: ['category_code', 'item_code'] },
  activities: { required: ['activity_code', 'activity_name', 'min_minutes', 'max_minutes'], unique: ['activity_code'] },
  competencies: { required: ['competency_code', 'competency_name', 'required_level'], unique: ['competency_code'] },
  risks: { required: ['risk_code', 'risk_name', 'risk_level', 'preventive_control'], unique: ['risk_code'] },
  checklists: { required: ['category_code', 'template_code', 'item_code', 'phase', 'item_label'], unique: ['category_code', 'template_code', 'item_code'] },
  report_fields: { required: ['category_code', 'template_code', 'field_code', 'section', 'label', 'field_type'], unique: ['category_code', 'template_code', 'field_code'] },
  pricing: { required: ['category_code', 'price_code', 'pricing_basis', 'unit_price'], unique: ['category_code', 'price_code'] },
}

function parseLine(line: string) {
  const result: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { field += '"'; index += 1 }
      else quoted = !quoted
    } else if (char === ',' && !quoted) { result.push(field.trim()); field = '' }
    else field += char
  }
  result.push(field.trim())
  return result
}

export function parseCsv(content: string) {
  const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const logicalLines: string[] = []
  let buffer = ''
  let quoted = false
  for (const rawLine of normalized.split('\n')) {
    buffer += (buffer ? '\n' : '') + rawLine
    const quotes = (rawLine.match(/"/g) || []).length
    if (quotes % 2 === 1) quoted = !quoted
    if (!quoted) { if (buffer.trim()) logicalLines.push(buffer); buffer = '' }
  }
  if (buffer.trim()) logicalLines.push(buffer)
  if (!logicalLines.length) throw new HsdValidationError('Le fichier CSV est vide.')
  const headers = parseLine(logicalLines[0]).map((header) => header.trim().toLowerCase())
  if (new Set(headers).size !== headers.length) throw new HsdValidationError('Le fichier contient des en-têtes dupliqués.')
  const rows = logicalLines.slice(1).map((line) => {
    const values = parseLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
  })
  return { headers, rows }
}

export function validateCsv(importType: string, content: string): CsvValidationResult {
  if (!(HSD_IMPORT_TYPES as readonly string[]).includes(importType)) throw new HsdValidationError('Type d’import non reconnu.')
  const schema = schemas[importType]
  const { headers, rows } = parseCsv(content)
  const issues: CsvValidationResult['issues'] = []
  for (const required of schema.required) {
    if (!headers.includes(required)) issues.push({ rowNumber: 1, field: required, code: 'MISSING_HEADER', message: `Colonne obligatoire absente: ${required}`, severity: 'error' })
  }
  const keys = new Map<string, number>()
  rows.forEach((row, index) => {
    const rowNumber = index + 2
    for (const required of schema.required) {
      if (!String(row[required] || '').trim()) issues.push({ rowNumber, field: required, code: 'MISSING_VALUE', message: `Valeur obligatoire absente dans ${required}.`, severity: 'error' })
    }
    const key = schema.unique.map((field) => String(row[field] || '').trim().toUpperCase()).join('::')
    if (key && keys.has(key)) issues.push({ rowNumber, field: schema.unique.join(','), code: 'DUPLICATE_ROW', message: `Doublon du rang ${keys.get(key)} pour la clé ${key}.`, severity: 'warning' })
    else if (key) keys.set(key, rowNumber)
  })
  const invalidRowNumbers = new Set(issues.filter((issue) => issue.severity === 'error' && issue.rowNumber > 1).map((issue) => issue.rowNumber))
  const duplicateRows = new Set(issues.filter((issue) => issue.code === 'DUPLICATE_ROW').map((issue) => issue.rowNumber)).size
  return {
    headers,
    rows,
    issues,
    checksum: crypto.createHash('sha256').update(content).digest('hex'),
    validRows: rows.length - invalidRowNumbers.size,
    invalidRows: invalidRowNumbers.size,
    duplicateRows,
  }
}
