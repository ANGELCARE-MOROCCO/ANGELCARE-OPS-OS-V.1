import { executiveCommandResponse } from "../_shared"
export const dynamic = "force-dynamic"
export async function POST(request: Request) { return executiveCommandResponse(request) }
