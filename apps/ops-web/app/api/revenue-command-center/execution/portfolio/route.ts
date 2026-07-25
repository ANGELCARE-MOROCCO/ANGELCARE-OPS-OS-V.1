import { fail, ok } from "@/lib/revenue-command-center/canonical-server"
import { executionContext, optionalRows } from "@/lib/revenue-command-center/execution-enterprise/server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"

export async function GET(request: Request) {
  try {
    const { access, supabase } = await executionContext("revenue.tasks.read")
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")
    const [viewResult, baseResult, activities, assignments, dependencies, evidence, approvals, blockers, escalations, checklists, comments, workload] = await Promise.all([
      optionalRows(supabase,"revenue_execution_portfolio_view","*",q=>taskId?q.eq("id",taskId):q.order("updated_at",{ascending:false}).limit(2500)),
      optionalRows(supabase,"revenue_tasks","*",q=>taskId?q.eq("id",taskId):q.order("updated_at",{ascending:false}).limit(2500)),
      optionalRows(supabase,"revenue_activities","*",q=>q.eq("entity_type","task").order("created_at",{ascending:false}).limit(500)),
      optionalRows(supabase,"revenue_task_assignments","*",q=>taskId?q.eq("task_id",taskId):q.order("created_at",{ascending:false}).limit(1500)),
      optionalRows(supabase,"revenue_task_dependencies","*",q=>taskId?q.or(`task_id.eq.${taskId},depends_on_task_id.eq.${taskId}`):q.limit(2000)),
      optionalRows(supabase,"revenue_task_evidence","*",q=>taskId?q.eq("task_id",taskId):q.order("created_at",{ascending:false}).limit(2000)),
      optionalRows(supabase,"revenue_task_approval_requests","*",q=>taskId?q.eq("task_id",taskId):q.order("created_at",{ascending:false}).limit(1500)),
      optionalRows(supabase,"revenue_task_blockers","*",q=>taskId?q.eq("task_id",taskId):q.order("created_at",{ascending:false}).limit(1500)),
      optionalRows(supabase,"revenue_task_escalations","*",q=>taskId?q.eq("task_id",taskId):q.order("created_at",{ascending:false}).limit(1500)),
      optionalRows(supabase,"revenue_task_checklist_items","*",q=>taskId?q.eq("task_id",taskId):q.order("position",{ascending:true}).limit(3000)),
      optionalRows(supabase,"revenue_task_comments","*",q=>taskId?q.eq("task_id",taskId):q.order("created_at",{ascending:false}).limit(2000)),
      optionalRows(supabase,"revenue_task_workload_view","*",q=>q.order("overdue_tasks",{ascending:false}).limit(100)),
    ])
    const tasks=(viewResult.available && viewResult.rows.length ? viewResult.rows : baseResult.rows) as any[]
    const normalize=(value:unknown)=>String(value||"open").toLowerCase().replaceAll("-","_")
    const now=Date.now()
    const active=tasks.filter(t=>!["done","completed","archived","cancelled","canceled"].includes(normalize(t.status)))
    const completed=tasks.filter(t=>["done","completed"].includes(normalize(t.status)))
    const overdue=active.filter(t=>{const due=t.due_at||t.due_date; return due && new Date(String(due)).getTime()<now})
    const blocked=active.filter(t=>normalize(t.status)==="blocked")
    const approvalRequired=active.filter(t=>["approval_required","approval"].includes(normalize(t.status)))
    const evidenceMissing=completed.filter(t=>Boolean(t.evidence_required)&&Number(t.evidence_count||0)===0)
    const summary={
      total:tasks.length, open:active.filter(t=>["open","pending","todo"].includes(normalize(t.status))).length,
      inProgress:active.filter(t=>["in_progress","active","working"].includes(normalize(t.status))).length,
      waiting:active.filter(t=>["waiting","on_hold","waiting_external"].includes(normalize(t.status))).length,
      blocked:blocked.length, overdue:overdue.length, approvalRequired:approvalRequired.length, completed:completed.length,
      unassigned:active.filter(t=>!t.owner||String(t.owner).toLowerCase().includes("non attrib")).length,
      evidenceMissing:evidenceMissing.length,
      commercialValueAtRiskMad:blocked.concat(overdue).reduce((sum,t,index,array)=>array.findIndex(x=>x.id===t.id)===index?sum+Number(t.commercial_value_mad||t.value_mad||0):sum,0),
      completionRate:tasks.length?Math.round(completed.length/tasks.length*100):0,
    }
    return ok({
      tasks, activities:activities.rows, assignments:assignments.rows, dependencies:dependencies.rows, evidence:evidence.rows,
      approvals:approvals.rows, blockers:blockers.rows, escalations:escalations.rows, checklists:checklists.rows, comments:comments.rows,
      workload:workload.rows, summary,
      schema:{ portfolioView:viewResult.available, assignments:assignments.available, dependencies:dependencies.available, evidence:evidence.available, approvals:approvals.available, blockers:blockers.available, escalations:escalations.available, checklists:checklists.available, comments:comments.available, workload:workload.available },
      currentUser:{ id:(access.user as any).id||null, email:(access.user as any).email||null, role:access.role }, syncedAt:new Date().toISOString(),
    })
  } catch (error) {
    const access=revenueAccessFailure(error); return access?fail(access.message,access.status):fail(error)
  }
}
