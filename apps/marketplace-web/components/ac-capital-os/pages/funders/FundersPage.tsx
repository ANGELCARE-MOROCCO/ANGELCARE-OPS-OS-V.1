"use client";

import { Building2, CalendarClock, ContactRound, MessageSquareWarning, Network, Route, Sparkles, Target } from "lucide-react";
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
import { useAction } from "../../core/useAction";
import { useActionQuery } from "../../core/useActionQuery";
import { useWorkspace } from "../../core/useWorkspace";
import styles from "./funders.module.css";

type Modal = "create" | "contact" | "event" | "objection" | "narrative" | "followup" | null;

export function FundersPage({ actor }: { actor: CapitalActor }) {
  const workspace = useWorkspace("/api/ac-capital-os/funder-intelligence");
  const action = useAction();
  const [selected, setSelected] = useState<Row | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [create, setCreate] = useState({ name:"", funderType:"Bank", country:"Morocco", region:"Rabat", fundingStageFocus:"Growth", ticketMin:"", ticketMax:"", sourceConfidence:70, angelcareFitScore:70, strategicPriority:"medium", recommendedNarrative:"", nextAction:"Complete funder intelligence dossier", founderLevelApproach:false });
  const [contact, setContact] = useState({ contactName:"", roleTitle:"", email:"", phone:"", preferredLanguage:"FR", communicationStyle:"", relationshipStatus:"Researching", nextContactAt:"" });
  const [event, setEvent] = useState({ eventType:"Research", title:"", summary:"" });
  const [objection, setObjection] = useState({ objectionTitle:"", severity:"Medium", reason:"", bestResponse:"", requiredProof:"", relatedDocument:"", founderReviewRequired:false });
  const [narrative, setNarrative] = useState({ narrativeType:"approach", recommendedAngle:"", openingMessage:"", proofToEmphasize:"", risksToAvoidOverclaiming:"", documentsToAttach:"", idealNextAction:"" });
  const [followup, setFollowup] = useState({ title:"", priority:"medium", dueDate:"", actionType:"relationship", instruction:"" });
  const openAction = useCallback((next: Modal) => setModal(next), []);
  useActionQuery({ create:"create", contact:"contact", narrative:"narrative" }, openAction);

  const funders = rowsFrom(workspace.envelope, "funders");
  const contacts = rowsFrom(workspace.envelope, "contacts");
  const relationshipEvents = rowsFrom(workspace.envelope, "relationshipEvents");
  const psychology = rowsFrom(workspace.envelope, "psychologyBriefs");
  const objections = rowsFrom(workspace.envelope, "objections");
  const narratives = rowsFrom(workspace.envelope, "narratives");
  const followups = rowsFrom(workspace.envelope, "followupActions");
  const selectedId = selected ? String(selected.id) : "";
  const related = useMemo(() => ({
    contacts: contacts.filter((row) => String(row.funder_id) === selectedId),
    events: relationshipEvents.filter((row) => String(row.funder_id) === selectedId),
    psychology: psychology.filter((row) => String(row.funder_id) === selectedId),
    objections: objections.filter((row) => String(row.funder_id) === selectedId),
    narratives: narratives.filter((row) => String(row.funder_id) === selectedId),
    followups: followups.filter((row) => String(row.funder_id) === selectedId),
  }), [contacts, relationshipEvents, psychology, objections, narratives, followups, selectedId]);

  const warm = funders.filter((row) => /warm|hot|active/i.test(text(row, ["relationship_temperature","relationship_status"], ""))).length;
  const founderRoutes = funders.filter((row) => Boolean(row.founder_level_approach)).length;
  const openFollowups = followups.filter((row) => !/done|closed|complete/i.test(text(row, ["status"], ""))).length;

  async function submitCreate() {
    if (!create.name.trim()) return action.validate("Funder name is required.");
    await action.execute(() => postEnvelope("/api/ac-capital-os/funder-intelligence", { action:"create-funder", ...create, ticketMin:create.ticketMin || null, ticketMax:create.ticketMax || null }), "Funder dossier created.");
    await workspace.refresh();
  }
  async function submitSelected(kind: Exclude<Modal,"create"|null>, payload: Record<string, unknown>, message: string) {
    if (!selected) return action.validate("Select a funder dossier first.");
    await action.execute(() => postEnvelope("/api/ac-capital-os/funder-intelligence", { action: kind === "event" ? "relationship-event" : kind === "contact" ? "add-contact" : kind, funderId:selected.id, ...payload }), message);
    await workspace.refresh();
  }

  const insights = [
    { label:"Relationship heat", value:`${warm} warm or active funders` },
    { label:"Founder routes", value:`${founderRoutes} funders marked founder-level` },
    { label:"Follow-up discipline", value:`${openFollowups} open follow-ups` },
    { label:"Truth boundary", value:"Narratives are internal drafts until human/founder approval" },
  ];

  return <AcCapitalShell actor={actor} workspaceKey="funder-intelligence" title="Funder Intelligence Room" subtitle="A private banker-grade dossier environment for mandates, contacts, psychology, objections, relationship temperature and the exact AngelCare narrative to use." envelope={workspace.envelope} insights={insights} primaryAction="Create Funder" onPrimaryAction={() => setModal("create")}>
    {workspace.loading ? <LoadingState label="Loading funder dossiers and relationship intelligence…" /> : workspace.error ? <ErrorState message={workspace.error} onRetry={() => void workspace.refresh()} /> : <>
      <section className={styles.privateRoom}>
        <div className={styles.roomCopy}><span><Building2 size={15}/> Private Banker Intelligence</span><h2>Know what the funder values, fears and expects before AngelCare approaches.</h2><p>The room links institutional mandate, ticket, contacts, relationship events, objection logic, proof expectations and approved narrative strategy.</p><div><PrimaryButton onClick={() => setModal("create")}>Create funder dossier</PrimaryButton><SecondaryButton onClick={() => selected ? setModal("narrative") : action.validate("Select a funder first.")}>Prepare narrative</SecondaryButton></div></div>
        <div className={styles.relationshipRadar}><div className={styles.orbit}><span className={styles.center}>ANGELCARE</span>{["Mandate","Trust","Proof","Timing","Narrative","Decision"].map((item,index)=><span key={item} className={styles[`orb${index+1}`]}>{item}</span>)}</div><TruthChip kind="safe">Internal intelligence only</TruthChip></div>
      </section>

      <section className={styles.metrics}><MetricTile label="Funder dossiers" value={String(funders.length)} detail="Real records returned by the API." tone="blue"/><MetricTile label="Warm relationships" value={String(warm)} detail="Relationship state, not a fabricated probability." tone={warm ? "green":"amber"}/><MetricTile label="Mapped objections" value={String(objections.length)} detail="Evidence-backed response preparation." tone="violet"/><MetricTile label="Open follow-ups" value={String(openFollowups)} detail="Relationship actions awaiting execution." tone={openFollowups ? "amber":"green"}/></section>

      <section className={styles.dossierRoom}><SectionHeading eyebrow="Institutional Dossiers" title="Funder portfolio and relationship temperature" copy="Select a dossier to open the full psychology, objection, contacts and timeline command drawer."/>
        {funders.length ? <div className={styles.funderGrid}>{funders.map((row)=><button key={String(row.id)} className={`${styles.funderCard} ${selected?.id === row.id ? styles.selected : ""}`} onClick={()=>setSelected(row)}><div><StatusBadge value={text(row,["relationship_temperature","relationship_status"],"Researching")}/><span>{number(row,["angelcare_fit_score"],0)}% fit</span></div><strong>{text(row,["name"],"Unnamed funder")}</strong><p>{text(row,["recommended_narrative","next_action"],"Complete the intelligence dossier.")}</p><footer><span><Building2 size={13}/>{text(row,["funder_type"],"Capital")}</span><span><Target size={13}/>{formatDh(row.ticket_min)} – {formatDh(row.ticket_max)}</span><span><Route size={13}/>{text(row,["country","region"],"Unknown")}</span></footer></button>)}</div> : <EmptyState title="No funder dossiers yet" copy="Create the first bank, grant, VC, angel or strategic partner dossier. No institutional metrics are invented for an empty database." action="Create funder" onAction={()=>setModal("create")}/>}
      </section>

      {selected ? <section className={styles.psychologyCommand}>
        <div><SectionHeading eyebrow="Investor Psychology Map" title={text(selected,["name"],"Funder dossier")} copy="Trust triggers, risk triggers, proof expectations, communication style and relationship maturity are handled as separate operational objects."/>
          <div className={styles.psychologyGrid}>
            {[
              ["Trust triggers",text(related.psychology[0]||{},["trust_triggers","recommended_approach"],"Not recorded")],
              ["Risk triggers",text(related.psychology[0]||{},["risk_triggers","risks"],"Not recorded")],
              ["Proof expected",text(related.psychology[0]||{},["proof_expectations","proof_expected"],"Not recorded")],
              ["Tone strategy",text(related.psychology[0]||{},["communication_style","recommended_tone"],"Not recorded")],
              ["Relationship maturity",text(selected,["relationship_temperature","relationship_status"],"Researching")],
              ["Next move",text(selected,["next_action"],"Complete dossier")],
            ].map(([label,value])=><article key={label}><span>{label}</span><strong>{value}</strong></article>)}
          </div>
        </div>
        <aside className={styles.commandRail}><button onClick={()=>setModal("contact")}><ContactRound/><strong>Add contact</strong><small>Map a decision-maker or intermediary.</small></button><button onClick={()=>setModal("event")}><Network/><strong>Log relationship event</strong><small>Create the institutional timeline.</small></button><button onClick={()=>setModal("objection")}><MessageSquareWarning/><strong>Map objection</strong><small>Prepare proof-backed response.</small></button><button onClick={()=>setModal("narrative")}><Sparkles/><strong>Narrative studio</strong><small>Prepare the exact AngelCare angle.</small></button><button onClick={()=>setModal("followup")}><CalendarClock/><strong>Create follow-up</strong><small>Turn intelligence into disciplined action.</small></button></aside>
      </section> : null}
    </>}

    <Drawer open={Boolean(selected)} title={selected ? text(selected,["name"],"Funder") : "Funder"} eyebrow="Private Funder Dossier" onClose={()=>setSelected(null)} footer={<><SecondaryButton onClick={()=>setModal("event")}>Log event</SecondaryButton><PrimaryButton onClick={()=>setModal("followup")}>Create follow-up</PrimaryButton></>}>
      {selected ? <><FactGrid facts={[{label:"Type",value:text(selected,["funder_type"])},{label:"Country / region",value:`${text(selected,["country"])} · ${text(selected,["region"])}`},{label:"Ticket",value:`${formatDh(selected.ticket_min)} – ${formatDh(selected.ticket_max)}`},{label:"Source confidence",value:`${number(selected,["source_confidence"],0)}%`},{label:"AngelCare fit",value:`${number(selected,["angelcare_fit_score"],0)}%`},{label:"Founder-level approach",value:Boolean(selected.founder_level_approach)?"Required":"Not marked"}]}/>
        <div className={styles.drawerBlock}><h3>Contacts</h3>{related.contacts.length?related.contacts.map((row)=><article key={String(row.id)}><ContactRound/><div><strong>{text(row,["contact_name"])}</strong><span>{text(row,["role_title"])} · {text(row,["email","phone"])}</span></div></article>):<p>No contact mapped.</p>}</div>
        <div className={styles.drawerBlock}><h3>Objection map</h3>{related.objections.length?related.objections.map((row)=><article key={String(row.id)}><MessageSquareWarning/><div><strong>{text(row,["objection_title"])}</strong><span>{text(row,["best_response"],"Response draft missing")}</span><small>Proof: {text(row,["required_proof"],"Not recorded")}</small></div></article>):<p>No objections mapped.</p>}</div>
        <div className={styles.drawerBlock}><h3>Relationship timeline</h3><AuditTimeline items={related.events.map((row)=>({title:text(row,["title","event_type"]),meta:text(row,["event_type"])+` · ${shortDate(row.created_at)}`,note:text(row,["summary"],"")}))}/></div>
      </> : null}
    </Drawer>

    <Dialog open={modal==="create"} title="Create Funder Dossier" eyebrow="Institutional Intelligence" wide onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void submitCreate()} disabled={action.state.phase==="submitting"}>Create dossier</PrimaryButton></>}>
      <div className={styles.formGrid}><Field label="Funder name"><input value={create.name} onChange={e=>setCreate({...create,name:e.target.value})}/></Field><Field label="Funder type"><select value={create.funderType} onChange={e=>setCreate({...create,funderType:e.target.value})}><option>Bank</option><option>Grant</option><option>VC</option><option>Angel Investor</option><option>Strategic Partner</option><option>Impact Finance</option></select></Field><Field label="Country"><input value={create.country} onChange={e=>setCreate({...create,country:e.target.value})}/></Field><Field label="Region"><input value={create.region} onChange={e=>setCreate({...create,region:e.target.value})}/></Field><Field label="Ticket min (Dh)"><input type="number" value={create.ticketMin} onChange={e=>setCreate({...create,ticketMin:e.target.value})}/></Field><Field label="Ticket max (Dh)"><input type="number" value={create.ticketMax} onChange={e=>setCreate({...create,ticketMax:e.target.value})}/></Field><Field label="Source confidence"><input type="number" min="0" max="100" value={create.sourceConfidence} onChange={e=>setCreate({...create,sourceConfidence:Number(e.target.value)})}/></Field><Field label="AngelCare fit"><input type="number" min="0" max="100" value={create.angelcareFitScore} onChange={e=>setCreate({...create,angelcareFitScore:Number(e.target.value)})}/></Field><Field label="Recommended narrative"><textarea value={create.recommendedNarrative} onChange={e=>setCreate({...create,recommendedNarrative:e.target.value})}/></Field><Field label="Next action"><textarea value={create.nextAction} onChange={e=>setCreate({...create,nextAction:e.target.value})}/></Field></div><label className={styles.check}><input type="checkbox" checked={create.founderLevelApproach} onChange={e=>setCreate({...create,founderLevelApproach:e.target.checked})}/> Founder-level approach required</label><ActionFeedback phase={action.state.phase} message={action.state.message}/>
    </Dialog>

    <Dialog open={modal==="contact"} title="Add Decision-Maker Contact" eyebrow="Contact Intelligence" onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void submitSelected("contact",contact,"Contact added.")}>Save contact</PrimaryButton></>}><div className={styles.formGrid}><Field label="Contact name"><input value={contact.contactName} onChange={e=>setContact({...contact,contactName:e.target.value})}/></Field><Field label="Role"><input value={contact.roleTitle} onChange={e=>setContact({...contact,roleTitle:e.target.value})}/></Field><Field label="Email"><input type="email" value={contact.email} onChange={e=>setContact({...contact,email:e.target.value})}/></Field><Field label="Phone"><input value={contact.phone} onChange={e=>setContact({...contact,phone:e.target.value})}/></Field><Field label="Communication style"><textarea value={contact.communicationStyle} onChange={e=>setContact({...contact,communicationStyle:e.target.value})}/></Field><Field label="Next contact"><input type="datetime-local" value={contact.nextContactAt} onChange={e=>setContact({...contact,nextContactAt:e.target.value})}/></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="event"} title="Log Relationship Event" eyebrow="Relationship Timeline" onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void submitSelected("event",event,"Relationship event recorded.")}>Log event</PrimaryButton></>}><div className={styles.formGrid}><Field label="Event type"><select value={event.eventType} onChange={e=>setEvent({...event,eventType:e.target.value})}><option>Research</option><option>Call</option><option>Email</option><option>Meeting</option><option>Referral</option><option>Due Diligence</option></select></Field><Field label="Title"><input value={event.title} onChange={e=>setEvent({...event,title:e.target.value})}/></Field><Field label="Summary"><textarea value={event.summary} onChange={e=>setEvent({...event,summary:e.target.value})}/></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="objection"} title="Map Funder Objection" eyebrow="Objection Intelligence" wide onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void submitSelected("objection",objection,"Objection intelligence saved.")}>Save objection</PrimaryButton></>}><div className={styles.formGrid}><Field label="Objection"><input value={objection.objectionTitle} onChange={e=>setObjection({...objection,objectionTitle:e.target.value})}/></Field><Field label="Severity"><select value={objection.severity} onChange={e=>setObjection({...objection,severity:e.target.value})}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></Field><Field label="Reason"><textarea value={objection.reason} onChange={e=>setObjection({...objection,reason:e.target.value})}/></Field><Field label="Best response"><textarea value={objection.bestResponse} onChange={e=>setObjection({...objection,bestResponse:e.target.value})}/></Field><Field label="Required proof"><textarea value={objection.requiredProof} onChange={e=>setObjection({...objection,requiredProof:e.target.value})}/></Field><Field label="Related document"><input value={objection.relatedDocument} onChange={e=>setObjection({...objection,relatedDocument:e.target.value})}/></Field></div><label className={styles.check}><input type="checkbox" checked={objection.founderReviewRequired} onChange={e=>setObjection({...objection,founderReviewRequired:e.target.checked})}/> Founder review required</label><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="narrative"} title="AngelCare Narrative Studio" eyebrow="Positioning Intelligence" wide onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void submitSelected("narrative",{...narrative,proofToEmphasize:narrative.proofToEmphasize.split(",").map(v=>v.trim()).filter(Boolean),risksToAvoidOverclaiming:narrative.risksToAvoidOverclaiming.split(",").map(v=>v.trim()).filter(Boolean),documentsToAttach:narrative.documentsToAttach.split(",").map(v=>v.trim()).filter(Boolean)},"Narrative draft saved.")}>Save narrative draft</PrimaryButton></>}><div className={styles.formGrid}><Field label="Recommended angle"><textarea value={narrative.recommendedAngle} onChange={e=>setNarrative({...narrative,recommendedAngle:e.target.value})}/></Field><Field label="Opening message"><textarea value={narrative.openingMessage} onChange={e=>setNarrative({...narrative,openingMessage:e.target.value})}/></Field><Field label="Proof to emphasize (comma separated)"><textarea value={narrative.proofToEmphasize} onChange={e=>setNarrative({...narrative,proofToEmphasize:e.target.value})}/></Field><Field label="Risks to avoid overclaiming"><textarea value={narrative.risksToAvoidOverclaiming} onChange={e=>setNarrative({...narrative,risksToAvoidOverclaiming:e.target.value})}/></Field><Field label="Documents to attach"><textarea value={narrative.documentsToAttach} onChange={e=>setNarrative({...narrative,documentsToAttach:e.target.value})}/></Field><Field label="Ideal next action"><textarea value={narrative.idealNextAction} onChange={e=>setNarrative({...narrative,idealNextAction:e.target.value})}/></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>

    <Dialog open={modal==="followup"} title="Create Funder Follow-up" eyebrow="Relationship Discipline" onClose={()=>{setModal(null);action.reset()}} footer={<><SecondaryButton onClick={()=>setModal(null)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void submitSelected("followup",followup,"Follow-up created.")}>Create follow-up</PrimaryButton></>}><div className={styles.formGrid}><Field label="Title"><input value={followup.title} onChange={e=>setFollowup({...followup,title:e.target.value})}/></Field><Field label="Priority"><select value={followup.priority} onChange={e=>setFollowup({...followup,priority:e.target.value})}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></Field><Field label="Due date"><input type="date" value={followup.dueDate} onChange={e=>setFollowup({...followup,dueDate:e.target.value})}/></Field><Field label="Instruction"><textarea value={followup.instruction} onChange={e=>setFollowup({...followup,instruction:e.target.value})}/></Field></div><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>
  </AcCapitalShell>;
}
