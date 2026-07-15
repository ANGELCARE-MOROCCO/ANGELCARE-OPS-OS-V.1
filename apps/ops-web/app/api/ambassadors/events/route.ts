import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Event ingestion API placeholder.'
  });
}

export async function POST() {
  return NextResponse.json({
    ok: false,
    message: 'Event ingestion requires persistence, idempotency, and auth validation.'
  }, { status: 501 });
}
