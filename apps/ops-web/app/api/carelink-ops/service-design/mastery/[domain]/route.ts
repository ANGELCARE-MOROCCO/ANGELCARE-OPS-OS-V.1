import { NextResponse } from 'next/server'
import { createMasteryRecord, errorPayload, listMasteryRecords } from '@/lib/service-design-mastery/server'
export const runtime='nodejs';export const dynamic='force-dynamic'
type C={params:Promise<{domain:string}>}
export async function GET(_:Request,c:C){try{return NextResponse.json({ok:true,data:await listMasteryRecords((await c.params).domain)})}catch(e){const p=errorPayload(e);return NextResponse.json(p.body,{status:p.status})}}
export async function POST(r:Request,c:C){try{return NextResponse.json({ok:true,data:await createMasteryRecord((await c.params).domain,await r.json())},{status:201})}catch(e){const p=errorPayload(e);return NextResponse.json(p.body,{status:p.status})}}
