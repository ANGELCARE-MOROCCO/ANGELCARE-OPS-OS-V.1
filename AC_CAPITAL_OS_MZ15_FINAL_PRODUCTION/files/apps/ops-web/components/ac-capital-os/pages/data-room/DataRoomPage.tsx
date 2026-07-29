"use client";

import { Archive, Boxes, FileArchive, FileCheck2, FileClock, FileLock2, FileUp, FolderKey, Package, ShieldCheck, Stamp, TriangleAlert } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { EmptyState, ErrorState, LoadingState } from "../../core/AsyncState";
import { ActionFeedback, Field } from "../../core/FormParts";
import { MetricTile } from "../../core/MetricTile";
import { Dialog, Drawer } from "../../core/Overlay";
import { StatusBadge } from "../../core/StatusBadge";
import { AuditTimeline, FactGrid, PrimaryButton, SecondaryButton, SectionHeading, TruthChip } from "../../core/WorkspaceParts";
import { postEnvelope, uploadEnvelope } from "../../core/api";
import { number, rowsFrom, shortDate, text } from "../../core/data";
import type { CapitalActor, Row } from "../../core/types";
import { useAction } from "../../core/useAction";
import { useActionQuery } from "../../core/useActionQuery";
import { useWorkspace } from "../../core/useWorkspace";
import styles from "./data-room.module.css";

type Modal = "upload" | "classify" | "package" | "missing" | null;
const shelves = ["Legal & Company","Founders","Financials","Business Plan","Market Proof","SaaS Proof","B2B Proof","Academy & SOP","Impact Proof","Submission Archive"];

export function DataRoomPage({ actor }: { actor: CapitalActor }) {
  const workspace = useWorkspace("/api/ac-capital-os/data-room");
  const action = useAction();
  const [selected, setSelected] = useState<Row | null>(null);
  const [shelf, setShelf] = useState("All");
  const [modal, setModal] = useState<Modal>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState({ category:"General", sensitivity:"Internal", owner:actor.name, founderApprovalRequired:false, relatedCaseId:"", expiryDate:"" });
  const [classify, setClassify] = useState({ category:"General", sensitivityLevel:"Internal", owner:actor.name, expiryDate:"", founderApprovalRequired:false, signatureRequired:false, stampRequired:false, nextAction:"" });
  const [pkg, setPkg] = useState({ packageName:"", packageType:"Bank Pack", relatedCaseId:"", readinessScore:0, missingItemsCount:0, outdatedItemsCount:0, founderApprovalRequired:true });
  const [missing, setMissing] = useState({ item:"", priority:"high", relatedCaseId:"", relatedFunderId:"", owner:actor.name, dueDate:"", requiredForSubmission:true, nextAction:"Obtain and validate evidence" });
  const openAction=useCallback((next:Modal)=>setModal(next),[]);
  useActionQuery({ upload:"upload", package:"package", missing:"missing" },openAction);

  const documents=rowsFrom(workspace.envelope,"documents");
  const categories=rowsFrom(workspace.envelope,"categories");
  const versions=rowsFrom(workspace.envelope,"versions");
  const missingEvidence=rowsFrom(workspace.envelope,"missingEvidence");
  const packageBuilders=rowsFrom(workspace.envelope,"packageBuilders");
  const packageItems=rowsFrom(workspace.envelope,"packageItems");
  const readiness=rowsFrom(workspace.envelope,"readinessScores");
  const approvals=rowsFrom(workspace.envelope,"approvalEvents");
  const audit=rowsFrom(workspace.envelope,"auditEvents");
  const archive=rowsFrom(workspace.envelope,"submissionArchive");
  const filtered=shelf==="All"?documents:documents.filter(row=>text(row,["category","document_category"],"").toLowerCase().includes(shelf.toLowerCase().split(" ")[0]));
  const selectedVersions=selected?versions.filter(row=>String(row.document_id)===String(selected.id)):[];
  const selectedAudit=selected?audit.filter(row=>String(row.document_id)===String(selected.id)):[];
  const expired=documents.filter(row=>{const value=row.expiry_date;return value?new Date(String(value)).getTime()<Date.now():false}).length;
  const sensitive=documents.filter(row=>/confidential|sensitive|restricted/i.test(text(row,["sensitivity_level","sensitivity"],""))).length;

  async function uploadFile() {
    const file=fileRef.current?.files?.[0];
    if(!file) return action.validate("Select a document file.");
    const form=new FormData();form.set("file",file);form.set("category",upload.category);form.set("sensitivity",upload.sensitivity);form.set("owner",upload.owner);form.set("founderApprovalRequired",String(upload.founderApprovalRequired));if(upload.relatedCaseId)form.set("relatedCaseId",upload.relatedCaseId);if(upload.expiryDate)form.set("expiryDate",upload.expiryDate);
    await action.execute(()=>uploadEnvelope("/api/ac-capital-os/data-room/upload",form),"Document uploaded to the private vault and metadata created.");
    await workspace.refresh();
  }
  async function classifyDocument() {
    if(!selected) return action.validate("Select a document.");
    await action.execute(()=>postEnvelope("/api/ac-capital-os/data-room",{action:"classify-document",id:selected.id,...classify}),"Document classification persisted.");
    await workspace.refresh();
  }
  async function createPackage() {
    if(!pkg.packageName.trim()) return action.validate("Package name is required.");
    await action.execute(()=>postEnvelope("/api/ac-capital-os/data-room",{action:"create-package",...pkg}),"Proof package draft created.");
    await workspace.refresh();
  }
  async function createMissing() {
    if(!missing.item.trim()) return action.validate("Evidence item is required.");
    await action.execute(()=>postEnvelope("/api/ac-capital-os/data-room",{action:"missing-evidence",...missing}),"Missing evidence requirement created.");
    await workspace.refresh();
  }

  const insights=[{label:"Vault inventory",value:`${documents.length} documents returned`},{label:"Missing evidence",value:`${missingEvidence.length} open evidence gaps`},{label:"Private storage",value:workspace.envelope?.warning||"Upload endpoint reports configuration truth"},{label:"Release safety",value:"Sensitive proof remains approval-controlled"}];

  return <AcCapitalShell actor={actor} workspaceKey="due-diligence-vault" title="Due Diligence Vault" subtitle="Private storage, evidence classification, version lineage, sensitivity zoning and bank/VC/grant package assembly without fake upload success." envelope={workspace.envelope} insights={insights} primaryAction="Upload Document" onPrimaryAction={()=>setModal("upload")}>
    {workspace.loading?<LoadingState label="Opening private due-diligence vault…"/>:workspace.error?<ErrorState message={workspace.error} onRetry={()=>void workspace.refresh()}/>:<>
      <section className={styles.vaultHero}><div><span><FolderKey size={15}/> Institutional Evidence Control</span><h2>Every claim should point to a classified, versioned and approval-aware proof object.</h2><p>The vault separates legal, financial, SaaS, B2B, Academy, quality, impact and submission evidence — with honest storage state and no public bucket assumption.</p><div><PrimaryButton onClick={()=>setModal("upload")}>Upload document</PrimaryButton><SecondaryButton onClick={()=>setModal("package")}>Build proof package</SecondaryButton><SecondaryButton onClick={()=>setModal("missing")}>Request evidence</SecondaryButton></div></div><div className={styles.vaultSeal}><FileLock2/><strong>{documents.length}</strong><span>Evidence objects</span><TruthChip kind="proof">Private storage contract</TruthChip></div></section>
      <section className={styles.metrics}><MetricTile label="Documents" value={String(documents.length)} detail="Actual metadata rows returned." tone="blue"/><MetricTile label="Missing evidence" value={String(missingEvidence.length)} detail="Open proof obligations." tone={missingEvidence.length?"red":"green"}/><MetricTile label="Sensitive" value={String(sensitive)} detail="Restricted/confidential objects." tone={sensitive?"violet":"green"}/><MetricTile label="Expired" value={String(expired)} detail="Based on stored expiry dates." tone={expired?"amber":"green"}/></section>

      <section className={styles.vaultRoom}><SectionHeading eyebrow="Evidence Shelves" title="Classified proof universe" copy="The shelf metaphor is operational: filters change the document view and each object opens its version, approval and audit drawer."/><div className={styles.shelves}><button className={shelf==="All"?styles.shelfActive:""} onClick={()=>setShelf("All")}>All evidence <b>{documents.length}</b></button>{shelves.map(name=><button key={name} className={shelf===name?styles.shelfActive:""} onClick={()=>setShelf(name)}>{name}<b>{documents.filter(row=>text(row,["category","document_category"],"").toLowerCase().includes(name.toLowerCase().split(" ")[0])).length}</b></button>)}</div>
        {filtered.length?<div className={styles.documentGrid}>{filtered.map(row=><button key={String(row.id)} className={`${styles.documentCard} ${selected?.id===row.id?styles.selected:""}`} onClick={()=>setSelected(row)}><div className={styles.fileIcon}>{/pdf/i.test(text(row,["mime_type","file_type"],""))?<FileArchive/>:<FileCheck2/>}</div><div><StatusBadge value={text(row,["status","approval_status"],"Indexed")}/><strong>{text(row,["document_title","file_name","document_name"],"Document")}</strong><p>{text(row,["category","document_category"],"General")} · {text(row,["sensitivity_level","sensitivity"],"Internal")}</p><footer><span>{shortDate(row.updated_at||row.created_at)}</span><span>{text(row,["owner"],"Unassigned")}</span></footer></div></button>)}</div>:<EmptyState title="No documents on this shelf" copy="Upload or classify evidence. The vault does not invent proof objects." action="Upload document" onAction={()=>setModal("upload")}/>}
      </section>

      <section className={styles.packageRoom}><div><SectionHeading eyebrow="Package Assembly" title="Bank, grant, VC and impact package builders"/>{packageBuilders.length?<div className={styles.packageGrid}>{packageBuilders.map(row=><article key={String(row.id)}><Package/><div><StatusBadge value={text(row,["status"],"Draft")}/><strong>{text(row,["package_name"],"Proof package")}</strong><p>{text(row,["package_type"],"Package")} · {number(row,["readiness_score"],0)}% ready</p><span>{number(row,["missing_items_count"],0)} missing · {number(row,["outdated_items_count"],0)} outdated</span></div></article>)}</div>:<EmptyState title="No package builders yet" copy="Create a bank, grant, VC or impact proof package from verified documents." action="Create package" onAction={()=>setModal("package")}/>}</div><aside><h3>Missing Evidence Command</h3>{missingEvidence.slice(0,6).map(row=><button key={String(row.id)} onClick={()=>setSelected(row)}><TriangleAlert/><div><strong>{text(row,["item"],"Evidence item")}</strong><span>{text(row,["priority"],"medium")} · {shortDate(row.due_date)}</span></div></button>)}{!missingEvidence.length?<p>No missing-evidence rows returned.</p>:null}</aside></section>
    </>}

    <Drawer open={Boolean(selected)} title={selected?text(selected,["document_title","file_name","document_name"],"Document"):"Document"} eyebrow="Evidence & Version Drawer" onClose={()=>setSelected(null)} footer={<><SecondaryButton onClick={()=>setModal("classify")}>Classify</SecondaryButton><PrimaryButton onClick={()=>setModal("package")}>Add package workflow</PrimaryButton></>}>
      {selected?<><FactGrid facts={[{label:"Category",value:text(selected,["category","document_category"])},{label:"Sensitivity",value:text(selected,["sensitivity_level","sensitivity"])},{label:"Owner",value:text(selected,["owner"])},{label:"Expiry",value:shortDate(selected.expiry_date)},{label:"Signature",value:Boolean(selected.signature_required)?"Required":"Not marked"},{label:"Founder approval",value:Boolean(selected.founder_approval_required)?"Required":"Not marked"}]}/><div className={styles.drawerBlock}><h3>Storage reference</h3><p>{text(selected,["storage_path","file_path"],"No storage path returned.")}</p></div><div className={styles.drawerBlock}><h3>Version lineage</h3><AuditTimeline items={selectedVersions.map(row=>({title:text(row,["version_label","version"],"Version"),meta:shortDate(row.created_at),note:text(row,["storage_path","change_summary"],"")}))}/></div><div className={styles.drawerBlock}><h3>Approval and audit</h3><AuditTimeline items={[...approvals.filter(row=>String(row.document_id)===String(selected.id)).map(row=>({title:text(row,["event_type","status"],"Approval"),meta:shortDate(row.created_at),note:text(row,["reason","comments"],"")})),...selectedAudit.map(row=>({title:text(row,["event_type","action"],"Audit"),meta:shortDate(row.created_at),note:text(row,["summary"],"")}))]}/></div></>:null}
    </Drawer>

    <Dialog open={modal==="upload"} title="Private Data Room Upload" eyebrow="Real Storage Workflow" wide onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void uploadFile()} disabled={action.state.phase==="submitting"}>Upload to private vault</PrimaryButton></>}><div className={styles.uploadZone} onClick={()=>fileRef.current?.click()}><FileUp/><strong>Select evidence file</strong><span>PDF, images, DOCX, XLSX, CSV or text · maximum 20 MB</span><input ref={fileRef} type="file"/></div><div className={styles.formGrid}><Field label="Category"><input value={upload.category} onChange={e=>setUpload({...upload,category:e.target.value})}/></Field><Field label="Sensitivity"><select value={upload.sensitivity} onChange={e=>setUpload({...upload,sensitivity:e.target.value})}><option>Internal</option><option>Confidential</option><option>Founder Sensitive</option><option>Financial Sensitive</option></select></Field><Field label="Owner"><input value={upload.owner} onChange={e=>setUpload({...upload,owner:e.target.value})}/></Field><Field label="Related case ID"><input value={upload.relatedCaseId} onChange={e=>setUpload({...upload,relatedCaseId:e.target.value})}/></Field><Field label="Expiry date"><input type="date" value={upload.expiryDate} onChange={e=>setUpload({...upload,expiryDate:e.target.value})}/></Field></div><label className={styles.check}><input type="checkbox" checked={upload.founderApprovalRequired} onChange={e=>setUpload({...upload,founderApprovalRequired:e.target.checked})}/> Founder approval required</label><TruthChip kind="safe">If the bucket is missing, the API returns storage_not_configured — no fake success.</TruthChip><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="classify"} title="Document Classification" eyebrow="Sensitivity & Governance" wide onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void classifyDocument()}>Save classification</PrimaryButton></>}><div className={styles.formGrid}><Field label="Category"><input value={classify.category} onChange={e=>setClassify({...classify,category:e.target.value})}/></Field><Field label="Sensitivity"><select value={classify.sensitivityLevel} onChange={e=>setClassify({...classify,sensitivityLevel:e.target.value})}><option>Internal</option><option>Confidential</option><option>Founder Sensitive</option></select></Field><Field label="Owner"><input value={classify.owner} onChange={e=>setClassify({...classify,owner:e.target.value})}/></Field><Field label="Expiry"><input type="date" value={classify.expiryDate} onChange={e=>setClassify({...classify,expiryDate:e.target.value})}/></Field><Field label="Next action"><textarea value={classify.nextAction} onChange={e=>setClassify({...classify,nextAction:e.target.value})}/></Field></div><div className={styles.checkRow}><label><input type="checkbox" checked={classify.founderApprovalRequired} onChange={e=>setClassify({...classify,founderApprovalRequired:e.target.checked})}/> Founder approval</label><label><input type="checkbox" checked={classify.signatureRequired} onChange={e=>setClassify({...classify,signatureRequired:e.target.checked})}/> Signature required</label><label><input type="checkbox" checked={classify.stampRequired} onChange={e=>setClassify({...classify,stampRequired:e.target.checked})}/> Stamp required</label></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="package"} title="Proof Package Builder" eyebrow="Bank / Grant / VC / Impact" wide onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void createPackage()}>Create package draft</PrimaryButton></>}><div className={styles.formGrid}><Field label="Package name"><input value={pkg.packageName} onChange={e=>setPkg({...pkg,packageName:e.target.value})}/></Field><Field label="Package type"><select value={pkg.packageType} onChange={e=>setPkg({...pkg,packageType:e.target.value})}><option>Bank Pack</option><option>Grant Pack</option><option>VC Pack</option><option>Impact Pack</option><option>SaaS Proof Pack</option></select></Field><Field label="Related case ID"><input value={pkg.relatedCaseId} onChange={e=>setPkg({...pkg,relatedCaseId:e.target.value})}/></Field><Field label="Readiness score"><input type="number" min="0" max="100" value={pkg.readinessScore} onChange={e=>setPkg({...pkg,readinessScore:Number(e.target.value)})}/></Field><Field label="Missing items"><input type="number" value={pkg.missingItemsCount} onChange={e=>setPkg({...pkg,missingItemsCount:Number(e.target.value)})}/></Field><Field label="Outdated items"><input type="number" value={pkg.outdatedItemsCount} onChange={e=>setPkg({...pkg,outdatedItemsCount:Number(e.target.value)})}/></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="missing"} title="Create Missing Evidence Requirement" eyebrow="Evidence Command" onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void createMissing()}>Create requirement</PrimaryButton></>}><div className={styles.formGrid}><Field label="Evidence item"><input value={missing.item} onChange={e=>setMissing({...missing,item:e.target.value})}/></Field><Field label="Priority"><select value={missing.priority} onChange={e=>setMissing({...missing,priority:e.target.value})}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></Field><Field label="Related case ID"><input value={missing.relatedCaseId} onChange={e=>setMissing({...missing,relatedCaseId:e.target.value})}/></Field><Field label="Related funder ID"><input value={missing.relatedFunderId} onChange={e=>setMissing({...missing,relatedFunderId:e.target.value})}/></Field><Field label="Owner"><input value={missing.owner} onChange={e=>setMissing({...missing,owner:e.target.value})}/></Field><Field label="Due date"><input type="date" value={missing.dueDate} onChange={e=>setMissing({...missing,dueDate:e.target.value})}/></Field><Field label="Next action"><textarea value={missing.nextAction} onChange={e=>setMissing({...missing,nextAction:e.target.value})}/></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>
  </AcCapitalShell>;
}
