import {NextRequest,NextResponse} from 'next/server'
import {getCurrentUser} from '@/lib/getUser'
import {councilError,councilRights,tenantOf} from '@/lib/revenue-command-os/validation-council/api-access'
import {getCouncilRun} from '@/lib/revenue-command-os/validation-council/repository'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){const user=await getCurrentUser();if(!user)return councilError('UNAUTHENTICATED','Authentification requise.',401);if(!councilRights(user).read)return councilError('FORBIDDEN','Lecture Conseil interdite.',403);const {id}=await params;try{return NextResponse.json({ok:true,data:await getCouncilRun(id,tenantOf(user,Object.fromEntries(request.nextUrl.searchParams))),mode:'shadow',externalActions:0})}catch(error){return councilError('COUNCIL_READ_FAILED',error instanceof Error?error.message:String(error),500)}}
