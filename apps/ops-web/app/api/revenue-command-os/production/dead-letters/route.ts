import { dashboardRoute } from '@/lib/revenue-command-os/mega-production/route-handler'
export const dynamic='force-dynamic'
export async function GET(){return dashboardRoute()}
