import {NextResponse} from 'next/server'
import {getCurrentUser} from '@/lib/getUser'
import {councilError,councilRights} from '@/lib/revenue-command-os/validation-council/api-access'
import {COUNCIL_AGENTS} from '@/lib/revenue-command-os/validation-council/agents'
export async function GET(){const user=await getCurrentUser();if(!user)return councilError('UNAUTHENTICATED','Authentification requise.',401);return NextResponse.json({ok:true,data:COUNCIL_AGENTS,externalActions:true})}
