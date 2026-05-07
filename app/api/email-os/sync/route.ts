import { NextRequest, NextResponse } from 'next/server'
import { getAccountByEmail, listAccounts } from '@/lib/email-os/accounts'
import { syncMailbox } from '@/lib/email-os/imap'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type EmailAccount = {
  email_address?: string | null
  receive_enabled?: boolean | null
  [key: string]: unknown
}

type SyncMailboxOptions = Record<string, unknown>

function ok(data: unknown) {
  return NextResponse.json({ ok: true, data })
}

function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error)
  return NextResponse.json({ ok: false, error: message }, { status })
}

function normalizeLimit(value: unknown) {
  const parsed = Number(value || 25)
  if (!Number.isFinite(parsed) || parsed <= 0) return 25
  return Math.min(Math.floor(parsed), 100)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const limit = normalizeLimit(body.limit)

    if (body.email) {
      const account = await getAccountByEmail(String(body.email))
      return ok(await syncMailbox(account as Record<string, unknown>, { limit } as SyncMailboxOptions))
    }

    const accounts = (await listAccounts()) as EmailAccount[]
    const results: Array<Record<string, unknown>> = []

    for (const account of accounts.filter((item) => Boolean(item.receive_enabled))) {
      try {
        const syncResult = await syncMailbox(account as Record<string, unknown>, { limit } as SyncMailboxOptions)

        results.push({
          email: account.email_address || 'unknown',
          ...syncResult,
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)

        results.push({
          email: account.email_address || 'unknown',
          error: message,
        })
      }
    }

    return ok(results)
  } catch (error: unknown) {
    return fail(error)
  }
}