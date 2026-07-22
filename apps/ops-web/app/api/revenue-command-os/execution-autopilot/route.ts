import { handleDashboard } from '@/lib/revenue-command-os/execution-autopilot/route-handler'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function GET(){return handleDashboard()}
