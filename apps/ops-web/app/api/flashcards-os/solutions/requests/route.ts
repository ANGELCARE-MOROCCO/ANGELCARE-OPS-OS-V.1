import { NextResponse } from 'next/server'
import { assertFlashcardsApiAccess } from '@/lib/flashcards-os/server/access'
import { actorFromUser, createSolutionRequest } from '@/lib/flashcards-os/solutions/server/repository'
export async function POST(request:Request){const access=await assertFlashcardsApiAccess('flashcards_os.create_solution_requests');if(!access.ok)return NextResponse.json({error:access.message},{status:access.status});try{const body=await request.json();return NextResponse.json(await createSolutionRequest(body,actorFromUser(access.user)),{status:201})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Solution request creation failed.'},{status:400})}}
