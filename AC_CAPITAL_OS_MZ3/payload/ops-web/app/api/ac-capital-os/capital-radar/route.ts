import { NextResponse } from 'next/server';
import { AC_CAPITAL_RADAR_CONTRACT, getAcCapitalRadarSnapshot } from '../../../../../lib/ac-capital-os/capital-radar';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: AC_CAPITAL_RADAR_CONTRACT,
    snapshot: getAcCapitalRadarSnapshot(),
    status: 'mz3-capital-radar-installed',
  });
}
