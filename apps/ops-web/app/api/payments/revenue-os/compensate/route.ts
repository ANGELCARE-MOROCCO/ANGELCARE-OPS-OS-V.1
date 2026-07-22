import { compensateInternalAdapterBridge } from '@/lib/revenue-command-os/execution-autopilot/internal-bridge'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:Request){return compensateInternalAdapterBridge(request,'payments')}
