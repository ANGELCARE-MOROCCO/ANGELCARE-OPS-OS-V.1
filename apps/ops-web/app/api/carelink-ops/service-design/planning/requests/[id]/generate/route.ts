import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { generatePlanningScenarios } from '@/lib/service-design-mastery/planning'
import { errorPayload } from '@/lib/service-design-mastery/server'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
export const maxDuration=220
async function POST__angelcareGovernedImpl(request:Request,{params}:{params:Promise<{id:string}>}){try{const actor=await requireHomeServiceApi(['homeservice_design.create_planning_requests','homeservice_design.manage_categories']);const body=await request.json().catch(()=>({}));return NextResponse.json({ok:true,data:await generatePlanningScenarios((await params).id,actor,body)},{status:201})}catch(e){const p=errorPayload(e);return NextResponse.json(p.body,{status:p.status})}}

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/carelink-ops/service-design/planning/requests/[id]/generate',
  },
  POST__angelcareGovernedImpl,
)
