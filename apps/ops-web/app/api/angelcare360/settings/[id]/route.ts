import {NextRequest,NextResponse} from 'next/server'
import {executeSettingsAction,getSettingsAreaSnapshot} from '@/lib/angelcare360/server/settings-area'
import type {SettingsActionRequest} from '@/types/angelcare360/settings-area'
export const dynamic='force-dynamic';export const runtime='nodejs'
export async function GET(_:NextRequest,c:{params:Promise<{id:string}>}){const {id}=await c.params,s=await getSettingsAreaSnapshot();return NextResponse.json({ok:true,record:s.definitions.find(x=>x.id===id)||s.policies.find(x=>x.id===id)||s.templates.find(x=>x.id===id)||s.integrations.find(x=>x.id===id)||s.variations.find(x=>x.id===id)||s.releases.find(x=>x.id===id)||s.issues.find(x=>x.id===id)||null})}
export async function POST(r:NextRequest,c:{params:Promise<{id:string}>}){const {id}=await c.params,b=await r.json() as SettingsActionRequest;return NextResponse.json(await executeSettingsAction({...b,entityId:b.entityId||id}))}