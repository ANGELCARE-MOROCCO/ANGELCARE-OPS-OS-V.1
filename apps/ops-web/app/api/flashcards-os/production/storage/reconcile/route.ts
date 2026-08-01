import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/production/server/repository'
import { reconcileVault } from '@/lib/flashcards-os/production/server/vault-service'
export async function POST(){const access=await assertFlashcardsApiAccess('flashcards_os.manage_storage');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{return NextResponse.json(await reconcileVault(actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Vault reconciliation failed.'},{status:503})}}
