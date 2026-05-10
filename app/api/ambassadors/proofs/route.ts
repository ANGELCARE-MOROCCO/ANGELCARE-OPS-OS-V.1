import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Proof review API placeholder.'
  });
}

export async function POST() {
  return NextResponse.json({
    ok: false,
    message: 'Proof review mutations require compliance permission validation.'
  }, { status: 501 });
}
