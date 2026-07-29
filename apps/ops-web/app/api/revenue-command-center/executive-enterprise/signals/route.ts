import { executiveCommandResponse, executivePortfolioResponse } from "../_shared"
export const dynamic = "force-dynamic"
const commands = ["acknowledge-signal","dismiss-signal","create-intervention"] as const
export async function GET(request: Request) { return executivePortfolioResponse(request, "control-tower", "signals") }
export async function POST(request: Request) { return executiveCommandResponse(request, [...commands]) }
