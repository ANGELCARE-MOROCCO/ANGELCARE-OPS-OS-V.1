import { executiveCommandResponse, executivePortfolioResponse } from "../_shared"
export const dynamic = "force-dynamic"
const commands = ["create-scenario","run-scenario","approve-scenario"] as const
export async function GET(request: Request) { return executivePortfolioResponse(request, "strategy-room", "scenarios") }
export async function POST(request: Request) { return executiveCommandResponse(request, [...commands]) }
