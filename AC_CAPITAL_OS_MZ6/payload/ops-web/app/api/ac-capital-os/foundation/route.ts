import { NextResponse } from 'next/server';
import {
  AC_CAPITAL_OS_FOUNDATION,
  AC_CAPITAL_OS_WORKSPACES,
  getAcCapitalOsReadinessSummary,
} from '../../../../lib/ac-capital-os/foundation';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    module: AC_CAPITAL_OS_FOUNDATION,
    readiness: getAcCapitalOsReadinessSummary(),
    workspaces: AC_CAPITAL_OS_WORKSPACES,
    contract: {
      megaZip: 1,
      name: 'AC CAPITAL OS Foundation & Premium Shell',
      status: 'installed',
      accessDoctrine: 'internal-protected-capital-command-module',
    },
  });
}
