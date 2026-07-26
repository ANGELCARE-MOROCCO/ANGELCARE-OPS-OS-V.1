import { commandImportRowSchema } from './schemas'
import type { MarketingAiCommand } from './types'

export const MARKETING_AI_COMMAND_CSV_HEADERS = [
  'code', 'name', 'skill_code', 'category', 'objective', 'instruction', 'default_frequency', 'authority_mode', 'risk_level', 'requires_human_review', 'status', 'tags',
] as const

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    const next = csv[index + 1]
    if (char === '"' && quoted && next === '"') { field += '"'; index += 1; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (char === ',' && !quoted) { row.push(field); field = ''; continue }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(field); field = ''
      if (row.some((value) => value.trim() !== '')) rows.push(row)
      row = []
      continue
    }
    field += char
  }
  row.push(field)
  if (row.some((value) => value.trim() !== '')) rows.push(row)
  return rows
}

function escapeCsv(value: unknown) {
  const text = Array.isArray(value) ? value.join('|') : String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function parseMarketingAiCommandCsv(csv: string) {
  const rows = parseCsvRows(csv)
  if (rows.length < 2) throw new Error('CSV_EMPTY')
  const headers = rows[0].map((header) => header.trim().toLowerCase())
  const missing = MARKETING_AI_COMMAND_CSV_HEADERS.filter((header) => !headers.includes(header))
  if (missing.length) throw new Error(`CSV_MISSING_HEADERS:${missing.join(',')}`)
  const commands: MarketingAiCommand[] = []
  const errors: Array<{ row: number; error: string }> = []
  rows.slice(1).forEach((values, rowIndex) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']))
    const parsed = commandImportRowSchema.safeParse(record)
    if (!parsed.success) {
      errors.push({ row: rowIndex + 2, error: parsed.error.issues.map((issue) => `${issue.path.map((segment) => String(segment)).join('.')}:${issue.message}`).join('|') })
      return
    }
    const item = parsed.data
    commands.push({
      code: item.code.trim().toUpperCase(),
      name: item.name.trim(),
      skillCode: item.skill_code.trim().toUpperCase(),
      skillName: item.skill_code.trim().toUpperCase(),
      category: item.category.trim(),
      objective: item.objective.trim(),
      instruction: `${item.instruction.trim()} Never execute external communication, publishing, advertising or outreach.`,
      defaultFrequency: item.default_frequency,
      authorityMode: item.authority_mode,
      riskLevel: item.risk_level,
      requiresHumanReview: item.requires_human_review,
      status: item.status,
      deployed: item.status === 'active',
      tags: item.tags.split('|').map((tag: string) => tag.trim()).filter(Boolean),
      source: 'csv_import',
      version: 'imported-1.0.0',
    })
  })
  const seen = new Set<string>()
  for (const command of commands) {
    if (seen.has(command.code)) errors.push({ row: 0, error: `DUPLICATE_CODE:${command.code}` })
    seen.add(command.code)
  }
  return { commands, errors, accepted: commands.length, rejected: errors.length }
}

export function serializeMarketingAiCommandsCsv(commands: MarketingAiCommand[]) {
  const lines = [MARKETING_AI_COMMAND_CSV_HEADERS.join(',')]
  for (const command of commands) {
    lines.push([
      command.code, command.name, command.skillCode, command.category, command.objective, command.instruction,
      command.defaultFrequency, command.authorityMode, command.riskLevel, command.requiresHumanReview,
      command.status, command.tags,
    ].map(escapeCsv).join(','))
  }
  return lines.join('\n')
}

export function marketingAiCommandCsvTemplate() {
  return serializeMarketingAiCommandsCsv([{
    code: 'CUSTOM-MKT-0001',
    name: 'Audit premium du portefeuille contenu',
    skillCode: 'STRATEGY-01',
    skillName: 'Executive Marketing Strategy',
    category: 'Stratégie exécutive',
    objective: 'Auditer le portefeuille et produire les priorités exécutives des 30 prochains jours.',
    instruction: 'Analyser les contenus, campagnes, tâches et performances disponibles. Produire décisions, risques, propriétaires, délais et critères d’arrêt.',
    defaultFrequency: 'monthly',
    authorityMode: 'advise',
    riskLevel: 'high',
    requiresHumanReview: true,
    status: 'draft',
    deployed: false,
    tags: ['custom', 'portfolio', 'executive'],
    source: 'csv_import',
    version: '1.0.0',
  }])
}
