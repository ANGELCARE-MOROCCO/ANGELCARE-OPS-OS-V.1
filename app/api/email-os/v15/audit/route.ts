import { NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/email-os/v15/audit';
export async function GET() { return NextResponse.json({ status: 'ok', data: await listAuditLogs() }); }
