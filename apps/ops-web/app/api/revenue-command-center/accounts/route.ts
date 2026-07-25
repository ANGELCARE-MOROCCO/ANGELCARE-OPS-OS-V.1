import {
  fail,
  logRevenueAction,
  logRevenueActivity,
  ok,
  revenueClient,
} from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess, revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { normalizeAccountPayload } from "@/lib/revenue-command-center/enterprise-server"

export async function GET(request: Request) {
  try {
    await requireRevenueApiAccess(["revenue.accounts.read", "revenue.prospects.read"])
    const supabase = await revenueClient()
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || "").trim()
    const status = searchParams.get("status")
    const limit = Math.min(Number(searchParams.get("limit") || 500), 2500)

    let query = supabase
      .from("revenue_accounts")
      .select("*")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (status && status !== "all") query = query.eq("status", status)
    if (q) {
      const escaped = q.replace(/[%_,]/g, " ").trim()
      query = query.or(`account_name.ilike.%${escaped}%,legal_name.ilike.%${escaped}%,domain.ilike.%${escaped}%,city.ilike.%${escaped}%`)
    }

    const { data, error } = await query
    if (error) return fail(error)
    return ok({ accounts: data || [], source: "revenue_accounts" })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireRevenueApiAccess("revenue.accounts.manage")
    const supabase = await revenueClient()
    const body = await request.json()
    const payload = normalizeAccountPayload(body)
    const { data, error } = await supabase
      .from("revenue_accounts")
      .insert({ ...payload, created_by: (access.user as any).id || null, updated_by: (access.user as any).id || null })
      .select("*")
      .single()
    if (error) return fail(error)

    await logRevenueActivity(supabase, {
      entityType: "account",
      entityId: data.id,
      eventType: "account_created",
      title: `Compte créé : ${data.account_name}`,
      metadata: { source: "accounts_api" },
    })
    await logRevenueAction(supabase, {
      actionType: "create_account",
      entityType: "account",
      entityId: data.id,
      payload: body,
      result: { id: data.id },
    })
    return ok({ account: data })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireRevenueApiAccess("revenue.accounts.manage")
    const supabase = await revenueClient()
    const body = await request.json()
    const id = String(body.id || "").trim()
    if (!id) return fail("Identifiant du compte requis.", 400)

    const { data: existing, error: readError } = await supabase.from("revenue_accounts").select("*").eq("id", id).maybeSingle()
    if (readError) return fail(readError)
    if (!existing) return fail("Compte introuvable.", 404)

    const payload = normalizeAccountPayload({ ...existing, ...body })
    const archive = body.action === "archive"
    const restore = body.action === "restore"
    const patch: Record<string, unknown> = {
      ...payload,
      updated_by: (access.user as any).id || null,
      updated_at: new Date().toISOString(),
    }
    if (archive) {
      patch.status = "archived"
      patch.archived_at = new Date().toISOString()
    }
    if (restore) {
      patch.status = "active"
      patch.archived_at = null
    }

    const { data, error } = await supabase.from("revenue_accounts").update(patch).eq("id", id).select("*").single()
    if (error) return fail(error)

    if (existing.status !== data.status || existing.lifecycle_stage !== data.lifecycle_stage) {
      await supabase.from("revenue_account_status_history").insert({
        account_id: id,
        from_status: existing.status,
        to_status: data.status,
        from_lifecycle_stage: existing.lifecycle_stage,
        to_lifecycle_stage: data.lifecycle_stage,
        reason: String(body.reason || "Mise à jour Revenue Command"),
        changed_by: (access.user as any).id || null,
        changed_by_name: (access.user as any).email || (access.user as any).full_name || "Revenue Command",
        metadata: { source: "accounts_api" },
      })
    }

    await logRevenueActivity(supabase, {
      entityType: "account",
      entityId: id,
      eventType: archive ? "account_archived" : restore ? "account_restored" : "account_updated",
      title: archive ? `Compte archivé : ${data.account_name}` : restore ? `Compte restauré : ${data.account_name}` : `Compte mis à jour : ${data.account_name}`,
      severity: archive ? "warning" : "info",
      metadata: { fields: Object.keys(body) },
    })
    await logRevenueAction(supabase, {
      actionType: archive ? "archive_account" : restore ? "restore_account" : "update_account",
      entityType: "account",
      entityId: id,
      payload: body,
      result: { id },
    })
    return ok({ account: data })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
