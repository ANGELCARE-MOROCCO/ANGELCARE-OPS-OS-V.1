import { fail, ok, revenueClient } from "@/lib/revenue-command-center/canonical-server"
import { requireRevenueApiAccess, revenueAccessFailure } from "@/lib/revenue-command-center/api-access"
import { optionalSelect } from "@/lib/revenue-command-center/enterprise-server"

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function GET(request: Request) {
  try {
    await requireRevenueApiAccess(["revenue.prospects.read", "revenue.accounts.read", "revenue.opportunities.read"])
    const supabase = await revenueClient()
    const { searchParams } = new URL(request.url)
    const view = searchParams.get("view") || "portfolio"
    const q = (searchParams.get("q") || "").trim().toLowerCase()
    const limit = Math.min(Number(searchParams.get("limit") || 1500), 5000)

    let overviewQuery = supabase
      .from("revenue_prospect_enterprise_overview")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit)

    const overviewResult = await overviewQuery
    let prospects: any[] = []
    let readModelAvailable = true

    if (overviewResult.error) {
      readModelAvailable = false
      const fallback = await supabase.from("revenue_prospects").select("*").neq("status", "archived").order("updated_at", { ascending: false }).limit(limit)
      if (fallback.error) return fail(fallback.error)
      prospects = (fallback.data || []).map((row: any) => ({
        ...row,
        prospect_id: row.id,
        prospect_name: row.name,
        prospect_stage: row.stage,
        prospect_value_mad: row.value_mad,
        prospect_probability: row.probability,
        prospect_status: row.status,
        open_opportunity_value_mad: 0,
        weighted_pipeline_mad: 0,
        opportunity_count: 0,
        open_task_count: 0,
        overdue_task_count: 0,
        upcoming_meeting_count: 0,
        open_risk_count: 0,
        decision_member_count: 0,
      }))
    } else {
      prospects = overviewResult.data || []
    }

    if (q) {
      prospects = prospects.filter((row) =>
        [
          row.prospect_name,
          row.company,
          row.account_name,
          row.city,
          row.owner,
          row.contact_name,
          row.primary_contact_name,
          row.prospect_stage,
          row.industry,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    }

    const [accountsResult, opportunitiesResult, qualificationResult, risksResult, decisionMapResult] = await Promise.all([
      optionalSelect(supabase as any, "revenue_accounts", "*", (query) => query.limit(2500)),
      optionalSelect(supabase as any, "revenue_opportunities", "*", (query) => query.limit(5000)),
      optionalSelect(supabase as any, "revenue_qualification_assessments", "*", (query) => query.is("superseded_at", null).order("assessed_at", { ascending: false }).limit(5000)),
      optionalSelect(supabase as any, "revenue_account_risks", "*", (query) => query.eq("status", "open").limit(5000)),
      optionalSelect(supabase as any, "revenue_decision_map_members", "*", (query) => query.eq("status", "active").limit(5000)),
    ])

    const opportunities = opportunitiesResult.data.filter((item: any) => !item.archived_at && item.status !== "archived")
    const openOpportunities = opportunities.filter((item: any) => item.status === "open")
    const pipelineValue = openOpportunities.reduce((sum: number, item: any) => sum + number(item.value_mad), 0)
    const weightedPipeline = openOpportunities.reduce((sum: number, item: any) => sum + (number(item.value_mad) * number(item.probability)) / 100, 0)
    const wonValue = opportunities.filter((item: any) => item.status === "won" || item.stage === "closed_won").reduce((sum: number, item: any) => sum + number(item.value_mad), 0)
    const highValueThreshold = prospects.length
      ? prospects.map((item) => Math.max(number(item.prospect_value_mad), number(item.open_opportunity_value_mad))).sort((a, b) => b - a)[Math.min(Math.floor(prospects.length * 0.2), prospects.length - 1)] || 0
      : 0

    const stageCounts = prospects.reduce<Record<string, number>>((acc, item) => {
      const stage = String(item.prospect_stage || item.stage || "new_lead")
      acc[stage] = (acc[stage] || 0) + 1
      return acc
    }, {})

    const summary = {
      prospectCount: prospects.length,
      accountCount: accountsResult.data.filter((item: any) => !item.archived_at && item.status !== "archived").length,
      opportunityCount: opportunities.length,
      openOpportunityCount: openOpportunities.length,
      pipelineValueMad: pipelineValue,
      weightedPipelineMad: weightedPipeline,
      wonValueMad: wonValue,
      overdueTaskCount: prospects.reduce((sum, item) => sum + number(item.overdue_task_count), 0),
      openRiskCount: risksResult.data.length,
      decisionMemberCount: decisionMapResult.data.length,
      qualifiedCount: qualificationResult.data.filter((item: any) => number(item.overall_score) >= 70).length,
      highValueThresholdMad: highValueThreshold,
      stages: stageCounts,
    }

    const schema = {
      enterpriseReadModel: readModelAvailable,
      accounts: accountsResult.available,
      opportunities: opportunitiesResult.available,
      qualifications: qualificationResult.available,
      risks: risksResult.available,
      decisionMaps: decisionMapResult.available,
      migrationRequired: !readModelAvailable || !qualificationResult.available || !risksResult.available || !decisionMapResult.available,
    }

    return ok({
      view,
      summary,
      prospects,
      accounts: accountsResult.data.filter((item: any) => !item.archived_at && item.status !== "archived"),
      opportunities,
      qualifications: qualificationResult.data,
      risks: risksResult.data,
      decisionMapMembers: decisionMapResult.data,
      schema,
      generatedAt: new Date().toISOString(),
      source: readModelAvailable ? "revenue_prospect_enterprise_overview" : "revenue_prospects",
    })
  } catch (error) {
    const access = revenueAccessFailure(error)
    return access ? fail(access.message, access.status) : fail(error)
  }
}
