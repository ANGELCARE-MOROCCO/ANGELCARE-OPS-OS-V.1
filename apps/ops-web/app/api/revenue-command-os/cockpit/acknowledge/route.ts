import type { NextRequest } from 'next/server'
import { handleCockpitAction } from '@/lib/revenue-command-os/cockpit/route-handler'
export async function POST(request: NextRequest) { return handleCockpitAction(request, 'acknowledge') }
