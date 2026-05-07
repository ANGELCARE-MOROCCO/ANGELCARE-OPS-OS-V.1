import { NextRequest, NextResponse } from 'next/server';
import { getEmailOsSnapshot, logEmailAudit } from '@/lib/email-os/v13/store';
export const runtime = 'nodejs';
export async function GET() { const s = await getEmailOsSnapshot(); return NextResponse.json({ audit: s.audit }); }
export async function POST(req: NextRequest) { const b = await req.json(); return NextResponse.json({ audit: await logEmailAudit(b.actor || 'Email OS', b.action || 'Manual audit', b.targetType || 'system', b.targetId || 'manual', b.result || 'completed', b.metadata || {}) }); }
