import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    ok: false,
    error: 'AI action execution is blocked until human approval flow, audit persistence, and governance rules are wired.'
  }, { status: 403 });
}
