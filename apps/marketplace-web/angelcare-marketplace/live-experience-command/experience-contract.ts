import type { LiveCampaign, LiveSourceSnapshot } from './types'
export type RecordValue = Record<string, unknown>
export const object = (v: unknown): RecordValue => v && typeof v === 'object' && !Array.isArray(v) ? v as RecordValue : {}
export const strings = (v: unknown) => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
export const textValue = (v: unknown) => typeof v === 'string' ? v : ''
export const numberValue = (v: unknown) => v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null
export const SUPPORTED_TRIGGERS = ['page_load','route_entry','schedule','delay','inactivity','scroll_depth','exit_intent','click','basket_update','checkout_interrupted','wallet_insufficient','wallet_eligible','wallet_member','service_configured','category_interest','service_interest','repeat_visit','cohort_interest','admission_interest','b2b_interest','plan_interest','assessment_interest','event_interest','out_of_stock','capacity_full','journey_problem','journey_completed','basket_abandonment','truth_available'] as const
export function safeDestination(href: unknown): string | null {
 const value=textValue(href).trim()
 if (/^\/angelcare-marketplace(?:\/|$)/.test(value) && !/[\\\u0000-\u001f]/.test(value) && !value.includes('://')) return value
 return null
}
export function evaluateTargeting(c: LiveCampaign, ctx: RecordValue, audiences: RecordValue[] = []) {
 const reasons: string[]=[];const t=c.targeting
 const checks: Array<[string,unknown,unknown]> = [['routes',t.routes,ctx.pathname],['devices',t.devices,ctx.device],['locales',t.locales,ctx.locale],['territories',t.territories,ctx.territoryId],['audiences',t.audiences,ctx.audience],['schemas',t.schemas,ctx.schemaKey],['categories',t.categories,ctx.categoryKey],['items',t.items,ctx.itemId],['kinds',t.kinds,ctx.kind],['journey_stages',t.journey_stages,ctx.journeyStage]]
 for(const [key,expected,actual] of checks){const values=strings(expected);if(values.length&&!values.some(v=>key==='routes' ? textValue(actual)===v||textValue(actual).startsWith(v.replace(/\/$/,'')+'/') : key==='devices'&&v==='mobile'?['mobile','small-mobile'].includes(textValue(actual)):v===actual))reasons.push(key)}
 if(strings(t.customer_kinds).length&&!strings(t.customer_kinds).includes(textValue(ctx.audience)))reasons.push('customer_kind')
 if(t.premium_only===true&&!ctx.walletMember)reasons.push('premium')
 if(strings(t.cities).length)reasons.push('legacy_city_rule_requires_territory_mapping')
 if(t.wallet_member===true&&!ctx.walletMember)reasons.push('wallet_member')
 if(t.authenticated===true&&!ctx.authenticated)reasons.push('authenticated')
 if(t.wallet_tier&&t.wallet_tier!==ctx.walletTier)reasons.push('wallet_tier')
 for(const key of strings(t.audience_keys)){const a=audiences.find(x=>x.audience_key===key&&x.status==='active');if(!a){reasons.push('audience_unavailable');continue}const nested=evaluateTargeting({...c,targeting:{...object(a.definition),audience_keys:[]}},ctx);if(!nested.eligible)reasons.push('audience:'+key)}
 return {eligible:reasons.length===0,reasons}
}
export function windowOpen(start: unknown,end: unknown, now=Date.now()) {
 const a=start?Date.parse(String(start)):null,b=end?Date.parse(String(end)):null
 if(a!==null&&!Number.isFinite(a)||b!==null&&!Number.isFinite(b))return false
 return (a===null||a<=now)&&(b===null||b>now)
}
export function recurrenceOpen(schedule: RecordValue, now=Date.now()) {
 if(!windowOpen(schedule.starts_at,schedule.ends_at,now))return false
 const r=object(schedule.recurrence);if(!Object.keys(r).length)return true
 const type=String(r.type||r.frequency||'once');if(type==='once')return true
 if(!['daily','weekly'].includes(type))return false
 try{const parts=new Intl.DateTimeFormat('en-GB',{timeZone:textValue(schedule.timezone)||'Africa/Casablanca',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);const get=(type:string)=>parts.find(p=>p.type===type)?.value||'';const days=strings(r.days);if(type==='weekly'&&(!days.length||!days.includes(get('weekday'))))return false;const time=get('hour')+':'+get('minute');const a=textValue(r.start_time),b=textValue(r.end_time);if(!/^\d{2}:\d{2}$/.test(a)||!/^\d{2}:\d{2}$/.test(b)||a===b)return false;return a<b?time>=a&&time<b:time>=a||time<b}catch{return false}
}
export function publicProof(s: LiveSourceSnapshot, now=Date.now()) {
 if(!s.verified||s.status!=='active'||!s.expires_at||!windowOpen(null,s.expires_at,now))return null
 const allow:Record<string,string[]>={catalog_item:['item_key','slug','kind','name_fr','name_en','name_ar','price_mode','price_amount','currency_label','availability_status'],catalog_availability:['available'],academy_cohort:['public_reference','name','starts_at','ends_at','remaining_seats'],wallet_policy:['policy_key','name_fr','name_en','name_ar'],trust_badge:['badge_key','status','issued_at','valid_until','verification_reference']}
 const keys=allow[s.authority];if(!keys)return null
 if(s.payload.status&&!(['catalog_item'].includes(s.authority)?['published']:s.authority==='academy_cohort'?['enrollment_open','active','open']:['active','issued','valid','expiring']).includes(String(s.payload.status)))return null
 if(s.authority==='trust_badge'&&(s.payload.revoked_at||(s.payload.valid_until||s.payload.expires_at)&&!windowOpen(null,s.payload.valid_until||s.payload.expires_at,now)))return null
 return Object.fromEntries(keys.filter(k=>s.payload[k]!==undefined&&typeof s.payload[k]!=='object').map(k=>[k,s.payload[k]]))
}
export type FrequencyState={events:number[];sessionViews:number;sessionId:string;dismissedUntil?:number;converted?:boolean;revision:number}
export function frequencyEligible(policy:RecordValue,state:FrequencyState,sessionId:string,revision:number,now=Date.now()){
 if(state.revision!==revision)return true
 if(state.converted&&policy.suppress_after_conversion!==false)return false
 if((state.dismissedUntil||0)>now)return false
 const events=state.events.filter(t=>Number.isFinite(t)&&t<=now)
 const limit=(key:string,fallback:number)=>Math.max(1,numberValue(policy[key])??fallback)
 if(state.sessionId===sessionId&&state.sessionViews>=limit('per_session',2))return false
 if(events.filter(t=>now-t<86400000).length>=limit('per_day',4))return false
 if(events.filter(t=>now-t<604800000).length>=limit('per_week',8))return false
 const last=events.at(-1);return !last||now-last>=Math.max(0,numberValue(policy.cooldown_hours)??0)*3600000
}
export function publicationProblems(c:LiveCampaign){const issues:string[]=[]
 for(const locale of ['fr','en','ar']){const copy=object(c.localized_content[locale]);if(!textValue(copy.title)||!textValue(copy.message))issues.push('content:'+locale);if(!safeDestination(copy.cta_href))issues.push('action:'+locale)}
 if(!SUPPORTED_TRIGGERS.includes(String(c.trigger.type) as typeof SUPPORTED_TRIGGERS[number]))issues.push('trigger')
 if(c.starts_at&&!Number.isFinite(Date.parse(c.starts_at))||c.ends_at&&!Number.isFinite(Date.parse(c.ends_at))||c.starts_at&&c.ends_at&&Date.parse(c.ends_at)<=Date.parse(c.starts_at))issues.push('schedule')
 if(c.kind==='proof'&&!textValue(c.truth_source.source_key))issues.push('proof_source')
 if(c.kind==='proof'&&!['flash_sale_proof','academy_remaining_seats','booking_availability','trust_quality_evidence','wallet_saving_proof','customer_specific_privilege'].includes(c.purpose_key))issues.push('proof_adapter_unavailable')
 if(['wallet_saving_proof','customer_specific_privilege'].includes(c.purpose_key)&&(!textValue(c.conversion.item_id)||c.targeting.authenticated!==true||c.targeting.wallet_member!==true))issues.push('personal_wallet_context');
 if(c.kind==='proof'&&['flash_sale_proof','booking_availability'].includes(c.purpose_key)&&!textValue(c.conversion.item_id))issues.push('proof_native_offer');
 if(/product_cross_sell|service_addon|flashcards_recommendation|montessori_recommendation|home_childcare_acceleration|recurring_care_conversion|academy_enrollment_urgency|flash_sale/.test(c.purpose_key)&&!textValue(c.conversion.item_id))issues.push('native_offer')
 if(/flash_sale/.test(c.purpose_key)&&!textValue(c.conversion.promotion_id))issues.push('promotion')
 if(!['detail','configure','link'].includes(textValue(c.conversion.action)))issues.push('native_action');if(['out_of_stock','capacity_full'].includes(textValue(c.trigger.type)))issues.push('trigger_authority_unavailable');if((numberValue(c.frequency.per_session)??0)<=0)issues.push('frequency')
 return issues
}
export const NATIVE_SCHEMA_WORLDS:Record<string,'service'|'product'|'academy'|'business'>={
'home-childcare-one-time':'service','home-childcare-recurring':'service','school-pickup-care':'service','overnight-extended-care':'service','emergency-last-minute-care':'service','hotel-travel-childcare':'service','events-group-childcare':'service','holiday-excursion-programme':'service','montessori-home-service':'service','learning-homework-support':'service','non-medical-support-service':'service','flashcards-learning-product':'product','montessori-development-kit':'product','development-game':'product','activity-subscription-box':'product','digital-learning-resource':'product','preschool-admission':'academy','academy-course':'academy','academy-cohort':'academy','certification-pathway':'academy','parent-workshop':'academy','institutional-training':'business','school-managed-programme':'business','school-staff-reinforcement':'business','hospitality-kids-programme':'business','corporate-childcare-benefit':'business','health-adjacent-programme':'business','event-venue-programme':'business','partner-os-plan':'business','quality-check-assessment':'business','custom-managed-solution':'business'}
export function compatiblePurpose(purpose:string,schema:string|null){
 if(!schema)return true
 const exact:Record<string,string[]>= {home_childcare_acceleration:['home-childcare-one-time'],recurring_care_conversion:['home-childcare-recurring'],flashcards_recommendation:['flashcards-learning-product'],montessori_recommendation:['montessori-home-service','montessori-development-kit'],preschool_admissions:['preschool-admission'],partner_os_conversion:['partner-os-plan'],quality_check_diagnostic:['quality-check-assessment']}
 if(exact[purpose])return Boolean(schema&&exact[purpose].includes(schema))
 if(purpose==='academy_enrollment_urgency')return Boolean(schema&&NATIVE_SCHEMA_WORLDS[schema]==='academy')
 if(purpose==='b2b_consultation')return Boolean(schema&&NATIVE_SCHEMA_WORLDS[schema]==='business')
 return true
}
export function proofSupports(purpose:string,source:LiveSourceSnapshot){
 const authorities:Record<string,string[]>={flash_sale_proof:['catalog_item'],academy_remaining_seats:['academy_cohort'],booking_availability:['catalog_availability'],wallet_saving_proof:['wallet_policy'],wallet_topup_bonus_proof:['wallet_policy'],trust_quality_evidence:['trust_badge'],customer_specific_privilege:['wallet_policy']}
 return Boolean(authorities[purpose]?.includes(source.authority))
}

export function requiredCapabilities(c:LiveCampaign){
 const keys=new Set<string>([`${c.kind}.versions`,`${c.kind}.localization`]);const slot=textValue(c.placement.slot)
 if(c.kind==='popup'){keys.add('popup.frequency_caps');keys.add('popup.session_suppression');keys.add('popup.conversion_suppression');const placements:Record<string,string>={modal:'centered_modal',centered_modal:'centered_modal',side_drawer:'side_drawer',bottom_sheet:'bottom_sheet',floating_card:'floating_card',floating_side:'corner_notification'};keys.add('popup.'+(placements[slot]||'inline_context'));const triggers:Record<string,string>={delay:'time_delay',click:'click_trigger',inactivity:'inactivity',exit_intent:'exit_intent',scroll_depth:'scroll_depth',route_entry:'route_entry',basket_abandonment:'basket_abandonment'};if(triggers[textValue(c.trigger.type)])keys.add('popup.'+triggers[textValue(c.trigger.type)])}
 if(c.kind==='broadcast'){keys.add('broadcast.server_targeting');keys.add('broadcast.live_refresh');keys.add('broadcast.cta');if(c.starts_at||c.ends_at)keys.add('broadcast.scheduling')}
 if(c.kind==='proof'){keys.add('proof.server_validation');keys.add('proof.stale_suppression');const proof:Record<string,string>={flash_sale_proof:'campaign_countdown',academy_remaining_seats:'academy_seats',booking_availability:'server_validation',wallet_saving_proof:'wallet_saving',customer_specific_privilege:'customer_offer',trust_quality_evidence:'trust_badge'};if(proof[c.purpose_key])keys.add('proof.'+proof[c.purpose_key])}
 if(c.experiment_id)keys.add(`${c.kind}.experiments`)
 return [...keys]
}
