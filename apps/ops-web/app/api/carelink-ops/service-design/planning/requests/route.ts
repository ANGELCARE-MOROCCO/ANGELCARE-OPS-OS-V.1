import { NextResponse } from 'next/server'
import { createPlanningRequest, listPlanningRequests } from '@/lib/service-design-mastery/planning'
import { errorPayload } from '@/lib/service-design-mastery/server'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
export const dynamic = 'force-dynamic'
export async function GET(){try{await requireHomeServiceApi('homeservice_design.view');return NextResponse.json({ok:true,data:await listPlanningRequests()})}catch(error){const p=errorPayload(error);return NextResponse.json(p.body,{status:p.status})}}
export async function POST(request:Request){try{const actor=await requireHomeServiceApi(['homeservice_design.create_planning_requests','homeservice_design.manage_categories']);return NextResponse.json({ok:true,data:await createPlanningRequest(await request.json(),actor)},{status:201})}catch(error){const p=errorPayload(error);return NextResponse.json(p.body,{status:p.status})}}
