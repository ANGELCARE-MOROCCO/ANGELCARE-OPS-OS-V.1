import { executiveCommandResponse, executivePortfolioResponse } from "../_shared"
export const dynamic = "force-dynamic"
const commands = ["generate-forecast-snapshot","submit-owner-forecast","override-forecast","expire-forecast-override"] as const
export async function GET(request: Request) { return executivePortfolioResponse(request, "forecast-command", "forecastLines") }
export async function POST(request: Request) { return executiveCommandResponse(request, [...commands]) }
