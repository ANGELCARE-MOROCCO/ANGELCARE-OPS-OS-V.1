import { NextResponse } from 'next/server';
import { AC_CAPITAL_FUNDER_INTELLIGENCE_CONTRACT, getAcCapitalFunderIntelligenceSnapshot } from '../../../../lib/ac-capital-os/funder-intelligence';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: AC_CAPITAL_FUNDER_INTELLIGENCE_CONTRACT,
    snapshot: getAcCapitalFunderIntelligenceSnapshot(),
    objectFamilies: [
      'funderProfiles',
      'funderContacts',
      'funderRelationshipHistory',
      'funderPsychologyBriefs',
      'funderLikelyObjections',
      'funderNarrativeRecommendations',
      'funderOpportunityLinks',
      'funderFollowUpActions',
      'funderStrategicSegments',
    ],
    status: 'mz5-funder-intelligence-installed',
  });
}
