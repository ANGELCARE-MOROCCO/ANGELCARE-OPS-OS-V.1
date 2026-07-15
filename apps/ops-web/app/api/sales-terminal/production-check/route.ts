import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const checks = [
  { table: 'sales_clients', label: 'Clients table' },
  { table: 'sales_orders', label: 'Orders table' },
  { table: 'sales_order_items', label: 'Order items table' },
  { table: 'sales_documents', label: 'Documents table' },
  { table: 'sales_terminal_options', label: 'Configuration options table' },
  { table: 'sales_audit_logs', label: 'Audit logs table' }
]

export async function GET() {
  const supabase = await createClient()
  const results = []
  for (const item of checks) {
    const { count, error } = await supabase.from(item.table).select('*', { count: 'exact', head: true })
    results.push({ ...item, ok: !error, count: count || 0, message: error?.message || 'OK' })
  }
  const allOk = results.every(r => r.ok)
  return NextResponse.json({ ok: allOk, data: results, message: allOk ? 'Sales Terminal production checks passed.' : 'Some Sales Terminal checks failed.' })
}
