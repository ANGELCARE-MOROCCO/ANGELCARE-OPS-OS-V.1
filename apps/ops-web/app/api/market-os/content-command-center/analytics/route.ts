import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { canonicalAnalytics } from "@/lib/market-os/content-command-headquarters/canonical-legacy-api-service"
export async function GET(){try{await requireContentHeadquartersUser("view");return NextResponse.json({ok:true,metrics:await canonicalAnalytics(),source:"market_content_canonical"})}catch(error){return contentHeadquartersApiError(error)}}
