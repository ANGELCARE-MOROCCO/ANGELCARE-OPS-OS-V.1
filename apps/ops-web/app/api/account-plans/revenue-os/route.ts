import { handleInternalAdapterBridge } from '@/lib/revenue-command-os/execution-autopilot/internal-bridge'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:Request){return handleInternalAdapterBridge(request,'account_plans')}
