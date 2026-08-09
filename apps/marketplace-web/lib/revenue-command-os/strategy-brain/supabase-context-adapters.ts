import { createServiceClient } from '@/lib/supabase/server'
import { RevenueOsError } from '../errors'
import type { ContextAdapters } from './context-assembler'
import type { ContextFact, RevenueObjective } from './types'

const now = () => new Date().toISOString()

async function rows(table: string, limit = 40) {
  const client = await createServiceClient()
  const result = await client.from(table).select('*').limit(limit)
  if (result.error) {
    throw new RevenueOsError('REVENUE_OS_DEPENDENCY_UNAVAILABLE', `Source de contexte indisponible: ${table}.`, {
      status: 503,
      recoverable: true,
      cause: result.error,
      context: { table },
    })
  }
  return result.data ?? []
}

function facts(table: string, sourceRows: any[], state: ContextFact['state'] = 'fact'): ContextFact[] {
  return sourceRows.map((row, index) => ({
    key: `${table}:${row.code || row.slug || row.id || index}`,
    value: row,
    state,
    sourceId: String(row.id || row.code || `${table}-${index}`),
    sourceType: table.includes('doctrine') || table.includes('knowledge')
      ? 'doctrine'
      : table.includes('signal')
        ? 'signal'
        : table.includes('capacity')
          ? 'capacity'
          : 'digital_twin',
    observedAt: String(row.updated_at || row.created_at || now()),
    freshness: 'fresh',
    confidence: state === 'hypothesis' ? 0.45 : 0.9,
  }))
}

export function createSupabaseContextAdapters(): ContextAdapters {
  return {
    async getDigitalTwin(_objective: RevenueObjective) {
      const tables = [
        'revenue_os_offers',
        'revenue_os_offer_prices',
        'revenue_os_margin_rules',
        'revenue_os_customer_segments',
        'revenue_os_territories',
      ]
      const groups = await Promise.all(tables.map((table) => rows(table)))
      return groups.flatMap((group, index) => facts(tables[index], group))
    },
    async getDoctrine() {
      const tables = ['revenue_os_doctrines', 'revenue_os_knowledge_assets', 'revenue_os_playbooks']
      const groups = await Promise.all(tables.map((table) => rows(table)))
      return groups.flatMap((group, index) => facts(tables[index], group, 'approved_doctrine'))
    },
    async getSignals() {
      return facts('revenue_os_signals', await rows('revenue_os_signals', 60))
    },
    async getPipeline() {
      return facts('revenue_os_signal_entities', await rows('revenue_os_signal_entities', 60))
    },
    async getCapacity() {
      return facts('revenue_os_capacity_requirements', await rows('revenue_os_capacity_requirements', 60))
    },
  }
}
