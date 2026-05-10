import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Payout API placeholder.'
  });
}

export async function POST() {
  return NextResponse.json({
    ok: false,
    message: 'Payout approval is blocked until finance RBAC and audit logging are connected.'
  }, { status: 501 });
}
