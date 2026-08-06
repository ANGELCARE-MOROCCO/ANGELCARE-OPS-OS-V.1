import {NextRequest,NextResponse} from 'next/server'
import {executeAccessAction,getAccessAreaSnapshot} from '@/lib/angelcare360/server/access-area'
import type {AccessActionRequest} from '@/types/angelcare360/access-area'
export const dynamic='force-dynamic';export const runtime='nodejs'
export async function GET(_:NextRequest,c:{params:Promise<{id:string}>}){const {id}=await c.params,s=await getAccessAreaSnapshot();return NextResponse.json({ok:true,record:s.users.find(x=>x.id===id)||s.roles.find(x=>x.id===id)||s.requests.find(x=>x.id===id)||s.delegations.find(x=>x.id===id)||s.reviews.find(x=>x.id===id)||s.issues.find(x=>x.id===id)||null})}
export async function POST(r:NextRequest,c:{params:Promise<{id:string}>}){const {id}=await c.params,b=await r.json() as AccessActionRequest;return NextResponse.json(await executeAccessAction({...b,userId:b.userId||id}))}