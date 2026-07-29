import { executiveCommandResponse, executivePortfolioResponse } from "../_shared"
export const dynamic = "force-dynamic"
export async function GET(request: Request) { return executivePortfolioResponse(request, "control-tower", "collections") }
export async function POST(request: Request) { return executiveCommandResponse(request, ["request-finance-review"]) }
