import { executiveCommandResponse, executivePortfolioResponse } from "../_shared"
export const dynamic = "force-dynamic"
const commands = ["generate-briefing","approve-briefing"] as const
export async function GET(request: Request) { return executivePortfolioResponse(request, "executive-briefing", "briefings") }
export async function POST(request: Request) { return executiveCommandResponse(request, [...commands]) }
