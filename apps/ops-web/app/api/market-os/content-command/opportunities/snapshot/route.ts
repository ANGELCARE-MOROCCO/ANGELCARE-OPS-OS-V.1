import { NextResponse } from 'next/server'
import { requireContentHeadquartersUser, contentHeadquartersApiError } from '@/lib/market-os/content-command-headquarters/auth'
import { getOpportunityIntelligenceSnapshot } from '@/lib/market-os/content-command-headquarters/opportunity-intelligence-service'
export const dynamic='force-dynamic'
export async function GET(){try{await requireContentHeadquartersUser('view');return NextResponse.json({ok:true,snapshot:await getOpportunityIntelligenceSnapshot()})}catch(error){return contentHeadquartersApiError(error)}}
