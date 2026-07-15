import { NextResponse } from 'next/server';
import { listAmbassadorProfiles } from '@/lib/ambassadors/final/repositories';

export async function GET() {
  const result = await listAmbassadorProfiles();
  if (!result.ok) return NextResponse.json(result, { status: 500 });
  return NextResponse.json(result);
}
