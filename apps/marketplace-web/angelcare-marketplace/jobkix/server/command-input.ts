import { JobkixFault } from '../contracts';
import { validateInterview } from '../domain';
import * as v from '../validation';
import { pipelinePayload } from '../pipeline';
import { savedSearchFilters } from '../account-input';
import { vacancyCreateInput,vacancySaveInput } from '../vacancy-input';
const bool=(value:unknown,field:string)=>{if(typeof value!=='boolean')throw new JobkixFault('INVALID_INPUT',{[field]:'boolean'});return value;};
const optionalId=(value:unknown)=>value===null||value===undefined||value===''?null:v.uuid(value);
const answers=(value:unknown)=>Object.fromEntries(Object.entries(v.object(value)).map(([key,value])=>[v.uuid(key,'questionId'),v.text(value,key,0,10000)]));
const offerFields=(p:Record<string,unknown>)=>({title:v.text(p.title,'title',1,240),terms:v.text(p.terms,'terms',1,30000),compensation:v.compensation(p.compensation),startsAt:p.startsAt?v.instant(p.startsAt,'startsAt'):null,responseDeadline:p.responseDeadline?v.instant(p.responseDeadline,'responseDeadline'):null});
export const WORKSPACE_ACTIONS=new Set(['employer.search.save','saved.save','saved.remove','search.save','search.remove','draft.save','draft.remove','privacy.block','privacy.unblock','settings.save','organization.save','site.create','site.save','team.invite','team.accept','team.change','team.transfer','team.revoke','pool.create','pool.add','pool.remove','evaluation.save','case.create','case.appeal','case.reply','verification.submit','privacy.request','reputation.contribute','reputation.withdraw','notification.read']);
const ids=(value:unknown,field:string)=>v.strings(value,field,100,36).map(id=>v.uuid(id,field));
function payloadFor(action:string,p:Record<string,unknown>):Record<string,unknown>{
 switch(action){
  case 'resource.save':return {documentId:v.uuid(p.documentId),locale:v.locale(p.locale),saved:bool(p.saved,'saved'),collection:v.text(p.collection??'default','collection',1,180)};
  case 'account.initialize':return {intent:v.choice(p.intent,['candidate','hirer'],'intent'),displayName:v.text(p.displayName,'displayName',1,180),country:v.countryCode(p.country,true),locale:v.locale(p.locale),timezone:v.timezone(p.timezone),adultConfirmed:bool(p.adultConfirmed,'adultConfirmed'),accepted:bool(p.accepted,'accepted'),consentRevision:v.text(p.consentRevision,'consentRevision',64,64)};
  case 'profile.save':return {displayName:v.text(p.displayName,'displayName',1,180),headline:v.text(p.headline,'headline',0,240),summary:v.text(p.summary,'summary',0,12000),country:v.countryCode(p.country,true),skills:v.strings(p.skills,'skills'),occupations:v.strings(p.occupations,'occupations'),languages:v.strings(p.languages,'languages'),experience:v.profileEntries(p.experience,'experience'),education:v.profileEntries(p.education,'education'),preferences:p.preferences===undefined?{}:v.object(p.preferences)};
  case 'privacy.save':return {discoverable:bool(p.discoverable,'discoverable')};
  case 'organization.create':return {originalLocale:v.locale(p.originalLocale??'en'),kind:v.choice(p.kind,['household','institution','healthcare','hospitality','ngo','public','multi_site'],'kind'),publicName:v.text(p.publicName,'publicName',2,180),country:v.countryCode(p.country),city:v.text(p.city,'city',0,180)};
  case 'vacancy.create':return vacancyCreateInput(p);
  case 'vacancy.save':return vacancySaveInput(p);
  case 'vacancy.publish':return {id:v.uuid(p.id),expiresAt:v.instant(p.expiresAt,'expiresAt')};
  case 'vacancy.submit_review':return {id:v.uuid(p.id)};
  case 'vacancy.pause':case 'vacancy.close':case 'vacancy.archive':case 'vacancy.reopen':case 'vacancy.duplicate':return {id:v.uuid(p.id),reason:v.text(p.reason,'reason',10,1500)};
  case 'application.submit':return {vacancyId:v.uuid(p.vacancyId),vacancyVersion:v.integer(p.vacancyVersion,'vacancyVersion',1,1000000),profileVersion:v.integer(p.profileVersion,'profileVersion',1,1000000),documentId:optionalId(p.documentId),answers:answers(p.answers),sharingConsent:bool(p.sharingConsent,'sharingConsent'),consentRevision:v.text(p.consentRevision,'consentRevision',1,100)};
  case 'application.bulk_stage':return pipelinePayload(p);
  case 'application.stage':return {applicationId:v.uuid(p.applicationId),state:v.choice(p.state,['acknowledged','under_review','shortlisted','interview','declined','on_hold','closed_due_to_vacancy'],'state')};
  case 'application.withdraw':return {applicationId:v.uuid(p.applicationId)};
  case 'message.send':return {applicationId:v.uuid(p.applicationId),body:v.text(p.body,'body',1,12000),locale:v.locale(p.locale),attachmentId:optionalId(p.attachmentId)};
  case 'interview.propose':case 'interview.reschedule':return {...validateInterview({startsAt:p.startsAt,endsAt:p.endsAt,timezone:p.timezone,format:p.format,location:p.location,panelUserIds:p.panelUserIds}),...(action==='interview.propose'?{applicationId:v.uuid(p.applicationId)}:{id:v.uuid(p.id)})};
  case 'interview.panel_respond':return {id:v.uuid(p.id),response:v.choice(p.response,['accepted','declined'],'response')};
  case 'interview.respond':return {id:v.uuid(p.id),response:v.choice(p.response,['accepted','declined','reschedule_requested'],'response')};
  case 'interview.cancel':case 'interview.complete':return {id:v.uuid(p.id)};
  case 'offer.create':return {applicationId:v.uuid(p.applicationId),...offerFields(p)};
  case 'offer.save':return {id:v.uuid(p.id),...offerFields(p)};
  case 'offer.send':case 'offer.withdraw':return {id:v.uuid(p.id)};
  case 'offer.respond':return {id:v.uuid(p.id),response:v.choice(p.response,['accepted','declined'],'response')};
  case 'employer.search.save':return {organizationId:v.uuid(p.organizationId)};
  case 'external.saved.save':case 'external.saved.remove':return {vacancyId:v.uuid(p.vacancyId),collection:v.text(p.collection??'default','collection',1,180)};
  case 'saved.save':return {vacancyId:v.uuid(p.vacancyId),collection:v.text(p.collection??'default','collection',1,180)};
  case 'saved.remove':return {vacancyId:v.uuid(p.vacancyId)};
  case 'search.save':return {id:optionalId(p.id),name:v.text(p.name,'name',1,180),filters:savedSearchFilters(p.filters),frequency:v.choice(p.frequency,['off','daily','weekly'],'frequency'),enabled:bool(p.enabled,'enabled')};
  case 'search.remove':case 'notification.read':return {id:v.uuid(p.id)};
  case 'draft.save':return {kind:v.choice(p.kind,['application','vacancy','message','profile','organization','hiring','case','team','talent','reputation'],'kind'),key:v.text(p.key,'key',1,180),body:v.object(p.body)};
  case 'draft.remove':return {kind:v.choice(p.kind,['application','vacancy','message','profile','organization','hiring','case','team','talent','reputation'],'kind'),key:v.text(p.key,'key',1,180)};
  case 'privacy.block':case 'privacy.unblock':return {organizationId:v.uuid(p.organizationId)};
  case 'settings.save':return {locale:v.locale(p.locale),timezone:v.timezone(p.timezone),emailNotifications:bool(p.emailNotifications,'emailNotifications')};
  case 'organization.save':return {originalLocale:v.locale(p.originalLocale??'en'),organizationId:v.uuid(p.organizationId),publicName:v.text(p.publicName,'publicName',2,180),description:v.text(p.description,'description',0,24000),country:v.countryCode(p.country),city:v.text(p.city,'city',0,180),legalName:v.text(p.legalName??'','legalName',0,180),contactEmail:v.text(p.contactEmail??'','contactEmail',0,320),contactPhone:v.text(p.contactPhone??'','contactPhone',0,100),privateAddress:v.text(p.privateAddress??'','privateAddress',0,1500)};
  case 'site.create':case 'site.save':return {...(action==='site.save'?{id:v.uuid(p.id),active:bool(p.active,'active')}:{organizationId:v.uuid(p.organizationId)}),label:v.text(p.label,'label',1,180),country:v.countryCode(p.country),region:v.text(p.region??'','region',0,180),city:v.text(p.city,'city',0,180),timezone:v.timezone(p.timezone)};
  case 'team.invite':return {organizationId:v.uuid(p.organizationId),email:v.text(p.email,'email',3,320),locale:v.locale(p.locale),role:v.choice(p.role,['admin','recruiter','hiring_manager','interviewer','viewer'],'role'),siteIds:ids(p.siteIds??[],'siteIds'),vacancyIds:ids(p.vacancyIds??[],'vacancyIds')};
  case 'team.accept':return {id:v.uuid(p.id),token:v.text(p.token,'token',32,180)};
  case 'team.change':return {id:v.uuid(p.id),role:v.choice(p.role,['admin','recruiter','hiring_manager','interviewer','viewer'],'role'),active:bool(p.active,'active'),siteIds:ids(p.siteIds??[],'siteIds'),vacancyIds:ids(p.vacancyIds??[],'vacancyIds')};
  case 'team.revoke':case 'team.transfer':return {id:v.uuid(p.id)};
  case 'pool.create':return {organizationId:v.uuid(p.organizationId),name:v.text(p.name,'name',1,180)};
  case 'pool.add':case 'pool.remove':return {poolId:v.uuid(p.poolId),candidateUserId:v.uuid(p.candidateUserId)};
  case 'evaluation.save':return {interviewId:v.uuid(p.interviewId),criteria:v.object(p.criteria),notes:v.text(p.notes,'notes',0,12000)};
  case 'case.create':case 'verification.submit':case 'privacy.request':return {locale:v.locale(p.locale??'en'),kind:action==='verification.submit'?'verification':v.choice(p.kind,action==='privacy.request'?['privacy_export','privacy_deletion']:['report','support'],'kind'),organizationId:optionalId(p.organizationId),vacancyId:optionalId(p.vacancyId),category:v.text(p.category??'general','category',1,100),description:v.text(p.description,'description',10,16000),fileId:optionalId(p.fileId)};
  case 'case.reply':return {locale:v.locale(p.locale??'en'),id:v.uuid(p.id),description:v.text(p.description,'description',10,16000)};
  case 'case.appeal':return {locale:v.locale(p.locale??'en'),id:v.uuid(p.id),description:v.text(p.description,'description',10,16000)};
  case 'reputation.withdraw':return {id:v.uuid(p.id)};
  case 'reputation.contribute':{
   const kind=v.choice(p.kind,['review','salary'],'kind');const pay=kind==='salary'?v.compensation({minimum:p.amount,maximum:null,currency:p.currency,unit:p.unit}):null;
   return {organizationId:v.uuid(p.organizationId),parentId:optionalId(p.parentId),publicationConsent:bool(p.publicationConsent,'publicationConsent'),methodologyRevision:v.text(p.methodologyRevision,'methodologyRevision',64,64),rating:p.rating===null||p.rating===undefined?null:v.integer(p.rating,'rating',1,5),kind,locale:v.locale(p.locale),body:v.text(p.body,'body',20,12000),relationship:v.text(p.relationship,'relationship',1,500),amount:pay?.minimum??null,currency:pay?.currency??null,unit:pay?.unit??null,professionId:p.professionId?v.text(p.professionId,'professionId',1,100):null,country:v.countryCode(p.country,true)};
  }
  default:throw new JobkixFault('INVALID_INPUT',{action:'unsupported_command'});
 }
}
export function commandInput(input:Record<string,unknown>){
 const action=v.text(input.action,'action',1,100),payload=payloadFor(action,v.object(input.payload));
 return {action,payload,version:v.integer(input.expectedVersion??0,'expectedVersion',0,1000000),key:v.text(input.idempotencyKey,'idempotencyKey',16,180)};
}
