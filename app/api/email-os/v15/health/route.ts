import { NextResponse } from 'next/server';
import { getEmailOsEnv, productionBlockers } from '@/lib/email-os/v15/env';

export async function GET() {
  const env = getEmailOsEnv();
  return NextResponse.json({
    ok: productionBlockers().length === 0,
    env,
    blockers: productionBlockers(),
    message: productionBlockers().length ? 'Email OS V15 is structurally ready but blocked by missing environment configuration.' : 'Email OS V15 production bindings are configured.',
  });
}
