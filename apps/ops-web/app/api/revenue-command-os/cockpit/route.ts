import type { NextRequest } from 'next/server'
import { handleCockpitGet } from '@/lib/revenue-command-os/cockpit/route-handler'
export async function GET(request: NextRequest) { return handleCockpitGet(request, 'all') }
