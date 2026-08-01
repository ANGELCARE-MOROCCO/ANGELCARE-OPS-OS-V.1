import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { canonicalAnalytics, legacyWorkspace } from "@/lib/market-os/content-command-headquarters/canonical-legacy-api-service"
export async function GET(){try{await requireContentHeadquartersUser("view");const [metrics,workspace]=await Promise.all([canonicalAnalytics(),legacyWorkspace()]);return NextResponse.json({ok:true,live:true,metrics,workspace,source:"market_content_canonical"})}catch(error){return contentHeadquartersApiError(error)}}
