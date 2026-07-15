import { NextResponse } from 'next/server';
import { listAmbassadorPayouts } from '@/lib/ambassadors/final/repositories';

export async function GET() {
  const result = await listAmbassadorPayouts();
  if (!result.ok) return NextResponse.json(result, { status: 500 });
  return NextResponse.json(result);
}
