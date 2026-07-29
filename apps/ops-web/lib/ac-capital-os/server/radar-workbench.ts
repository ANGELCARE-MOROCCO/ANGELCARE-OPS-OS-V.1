import { createServiceClient } from "@/lib/supabase/server";
import type { JsonRecord } from "./free-provider-types";

const now = () => new Date().toISOString();
const clean = (value: unknown) => String(value ?? "").trim();
const numeric = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const object = (value: unknown): JsonRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
const strings = (value: unknown) =>
  Array.isArray(value) ? value.map(clean).filter(Boolean) : [];
const clamp = (value: unknown, fallback = 0) =>
  Math.max(0, Math.min(100, Math.round(numeric(value, fallback))));

function domainOf(value: unknown) {
  try {
    return new URL(clean(value)).hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

function normalizedKey(value: unknown) {
  return clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(program|programme|fund|funding|grant|grants|application|opportunity|opportunities|official|page|home)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 7)
    .join("-") || "unclassified";
}

function futureDeadlineScore(value: unknown) {
  const text = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return 35;
  const days = Math.ceil((new Date(text).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return 5;
  if (days <= 7) return 45;
  if (days <= 21) return 75;
  return 85;
}

async function singleById(supabase: any, table: string, id: string) {
  const result = await supabase.from(table).select("*").eq("id", id).single();
  if (result.error) throw new Error(result.error.message);
  return result.data as JsonRecord;
}

async function maybeBy(supabase: any, table: string, field: string, value: unknown) {
  const result = await supabase.from(table).select("*").eq(field, value).maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data ? (result.data as JsonRecord) : null;
}

async function insertOne(supabase: any, table: string, payload: JsonRecord) {
  const result = await supabase.from(table).insert(payload).select("*").single();
  if (result.error) throw new Error(result.error.message);
  return result.data as JsonRecord;
}

async function updateOne(supabase: any, table: string, id: string, payload: JsonRecord) {
  const result = await supabase
    .from(table)
    .update({ ...payload, updated_at: now() })
    .eq("id", id)
    .select("*")
    .single();
  if (result.error) throw new Error(result.error.message);
  return result.data as JsonRecord;
}

async function listByIds(supabase: any, table: string, ids: string[]) {
  if (!ids.length) return [] as JsonRecord[];
  const result = await supabase.from(table).select("*").in("id", ids);
  if (result.error) throw new Error(result.error.message);
  return (result.data || []) as JsonRecord[];
}

async function audit(supabase: any, input: {
  actor: string;
  action: string;
  objectType: string;
  objectId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string;
}) {
  const payload = {
    actor: input.actor,
    action: input.action,
    object_type: input.objectType,
    object_id: input.objectId || null,
    before_state: input.before || null,
    after_state: input.after || null,
    reason: input.reason || null,
    risk_level: "Medium",
    approval_requirement: "Human review",
  };
  try {
    const result = await supabase
      .from("ac_capital_strategy_audit_events")
      .insert(payload);
    if (result.error) return;
  } catch {
    // Audit persistence must never hide the primary workflow result.
  }
}

async function recordConversion(supabase: any, input: {
  actor: string;
  mode: string;
  sourceId?: string | null;
  opportunityId?: string | null;
  clusterId?: string | null;
  dossierId?: string | null;
  caseId?: string | null;
  pipelineId?: string | null;
  taskIds?: string[];
  before?: unknown;
  after?: unknown;
  reason?: string;
}) {
  return insertOne(supabase, "ac_capital_radar_conversion_events", {
    source_id: input.sourceId || null,
    opportunity_id: input.opportunityId || null,
    cluster_id: input.clusterId || null,
    qualification_dossier_id: input.dossierId || null,
    case_id: input.caseId || null,
    pipeline_record_id: input.pipelineId || null,
    coordinator_task_ids: input.taskIds || [],
    conversion_mode: input.mode,
    status: "completed",
    before_state: input.before || null,
    after_state: input.after || null,
    actor: input.actor,
    reason: input.reason || null,
    reversible: true,
  });
}

async function clusterSources(supabase: any, sourceIds: string[], actor: string, title?: string) {
  const sources = await listByIds(supabase, "ac_capital_radar_sources", sourceIds);
  if (!sources.length) throw new Error("AC_CAPITAL_CLUSTER_REQUIRES_SOURCES");
  const canonical = sources
    .slice()
    .sort((left, right) => {
      const officialDelta = (clean(right.officiality) === "official" ? 1 : 0) - (clean(left.officiality) === "official" ? 1 : 0);
      return officialDelta || numeric(right.source_confidence) - numeric(left.source_confidence);
    })[0];
  const clusterKey = `${domainOf(canonical.source_url)}::${normalizedKey(title || canonical.source_name)}`;
  let cluster = await maybeBy(supabase, "ac_capital_radar_evidence_clusters", "cluster_key", clusterKey);
  const clusterPayload = {
    cluster_title: clean(title || canonical.source_name || "Opportunity evidence cluster"),
    canonical_source_id: canonical.id,
    cluster_key: clusterKey,
    organization_name: clean(object(canonical.metadata).organizationName) || null,
    program_name: clean(title || canonical.source_name) || null,
    source_count: sources.length,
    official_source_count: sources.filter((row) => clean(row.officiality) === "official").length,
    deadline_confidence: sources.some((row) => row.detected_deadline) ? 75 : 20,
    eligibility_confidence: Math.max(...sources.map((row) => clamp(row.source_confidence)), 0),
    evidence_quality_score: Math.round(sources.reduce((sum, row) => sum + clamp(row.source_confidence), 0) / sources.length),
    status: "needs-review",
    metadata: { sourceDomains: Array.from(new Set(sources.map((row) => domainOf(row.source_url)))) },
    created_by: actor,
  };
  if (cluster) cluster = await updateOne(supabase, "ac_capital_radar_evidence_clusters", clean(cluster.id), clusterPayload);
  else cluster = await insertOne(supabase, "ac_capital_radar_evidence_clusters", clusterPayload);

  for (const source of sources) {
    const existing = await supabase
      .from("ac_capital_radar_evidence_cluster_members")
      .select("id")
      .eq("cluster_id", cluster.id)
      .eq("source_id", source.id)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (!existing.data) {
      const titleSimilarity = normalizedKey(source.source_name) === normalizedKey(canonical.source_name) ? 90 : 60;
      await insertOne(supabase, "ac_capital_radar_evidence_cluster_members", {
        cluster_id: cluster.id,
        source_id: source.id,
        member_role: String(source.id) === String(canonical.id) ? "canonical" : "supporting",
        duplicate_probability: titleSimilarity,
        relationship_reason: String(source.id) === String(canonical.id)
          ? "Selected as the strongest canonical evidence source."
          : "Grouped by domain, title signature and shared research context.",
      });
    }
    await updateOne(supabase, "ac_capital_radar_sources", clean(source.id), {
      cluster_id: cluster.id,
      lifecycle_status: clean(source.lifecycle_status) === "rejected" ? "rejected" : "clustered",
    });
  }
  return { cluster, sources };
}

async function ensureOpportunityFromSource(supabase: any, sourceId: string, actor: string, overrides: JsonRecord = {}) {
  const source = await singleById(supabase, "ac_capital_radar_sources", sourceId);
  if (source.linked_opportunity_id) {
    return { source, opportunity: await singleById(supabase, "ac_capital_radar_opportunities", clean(source.linked_opportunity_id)), created: false };
  }
  if (source.source_url) {
    const existing = await maybeBy(supabase, "ac_capital_radar_opportunities", "source_url", source.source_url);
    if (existing) {
      await updateOne(supabase, "ac_capital_radar_sources", sourceId, {
        linked_opportunity_id: existing.id,
        lifecycle_status: "validated",
      });
      return { source, opportunity: existing, created: false };
    }
  }
  const metadata = object(source.metadata);
  const opportunity = await insertOne(supabase, "ac_capital_radar_opportunities", {
    title: clean(overrides.title || source.source_name || "External capital opportunity"),
    opportunity_type: clean(overrides.opportunityType || metadata.opportunityType || "External Funding"),
    organization_name: clean(overrides.organizationName || metadata.organizationName) || domainOf(source.source_url),
    country: clean(overrides.country || source.country || metadata.country) || null,
    region: clean(overrides.region || source.region || metadata.region) || null,
    amount_min: overrides.amountMin ?? metadata.amountMin ?? null,
    amount_max: overrides.amountMax ?? metadata.amountMax ?? null,
    amount_range_label: clean(overrides.amountRangeLabel || source.funding_amount_label || metadata.amountRangeLabel) || null,
    currency_label: clean(overrides.currencyLabel || metadata.currencyLabel || "Dh"),
    deadline: clean(overrides.deadline || source.detected_deadline || metadata.deadline) || null,
    deadline_label: clean(overrides.deadlineLabel || metadata.deadlineLabel) || null,
    deadline_heat: clean(overrides.deadlineHeat || metadata.deadlineHeat || "unknown"),
    source_id: source.id,
    source_url: source.source_url || null,
    source_name: source.source_name,
    source_confidence: clamp(overrides.sourceConfidence || source.source_confidence, 50),
    eligibility_preview: clean(overrides.eligibilityPreview || source.eligibility_excerpt || metadata.eligibilityPreview) || "Eligibility requires human confirmation.",
    angelcare_relevance_preview: clean(overrides.angelcareRelevancePreview || metadata.angelcareRelevancePreview) || "Captured from public evidence for controlled AngelCare qualification.",
    detected_by: actor,
    why_captured: clean(overrides.whyCaptured || metadata.whyCaptured) || "Promoted from the external evidence validation queue.",
    status: "source-review",
    handoff_status: "needs-human-confirmation",
    application_url: clean(overrides.applicationUrl || source.application_url || metadata.applicationUrl) || source.source_url || null,
    application_status: clean(overrides.applicationStatus || metadata.applicationStatus || "unknown"),
    eligibility_confidence: clamp(overrides.eligibilityConfidence || metadata.eligibilityConfidence || source.source_confidence, 40),
    evidence_quality_score: clamp(overrides.evidenceQualityScore || source.source_confidence, 50),
    strategic_value_score: clamp(overrides.strategicValueScore || metadata.relevanceScore || source.source_confidence, 50),
    effort_score: clamp(overrides.effortScore || metadata.effortScore, 50),
    risk_level: clean(overrides.riskLevel || metadata.riskLevel || "unknown"),
    owner: clean(overrides.owner || source.assigned_reviewer || "Capital Coordinator"),
    next_action: clean(overrides.nextAction || metadata.recommendedNextAction || "Validate evidence and launch preliminary qualification."),
    cluster_id: source.cluster_id || null,
    workflow_status: "candidate",
    proof_gaps: strings(overrides.proofGaps || metadata.proofGaps),
    required_documents: strings(overrides.requiredDocuments || metadata.requiredDocuments),
    evidence_quotes: strings(overrides.evidenceQuotes || metadata.evidenceQuotes),
    linked_source_count: 1,
    conversion_state: "opportunity-created",
    metadata: { ...metadata, promotedFromSource: source.id, manualOverrides: overrides },
  });
  await updateOne(supabase, "ac_capital_radar_sources", sourceId, {
    linked_opportunity_id: opportunity.id,
    lifecycle_status: "validated",
    verification_status: "validated",
    reviewed_by: actor,
    reviewed_at: now(),
  });
  return { source, opportunity, created: true };
}

function qualificationCriteria(opportunity: JsonRecord, sources: JsonRecord[]) {
  const text = [opportunity.title, opportunity.opportunity_type, opportunity.eligibility_preview, opportunity.angelcare_relevance_preview].map(clean).join(" ").toLowerCase();
  const sourceConfidence = clamp(opportunity.evidence_quality_score || opportunity.source_confidence, 45);
  const relevance = clamp(opportunity.strategic_value_score || object(opportunity.grounding_metadata).relevanceScore, sourceConfidence);
  const criteria = [
    ["strategic_alignment", "Strategic alignment", 14, relevance, "Derived from the evidence-bound AngelCare relevance assessment."],
    ["business_model_fit", "Business-model fit", 12, /child|education|saas|impact|care/.test(text) ? 82 : 48, "Checks explicit sector and operating-model signals."],
    ["geographic_eligibility", "Geographic eligibility", 10, /morocco|africa|mena|international/.test(`${clean(opportunity.country)} ${clean(opportunity.region)}`.toLowerCase()) ? 76 : 42, "Uses only recorded country and region evidence."],
    ["legal_eligibility", "Legal eligibility", 10, clean(opportunity.eligibility_preview) ? 58 : 20, "A preliminary score; legal eligibility remains unconfirmed until official rules are reviewed."],
    ["women_founder", "Women-founder compatibility", 8, /women|woman|female|fondatrice|femme/.test(text) ? 85 : 35, "Scores only explicit women-founder language found in the record."],
    ["sector_compatibility", "Sector compatibility", 10, /child|education|saas|digital|impact|care/.test(text) ? 84 : 45, "Matches explicit childcare, education, digital, SaaS or impact evidence."],
    ["funding_stage_fit", "Funding-stage fit", 8, clean(opportunity.opportunity_type) ? 70 : 35, "Uses the classified opportunity type; final instrument fit needs committee review."],
    ["amount_suitability", "Amount suitability", 8, opportunity.amount_min || opportunity.amount_max || opportunity.amount_range_label ? 72 : 30, "No score uplift is granted when the amount is absent."],
    ["evidence_quality", "Evidence quality", 12, sourceConfidence, `Based on ${sources.length} linked source(s) and recorded source confidence.`],
    ["deadline_viability", "Deadline viability", 8, futureDeadlineScore(opportunity.deadline), "Uses only the recorded deadline and current date."],
  ] as const;
  return criteria.map(([key, label, weight, score, explanation]) => ({
    criterion_key: key,
    criterion_label: label,
    weight,
    score,
    weighted_score: Number(((weight * score) / 100).toFixed(2)),
    explanation,
    evidence_status: score >= 70 ? "supported" : score >= 45 ? "partial" : "missing",
    confidence: key === "evidence_quality" ? sourceConfidence : Math.min(85, sourceConfidence),
    missing_evidence: score >= 70 ? null : `Additional authoritative proof is required for ${label.toLowerCase()}.`,
    risk_note: score < 45 ? "Do not advance externally until this criterion is verified." : null,
  }));
}

async function linkedSourcesForOpportunity(supabase: any, opportunity: JsonRecord) {
  const ids = [clean(opportunity.source_id)].filter(Boolean);
  if (opportunity.cluster_id) {
    const memberResult = await supabase
      .from("ac_capital_radar_evidence_cluster_members")
      .select("source_id")
      .eq("cluster_id", opportunity.cluster_id);
    if (memberResult.error) throw new Error(memberResult.error.message);
    ids.push(...(memberResult.data || []).map((row: JsonRecord) => clean(row.source_id)).filter(Boolean));
  }
  return listByIds(supabase, "ac_capital_radar_sources", Array.from(new Set(ids)));
}

async function ensureQualification(supabase: any, opportunity: JsonRecord, actor: string) {
  if (opportunity.qualification_dossier_id) {
    return singleById(supabase, "ac_capital_qualification_dossiers", clean(opportunity.qualification_dossier_id));
  }
  let dossier = await maybeBy(supabase, "ac_capital_qualification_dossiers", "radar_opportunity_id", opportunity.id);
  if (dossier) {
    await updateOne(supabase, "ac_capital_radar_opportunities", clean(opportunity.id), {
      qualification_dossier_id: dossier.id,
      status: "ready-for-qualification",
      handoff_status: "ready-for-qualification",
      workflow_status: "qualifying",
      conversion_state: "qualification-created",
    });
    return dossier;
  }
  const sources = await linkedSourcesForOpportunity(supabase, opportunity);
  const criteria = qualificationCriteria(opportunity, sources);
  const totalWeight = criteria.reduce((sum, row) => sum + numeric(row.weight), 0) || 1;
  const totalScore = Math.round(criteria.reduce((sum, row) => sum + numeric(row.weighted_score), 0) * 100 / totalWeight);
  dossier = await insertOne(supabase, "ac_capital_qualification_dossiers", {
    radar_opportunity_id: opportunity.id,
    radar_cluster_id: opportunity.cluster_id || null,
    radar_source_ids: sources.map((row) => row.id),
    title: opportunity.title,
    opportunity_type: opportunity.opportunity_type,
    country: opportunity.country || null,
    region: opportunity.region || null,
    source_confidence: clamp(opportunity.source_confidence),
    total_score: totalScore,
    decision_label: totalScore >= 75 ? "Pursue — Human Review" : totalScore >= 55 ? "Needs Proof" : "Watch / Validate",
    ai_confidence: Math.min(90, clamp(opportunity.evidence_quality_score || opportunity.source_confidence)),
    status: "needs-human-review",
    priority: totalScore >= 75 ? "high" : totalScore >= 55 ? "medium" : "low",
    deadline: opportunity.deadline || null,
    deadline_risk: opportunity.deadline_heat || "unknown",
    documentation_readiness: 10,
    founder_review_required: totalScore >= 80,
    recommended_owner: opportunity.owner || "Capital Coordinator",
    next_action: "Review evidence, confirm legal eligibility and close proof gaps before pursuit approval.",
    executive_summary: opportunity.angelcare_relevance_preview || opportunity.why_captured,
    eligibility_summary: opportunity.eligibility_preview || "Eligibility evidence is incomplete.",
    angelcare_match_summary: opportunity.angelcare_relevance_preview || null,
    preliminary_score_method: "Deterministic evidence-bound preliminary score; committee confirmation required.",
    metadata: { generatedFromRadarWorkbench: true, sourceCount: sources.length },
  });
  for (const criterion of criteria) {
    await insertOne(supabase, "ac_capital_qualification_scores", { dossier_id: dossier.id, ...criterion });
  }
  const proofGaps = Array.from(new Set([
    ...strings(opportunity.proof_gaps),
    "Official eligibility and exclusion rules",
    "Application form and direct submission instructions",
    "AngelCare legal-registration and ownership proof",
    "Latest financial statements and funding-use justification",
  ])).slice(0, 8);
  for (const name of proofGaps) {
    await insertOne(supabase, "ac_capital_qualification_missing_documents", {
      dossier_id: dossier.id,
      document_name: name,
      document_category: /financial|funding-use/i.test(name) ? "Financial" : /legal|ownership/i.test(name) ? "Legal" : "Opportunity Evidence",
      status: "Missing",
      priority: /official eligibility|application form/i.test(name) ? "high" : "medium",
      required_for_submission: true,
      owner: opportunity.owner || "Capital Coordinator",
      due_date: opportunity.deadline || null,
    });
  }
  const nextActions = [
    ["Validate authoritative program and application pages", "Confirm status, deadline, eligibility and direct submission path.", "radar"],
    ["Complete eligibility and proof-gap review", "Resolve every unsupported qualification criterion.", "qualification"],
    ["Prepare funding-case evidence package", "Create the controlled case only after evidence review.", "case-factory"],
  ];
  for (const [label, why, workspace] of nextActions) {
    await insertOne(supabase, "ac_capital_qualification_next_actions", {
      dossier_id: dossier.id,
      action_label: label,
      why,
      owner: opportunity.owner || "Capital Coordinator",
      priority: "high",
      deadline: opportunity.deadline || null,
      expected_output: "Evidence-backed internal decision record",
      related_workspace: workspace,
      status: "open",
    });
  }
  await insertOne(supabase, "ac_capital_qualification_decisions", {
    dossier_id: dossier.id,
    decision_label: dossier.decision_label,
    decision_reason: "Preliminary evidence-bound recommendation generated by the Radar-to-Case workbench.",
    decided_by: actor,
    founder_review_required: dossier.founder_review_required,
    status: "draft",
  });
  await insertOne(supabase, "ac_capital_radar_handoff_queue", {
    opportunity_id: opportunity.id,
    target_workspace: "qualification-engine",
    handoff_status: "created",
    coordinator_instruction: "Open the qualification dossier, validate evidence and decide whether the opportunity may advance.",
    created_by: actor,
  });
  await updateOne(supabase, "ac_capital_radar_opportunities", clean(opportunity.id), {
    qualification_dossier_id: dossier.id,
    status: "ready-for-qualification",
    handoff_status: "ready-for-qualification",
    workflow_status: "qualifying",
    conversion_state: "qualification-created",
    next_action: "Open the Qualification Committee dossier.",
  });
  return dossier;
}

async function ensureCase(supabase: any, opportunity: JsonRecord, dossier: JsonRecord, actor: string) {
  if (opportunity.case_id) return singleById(supabase, "ac_capital_cases", clean(opportunity.case_id));
  let caseRow = await maybeBy(supabase, "ac_capital_cases", "opportunity_id", opportunity.id);
  if (caseRow) {
    await updateOne(supabase, "ac_capital_radar_opportunities", clean(opportunity.id), {
      case_id: caseRow.id,
      workflow_status: "case-created",
      conversion_state: "case-created",
      next_action: "Open Case Factory and complete the evidence package.",
    });
    return caseRow;
  }
  const sources = await linkedSourcesForOpportunity(supabase, opportunity);
  caseRow = await insertOne(supabase, "ac_capital_cases", {
    qualification_dossier_id: dossier.id,
    opportunity_id: opportunity.id,
    radar_cluster_id: opportunity.cluster_id || null,
    radar_source_ids: sources.map((row) => row.id),
    case_title: `${opportunity.title} — Funding Case`,
    package_type: "evidence-bound-funding-case",
    funding_type: opportunity.opportunity_type || null,
    requested_amount: opportunity.amount_max || opportunity.amount_min || null,
    currency_label: opportunity.currency_label || "Dh",
    deadline: opportunity.deadline || null,
    total_readiness_score: 15,
    doctrine_alignment_score: clamp(dossier.total_score),
    document_readiness_score: 10,
    financial_readiness_score: 5,
    risk_readiness_score: 20,
    founder_approval_status: "required",
    coordinator_handover_status: "draft-ready",
    status: "evidence_gathering",
    priority: dossier.priority || "medium",
    owner: opportunity.owner || "Capital Coordinator",
    next_action: "Close evidence, document and financial proof gaps.",
    metadata: { generatedFromRadarWorkbench: true, actor },
  });
  const stages = [
    ["Evidence validation", "in_progress", 35, "Validate official source, application status and deadline.", false],
    ["Eligibility and qualification", "in_progress", clamp(dossier.total_score), "Resolve unsupported criteria and legal eligibility.", false],
    ["Financial and proof package", "blocked", 10, "Collect financial, ownership and use-of-funds evidence.", false],
    ["Founder approval and submission readiness", "not_started", 0, "External release remains locked until explicit approval.", true],
  ];
  for (const [label, status, readiness, action, founderApproval] of stages) {
    await insertOne(supabase, "ac_capital_case_stages", {
      case_id: caseRow.id,
      stage_label: label,
      status,
      readiness,
      owner: opportunity.owner || "Capital Coordinator",
      blockers: status === "blocked" ? "Required proof has not been attached." : null,
      ai_confidence: clamp(dossier.ai_confidence),
      founder_approval_required: founderApproval,
      action,
    });
  }
  const requiredDocs = Array.from(new Set([
    ...strings(opportunity.required_documents),
    "Official program and eligibility guide",
    "Application form and submission instructions",
    "AngelCare corporate registration and ownership pack",
    "Latest financial statements",
    "Funding request and use-of-funds schedule",
    "Impact and market evidence pack",
  ])).slice(0, 10);
  for (const documentName of requiredDocs) {
    await insertOne(supabase, "ac_capital_case_documents", {
      case_id: caseRow.id,
      document_name: documentName,
      category: /financial|funding request|use-of-funds/i.test(documentName) ? "Financial" : /registration|ownership/i.test(documentName) ? "Legal" : "Evidence",
      required_for_submission: true,
      status: "missing",
      priority: /official program|application form/i.test(documentName) ? "high" : "medium",
      owner: opportunity.owner || "Capital Coordinator",
      source_workspace: /official program|application form/i.test(documentName) ? "radar" : "data-room",
      deadline: opportunity.deadline || null,
      notes: "Draft requirement created by the Radar-to-Case workbench; human verification required.",
    });
  }
  await insertOne(supabase, "ac_capital_case_narratives", {
    case_id: caseRow.id,
    narrative_type: "funding-case-core",
    headline: opportunity.title,
    opening_message: opportunity.angelcare_relevance_preview || opportunity.why_captured,
    proof_to_emphasize: "Use only validated AngelCare operating, financial, quality and market evidence.",
    language_to_avoid: "Avoid unsupported traction, eligibility, impact or probability claims.",
    required_annexes: requiredDocs.join("; "),
    tone: "evidence-first executive",
    founder_review_required: true,
    status: "draft",
  });
  await insertOne(supabase, "ac_capital_case_risk_plans", {
    case_id: caseRow.id,
    risk_type: "Eligibility or deadline misinterpretation",
    severity: "high",
    likelihood: "medium",
    description: "Public search evidence may be incomplete, outdated or secondary.",
    mitigation: "Validate the authoritative program page and official application rules before approval.",
    plan_b: "Request clarification from the program administrator through a human-approved channel.",
    plan_c: "Move the opportunity to watchlist while preserving evidence.",
    plan_d: "Reject and record the reason if eligibility cannot be proven.",
    owner: opportunity.owner || "Capital Coordinator",
    founder_review_required: false,
    related_proof: "Official source and eligibility guide",
    status: "draft",
  });
  await insertOne(supabase, "ac_capital_case_founder_approvals", {
    case_id: caseRow.id,
    approval_item: "Approve external application, outreach or submission",
    status: "required",
    reason: "The workbench performs internal preparation only; external commitment remains founder-controlled.",
    approver: "Managing Director",
    due_date: opportunity.deadline || null,
  });
  await insertOne(supabase, "ac_capital_case_coordinator_handovers", {
    case_id: caseRow.id,
    block: "Radar-to-Case evidence and proof handoff",
    instruction: "Validate official evidence, close qualification gaps, collect required documents and prepare the case for founder review.",
    owner: opportunity.owner || "Capital Coordinator",
    deadline: opportunity.deadline || null,
    proof_after_action: "Attach evidence references and document locations to the case.",
    escalation_condition: "Escalate when deadline is within 14 days, eligibility remains uncertain, or a required document is unavailable.",
    status: "draft",
  });
  await updateOne(supabase, "ac_capital_radar_opportunities", clean(opportunity.id), {
    case_id: caseRow.id,
    workflow_status: "case-created",
    conversion_state: "case-created",
    next_action: "Open Case Factory and complete the evidence package.",
  });
  return caseRow;
}

async function ensurePipeline(supabase: any, opportunity: JsonRecord, dossier: JsonRecord, caseRow: JsonRecord) {
  if (opportunity.pipeline_record_id) return singleById(supabase, "ac_capital_pipeline_records", clean(opportunity.pipeline_record_id));
  let pipeline = await maybeBy(supabase, "ac_capital_pipeline_records", "opportunity_id", clean(opportunity.id));
  if (pipeline) {
    await updateOne(supabase, "ac_capital_radar_opportunities", clean(opportunity.id), {
      pipeline_record_id: pipeline.id,
      workflow_status: "pipeline-active",
      conversion_state: "pipeline-created",
      next_action: "Open Capital Pipeline and complete the next internal action.",
    });
    return pipeline;
  }
  const sources = await linkedSourcesForOpportunity(supabase, opportunity);
  const probability = Math.max(5, Math.min(85, Math.round(clamp(dossier.total_score) * 0.65)));
  const amount = numeric(opportunity.amount_max || opportunity.amount_min, 0);
  pipeline = await insertOne(supabase, "ac_capital_pipeline_records", {
    opportunity_id: clean(opportunity.id),
    qualification_dossier_id: clean(dossier.id),
    case_id: clean(caseRow.id),
    radar_cluster_id: opportunity.cluster_id || null,
    radar_source_ids: sources.map((row) => row.id),
    title: opportunity.title,
    stage: "Qualification / Evidence",
    status: "Active",
    funding_type: opportunity.opportunity_type || null,
    package_type: caseRow.package_type || null,
    estimated_amount_min: opportunity.amount_min || null,
    estimated_amount_max: opportunity.amount_max || null,
    currency_label: opportunity.currency_label || "Dh",
    weighted_value: amount > 0 ? Number((amount * probability / 100).toFixed(2)) : null,
    probability_percent: probability,
    deadline: opportunity.deadline || null,
    next_action: "Complete qualification and case evidence before approval.",
    next_action_due_date: opportunity.deadline || null,
    owner: opportunity.owner || "Capital Coordinator",
    priority: dossier.priority || "medium",
    relationship_temperature: "Uncontacted — external action locked",
    risk_level: opportunity.risk_level || "medium",
    readiness_score: caseRow.total_readiness_score || 15,
    founder_approval_status: "required",
    data_room_readiness_score: caseRow.document_readiness_score || 10,
    last_activity_at: now(),
    metadata: { generatedFromRadarWorkbench: true },
  });
  await insertOne(supabase, "ac_capital_pipeline_stage_events", {
    pipeline_record_id: pipeline.id,
    previous_stage: null,
    new_stage: "Qualification / Evidence",
    changed_by: "Radar-to-Case Workbench",
    reason: "Canonical opportunity converted into the internal capital pipeline.",
    evidence_reference: clean(opportunity.source_url) || null,
    comments: "External communication and submission remain locked.",
  });
  await updateOne(supabase, "ac_capital_radar_opportunities", clean(opportunity.id), {
    pipeline_record_id: pipeline.id,
    workflow_status: "pipeline-active",
    conversion_state: "pipeline-created",
    next_action: "Open Capital Pipeline and complete the next internal action.",
  });
  return pipeline;
}

async function ensureCoordinatorTasks(supabase: any, opportunity: JsonRecord, dossier: JsonRecord, caseRow: JsonRecord, pipeline: JsonRecord, actor: string) {
  const taskDefinitions = [
    ["Validate official funding evidence", "Evidence validation", "Confirm authoritative source, open status, deadline, eligibility and application URL.", true, false],
    ["Close qualification proof gaps", "Qualification proof", "Resolve missing evidence recorded in the qualification dossier.", true, false],
    ["Assemble funding-case documents", "Case preparation", "Collect legal, financial, ownership and use-of-funds documentation in the Data Room.", true, false],
    ["Prepare founder approval brief", "Founder approval", "Summarize readiness, risks, requested commitment and the exact external action awaiting approval.", true, true],
  ] as const;
  const taskIds: string[] = [];
  for (const [title, type, instruction, proofRequired, founderApproval] of taskDefinitions) {
    const existing = await supabase
      .from("ac_capital_coordinator_tasks")
      .select("*")
      .eq("related_case_id", clean(caseRow.id))
      .eq("task_title", title)
      .maybeSingle();
    if (existing.error) throw new Error(existing.error.message);
    if (existing.data) {
      taskIds.push(clean(existing.data.id));
      continue;
    }
    const task = await insertOne(supabase, "ac_capital_coordinator_tasks", {
      task_title: title,
      task_type: type,
      related_case_id: clean(caseRow.id),
      related_pipeline_record_id: clean(pipeline.id),
      priority: founderApproval || opportunity.deadline_heat === "critical" ? "critical" : "high",
      status: "Ready",
      due_at: opportunity.deadline || null,
      owner: opportunity.owner || "Capital Coordinator",
      ai_prepared: true,
      human_action_required: instruction,
      proof_required: proofRequired,
      founder_approval_required: founderApproval,
      risk_if_missed: founderApproval ? "No external commitment may occur without approval." : "The funding case may remain unqualified or miss its deadline.",
      next_step_after_completion: founderApproval ? "Open Founder Approval Chamber." : "Update the linked case and pipeline records.",
      source_workspace: "capital-radar",
    });
    taskIds.push(clean(task.id));
    await insertOne(supabase, "ac_capital_coordinator_ai_prepared_tasks", {
      prepared_by: "Radar-to-Case Workbench",
      linked_case_id: clean(caseRow.id),
      linked_pipeline_record_id: clean(pipeline.id),
      ai_confidence: clamp(dossier.ai_confidence),
      doctrine_used: ["evidence-first", "human-authority", "no-auto-submission"],
      script_or_document_prepared: instruction,
      approval_required: founderApproval,
      human_safety_check: "Verify every material claim and preserve the external-action lock.",
      recommended_action: title,
      status: "Pending Human Review",
    });
  }
  await insertOne(supabase, "ac_capital_coordinator_handover_sheets", {
    case_summary: `${opportunity.title} — evidence-bound internal funding case`,
    package_type: caseRow.package_type,
    deadline: opportunity.deadline || null,
    what_ai_prepared: ["Public-source evidence capture", "Preliminary qualification", "Draft case structure", "Pipeline record", "Coordinator missions"],
    what_human_must_do: taskDefinitions.map(([title]) => title),
    documents_ready: [],
    documents_missing: strings(opportunity.required_documents).length ? strings(opportunity.required_documents) : ["Official eligibility guide", "Application instructions", "Legal and financial proof pack"],
    founder_approvals: ["External outreach/application/submission approval"],
    email_call_scripts: [],
    proof_to_upload_after_execution: ["Official-source validation", "Document references", "Approval record", "Submission proof if later approved"],
    followup_date: opportunity.deadline || null,
    escalation_conditions: ["Deadline within 14 days", "Eligibility cannot be confirmed", "Required proof unavailable", "External commitment requested"],
    final_checklist: ["Evidence validated", "Qualification decided", "Case documents complete", "Founder approval recorded", "External action proof retained"],
    status: "Ready",
  });
  await audit(supabase, {
    actor,
    action: "radar_create_coordinator_missions",
    objectType: "coordinator_tasks",
    objectId: taskIds[0] || null,
    after: { opportunityId: opportunity.id, caseId: caseRow.id, pipelineId: pipeline.id, taskIds },
    reason: "Controlled internal missions created from a validated capital opportunity.",
  });
  return taskIds;
}

export async function loadRadarWorkbench() {
  const supabase = await createServiceClient() as any;
  const queries = await Promise.all([
    supabase.from("ac_capital_radar_opportunities").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("ac_capital_radar_sources").select("*").order("created_at", { ascending: false }).limit(1000),
    supabase.from("ac_capital_radar_research_runs").select("*").order("started_at", { ascending: false }).limit(250),
    supabase.from("ac_capital_radar_rejections").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("ac_capital_radar_handoff_queue").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("ac_capital_radar_evidence_clusters").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("ac_capital_radar_evidence_cluster_members").select("*").limit(1500),
    supabase.from("ac_capital_radar_source_reviews").select("*").order("reviewed_at", { ascending: false }).limit(500),
    supabase.from("ac_capital_radar_conversion_events").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("ac_capital_radar_research_missions").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("ac_capital_radar_internal_notes").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("ac_capital_qualification_dossiers").select("*").order("created_at", { ascending: false }).limit(400),
    supabase.from("ac_capital_cases").select("*").order("created_at", { ascending: false }).limit(400),
    supabase.from("ac_capital_pipeline_records").select("*").order("created_at", { ascending: false }).limit(400),
    supabase.from("ac_capital_coordinator_tasks").select("*").order("created_at", { ascending: false }).limit(600),
    supabase.from("ac_capital_ai_agent_runs").select("*").order("created_at", { ascending: false }).limit(150),
  ]);
  for (const result of queries) if (result.error) throw new Error(result.error.message);
  const [opportunities, sources, researchRuns, rejections, handoffQueue, clusters, clusterMembers, sourceReviews, conversionEvents, researchMissions, notes, qualificationDossiers, cases, pipelineRecords, coordinatorTasks, agentRuns] = queries.map((result) => (result.data || []) as JsonRecord[]);
  return {
    opportunities,
    sources,
    researchRuns,
    rejections,
    handoffQueue,
    clusters,
    clusterMembers,
    sourceReviews,
    conversionEvents,
    researchMissions,
    notes,
    qualificationDossiers,
    cases,
    pipelineRecords,
    coordinatorTasks,
    agentRuns,
  };
}

export async function executeRadarWorkbenchAction(input: {
  action: string;
  body: JsonRecord;
  actor: { id: string; name: string; email: string };
}): Promise<JsonRecord> {
  const supabase = await createServiceClient() as any;
  const actorName = input.actor.email || input.actor.name;
  const body = input.body;
  const action = input.action;

  if (action === "review-source") {
    const sourceId = clean(body.sourceId);
    if (!sourceId) throw new Error("SOURCE_ID_REQUIRED");
    const source = await singleById(supabase, "ac_capital_radar_sources", sourceId);
    const decision = clean(body.decision || "needs-review");
    const lifecycle = ({
      validate: "validated",
      reject: "rejected",
      secondary: "secondary-evidence",
      archive: "archived",
      "needs-review": "captured",
    } as Record<string, string>)[decision] || "captured";
    const updated = await updateOne(supabase, "ac_capital_radar_sources", sourceId, {
      verification_status: lifecycle,
      lifecycle_status: lifecycle,
      source_confidence: clamp(body.confidence, numeric(source.source_confidence, 50)),
      officiality: clean(body.officiality || source.officiality || "unverified"),
      assigned_reviewer: clean(body.assignedReviewer || source.assigned_reviewer) || null,
      review_note: clean(body.note) || null,
      reviewed_by: actorName,
      reviewed_at: now(),
    });
    const review = await insertOne(supabase, "ac_capital_radar_source_reviews", {
      source_id: sourceId,
      opportunity_id: source.linked_opportunity_id || null,
      cluster_id: source.cluster_id || null,
      decision,
      confidence: updated.source_confidence,
      officiality: updated.officiality,
      assigned_reviewer: updated.assigned_reviewer,
      review_note: updated.review_note,
      reviewed_by: actorName,
      evidence_snapshot: source,
    });
    await audit(supabase, { actor: actorName, action, objectType: "radar_source", objectId: sourceId, before: source, after: updated, reason: clean(body.note) });
    return { source: updated, review };
  }

  if (action === "bulk-review-sources") {
    const sourceIds = strings(body.sourceIds);
    if (!sourceIds.length) throw new Error("SOURCE_IDS_REQUIRED");
    const results = [];
    for (const sourceId of sourceIds) {
      results.push(await executeRadarWorkbenchAction({ ...input, action: "review-source", body: { ...body, sourceId } }));
    }
    return { results };
  }

  if (action === "create-cluster") {
    const sourceIds = strings(body.sourceIds);
    const result = await clusterSources(supabase, sourceIds, actorName, clean(body.clusterTitle));
    await audit(supabase, { actor: actorName, action, objectType: "radar_evidence_cluster", objectId: clean(result.cluster.id), after: result });
    return result;
  }

  if (action === "auto-cluster") {
    const sourceIds = strings(body.sourceIds);
    let sources: JsonRecord[];
    if (sourceIds.length) {
      sources = await listByIds(supabase, "ac_capital_radar_sources", sourceIds);
    } else {
      const unclustered = await supabase
        .from("ac_capital_radar_sources")
        .select("*")
        .is("cluster_id", null)
        .limit(300);
      if (unclustered.error) throw new Error(unclustered.error.message);
      sources = (unclustered.data || []) as JsonRecord[];
    }
    const groups = new Map<string, JsonRecord[]>();
    for (const source of sources) {
      const key = `${domainOf(source.source_url)}::${normalizedKey(source.source_name)}`;
      groups.set(key, [...(groups.get(key) || []), source]);
    }
    const clusters = [];
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      clusters.push(await clusterSources(supabase, group.map((row) => clean(row.id)), actorName));
    }
    return { clusters, groupedSources: clusters.reduce((sum, row) => sum + row.sources.length, 0) };
  }

  if (action === "create-opportunity-from-source") {
    const sourceId = clean(body.sourceId);
    if (!sourceId) throw new Error("SOURCE_ID_REQUIRED");
    const result = await ensureOpportunityFromSource(supabase, sourceId, actorName, object(body.overrides));
    const conversion = await recordConversion(supabase, {
      actor: actorName,
      mode: "source-to-opportunity",
      sourceId,
      opportunityId: clean(result.opportunity.id),
      clusterId: clean(result.source.cluster_id) || null,
      before: result.source,
      after: result.opportunity,
      reason: clean(body.reason || "Validated source promoted to a canonical opportunity candidate."),
    });
    await audit(supabase, { actor: actorName, action, objectType: "radar_opportunity", objectId: clean(result.opportunity.id), after: { ...result, conversion } });
    return { ...result, conversion };
  }

  if (action === "attach-source-to-opportunity") {
    const sourceId = clean(body.sourceId);
    const opportunityId = clean(body.opportunityId);
    if (!sourceId || !opportunityId) throw new Error("SOURCE_AND_OPPORTUNITY_REQUIRED");
    const source = await updateOne(supabase, "ac_capital_radar_sources", sourceId, {
      linked_opportunity_id: opportunityId,
      lifecycle_status: "validated",
      verification_status: "validated",
      reviewed_by: actorName,
      reviewed_at: now(),
    });
    const opportunity = await singleById(supabase, "ac_capital_radar_opportunities", opportunityId);
    const countResult = await supabase.from("ac_capital_radar_sources").select("id", { count: "exact", head: true }).eq("linked_opportunity_id", opportunityId);
    if (countResult.error) throw new Error(countResult.error.message);
    const updatedOpportunity = await updateOne(supabase, "ac_capital_radar_opportunities", opportunityId, {
      linked_source_count: Number(countResult.count || 1),
      evidence_quality_score: Math.max(clamp(opportunity.evidence_quality_score), clamp(source.source_confidence)),
    });
    return { source, opportunity: updatedOpportunity };
  }

  if (action === "opportunity-disposition") {
    const opportunityId = clean(body.opportunityId);
    const opportunity = await singleById(supabase, "ac_capital_radar_opportunities", opportunityId);
    const disposition = clean(body.disposition || "watchlist");
    const status = disposition === "reject" ? "rejected" : disposition === "qualify" ? "ready-for-qualification" : "watchlist";
    const updated = await updateOne(supabase, "ac_capital_radar_opportunities", opportunityId, {
      status,
      handoff_status: disposition === "qualify" ? "ready-for-qualification" : opportunity.handoff_status,
      workflow_status: disposition === "reject" ? "rejected" : disposition === "qualify" ? "qualification-pending" : "watchlist",
      next_action: clean(body.nextAction || body.reason) || opportunity.next_action,
      owner: clean(body.owner || opportunity.owner) || null,
      conversion_state: disposition === "qualify" ? "qualification-pending" : opportunity.conversion_state,
    });
    await audit(supabase, { actor: actorName, action, objectType: "radar_opportunity", objectId: opportunityId, before: opportunity, after: updated, reason: clean(body.reason) });
    return { opportunity: updated };
  }

  if (["send-to-qualification", "create-case", "add-to-pipeline", "create-missions", "convert-full-chain"].includes(action)) {
    let opportunityId = clean(body.opportunityId);
    let sourceId = clean(body.sourceId);
    if (!opportunityId && sourceId) {
      const materialized = await ensureOpportunityFromSource(supabase, sourceId, actorName, object(body.overrides));
      opportunityId = clean(materialized.opportunity.id);
    }
    if (!opportunityId) throw new Error("OPPORTUNITY_OR_SOURCE_REQUIRED");
    let opportunity = await singleById(supabase, "ac_capital_radar_opportunities", opportunityId);
    const before = { opportunity };
    const dossier = await ensureQualification(supabase, opportunity, actorName);
    opportunity = await singleById(supabase, "ac_capital_radar_opportunities", opportunityId);
    let caseRow: JsonRecord | null = null;
    let pipeline: JsonRecord | null = null;
    let taskIds: string[] = [];
    if (["create-case", "add-to-pipeline", "create-missions", "convert-full-chain"].includes(action)) {
      caseRow = await ensureCase(supabase, opportunity, dossier, actorName);
      opportunity = await singleById(supabase, "ac_capital_radar_opportunities", opportunityId);
    }
    if (["add-to-pipeline", "create-missions", "convert-full-chain"].includes(action)) {
      pipeline = await ensurePipeline(supabase, opportunity, dossier, caseRow as JsonRecord);
      opportunity = await singleById(supabase, "ac_capital_radar_opportunities", opportunityId);
    }
    if (["create-missions", "convert-full-chain"].includes(action)) {
      taskIds = await ensureCoordinatorTasks(supabase, opportunity, dossier, caseRow as JsonRecord, pipeline as JsonRecord, actorName);
      await updateOne(supabase, "ac_capital_radar_opportunities", opportunityId, {
        workflow_status: "internal-missions-ready",
        conversion_state: "full-chain-materialized",
        next_action: "Execute coordinator missions and prepare founder approval.",
      });
      opportunity = await singleById(supabase, "ac_capital_radar_opportunities", opportunityId);
    }
    const conversion = await recordConversion(supabase, {
      actor: actorName,
      mode: action,
      sourceId: sourceId || clean(opportunity.source_id) || null,
      opportunityId,
      clusterId: clean(opportunity.cluster_id) || null,
      dossierId: clean(dossier.id),
      caseId: caseRow ? clean(caseRow.id) : null,
      pipelineId: pipeline ? clean(pipeline.id) : null,
      taskIds,
      before,
      after: { opportunity, dossier, caseRow, pipeline, taskIds },
      reason: clean(body.reason || "Controlled Radar-to-Case workflow conversion."),
    });
    if (dossier && !dossier.conversion_event_id) await updateOne(supabase, "ac_capital_qualification_dossiers", clean(dossier.id), { conversion_event_id: conversion.id });
    if (caseRow && !caseRow.conversion_event_id) await updateOne(supabase, "ac_capital_cases", clean(caseRow.id), { conversion_event_id: conversion.id });
    if (pipeline && !pipeline.conversion_event_id) await updateOne(supabase, "ac_capital_pipeline_records", clean(pipeline.id), { conversion_event_id: conversion.id });
    await audit(supabase, { actor: actorName, action, objectType: "radar_workflow_conversion", objectId: clean(conversion.id), before, after: { opportunity, dossier, caseRow, pipeline, taskIds }, reason: conversion.reason as string });
    return { opportunity, dossier, case: caseRow, pipeline, taskIds, conversion };
  }

  if (action === "request-deeper-research") {
    const sourceId = clean(body.sourceId) || null;
    const opportunityId = clean(body.opportunityId) || null;
    const clusterId = clean(body.clusterId) || null;
    const context = sourceId ? await singleById(supabase, "ac_capital_radar_sources", sourceId) : opportunityId ? await singleById(supabase, "ac_capital_radar_opportunities", opportunityId) : {};
    const researchQuery = clean(body.researchQuery) || `Find authoritative current evidence, eligibility rules, application status, deadline, amount and direct application path for: ${clean(context.source_name || context.title)} ${clean(context.source_url)}.`;
    const mission = await insertOne(supabase, "ac_capital_radar_research_missions", {
      mission_title: clean(body.missionTitle || `Deeper research · ${clean(context.source_name || context.title || "Capital signal")}`),
      mission_type: "deeper-research",
      source_id: sourceId,
      opportunity_id: opportunityId,
      cluster_id: clusterId,
      research_query: researchQuery,
      requested_depth: clean(body.requestedDepth || "basic"),
      status: "queued",
      requested_by: actorName,
      assigned_agent_key: clean(body.agentKey || "funding-opportunity-radar"),
      notes: clean(body.note) || null,
    });
    return { mission };
  }

  if (action === "add-note") {
    const note = clean(body.note);
    if (!note) throw new Error("NOTE_REQUIRED");
    const row = await insertOne(supabase, "ac_capital_radar_internal_notes", {
      source_id: clean(body.sourceId) || null,
      opportunity_id: clean(body.opportunityId) || null,
      cluster_id: clean(body.clusterId) || null,
      note_type: clean(body.noteType || "internal"),
      note,
      actor: actorName,
    });
    return { note: row };
  }

  throw new Error(`UNSUPPORTED_RADAR_WORKBENCH_ACTION:${action}`);
}
