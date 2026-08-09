
import { resolveBrandRuntime } from '@/lib/angelcare360/operator/branding'

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] || character)) }

export async function renderAngelcare360BrandedEmail(input: { subject: string; body: string; bodyHtml?: string | null; clientId?: string | null; tenantId?: string | null }) {
  const runtime = await resolveBrandRuntime({ clientId: input.clientId, tenantId: input.tenantId }).catch(() => null)
  const official = runtime?.officialLogoUrl || '/brand/angelcare-official.webp'
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const absolute = (path: string) => path.startsWith('http') ? path : `${appUrl}${path}`
  const mode = runtime?.resolvedMode || 'angelcare_only'
  const customerLogo = runtime?.logoUrl ? absolute(runtime.logoUrl) : null
  const header = mode === 'angelcare_only' || !customerLogo
    ? `<img src="${absolute(official)}" alt="AngelCare" style="max-width:160px;max-height:70px;object-fit:contain">`
    : mode === 'white_label'
      ? `<img src="${customerLogo}" alt="${escapeHtml(runtime?.brandName || 'Customer')}" style="max-width:180px;max-height:70px;object-fit:contain">`
      : `<div style="display:flex;align-items:center;gap:18px"><img src="${absolute(official)}" alt="AngelCare" style="max-width:130px;max-height:62px;object-fit:contain"><span style="width:1px;height:44px;background:#dbe3ed"></span><img src="${customerLogo}" alt="${escapeHtml(runtime?.brandName || 'Customer')}" style="max-width:150px;max-height:62px;object-fit:contain"></div>`
  const bodyHtml = input.bodyHtml || escapeHtml(input.body).replace(/\n/g, '<br>')
  return { runtime, html: `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#172033"><div style="max-width:680px;margin:28px auto;background:#fff;border:1px solid #dfe7f0;border-radius:20px;overflow:hidden"><header style="padding:24px 28px;background:linear-gradient(135deg,#fff,#edf4ff)">${header}</header><main style="padding:30px 28px"><h1 style="font-size:22px;margin:0 0 18px;color:${runtime?.primaryColor || '#0b1f4d'}">${escapeHtml(input.subject)}</h1><div style="font-size:15px;line-height:1.7">${bodyHtml}</div></main><footer style="padding:18px 28px;background:#0b1f4d;color:#dbe7f7;font-size:11px">${escapeHtml(runtime?.footerText || 'Powered and operated by AngelCare.')}</footer></div></body></html>` }
}
