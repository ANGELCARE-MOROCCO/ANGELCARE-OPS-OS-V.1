import { NextResponse } from 'next/server';
import {
  AC_CAPITAL_EXECUTIVE_COCKPIT_CONTRACT,
  getAcCapitalExecutiveCockpitSnapshot,
} from '../../../../../lib/ac-capital-os/executive-cockpit';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: AC_CAPITAL_EXECUTIVE_COCKPIT_CONTRACT,
    snapshot: getAcCapitalExecutiveCockpitSnapshot(),
    status: 'mz2-executive-cockpit-installed',
  });
}
