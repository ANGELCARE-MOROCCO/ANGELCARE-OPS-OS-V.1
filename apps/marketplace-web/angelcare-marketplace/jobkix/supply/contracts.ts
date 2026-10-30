/** Strict, shared Strategic Supply PM7 contracts. No arbitrary JavaScript, SQL or XPath code from admin inputs. */
import {officialApplyHosts,publicHttpsUrl} from './native-gate';
export const SUPPLY_SECTIONS=['overview','countries','sources','missions','bucket','review','publications','audit','feeds','schedules','imports'] as const;
export type SupplySection=typeof SUPPLY_SECTIONS[number];
export const SOURCE_KINDS=['api','scrapy','jobspy'] as const;
export type SourceKind=typeof SOURCE_KINDS[number];
export const VACANCY_STATES=['new','ready','needs_review','approved','published','rejected','withdrawn'] as const;
export type VacancyState=typeof VACANCY_STATES[number];
export type RecordMap={title:string;company:string;city:string;country:string;description:string;url:string;externalId:string;remote:string;salary:string;postedAt:string;settingId:string;occupationId:string;workSchedule:string;contractType:string;sponsorship:string;relocation:string;region:string;duties:string;requirements:string;benefits:string;languages:string;ageCohorts:string;workLocation:string;originalLocale:string;overseasApplicants:string;applyUrl:string;expiresAt:string;compensationMinimum:string;compensationMaximum:string;currency:string;compensationUnit:string;hoursPerWeek:string;liveIn:string};
export type ApiConfig={officialApplyHosts?:string[];autoPublish?:boolean;responsePath:string;format:'json'|'rss';method:'GET';keywordParam:string;countryParam:string;pageParam:string;maxPages:number;limit:number;query:string;headers:Record<string,string>;mapping:RecordMap};
export type ScrapyConfig={card:string;title:string;company:string;city:string;description:string;link:string;next:string;limit:number;maxPages:number;downloadDelay:number};
export type JobSpyConfig={boards:string[];query:string;location:string;countryIndeed:string;resultsWanted:number;hoursOld:number|null;isRemote:boolean;fetchDescription:boolean};
export type SourceConfig=ApiConfig|ScrapyConfig|JobSpyConfig;
export type SourceInput={name:string;kind:SourceKind;country:string;endpoint:string;approved:boolean;publicationMode:'full'|'metadata'|'none';enabled:boolean;config:SourceConfig;credential?:string;credentialHeader?:string;expectedVersion:number;id?:string};
export const DEFAULT_MAPPING:RecordMap={title:'title',company:'company',city:'city',country:'country',description:'description',url:'url',externalId:'id',remote:'remote',salary:'salary',postedAt:'date',settingId:'settingId',occupationId:'occupationId',workSchedule:'workSchedule',contractType:'contractType',sponsorship:'sponsorship',relocation:'relocation',region:'region',duties:'duties',requirements:'requirements',benefits:'benefits',languages:'languages',ageCohorts:'ageCohorts',workLocation:'workLocation',originalLocale:'language',overseasApplicants:'overseasApplicants',applyUrl:'applyUrl',expiresAt:'expiresAt',compensationMinimum:'compensationMinimum',compensationMaximum:'compensationMaximum',currency:'currency',compensationUnit:'compensationUnit',hoursPerWeek:'hoursPerWeek',liveIn:'liveIn'};
export const DEFAULT_API:ApiConfig={responsePath:'jobs',format:'json',method:'GET',keywordParam:'search',countryParam:'country',pageParam:'page',maxPages:2,limit:70,query:'early childhood educator',headers:{},mapping:DEFAULT_MAPPING};
export const DEFAULT_SCRAPY:ScrapyConfig={card:'article.job',title:'h2 a::text',company:'.company::text',city:'.location::text',description:'.description::text',link:'h2 a::attr(href)',next:'a.next::attr(href)',limit:70,maxPages:3,downloadDelay:2};
export const DEFAULT_JOBSPY:JobSpyConfig={boards:['indeed'],query:'nursery teacher',location:'',countryIndeed:'Morocco',resultsWanted:30,hoursOld:72,isRemote:false,fetchDescription:false};
export const BOARDS=['indeed','linkedin','glassdoor','zip_recruiter','bayt','naukri','bdjobs','hellowork'] as const;
export const COUNTRIES=['MA','FR','GB','AE','ES','PH','ID','US','CA','DE','SA','QA','IN','AU','NL','BE'] as const;
const plain=(v:unknown,max=400)=>typeof v==='string'?v.trim().slice(0,max):'';
const bound=(x:unknown,min:number,max:number,fallback:number)=>Number.isInteger(Number(x))?Math.max(min,Math.min(max,Number(x))):fallback;
const obj=(x:unknown)=>x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:{};
const validUrl=(x:string)=>{try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&u.hostname.length>3&&!/^(localhost|.*\.local|.*\.internal)$/i.test(u.hostname)&&!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(u.hostname)&&!u.hostname.includes(':')}catch{return false}};
export function sourceInput(input:unknown):SourceInput{
 const p=obj(input),kind=SOURCE_KINDS.find(k=>k===p.kind);if(!kind)throw Error('Choose API, Scrapy or JobSpy');
 const name=plain(p.name,120),country=plain(p.country,8).toUpperCase(),endpoint=plain(p.endpoint,1000);
 if(name.length<3)throw Error('Source name must have at least three characters');
 if(!/^[A-Z]{2}$/.test(country))throw Error('Country must be a two-letter ISO code');
 if(kind!=='jobspy'&&!validUrl(endpoint))throw Error('Use a public HTTPS endpoint with a valid hostname');
 const mode=['full','metadata','none'].find(x=>x===p.publicationMode) as SourceInput['publicationMode']|undefined;
 if(!mode)throw Error('Select the authorized publication mode');
 const raw=obj(p.config);let config:SourceConfig;
 if(kind==='api'){
  const mapping=obj(raw.mapping),headers=obj(raw.headers);
  const cleanHeaders:Record<string,string>={};for(const [k,v] of Object.entries(headers))if(/^[A-Za-z0-9-]{1,50}$/.test(k)&&!/^authorization|cookie|host|proxy-|x-forwarded/i.test(k))cleanHeaders[k]=plain(v,500);
  config={officialApplyHosts:officialApplyHosts(raw),autoPublish:raw.autoPublish===true,format:raw.format==='rss'?'rss':'json',method:'GET',responsePath:plain(raw.responsePath,150),keywordParam:plain(raw.keywordParam,60),countryParam:plain(raw.countryParam,60),pageParam:plain(raw.pageParam,60),maxPages:bound(raw.maxPages,1,10,2),limit:bound(raw.limit,1,300,70),query:plain(raw.query,200),headers:cleanHeaders,mapping:Object.fromEntries(Object.keys(DEFAULT_MAPPING).map(k=>[k,plain(mapping[k],150)||DEFAULT_MAPPING[k as keyof RecordMap]])) as RecordMap};
 }else if(kind==='scrapy'){
  const selector=(field:keyof ScrapyConfig,fallback:string)=>plain(raw[field],240)||fallback;
  config={card:selector('card',DEFAULT_SCRAPY.card),title:selector('title',DEFAULT_SCRAPY.title),company:selector('company',DEFAULT_SCRAPY.company),city:selector('city',DEFAULT_SCRAPY.city),description:selector('description',DEFAULT_SCRAPY.description),link:selector('link',DEFAULT_SCRAPY.link),next:selector('next',DEFAULT_SCRAPY.next),limit:bound(raw.limit,1,300,70),maxPages:bound(raw.maxPages,1,10,3),downloadDelay:bound(raw.downloadDelay,1,10,2)};
 }else{
  const boards=(Array.isArray(raw.boards)?raw.boards:[]).filter(v=>BOARDS.some(b=>b===v)).slice(0,4) as string[];
  if(!boards.length)throw Error('Select at least one supported JobSpy board');
  config={boards,query:plain(raw.query,250),location:plain(raw.location,250),countryIndeed:plain(raw.countryIndeed,80),resultsWanted:bound(raw.resultsWanted,1,100,30),hoursOld:raw.hoursOld===null?null:bound(raw.hoursOld,1,720,72),isRemote:raw.isRemote===true,fetchDescription:raw.fetchDescription===true};
 }
 const id=plain(p.id,36);if(id&&!/^[a-f\d]{8}-[a-f\d-]{27,}$/.test(id))throw Error('Invalid source identifier');
 return {id:id||undefined,name,kind,country,endpoint:kind==='jobspy'?'':endpoint,approved:p.approved===true,enabled:p.enabled===true,publicationMode:mode,config,credential:plain(p.credential,3000)||undefined,credentialHeader:plain(p.credentialHeader,80)||undefined,expectedVersion:bound(p.expectedVersion,0,100000000,0)};
}
/** Source-aware enrichment: never synthesize employment terms or translate unknown data
 * into a positive declaration. Values are source-authored or deliberately unknown. */
const listField=(v:unknown,max=40):string[]=>{
 const source=Array.isArray(v)?v:typeof v==='string'?v.split(/\r?\n|\s*;\s*/):[];
 return source.filter((x):x is string=>typeof x==='string').map(x=>x.trim().replace(/^[•*\-]\s*/, '').slice(0,1000)).filter(Boolean).slice(0,max);
};
const choiceField=(value:unknown,allowed:readonly string[]):string|null=>{
 const item=plain(value,100).toLowerCase().replace(/[- ]/g,'_');return allowed.includes(item)?item:null;
};
const amountField=(value:unknown):number|null=>{
 const text=plain(value,50);if(!/^\d{1,10}(?:\.\d{1,2})?$/.test(text))return null;
 const n=Number(text);return Number.isFinite(n)&&n>=0&&n<=1_000_000_000?n:null;
};
const instantField=(value:unknown):string|null=>{
 const text=plain(value,60);if(!/^\d{4}-\d{2}-\d{2}(?:T[^\s]{1,35})?$/.test(text))return null;
 const ms=Date.parse(text);return Number.isFinite(ms)?new Date(ms).toISOString():null;
};
const isoLanguage=(value:unknown):string|null=>{const v=plain(value,12);return /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(v)?v:null;};
export function normalizeVacancy(input:unknown,country:string){
 const p=obj(input),title=plain(p.title,240),company=plain(p.company,240),city=plain(p.city,160),link=plain(p.url,1400),description=plain(p.description,12000),externalId=plain(p.externalId,180);
 const normalizedUrl=publicHttpsUrl(link);if(title.length<3||!normalizedUrl)return null;
 const sourceCountry=plain(p.country,2).toUpperCase(),explicitCountry=/^[A-Z]{2}$/.test(sourceCountry);
 const verifiedCountry=explicitCountry?sourceCountry:country;
 const mode=choiceField(p.workLocation,['on_site','remote','hybrid'])||(
  /^(true|yes|remote|1)$/i.test(plain(p.remote,20))?'remote':null
 );
 const minimum=amountField(p.compensationMinimum),maximum=amountField(p.compensationMaximum);
 const currency=plain(p.currency,3).toUpperCase(),unit=choiceField(p.compensationUnit,['hour','day','week','month','year']);
 const compensation=/^[A-Z]{3}$/.test(currency)&&unit&&(minimum!==null||maximum!==null)&&
  (minimum===null||maximum===null||maximum>=minimum)
  ?{minimum,maximum,currency,unit}:null;
 const lang=listField(p.languages).flatMap(item=>item.includes(',')?item.split(',').map(s=>s.trim()):[item]).map(isoLanguage).filter((x):x is string=>Boolean(x));
 return {title,company,city,country:verifiedCountry,canonical_url:normalizedUrl,description,external_ref:externalId,
  salary_text:plain(p.salary,200),posted_at:plain(p.postedAt,80)||null,work_mode:plain(p.remote,70),
  normalized:{countryEvidence:explicitCountry?'source':'source_default',region:plain(p.region,180)||null,
   settingId:plain(p.settingId,100)||null,occupationId:plain(p.occupationId,100)||null,
   workSchedule:choiceField(p.workSchedule,['full_time','part_time','flexible']),
   contractType:choiceField(p.contractType,['permanent','fixed_term','temporary','seasonal','internship','other']),
   workLocation:mode,originalLocale:isoLanguage(p.originalLocale),
   sponsorship:choiceField(p.sponsorship,['yes','no','unknown'])||'unknown',
   relocation:choiceField(p.relocation,['yes','no','unknown'])||'unknown',
   overseasApplicants:choiceField(p.overseasApplicants,['yes','no','unknown'])||'unknown',
   duties:listField(p.duties),requirements:listField(p.requirements),benefits:listField(p.benefits),
   languages:lang,ageCohorts:listField(p.ageCohorts,12),compensation,
   expiresAt:plain(p.expiresAt,60)?(instantField(p.expiresAt)||'__INVALID_SOURCE_DATE__'):null,hoursPerWeek:amountField(p.hoursPerWeek),
   liveIn:choiceField(p.liveIn,['yes','no']),applicationUrl:publicHttpsUrl(plain(p.applyUrl,1400))},raw:p};
}
