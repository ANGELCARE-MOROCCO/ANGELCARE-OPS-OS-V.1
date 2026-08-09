export function groupAttendanceByDate(records: any[]) {
  return records.reduce((acc, row) => {
    const key = row.work_date || String(row.punch_in_at || '').slice(0,10) || 'unknown'
    acc[key] ||= []
    acc[key].push(row)
    return acc
  }, {} as Record<string, any[]>)
}
export function summarizeAttendance(records: any[]) {
  return {
    records: records.length,
    exceptions: records.filter(x => String(x.status || '').includes('exception')).length,
    open: records.filter(x => String(x.status || '').includes('open')).length,
    totalHours: Math.round(records.reduce((s,x)=>s+(Number(x.total_minutes)||0),0)/60),
  }
}
