import { createClient } from '@/lib/supabase/server'

function rows(r:any){ return Array.isArray(r?.data) ? r.data : [] }

export async function getHRPhase8Data() {
  const supabase = await createClient()

  const [
    requests,
    sla,
    compliance,
    escalations,
    approvals,
    tasks,
  ] = await Promise.all([
    supabase.from('hr_service_requests').select('*').order('created_at',{ascending:false}).limit(600),
    supabase.from('hr_sla_tracking').select('*').order('created_at',{ascending:false}).limit(400),
    supabase.from('hr_compliance_watch').select('*').order('created_at',{ascending:false}).limit(400),
    supabase.from('hr_escalations').select('*').order('created_at',{ascending:false}).limit(400),
    supabase.from('hr_approval_requests').select('*').order('created_at',{ascending:false}).limit(400),
    supabase.from('hr_execution_tasks').select('*').order('created_at',{ascending:false}).limit(600),
  ])

  const data = {
    requests: rows(requests),
    sla: rows(sla),
    compliance: rows(compliance),
    escalations: rows(escalations),
    approvals: rows(approvals),
    tasks: rows(tasks),
  }

  const active = (x:any)=>!['closed','completed','resolved','cancelled'].includes(String(x?.status||'').toLowerCase())

  return {
    ...data,
    metrics: [
      { label:'Service requests', value:data.requests.filter(active).length, detail:'Open HR requests', tone:'#2563eb' },
      { label:'SLA alerts', value:data.sla.filter((x:any)=>String(x.status||'')!=='healthy').length, detail:'SLA breaches & risks', tone:'#dc2626' },
      { label:'Compliance watch', value:data.compliance.filter(active).length, detail:'Compliance risks', tone:'#d97706' },
      { label:'Escalations', value:data.escalations.filter(active).length, detail:'Open escalations', tone:'#7c3aed' },
      { label:'Pending approvals', value:data.approvals.filter(active).length, detail:'Approval queue', tone:'#059669' },
      { label:'Execution tasks', value:data.tasks.filter(active).length, detail:'Operational tasks', tone:'#0891b2' },
    ]
  }
}
