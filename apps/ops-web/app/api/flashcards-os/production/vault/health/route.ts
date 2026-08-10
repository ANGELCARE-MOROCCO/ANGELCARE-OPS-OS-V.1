import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser } from '@/lib/flashcards-os/production/server/repository'
import { refreshNodeHealth } from '@/lib/flashcards-os/production/server/vault-service'
import { productionConfigurationStatus } from '@/lib/flashcards-os/production/config'
export async function GET(){const access=await assertFlashcardsApiAccess('flashcards_os.view_vault');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});if(!productionConfigurationStatus().windowsConfigured)return NextResponse.json({configured:false,error:'Vault Windows non configuré. Configurez FLASHCARDS_OS_WINDOWS_NODE_URL, FLASHCARDS_OS_WINDOWS_NODE_ID et FLASHCARDS_OS_WINDOWS_NODE_SECRET.'},{status:503});try{return NextResponse.json({configured:true,health:await refreshNodeHealth(actorFromUser(access.user))})}catch(error){return NextResponse.json({configured:true,error:error instanceof Error?error.message:'Vault health request failed.'},{status:503})}}
