import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { legacyWorkspace } from "@/lib/market-os/content-command-headquarters/canonical-legacy-api-service"
export const dynamic="force-dynamic"
export async function GET(){try{await requireContentHeadquartersUser("view");return NextResponse.json({ok:true,...await legacyWorkspace(),source:"market_content_canonical"})}catch(error){return contentHeadquartersApiError(error)}}
