import { fail, logRevenueAction, logRevenueActivity, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess, revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { optionalSelect, optionalSingle } from "@/lib/revenue-command-center/enterprise-server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRevenueApiAccess("revenue.prospects.read")
    const { id } = await params
    const supabase = await revenueClient()

    const prospectResult = await supabase.from("revenue_prospects").select("*").eq("id", id).maybeSingle()
    if (prospectResult.error) return fail(prospectResult.error)
    if (!prospectResult.data) return fail("Prospect introuvable.", 404)
    const prospect: any = prospectResult.data

    const [accountResult, primaryContactResult, contactsResult, opportunitiesResult, tasksResult, appointmentsResult, activitiesResult, decisionMapResult, qualificationResult, accountRisksResult, accountPlansResult] = await Promise.all([
      prospect.account_id
        ? optionalSingle(supabase as any, "revenue_accounts", "*", (query) => query.eq("id", prospect.account_id))
        : Promise.resolve({ data: null, available: true }),
      prospect.contact_id
        ? optionalSingle(supabase as any, "revenue_contacts", "*", (query) => query.eq("id", prospect.contact_id))
        : Promise.resolve({ data: null, available: true }),
      optionalSelect(supabase as any, "revenue_contacts", "*", (query) => prospect.account_id ? query.eq("account_id", prospect.account_id).order("updated_at", { ascending: false }) : query.eq("id", "00000000-0000-0000-0000-000000000000")),
      optionalSelect(supabase as any, "revenue_opportunities", "*", (query) => query.eq("prospect_id", id).order("updated_at", { ascending: false })),
      optionalSelect(supabase as any, "revenue_tasks", "*", (query) => query.or(`prospect_id.eq.${id},and(entity_type.eq.prospect,entity_id.eq.${id})`).order("updated_at", { ascending: false })),
      optionalSelect(supabase as any, "revenue_appointments", "*", (query) => query.or(`prospect_id.eq.${id},and(entity_type.eq.prospect,entity_id.eq.${id})`).order("appointment_at", { ascending: false })),
      optionalSelect(supabase as any, "revenue_activities", "*", (query) => query.or(`prospect_id.eq.${id},and(entity_type.eq.prospect,entity_id.eq.${id})`).order("created_at", { ascending: false }).limit(250)),
      optionalSelect(supabase as any, "revenue_decision_map_members", "*, revenue_contacts(*)", (query) => query.eq("prospect_id", id).eq("status", "active").order("influence_score", { ascending: false })),
      optionalSelect(supabase as any, "revenue_qualification_assessments", "*", (query) => query.eq("prospect_id", id).order("assessed_at", { ascending: false }).limit(20)),
      optionalSelect(supabase as any, "revenue_account_risks", "*", (query) => query.or(`prospect_id.eq.${id}${prospect.account_id ? `,account_id.eq.${prospect.account_id}` : ""}`).order("created_at", { ascending: false })),
      prospect.account_id
        ? optionalSelect(supabase as any, "revenue_account_plans", "*", (query) => query.eq("account_id", prospect.account_id).order("updated_at", { ascending: false }))
        : Promise.resolve({ data: [], available: true }),
    ])

    const opportunityIds = opportunitiesResult.data.map((opportunity: any) => opportunity.id).filter(Boolean)
    const [stageHistoryResult, participantsResult, opportunityRisksResult, competitorsResult] = opportunityIds.length
      ? await Promise.all([
          optionalSelect(supabase as any, "revenue_opportunity_stage_history", "*", (query) => query.in("opportunity_id", opportunityIds).order("changed_at", { ascending: false })),
          optionalSelect(supabase as any, "revenue_opportunity_participants", "*, revenue_contacts(*)", (query) => query.in("opportunity_id", opportunityIds)),
          optionalSelect(supabase as any, "revenue_opportunity_risks", "*", (query) => query.in("opportunity_id", opportunityIds).order("created_at", { ascending: false })),
          optionalSelect(supabase as any, "revenue_opportunity_competitors", "*", (query) => query.in("opportunity_id", opportunityIds).order("updated_at", { ascending: false })),
        ])
      : [
          { data: [], available: true },
          { data: [], available: true },
          { data: [], available: true },
          { data: [], available: true },
        ]

    const contacts = [primaryContactResult.data, ...contactsResult.data]
      .filter(Boolean)
      .filter((contact: any, index: number, list: any[]) => list.findIndex((candidate) => candidate.id === contact.id) === index)
      .filter((contact: any) => !contact.archived_at && contact.status !== "archived")
    const opportunities = opportunitiesResult.data.filter((item: any) => !item.archived_at && item.status !== "archived")

    return ok({
      dossier: {
        prospect,
        account: accountResult.data,
        primaryContact: primaryContactResult.data,
        contacts,
        opportunities,
        tasks: tasksResult.data,
        appointments: appointmentsResult.data,
        activities: activitiesResult.data,
        decisionMap: decisionMapResult.data,
        qualifications: qualificationResult.data,
        accountRisks: accountRisksResult.data,
        accountPlans: accountPlansResult.data,
        opportunityStageHistory: stageHistoryResult.data,
        opportunityParticipants: participantsResult.data,
        opportunityRisks: opportunityRisksResult.data,
        competitors: competitorsResult.data,
      },
      schema: {
        account: accountResult.available,
        contacts: contactsResult.available,
        opportunities: opportunitiesResult.available,
        decisionMap: decisionMapResult.available,
        qualifications: qualificationResult.available,
        accountRisks: accountRisksResult.available,
        accountPlans: accountPlansResult.available,
        opportunityHistory: stageHistoryResult.available,
        opportunityParticipants: participantsResult.available,
        opportunityRisks: opportunityRisksResult.available,
        competitors: competitorsResult.available,
      },
      source: "revenue_prospect_enterprise_dossier",
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRevenueApiAccess("revenue.prospects.manage")
    const { id } = await params
    const supabase = await revenueClient()
    const body = await request.json()
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }

    const allowed: Record<string, string> = {
      name: "name",
      company: "company",
      city: "city",
      source: "source",
      segment: "segment",
      stage: "stage",
      priority: "priority",
      score: "score",
      probability: "probability",
      owner: "owner",
      contactName: "contact_name",
      email: "email",
      phone: "phone",
      status: "status",
      nextActionAt: "next_action_at",
      lastActivityAt: "last_activity_at",
      accountId: "account_id",
      contactId: "contact_id",
    }
    for (const [from, to] of Object.entries(allowed)) {
      if (body[from] !== undefined) patch[to] = body[from] || null
    }
    if (body.valueMad !== undefined) patch.value_mad = Number(body.valueMad || 0)
    if (body.data !== undefined) patch.data = body.data
    if (body.metadata !== undefined) patch.metadata = body.metadata

    const { data, error } = await supabase.from("revenue_prospects").update(patch).eq("id", id).select("*").single()
    if (error) return fail(error)

    await logRevenueActivity(supabase, {
      entityType: "prospect",
      entityId: id,
      prospectId: id,
      eventType: "prospect_enterprise_updated",
      title: `Dossier prospect mis à jour : ${data.name}`,
      metadata: { fields: Object.keys(body) },
    })
    await logRevenueAction(supabase, { actionType: "update_prospect_enterprise", entityType: "prospect", entityId: id, payload: body, result: { id } })
    return ok({ prospect: data })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
