import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, runReconciliation } from '@/lib/flashcards-os/experience/server/repository'
export async function POST(request:Request){const access=await assertFlashcardsApiAccess('flashcards_os.run_reconciliation');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const body=await request.json();return NextResponse.json(await runReconciliation(Array.isArray(body.scopes)?body.scopes:[],actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Action failed.'},{status:400})}}
