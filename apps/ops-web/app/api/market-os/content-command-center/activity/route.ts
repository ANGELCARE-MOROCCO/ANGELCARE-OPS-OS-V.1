import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { legacyWorkspace, recordLegacyCommand } from "@/lib/market-os/content-command-headquarters/canonical-legacy-api-service"
export const dynamic="force-dynamic"
export async function GET(){try{await requireContentHeadquartersUser("view");return NextResponse.json({ok:true,activity:(await legacyWorkspace()).activity,source:"market_content_audit"})}catch(error){return contentHeadquartersApiError(error)}}
export async function POST(request:Request){try{const actor=await requireContentHeadquartersUser("operate");const activity=await recordLegacyCommand(actor,await request.json());return NextResponse.json({ok:true,activity,persisted:true})}catch(error){return contentHeadquartersApiError(error)}}
