import { NextResponse } from 'next/server';
import { getAmbassadorEnvStatus } from '@/lib/ambassadors/final/env';

export async function GET() {
  const env = getAmbassadorEnvStatus();
  const missingRequired = env.filter((item) => item.required && !item.present);
  return NextResponse.json({ ok: missingRequired.length === 0, env, missingRequired });
}
