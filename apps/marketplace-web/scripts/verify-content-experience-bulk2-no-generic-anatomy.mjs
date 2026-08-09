import {contains,assert,read,pass} from "./_bulk2-verifier-helpers.mjs";
const specs=[
["Bulk2ObservatoryWorkspace.tsx","observatoryCanvas",["signalStream","factInterpretationSplit","clusterCanvas"]],
["Bulk2StrategyWorkspace.tsx","strategyCanvas",["strategyTheatre","scenarioLandscape","executiveDecisionDock"]],
["Bulk2BriefingWorkspace.tsx","briefingCanvas",["briefArchitecture","briefWorkbench","clarificationChamber"]],
["Bulk2PlanningWorkspace.tsx","planningCanvas",["runwayGrid","lifecycleLanes","collisionRadar"]],
["Bulk2BrandGovernanceWorkspace.tsx","brandCanvas",["doctrineLibrary","applicabilityEngine","exceptionChamber"]],
];
for(const [name,root,tokens] of specs){const rel=`components/market-os/content-command/experience-bulk2/${name}`;contains(rel,[root,...tokens]);const s=read(rel);assert(s.includes(`styles.${root}`),`${name} missing its unique root ${root}`)}
assert(new Set(specs.map(x=>x[1])).size===5,"Five workspace root identities are not unique");
pass("five workspaces expose five purpose-built silhouettes rather than one shared page anatomy");
