import type { DoctrineNode } from './types'

export type CsvImportResult = {
  headers: string[]
  rows: Array<Record<string,string>>
  errors: string[]
}

export function parseCsv(input: string): CsvImportResult {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    const next = input[i + 1]
    if (char === '"' && quoted && next === '"') { cell += '"'; i++; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (char === ',' && !quoted) { row.push(cell); cell = ''; continue }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i++
      row.push(cell); cell = ''
      if (row.some(value => value.trim() !== '')) rows.push(row)
      row = []
      continue
    }
    cell += char
  }
  if (cell.length || row.length) { row.push(cell); if (row.some(value => value.trim() !== '')) rows.push(row) }
  if (!rows.length) return { headers: [], rows: [], errors: ['CSV_EMPTY'] }
  const headers = rows[0].map(value => String(value || '').trim().toLowerCase().replace(/[\s-]+/g,'_'))
  const errors: string[] = []
  const data = rows.slice(1).map((values,index) => {
    const record: Record<string,string> = {}
    headers.forEach((header,i) => { record[header || `column_${i+1}`] = String(values[i] ?? '').trim() })
    if (values.length > headers.length) errors.push(`ROW_${index+2}_EXTRA_COLUMNS`)
    return record
  })
  return { headers, rows: data, errors }
}

const aliases: Record<string,string[]> = {
  code: ['code','doctrine_id','rule_id','id'],
  title: ['title','name','doctrine_name','rule_name'],
  customer_type: ['customer_type','customer','segment','audience'],
  service_line: ['service_line','service','line_of_service','offer'],
  journey_stage: ['journey_stage','stage','lifecycle_stage'],
  intent_family: ['intent_family','intent','intent_type'],
  trigger_terms: ['trigger_terms','trigger','keywords','signals'],
  objective: ['objective','goal','commercial_goal'],
  tone: ['tone','tone_profile','voice'],
  commercial_intensity: ['commercial_intensity','sales_intensity','intensity'],
  action_type: ['action_type','action','next_action_type'],
  response_guidance: ['response_guidance','response','guidance','reply_guidance'],
  qualification_questions: ['qualification_questions','questions','discovery_questions'],
  objection_class: ['objection_class','objection','objection_type'],
  proof_options: ['proof_options','proof','evidence'],
  forbidden_claims: ['forbidden_claims','forbidden','do_not_say'],
  success_signals: ['success_signals','success','winning_signals'],
  failure_signals: ['failure_signals','failure','loss_signals'],
  priority: ['priority','rank'],
  maturity_weight: ['maturity_weight','weight'],
}

function get(row: Record<string,string>, key: string) {
  const names = aliases[key] || [key]
  for (const name of names) if (row[name] != null && row[name] !== '') return row[name]
  return ''
}

function list(value: string) {
  return String(value || '').split(/\s*[|;]\s*/).map(v => v.trim()).filter(Boolean)
}

export function normalizeDoctrineRow(row: Record<string,string>, index: number) {
  const code = get(row,'code') || `CSV-${String(index+1).padStart(4,'0')}`
  const title = get(row,'title') || code
  const objective = get(row,'objective')
  const responseGuidance = get(row,'response_guidance')
  const triggers = list(get(row,'trigger_terms'))
  const errors: string[] = []
  const warnings: string[] = []
  if (!objective) errors.push('OBJECTIVE_REQUIRED')
  if (!responseGuidance && !get(row,'action_type')) warnings.push('NO_RESPONSE_OR_ACTION_GUIDANCE')
  if (!triggers.length && !get(row,'intent_family') && !get(row,'journey_stage')) warnings.push('BROAD_APPLICABILITY')
  const readinessBase = 100 - errors.length * 35 - warnings.length * 9
  const applicability = Math.max(0, Math.min(100, readinessBase + (get(row,'service_line') ? 4 : 0) + (get(row,'customer_type') ? 4 : 0)))
  const normalized = {
    code,
    title,
    customer_type: get(row,'customer_type') || 'all',
    service_line: get(row,'service_line') || 'all',
    journey_stage: get(row,'journey_stage') || 'all',
    intent_family: get(row,'intent_family') || 'all',
    trigger_terms: triggers,
    objective,
    tone_profile: { primary: get(row,'tone') || 'warm_commercial' },
    emotional_strategy: {},
    commercial_intensity: Math.max(0,Math.min(6,Number(get(row,'commercial_intensity') || 3))),
    action_type: get(row,'action_type') || 'reply',
    response_guidance: responseGuidance || null,
    response_variants: [],
    qualification_questions: list(get(row,'qualification_questions')),
    objection_class: get(row,'objection_class') || null,
    proof_options: list(get(row,'proof_options')),
    next_actions: [],
    escalation_rules: {},
    exclusions: {},
    forbidden_claims: list(get(row,'forbidden_claims')),
    success_signals: list(get(row,'success_signals')),
    failure_signals: list(get(row,'failure_signals')),
    cross_sell: {},
    follow_up_rules: {},
    priority: Number(get(row,'priority') || 50),
    maturity_weight: Number(get(row,'maturity_weight') || .25),
    status: errors.length ? 'draft' : 'active',
  } satisfies Partial<DoctrineNode>
  return { normalized, errors, warnings, applicability, green: errors.length === 0 && applicability >= 75 }
}

export function detectDoctrineConflicts(rows: Array<ReturnType<typeof normalizeDoctrineRow>>) {
  const conflicts: Array<{a:number;b:number;reason:string}> = []
  const signatures = new Map<string,number>()
  rows.forEach((row,index) => {
    const n:any = row.normalized
    const signature = [n.customer_type,n.service_line,n.journey_stage,n.intent_family,(n.trigger_terms || []).slice().sort().join('|')].join('::')
    if (signatures.has(signature)) conflicts.push({ a: signatures.get(signature)!, b:index, reason:'DUPLICATE_APPLICABILITY_SIGNATURE' })
    else signatures.set(signature,index)
  })
  return conflicts
}
