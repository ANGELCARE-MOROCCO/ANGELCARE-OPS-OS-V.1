import { NextResponse } from 'next/server'
import { errorPayload, runMasteryAction } from '@/lib/service-design-mastery/server'
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{const body=await request.json().catch(()=>({}));return NextResponse.json({ok:true,data:await runMasteryAction('planning_request',(await params).id,{action:'run_feasibility',...body})})}catch(e){const p=errorPayload(e);return NextResponse.json(p.body,{status:p.status})}}
