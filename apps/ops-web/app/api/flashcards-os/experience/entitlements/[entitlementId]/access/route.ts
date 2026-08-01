import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, recordEntitlementAccess } from '@/lib/flashcards-os/experience/server/repository'
export async function POST(request:Request,{params}:{params:Promise<{entitlementId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.manage_digital_entitlements');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {entitlementId}=await params;const body=await request.json();return NextResponse.json(await recordEntitlementAccess(entitlementId,body,actorFromUser(access.user)),{status:200})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Action failed.'},{status:400})}}
