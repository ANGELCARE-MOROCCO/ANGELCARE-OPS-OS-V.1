
import { NextRequest } from 'next/server'
import { executeBrandOperation, loadBrandGovernanceSnapshot, uploadBrandAsset } from '@/lib/angelcare360/operator/branding'
import { operatorJson, operatorRouteError, readOperatorBody } from '../_shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    return operatorJson({ ok: true, snapshot: await loadBrandGovernanceSnapshot({ clientId: request.nextUrl.searchParams.get('clientId') }) })
  } catch (error) { return operatorRouteError(error) }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file')
      if (!(file instanceof File)) return operatorJson({ ok: false, error: 'Fichier logo requis.' }, 422)
      const result = await uploadBrandAsset({
        profileId: String(form.get('profileId') || ''),
        assetType: String(form.get('assetType') || 'logo'),
        fileName: file.name,
        mimeType: file.type,
        buffer: Buffer.from(await file.arrayBuffer()),
      })
      return operatorJson(result, result.ok ? 200 : 422)
    }
    const body = await readOperatorBody<{ operation?: string; payload?: Record<string, unknown> }>(request)
    if (!body?.operation) return operatorJson({ ok: false, error: 'Opération Brand Governance manquante.' }, 422)
    const result = await executeBrandOperation(body.operation, body.payload || {}) as { ok?: boolean }
    return operatorJson(result, result.ok === false ? 422 : 200)
  } catch (error) { return operatorRouteError(error) }
}
