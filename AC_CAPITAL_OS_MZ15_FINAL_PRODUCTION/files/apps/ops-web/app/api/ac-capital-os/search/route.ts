import { apiError, requireCapitalApiActor, success, readTable } from "@/lib/ac-capital-os/server/mz15-api";
export const dynamic="force-dynamic";
const sources=[
["ac_capital_radar_opportunities","Opportunity","/ac-capital-os/radar",["title","opportunity_type","country"]],
["ac_capital_funders","Funder","/ac-capital-os/funders",["name","funder_type","country"]],
["ac_capital_cases","Case","/ac-capital-os/cases",["case_title","package_type","funding_type"]],
["ac_capital_data_room_documents","Document","/ac-capital-os/data-room",["title","category","document_type"]],
["ac_capital_pipeline_records","Deal","/ac-capital-os/pipeline",["title","stage","funding_type"]],
["ac_capital_coordinator_tasks","Mission","/ac-capital-os/coordinator",["task_title","task_type","owner"]],
["ac_capital_ai_agents","AI Agent","/ac-capital-os/ai-command",["agent_name","agent_key","purpose"]],
["ac_capital_strategy_reports","Report","/ac-capital-os/reports",["report_type","purpose","audience"]],
["ac_capital_coordinator_founder_approvals","Approval","/ac-capital-os/approvals",["approval_title","reason_required","status"]],
["ac_capital_sop_manuals","SOP","/ac-capital-os/manual",["title","purpose","performed_by"]],
] as const;
export async function GET(request:Request){try{await requireCapitalApiActor();const query=new URL(request.url).searchParams.get("q")?.trim().toLowerCase()||"";if(query.length<2)return Response.json(success({results:[]}));const results=[];for(const [table,kind,href,keys] of sources){let rows=[] as Record<string,unknown>[];try{rows=await readTable(table,40)}catch{continue}for(const row of rows){const haystack=keys.map((key)=>String(row[key]||"")).join(" ").toLowerCase();if(haystack.includes(query)){results.push({id:row.id,title:String(row[keys[0]]||kind),kind,href,status:String(row.status||row.stage||"open"),sourceTable:table});if(results.length>=30)break}}if(results.length>=30)break}return Response.json(success({results}));}catch(reason){return apiError(reason)}}
