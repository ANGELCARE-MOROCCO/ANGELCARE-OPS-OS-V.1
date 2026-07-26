import { createContentCommandSupabaseServerClient } from '@/lib/market-os/content-command/db/supabase-server'
import type { Phase3ContextPackage, Phase3ContextSource } from './phase3-types'

const SOURCE_DEFINITIONS = [
  { key: 'doctrine', label: 'Doctrine Marketing AI', table: 'market_ai_doctrine_entries', select: 'code,title,category,authority_state,version,updated_at', limit: 200 },
  { key: 'services', label: 'Services 360', table: 'service_catalog', select: 'id,name,code,status,category,base_price,updated_at', limit: 200 },
  { key: 'campaigns', label: 'Campaign Lifecycle', table: 'market_os_campaigns', select: 'id,title,status,start_date,end_date,updated_at', limit: 100 },
  { key: 'content', label: 'Content Command', table: 'content_command_documents', select: '*', limit: 100 },
  { key: 'tasks', label: 'Tâches Content Command', table: 'content_command_tasks', select: '*', limit: 100 },
  { key: 'assets', label: 'Assets Content Command', table: 'content_command_assets', select: '*', limit: 100 },
  { key: 'sales', label: 'Sales Terminal', table: 'sales_terminal_orders', select: 'id,reference,status,payment_status,total,service_name,created_at', limit: 100 },
  { key: 'market_records', label: 'Market OS Records', table: 'market_os_records', select: 'id,record_type,engine,pipeline,title,status,priority,stage,due_date,updated_at,metadata', limit: 200 },
] as const

function rowDate(row: Record<string, unknown>): string | null {
  const value = row.updated_at || row.created_at || row.effective_at || null
  return value ? String(value) : null
}

export async function assembleMarketingAutopilotContext(input: {
  restrictions?: string[]
  missionContext?: Record<string, unknown>
} = {}): Promise<Phase3ContextPackage> {
  const client = createContentCommandSupabaseServerClient()
  const sources: Phase3ContextSource[] = []
  const facts: Record<string, unknown> = { mission: input.missionContext || {} }
  for (const definition of SOURCE_DEFINITIONS) {
    try {
      const { data, error, count } = await client.from(definition.table).select(definition.select, { count: 'exact' }).limit(definition.limit)
      if (error) throw error
      const rows = (data || []) as unknown as Record<string, unknown>[]
      const dates = rows.map(rowDate).filter(Boolean).sort()
      sources.push({
        key: definition.key,
        label: definition.label,
        status: rows.length ? 'available' : 'partial',
        recordCount: count ?? rows.length,
        freshness: dates.length ? dates[dates.length - 1] : null,
        evidence: rows.slice(0, 8).map((row: Record<string, unknown>) => String(row.title || row.name || row.code || row.id || definition.key)),
        warning: rows.length ? undefined : 'Source accessible mais sans enregistrement visible.',
      })
      facts[definition.key] = rows
    } catch (error) {
      sources.push({
        key: definition.key,
        label: definition.label,
        status: 'unavailable',
        recordCount: null,
        evidence: [],
        warning: error instanceof Error ? error.message : 'SOURCE_UNAVAILABLE',
      })
      facts[definition.key] = []
    }
  }
  const doctrine = (facts.doctrine as Record<string, unknown>[] | undefined) || []
  const doctrineVersion = doctrine.map((row: Record<string, unknown>) => String(row.version || '1.0.0')).sort().at(-1) || '1.0.0'
  return {
    assembledAt: new Date().toISOString(),
    doctrineVersion,
    sources,
    facts,
    missing: sources.filter((source) => source.status === 'unavailable').map((source) => source.key),
    restrictions: input.restrictions || [],
  }
}
