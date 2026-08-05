import { NextResponse } from 'next/server'
import { validateTechnicalPlan } from '@/lib/service-design-mastery/planning'
import { errorPayload } from '@/lib/service-design-mastery/server'
import { requireHomeServiceApi } from '@/lib/homeservice-design/server/auth'
export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){try{const actor=await requireHomeServiceApi(['homeservice_design.create_planning_requests','homeservice_design.manage_categories']);return NextResponse.json({ok:true,data:await validateTechnicalPlan((await params).id,actor)})}catch(e){const p=errorPayload(e);return NextResponse.json(p.body,{status:p.status})}}
