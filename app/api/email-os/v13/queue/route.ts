import { NextRequest, NextResponse } from 'next/server';
import { getEmailOsSnapshot, retryQueueJobs } from '@/lib/email-os/v13/store';
export const runtime = 'nodejs';
export async function GET() { const s = await getEmailOsSnapshot(); return NextResponse.json({ queue: s.queue }); }
export async function POST(req: NextRequest) { const { jobIds } = await req.json(); return NextResponse.json({ queue: await retryQueueJobs(jobIds || []) }); }
