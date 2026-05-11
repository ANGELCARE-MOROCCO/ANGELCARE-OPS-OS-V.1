import { ServiceOSButton, ServiceOSCard, ServiceOSGrid, ServiceOSPanel, ServiceOSPill } from './ServiceOSPrimitives'
export const serviceOSSections = [
 {title:'Blueprint Studio',href:'/services/blueprints',tone:'blue',desc:'Service architecture, modules, rules, versions and readiness.'},
 {title:'Configuration Engine',href:'/services/configuration',tone:'purple',desc:'Attachable service modules for future services.'},
 {title:'Rules Engine',href:'/services/rules',tone:'amber',desc:'Operational triggers, pricing modifiers, certifications and escalation.'},
 {title:'Operations Center',href:'/services/operations',tone:'green',desc:'Mission pipeline, SLA, staff matching and live status.'},
 {title:'Commercial Engine',href:'/services/commercial',tone:'green',desc:'Dynamic pricing, packages, margin and subscriptions.'},
 {title:'Expansion Center',href:'/services/expansion',tone:'purple',desc:'Multi-city capacity, staffing, risk and deployment.'},
 {title:'AI Strategy',href:'/services/ai-strategy',tone:'blue',desc:'Market signals, service recommendations and matching.'},
]
export function ServiceOSEnterpriseHub(){return <ServiceOSPanel title="Enterprise ServiceOS Hub" subtitle="Central access layer for the upgraded AngelCare Services Management module."><ServiceOSGrid>{serviceOSSections.map((s:any)=><ServiceOSCard key={s.href} title={s.title} subtitle={s.desc}><div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}><ServiceOSPill tone={s.tone}>enterprise</ServiceOSPill><ServiceOSButton href={s.href} light>Open</ServiceOSButton></div></ServiceOSCard>)}</ServiceOSGrid></ServiceOSPanel>}
