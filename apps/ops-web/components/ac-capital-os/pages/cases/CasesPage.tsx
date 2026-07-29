"use client";

import { Archive, BadgeCheck, Boxes, BriefcaseBusiness, CircleDollarSign, FileHeart, FileText, Handshake, Layers3, LockKeyhole, PackageCheck, ShieldAlert, Sparkles, Workflow } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { EmptyState, ErrorState, LoadingState } from "../../core/AsyncState";
import { ActionFeedback, Field } from "../../core/FormParts";
import { MetricTile } from "../../core/MetricTile";
import { Dialog, Drawer } from "../../core/Overlay";
import { StatusBadge } from "../../core/StatusBadge";
import { AuditTimeline, FactGrid, PrimaryButton, SecondaryButton, SectionHeading, TruthChip } from "../../core/WorkspaceParts";
import { postEnvelope } from "../../core/api";
import { formatDh, number, rowsFrom, shortDate, text } from "../../core/data";
import type { CapitalActor, Row } from "../../core/types";
import { canApprove } from "../../core/role";
import { useAction } from "../../core/useAction";
import { useActionQuery } from "../../core/useActionQuery";
import { useWorkspace } from "../../core/useWorkspace";
import styles from "./cases.module.css";

type Modal = "create" | "section" | "proof" | "approval" | "handover" | "lock" | null;
const stageOrder = ["Mandate","Narrative","Market","Financials","Impact","Risk","Proof","Approval","Handover","Submission Pack"];

export function CasesPage({ actor }: { actor: CapitalActor }) {
  const workspace = useWorkspace("/api/ac-capital-os/case-builder");
  const action = useAction();
  const [selected, setSelected] = useState<Row | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [create, setCreate] = useState({ caseTitle:"", packageType:"Bank financing case", fundingType:"Bank", requestedAmount:"", deadline:"", priority:"high", qualificationDossierId:"", funderId:"", opportunityId:"" });
  const [sectionType, setSectionType] = useState("narrative");
  const [section, setSection] = useState({ headline:"", openingMessage:"", proofToEmphasize:"", languageToAvoid:"", requestedAmount:"", instrumentType:"", repaymentExplanation:"", impactCategory:"", statement:"", measurableIndicator:"", proofNeeded:"", riskType:"", severity:"High", description:"", mitigation:"", planB:"", planC:"", planD:"", founderReviewRequired:false });
  const [proof, setProof] = useState({ documentName:"", category:"Evidence", requiredForSubmission:true, priority:"high", owner:actor.name, deadline:"", notes:"" });
  const [approval, setApproval] = useState({ approvalItem:"Final case package release", reason:"", approver:"Founder / Managing Director", dueDate:"", comments:"" });
  const [handover, setHandover] = useState({ block:"Final case execution", instruction:"", owner:"Capital Coordinator", deadline:"", proofAfterAction:"", escalationCondition:"" });
  const [lockReason, setLockReason] = useState("");
  const openAction = useCallback((next: Modal)=>setModal(next),[]);
  useActionQuery({ create:"create", section:"section", approval:"approval" },openAction);

  const cases = rowsFrom(workspace.envelope,"cases");
  const stages = rowsFrom(workspace.envelope,"stages");
  const documents = rowsFrom(workspace.envelope,"documents");
  const narratives = rowsFrom(workspace.envelope,"narratives");
  const financials = rowsFrom(workspace.envelope,"financialSections");
  const impacts = rowsFrom(workspace.envelope,"impactSections");
  const risks = rowsFrom(workspace.envelope,"riskPlans");
  const proofPacks = rowsFrom(workspace.envelope,"proofPacks");
  const approvals = rowsFrom(workspace.envelope,"founderApprovals");
  const handovers = rowsFrom(workspace.envelope,"coordinatorHandovers");
  const audit = rowsFrom(workspace.envelope,"auditEvents");
  const selectedId = selected ? String(selected.id) : "";
  const related = useMemo(()=>({
    stages:stages.filter(row=>String(row.case_id)===selectedId),
    documents:documents.filter(row=>String(row.case_id)===selectedId),
    narratives:narratives.filter(row=>String(row.case_id)===selectedId),
    financials:financials.filter(row=>String(row.case_id)===selectedId),
    impacts:impacts.filter(row=>String(row.case_id)===selectedId),
    risks:risks.filter(row=>String(row.case_id)===selectedId),
    proofPacks:proofPacks.filter(row=>String(row.case_id)===selectedId),
    approvals:approvals.filter(row=>String(row.case_id)===selectedId),
    handovers:handovers.filter(row=>String(row.case_id)===selectedId),
    audit:audit.filter(row=>String(row.case_id)===selectedId),
  }),[stages,documents,narratives,financials,impacts,risks,proofPacks,approvals,handovers,audit,selectedId]);

  const average = cases.length?Math.round(cases.reduce((sum,row)=>sum+number(row,["readiness_score","readiness"],0),0)/cases.length):0;
  const approvalCount = approvals.filter(row=>!/approved/i.test(text(row,["status","decision"],""))).length;
  const blocked = cases.filter(row=>/blocked|needs proof/i.test(text(row,["status"],""))).length;

  async function createCase() {
    if(!create.caseTitle.trim()) return action.validate("Case title is required.");
    await action.execute(()=>postEnvelope("/api/ac-capital-os/case-builder",{action:"create-case",...create,requestedAmount:create.requestedAmount||null}),"Case and assembly stages created.");
    await workspace.refresh();
  }
  async function addSection() {
    if(!selected) return action.validate("Select a case first.");
    const payload:Record<string,unknown>={action:"add-section",caseId:selected.id,sectionType,founderReviewRequired:section.founderReviewRequired};
    if(sectionType==="financial") Object.assign(payload,{requestedAmount:section.requestedAmount||null,instrumentType:section.instrumentType,repaymentExplanation:section.repaymentExplanation});
    else if(sectionType==="impact") Object.assign(payload,{impactCategory:section.impactCategory,statement:section.statement,measurableIndicator:section.measurableIndicator,proofNeeded:section.proofNeeded});
    else if(sectionType==="risk") Object.assign(payload,{riskType:section.riskType,severity:section.severity,description:section.description,mitigation:section.mitigation,planB:section.planB,planC:section.planC,planD:section.planD});
    else Object.assign(payload,{headline:section.headline,openingMessage:section.openingMessage,proofToEmphasize:section.proofToEmphasize,languageToAvoid:section.languageToAvoid});
    await action.execute(()=>postEnvelope("/api/ac-capital-os/case-builder",payload),"Case section saved.");
    await workspace.refresh();
  }
  async function submit(kind:"request-proof"|"request-approval"|"handover"|"lock-version", payload:Record<string,unknown>, success:string) {
    if(!selected) return action.validate("Select a case.");
    if(kind==="lock-version"&&!canApprove(actor)) return action.disabled("Founder or authorized strategy admin approval is required to lock an external release version.");
    await action.execute(()=>postEnvelope("/api/ac-capital-os/case-builder",{action:kind,caseId:selected.id,...payload}),success);
    await workspace.refresh();
  }

  const insights=[{label:"Assembly truth",value:`${cases.length} cases returned by API`},{label:"Approval gate",value:`${approvalCount} approvals still open`},{label:"Evidence pressure",value:`${blocked} cases explicitly blocked`},{label:"Final release",value:"No submission pack can be treated as final without approval and proof"}];

  return <AcCapitalShell actor={actor} workspaceKey="case-factory" title="Fundraising Case Factory" subtitle="An investment-bank style assembly line for bank, grant, VC, partner, SaaS and impact packages — from mandate to approved submission pack." envelope={workspace.envelope} insights={insights} primaryAction="Create Case" onPrimaryAction={()=>setModal("create")}>
    {workspace.loading?<LoadingState label="Loading case portfolio and assembly stages…"/>:workspace.error?<ErrorState message={workspace.error} onRetry={()=>void workspace.refresh()}/>:<>
      <section className={styles.factoryHero}><div><span><Boxes size={15}/> Capital Package Manufacturing</span><h2>Build every funding case as a controlled assembly — not a loose document folder.</h2><p>Mandate, narrative, market, financials, impact, risk, evidence, approval, handover and submission package are visible as separate production gates.</p><div><PrimaryButton onClick={()=>setModal("create")}>Create capital case</PrimaryButton><SecondaryButton onClick={()=>selected?setModal("section"):action.validate("Select a case first.")}>Open section studio</SecondaryButton></div></div><div className={styles.factoryMark}><Workflow/><strong>{average || "—"}%</strong><span>Portfolio readiness</span><TruthChip kind="approval">Final release locked</TruthChip></div></section>

      <section className={styles.metrics}><MetricTile label="Capital cases" value={String(cases.length)} detail="Live/fallback case portfolio." tone="blue"/><MetricTile label="Average readiness" value={cases.length?`${average}%`:"No case data"} detail="Calculated only from stored readiness fields." tone={average>=75?"green":"amber"}/><MetricTile label="Open approvals" value={String(approvalCount)} detail="Founder or authorized review required." tone={approvalCount?"red":"green"}/><MetricTile label="Blocked cases" value={String(blocked)} detail="Explicit blocked/needs-proof status." tone={blocked?"red":"green"}/></section>

      <section className={styles.casePortfolio}><SectionHeading eyebrow="Case Portfolio" title="Capital cases and package readiness" copy="Choose a case to expose its assembly line, sections, proof, approvals and coordinator handover."/>
        {cases.length?<div className={styles.caseGrid}>{cases.map(row=><button key={String(row.id)} className={`${styles.caseCard} ${selected?.id===row.id?styles.selected:""}`} onClick={()=>setSelected(row)}><div><StatusBadge value={text(row,["status"],"Draft")}/><span>{number(row,["readiness_score","readiness"],0)}%</span></div><BriefcaseBusiness/><strong>{text(row,["case_title"],"Capital case")}</strong><p>{text(row,["next_action"],"Build case sections")}</p><footer><span>{text(row,["package_type"],"Package")}</span><span>{formatDh(row.requested_amount)}</span><span>{shortDate(row.deadline)}</span></footer></button>)}</div>:<EmptyState title="No capital cases yet" copy="Create a real case from a qualified opportunity. No readiness percentage is fabricated for an empty case factory." action="Create case" onAction={()=>setModal("create")}/>}
      </section>

      {selected?<section className={styles.assembly}><SectionHeading eyebrow="Case Assembly Line" title={text(selected,["case_title"],"Selected case")} copy="Each gate reflects stored stage records. Actions add real section, proof, approval or handover records."/><div className={styles.stageLine}>{stageOrder.map((name,index)=>{const stage=related.stages.find(row=>text(row,["stage_label"],"")===name);const readiness=stage?number(stage,["readiness"],0):0;return <button key={name} onClick={()=>["Narrative","Financials","Impact","Risk"].includes(name)?setModal("section"):name==="Proof"?setModal("proof"):name==="Approval"?setModal("approval"):name==="Handover"?setModal("handover"):name==="Submission Pack"?setModal("lock"):setSelected(selected)} className={readiness>=100?styles.stageDone:readiness>0?styles.stageActive:""}><em>{index+1}</em><strong>{name}</strong><span>{stage?text(stage,["status"],"not_started"):"No stage row"}</span><i><b style={{width:`${Math.min(100,readiness)}%`}}/></i></button>})}</div><div className={styles.caseCommand}><article><FileText/><strong>{related.narratives.length}</strong><span>Narrative sections</span></article><article><CircleDollarSign/><strong>{related.financials.length}</strong><span>Financial sections</span></article><article><FileHeart/><strong>{related.impacts.length}</strong><span>Impact sections</span></article><article><ShieldAlert/><strong>{related.risks.length}</strong><span>Risk plans</span></article><article><PackageCheck/><strong>{related.documents.length+related.proofPacks.length}</strong><span>Evidence objects</span></article><article><Handshake/><strong>{related.handovers.length}</strong><span>Coordinator handovers</span></article></div></section>:null}
    </>}

    <Drawer open={Boolean(selected)} title={selected?text(selected,["case_title"],"Case"):"Case"} eyebrow="Case Command Drawer" onClose={()=>setSelected(null)} footer={<><SecondaryButton onClick={()=>setModal("proof")}>Request proof</SecondaryButton><SecondaryButton onClick={()=>setModal("approval")}>Request approval</SecondaryButton><PrimaryButton onClick={()=>setModal("handover")}>Generate handover</PrimaryButton></>}>
      {selected?<><FactGrid facts={[{label:"Package type",value:text(selected,["package_type"])},{label:"Funding type",value:text(selected,["funding_type"])},{label:"Requested amount",value:formatDh(selected.requested_amount)},{label:"Deadline",value:shortDate(selected.deadline)},{label:"Status",value:text(selected,["status"])},{label:"Next action",value:text(selected,["next_action"])}]}/><div className={styles.drawerBlock}><h3>Section readiness</h3>{stageOrder.map(name=>{const stage=related.stages.find(row=>text(row,["stage_label"],"")===name);return <article key={name}><span>{name}</span><strong>{stage?`${number(stage,["readiness"],0)}% · ${text(stage,["status"])}`:"Missing stage row"}</strong></article>})}</div><div className={styles.drawerBlock}><h3>Approval & audit</h3><AuditTimeline items={[...related.approvals.map(row=>({title:text(row,["approval_title","status"],"Approval"),meta:shortDate(row.created_at),note:text(row,["decision_reason","reason_required"],"")})),...related.audit.map(row=>({title:text(row,["event_type","action"],"Audit"),meta:text(row,["actor"])+` · ${shortDate(row.created_at)}`,note:text(row,["summary"],"")}))]}/></div></>:null}
    </Drawer>

    <Dialog open={modal==="create"} title="Create Capital Case" eyebrow="Mandate & Package Type" wide onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void createCase()}>Create case and stages</PrimaryButton></>}><div className={styles.formGrid}><Field label="Case title"><input value={create.caseTitle} onChange={e=>setCreate({...create,caseTitle:e.target.value})}/></Field><Field label="Package type"><select value={create.packageType} onChange={e=>setCreate({...create,packageType:e.target.value})}>{["Bank financing case","ILAYKI / TAMWILCOM case","Grant application case","VC investor case","Angel investor case","Strategic partner case","SaaS monetization case","Impact funding case","International expansion case"].map(v=><option key={v}>{v}</option>)}</select></Field><Field label="Funding type"><input value={create.fundingType} onChange={e=>setCreate({...create,fundingType:e.target.value})}/></Field><Field label="Requested amount (Dh)"><input type="number" value={create.requestedAmount} onChange={e=>setCreate({...create,requestedAmount:e.target.value})}/></Field><Field label="Deadline"><input type="date" value={create.deadline} onChange={e=>setCreate({...create,deadline:e.target.value})}/></Field><Field label="Priority"><select value={create.priority} onChange={e=>setCreate({...create,priority:e.target.value})}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></Field><Field label="Qualification dossier ID"><input value={create.qualificationDossierId} onChange={e=>setCreate({...create,qualificationDossierId:e.target.value})}/></Field><Field label="Funder ID"><input value={create.funderId} onChange={e=>setCreate({...create,funderId:e.target.value})}/></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="section"} title="Case Section Studio" eyebrow="Evidence-Backed Assembly" wide onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void addSection()}>Save section draft</PrimaryButton></>}><div className={styles.sectionTabs}>{["narrative","financial","impact","risk"].map(v=><button key={v} className={sectionType===v?styles.sectionActive:""} onClick={()=>setSectionType(v)}>{v}</button>)}</div><div className={styles.formGrid}>
      {sectionType==="narrative"?<><Field label="Headline"><input value={section.headline} onChange={e=>setSection({...section,headline:e.target.value})}/></Field><Field label="Opening message"><textarea value={section.openingMessage} onChange={e=>setSection({...section,openingMessage:e.target.value})}/></Field><Field label="Proof to emphasize"><textarea value={section.proofToEmphasize} onChange={e=>setSection({...section,proofToEmphasize:e.target.value})}/></Field><Field label="Language to avoid"><textarea value={section.languageToAvoid} onChange={e=>setSection({...section,languageToAvoid:e.target.value})}/></Field></>:sectionType==="financial"?<><Field label="Requested amount"><input type="number" value={section.requestedAmount} onChange={e=>setSection({...section,requestedAmount:e.target.value})}/></Field><Field label="Instrument type"><input value={section.instrumentType} onChange={e=>setSection({...section,instrumentType:e.target.value})}/></Field><Field label="Repayment / dilution explanation"><textarea value={section.repaymentExplanation} onChange={e=>setSection({...section,repaymentExplanation:e.target.value})}/></Field></>:sectionType==="impact"?<><Field label="Impact category"><input value={section.impactCategory} onChange={e=>setSection({...section,impactCategory:e.target.value})}/></Field><Field label="Statement"><textarea value={section.statement} onChange={e=>setSection({...section,statement:e.target.value})}/></Field><Field label="Measurable indicator"><input value={section.measurableIndicator} onChange={e=>setSection({...section,measurableIndicator:e.target.value})}/></Field><Field label="Proof needed"><textarea value={section.proofNeeded} onChange={e=>setSection({...section,proofNeeded:e.target.value})}/></Field></>:<><Field label="Risk type"><input value={section.riskType} onChange={e=>setSection({...section,riskType:e.target.value})}/></Field><Field label="Severity"><select value={section.severity} onChange={e=>setSection({...section,severity:e.target.value})}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></Field><Field label="Description"><textarea value={section.description} onChange={e=>setSection({...section,description:e.target.value})}/></Field><Field label="Mitigation"><textarea value={section.mitigation} onChange={e=>setSection({...section,mitigation:e.target.value})}/></Field><Field label="Plan B"><textarea value={section.planB} onChange={e=>setSection({...section,planB:e.target.value})}/></Field><Field label="Plan C / D"><textarea value={`${section.planC}\n${section.planD}`} onChange={e=>{const [planC,...rest]=e.target.value.split("\n");setSection({...section,planC,planD:rest.join("\n")})}}/></Field></>}</div><label className={styles.check}><input type="checkbox" checked={section.founderReviewRequired} onChange={e=>setSection({...section,founderReviewRequired:e.target.checked})}/> Founder review required</label><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="proof"} title="Request Missing Case Evidence" eyebrow="Proof Control" onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void submit("request-proof",proof,"Proof requirement created.")}>Create proof request</PrimaryButton></>}><div className={styles.formGrid}><Field label="Document name"><input value={proof.documentName} onChange={e=>setProof({...proof,documentName:e.target.value})}/></Field><Field label="Category"><input value={proof.category} onChange={e=>setProof({...proof,category:e.target.value})}/></Field><Field label="Priority"><select value={proof.priority} onChange={e=>setProof({...proof,priority:e.target.value})}><option>high</option><option>medium</option><option>low</option></select></Field><Field label="Deadline"><input type="date" value={proof.deadline} onChange={e=>setProof({...proof,deadline:e.target.value})}/></Field><Field label="Owner"><input value={proof.owner} onChange={e=>setProof({...proof,owner:e.target.value})}/></Field><Field label="Notes"><textarea value={proof.notes} onChange={e=>setProof({...proof,notes:e.target.value})}/></Field><label className={styles.check}><input type="checkbox" checked={proof.requiredForSubmission} onChange={e=>setProof({...proof,requiredForSubmission:e.target.checked})}/> Required for submission</label></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="approval"} title="Request Founder Approval" eyebrow="Final Release Governance" onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void submit("request-approval",approval,"Founder approval request created.")}>Request approval</PrimaryButton></>}><div className={styles.formGrid}><Field label="Approval item"><input value={approval.approvalItem} onChange={e=>setApproval({...approval,approvalItem:e.target.value})}/></Field><Field label="Approver"><input value={approval.approver} onChange={e=>setApproval({...approval,approver:e.target.value})}/></Field><Field label="Due date"><input type="date" value={approval.dueDate} onChange={e=>setApproval({...approval,dueDate:e.target.value})}/></Field><Field label="Reason"><textarea value={approval.reason} onChange={e=>setApproval({...approval,reason:e.target.value})}/></Field><Field label="Comments / revision expectations"><textarea value={approval.comments} onChange={e=>setApproval({...approval,comments:e.target.value})}/></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="handover"} title="Generate Coordinator Handover" eyebrow="Human Execution Bridge" wide onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void submit("handover",handover,"Coordinator handover created.")}>Create handover</PrimaryButton></>}><div className={styles.formGrid}><Field label="Execution block"><input value={handover.block} onChange={e=>setHandover({...handover,block:e.target.value})}/></Field><Field label="Owner"><input value={handover.owner} onChange={e=>setHandover({...handover,owner:e.target.value})}/></Field><Field label="Deadline"><input type="datetime-local" value={handover.deadline} onChange={e=>setHandover({...handover,deadline:e.target.value})}/></Field><Field label="Instruction"><textarea value={handover.instruction} onChange={e=>setHandover({...handover,instruction:e.target.value})}/></Field><Field label="Proof after action"><textarea value={handover.proofAfterAction} onChange={e=>setHandover({...handover,proofAfterAction:e.target.value})}/></Field><Field label="Escalation condition"><textarea value={handover.escalationCondition} onChange={e=>setHandover({...handover,escalationCondition:e.target.value})}/></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="lock"} title="Lock Approved Case Version" eyebrow="Submission Package Gate" onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void submit("lock-version",{reason:lockReason},"Approved case version locked.")}>Lock version</PrimaryButton></>}><Field label="Lock reason"><textarea value={lockReason} onChange={e=>setLockReason(e.target.value)}/></Field><TruthChip kind="approval">This action is authorization-controlled and does not submit externally.</TruthChip><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>
  </AcCapitalShell>;
}
