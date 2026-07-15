import { NextResponse } from 'next/server';
import { listAmbassadorMissions } from '@/lib/ambassadors/final/repositories';

export async function GET() {
  const result = await listAmbassadorMissions();
  if (!result.ok) return NextResponse.json(result, { status: 500 });
  return NextResponse.json(result);
}
