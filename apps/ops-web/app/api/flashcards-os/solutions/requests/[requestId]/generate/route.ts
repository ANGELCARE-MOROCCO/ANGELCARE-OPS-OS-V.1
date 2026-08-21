import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, generateScenariosForRequest } from '@/lib/flashcards-os/solutions/server/repository'
async function POST__angelcareGovernedImpl(_:Request,{params}:{params:Promise<{requestId:string}>}){const access=await assertFlashcardsApiAccess('flashcards_os.generate_solution_scenarios');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const {requestId}=await params;return NextResponse.json(await generateScenariosForRequest(requestId,actorFromUser(access.user)))}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Scenario generation failed.'},{status:400})}}

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/flashcards-os/solutions/requests/[requestId]/generate',
  },
  POST__angelcareGovernedImpl,
)
