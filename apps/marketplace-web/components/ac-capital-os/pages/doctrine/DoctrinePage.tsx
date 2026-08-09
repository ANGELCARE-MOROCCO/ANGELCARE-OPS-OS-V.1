"use client";

import { BookKey, Bot, GitBranch, LibraryBig, LockKeyhole, RefreshCcw, ShieldCheck, Sparkles, TriangleAlert, Workflow } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { EmptyState, ErrorState, LoadingState } from "../../core/AsyncState";
import { ActionFeedback, Field } from "../../core/FormParts";
import { MetricTile } from "../../core/MetricTile";
import { Dialog, Drawer } from "../../core/Overlay";
import { StatusBadge } from "../../core/StatusBadge";
import { AuditTimeline, FactGrid, PrimaryButton, SecondaryButton, SectionHeading, TruthChip } from "../../core/WorkspaceParts";
import { postEnvelope } from "../../core/api";
import { rowsFrom, shortDate, text } from "../../core/data";
import type { CapitalActor, Row } from "../../core/types";
import { canApprove } from "../../core/role";
import { useAction } from "../../core/useAction";
import { useActionQuery } from "../../core/useActionQuery";
import { useWorkspace } from "../../core/useWorkspace";
import styles from "./doctrine.module.css";

type Modal = "doctrine" | "prompt" | "skill" | "activation" | "rollback" | null;

export function DoctrinePage({ actor }: { actor: CapitalActor }) {
  const workspace = useWorkspace("/api/ac-capital-os/capital-doctrine");
  const action = useAction();
  const [selected, setSelected] = useState<Row | null>(null);
  const [family, setFamily] = useState("All");
  const [modal, setModal] = useState<Modal>(null);
  const [doctrine, setDoctrine] = useState({ title:"", category:"Bank", doctrineType:"Operating doctrine", doctrineText:"", priority:"Medium", source:"Manual", injectionMode:"Manual", workspaces:"", agents:"", founderApprovalRequired:true, conflictSensitivity:"medium" });
  const [prompt, setPrompt] = useState({ promptName:"", targetAgent:"Capital Executive", targetWorkspace:"command-floor", promptBody:"", inputRequirements:"", outputRequirements:"", riskLevel:"medium", approvalRequired:true });
  const [skill, setSkill] = useState({ skillName:"", skillCategory:"Capital intelligence", skillDescription:"", inputExpectations:"", outputStandards:"", cautionRules:"", agents:"", workspaces:"" });
  const [reason, setReason] = useState("");
  const openAction = useCallback((next: Modal) => setModal(next), []);
  useActionQuery({ create:"doctrine", prompt:"prompt", skill:"skill" }, openAction);

  const items = rowsFrom(workspace.envelope,"items");
  const versions = rowsFrom(workspace.envelope,"versions");
  const prompts = rowsFrom(workspace.envelope,"prompts");
  const skills = rowsFrom(workspace.envelope,"skills");
  const conflicts = rowsFrom(workspace.envelope,"conflicts");
  const applications = rowsFrom(workspace.envelope,"applications");
  const bindings = rowsFrom(workspace.envelope,"agentBindings");
  const injections = rowsFrom(workspace.envelope,"monthlyInjections");
  const audit = rowsFrom(workspace.envelope,"auditEvents");
  const families = ["All","Bank","Grant","VC","SaaS","Impact","Women Founder","Child Safety","International"];
  const filtered = family === "All" ? items : items.filter(row=>text(row,["category"],"").toLowerCase().includes(family.toLowerCase().split(" ")[0]));
  const active = items.filter(row=>/active/i.test(text(row,["status"],""))).length;
  const pending = items.filter(row=>/pending|draft/i.test(text(row,["status","approval_status"],""))).length;
  const selectedVersions = selected ? versions.filter(row=>String(row.doctrine_id)===String(selected.id)) : [];
  const selectedBindings = selected ? bindings.filter(row=>String(row.doctrine_id)===String(selected.id)) : [];
  const selectedApps = selected ? applications.filter(row=>String(row.doctrine_id)===String(selected.id)) : [];
  const selectedAudit = selected ? audit.filter(row=>String(row.doctrine_id)===String(selected.id)) : [];

  async function createDoctrine() {
    if (!doctrine.title.trim() || !doctrine.doctrineText.trim()) return action.validate("Doctrine title and doctrine text are required.");
    await action.execute(()=>postEnvelope("/api/ac-capital-os/capital-doctrine",{action:"create-doctrine",...doctrine,workspaces:doctrine.workspaces.split(",").map(v=>v.trim()).filter(Boolean),agents:doctrine.agents.split(",").map(v=>v.trim()).filter(Boolean)}),"Doctrine draft created.");
    await workspace.refresh();
  }
  async function createPrompt() {
    if (!prompt.promptName.trim()) return action.validate("Prompt name is required.");
    await action.execute(()=>postEnvelope("/api/ac-capital-os/capital-doctrine",{action:"create-prompt",...prompt}),"Prompt draft created.");
    await workspace.refresh();
  }
  async function createSkill() {
    if (!skill.skillName.trim()) return action.validate("Skill name is required.");
    await action.execute(()=>postEnvelope("/api/ac-capital-os/capital-doctrine",{action:"create-skill",...skill,agents:skill.agents.split(",").map(v=>v.trim()).filter(Boolean),workspaces:skill.workspaces.split(",").map(v=>v.trim()).filter(Boolean)}),"Skill draft created.");
    await workspace.refresh();
  }
  async function transition(kind:"request-activation"|"activate"|"rollback") {
    if (!selected) return action.validate("Select a doctrine item.");
    if (kind==="activate" && !canApprove(actor)) return action.disabled("Founder or authorized strategy admin approval is required.");
    await action.execute(()=>postEnvelope("/api/ac-capital-os/capital-doctrine",{action:kind,id:selected.id,title:text(selected,["title"]),reason}),`Doctrine ${kind.replace("-"," ")} persisted.`);
    await workspace.refresh();
  }

  const insights=[{label:"Active doctrine",value:`${active} active items`},{label:"Pending governance",value:`${pending} drafts or reviews`},{label:"Conflict control",value:`${conflicts.length} recorded conflicts`},{label:"AI binding",value:`${bindings.length} agent bindings`}];

  return <AcCapitalShell actor={actor} workspaceKey="doctrine-vault" title="Capital Doctrine Vault" subtitle="Institutional memory, version control, conflict governance and AI bindings for bank, grant, VC, SaaS, impact and international capital doctrine." envelope={workspace.envelope} insights={insights} primaryAction="Inject Doctrine" onPrimaryAction={()=>setModal("doctrine")}>
    {workspace.loading?<LoadingState label="Opening secure doctrine vault…"/>:workspace.error?<ErrorState message={workspace.error} onRetry={()=>void workspace.refresh()}/>:<>
      <section className={styles.vaultHero}><div><span><BookKey size={15}/> Sovereign Capital Memory</span><h2>Every lesson becomes governed doctrine — never an uncontrolled AI instruction.</h2><p>Draft, version, bind, conflict-check, approve and roll back the rules that shape AngelCare’s capital decisions.</p><div><PrimaryButton onClick={()=>setModal("doctrine")}>Inject doctrine</PrimaryButton><SecondaryButton onClick={()=>setModal("prompt")}>Create prompt</SecondaryButton><SecondaryButton onClick={()=>setModal("skill")}>Create skill</SecondaryButton></div></div><div className={styles.vaultDoor}><LockKeyhole/><strong>{active}</strong><span>Active doctrines</span><TruthChip kind="approval">Activation controlled</TruthChip></div></section>
      <section className={styles.metrics}><MetricTile label="Doctrine items" value={String(items.length)} detail="All live/fallback doctrine records." tone="violet"/><MetricTile label="Active" value={String(active)} detail="Only records with active status." tone="green"/><MetricTile label="Pending" value={String(pending)} detail="Draft or approval states." tone={pending?"amber":"green"}/><MetricTile label="Conflicts" value={String(conflicts.length)} detail="Requires resolution before safe activation." tone={conflicts.length?"red":"green"}/></section>

      <section className={styles.controlMatrix}><SectionHeading eyebrow="Doctrine Control Matrix" title="Institutional doctrine families" copy="Each family has its own governance, agent binding and version lineage."/><div className={styles.familyTabs}>{families.map(item=><button key={item} className={family===item?styles.familyActive:""} onClick={()=>setFamily(item)}>{item}</button>)}</div>
        {filtered.length?<div className={styles.doctrineGrid}>{filtered.map(row=><button key={String(row.id)} className={`${styles.doctrineCard} ${selected?.id===row.id?styles.selected:""}`} onClick={()=>setSelected(row)}><div><StatusBadge value={text(row,["status"],"Draft")}/><span>{text(row,["version"],"v1.0")}</span></div><BookKey/><strong>{text(row,["title"],"Doctrine item")}</strong><p>{text(row,["doctrine_text"],"No doctrine text returned.")}</p><footer><span>{text(row,["category"],"General")}</span><span>{text(row,["approval_status"],"Pending Review")}</span></footer></button>)}</div>:<EmptyState title="No doctrine in this family" copy="Create a doctrine draft. The system will not fabricate active doctrine for an empty family." action="Inject doctrine" onAction={()=>setModal("doctrine")}/>}
      </section>

      <section className={styles.memoryConsole}><div><SectionHeading eyebrow="Compounding Intelligence" title="Prompts, skills, injections and conflicts"/><div className={styles.memoryGrid}><article><Sparkles/><strong>{prompts.length} prompts</strong><span>Target-agent and workspace instructions.</span></article><article><Workflow/><strong>{skills.length} skills</strong><span>Input, output and caution standards.</span></article><article><RefreshCcw/><strong>{injections.length} injections</strong><span>Monthly institutional learning cycle.</span></article><article className={conflicts.length?styles.alert:""}><TriangleAlert/><strong>{conflicts.length} conflicts</strong><span>Reconcile before activation.</span></article></div></div><aside><h3>Governance sequence</h3>{["Draft","Conflict review","Founder/Admin approval","Activation","Application audit","Rollback if needed"].map((item,index)=><div key={item}><em>{index+1}</em><span>{item}</span></div>)}</aside></section>
    </>}

    <Drawer open={Boolean(selected)} title={selected?text(selected,["title"],"Doctrine"):"Doctrine"} eyebrow="Doctrine Detail & Version Lineage" onClose={()=>setSelected(null)} footer={<><SecondaryButton onClick={()=>setModal("rollback")}>Rollback</SecondaryButton><SecondaryButton onClick={()=>setModal("activation")}>Request activation</SecondaryButton><PrimaryButton onClick={()=>{setModal("activation");setReason("Approved for activation after conflict review.")}}>Activate</PrimaryButton></>}>
      {selected?<><FactGrid facts={[{label:"Category",value:text(selected,["category"])},{label:"Type",value:text(selected,["doctrine_type"])},{label:"Status",value:text(selected,["status"])},{label:"Approval",value:text(selected,["approval_status"])},{label:"Version",value:text(selected,["version"])},{label:"Conflict sensitivity",value:text(selected,["conflict_sensitivity"])}]}/><div className={styles.drawerText}><h3>Doctrine text</h3><p>{text(selected,["doctrine_text"])}</p></div><div className={styles.drawerText}><h3>Agent bindings</h3>{selectedBindings.length?selectedBindings.map(row=><p key={String(row.id)}><Bot size={14}/>{text(row,["agent_name","agent_id"],"Agent binding")}</p>):<p>No agent binding recorded.</p>}</div><div className={styles.drawerText}><h3>Version & application audit</h3><AuditTimeline items={[...selectedVersions.map(row=>({title:`Version ${text(row,["version","version_label"])}`,meta:shortDate(row.created_at),note:text(row,["change_summary"],"")})),...selectedApps.map(row=>({title:text(row,["application_type","workspace"],"Doctrine application"),meta:shortDate(row.created_at),note:text(row,["result_summary"],"")})),...selectedAudit.map(row=>({title:text(row,["event_type"],"Audit"),meta:text(row,["actor"])+` · ${shortDate(row.created_at)}`,note:text(row,["summary"],"")}))]}/></div></>:null}
    </Drawer>

    <Dialog open={modal==="doctrine"} title="Doctrine Injection Studio" eyebrow="Governed Institutional Memory" wide onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void createDoctrine()}>Create draft</PrimaryButton></>}><div className={styles.formGrid}><Field label="Title"><input value={doctrine.title} onChange={e=>setDoctrine({...doctrine,title:e.target.value})}/></Field><Field label="Category"><select value={doctrine.category} onChange={e=>setDoctrine({...doctrine,category:e.target.value})}>{families.slice(1).map(v=><option key={v}>{v}</option>)}</select></Field><Field label="Doctrine type"><input value={doctrine.doctrineType} onChange={e=>setDoctrine({...doctrine,doctrineType:e.target.value})}/></Field><Field label="Priority"><select value={doctrine.priority} onChange={e=>setDoctrine({...doctrine,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></Field><Field label="Doctrine text"><textarea value={doctrine.doctrineText} onChange={e=>setDoctrine({...doctrine,doctrineText:e.target.value})}/></Field><Field label="Applies to workspaces"><textarea value={doctrine.workspaces} onChange={e=>setDoctrine({...doctrine,workspaces:e.target.value})} placeholder="radar, cases, reports"/></Field><Field label="Applies to agents"><textarea value={doctrine.agents} onChange={e=>setDoctrine({...doctrine,agents:e.target.value})}/></Field><Field label="Conflict sensitivity"><select value={doctrine.conflictSensitivity} onChange={e=>setDoctrine({...doctrine,conflictSensitivity:e.target.value})}><option>low</option><option>medium</option><option>high</option></select></Field></div><label className={styles.check}><input type="checkbox" checked={doctrine.founderApprovalRequired} onChange={e=>setDoctrine({...doctrine,founderApprovalRequired:e.target.checked})}/> Founder approval required</label><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="prompt"} title="Prompt Studio" eyebrow="AI Instruction Governance" wide onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void createPrompt()}>Create prompt draft</PrimaryButton></>}><div className={styles.formGrid}><Field label="Prompt name"><input value={prompt.promptName} onChange={e=>setPrompt({...prompt,promptName:e.target.value})}/></Field><Field label="Target agent"><input value={prompt.targetAgent} onChange={e=>setPrompt({...prompt,targetAgent:e.target.value})}/></Field><Field label="Target workspace"><input value={prompt.targetWorkspace} onChange={e=>setPrompt({...prompt,targetWorkspace:e.target.value})}/></Field><Field label="Risk level"><select value={prompt.riskLevel} onChange={e=>setPrompt({...prompt,riskLevel:e.target.value})}><option>low</option><option>medium</option><option>high</option></select></Field><Field label="Prompt body"><textarea value={prompt.promptBody} onChange={e=>setPrompt({...prompt,promptBody:e.target.value})}/></Field><Field label="Input requirements"><textarea value={prompt.inputRequirements} onChange={e=>setPrompt({...prompt,inputRequirements:e.target.value})}/></Field><Field label="Output requirements"><textarea value={prompt.outputRequirements} onChange={e=>setPrompt({...prompt,outputRequirements:e.target.value})}/></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="skill"} title="Capital Skill Studio" eyebrow="AI Capability Governance" wide onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void createSkill()}>Create skill draft</PrimaryButton></>}><div className={styles.formGrid}><Field label="Skill name"><input value={skill.skillName} onChange={e=>setSkill({...skill,skillName:e.target.value})}/></Field><Field label="Category"><input value={skill.skillCategory} onChange={e=>setSkill({...skill,skillCategory:e.target.value})}/></Field><Field label="Description"><textarea value={skill.skillDescription} onChange={e=>setSkill({...skill,skillDescription:e.target.value})}/></Field><Field label="Input expectations"><textarea value={skill.inputExpectations} onChange={e=>setSkill({...skill,inputExpectations:e.target.value})}/></Field><Field label="Output standards"><textarea value={skill.outputStandards} onChange={e=>setSkill({...skill,outputStandards:e.target.value})}/></Field><Field label="Caution rules"><textarea value={skill.cautionRules} onChange={e=>setSkill({...skill,cautionRules:e.target.value})}/></Field><Field label="Agents"><input value={skill.agents} onChange={e=>setSkill({...skill,agents:e.target.value})}/></Field><Field label="Workspaces"><input value={skill.workspaces} onChange={e=>setSkill({...skill,workspaces:e.target.value})}/></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="activation"||modal==="rollback"} title={modal==="rollback"?"Rollback Doctrine":"Doctrine Activation Control"} eyebrow="Founder / Admin Governance" onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton>{modal==="activation"?<><SecondaryButton onClick={()=>void transition("request-activation")}>Request approval</SecondaryButton><PrimaryButton onClick={()=>void transition("activate")}>Activate</PrimaryButton></>:<PrimaryButton onClick={()=>void transition("rollback")}>Confirm rollback</PrimaryButton>}</>}><Field label="Decision reason"><textarea value={reason} onChange={e=>setReason(e.target.value)}/></Field><TruthChip kind="approval">Activation is persisted only after authorized approval.</TruthChip><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>
  </AcCapitalShell>;
}
