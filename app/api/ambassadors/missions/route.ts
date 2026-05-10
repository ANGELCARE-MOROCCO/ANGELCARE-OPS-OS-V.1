import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Ambassador missions API placeholder.'
  });
}

export async function POST() {
  return NextResponse.json({
    ok: false,
    message: 'Mission assignment requires authenticated server-side permission validation.'
  }, { status: 501 });
}
