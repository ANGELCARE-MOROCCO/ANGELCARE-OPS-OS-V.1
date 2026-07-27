import { NextResponse } from 'next/server';
import { AC_CAPITAL_QUALIFICATION_CONTRACT, getAcCapitalQualificationSnapshot } from '../../../../lib/ac-capital-os/qualification-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    contract: AC_CAPITAL_QUALIFICATION_CONTRACT,
    snapshot: getAcCapitalQualificationSnapshot(),
    status: 'mz4-qualification-engine-installed',
  });
}
