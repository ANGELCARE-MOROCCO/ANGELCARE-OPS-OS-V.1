import { getHRDashboardData } from './repository'

const HEADERS: Record<string, string[]> = {
  staff: ['id','full_name','phone','email','city','department','position','employment_status','contract_type','start_date','compliance_status'],
  candidates: ['id','full_name','phone','email','city','source','desired_position','pipeline_stage','score','decision','interview_date'],
  attendance: ['id','staff_id','staff_name','attendance_date','check_in','check_out','status','validation_status'],
  rosters: ['id','staff_id','staff_name','shift_date','start_time','end_time','location','duty_type','mission_ref','status','conflict_status'],
  documents: ['id','staff_id','document_type','title','status','expiry_date','owner'],
  tasks: ['id','task_type','title','owner','priority','status','due_date','related_module'],
  approvals: ['id','request_type','title','requested_by','approver','status','decided_at'],
}

function escapeCsv(value: any) {
  const s = value == null ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

export async function buildHRExport(type: string) {
  const data = await getHRDashboardData()
  const map: Record<string, any[]> = {
    staff: data.staff,
    candidates: data.candidates,
    attendance: data.attendance,
    rosters: data.rosters,
    documents: data.docs,
    tasks: data.tasks,
    approvals: data.approvals,
  }
  const rows = map[type] || data.staff
  const headers = HEADERS[type] || HEADERS.staff
  return [headers.join(','), ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(','))].join('\n')
}
