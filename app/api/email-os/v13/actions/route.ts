import { NextRequest, NextResponse } from 'next/server';
import { logEmailAudit, queueDraftSend, retryQueueJobs, updateThreadAction } from '@/lib/email-os/v13/store';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.type === 'thread') return NextResponse.json({ result: await updateThreadAction(body.threadIds || [], body.action, body.value) });
  if (body.type === 'queue-retry') return NextResponse.json({ result: await retryQueueJobs(body.jobIds || []) });
  if (body.type === 'queue-draft') return NextResponse.json({ result: await queueDraftSend(body.draftId) });
  const audit = await logEmailAudit(body.actor || 'Email OS', body.action || 'Unknown action', body.targetType || 'system', body.targetId || 'manual', body.result || 'completed', body.metadata || {});
  return NextResponse.json({ audit });
}
