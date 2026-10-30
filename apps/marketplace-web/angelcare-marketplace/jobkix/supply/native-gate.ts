/** JOBKIX R3: pure, deterministic external-vacancy identity / rights / publication checks.
 * These checks do NOT turn aggregator advertisements into verified employer recruitment.
 * A source must be editorially approved and its official application host(s) approved by an operator.
 */

export type FieldMap=Record<string,unknown>;
export type SourceAuthority={approved?:boolean;enabled?:boolean;archived_at?:string|null;publication_mode?:string;config?:unknown};
export type ExternalCandidate={title?:unknown;company?:unknown;country?:unknown;canonical_url?:unknown;description?:unknown;quality_score?:unknown;last_seen?:unknown;normalized?:unknown};

const object=(x:unknown):FieldMap=>x!==null&&typeof x==='object'&&!Array.isArray(x)?x as FieldMap:{};
const string=(x:unknown)=>typeof x==='string'?x.trim():'';
const RESERVED_HOST=/(^localhost$|\.(local|internal|localhost|test|invalid|example)$)/i;
const TRACKING=/^(utm_[a-z0-9_]+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|yclid|_hsenc|_hsmi)$/i;
const VALID_HOST=/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export function publicHttpsUrl(value:unknown):string|null{
 if(typeof value!=='string'||value.length>1400||/[\u0000-\u001f\u007f\s]/.test(value))return null;
 try{
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password||u.hash||u.port||!VALID_HOST.test(u.hostname)||RESERVED_HOST.test(u.hostname))return null;
  return u.href;
 }catch{return null;}
}
export function officialApplyHosts(config:unknown):string[]{
 const hosts=object(config).officialApplyHosts;
 if(!Array.isArray(hosts)||hosts.length>100)return [];
 return [...new Set(hosts.filter((h):h is string=>typeof h==='string').map(h=>h.toLowerCase().trim()).filter(h=>h.length<=253&&VALID_HOST.test(h)&&!RESERVED_HOST.test(h)))];
}
export function officialApplyUrl(value:unknown,config:unknown):string|null{
 const href=publicHttpsUrl(value);if(!href)return null;
 const host=new URL(href).hostname.toLowerCase();
 return officialApplyHosts(config).includes(host)?href:null;
}
export function canonicalIdentityUrl(value:unknown):string|null{
 const href=publicHttpsUrl(value);if(!href)return null;
 const u=new URL(href);
 // Tracking keys may change, but unknown query keys may identify DISTINCT vacancies.
 for(const name of [...u.searchParams.keys()])if(TRACKING.test(name))u.searchParams.delete(name);
 const pairs=[...u.searchParams.entries()].sort(([ak,av],[bk,bv])=>ak.localeCompare(bk)||av.localeCompare(bv));
 u.search='';for(const [k,v] of pairs)u.searchParams.append(k,v);
 return u.href;
}
export function sourceIdentityKey(sourceId:string,externalRef:unknown,url:unknown):string{
 const ref=string(externalRef),canonical=canonicalIdentityUrl(url);
 if(!canonical)throw Error('INVALID_EXTERNAL_VACANCY_URL');
 if(!/^[a-f0-9-]{36}$/i.test(sourceId))throw Error('INVALID_SOURCE_ID');
 const stable=ref?`ref:${ref}`:`url:${canonical}`;
 return `jobkix-r3\0${sourceId.toLowerCase()}\0${stable}`;
}
export const MANUAL_FIELDS=['settingId','occupationId','workSchedule','contractType','sponsorship','relocation'] as const;
export function mergeEnrichment(sourceNormalized:unknown,previousNormalized:unknown,protectLegacy=false):FieldMap{
 const source=object(sourceNormalized),previous=object(previousNormalized),stored=object(previous.manualOverrides);
 const overrides:FieldMap={};
 for(const name of MANUAL_FIELDS){
  if(Object.prototype.hasOwnProperty.call(stored,name)&&typeof stored[name]==='string')overrides[name]=stored[name];
  else if(protectLegacy&&typeof previous[name]==='string'&&previous[name]!==''&&previous[name]!==null)overrides[name]=previous[name];
 }
 return {...source,...overrides,manualOverrides:overrides};
}
export function withManualEnrichment(previousNormalized:unknown,patch:unknown):FieldMap{
 const previous=object(previousNormalized),patchData=object(patch),overrides:FieldMap={...object(previous.manualOverrides)};
 for(const name of MANUAL_FIELDS){
  if(Object.prototype.hasOwnProperty.call(patchData,name)){
   const proposed=string(patchData[name]).slice(0,100);
   overrides[name]=proposed||(name==='sponsorship'||name==='relocation'?'unknown':'');
  }
 }
 return {...previous,...overrides,manualOverrides:overrides};
}
export type PublicationAssessment={eligible:boolean;reasons:string[]};
export function publicationAssessment(candidate:ExternalCandidate,source:SourceAuthority,now=Date.now()):PublicationAssessment{
 const n=object(candidate.normalized),reasons:string[]=[];
 if(!source.approved||!source.enabled||source.archived_at)reasons.push('SOURCE_DISABLED_OR_UNAPPROVED');
 if(source.publication_mode!=='full')reasons.push('FULL_REPUBLICATION_RIGHTS_REQUIRED');
 if(string(candidate.title).length<3||string(candidate.company).length<2)reasons.push('IDENTITY_INCOMPLETE');
 if(!/^[A-Z]{2}$/.test(string(candidate.country))||n.countryEvidence!=='source')reasons.push('SOURCE_COUNTRY_REQUIRED');
 if(!publicHttpsUrl(candidate.canonical_url))reasons.push('ORIGINAL_URL_INVALID');
 if(!officialApplyUrl(n.applicationUrl,source.config))reasons.push('OFFICIAL_APPLY_HOST_NOT_APPROVED');
 if(string(candidate.description).length<120)reasons.push('RICH_DESCRIPTION_REQUIRED');
 if(!(Array.isArray(n.duties)&&n.duties.some(x=>string(x)))&&!(Array.isArray(n.requirements)&&n.requirements.some(x=>string(x))))reasons.push('DUTIES_OR_REQUIREMENTS_REQUIRED');
 if(typeof candidate.quality_score!=='number'||candidate.quality_score<80)reasons.push('QUALITY_BELOW_80');
 const seen=Date.parse(string(candidate.last_seen));
 if(!Number.isFinite(seen)||seen>now+5*60_000||now-seen>60*86400_000)reasons.push('SOURCE_OBSERVATION_STALE');
 const expires=n.expiresAt;
 if(expires!==null&&expires!==undefined&&expires!==''){
  const time=Date.parse(string(expires));if(!Number.isFinite(time)||time<=now)reasons.push('EXPIRED_VACANCY');
 }
 return {eligible:reasons.length===0,reasons};
}
