import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { canonicalVersions, saveCanonicalComment } from "@/lib/market-os/content-command-headquarters/canonical-legacy-api-service"
export const dynamic="force-dynamic"
export async function GET(request:Request){try{await requireContentHeadquartersUser("view");const id=new URL(request.url).searchParams.get("entity_id")||undefined;return NextResponse.json({ok:true,versions:await canonicalVersions(id),source:"market_content_canonical"})}catch(error){return contentHeadquartersApiError(error)}}
export async function POST(request:Request){try{const actor=await requireContentHeadquartersUser("operate");const payload=await request.json();const version=await saveCanonicalComment(actor,{...payload,note_type:"version_note",body:payload.body||payload.description||payload.note||"Version enregistrée"});return NextResponse.json({ok:true,version,persisted:true,source:"market_content_notes"})}catch(error){return contentHeadquartersApiError(error)}}
