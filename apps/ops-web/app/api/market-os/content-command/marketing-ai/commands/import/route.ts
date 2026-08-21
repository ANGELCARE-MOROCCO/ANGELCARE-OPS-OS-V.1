import { governRoute } from '@/lib/runtime/governor/route'
import crypto from 'node:crypto'
import { NextResponse } from 'next/server'
import { apiErrorResponse, requireMarketingAiUser } from '@/lib/market-os/marketing-ai/auth'
import { parseMarketingAiCommandCsv } from '@/lib/market-os/marketing-ai/csv'
import { ensureMarketingAiSkillsForCommands, upsertMarketingAiCommands } from '@/lib/market-os/marketing-ai/repository'
import { createContentCommandSupabaseServerClient } from '@/lib/market-os/content-command/db/supabase-server'

async function POST__angelcareGovernedImpl(request: Request) {
  try {
    const actor = await requireMarketingAiUser('import')
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: 'CSV_FILE_REQUIRED' }, { status: 400 })
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ ok: false, error: 'CSV_FILE_TOO_LARGE' }, { status: 413 })
    const text = await file.text()
    const parsed = parseMarketingAiCommandCsv(text)
    const createdSkills = parsed.commands.length ? await ensureMarketingAiSkillsForCommands(parsed.commands) : []
    const imported = parsed.commands.length ? await upsertMarketingAiCommands(parsed.commands, actor.id) : []
    const checksum = crypto.createHash('sha256').update(text).digest('hex')
    await createContentCommandSupabaseServerClient().from('market_ai_csv_imports').insert({ actor_id: actor.id, filename: file.name, checksum, accepted_count: imported.length, rejected_count: parsed.rejected, errors: parsed.errors })
    return NextResponse.json({ ok: true, accepted: imported.length, rejected: parsed.rejected, errors: parsed.errors, checksum, createdSkills: createdSkills.length })
  } catch (error) { return apiErrorResponse(error) }
}

export const POST = governRoute(
  {
    workloadClass: 'ai',
    operation: 'POST:/api/market-os/content-command/marketing-ai/commands/import',
  },
  POST__angelcareGovernedImpl,
)
