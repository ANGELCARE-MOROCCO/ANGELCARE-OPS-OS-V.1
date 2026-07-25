import { fail, ok } from "@/lib/revenue-command-center/canonical-server"
import { executionContext, normalizeTaskPayload, nowIso, recordExecutionEvent } from "@/lib/revenue-command-center/execution-enterprise/server"
import { revenueAccessFailure } from "@/lib/revenue-command-center/api-access"

export async function GET(request: Request) {
  try { const {supabase}=await executionContext("revenue.tasks.read"); const {searchParams}=new URL(request.url); let q=supabase.from("revenue_tasks").select("*").order("updated_at",{ascending:false}).limit(Math.min(Number(searchParams.get("limit")||500),2500)); const status=searchParams.get("status"); if(status&&status!=="all")q=q.eq("status",status); const {data,error}=await q; if(error)return fail(error); return ok({tasks:data||[]}) } catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
export async function POST(request: Request) {
  try {
    const {access,supabase}=await executionContext("revenue.tasks.create"); const body=await request.json(); const normalized=normalizeTaskPayload(body)
    if(!normalized.title.trim())return fail("Le titre de la tâche est requis.",400)
    const actorId=(access.user as any).id||null, timestamp=nowIso()
    const row={...normalized,created_by:actorId,updated_by:actorId,created_at:timestamp,updated_at:timestamp,version:1,metadata:{...normalized.metadata,source:"revenue_execution_enterprise"}}
    let result=await supabase.from("revenue_tasks").insert(row).select("*").single()
    if(result.error && /column .* does not exist/i.test(result.error.message||"")){
      const fallback={title:row.title,description:row.description,status:row.status,priority:row.priority,owner:row.owner,entity_type:row.entity_type,entity_id:row.entity_id,prospect_id:row.prospect_id,due_date:row.due_at,start_at:row.start_at,expected_outcome:row.expected_outcome,metadata:row.metadata}
      result=await supabase.from("revenue_tasks").insert(fallback).select("*").single()
    }
    if(result.error)return fail(result.error)
    const task=result.data
    if(normalized.owner && normalized.owner!=="Non attribué") await supabase.from("revenue_task_assignments").insert({task_id:task.id,assignee_user_id:null,assignee_name:normalized.owner,role:normalized.assigned_role||"owner",is_primary:true,assigned_by:actorId}).catch(()=>undefined)
    await recordExecutionEvent(supabase,{task,eventType:"task_created",title:`Tâche créée : ${task.title}`,metadata:{owner:task.owner,priority:task.priority},payload:body,result:{id:task.id}})
    return ok({task})
  } catch(error){const access=revenueAccessFailure(error);return access?fail(access.message,access.status):fail(error)}
}
