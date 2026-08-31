import {NextRequest,NextResponse} from 'next/server'
import {Angelcare360AccessError} from '@/lib/angelcare360/server/context'
import {executeSettingsAction,getSettingsAreaSnapshot} from '@/lib/angelcare360/server/settings-area'
import type {SettingsActionRequest} from '@/types/angelcare360/settings-area'
export const dynamic='force-dynamic';export const runtime='nodejs'
function fail(e:unknown){return NextResponse.json({ok:false,message:e instanceof Error?e.message:'Paramètres & règles de fonctionnement ne peut pas terminer cette action.'},{status:e instanceof Angelcare360AccessError?e.status:400})}
export async function GET(){try{return NextResponse.json({ok:true,snapshot:await getSettingsAreaSnapshot()})}catch(e){return fail(e)}}
export async function POST(r:NextRequest){try{return NextResponse.json(await executeSettingsAction(await r.json() as SettingsActionRequest))}catch(e){return fail(e)}}
