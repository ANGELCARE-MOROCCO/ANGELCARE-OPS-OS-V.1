import {NextRequest,NextResponse} from 'next/server'
import {executeAssignmentAction,getAssignmentsSnapshot} from '@/lib/angelcare360/server/assignments-area'
import type {AssignmentActionRequest} from '@/types/angelcare360/assignments-area'
export const dynamic='force-dynamic';export const runtime='nodejs'
export async function GET(_:NextRequest,c:{params:Promise<{id:string}>}){const {id}=await c.params;const s=await getAssignmentsSnapshot();return NextResponse.json({ok:true,record:s.assignments.find(x=>x.id===id)||s.staff.find(x=>x.id===id)||s.replacements.find(x=>x.id===id)||s.conflicts.find(x=>x.id===id)||null})}
export async function POST(r:NextRequest,c:{params:Promise<{id:string}>}){const {id}=await c.params;const b=await r.json() as AssignmentActionRequest;return NextResponse.json(await executeAssignmentAction({...b,assignmentId:b.assignmentId||id}))}
