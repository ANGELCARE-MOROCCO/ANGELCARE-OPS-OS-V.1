import { createServiceClient } from "@/lib/supabase/server";
import { executeExternalResearchAgent, executeOpenRouterCapability, executeOpenRouterReport } from "./free-provider-runtime";
import { buildArtifactContext, createCapitalArtifact, deterministicArtifactContent } from "./artifact-factory";
import { createNotification, type InstitutionalActor } from "./institutional-runtime";
import type { JsonRecord } from "./free-provider-types";

const now = () => new Date().toISOString();
const clean = (value: unknown) => String(value ?? "").trim();
const object = (value: unknown): JsonRecord => value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
const rows = (value: unknown): JsonRecord[] => Array.isArray(value) ? value.filter((item): item is JsonRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
const strings = (value: unknown) => Array.isArray(value) ? value.map(clean).filter(Boolean) : [];
const actorName = (actor: InstitutionalActor) => clean(actor.email || actor.name || actor.id || "AC Capital agent runtime");

type SupabaseAny = Awaited<ReturnType<typeof createServiceClient>>;

type AgentExecutionInput = {
  event: JsonRecord;
  workflow: JsonRecord;
  actor: InstitutionalActor;
};

const baseSchema = (properties: JsonRecord, required: string[]) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});

async function latestDoctrine(supabase: SupabaseAny) {
  const result = await supabase.from("ac_capital_doctrine_compilations").select("*").in("status", ["active", "conflicted"]).order("compiled_at", { ascending: false }).limit(1).maybeSingle();
  if (result.error) throw result.error;
  return result.data as JsonRecord | null;
}

async function recordById(supabase: SupabaseAny, table: string, id: string) {
  const result = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (result.error) throw result.error;
  return result.data ? result.data as JsonRecord : null;
}

async function persistAgentOutput(supabase: SupabaseAny, input: {
  agentKey: string;
  capability: string;
  workflowId?: string;
  eventId?: string;
  entityType?: string;
  entityId?: string;
  providerRunId?: string;
  doctrineCompilationId?: string;
  inputSnapshot: JsonRecord;
  outputSnapshot: JsonRecord;
  confidence?: number;
  actor: InstitutionalActor;
}) {
  const result = await supabase.from("ac_capital_agent_outputs").insert({
    agent_key: input.agentKey,
    capability: input.capability,
    workflow_id: input.workflowId || null,
    event_id: input.eventId || null,
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
    provider_run_id: input.providerRunId || null,
    doctrine_compilation_id: input.doctrineCompilationId || null,
    input_snapshot: input.inputSnapshot,
    output_snapshot: input.outputSnapshot,
    confidence: input.confidence ?? null,
    status: "draft-human-review",
    human_review_required: true,
    created_by: actorName(input.actor),
  }).select("*").single();
  if (result.error) throw result.error;
  return result.data as JsonRecord;
}

async function emit(supabase: SupabaseAny, input: { eventType: string; entityType: string; entityId?: string; workspace: string; payload?: JsonRecord; priority?: string }) {
  const idempotency = `agent:${input.eventType}:${input.entityType}:${input.entityId || "none"}:${clean(input.payload?.version || input.payload?.updatedAt || now().slice(0, 16))}`;
  const result = await supabase.from("ac_capital_orchestrator_events").upsert({
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    source_workspace: input.workspace,
    payload: input.payload || {},
    idempotency_key: idempotency,
    priority: input.priority || "normal",
    status: "queued",
    available_at: now(),
    created_by: "institutional-agent-runtime",
    updated_at: now(),
  }, { onConflict: "idempotency_key", ignoreDuplicates: true }).select("*").maybeSingle();
  if (result.error) throw result.error;
  return result.data as JsonRecord | null;
}

async function executeFunderIntelligence(input: AgentExecutionInput) {
  const supabase = await createServiceClient();
  const event = input.event;
  const funderId = clean(event.entity_id || object(event.payload).funderId);
  const funder = funderId ? await recordById(supabase, "ac_capital_funders", funderId) : null;
  if (!funder) throw new Error("AC_CAPITAL_FUNDER_REQUIRED");
  const doctrine = await latestDoctrine(supabase);
  const query = `Official public information about ${clean(funder.name)} funding thesis, eligibility, typical ticket, sectors, geography, application process, portfolio or awards, and current opportunities relevant to AngelCare childcare, education, SaaS and impact in Morocco or Africa.`;
  const research = await executeExternalResearchAgent({ agentKey: "funder-intelligence-agent", query, triggerType: "manual", actorId: clean(input.actor.id) || null });
  const analysisSchema = baseSchema({
    thesis: { type: "string" },
    priorities: { type: "array", items: { type: "string" } },
    concerns: { type: "array", items: { type: "string" } },
    proofRequired: { type: "array", items: { type: "string" } },
    languageToUse: { type: "array", items: { type: "string" } },
    languageToAvoid: { type: "array", items: { type: "string" } },
    fitScore: { type: "number" },
    relationshipStrategy: { type: "string" },
    recommendedNarrative: { type: "string" },
    nextAction: { type: "string" },
    confidence: { type: "number" },
    missingEvidence: { type: "array", items: { type: "string" } },
  }, ["thesis","priorities","concerns","proofRequired","languageToUse","languageToAvoid","fitScore","relationshipStrategy","recommendedNarrative","nextAction","confidence","missingEvidence"]);
  const capability = await executeOpenRouterCapability({
    agentKey: "funder-intelligence-agent",
    capability: "funder_intelligence",
    systemPrompt: "You are AngelCare's senior funder intelligence director.",
    prompt: "Build a living, evidence-bound funder dossier and relationship strategy from the public research evidence.",
    schema: analysisSchema,
    context: { funder, publicResearch: { sources: research.sources, analysis: research.analysis }, doctrine: doctrine?.effective_bundle || {} },
    actorId: clean(input.actor.id) || null,
    workflowId: clean(input.workflow.id) || null,
    eventId: clean(event.id) || null,
  });
  const result = capability.result;
  const update = await supabase.from("ac_capital_funders").update({
    angelcare_fit_score: Math.max(0, Math.min(100, Number(result.fitScore || 0))),
    recommended_narrative: clean(result.recommendedNarrative),
    next_action: clean(result.nextAction),
    source_confidence: Math.max(Number(funder.source_confidence || 0), Math.max(0, Math.min(100, Number(result.confidence || 0)))),
    last_automation_agent: "funder-intelligence-agent",
    last_automation_at: now(),
    updated_at: now(),
  }).eq("id", funderId).select("*").single();
  if (update.error) throw update.error;
  await supabase.from("ac_capital_funder_psychology_briefs").insert({
    funder_id: funderId,
    decision_style: clean(result.relationshipStrategy),
    likely_priorities: strings(result.priorities),
    likely_concerns: strings(result.concerns),
    proof_required: strings(result.proofRequired),
    language_to_use: strings(result.languageToUse),
    language_to_avoid: strings(result.languageToAvoid),
    founder_level_required: false,
  });
  const narrativeInsert = await supabase.from("ac_capital_funder_narratives").insert({
    funder_id: funderId,
    narrative_type: "institutional-ai-positioning",
    recommended_angle: clean(result.recommendedNarrative),
    opening_message: clean(result.recommendedNarrative),
    proof_to_emphasize: strings(result.proofRequired),
    ideal_next_action: clean(result.nextAction),
  });
  if (narrativeInsert.error) throw narrativeInsert.error;
  const output = await persistAgentOutput(supabase, { agentKey: "funder-intelligence-agent", capability: "funder_intelligence", workflowId: clean(input.workflow.id), eventId: clean(event.id), entityType: "funder", entityId: funderId, providerRunId: capability.runId, doctrineCompilationId: clean(doctrine?.id), inputSnapshot: { funder, publicResearchRunId: research.runId }, outputSnapshot: result, confidence: Number(result.confidence || 0), actor: input.actor });
  return { funder: update.data, agentOutput: output, researchRunId: research.runId, providerRunId: capability.runId };
}

async function executeQualification(input: AgentExecutionInput) {
  const supabase = await createServiceClient();
  const event = input.event;
  const opportunityId = clean(event.entity_id || object(event.payload).opportunityId);
  const opportunity = opportunityId ? await recordById(supabase, "ac_capital_radar_opportunities", opportunityId) : null;
  if (!opportunity) throw new Error("AC_CAPITAL_OPPORTUNITY_REQUIRED");
  const source = opportunity.source_id ? await recordById(supabase, "ac_capital_radar_sources", clean(opportunity.source_id)) : null;
  const doctrine = await latestDoctrine(supabase);
  const schema = baseSchema({
    decisionLabel: { type: "string" }, totalScore: { type: "number" }, confidence: { type: "number" },
    executiveSummary: { type: "string" }, eligibilitySummary: { type: "string" }, matchSummary: { type: "string" },
    criteria: { type: "array", items: { type: "object", properties: { key:{type:"string"}, label:{type:"string"}, weight:{type:"number"}, score:{type:"number"}, explanation:{type:"string"}, evidenceStatus:{type:"string"}, missingEvidence:{type:"string"}, riskNote:{type:"string"} }, required:["key","label","weight","score","explanation","evidenceStatus","missingEvidence","riskNote"], additionalProperties:false } },
    risks: { type: "array", items: { type: "object", properties: { type:{type:"string"}, severity:{type:"string"}, description:{type:"string"}, mitigation:{type:"string"} }, required:["type","severity","description","mitigation"], additionalProperties:false } },
    missingDocuments: { type: "array", items: { type: "object", properties: { name:{type:"string"}, category:{type:"string"}, priority:{type:"string"}, reason:{type:"string"} }, required:["name","category","priority","reason"], additionalProperties:false } },
    nextActions: { type: "array", items: { type: "object", properties: { label:{type:"string"}, why:{type:"string"}, owner:{type:"string"}, priority:{type:"string"}, expectedOutput:{type:"string"} }, required:["label","why","owner","priority","expectedOutput"], additionalProperties:false } },
  }, ["decisionLabel","totalScore","confidence","executiveSummary","eligibilitySummary","matchSummary","criteria","risks","missingDocuments","nextActions"]);
  const capability = await executeOpenRouterCapability({
    agentKey: "qualification-underwriter", capability: "opportunity_qualification",
    systemPrompt: "You are AngelCare's evidence-first capital qualification underwriter.",
    prompt: "Underwrite this opportunity against AngelCare doctrine. Apply hard eligibility checks, explain every score and create proof gaps. Use Pursue, Pursue Conditionally, More Evidence Required, Watchlist, Defer, Reject, or Escalate to Founder.",
    schema, context: { opportunity, source, doctrine: doctrine?.effective_bundle || {} }, actorId: clean(input.actor.id) || null,
    workflowId: clean(input.workflow.id), eventId: clean(event.id),
  });
  const result = capability.result;
  let dossierQuery = await supabase.from("ac_capital_qualification_dossiers").select("*").eq("radar_opportunity_id", opportunityId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (dossierQuery.error) throw dossierQuery.error;
  const dossierPayload = {
    radar_opportunity_id: opportunityId,
    title: clean(opportunity.title), opportunity_type: clean(opportunity.opportunity_type), country: clean(opportunity.country) || null,
    region: clean(opportunity.region) || null, source_confidence: Number(opportunity.source_confidence || 0),
    total_score: Math.max(0, Math.min(100, Number(result.totalScore || 0))), decision_label: clean(result.decisionLabel),
    ai_confidence: Math.max(0, Math.min(100, Number(result.confidence || 0))), status: "AI Underwritten — Human Review",
    priority: Number(result.totalScore || 0) >= 75 ? "high" : "medium", deadline: clean(opportunity.deadline || opportunity.deadline_label) || null,
    founder_review_required: /founder|conditionally|escalate/i.test(clean(result.decisionLabel)), next_action: clean(rows(result.nextActions)[0]?.label),
    executive_summary: clean(result.executiveSummary), eligibility_summary: clean(result.eligibilitySummary), angelcare_match_summary: clean(result.matchSummary),
    last_automation_agent: "qualification-underwriter", last_automation_at: now(), updated_at: now(),
  };
  let dossier: JsonRecord;
  if (dossierQuery.data) {
    const updated = await supabase.from("ac_capital_qualification_dossiers").update(dossierPayload).eq("id", dossierQuery.data.id).select("*").single();
    if (updated.error) throw updated.error; dossier = updated.data as JsonRecord;
  } else {
    const inserted = await supabase.from("ac_capital_qualification_dossiers").insert(dossierPayload).select("*").single();
    if (inserted.error) throw inserted.error; dossier = inserted.data as JsonRecord;
  }
  const dossierId = clean(dossier.id);
  await Promise.all([
    supabase.from("ac_capital_qualification_scores").delete().eq("dossier_id", dossierId),
    supabase.from("ac_capital_qualification_risks").delete().eq("dossier_id", dossierId),
    supabase.from("ac_capital_qualification_missing_documents").delete().eq("dossier_id", dossierId),
    supabase.from("ac_capital_qualification_next_actions").delete().eq("dossier_id", dossierId),
  ]);
  const criteria = rows(result.criteria).map((item) => ({ dossier_id: dossierId, criterion_key: clean(item.key), criterion_label: clean(item.label), weight: Number(item.weight || 0), score: Number(item.score || 0), weighted_score: Number(item.weight || 0) * Number(item.score || 0) / 100, explanation: clean(item.explanation), evidence_status: clean(item.evidenceStatus), confidence: Number(result.confidence || 0), missing_evidence: clean(item.missingEvidence), risk_note: clean(item.riskNote) }));
  const risks = rows(result.risks).map((item) => ({ dossier_id: dossierId, risk_type: clean(item.type), severity: clean(item.severity), description: clean(item.description), mitigation: clean(item.mitigation), owner: "Capital Coordinator", founder_review_required: /critical|high/i.test(clean(item.severity)) }));
  const missing = rows(result.missingDocuments).map((item) => ({ dossier_id: dossierId, document_name: clean(item.name), document_category: clean(item.category), status: "Missing", priority: clean(item.priority || "medium"), required_for_submission: true, owner: "Finance / Data Room" }));
  const actions = rows(result.nextActions).map((item) => ({ dossier_id: dossierId, action_label: clean(item.label), why: clean(item.why), owner: clean(item.owner), priority: clean(item.priority), expected_output: clean(item.expectedOutput), related_workspace: "qualification", status: "open" }));
  if (criteria.length) { const insert = await supabase.from("ac_capital_qualification_scores").insert(criteria); if (insert.error) throw insert.error; }
  if (risks.length) { const insert = await supabase.from("ac_capital_qualification_risks").insert(risks); if (insert.error) throw insert.error; }
  if (missing.length) { const insert = await supabase.from("ac_capital_qualification_missing_documents").insert(missing); if (insert.error) throw insert.error; }
  if (actions.length) { const insert = await supabase.from("ac_capital_qualification_next_actions").insert(actions); if (insert.error) throw insert.error; }
  await supabase.from("ac_capital_qualification_decisions").insert({ dossier_id: dossierId, decision_label: clean(result.decisionLabel), decision_reason: clean(result.executiveSummary), decided_by: "AI Qualification Underwriter", founder_review_required: dossierPayload.founder_review_required, status: "draft-human-review" });
  const output = await persistAgentOutput(supabase, { agentKey: "qualification-underwriter", capability: "opportunity_qualification", workflowId: clean(input.workflow.id), eventId: clean(event.id), entityType: "opportunity", entityId: opportunityId, providerRunId: capability.runId, doctrineCompilationId: clean(doctrine?.id), inputSnapshot: { opportunity, source }, outputSnapshot: result, confidence: Number(result.confidence || 0), actor: input.actor });
  const pursue = /pursue|approved|qualified/i.test(clean(result.decisionLabel));
  const nextEvent = pursue ? await emit(supabase, { eventType: "qualification.approved", entityType: "qualification", entityId: dossierId, workspace: "qualification", payload: { opportunityId, decision: result.decisionLabel, version: dossier.record_version }, priority: "high" }) : null;
  if (missing.length) await createNotification({ notificationType: "proof-gap", severity: "warning", title: `${missing.length} proof gap(s) require closure`, message: clean(result.executiveSummary), entityType: "qualification", entityId: dossierId, workspaceKey: "qualification", actionHref: "/ac-capital-os/qualification", deduplicationKey: `proof-gap:${dossierId}:${dossier.record_version || 1}` });
  return { dossier, criteria, risks, missingDocuments: missing, nextActions: actions, agentOutput: output, nextEvent };
}

async function executeCaseArchitecture(input: AgentExecutionInput) {
  const supabase = await createServiceClient();
  const event = input.event;
  const dossierId = clean(event.entity_id || object(event.payload).qualificationId);
  const dossier = dossierId ? await recordById(supabase, "ac_capital_qualification_dossiers", dossierId) : null;
  if (!dossier) throw new Error("AC_CAPITAL_QUALIFICATION_REQUIRED");
  const opportunity = dossier.radar_opportunity_id ? await recordById(supabase, "ac_capital_radar_opportunities", clean(dossier.radar_opportunity_id)) : null;
  const doctrine = await latestDoctrine(supabase);
  const schema = baseSchema({
    caseTitle:{type:"string"}, packageType:{type:"string"}, fundingType:{type:"string"}, requestedAmount:{type:"number"}, currencyLabel:{type:"string"},
    executiveNarrative:{type:"string"}, positioning:{type:"string"}, financialNarrative:{type:"string"}, useOfFunds:{type:"array",items:{type:"string"}},
    conservativeScenario:{type:"string"}, baseScenario:{type:"string"}, upsideScenario:{type:"string"},
    impact:{type:"array",items:{type:"object",properties:{category:{type:"string"},statement:{type:"string"},indicator:{type:"string"},proofNeeded:{type:"string"},safeWording:{type:"string"}},required:["category","statement","indicator","proofNeeded","safeWording"],additionalProperties:false}},
    risks:{type:"array",items:{type:"object",properties:{type:{type:"string"},severity:{type:"string"},description:{type:"string"},mitigation:{type:"string"},planB:{type:"string"},planC:{type:"string"},planD:{type:"string"}},required:["type","severity","description","mitigation","planB","planC","planD"],additionalProperties:false}},
    proofPack:{type:"array",items:{type:"object",properties:{type:{type:"string"},required:{type:"boolean"},available:{type:"boolean"},source:{type:"string"}},required:["type","required","available","source"],additionalProperties:false}},
    readiness:{type:"number"}, nextAction:{type:"string"}, confidence:{type:"number"}
  }, ["caseTitle","packageType","fundingType","requestedAmount","currencyLabel","executiveNarrative","positioning","financialNarrative","useOfFunds","conservativeScenario","baseScenario","upsideScenario","impact","risks","proofPack","readiness","nextAction","confidence"]);
  const capability = await executeOpenRouterCapability({ agentKey:"funding-case-architect", capability:"case_drafting", systemPrompt:"You are AngelCare's senior funding case architect.", prompt:"Create a complete evidence-bound funding case architecture. Never invent figures; make missing facts explicit in proof requirements.", schema, context:{dossier, opportunity, doctrine:doctrine?.effective_bundle||{}}, actorId:clean(input.actor.id)||null, workflowId:clean(input.workflow.id), eventId:clean(event.id) });
  const result = capability.result;
  let existing = await supabase.from("ac_capital_cases").select("*").eq("qualification_dossier_id", dossierId).order("created_at",{ascending:false}).limit(1).maybeSingle();
  if (existing.error) throw existing.error;
  const payload = { qualification_dossier_id:dossierId, opportunity_id:clean(dossier.radar_opportunity_id)||null, case_title:clean(result.caseTitle||dossier.title), package_type:clean(result.packageType||"Funding Case Book"), funding_type:clean(result.fundingType)||null, requested_amount:Number(result.requestedAmount||0)||null, currency_label:clean(result.currencyLabel||"Dh"), deadline:clean(opportunity?.deadline)||null, total_readiness_score:Math.max(0,Math.min(100,Number(result.readiness||0))), doctrine_alignment_score:Math.max(0,Math.min(100,Number(dossier.total_score||0))), document_readiness_score:Math.max(0,100-rows(result.proofPack).filter((item)=>item.required===true&&item.available!==true).length*15), financial_readiness_score:clean(result.financialNarrative)?70:20, risk_readiness_score:rows(result.risks).length?70:30, founder_approval_status:"not_started", coordinator_handover_status:"not_started", status:"AI Draft Ready — Human Review", priority:clean(dossier.priority||"medium"), owner:clean(dossier.recommended_owner||"Capital Strategy"), next_action:clean(result.nextAction), last_automation_agent:"funding-case-architect", last_automation_at:now(), updated_at:now() };
  let caseRow: JsonRecord;
  if (existing.data) { const u=await supabase.from("ac_capital_cases").update(payload).eq("id",existing.data.id).select("*").single(); if(u.error)throw u.error;caseRow=u.data as JsonRecord; }
  else { const i=await supabase.from("ac_capital_cases").insert(payload).select("*").single(); if(i.error)throw i.error;caseRow=i.data as JsonRecord; }
  const caseId=clean(caseRow.id);
  await Promise.all([
    supabase.from("ac_capital_case_narratives").delete().eq("case_id",caseId),
    supabase.from("ac_capital_case_financial_sections").delete().eq("case_id",caseId),
    supabase.from("ac_capital_case_risk_plans").delete().eq("case_id",caseId),
    supabase.from("ac_capital_case_impact_sections").delete().eq("case_id",caseId),
    supabase.from("ac_capital_case_proof_packs").delete().eq("case_id",caseId),
  ]);
  await supabase.from("ac_capital_case_narratives").insert([{case_id:caseId,narrative_type:"executive-case",headline:clean(result.caseTitle),opening_message:clean(result.executiveNarrative),proof_to_emphasize:clean(result.positioning),tone:"Executive evidence-first",founder_review_required:true,status:"AI Draft — Human Review"},{case_id:caseId,narrative_type:"positioning",headline:"Funder-specific positioning",opening_message:clean(result.positioning),proof_to_emphasize:clean(result.executiveNarrative),tone:"Institutional",founder_review_required:true,status:"AI Draft — Human Review"}]);
  await supabase.from("ac_capital_case_financial_sections").insert({case_id:caseId,requested_amount:Number(result.requestedAmount||0)||null,currency_label:clean(result.currencyLabel||"Dh"),funding_instrument_type:clean(result.fundingType),use_of_funds:strings(result.useOfFunds),conservative_scenario:clean(result.conservativeScenario),base_scenario:clean(result.baseScenario),upside_scenario:clean(result.upsideScenario),status:"AI Draft — Finance Review",owner:"Finance / Administration"});
  const riskRows=rows(result.risks).map((item)=>({case_id:caseId,risk_type:clean(item.type),severity:clean(item.severity),description:clean(item.description),mitigation:clean(item.mitigation),plan_b:clean(item.planB),plan_c:clean(item.planC),plan_d:clean(item.planD),owner:"Capital Strategy",founder_review_required:/critical|high/i.test(clean(item.severity)),status:"AI Draft — Human Review"}));
  if(riskRows.length){const i=await supabase.from("ac_capital_case_risk_plans").insert(riskRows);if(i.error)throw i.error;}
  const impactRows=rows(result.impact).map((item)=>({case_id:caseId,impact_category:clean(item.category),statement:clean(item.statement),measurable_indicator:clean(item.indicator),proof_needed:clean(item.proofNeeded),risk_of_overclaiming:"Human verification required",recommended_wording:clean(item.safeWording),relevant_funding_type:clean(result.fundingType)}));
  if(impactRows.length){const i=await supabase.from("ac_capital_case_impact_sections").insert(impactRows);if(i.error)throw i.error;}
  const proofRows=rows(result.proofPack).map((item)=>({case_id:caseId,proof_type:clean(item.type),available:item.available===true,credibility_level:item.available===true?"Needs verification":"Missing",source:clean(item.source),required_for_case:item.required===true,owner:"Data Room Owner",attach_to_package:item.available===true}));
  if(proofRows.length){const i=await supabase.from("ac_capital_case_proof_packs").insert(proofRows);if(i.error)throw i.error;}
  const output=await persistAgentOutput(supabase,{agentKey:"funding-case-architect",capability:"case_drafting",workflowId:clean(input.workflow.id),eventId:clean(event.id),entityType:"case",entityId:caseId,providerRunId:capability.runId,doctrineCompilationId:clean(doctrine?.id),inputSnapshot:{dossier,opportunity},outputSnapshot:result,confidence:Number(result.confidence||0),actor:input.actor});
  const approvalReady = Number(caseRow.total_readiness_score || payload.total_readiness_score || 0) >= 70
    && Number(caseRow.document_readiness_score || payload.document_readiness_score || 0) >= 70
    && proofRows.filter((item) => item.required_for_case === true && item.available !== true).length === 0;
  const nextEvent=await emit(supabase,{eventType:approvalReady?"case.ready":"case.draft.completed",entityType:"case",entityId:caseId,workspace:"cases",payload:{qualificationId:dossierId,readiness:caseRow.total_readiness_score||payload.total_readiness_score,documentReadiness:caseRow.document_readiness_score||payload.document_readiness_score,approvalReady,version:caseRow.record_version||1},priority:approvalReady?"high":"normal"});
  return {case:caseRow,agentOutput:output,nextEvent,approvalReady};
}

async function executeProofIntelligence(input: AgentExecutionInput) {
  const supabase=await createServiceClient();const event=input.event;const documentId=clean(event.entity_id||object(event.payload).documentId);const document=documentId?await recordById(supabase,"ac_capital_data_room_documents",documentId):null;if(!document)throw new Error("AC_CAPITAL_DOCUMENT_REQUIRED");const doctrine=await latestDoctrine(supabase);
  const schema=baseSchema({classification:{type:"string"},credibilityScore:{type:"number"},readinessLevel:{type:"string"},approvedFacts:{type:"array",items:{type:"string"}},contradictions:{type:"array",items:{type:"string"}},missingDependencies:{type:"array",items:{type:"string"}},requirements:{type:"array",items:{type:"object",properties:{item:{type:"string"},priority:{type:"string"},reason:{type:"string"}},required:["item","priority","reason"],additionalProperties:false}},nextAction:{type:"string"},confidence:{type:"number"}},["classification","credibilityScore","readinessLevel","approvedFacts","contradictions","missingDependencies","requirements","nextAction","confidence"]);
  const sanitizedDocument = {
    id: document.id,
    title: document.title,
    category: document.category,
    documentType: document.document_type,
    readinessLevel: document.readiness_level,
    status: document.status,
    version: document.version,
    language: document.language,
    sourceWorkspace: document.source_workspace,
    relatedCaseId: document.related_case_id,
    relatedFunderId: document.related_funder_id,
    relatedOpportunityId: document.related_opportunity_id,
    approvalStatus: document.approval_status,
    founderApprovalRequired: document.founder_approval_required,
    signatureRequired: document.signature_required,
    stampRequired: document.stamp_required,
    expiryDate: document.expiry_date,
    lastUpdatedAt: document.last_updated_at,
    credibilityScore: document.credibility_score,
    reusable: document.reusable,
    sensitivityLevel: document.sensitivity_level,
    missingDependencies: document.missing_dependencies,
    nextAction: document.next_action,
  };
  const capability=await executeOpenRouterCapability({agentKey:"data-room-proof-agent",capability:"proof_intelligence",systemPrompt:"You are AngelCare's confidential proof intelligence officer. Analyze only the sanitized metadata supplied; never request or infer secrets.",prompt:"Assess document readiness, credibility, dependencies, contradictions and case requirements from sanitized metadata only.",schema,context:{document:sanitizedDocument,doctrine:doctrine?.effective_bundle||{}},actorId:clean(input.actor.id)||null,workflowId:clean(input.workflow.id),eventId:clean(event.id)});
  const result=capability.result;const update=await supabase.from("ac_capital_data_room_documents").update({document_type:clean(result.classification||document.document_type),credibility_score:Math.max(0,Math.min(100,Number(result.credibilityScore||0))),readiness_level:clean(result.readinessLevel),missing_dependencies:strings(result.missingDependencies).join(" | "),next_action:clean(result.nextAction),last_automation_agent:"data-room-proof-agent",last_automation_at:now(),notes:`Approved sanitized facts: ${strings(result.approvedFacts).join(" | ")}\nContradictions: ${strings(result.contradictions).join(" | ")}`,updated_at:now()}).eq("id",documentId).select("*").single();if(update.error)throw update.error;
  const requirements=rows(result.requirements).map((item)=>({item:clean(item.item),priority:clean(item.priority),related_case_id:document.related_case_id||null,related_funder_id:document.related_funder_id||null,owner:clean(document.owner||"Data Room Owner"),required_for_submission:true,action:clean(item.reason),status:"open"}));if(requirements.length){const i=await supabase.from("ac_capital_data_room_missing_evidence").insert(requirements);if(i.error)throw i.error;}
  const output=await persistAgentOutput(supabase,{agentKey:"data-room-proof-agent",capability:"proof_intelligence",workflowId:clean(input.workflow.id),eventId:clean(event.id),entityType:"document",entityId:documentId,providerRunId:capability.runId,doctrineCompilationId:clean(doctrine?.id),inputSnapshot:{document:sanitizedDocument},outputSnapshot:result,confidence:Number(result.confidence||0),actor:input.actor});
  if(requirements.length)await createNotification({notificationType:"document-proof-gap",severity:"warning",title:`${requirements.length} document requirement(s) detected`,message:clean(result.nextAction),entityType:"document",entityId:documentId,workspaceKey:"data-room",actionHref:"/ac-capital-os/data-room",deduplicationKey:`document-gaps:${documentId}:${update.data.record_version||1}`});
  return {document:update.data,requirements,agentOutput:output};
}

async function executePipelineIntelligence(input: AgentExecutionInput) {
  const supabase=await createServiceClient();const event=input.event;const pipelineId=clean(event.entity_id||object(event.payload).pipelineId);const pipeline=pipelineId?await recordById(supabase,"ac_capital_pipeline_records",pipelineId):null;if(!pipeline)throw new Error("AC_CAPITAL_PIPELINE_REQUIRED");const doctrine=await latestDoctrine(supabase);
  const schema=baseSchema({healthStatus:{type:"string"},probability:{type:"number"},riskLevel:{type:"string"},recommendedStage:{type:"string"},nextAction:{type:"string"},nextActionDueDate:{type:"string"},blockers:{type:"array",items:{type:"string"}},tasks:{type:"array",items:{type:"object",properties:{title:{type:"string"},priority:{type:"string"},owner:{type:"string"},objective:{type:"string"}},required:["title","priority","owner","objective"],additionalProperties:false}},confidence:{type:"number"}},["healthStatus","probability","riskLevel","recommendedStage","nextAction","nextActionDueDate","blockers","tasks","confidence"]);
  const capability=await executeOpenRouterCapability({agentKey:"pipeline-intelligence-agent",capability:"pipeline_intelligence",systemPrompt:"You are AngelCare's capital pipeline intelligence director.",prompt:"Detect stagnation, deadline risk and blockers. Recommend only internal next actions; do not claim external communication occurred.",schema,context:{pipeline,doctrine:doctrine?.effective_bundle||{}},actorId:clean(input.actor.id)||null,workflowId:clean(input.workflow.id),eventId:clean(event.id)});
  const result=capability.result;const update=await supabase.from("ac_capital_pipeline_records").update({probability_percent:Math.max(0,Math.min(100,Number(result.probability||pipeline.probability_percent||0))),weighted_value:Number(pipeline.estimated_amount_max||pipeline.estimated_amount_min||0)*Math.max(0,Math.min(100,Number(result.probability||0)))/100,next_action:clean(result.nextAction),next_action_due_date:/^\d{4}-\d{2}-\d{2}$/.test(clean(result.nextActionDueDate))?clean(result.nextActionDueDate):pipeline.next_action_due_date,risk_level:clean(result.riskLevel),health_status:clean(result.healthStatus||"healthy"),last_activity_at:now(),last_automation_agent:"pipeline-intelligence-agent",last_automation_at:now(),updated_at:now()}).eq("id",pipelineId).select("*").single();if(update.error)throw update.error;
  const taskRows=rows(result.tasks).map((item)=>({task_title:clean(item.title),type:"AI Recommended Internal Action",pipeline_record_id:pipelineId,case_id:clean(pipeline.case_id)||null,priority:clean(item.priority),owner:clean(item.owner),status:"Open",completion_note:clean(item.objective)}));if(taskRows.length){const i=await supabase.from("ac_capital_pipeline_tasks").insert(taskRows);if(i.error)throw i.error;}
  const output=await persistAgentOutput(supabase,{agentKey:"pipeline-intelligence-agent",capability:"pipeline_intelligence",workflowId:clean(input.workflow.id),eventId:clean(event.id),entityType:"pipeline",entityId:pipelineId,providerRunId:capability.runId,doctrineCompilationId:clean(doctrine?.id),inputSnapshot:{pipeline},outputSnapshot:result,confidence:Number(result.confidence||0),actor:input.actor});
  return {pipeline:update.data,tasks:taskRows,agentOutput:output,recommendedStage:result.recommendedStage,blockers:result.blockers};
}

async function executeCoordinatorPlanner(input: AgentExecutionInput) {
  const supabase=await createServiceClient();const event=input.event;const payload=object(event.payload);const approvalId=clean(event.entity_id||payload.approvalId);const approval=approvalId?await recordById(supabase,"ac_capital_universal_approvals",approvalId):null;if(!approval||clean(approval.status)!=="approved")throw new Error("AC_CAPITAL_VALID_APPROVAL_REQUIRED");const objectType=clean(approval.object_type);const objectId=clean(approval.object_id);const related=objectId?(objectType==="case"?await recordById(supabase,"ac_capital_cases",objectId):objectType==="pipeline"?await recordById(supabase,"ac_capital_pipeline_records",objectId):null):null;const doctrine=await latestDoctrine(supabase);
  const schema=baseSchema({missionTitle:{type:"string"},objective:{type:"string"},recipient:{type:"string"},approvedMessage:{type:"string"},callScript:{type:"array",items:{type:"string"}},attachments:{type:"array",items:{type:"string"}},doNotDisclose:{type:"array",items:{type:"string"}},checklist:{type:"array",items:{type:"string"}},expectedProof:{type:"string"},escalationCondition:{type:"string"},nextStep:{type:"string"},confidence:{type:"number"}},["missionTitle","objective","recipient","approvedMessage","callScript","attachments","doNotDisclose","checklist","expectedProof","escalationCondition","nextStep","confidence"]);
  const capability=await executeOpenRouterCapability({agentKey:"coordinator-mission-planner",capability:"mission_preparation",systemPrompt:"You are AngelCare's human-execution mission planner. Prepare exact internal instructions. Never send or submit anything.",prompt:"Prepare a controlled coordinator execution pack bound to the approved version. External execution remains manual.",schema,context:{approval,related,doctrine:doctrine?.effective_bundle||{}},actorId:clean(input.actor.id)||null,workflowId:clean(input.workflow.id),eventId:clean(event.id)});
  const result=capability.result;const task=await supabase.from("ac_capital_coordinator_tasks").insert({task_title:clean(result.missionTitle),task_type:"Approved External Execution Mission",related_case_id:objectType==="case"?objectId:null,related_pipeline_record_id:objectType==="pipeline"?objectId:null,priority:clean(approval.risk_level||"high"),status:"Ready — Human Execution",owner:"Capital Coordinator",ai_prepared:true,human_action_required:clean(result.objective),proof_required:true,founder_approval_required:false,risk_if_missed:clean(result.escalationCondition),next_step_after_completion:clean(result.nextStep),source_workspace:"orchestrator"}).select("*").single();if(task.error)throw task.error;
  const prepared=await supabase.from("ac_capital_coordinator_ai_prepared_tasks").insert({prepared_by:"Coordinator Mission Planner",linked_case_id:objectType==="case"?objectId:null,linked_pipeline_record_id:objectType==="pipeline"?objectId:null,ai_confidence:Number(result.confidence||0),doctrine_used:[clean(doctrine?.compilation_key)].filter(Boolean),script_or_document_prepared:JSON.stringify({approvedMessage:result.approvedMessage,callScript:result.callScript,attachments:result.attachments,doNotDisclose:result.doNotDisclose,checklist:result.checklist,expectedProof:result.expectedProof}),approval_required:false,human_safety_check:"Execute manually. Verify recipient, attachments and approved version before sending.",recommended_action:clean(result.objective),status:"Ready for Human Execution"}).select("*").single();if(prepared.error)throw prepared.error;
  const output=await persistAgentOutput(supabase,{agentKey:"coordinator-mission-planner",capability:"mission_preparation",workflowId:clean(input.workflow.id),eventId:clean(event.id),entityType:"approval",entityId:approvalId,providerRunId:capability.runId,doctrineCompilationId:clean(doctrine?.id),inputSnapshot:{approval,related},outputSnapshot:result,confidence:Number(result.confidence||0),actor:input.actor});
  await createNotification({notificationType:"coordinator-mission-ready",severity:"high",title:clean(result.missionTitle),message:clean(result.objective),entityType:"coordinator-task",entityId:clean(task.data.id),workspaceKey:"coordinator",actionHref:"/ac-capital-os/coordinator",recipientRole:"Capital Coordinator",deduplicationKey:`mission-ready:${task.data.id}`});
  return {task:task.data,prepared:prepared.data,agentOutput:output};
}

async function executeReporting(input: AgentExecutionInput) {
  const supabase = await createServiceClient();
  const event = input.event;
  const payload = object(event.payload);
  const artifactType = clean(payload.artifactType || "founder-capital-brief");
  const title = clean(payload.title || "AC Capital Executive Department Brief");
  const context = await buildArtifactContext({ artifactType, entityType: clean(payload.entityType) || undefined, entityId: clean(payload.entityId) || undefined, reportId: clean(payload.reportId) || undefined });
  const deterministic = deterministicArtifactContent({ artifactType, title, context });
  const sectionTitles = rows(deterministic.sections).map((section) => clean(section.title)).filter(Boolean).slice(0, 12);
  const report = await executeOpenRouterReport({
    reportType: artifactType,
    audience: clean(payload.audience || "Founder / Management"),
    purpose: clean(payload.purpose || "Produce an evidence-bound capital executive brief."),
    sections: sectionTitles.length ? sectionTitles : ["Executive Summary", "Readiness", "Risks", "Next Actions"],
    sourceWorkspaces: ["orchestrator", clean(payload.entityType || "capital-department")],
    context,
    actorId: clean(input.actor.id) || null,
  });
  const content = {
    ...deterministic,
    executiveSummary: report.executiveSummary,
    sections: report.sections,
    metadata: { missingData: report.missingData, riskFlags: report.riskFlags, nextActions: report.nextActions, confidence: report.confidence, providerRunId: report.freeProviderRunId },
  };
  const strategyReport = await supabase.from("ac_capital_strategy_reports").insert({
    report_type: artifactType,
    purpose: clean(payload.purpose || "Evidence-bound capital executive brief"),
    audience: clean(payload.audience || "Founder / Management"),
    source_workspaces: ["orchestrator", clean(payload.entityType || "capital-department")],
    readiness: "AI Draft — Human Review",
    missing_data: report.missingData,
    risk_flags: report.riskFlags,
    approval_requirement: "Founder / Human review",
    export_placeholder: false,
    status: "AI Draft — Human Review",
  }).select("*").single();
  if (strategyReport.error) throw strategyReport.error;
  const artifact = await createCapitalArtifact({
    artifactType,
    title,
    entityType: clean(payload.entityType) || undefined,
    entityId: clean(payload.entityId) || undefined,
    workflowId: clean(input.workflow.id) || undefined,
    reportId: clean(strategyReport.data.id),
    formats: ["pdf", "docx", "xlsx", "zip"],
    content: content as JsonRecord,
    sourceSnapshot: context,
    evidenceReferences: [{ providerResponseId: report.providerResponseId, providerModelVersion: report.providerModelVersion, providerRunId: report.freeProviderRunId }],
    confidentiality: "Confidential",
    actor: input.actor,
  });
  const output = await persistAgentOutput(supabase, { agentKey: "executive-report-agent", capability: "executive_reporting", workflowId: clean(input.workflow.id), eventId: clean(event.id), entityType: "artifact", entityId: clean(artifact.id), providerRunId: clean(report.freeProviderRunId), doctrineCompilationId: "", inputSnapshot: context, outputSnapshot: content as JsonRecord, confidence: report.confidence, actor: input.actor });
  return { report: strategyReport.data, artifact, agentOutput: output };
}

async function executeLearning(input: AgentExecutionInput) {
  const supabase=await createServiceClient();const event=input.event;const learningId=clean(event.entity_id||object(event.payload).learningId);let learning=learningId?await recordById(supabase,"ac_capital_outcome_learning",learningId):null;if(!learning){const payload=object(event.payload);const inserted=await supabase.from("ac_capital_outcome_learning").insert({opportunity_id:clean(payload.opportunityId)||null,case_id:clean(payload.caseId)||null,pipeline_record_id:clean(payload.pipelineRecordId)||null,outcome:clean(payload.outcome||"recorded"),outcome_reason:clean(payload.reason)||null,created_by:actorName(input.actor)}).select("*").single();if(inserted.error)throw inserted.error;learning=inserted.data as JsonRecord;}
  const doctrine=await latestDoctrine(supabase);const schema=baseSchema({outcomeAnalysis:{type:"string"},successfulPatterns:{type:"array",items:{type:"string"}},failedPatterns:{type:"array",items:{type:"string"}},objections:{type:"array",items:{type:"string"}},proofFriction:{type:"array",items:{type:"string"}},doctrineProposals:{type:"array",items:{type:"string"}},scoringProposals:{type:"array",items:{type:"string"}},nextAction:{type:"string"},confidence:{type:"number"}},["outcomeAnalysis","successfulPatterns","failedPatterns","objections","proofFriction","doctrineProposals","scoringProposals","nextAction","confidence"]);
  const capability=await executeOpenRouterCapability({agentKey:"capital-learning-agent",capability:"learning_analysis",systemPrompt:"You are AngelCare's institutional capital learning director.",prompt:"Analyze the recorded outcome and create controlled improvement proposals. Do not change doctrine automatically.",schema,context:{learning,doctrine:doctrine?.effective_bundle||{}},actorId:clean(input.actor.id)||null,workflowId:clean(input.workflow.id),eventId:clean(event.id)});
  const result=capability.result;const update=await supabase.from("ac_capital_outcome_learning").update({outcome_reason:clean(result.outcomeAnalysis),objections:result.objections||[],proof_friction:result.proofFriction||[],successful_patterns:result.successfulPatterns||[],failed_patterns:result.failedPatterns||[],doctrine_proposals:result.doctrineProposals||[],scoring_proposals:result.scoringProposals||[],status:"AI Learning Draft — Approval Required",updated_at:now()}).eq("id",learning.id).select("*").single();if(update.error)throw update.error;
  const output=await persistAgentOutput(supabase,{agentKey:"capital-learning-agent",capability:"learning_analysis",workflowId:clean(input.workflow.id),eventId:clean(event.id),entityType:"learning",entityId:clean(learning.id),providerRunId:capability.runId,doctrineCompilationId:clean(doctrine?.id),inputSnapshot:{learning},outputSnapshot:result,confidence:Number(result.confidence||0),actor:input.actor});return {learning:update.data,agentOutput:output};
}

export async function executeCapitalAgentForEvent(input: AgentExecutionInput) {
  const type=clean(input.event.event_type);
  if(["funder.created","funder.updated","funder.refresh.requested"].includes(type))return executeFunderIntelligence(input);
  if(["opportunity.created","opportunity.updated","opportunity.qualify.requested"].includes(type))return executeQualification(input);
  if(["qualification.approved","qualification.pursue","case.regenerate.requested"].includes(type))return executeCaseArchitecture(input);
  if(["document.created","document.updated","proof.updated"].includes(type))return executeProofIntelligence(input);
  if(["pipeline.created","pipeline.updated","deadline.approaching","funder.response"].includes(type))return executePipelineIntelligence(input);
  if(type==="approval.granted")return executeCoordinatorPlanner(input);
  if(["report.requested","daily.close","weekly.close"].includes(type))return executeReporting(input);
  if(["outcome.recorded","case.closed","submission.failed"].includes(type))return executeLearning(input);
  return null;
}

function institutionalNextRun(scheduleRow: JsonRecord) {
  const frequency = clean(scheduleRow.frequency_key || "daily");
  const schedule = object(scheduleRow.schedule);
  const next = new Date();
  next.setSeconds(0, 0);
  if (frequency === "hourly") {
    next.setTime(Date.now() + Math.max(1, Number(schedule.intervalHours || 1)) * 60 * 60 * 1000);
  } else if (frequency === "weekly") {
    const allowed = strings(schedule.days).map(Number).filter((day) => day >= 1 && day <= 7);
    const days = allowed.length ? allowed : [1];
    next.setHours(Math.max(0, Math.min(23, Number(schedule.hour ?? 8))), Math.max(0, Math.min(59, Number(schedule.minute ?? 0))), 0, 0);
    for (let offset = 0; offset <= 8; offset += 1) {
      const candidate = new Date(next);
      candidate.setDate(candidate.getDate() + offset);
      const isoDay = candidate.getDay() === 0 ? 7 : candidate.getDay();
      if (days.includes(isoDay) && candidate.getTime() > Date.now()) return candidate.toISOString();
    }
    next.setDate(next.getDate() + 7);
  } else if (frequency === "monthly") {
    next.setDate(Math.max(1, Math.min(28, Number(schedule.dayOfMonth || 1))));
    next.setHours(Math.max(0, Math.min(23, Number(schedule.hour ?? 8))), Math.max(0, Math.min(59, Number(schedule.minute ?? 0))), 0, 0);
    if (next.getTime() <= Date.now()) next.setMonth(next.getMonth() + 1);
  } else if (frequency === "custom") {
    next.setTime(Date.now() + Math.max(15, Number(schedule.intervalMinutes || 1440)) * 60 * 1000);
  } else {
    next.setHours(Math.max(0, Math.min(23, Number(schedule.hour ?? 8))), Math.max(0, Math.min(59, Number(schedule.minute ?? 0))), 0, 0);
    if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  }
  return next.toISOString();
}

async function queueScheduledEntities(supabase: SupabaseAny, agentKey: string) {
  const queued: JsonRecord[] = [];
  const queueRows = async (eventType: string, entityType: string, workspace: string, records: JsonRecord[]) => {
    for (const row of records) {
      const event = await emit(supabase, {
        eventType,
        entityType,
        entityId: clean(row.id),
        workspace,
        payload: { scheduled: true, updatedAt: clean(row.updated_at || row.created_at), version: row.record_version || 1 },
      });
      if (event) queued.push(event);
    }
  };

  if (agentKey === "funder-intelligence-agent") {
    const result = await supabase.from("ac_capital_funders").select("*").order("updated_at", { ascending: true }).limit(3);
    if (result.error) throw result.error;
    await queueRows("funder.refresh.requested", "funder", "funders", (result.data || []) as JsonRecord[]);
  } else if (agentKey === "qualification-underwriter") {
    const result = await supabase.from("ac_capital_radar_opportunities").select("*").in("status", ["detected", "watchlist", "source-review", "ready-for-qualification"]).order("updated_at", { ascending: true }).limit(5);
    if (result.error) throw result.error;
    await queueRows("opportunity.qualify.requested", "opportunity", "radar", (result.data || []) as JsonRecord[]);
  } else if (agentKey === "funding-case-architect") {
    const result = await supabase.from("ac_capital_qualification_dossiers").select("*").ilike("decision_label", "%pursue%").order("updated_at", { ascending: true }).limit(3);
    if (result.error) throw result.error;
    await queueRows("qualification.approved", "qualification", "qualification", (result.data || []) as JsonRecord[]);
  } else if (agentKey === "data-room-proof-agent") {
    const result = await supabase.from("ac_capital_data_room_documents").select("*").order("updated_at", { ascending: true }).limit(5);
    if (result.error) throw result.error;
    await queueRows("document.updated", "document", "data-room", (result.data || []) as JsonRecord[]);
  } else if (agentKey === "pipeline-intelligence-agent") {
    const result = await supabase.from("ac_capital_pipeline_records").select("*").eq("status", "Active").order("last_activity_at", { ascending: true, nullsFirst: true }).limit(5);
    if (result.error) throw result.error;
    await queueRows("pipeline.updated", "pipeline", "pipeline", (result.data || []) as JsonRecord[]);
  } else if (agentKey === "coordinator-mission-planner") {
    const result = await supabase.from("ac_capital_universal_approvals").select("*").eq("status", "approved").order("decided_at", { ascending: false }).limit(3);
    if (result.error) throw result.error;
    await queueRows("approval.granted", "approval", "approvals", (result.data || []) as JsonRecord[]);
  } else if (agentKey === "executive-report-agent") {
    const event = await emit(supabase, { eventType: "weekly.close", entityType: "capital-department", workspace: "reports", payload: { artifactType: "weekly-capital-report", scheduled: true, version: new Date().toISOString().slice(0, 10) } });
    if (event) queued.push(event);
  } else if (agentKey === "capital-learning-agent") {
    const result = await supabase.from("ac_capital_outcome_learning").select("*").eq("status", "draft-learning").order("updated_at", { ascending: true }).limit(5);
    if (result.error) throw result.error;
    await queueRows("outcome.recorded", "learning", "learning", (result.data || []) as JsonRecord[]);
  }
  return queued;
}

export async function enqueueDueInstitutionalAgentWork(actor: InstitutionalActor) {
  const supabase = await createServiceClient();
  const stateResult = await supabase.from("ac_capital_ai_runtime_state").select("*").eq("state_key", "primary").maybeSingle();
  if (stateResult.error) throw stateResult.error;
  const state = object(stateResult.data);
  if (state.scheduler_enabled !== true || state.global_pause === true || state.internal_automation_enabled === false) {
    return { executed: [], skipped: "scheduler-disabled-or-paused" };
  }
  const schedulesResult = await supabase.from("ac_capital_agent_schedules").select("*").eq("enabled", true).order("next_run_at", { ascending: true, nullsFirst: true }).limit(25);
  if (schedulesResult.error) throw schedulesResult.error;
  const due = ((schedulesResult.data || []) as JsonRecord[]).filter((row) => !row.next_run_at || new Date(clean(row.next_run_at)).getTime() <= Date.now());
  const executed: JsonRecord[] = [];
  for (const schedule of due) {
    const agentKey = clean(schedule.agent_key);
    if (agentKey === "capital-executive-orchestrator") {
      await supabase.from("ac_capital_agent_schedules").update({ last_run_at: now(), last_status: "queue-worker-active", next_run_at: institutionalNextRun(schedule), consecutive_failures: 0, updated_at: now() }).eq("id", schedule.id);
      executed.push({ agentKey, status: "queue-worker-active", queued: 0 });
      continue;
    }
    try {
      const events = await queueScheduledEntities(supabase, agentKey);
      await supabase.from("ac_capital_agent_schedules").update({ last_run_at: now(), last_status: "queued", next_run_at: institutionalNextRun(schedule), consecutive_failures: 0, updated_at: now() }).eq("id", schedule.id);
      executed.push({ agentKey, status: "queued", queued: events.length, eventIds: events.map((event) => event.id) });
    } catch (error) {
      const failures = Number(schedule.consecutive_failures || 0) + 1;
      await supabase.from("ac_capital_agent_schedules").update({ last_run_at: now(), last_status: "failed", next_run_at: institutionalNextRun(schedule), consecutive_failures: failures, enabled: failures < Number(schedule.maximum_consecutive_failures || 4), updated_at: now() }).eq("id", schedule.id);
      executed.push({ agentKey, status: "failed", error: error instanceof Error ? error.message : String(error), consecutiveFailures: failures });
    }
  }
  return { actor: actorName(actor), executed };
}
