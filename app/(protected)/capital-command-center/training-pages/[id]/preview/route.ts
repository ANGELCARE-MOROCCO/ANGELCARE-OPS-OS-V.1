import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> | { id: string } }

function escapeHtml(value: any) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function wrapHtmlFragment(fragment: string, title: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body{margin:0;font-family:Inter,Arial,sans-serif;background:#f8fafc;color:#0f172a}
    .training-fragment-shell{max-width:1200px;margin:0 auto;padding:28px}
  </style>
</head>
<body>
  <main class="training-fragment-shell">
    ${fragment}
  </main>
</body>
</html>`
}

function ensureRenderableHtml(html: string, title: string) {
  const source = String(html || '').trim()
  if (!source) {
    return wrapHtmlFragment(
      `<section style="background:white;border:1px solid #e2e8f0;border-radius:24px;padding:32px"><p style="letter-spacing:.14em;text-transform:uppercase;color:#2563eb;font-weight:900">Training page</p><h1>${escapeHtml(title)}</h1><p>No HTML content has been saved for this training page yet.</p></section>`,
      title,
    )
  }

  if (/<!doctype|<html[\s>]/i.test(source)) return source
  return wrapHtmlFragment(source, title)
}

export async function GET(_request: NextRequest, context: Ctx) {
  const { id } = await context.params
  const recordId = Number(id)
  if (!Number.isFinite(recordId)) {
    return new Response('Invalid training page id', { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('capital_training_pages')
    .select('id, training_title, html_content, publish_status, status, archived')
    .eq('id', recordId)
    .maybeSingle()

  if (error) return new Response(error.message, { status: 500 })
  if (!data || data.archived) return new Response('Training page not found', { status: 404 })

  const title = data.training_title || `Training page ${recordId}`
  const html = ensureRenderableHtml(data.html_content || '', title)

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
      'content-security-policy': "sandbox allow-scripts allow-forms allow-popups allow-downloads; base-uri 'none'; frame-ancestors 'self'",
    },
  })
}
