import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { recordLegacyCommand } from "@/lib/market-os/content-command-headquarters/canonical-legacy-api-service"
export const dynamic="force-dynamic"
export async function POST(request:Request){try{const actor=await requireContentHeadquartersUser("operate");return NextResponse.json({ok:true,...await recordLegacyCommand(actor,await request.json())})}catch(error){return contentHeadquartersApiError(error)}}
