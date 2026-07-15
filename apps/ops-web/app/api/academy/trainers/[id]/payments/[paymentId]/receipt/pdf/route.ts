import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AnyRecord = Record<string, any>
type RouteContext = { params: Promise<{ id: string; paymentId: string }> | { id: string; paymentId: string } }

function uuidLike(value: any) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '')) }
function esc(value: any) { return String(value ?? '—').replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch] || ch)) }
function money(value: any) { return `${Number(value || 0).toLocaleString('fr-MA')} Dhs` }
function safeName(value: any) { return String(value || 'trainer-payment-receipt').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'trainer-payment-receipt' }

async function safeSingle<T = any>(builder: PromiseLike<{ data: T | null; error: any }>) {
  try { const { data, error } = await builder; if (error) return null; return data } catch { return null }
}

async function launchAcademyReceiptBrowser() {
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_REGION)
  if (isVercel) {
    const chromiumServerless = (await import('@sparticuz/chromium')).default
    const puppeteer = await import('puppeteer-core')
    return puppeteer.launch({
      args: chromiumServerless.args,
      defaultViewport: { width: 1200, height: 1600 },
      executablePath: await (async () => {
        const fs = await import('node:fs')
        const path = await import('node:path')
        const binPath = path.join(process.cwd(), 'node_modules/@sparticuz/chromium/bin')
        if (fs.existsSync(binPath)) {
          return chromiumServerless.executablePath(binPath)
        }
        return chromiumServerless.executablePath()
      })(),
      headless: true,
    })
  }
  const { chromium } = await import('playwright')
  return chromium.launch({ headless: true })
}

async function applyPrintMedia(page: any) {
  if (typeof page.emulateMedia === 'function') return page.emulateMedia({ media: 'print' })
  if (typeof page.emulateMediaType === 'function') return page.emulateMediaType('print')
}

async function setReceiptContent(page: any, html: string) {
  if (process.env.VERCEL || process.env.AWS_REGION) {
    await setReceiptContent(page, html)
    return
  }
  await page.setContent(html, { waitUntil: 'networkidle', timeout: 30000 })
}

function pdfBody(pdf: Uint8Array | Buffer): BodyInit {
  return Buffer.from(pdf) as unknown as BodyInit
}

function receiptHtml({ trainer, payment, cohort }: { trainer: AnyRecord; payment: AnyRecord; cohort: AnyRecord | null }) {
  const generatedAt = new Date().toLocaleString('en-GB')
  const reference = payment.reference_number || payment.payment_reference || `TRP-${payment.id}`
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Arial, Helvetica, sans-serif; color:#0f172a; background:#fff; }
    .sheet { border:1px solid #dbe3f0; border-radius:22px; overflow:hidden; min-height: 270mm; }
    .header { display:flex; justify-content:space-between; gap:24px; padding:28px 32px; border-bottom:1px solid #e6edf7; background:linear-gradient(135deg,#f8fbff,#eef6ff); }
    .brand { display:flex; gap:16px; align-items:center; }
    .mark { width:58px; height:58px; border-radius:18px; background:#2563eb; color:#fff; display:grid; place-items:center; font-weight:900; font-size:28px; }
    h1 { margin:0; font-size:26px; letter-spacing:-.04em; }
    .sub { margin-top:6px; color:#64748b; font-size:13px; font-weight:700; }
    .ref { text-align:right; border:1px solid #cbd5e1; border-radius:16px; padding:14px 18px; background:#fff; min-width:240px; }
    .label { font-size:10px; text-transform:uppercase; letter-spacing:.16em; color:#64748b; font-weight:900; }
    .value { margin-top:6px; font-weight:900; font-size:17px; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap:16px; padding:24px 32px; }
    .card { border:1px solid #e2e8f0; border-radius:18px; padding:18px; background:#fff; }
    .card h2 { margin:0 0 14px; font-size:15px; text-transform:uppercase; letter-spacing:.12em; color:#1d4ed8; }
    .row { display:flex; justify-content:space-between; gap:18px; padding:9px 0; border-bottom:1px solid #edf2f7; font-size:13px; }
    .row:last-child { border-bottom:0; }
    .row span:first-child { color:#64748b; font-weight:800; }
    .row span:last-child { color:#0f172a; font-weight:900; text-align:right; }
    .amount { margin:0 32px 18px; border-radius:22px; padding:22px; background:linear-gradient(135deg,#ecfdf5,#eff6ff); border:1px solid #bfdbfe; display:flex; justify-content:space-between; align-items:center; }
    .amount strong { font-size:34px; color:#047857; }
    .note { margin:0 32px 24px; border:1px dashed #cbd5e1; border-radius:18px; padding:18px; color:#334155; font-size:13px; }
    .footer { margin: 0 32px 28px; padding-top:18px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; color:#64748b; font-size:11px; font-weight:800; }
    .badge { display:inline-block; border-radius:999px; padding:6px 10px; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:900; text-transform:uppercase; }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="header">
      <div class="brand"><div class="mark">A</div><div><h1>Trainer Payment Receipt</h1><div class="sub">AngelCare Academy OS · Enterprise finance record</div></div></div>
      <div class="ref"><div class="label">Payment Reference</div><div class="value">${esc(reference)}</div><div class="sub">Audit: ${esc(payment.audit_code)}</div></div>
    </section>
    <section class="amount"><div><div class="label">Receipt Amount</div><strong>${esc(money(payment.amount_dhs))}</strong></div><span class="badge">${esc(payment.status || 'pending')}</span></section>
    <section class="grid">
      <div class="card"><h2>Trainer</h2>
        <div class="row"><span>Name</span><span>${esc(trainer.full_name || trainer.name)}</span></div>
        <div class="row"><span>Code</span><span>${esc(trainer.trainer_code || trainer.id)}</span></div>
        <div class="row"><span>Email</span><span>${esc(trainer.email)}</span></div>
        <div class="row"><span>Phone</span><span>${esc(trainer.mobile || trainer.phone)}</span></div>
      </div>
      <div class="card"><h2>Cohort & Program</h2>
        <div class="row"><span>Cohort</span><span>${esc(payment.cohort_reference || cohort?.reference_number)}</span></div>
        <div class="row"><span>Title</span><span>${esc(payment.cohort_title || cohort?.title)}</span></div>
        <div class="row"><span>Program</span><span>${esc(payment.program_title || cohort?.program_title)}</span></div>
        <div class="row"><span>Dates</span><span>${esc(cohort?.start_date)} → ${esc(cohort?.end_date)}</span></div>
      </div>
      <div class="card"><h2>Compensation</h2>
        <div class="row"><span>Model</span><span>${esc(payment.compensation_model_label || payment.label)}</span></div>
        <div class="row"><span>Participant Tier</span><span>${esc(payment.participant_tier || 'Manual / not set')}</span></div>
        <div class="row"><span>Manual Override</span><span>${payment.manual_override ? 'Yes' : 'No'}</span></div>
        <div class="row"><span>Audit Code</span><span>${esc(payment.audit_code)}</span></div>
      </div>
      <div class="card"><h2>Payment</h2>
        <div class="row"><span>Due Date</span><span>${esc(payment.due_date)}</span></div>
        <div class="row"><span>Paid Date</span><span>${esc(payment.paid_date || payment.paid_at)}</span></div>
        <div class="row"><span>Method</span><span>${esc(payment.payment_method)}</span></div>
        <div class="row"><span>Details</span><span>${esc(payment.payment_details)}</span></div>
      </div>
    </section>
    <div class="note"><strong>Finance note:</strong> ${esc(payment.finance_note || payment.rejected_reason || 'No finance note recorded.')}</div>
    <footer class="footer"><span>Generated at ${esc(generatedAt)} by Academy OS</span><span>AngelCare Academy OS · Financial Tracking</span></footer>
  </main>
</body>
</html>`
}

export async function GET(_request: NextRequest, context: RouteContext) {
  let browser: any = null
  try {
    const params = await context.params
    const trainerId = String(params.id || '').trim()
    const paymentId = String(params.paymentId || '').trim()
    if (!uuidLike(trainerId) || !uuidLike(paymentId)) return NextResponse.json({ ok: false, error: 'Valid trainer/payment UUID is required' }, { status: 400 })

    const supabase = await createClient()
    const [trainer, payment] = await Promise.all([
      safeSingle<AnyRecord>(supabase.from('academy_trainers').select('*').eq('id', trainerId).maybeSingle()),
      safeSingle<AnyRecord>(supabase.from('academy_trainer_payments').select('*').eq('id', paymentId).eq('trainer_id', trainerId).maybeSingle()),
    ])
    if (!trainer) return NextResponse.json({ ok: false, error: 'Trainer not found' }, { status: 404 })
    if (!payment) return NextResponse.json({ ok: false, error: 'Payment not found' }, { status: 404 })

    const cohort = payment.cohort_id
      ? await safeSingle<AnyRecord>(supabase.from('academy_cohorts').select('*').eq('id', payment.cohort_id).maybeSingle())
      : null

    const html = receiptHtml({ trainer, payment, cohort })
    browser = await launchAcademyReceiptBrowser()
    const page = await browser.newPage()
    await setReceiptContent(page, html)
    await applyPrintMedia(page)
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' } })
    const filename = `${safeName(payment.reference_number || payment.payment_reference || payment.id)}.pdf`
    return new Response(pdfBody(pdf), { status: 200, headers: { 'content-type': 'application/pdf', 'content-disposition': `inline; filename=\"${filename}}\"`, 'cache-control': 'no-store' } })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Unable to generate trainer payment receipt' }, { status: 500 })
  } finally {
    if (browser) await browser.close().catch(() => null)
  }
}
