import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Ambassador profiles API placeholder. Connect Supabase in secondary implementation.'
  });
}

export async function POST() {
  return NextResponse.json({
    ok: false,
    message: 'Create profile is disabled until server validation and Supabase persistence are connected.'
  }, { status: 501 });
}
