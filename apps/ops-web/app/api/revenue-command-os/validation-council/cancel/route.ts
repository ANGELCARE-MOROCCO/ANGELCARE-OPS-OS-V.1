import {NextRequest,NextResponse} from 'next/server'
import {getCurrentUser} from '@/lib/getUser'
import {councilError,councilRights,tenantOf} from '@/lib/revenue-command-os/validation-council/api-access'
import {cancelCouncilRun} from '@/lib/revenue-command-os/validation-council/repository'
export async function POST(request:NextRequest){const user=await getCurrentUser();if(!user)return councilError('UNAUTHENTICATED','Authentification requise.',401);if(!councilRights(user).manage)return councilError('FORBIDDEN','Gestion Conseil interdite.',403);try{const body=await request.json();await cancelCouncilRun(body.runId,tenantOf(user,body));return NextResponse.json({ok:true,status:'cancelled',externalActions:0})}catch(error){return councilError('COUNCIL_CANCEL_FAILED',error instanceof Error?error.message:String(error),500)}}
