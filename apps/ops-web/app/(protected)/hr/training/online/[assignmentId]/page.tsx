import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function s(value: unknown) {
  return String(value ?? '').trim()
}

function extractLine(message: string, key: string) {
  const line = message.split('\n').find((item) => item.toLowerCase().startsWith(`${key.toLowerCase()}:`))
  return line ? line.split(':').slice(1).join(':').trim() : ''
}

async function completeOnlineTrainingAction(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const memoId = s(formData.get('memo_id'))
  const score = Math.max(0, Math.min(100, Number(formData.get('score_percent') || 100) || 100))
  const evidence = s(formData.get('evidence_notes'))
  const confirmation = s(formData.get('employee_confirmation'))
  const now = new Date().toISOString()

  if (memoId) {
    try {
      const { data: memo } = await supabase
        .from('workspace_broadcast_memos')
        .select('message')
        .eq('id', memoId)
        .maybeSingle()

      const oldMessage = s((memo as any)?.message)
      const updatedMessage = [
        oldMessage,
        '',
        '--- TRAINING COMPLETION ---',
        `STATUS: completed`,
        `SCORE: ${score}%`,
        `COMPLETED_AT: ${now}`,
        evidence ? `EVIDENCE: ${evidence}` : '',
        confirmation ? `CONFIRMATION: ${confirmation}` : '',
      ].filter(Boolean).join('\n')

      await supabase
        .from('workspace_broadcast_memos')
        .update({ message: updatedMessage, status: 'completed', updated_at: now })
        .eq('id', memoId)
    } catch {
      try {
        await supabase
          .from('workspace_broadcast_memos')
          .update({ status: 'completed' })
          .eq('id', memoId)
      } catch {}
    }
  }

  redirect(`/hr/training/online/${memoId}?submitted=1`)
}

export default async function OnlineTrainingPage({
  params,
  searchParams,
}: {
  params: Promise<{ assignmentId: string }> | { assignmentId: string }
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>
}) {
  const { assignmentId } = await Promise.resolve(params)
  const sp = await Promise.resolve(searchParams || {})
  const submitted = Boolean((sp as Record<string, unknown>).submitted)

  const supabase = await createClient()

  const { data: memo } = await supabase
    .from('workspace_broadcast_memos')
    .select('id,title,message,priority,status,created_at')
    .eq('id', assignmentId)
    .maybeSingle()

  const message = s((memo as any)?.message)
  const title = s((memo as any)?.title) || 'Formation AngelCare'
  const courseTitle = title.replace('Formation assignée · ', '')
  const employeeName = extractLine(message, 'EMPLOYEE') || 'Collaborateur'
  const positionTitle = extractLine(message, 'Poste') || 'Poste'
  const passScore = Number((extractLine(message, 'Score cible') || '75').replace('%', '')) || 75

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-600">AngelCare HR online training</p>
              <h1 className="mt-2 text-3xl font-black">{courseTitle}</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">{employeeName} · {positionTitle} · pass score {passScore}%</p>
            </div>
            <Link href="/hr/training" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Back to Training</Link>
          </div>
        </header>

        {submitted ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-800">
            Training submitted and synced inside the broadcast training record.
          </div>
        ) : null}

        <form action={completeOnlineTrainingAction} className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl">
          <input type="hidden" name="memo_id" value={assignmentId} />

          <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-violet-50 p-8">
            <h2 className="text-xl font-black">Online training assignment</h2>
            <p className="mt-2 whitespace-pre-line text-sm font-bold text-slate-600">{message || 'Training details unavailable.'}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Evidence / notes</span>
                <textarea name="evidence_notes" className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Employee confirmation</span>
                <textarea name="employee_confirmation" className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold" />
              </label>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto]">
            <label>
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Final score</span>
              <input name="score_percent" type="number" defaultValue={100} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-black" />
            </label>
            <button className="self-end rounded-2xl bg-violet-600 px-6 py-4 text-sm font-black text-white">Submit course completion</button>
          </div>
        </form>
      </div>
    </main>
  )
}
