import {NextRequest,NextResponse} from 'next/server'
import {Angelcare360AccessError} from '@/lib/angelcare360/server/context'
import {executeAccessAction,getAccessAreaSnapshot} from '@/lib/angelcare360/server/access-area'
import type {AccessActionRequest} from '@/types/angelcare360/access-area'
export const dynamic='force-dynamic';export const runtime='nodejs'
function fail(e:unknown){return NextResponse.json({ok:false,message:e instanceof Error?e.message:'Utilisateurs & accès ne peut pas terminer cette action.'},{status:e instanceof Angelcare360AccessError?e.status:400})}
export async function GET(){try{return NextResponse.json({ok:true,snapshot:await getAccessAreaSnapshot()})}catch(e){return fail(e)}}
export async function POST(r:NextRequest){try{return NextResponse.json(await executeAccessAction(await r.json() as AccessActionRequest))}catch(e){return fail(e)}}