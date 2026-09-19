import { requireMarketplaceWorkspaceApiContext } from '../auth/context'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '../server/request'
import { latestThemeStudioDraft, publishThemeStudioDocument, restoreThemeStudioVersion, saveThemeStudioDraft } from './repository'

export async function handleThemeStudio(request: Request): Promise<Response> {
  const rid = requestId(request)
  try {
    if (request.method === 'GET') {
      await requireMarketplaceWorkspaceApiContext('homepage.theme-studio', 'marketplace.homepage.view')
      const url = new URL(request.url)
      const rawLocale = url.searchParams.get('locale')
      const locale = rawLocale === 'en' || rawLocale === 'ar' ? rawLocale : 'fr'
      return apiSuccess(await latestThemeStudioDraft(locale), { requestId: rid })
    }
    const context = await requireMarketplaceWorkspaceApiContext('homepage.theme-studio', 'marketplace.homepage.manage')
    const body = await parseJsonObject(request)
    if (body.action === 'save_draft') return apiSuccess(await saveThemeStudioDraft(body.document, context, rid, request), { requestId: rid, status: 201 })
    if (body.action === 'publish') return apiSuccess(await publishThemeStudioDocument(body.document, context, rid, request), { requestId: rid, status: 201 })
    if (body.action === 'restore') return apiSuccess(await restoreThemeStudioVersion(String(body.versionId || ''), context, rid, request), { requestId: rid, status: 201 })
    return apiFailure(new Error('Action Theme Studio inconnue.'), rid)
  } catch (error) {
    return apiFailure(error, rid)
  }
}
