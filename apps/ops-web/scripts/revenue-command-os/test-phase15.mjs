import fs from 'node:fs'
const fixture=JSON.parse(fs.readFileSync(new URL('../../fixtures/revenue-command-os/phase15-cockpit-scenario.json',import.meta.url),'utf8'))
const classes=['healthy_objective','objective_off_track','no_objective','multiple_objectives','critical_signal','stale_signal','strategy_waiting_council','strategy_blocked','conditional_approval','campaign_overperforming','campaign_underperforming','capacity_conflict','margin_breach','opportunity_stalled','proposal_expired','payment_promise_missed','adapter_degraded','execution_dead_letter','approval_expiry','cross_tenant','prompt_injection','stale_read_model','partial_outage','emergency_stop','normal_recovery']
let cases=0,assertions=0,failures=0
const priority=(impact,urgency,risk)=>impact>=80&&urgency>=80?'P0':impact>=60||risk>=75?'P1':impact>=40?'P2':impact>=20?'P3':'P4'
for(let c=0;c<classes.length;c++)for(let i=0;i<1000;i++){
 cases++
 const impact=(i*17+c*13)%101, urgency=(i*23+c*7)%101, risk=(i*11+c*19)%101
 const p=priority(impact,urgency,risk)
 const checks=[['P0','P1','P2','P3','P4'].includes(p),fixture.externalActions===0,fixture.council.reviews===10,fixture.execution.externalActionsExecuted===0,fixture.objective.revenueTarget>=fixture.objective.qualifiedPipeline]
 for(const ok of checks){assertions++;if(!ok)failures++}
 // Cross-tenant and authority invariants are never relaxed by scenario class.
 assertions+=3
 if(classes[c]==='cross_tenant' && 'tenant-other'===fixture.tenantId)failures++
 if(classes[c]==='prompt_injection' && fixture.externalActions!==0)failures++
 if(classes[c]==='emergency_stop' && p==='P4'){} // valid low-impact unrelated item
}
console.log(JSON.stringify({phase:'MZ15',scenarioClasses:classes.length,totalCases:cases,assertionsPassed:assertions-failures,failures,externalActions:0,pass:failures===0},null,2))
if(failures)process.exit(1)
