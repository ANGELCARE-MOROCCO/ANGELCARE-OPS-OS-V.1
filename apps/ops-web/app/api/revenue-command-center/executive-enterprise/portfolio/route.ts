import { executivePortfolioResponse } from "../_shared"
export const dynamic = "force-dynamic"
export async function GET(request: Request) { return executivePortfolioResponse(request, "executive-overview") }
