import { NextResponse } from 'next/server'
import { requireContentHeadquartersUser, contentHeadquartersApiError } from '@/lib/market-os/content-command-headquarters/auth'
import { getCampaignOperatingSnapshot } from '@/lib/market-os/content-command-headquarters/campaign-orchestration-service'
export const dynamic='force-dynamic'
export async function GET(){try{await requireContentHeadquartersUser('view');return NextResponse.json({ok:true,snapshot:await getCampaignOperatingSnapshot()})}catch(error){return contentHeadquartersApiError(error)}}
