import { NextResponse } from 'next/server';
import { getEmailOsSnapshot } from '@/lib/email-os/v13/store';
export const runtime = 'nodejs';
export async function GET() { return NextResponse.json(await getEmailOsSnapshot()); }
