import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import { executeAngelcare360Area11Operation, loadAngelcare360Area11FamilyCommand } from '@/lib/angelcare360/server/family360-area11'
import type { Angelcare360Area11MutationRequest } from '@/types/angelcare360/family360-area11'
export const runtime='nodejs'; export const dynamic='force-dynamic'
function errorResponse(error:unknown){if(error instanceof Angelcare360AccessError)return NextResponse.json({ok:false,error:error.message},{status:error.status});return NextResponse.json({ok:false,error:error instanceof Error?error.message:'Erreur Famille 360 inattendue.'},{status:500})}
export async function GET(request:NextRequest){try{const data=await loadAngelcare360Area11FamilyCommand({view:request.nextUrl.searchParams.get('view'),familyId:request.nextUrl.searchParams.get('family'),personId:request.nextUrl.searchParams.get('person')});return NextResponse.json({ok:true,data},{status:200})}catch(error){return errorResponse(error)}}
export async function POST(request:NextRequest){try{const body=(await request.json().catch(()=>null)) as Angelcare360Area11MutationRequest|null;if(!body?.operation||!body.subjectKind||!body.subjectId||!body.idempotencyKey)return NextResponse.json({ok:false,error:'Opération, matière et clé d’intégrité sont obligatoires.'},{status:422});const result=await executeAngelcare360Area11Operation(body);return NextResponse.json(result,{status:result.ok?200:409})}catch(error){return errorResponse(error)}}
