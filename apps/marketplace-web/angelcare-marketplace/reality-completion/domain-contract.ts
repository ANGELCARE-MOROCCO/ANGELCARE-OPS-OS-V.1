import type {MarketplacePermission} from '../domain/types'
import type {RealityDomain} from './types'

export interface RealityDomainContract {
  domain: RealityDomain
  label: string
  table: string
  managePermission: MarketplacePermission
  lifecycle: string[]
  sourceTitle: string
  createLabel: string
}

export const REALITY_DOMAIN_CONTRACTS: Record<RealityDomain, RealityDomainContract> = {
  growth: {
    domain:'growth', label:'Growth Execution', table:'angelcare_marketplace_growth_execution_cases',
    managePermission:'marketplace.growth.experiments.manage',
    lifecycle:['hypothesis','plan','approval','activation','monitoring','analysis','decision','scale','stop','closed'],
    sourceTitle:'Opportunities / experiments sources', createLabel:'Créer initiative Growth',
  },
  qa: {
    domain:'qa', label:'QA Defect Execution', table:'angelcare_marketplace_qa_defect_cases',
    managePermission:'marketplace.qa.defects.manage',
    lifecycle:['detected','reproduced','triaged','owned','corrective_action','retest','verified','closed'],
    sourceTitle:'Defects / QA checks sources', createLabel:'Créer défaut QA',
  },
  intelligence: {
    domain:'intelligence', label:'Intelligence Decision', table:'angelcare_marketplace_intelligence_signal_cases',
    managePermission:'marketplace.intelligence.metrics.manage',
    lifecycle:['captured','validated','classified','analysis','recommendation','decision','action','outcome','closed'],
    sourceTitle:'Observations / signals sources', createLabel:'Créer signal Intelligence',
  },
  platform_performance: {
    domain:'platform_performance', label:'Platform Reliability', table:'angelcare_marketplace_performance_incident_cases',
    managePermission:'marketplace.security.manage',
    lifecycle:['detected','confirmed','owned','mitigation','recovery','verification','postmortem','closed'],
    sourceTitle:'Performance observations', createLabel:'Créer incident performance',
  },
  security: {
    domain:'security', label:'Security Incident Authority', table:'angelcare_marketplace_security_incident_cases_v2',
    managePermission:'marketplace.security.manage',
    lifecycle:['detected','triaged','containment','investigation','remediation','recovery','postmortem','closed'],
    sourceTitle:'Security controls / events', createLabel:'Créer dossier sécurité',
  },
  trust: {
    domain:'trust', label:'Trust Investigation', table:'angelcare_marketplace_trust_investigation_cases',
    managePermission:'marketplace.trust.manage',
    lifecycle:['open','triage','owned','investigation','decision','remediation','customer_resolution','verified','closed'],
    sourceTitle:'Complaints / quality sources', createLabel:'Créer investigation Trust',
  },
  launch: {
    domain:'launch', label:'Release Execution', table:'angelcare_marketplace_release_execution_cases',
    managePermission:'marketplace.launch.approve',
    lifecycle:['draft','preparation','technical_ready','business_ready','approved','scheduled','deployed','verifying','accepted','blocked','rolled_back','recovery','closed'],
    sourceTitle:'Release / launch sources', createLabel:'Créer dossier Release',
  },
}

export const isRealityDomain=(value:string):value is RealityDomain=>value in REALITY_DOMAIN_CONTRACTS

const REALITY_ALLOWED_TRANSITIONS: Record<RealityDomain,Record<string,string[]>>={
  growth:{hypothesis:['plan','stop'],plan:['approval','stop'],approval:['activation','stop'],activation:['monitoring','stop'],monitoring:['analysis','stop'],analysis:['decision','stop'],decision:['scale','stop'],scale:['closed'],stop:['closed'],closed:[]},
  qa:{detected:['reproduced'],reproduced:['triaged'],triaged:['owned'],owned:['corrective_action'],corrective_action:['retest'],retest:['verified'],verified:['closed'],closed:[]},
  intelligence:{captured:['validated'],validated:['classified'],classified:['analysis'],analysis:['recommendation'],recommendation:['decision'],decision:['action'],action:['outcome'],outcome:['closed'],closed:[]},
  platform_performance:{detected:['confirmed'],confirmed:['owned'],owned:['mitigation'],mitigation:['recovery'],recovery:['verification'],verification:['postmortem'],postmortem:['closed'],closed:[]},
  security:{detected:['triaged'],triaged:['containment'],containment:['investigation'],investigation:['remediation'],remediation:['recovery'],recovery:['postmortem'],postmortem:['closed'],closed:[]},
  trust:{open:['triage'],triage:['owned'],owned:['investigation'],investigation:['decision'],decision:['remediation'],remediation:['customer_resolution'],customer_resolution:['verified'],verified:['closed'],closed:[]},
  launch:{draft:['preparation','blocked'],preparation:['technical_ready','blocked'],technical_ready:['business_ready','blocked'],business_ready:['approved','blocked'],approved:['scheduled','blocked'],scheduled:['deployed','blocked'],deployed:['verifying','rolled_back','recovery','blocked'],verifying:['accepted','rolled_back','recovery','blocked'],accepted:['closed'],blocked:['recovery','rolled_back'],rolled_back:['recovery','closed'],recovery:['preparation','rolled_back'],closed:[]},
}

export function assertRealityTransition(domain:RealityDomain,current:string,next:string){
  if(current===next)return
  const allowed=REALITY_ALLOWED_TRANSITIONS[domain][current]||[]
  if(!allowed.includes(next))throw new Error(`Transition ${current} → ${next} non autorisée pour ${domain}.`)
}
