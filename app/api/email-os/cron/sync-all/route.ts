import { NextRequest, NextResponse } from 'next/server'
import { listAccounts } from '@/lib/email-os/accounts'
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

function getLimit(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('limit')
  const parsed = Number(raw || 20)

  if (!Number.isFinite(parsed) || parsed <= 0) return 20
  return Math.min(Math.floor(parsed), 100)
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    if (process.env.EMAIL_OS_CRON_SECRET && token !== process.env.EMAIL_OS_CRON_SECRET) {
      return fail('Invalid cron token', 401)
    }

    const limit = getLimit(req)
    const accounts = (await listAccounts()) as EmailAccount[]
    const activeAccounts = accounts.filter((account) => Boolean(account.receive_enabled))
    const results: Array<Record<string, unknown>> = []

    for (const account of activeAccounts) {
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