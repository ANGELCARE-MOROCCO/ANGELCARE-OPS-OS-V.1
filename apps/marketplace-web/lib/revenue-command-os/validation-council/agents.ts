import type { CouncilAgentDefinition, CouncilAgentCode } from './types'

const agent=(code:CouncilAgentCode,displayName:string,purpose:string,controls:string[],order:number,blockingDomains:string[],independent=true):CouncilAgentDefinition=>({code,displayName,purpose,controls,order,blockingDomains,independent,promptCode:`council-${code}`,promptVersion:'11.0.0'})

export const COUNCIL_AGENTS:CouncilAgentDefinition[]=[
  agent('chief_revenue_intelligence','Chief Revenue Intelligence Agent','Vérifier l’alignement objectif-stratégie, la cohérence d’ensemble et la qualité de synthèse.',['objective_alignment','strategic_coherence','command_trace','outcome_logic'],10,['objective','coherence']),
  agent('market_intelligence','Market Intelligence Strategist','Tester la réalité du marché, la demande, le timing, les segments, territoires et concurrents.',['market_evidence','segment_fit','territory_fit','timing','competitive_response'],20,['market','opportunity']),
  agent('offer_monetization','Offer and Monetization Architect','Valider offre, bundle, valeur, prix, monétisation et compatibilité Digital Twin.',['offer_exists','value_architecture','pricing_source','bundle_logic','monetization'],30,['offer','pricing']),
  agent('sales_conversion','Sales Conversion Strategist','Tester décisionnaires, qualification, séquences, rendez-vous, proposition, objections et closing.',['buyer_authority','qualification','channel_sequence','meeting_path','proposal_path','closing'],40,['conversion','authority']),
  agent('capacity_delivery','Capacity and Delivery Validator','Confirmer capacité, ressources, territoires, délais et faisabilité de livraison.',['capacity_freshness','resource_availability','delivery_constraints','territory_capacity','deadline_feasibility'],50,['capacity','delivery']),
  agent('revenue_risk_margin','Revenue Risk and Margin Validator','Tester marge, coûts, concessions, paiement, downside et protection du revenu.',['margin_floor','cost_assumptions','discount_authority','payment_risk','downside_economics'],60,['margin','risk']),
  agent('brand_authority','Brand and Authority Validator','Contrôler claims, marque, niveau d’autorité, engagements et garde-fous.',['brand_claims','actor_authority','approval_class','prohibited_commitments','trust_posture'],70,['brand','authority']),
  agent('commercial_red_team','Commercial Red-Team Critic','Attaquer activement la stratégie par scénarios adverses et contradictions cachées.',['competitor_attack','conversion_shock','capacity_shock','payment_delay','evidence_challenge','season_expiry'],80,['risk','resilience']),
  agent('executive_optimizer','Executive Strategy Optimizer','Transformer les constats en corrections traçables et version optimisée.',['correction_quality','tradeoff_improvement','risk_reduction','score_uplift','remaining_limits'],90,['optimization'],false),
  agent('independent_auditor','Independent Auditor','Vérifier l’indépendance, la complétude, les traces, les scores et le respect du contrat.',['agent_completeness','evidence_trace','model_trace','disagreement_trace','external_action_lock'],100,['audit'],false),
]

export const councilAgentByCode=(code:CouncilAgentCode)=>{const found=COUNCIL_AGENTS.find(x=>x.code===code);if(!found)throw new Error(`UNKNOWN_COUNCIL_AGENT:${code}`);return found}
export const independentReviewAgents=()=>COUNCIL_AGENTS.filter(x=>x.independent&&x.code!=='commercial_red_team')
export const redTeamAgent=()=>councilAgentByCode('commercial_red_team')
export const optimizerAgent=()=>councilAgentByCode('executive_optimizer')
export const auditorAgent=()=>councilAgentByCode('independent_auditor')
