import { createClient } from '@/lib/supabase/server'
import { writeHRAudit } from './audit'
export async function generatePayrollInput(periodStart: string, periodEnd: string) {
  const supabase = await createClient()
  const { data: attendance } = await supabase.from('hr_attendance_records').select('*').gte('work_date', periodStart).lte('work_date', periodEnd)
  const grouped = new Map<string, any>()
  for (const row of attendance || []) {
    const key = row.user_id || row.staff_id || 'unknown'
    const cur = grouped.get(key) || { user_id: row.user_id, staff_id: row.staff_id, worked_minutes: 0, overtime_minutes: 0, late_minutes: 0, absence_days: 0 }
    cur.worked_minutes += Number(row.total_minutes) || 0
    cur.overtime_minutes += Number(row.overtime_minutes) || 0
    cur.late_minutes += Number(row.late_minutes) || 0
    if (String(row.status || '').includes('absence')) cur.absence_days += 1
    grouped.set(key, cur)
  }
  const rows = [...grouped.values()].map(x => ({ ...x, period_start: periodStart, period_end: periodEnd, status: 'draft', updated_at: new Date().toISOString() }))
  if (rows.length) await supabase.from('hr_payroll_inputs').upsert(rows)
  await writeHRAudit('payroll.generated', { payload: { periodStart, periodEnd, rows: rows.length } })
  return rows
}
