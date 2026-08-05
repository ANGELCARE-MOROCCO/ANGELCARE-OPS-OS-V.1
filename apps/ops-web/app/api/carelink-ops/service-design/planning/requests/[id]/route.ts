import { NextResponse } from 'next/server'
import { deleteMasteryRecord, errorPayload, getMasteryRecord, updateMasteryRecord } from '@/lib/service-design-mastery/server'
type C={params:Promise<{id:string}>}
export async function GET(_:Request,c:C){try{return NextResponse.json({ok:true,data:await getMasteryRecord('planning_request',(await c.params).id)})}catch(e){const p=errorPayload(e);return NextResponse.json(p.body,{status:p.status})}}
export async function PATCH(r:Request,c:C){try{return NextResponse.json({ok:true,data:await updateMasteryRecord('planning_request',(await c.params).id,await r.json())})}catch(e){const p=errorPayload(e);return NextResponse.json(p.body,{status:p.status})}}
export async function DELETE(_:Request,c:C){try{return NextResponse.json({ok:true,data:await deleteMasteryRecord('planning_request',(await c.params).id)})}catch(e){const p=errorPayload(e);return NextResponse.json(p.body,{status:p.status})}}
