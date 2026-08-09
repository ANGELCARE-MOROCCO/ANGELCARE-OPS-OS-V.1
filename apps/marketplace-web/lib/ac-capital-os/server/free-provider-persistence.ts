import { createServiceClient } from "@/lib/supabase/server";
import type { ExternalResearchExecution, JsonRecord } from "./free-provider-types";

const clean = (value: unknown) => String(value ?? "").trim();
const object = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const bool = (value: unknown, fallback = false) => value == null ? fallback : Boolean(value);
const now = () => new Date().toISOString();

function opportunityKey(title: unknown, sourceUrl: unknown) {
  return `${clean(title).toLowerCase()}::${clean(sourceUrl).toLowerCase()}`;
}

export async function persistExternalResearchExecution(execution: ExternalResearchExecution, input: {
  radarRunId?: string | null;
  actorId?: string | null;
}) {
  const supabase = await createServiceClient() as any;
  const permissions = object(execution.agent.action_permissions);
  const sourceByUrl = new Map<string, JsonRecord>();
  const clusterByKey = new Map<string, JsonRecord>();
  const persistedSources: JsonRecord[] = [];
  const createdOpportunities: JsonRecord[] = [];
  const rejectedSignals: JsonRecord[] = [];
  let duplicateCount = 0;
  const qualificationDossiers: JsonRecord[] = [];
  const draftedCases: JsonRecord[] = [];
  const pipelineRecords: JsonRecord[] = [];
  const internalTasks: JsonRecord[] = [];

  const existingSourcesResult = await supabase.from("ac_capital_radar_sources").select("*").limit(1000);
  if (existingSourcesResult.error) throw new Error(existingSourcesResult.error.message);
  for (const row of existingSourcesResult.data || []) sourceByUrl.set(clean(row.source_url), row as JsonRecord);

  if (bool(permissions.captureSources, true)) {
    for (const source of execution.sources) {
      let row = sourceByUrl.get(source.url);
      if (!row) {
        const insert = await supabase.from("ac_capital_radar_sources").insert({
          source_name: source.title,
          source_url: source.url,
          source_type: "tavily-public-web",
          source_domain: source.domain,
          content_excerpt: source.content.slice(0, 12000),
          raw_content: source.rawContent,
          source_confidence: Math.max(0, Math.min(100, Math.round(source.score * 100))),
          verification_status: "external-evidence-needs-review",
          lifecycle_status: "captured",
          officiality: "unverified",
          freshness_status: "unknown",
          duplicate_fingerprint: `${source.domain}::${source.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 120)}`,
          notes: `Captured by ${execution.agent.name} through Tavily. Public evidence only; human verification remains required.`,
          research_run_id: input.radarRunId || null,
          provider_request_id: execution.tavilyRequestId,
          grounding_chunk_index: source.index,
          metadata: {
            tavilyScore: source.score,
            freeProviderRunId: execution.runId,
            searchQueries: execution.searchQueries,
          },
          updated_at: now(),
        }).select("*").single();
        if (insert.error) throw new Error(insert.error.message);
        row = insert.data as JsonRecord;
        sourceByUrl.set(source.url, row);
      } else {
        const refreshed = await supabase.from("ac_capital_radar_sources").update({
          source_name: source.title,
          source_domain: source.domain,
          content_excerpt: source.content.slice(0, 12000),
          raw_content: source.rawContent,
          source_confidence: Math.max(Number(row.source_confidence || 0), Math.round(source.score * 100)),
          research_run_id: input.radarRunId || row.research_run_id || null,
          provider_request_id: execution.tavilyRequestId,
          grounding_chunk_index: source.index,
          metadata: { ...object(row.metadata), tavilyScore: source.score, freeProviderRunId: execution.runId, searchQueries: execution.searchQueries },
          updated_at: now(),
        }).eq("id", row.id).select("*").single();
        if (refreshed.error) throw new Error(refreshed.error.message);
        row = refreshed.data as JsonRecord;
        sourceByUrl.set(source.url, row);
      }
      persistedSources.push(row);
    }
  }

  const existingOppResult = await supabase.from("ac_capital_radar_opportunities").select("*").limit(1000);
  if (existingOppResult.error) throw new Error(existingOppResult.error.message);
  const existingKeys = new Set((existingOppResult.data || []).map((row: JsonRecord) => opportunityKey(row.title, row.source_url)));

  if (bool(permissions.createOpportunities, false)) {
    for (const candidate of execution.analysis.opportunities) {
      const key = opportunityKey(candidate.title, candidate.sourceUrl);
      if (existingKeys.has(key) && bool(permissions.detectDuplicates, true)) {
        duplicateCount += 1;
        const rejected = await supabase.from("ac_capital_radar_rejections").insert({
          research_run_id: input.radarRunId || null,
          candidate_title: candidate.title,
          source_name: candidate.sourceTitle,
          source_url: candidate.sourceUrl,
          rejection_reason: "Duplicate opportunity already exists in Capital Radar.",
          provider_request_id: execution.openRouterRequestId,
          metadata: { candidate, agentKey: execution.agent.agent_key, freeProviderRunId: execution.runId },
        }).select("*").single();
        if (!rejected.error) rejectedSignals.push(rejected.data as JsonRecord);
        continue;
      }
      const source = sourceByUrl.get(candidate.sourceUrl);
      let cluster: JsonRecord | null = null;
      const clusterKey = clean(candidate.clusterKey);
      if (clusterKey && source) {
        cluster = clusterByKey.get(clusterKey) || null;
        if (!cluster) {
          const existingCluster = await supabase.from("ac_capital_radar_evidence_clusters").select("*").eq("cluster_key", clusterKey).maybeSingle();
          if (existingCluster.error) throw new Error(existingCluster.error.message);
          if (existingCluster.data) cluster = existingCluster.data as JsonRecord;
          else {
            const createdCluster = await supabase.from("ac_capital_radar_evidence_clusters").insert({
              cluster_title: candidate.title,
              canonical_source_id: source.id,
              cluster_key: clusterKey,
              organization_name: candidate.organizationName,
              program_name: candidate.title,
              source_count: 1,
              official_source_count: 0,
              deadline_confidence: candidate.deadline ? candidate.eligibilityConfidence : 0,
              eligibility_confidence: candidate.eligibilityConfidence,
              evidence_quality_score: candidate.evidenceQualityScore,
              status: "needs-review",
              metadata: { freeProviderRunId: execution.runId, selectedModel: execution.selectedAnalysisModel },
              created_by: input.actorId || "ai-agent",
            }).select("*").single();
            if (createdCluster.error) throw new Error(createdCluster.error.message);
            cluster = createdCluster.data as JsonRecord;
          }
          clusterByKey.set(clusterKey, cluster);
        }
        const member = await supabase.from("ac_capital_radar_evidence_cluster_members").select("id").eq("cluster_id", cluster.id).eq("source_id", source.id).maybeSingle();
        if (member.error) throw new Error(member.error.message);
        if (!member.data) {
          const memberInsert = await supabase.from("ac_capital_radar_evidence_cluster_members").insert({
            cluster_id: cluster.id,
            source_id: source.id,
            member_role: "canonical",
            duplicate_probability: 75,
            relationship_reason: "Grouped by the analysis provider using a shared evidence cluster key.",
          });
          if (memberInsert.error) throw new Error(memberInsert.error.message);
        }
        await supabase.from("ac_capital_radar_sources").update({ cluster_id: cluster.id, lifecycle_status: "clustered", updated_at: now() }).eq("id", source.id);
      }
      const insert = await supabase.from("ac_capital_radar_opportunities").insert({
        title: candidate.title,
        opportunity_type: candidate.opportunityType,
        country: candidate.country,
        region: candidate.region,
        amount_min: candidate.amountMin,
        amount_max: candidate.amountMax,
        amount_range_label: candidate.amountRangeLabel,
        currency_label: candidate.currencyLabel || "Dh",
        deadline: candidate.deadline,
        deadline_label: candidate.deadlineLabel,
        deadline_heat: candidate.deadlineHeat,
        source_id: source?.id || null,
        source_url: candidate.sourceUrl,
        source_name: candidate.sourceTitle,
        source_confidence: candidate.sourceConfidence,
        eligibility_preview: candidate.eligibilityPreview,
        angelcare_relevance_preview: candidate.angelcareRelevancePreview,
        detected_by: `AC Capital ${execution.agent.name} · Tavily + OpenRouter`,
        why_captured: candidate.whyCaptured,
        organization_name: candidate.organizationName,
        application_url: candidate.applicationUrl,
        application_status: candidate.applicationStatus,
        eligibility_confidence: candidate.eligibilityConfidence,
        evidence_quality_score: candidate.evidenceQualityScore,
        strategic_value_score: candidate.strategicValueScore,
        effort_score: candidate.effortScore,
        risk_level: candidate.riskLevel,
        next_action: candidate.recommendedNextAction,
        cluster_id: cluster?.id || null,
        workflow_status: "candidate",
        proof_gaps: candidate.proofGaps,
        required_documents: candidate.requiredDocuments,
        evidence_quotes: candidate.evidenceQuotes,
        linked_source_count: 1,
        conversion_state: "opportunity-created",
        metadata: {
          clusterKey: candidate.clusterKey,
          applicationStatus: candidate.applicationStatus,
          providerAnalysis: candidate,
        },
        status: "source-review",
        handoff_status: "needs-human-confirmation",
        research_run_id: input.radarRunId || null,
        provider_request_id: execution.openRouterRequestId,
        grounding_chunk_index: execution.sources.find((item) => item.url === candidate.sourceUrl)?.index ?? null,
        grounding_metadata: {
          freeProviderRunId: execution.runId,
          tavilyRequestId: execution.tavilyRequestId,
          openRouterRequestId: execution.openRouterRequestId,
          selectedModel: execution.selectedAnalysisModel,
          relevanceScore: candidate.relevanceScore,
        },
        updated_at: now(),
      }).select("*").single();
      if (insert.error) throw new Error(insert.error.message);
      createdOpportunities.push(insert.data as JsonRecord);
      if (source?.id) {
        const sourceUpdate = await supabase.from("ac_capital_radar_sources").update({
          linked_opportunity_id: insert.data.id,
          lifecycle_status: "opportunity-linked",
          application_url: candidate.applicationUrl,
          detected_deadline: candidate.deadline,
          funding_amount_label: candidate.amountRangeLabel,
          eligibility_excerpt: candidate.eligibilityPreview,
          metadata: { ...object(source.metadata), organizationName: candidate.organizationName, opportunityType: candidate.opportunityType, relevanceScore: candidate.relevanceScore, eligibilityConfidence: candidate.eligibilityConfidence, proofGaps: candidate.proofGaps, requiredDocuments: candidate.requiredDocuments, evidenceQuotes: candidate.evidenceQuotes, recommendedNextAction: candidate.recommendedNextAction },
          updated_at: now(),
        }).eq("id", source.id);
        if (sourceUpdate.error) throw new Error(sourceUpdate.error.message);
      }
      if (cluster?.id) {
        await supabase.from("ac_capital_radar_evidence_clusters").update({ canonical_opportunity_id: insert.data.id, updated_at: now() }).eq("id", cluster.id);
      }
      existingKeys.add(key);
    }
  }

  if (bool(permissions.rejectWeakCandidates, true)) {
    for (const rejected of execution.analysis.rejectedSignals) {
      const insert = await supabase.from("ac_capital_radar_rejections").insert({
        research_run_id: input.radarRunId || null,
        candidate_title: rejected.title,
        source_name: rejected.sourceTitle,
        source_url: rejected.sourceUrl,
        rejection_reason: rejected.reason,
        provider_request_id: execution.openRouterRequestId,
        metadata: { rejected, agentKey: execution.agent.agent_key, freeProviderRunId: execution.runId },
      }).select("*").single();
      if (!insert.error) rejectedSignals.push(insert.data as JsonRecord);
    }
  }

  // Optional internal production adapters. They create controlled drafts only; no external action is performed.
  for (const opportunity of createdOpportunities) {
    let dossier: JsonRecord | null = null;
    if (bool(permissions.runInitialQualification) || bool(permissions.createQualificationDossiers)) {
      const existing = await supabase.from("ac_capital_qualification_dossiers").select("*").eq("radar_opportunity_id", opportunity.id).maybeSingle();
      if (existing.error) throw new Error(existing.error.message);
      if (existing.data) {
        dossier = existing.data as JsonRecord;
      } else {
        const relevance = Math.max(0, Math.min(100, Number(object(opportunity.grounding_metadata).relevanceScore || opportunity.source_confidence || 0)));
        const inserted = await supabase.from("ac_capital_qualification_dossiers").insert({
          radar_opportunity_id: opportunity.id,
          title: opportunity.title,
          opportunity_type: opportunity.opportunity_type || "external-capital-opportunity",
          country: opportunity.country || null,
          region: opportunity.region || null,
          source_confidence: opportunity.source_confidence || 0,
          total_score: relevance,
          decision_label: "AI Draft — Human Review",
          ai_confidence: Math.max(0, Math.min(100, execution.analysis.confidence)),
          status: "needs-human-review",
          priority: relevance >= 75 ? "high" : relevance >= 55 ? "medium" : "low",
          deadline: opportunity.deadline || null,
          deadline_risk: opportunity.deadline_heat || "unknown",
          documentation_readiness: 0,
          founder_review_required: relevance >= 80,
          recommended_owner: "Capital Coordinator",
          next_action: "Human qualification review and evidence confirmation",
          executive_summary: opportunity.angelcare_relevance_preview || opportunity.why_captured,
          eligibility_summary: opportunity.eligibility_preview || "Eligibility requires human confirmation.",
          angelcare_match_summary: opportunity.angelcare_relevance_preview || null,
          updated_at: now(),
        }).select("*").single();
        if (inserted.error) throw new Error(inserted.error.message);
        dossier = inserted.data as JsonRecord;
      }
      qualificationDossiers.push(dossier);
    }

    let caseRow: JsonRecord | null = null;
    if (bool(permissions.draftCases)) {
      const existingCase = await supabase.from("ac_capital_cases").select("*").eq("opportunity_id", opportunity.id).maybeSingle();
      if (existingCase.error) throw new Error(existingCase.error.message);
      if (existingCase.data) caseRow = existingCase.data as JsonRecord;
      else {
        const insertedCase = await supabase.from("ac_capital_cases").insert({
          qualification_dossier_id: dossier?.id || null,
          opportunity_id: opportunity.id,
          case_title: `${opportunity.title} — AI Draft Case`,
          package_type: "evidence-bound-draft",
          funding_type: opportunity.opportunity_type || null,
          requested_amount: opportunity.amount_max || opportunity.amount_min || null,
          currency_label: opportunity.currency_label || "Dh",
          deadline: opportunity.deadline || null,
          total_readiness_score: 15,
          doctrine_alignment_score: Math.max(0, Math.min(100, Number(object(opportunity.grounding_metadata).relevanceScore || 0))),
          founder_approval_status: "not_started",
          coordinator_handover_status: "not_started",
          status: "ai_draft_human_review",
          priority: dossier?.priority || "medium",
          owner: "Capital Coordinator",
          next_action: "Validate source, qualification and required proof before case production",
          updated_at: now(),
        }).select("*").single();
        if (insertedCase.error) throw new Error(insertedCase.error.message);
        caseRow = insertedCase.data as JsonRecord;
      }
      draftedCases.push(caseRow);
    }

    let pipeline: JsonRecord | null = null;
    if (bool(permissions.updatePipeline)) {
      const existingPipeline = await supabase.from("ac_capital_pipeline_records").select("*").eq("opportunity_id", String(opportunity.id)).maybeSingle();
      if (existingPipeline.error) throw new Error(existingPipeline.error.message);
      if (existingPipeline.data) pipeline = existingPipeline.data as JsonRecord;
      else {
        const insertedPipeline = await supabase.from("ac_capital_pipeline_records").insert({
          opportunity_id: String(opportunity.id),
          qualification_dossier_id: dossier?.id ? String(dossier.id) : null,
          case_id: caseRow?.id ? String(caseRow.id) : null,
          title: opportunity.title,
          stage: "Source Review",
          status: "Active",
          funding_type: opportunity.opportunity_type || null,
          package_type: caseRow ? "evidence-bound-draft" : null,
          estimated_amount_min: opportunity.amount_min || null,
          estimated_amount_max: opportunity.amount_max || null,
          currency_label: opportunity.currency_label || "Dh",
          probability_percent: 10,
          deadline: opportunity.deadline || null,
          next_action: "Human source and qualification review",
          owner: "Capital Coordinator",
          priority: dossier?.priority || "medium",
          relationship_temperature: "New External Signal",
          risk_level: "Medium",
          readiness_score: 10,
          founder_approval_status: "Not Requested",
          last_activity_at: now(),
          updated_at: now(),
        }).select("*").single();
        if (insertedPipeline.error) throw new Error(insertedPipeline.error.message);
        pipeline = insertedPipeline.data as JsonRecord;
      }
      pipelineRecords.push(pipeline);
    }

    if (bool(permissions.createInternalTasks)) {
      const insertedTask = await supabase.from("ac_capital_coordinator_tasks").insert({
        task_title: `Validate external opportunity: ${opportunity.title}`,
        task_type: "AI Research Review",
        related_case_id: caseRow?.id ? String(caseRow.id) : null,
        related_pipeline_record_id: pipeline?.id ? String(pipeline.id) : null,
        priority: dossier?.priority || "medium",
        status: "Ready",
        due_at: opportunity.deadline || null,
        owner: "Capital Coordinator",
        ai_prepared: true,
        human_action_required: "Open source, confirm eligibility/deadline, approve or reject qualification handoff.",
        proof_required: true,
        founder_approval_required: false,
        risk_if_missed: opportunity.deadline ? "Potential deadline loss" : "Evidence may become stale",
        next_step_after_completion: "Advance approved record to Qualification Committee",
        source_workspace: "AC Capital AI Operations",
        updated_at: now(),
      }).select("*").single();
      if (insertedTask.error) throw new Error(insertedTask.error.message);
      internalTasks.push(insertedTask.data as JsonRecord);
    }
  }

  const internalActions = {
    captureSources: { allowed: bool(permissions.captureSources), executed: persistedSources.length },
    createOpportunities: { allowed: bool(permissions.createOpportunities), executed: createdOpportunities.length },
    rejectWeakCandidates: { allowed: bool(permissions.rejectWeakCandidates), executed: rejectedSignals.length },
    detectDuplicates: { allowed: bool(permissions.detectDuplicates), executed: duplicateCount },
    runInitialQualification: { allowed: bool(permissions.runInitialQualification), executed: qualificationDossiers.length, status: "draft-human-review" },
    createQualificationDossiers: { allowed: bool(permissions.createQualificationDossiers), executed: qualificationDossiers.length, status: "draft-human-review" },
    draftCases: { allowed: bool(permissions.draftCases), executed: draftedCases.length, status: "draft-human-review" },
    updatePipeline: { allowed: bool(permissions.updatePipeline), executed: pipelineRecords.length, status: "source-review" },
    createInternalTasks: { allowed: bool(permissions.createInternalTasks), executed: internalTasks.length, status: "ready-for-human" },
    generateReports: { allowed: bool(permissions.generateReports), executed: 0, status: "separate-report-agent" },
    externalActions: { allowed: false, executed: 0, status: "permanently-locked" },
  };

  const runUpdate = await supabase.from("ac_capital_ai_agent_runs").update({
    status: "completed",
    phase: "completed",
    sources_persisted: persistedSources.length,
    opportunities_created: createdOpportunities.length,
    opportunities_rejected: rejectedSignals.length,
    duplicates_detected: duplicateCount,
    internal_actions: internalActions,
    finished_at: now(),
    updated_at: now(),
  }).eq("id", execution.runId);
  if (runUpdate.error) throw new Error(runUpdate.error.message);

  return { persistedSources, createdOpportunities, rejectedSignals, duplicateCount, qualificationDossiers, draftedCases, pipelineRecords, internalTasks, internalActions };
}
