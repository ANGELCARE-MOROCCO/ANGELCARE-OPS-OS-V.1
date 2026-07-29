"use client";

import { Activity, ArrowDownRight, ArrowUpRight, Banknote, Clock3, Gauge, Landmark, RefreshCcw, Save, Scale, Shield, SlidersHorizontal, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { AcCapitalShell } from "../../core/AcCapitalShell";
import { ErrorState, LoadingState } from "../../core/AsyncState";
import { ActionFeedback, Field } from "../../core/FormParts";
import { MetricTile } from "../../core/MetricTile";
import { Dialog, Drawer } from "../../core/Overlay";
import { FactGrid, PrimaryButton, SecondaryButton, SectionHeading, TruthChip } from "../../core/WorkspaceParts";
import { postEnvelope } from "../../core/api";
import { formatDh, rowsFrom, shortDate, text } from "../../core/data";
import type { CapitalActor, Row } from "../../core/types";
import { useAction } from "../../core/useAction";
import { useWorkspace } from "../../core/useWorkspace";
import styles from "./simulator.module.css";

type Inputs={amount:number;monthlyBurn:number;monthlyRevenue:number;revenueGrowth:number;delayMonths:number;interestRate:number;repaymentMonths:number;bfrPercent:number;treasuryReserve:number;dilutionPercent:number;grantShare:number};
const baseline:Inputs={amount:1500000,monthlyBurn:110000,monthlyRevenue:180000,revenueGrowth:4,delayMonths:3,interestRate:2,repaymentMonths:60,bfrPercent:30,treasuryReserve:300000,dilutionPercent:0,grantShare:15};

export function SimulatorPage({actor}:{actor:CapitalActor}){
 const workspace=useWorkspace("/api/ac-capital-os/strategy-production-command");const action=useAction();const [input,setInput]=useState<Inputs>(baseline);const [saveOpen,setSaveOpen]=useState(false);const [selectedSnapshot,setSelectedSnapshot]=useState<Row|null>(null);const [snapshotName,setSnapshotName]=useState("Capital simulation snapshot");
 const scenarios=rowsFrom(workspace.envelope,"scenarios");
 const result=useMemo(()=>{
   const monthlyRate=input.interestRate/100/12;
   const principal=Math.max(0,input.amount*(1-input.grantShare/100));
   const payment=input.repaymentMonths>0?(monthlyRate>0?(principal*monthlyRate*Math.pow(1+monthlyRate,input.repaymentMonths))/(Math.pow(1+monthlyRate,input.repaymentMonths)-1):principal/input.repaymentMonths):0;
   const bfr=input.amount*input.bfrPercent/100;
   const deployment=input.amount-bfr-input.treasuryReserve;
   const netMonthly=input.monthlyRevenue-input.monthlyBurn-payment;
   const runway=input.monthlyBurn>0?(input.treasuryReserve+bfr)/Math.max(1,input.monthlyBurn-input.monthlyRevenue):99;
   const delayedRevenue=input.monthlyRevenue*Math.pow(1+input.revenueGrowth/100,Math.max(0,input.delayMonths));
   const control=Math.max(0,100-input.dilutionPercent*1.8-Math.max(0,payment/input.monthlyRevenue*20));
   const risk=Math.min(100,Math.max(0,(input.delayMonths*8)+(payment>input.monthlyRevenue*.35?25:0)+(input.treasuryReserve<input.monthlyBurn*2?20:0)+(input.dilutionPercent>15?15:0)));
   return {payment,bfr,deployment,netMonthly,runway,delayedRevenue,control,risk};
 },[input]);
 async function saveSnapshot(){
   await action.execute(()=>postEnvelope("/api/ac-capital-os/strategy-production-command",{action:"create-scenario",scenarioName:snapshotName,strategyType:input.dilutionPercent>0?"Blended / Investor Simulation":"Bank / Blended Simulation",focus:["Simulator snapshot","BFR","Treasury","Repayment","Founder control"],speed:`${input.delayMonths} month delay`,credibility:"Simulation",proofReadiness:"Requires Finance Review",founderControlScore:Math.round(result.control),riskLevel:result.risk>65?"High":result.risk>35?"Medium":"Low",recommendedPriority:"Review with finance/founder",requestedAmount:input.amount,monthlyOperatingRunway:Math.round(result.runway),bfrAllocationPercent:input.bfrPercent,treasuryReserve:input.treasuryReserve,bankInterestLogic:`${input.interestRate}% annual input`,repaymentStartLogic:`After ${input.delayMonths} months`,grantAmount:input.amount*input.grantShare/100,vcTicketSize:input.dilutionPercent>0?input.amount:0,dilutionSensitivity:`${input.dilutionPercent}%`,revenueRampScenario:`${input.revenueGrowth}% monthly input`,costControlLevel:"User-controlled simulation"}),"Simulation snapshot saved as a real strategy scenario.");
   await workspace.refresh();
 }
 const update=(key:keyof Inputs,value:number)=>setInput(current=>({...current,[key]:value}));
 const insights=[{label:"Interactive model",value:"Every input recalculates outputs immediately"},{label:"Persistence",value:"Save snapshot creates a real strategy scenario record"},{label:"Financial truth",value:"This is decision support, not accountant/bank certification"},{label:"Existing scenarios",value:`${scenarios.length} saved scenario records`}];
 return <AcCapitalShell actor={actor} workspaceKey="capital-simulator" title="Capital Scenario Simulator" subtitle="A parameter-driven founder simulator for amount, BFR, treasury reserve, repayment, revenue delay, grant share and dilution — distinct from the strategy portfolio." envelope={workspace.envelope} insights={insights} primaryAction="Save Snapshot" onPrimaryAction={()=>setSaveOpen(true)}>
  {workspace.loading?<LoadingState label="Loading saved scenario context…"/>:workspace.error?<ErrorState message={workspace.error} onRetry={()=>void workspace.refresh()}/>:<>
   <section className={styles.simHero}><div><span><SlidersHorizontal size={15}/> Interactive Capital Model</span><h2>Change assumptions and see pressure, control and runway move immediately.</h2><p>The simulator calculates transparent decision-support outputs in the browser, then saves an approved snapshot through the real strategy API.</p><div><PrimaryButton onClick={()=>setSaveOpen(true)}>Save snapshot</PrimaryButton><SecondaryButton onClick={()=>setInput(baseline)}>Reset baseline</SecondaryButton></div></div><div className={styles.riskDial} style={{"--risk":`${result.risk*3.6}deg`} as React.CSSProperties}><div><strong>{Math.round(result.risk)}</strong><span>Risk pressure</span></div></div></section>
   <section className={styles.metrics}><MetricTile label="Monthly payment" value={formatDh(result.payment)} detail="Amortized payment based on entered rate/term." tone={result.payment<input.monthlyRevenue*.3?"green":"amber"}/><MetricTile label="BFR allocation" value={formatDh(result.bfr)} detail={`${input.bfrPercent}% of funding amount.`} tone="blue"/><MetricTile label="Founder control" value={`${Math.round(result.control)}%`} detail="Directional index from dilution and repayment pressure." tone={result.control>75?"green":"amber"}/><MetricTile label="Estimated runway" value={result.runway>=99?"Positive cash dynamics":`${result.runway.toFixed(1)} months`} detail="Directional reserve/BFR runway." tone={result.runway>6?"green":"red"}/></section>

   <section className={styles.simulatorDeck}><div className={styles.controls}><SectionHeading eyebrow="Assumption Controls" title="Funding, operations and risk parameters"/>
    {[
      ["Funding amount","amount",250000,5000000,50000,"Dh"],
      ["Monthly operating cost","monthlyBurn",10000,500000,5000,"Dh"],
      ["Monthly revenue","monthlyRevenue",0,1000000,5000,"Dh"],
      ["Revenue growth","revenueGrowth",-10,25,1,"% / month"],
      ["Approval delay","delayMonths",0,24,1,"months"],
      ["Interest rate","interestRate",0,15,.25,"% / year"],
      ["Repayment term","repaymentMonths",12,120,6,"months"],
      ["BFR allocation","bfrPercent",0,60,1,"%"],
      ["Treasury reserve","treasuryReserve",0,1500000,25000,"Dh"],
      ["Investor dilution","dilutionPercent",0,40,1,"%"],
      ["Grant share","grantShare",0,70,1,"%"],
    ].map(([label,key,min,max,step,suffix])=><label key={String(key)} className={styles.control}><div><span>{String(label)}</span><strong>{suffix==="Dh"?formatDh(input[key as keyof Inputs]):`${input[key as keyof Inputs]} ${suffix}`}</strong></div><input type="range" min={Number(min)} max={Number(max)} step={Number(step)} value={input[key as keyof Inputs]} onChange={e=>update(key as keyof Inputs,Number(e.target.value))}/></label>)}
   </div><div className={styles.outputCockpit}><SectionHeading eyebrow="Calculated Output" title="Before / after capital pressure"/><div className={styles.outputGrid}><article><WalletCards/><span>Deployable after BFR/reserve</span><strong>{formatDh(result.deployment)}</strong></article><article><Landmark/><span>Debt principal after grant share</span><strong>{formatDh(input.amount*(1-input.grantShare/100))}</strong></article><article className={result.netMonthly>=0?styles.positive:styles.negative}>{result.netMonthly>=0?<ArrowUpRight/>:<ArrowDownRight/>}<span>Monthly cash after payment</span><strong>{formatDh(result.netMonthly)}</strong></article><article><Activity/><span>Revenue after delay-growth input</span><strong>{formatDh(result.delayedRevenue)}</strong></article></div><div className={styles.pressureMap}><div><span>Repayment pressure</span><i><b style={{width:`${Math.min(100,result.payment/Math.max(1,input.monthlyRevenue)*100)}%`}}/></i></div><div><span>Treasury resilience</span><i><b style={{width:`${Math.min(100,input.treasuryReserve/Math.max(1,input.monthlyBurn*6)*100)}%`}}/></i></div><div><span>Founder control</span><i><b style={{width:`${result.control}%`}}/></i></div><div><span>Risk exposure</span><i className={styles.riskBar}><b style={{width:`${result.risk}%`}}/></i></div></div><TruthChip kind="safe">Calculated outputs are directional and require finance/accounting validation.</TruthChip></div></section>

   <section className={styles.snapshotStrip}><div><Gauge/><strong>{scenarios.length}</strong><span>Saved strategy scenarios available for comparison.</span></div><div><Clock3/><strong>{input.delayMonths} months</strong><span>Current approval-delay assumption.</span></div><div><Scale/><strong>{input.dilutionPercent}%</strong><span>Current dilution input.</span></div><div><Shield/><strong>{formatDh(input.treasuryReserve)}</strong><span>Protected treasury reserve input.</span></div></section>
   <section className={styles.savedScenarios}><SectionHeading eyebrow="Saved Snapshots" title="Open persisted simulator scenarios" copy="Each card is a real strategy scenario returned by the API and opens a specialized assumption snapshot drawer."/><div>{scenarios.slice(0,8).map(row=><button key={String(row.id)} onClick={()=>setSelectedSnapshot(row)}><Gauge/><strong>{text(row,["scenario_name"],"Simulation snapshot")}</strong><span>{text(row,["strategy_type"],"Scenario")} · {shortDate(row.created_at)}</span></button>)}{!scenarios.length?<p>No saved simulator scenarios returned.</p>:null}</div></section>
  </>}
  <Drawer open={Boolean(selectedSnapshot)} title={selectedSnapshot?text(selectedSnapshot,["scenario_name"],"Simulation snapshot"):"Simulation snapshot"} eyebrow="Saved Simulator Snapshot Drawer" onClose={()=>setSelectedSnapshot(null)} footer={<SecondaryButton onClick={()=>setSelectedSnapshot(null)}>Close</SecondaryButton>}>{selectedSnapshot?<><FactGrid facts={[{label:"Strategy",value:text(selectedSnapshot,["strategy_type"])},{label:"Amount",value:formatDh(Number(selectedSnapshot.requested_amount||0))},{label:"Founder control",value:`${Number(selectedSnapshot.founder_control_score||0)}%`},{label:"Risk",value:text(selectedSnapshot,["risk_level"],"Not reported")},{label:"Runway",value:`${Number(selectedSnapshot.monthly_operating_runway||0)} months`},{label:"Created",value:shortDate(selectedSnapshot.created_at)}]}/><p className={styles.saveNote}>This is a persisted scenario snapshot, not a funding approval or certified financial forecast.</p></>:null}</Drawer>
    <Dialog open={saveOpen} title="Save Simulation Snapshot" eyebrow="Persist to Strategy War Room" onClose={()=>{setSaveOpen(false);action.reset()}} footer={<><SecondaryButton onClick={()=>setSaveOpen(false)}>Cancel</SecondaryButton><PrimaryButton onClick={()=>void saveSnapshot()}>Save real scenario</PrimaryButton></>}><Field label="Snapshot name"><input value={snapshotName} onChange={e=>setSnapshotName(e.target.value)}/></Field><p className={styles.saveNote}>This creates a real strategy scenario using the current inputs. It does not approve a funding decision or replace accountant review.</p><ActionFeedback phase={action.state.phase} message={action.state.message}/></Dialog>
 </AcCapitalShell>
}
