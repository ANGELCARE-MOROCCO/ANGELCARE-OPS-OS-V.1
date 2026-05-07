import { NextResponse } from 'next/server';
import { listDrafts, listMailboxes, listThreads } from '@/lib/email-os/v15/store';
import { productionBlockers } from '@/lib/email-os/v15/env';

export async function GET() {
  const [mailboxes, threads, drafts] = await Promise.all([listMailboxes(), listThreads(), listDrafts()]);
  return NextResponse.json({ mailboxes, threads, drafts, blockers: productionBlockers() });
}
