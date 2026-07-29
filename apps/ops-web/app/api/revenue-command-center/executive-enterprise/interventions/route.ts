import { executiveCommandResponse, executivePortfolioResponse } from "../_shared"
export const dynamic = "force-dynamic"
const commands = ["create-intervention","assign-intervention","escalate-intervention","request-decision","decide-intervention","record-intervention-checkpoint","close-intervention","create-canonical-task","request-finance-review"] as const
export async function GET(request: Request) { return executivePortfolioResponse(request, "control-tower", "interventions") }
export async function POST(request: Request) { return executiveCommandResponse(request, [...commands]) }
