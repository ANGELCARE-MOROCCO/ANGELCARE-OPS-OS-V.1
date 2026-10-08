import { NextRequest, NextResponse } from 'next/server'
import { executeAngelcare360Area12Operation, loadAngelcare360Area12Command } from '@/lib/angelcare360/server/parent-relationship-area12'
export const dynamic='force-dynamic'
export async function GET(req:NextRequest){try{const u=req.nextUrl;const data=await loadAngelcare360Area12Command({view:u.searchParams.get('view')||'today',familyId:u.searchParams.get('family')});return NextResponse.json(data)}catch(e){const message=e instanceof Error?e.message:'Erreur Relation Parents.';return NextResponse.json({ok:false,message},{status:403})}}
export async function POST(req:NextRequest){try{const body=await req.json();const data=await executeAngelcare360Area12Operation(body);return NextResponse.json(data)}catch(e){const message=e instanceof Error?e.message:'Action Relation Parents impossible.';return NextResponse.json({ok:false,message},{status:422})}}
