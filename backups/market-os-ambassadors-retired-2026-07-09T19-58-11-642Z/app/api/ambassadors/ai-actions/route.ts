import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'AI action API placeholder.'
  });
}

export async function POST() {
  return NextResponse.json({
    ok: false,
    message: 'AI action execution requires approval workflow and audit persistence.'
  }, { status: 501 });
}
