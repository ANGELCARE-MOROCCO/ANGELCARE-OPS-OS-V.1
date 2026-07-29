import { apiError, envelope, insertAudit, insertRow, isFounder, isWriter, readTable, requiredString, requireCapitalApiActor, success, updateRow } from "@/lib/ac-capital-os/server/mz15-api";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(){try{await requireCapitalApiActor();const [cases,stages,documents,narratives,positioningBlocks,financialSections,riskPlans,impactSections,outreachScripts,proofPacks,founderApprovals,coordinatorHandovers,auditEvents]=await Promise.all([readTable("ac_capital_cases",200),readTable("ac_capital_case_stages",400),readTable("ac_capital_case_documents",400),readTable("ac_capital_case_narratives",300),readTable("ac_capital_case_positioning_blocks",300),readTable("ac_capital_case_financial_sections",200),readTable("ac_capital_case_risk_plans",300),readTable("ac_capital_case_impact_sections",300),readTable("ac_capital_case_outreach_scripts",300),readTable("ac_capital_case_proof_packs",300),readTable("ac_capital_case_founder_approvals",200),readTable("ac_capital_case_coordinator_handovers",300),readTable("ac_capital_case_audit_events",400)]);return Response.json(envelope({cases,stages,documents,narratives,positioningBlocks,financialSections,riskPlans,impactSections,outreachScripts,proofPacks,founderApprovals,coordinatorHandovers,auditEvents}));}catch(reason){return apiError(reason)}}
export async function POST(request:Request){try{const actor=await requireCapitalApiActor();if(!isWriter(actor))throw Object.assign(new Error("WRITE_PERMISSION_REQUIRED"),{status:403});const body=await request.json() as Record<string,unknown>;const action=String(body.action||"create-case");
if(action==="create-case"){const record=await insertRow("ac_capital_cases",{qualification_dossier_id:body.qualificationDossierId||null,funder_id:body.funderId||null,opportunity_id:body.opportunityId||null,case_title:requiredString(body.caseTitle,"Case title"),package_type:requiredString(body.packageType,"Package type"),funding_type:body.fundingType||null,requested_amount:body.requestedAmount||null,currency_label:body.currencyLabel||"Dh",deadline:body.deadline||null,status:"new_from_qualification",priority:body.priority||"medium",owner:actor.name,next_action:"Build case sections"});for(const stage of ["Mandate","Narrative","Market","Financials","Impact","Risk","Proof","Approval","Handover","Submission Pack"]){await insertRow("ac_capital_case_stages",{case_id:record.id,stage_label:stage,status:stage==="Mandate"?"in_progress":"not_started",readiness:stage==="Mandate"?10:0,owner:actor.name,founder_approval_required:["Approval","Submission Pack"].includes(stage),action:`Complete ${stage}`})}await insertAudit({actor:actor.email||actor.name,action,objectType:"capital_case",objectId:String(record.id),after:record});return Response.json(success({record}));}
const caseId=requiredString(body.caseId,"Case id");
if(action==="add-section"){const type=String(body.sectionType||"narrative");let record;if(type==="financial")record=await insertRow("ac_capital_case_financial_sections",{case_id:caseId,requested_amount:body.requestedAmount||null,currency_label:body.currencyLabel||"Dh",funding_instrument_type:body.instrumentType||null,use_of_funds:Array.isArray(body.useOfFunds)?body.useOfFunds:[],revenue_stream_mapping:Array.isArray(body.revenueStreams)?body.revenueStreams:[],conservative_scenario:body.conservativeScenario||null,base_scenario:body.baseScenario||null,upside_scenario:body.upsideScenario||null,bank_repayment_safe_explanation:body.repaymentExplanation||null,dilution_control_note:body.dilutionControlNote||null,status:"draft",owner:actor.name});else if(type==="impact")record=await insertRow("ac_capital_case_impact_sections",{case_id:caseId,impact_category:requiredString(body.impactCategory,"Impact category"),statement:body.statement||null,measurable_indicator:body.measurableIndicator||null,proof_needed:body.proofNeeded||null,risk_of_overclaiming:body.riskOfOverclaiming||null,recommended_wording:body.recommendedWording||null,relevant_funding_type:body.relevantFundingType||null});else if(type==="risk")record=await insertRow("ac_capital_case_risk_plans",{case_id:caseId,risk_type:requiredString(body.riskType,"Risk type"),severity:body.severity||"Medium",likelihood:body.likelihood||null,description:body.description||null,mitigation:body.mitigation||null,plan_b:body.planB||null,plan_c:body.planC||null,plan_d:body.planD||null,owner:actor.name,founder_review_required:Boolean(body.founderReviewRequired),related_proof:body.relatedProof||null,status:"draft"});else record=await insertRow("ac_capital_case_narratives",{case_id:caseId,narrative_type:body.narrativeType||"executive",headline:body.headline||null,opening_message:body.openingMessage||null,proof_to_emphasize:body.proofToEmphasize||null,language_to_avoid:body.languageToAvoid||null,required_annexes:body.requiredAnnexes||null,tone:body.tone||"Corporate",founder_review_required:Boolean(body.founderReviewRequired),status:"draft"});return Response.json(success({record}));}
if(action==="request-proof"){const record=await insertRow("ac_capital_case_documents",{case_id:caseId,document_name:requiredString(body.documentName,"Document name"),category:body.category||null,required_for_submission:body.requiredForSubmission!==false,status:"missing",priority:body.priority||"medium",owner:body.owner||actor.name,source_workspace:"data-room",deadline:body.deadline||null,notes:body.notes||null});return Response.json(success({record}));}
if(action==="request-approval"){
  const approvalItem=requiredString(body.approvalItem,"Approval item");
  const supabase=await createServiceClient();
  const result=await supabase.rpc("ac_capital_ic10_request_case_approval",{
    p_case_id:caseId,
    p_approval_item:approvalItem,
    p_reason:String(body.reason||"")||null,
    p_comments:String(body.comments||"")||null,
    p_risk_level:String(body.riskLevel||"high"),
    p_requested_by:actor.email||actor.name,
    p_approver:String(body.approver||"Founder / Managing Director"),
    p_due_date:body.dueDate||null,
  });
  if(result.error)throw result.error;
  const governed=result.data as Record<string,unknown>;
  await insertAudit({actor:actor.email||actor.name,action:"request_exact_version_approval",objectType:"capital_case",objectId:caseId,after:governed,reason:String(body.reason||approvalItem),approval:"Founder exact-version approval"});
  return Response.json(success({record:governed.legacyApproval||null,universalApproval:governed.approval||null,event:governed.event||null,case:governed.case||null,snapshotHash:governed.snapshotHash,objectVersion:governed.objectVersion}));
}
if(action==="handover"){const record=await insertRow("ac_capital_case_coordinator_handovers",{case_id:caseId,block:requiredString(body.block,"Handover block"),instruction:body.instruction||null,owner:body.owner||"Capital Coordinator",deadline:body.deadline||null,proof_after_action:body.proofAfterAction||null,escalation_condition:body.escalationCondition||null,status:"ready"});await updateRow("ac_capital_cases",caseId,{coordinator_handover_status:"ready"});return Response.json(success({record}));}
if(action==="lock-version"){
  if(!isFounder(actor))throw Object.assign(new Error("FOUNDER_APPROVAL_REQUIRED"),{status:403});
  const supabase=await createServiceClient();
  const caseResult=await supabase.from("ac_capital_cases").select("*").eq("id",caseId).maybeSingle();
  if(caseResult.error)throw caseResult.error;
  if(!caseResult.data)throw Object.assign(new Error("AC_CAPITAL_CASE_NOT_FOUND"),{status:404});
  const version=String(caseResult.data.record_version||1);
  const approval=await supabase.from("ac_capital_universal_approvals").select("*").eq("object_type","case").eq("object_id",caseId).eq("object_version",version).eq("status","approved").order("decided_at",{ascending:false}).limit(1);
  if(approval.error)throw approval.error;
  if(!approval.data?.length)throw Object.assign(new Error(`AC_CAPITAL_CURRENT_CASE_VERSION_NOT_APPROVED:${version}`),{status:409});
  const record=caseResult.data as Record<string,unknown>;
  await insertAudit({actor:actor.email||actor.name,action:"verify_approved_case_version_lock",objectType:"capital_case",objectId:caseId,before:caseResult.data,after:record,reason:String(body.reason||"Approved version lock verified"),approval:`Universal approval ${approval.data[0].id}`});
  return Response.json(success({record,approval:approval.data[0],lockedVersion:version,immutableAuthority:true}));
}
throw Object.assign(new Error("UNSUPPORTED_CASE_ACTION"),{status:400});}catch(reason){return apiError(reason)}}
