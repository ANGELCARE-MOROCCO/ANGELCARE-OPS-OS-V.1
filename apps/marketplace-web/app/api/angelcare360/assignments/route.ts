import {NextRequest,NextResponse} from 'next/server'
import {Angelcare360AccessError} from '@/lib/angelcare360/server/context'
import {executeAssignmentAction,getAssignmentsSnapshot} from '@/lib/angelcare360/server/assignments-area'
import type {AssignmentActionRequest} from '@/types/angelcare360/assignments-area'
export const dynamic='force-dynamic';export const runtime='nodejs'
function fail(e:unknown){return NextResponse.json({ok:false,message:e instanceof Error?e.message:'L’équipe pédagogique ne peut pas terminer cette action.'},{status:e instanceof Angelcare360AccessError?e.status:400})}
export async function GET(){try{return NextResponse.json({ok:true,snapshot:await getAssignmentsSnapshot()})}catch(e){return fail(e)}}
export async function POST(r:NextRequest){try{return NextResponse.json(await executeAssignmentAction(await r.json() as AssignmentActionRequest))}catch(e){return fail(e)}}
