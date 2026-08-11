import { requireSocialCommandActor, socialError, socialOk } from "@/lib/social-command/auth"
import { cleanString } from "@/lib/social-command/db"
import { createSavedView, deleteSavedView, getExecutionJobDossier, listOperatorExperience, saveOperatorPreferences, updateSavedView } from "@/lib/social-command/operator-experience"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"
type Ctx = { params: Promise<{ segments: string[] }> }
const key = (segments: string[]) => segments.join("/")
async function input(request: Request) { return request.json().catch(() => ({})) as Promise<Record<string, unknown>> }

export async function GET(_request: Request, ctx: Ctx) {
  const { segments = [] } = await ctx.params
  const route = key(segments)
  try {
    const auth = await requireSocialCommandActor(); if (!auth.ok) return auth.response
    if (route === "bootstrap") return socialOk(await listOperatorExperience(auth.actor))
    if (/^jobs\/[^/]+\/dossier$/.test(route)) return socialOk(await getExecutionJobDossier(segments[1], auth.actor))
    return socialError(new Error("OPERATOR_EXPERIENCE_ROUTE_NOT_FOUND"), 404)
  } catch (error) { return socialError(error, 400) }
}

export async function POST(request: Request, ctx: Ctx) {
  const { segments = [] } = await ctx.params
  const route = key(segments)
  try {
    const auth = await requireSocialCommandActor(); if (!auth.ok) return auth.response
    const body = await input(request)
    if (route === "views") return socialOk(await createSavedView(body, auth.actor), { status: 201 })
    if (route === "preferences") return socialOk(await saveOperatorPreferences(body, auth.actor))
    return socialError(new Error("OPERATOR_EXPERIENCE_ROUTE_NOT_FOUND"), 404)
  } catch (error) { return socialError(error, 400) }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { segments = [] } = await ctx.params
  const route = key(segments)
  try {
    const auth = await requireSocialCommandActor(); if (!auth.ok) return auth.response
    const body = await input(request)
    if (/^views\/[^/]+$/.test(route)) return socialOk(await updateSavedView(cleanString(segments[1], 120), body, auth.actor))
    return socialError(new Error("OPERATOR_EXPERIENCE_ROUTE_NOT_FOUND"), 404)
  } catch (error) { return socialError(error, 400) }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { segments = [] } = await ctx.params
  const route = key(segments)
  try {
    const auth = await requireSocialCommandActor(); if (!auth.ok) return auth.response
    if (/^views\/[^/]+$/.test(route)) return socialOk(await deleteSavedView(cleanString(segments[1], 120), auth.actor))
    return socialError(new Error("OPERATOR_EXPERIENCE_ROUTE_NOT_FOUND"), 404)
  } catch (error) { return socialError(error, 400) }
}
