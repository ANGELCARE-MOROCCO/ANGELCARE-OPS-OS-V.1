import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    ok: false,
    error: 'Payout approval is blocked until authenticated actor context, RBAC, audit logs, and finance approval workflow are wired.'
  }, { status: 403 });
}
