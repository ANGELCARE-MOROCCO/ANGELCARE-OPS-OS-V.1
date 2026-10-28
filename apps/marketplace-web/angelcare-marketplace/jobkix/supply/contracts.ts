/** Strict, shared Strategic Supply PM7 contracts. No arbitrary JavaScript, SQL or XPath code from admin inputs. */
export const SUPPLY_SECTIONS=['overview','countries','sources','missions','bucket','review','publications','audit','feeds','schedules','imports'] as const;
export type SupplySection=typeof SUPPLY_SECTIONS[number];
export const SOURCE_KINDS=['api','scrapy','jobspy'] as const;
export type SourceKind=typeof SOURCE_KINDS[number];
export const VACANCY_STATES=['new','ready','needs_review','approved','published','rejected','withdrawn'] as const;
export type VacancyState=typeof VACANCY_STATES[number];
export type RecordMap={title:string;company:string;city:string;country:string;description:string;url:string;externalId:string;remote:string;salary:string;postedAt:string;settingId:string;occupationId:string;workSchedule:string;contractType:string;sponsorship:string;relocation:string};
export type ApiConfig={autoPublish?:boolean;responsePath:string;format:'json'|'rss';method:'GET';keywordParam:string;countryParam:string;pageParam:string;maxPages:number;limit:number;query:string;headers:Record<string,string>;mapping:RecordMap};
export type ScrapyConfig={card:string;title:string;company:string;city:string;description:string;link:string;next:string;limit:number;maxPages:number;downloadDelay:number};
export type JobSpyConfig={boards:string[];query:string;location:string;countryIndeed:string;resultsWanted:number;hoursOld:number|null;isRemote:boolean;fetchDescription:boolean};
export type SourceConfig=ApiConfig|ScrapyConfig|JobSpyConfig;
export type SourceInput={name:string;kind:SourceKind;country:string;endpoint:string;approved:boolean;publicationMode:'full'|'metadata'|'none';enabled:boolean;config:SourceConfig;credential?:string;credentialHeader?:string;expectedVersion:number;id?:string};
export const DEFAULT_MAPPING:RecordMap={title:'title',company:'company',city:'city',country:'country',description:'description',url:'url',externalId:'id',remote:'remote',salary:'salary',postedAt:'date',settingId:'settingId',occupationId:'occupationId',workSchedule:'workSchedule',contractType:'contractType',sponsorship:'sponsorship',relocation:'relocation'};
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
  config={autoPublish:raw.autoPublish===true,format:raw.format==='rss'?'rss':'json',method:'GET',responsePath:plain(raw.responsePath,150),keywordParam:plain(raw.keywordParam,60),countryParam:plain(raw.countryParam,60),pageParam:plain(raw.pageParam,60),maxPages:bound(raw.maxPages,1,10,2),limit:bound(raw.limit,1,300,70),query:plain(raw.query,200),headers:cleanHeaders,mapping:Object.fromEntries(Object.keys(DEFAULT_MAPPING).map(k=>[k,plain(mapping[k],150)||DEFAULT_MAPPING[k as keyof RecordMap]])) as RecordMap};
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
export function normalizeVacancy(input:unknown,country:string){
 const p=obj(input),title=plain(p.title,240),company=plain(p.company,240),city=plain(p.city,160),link=plain(p.url,1400),description=plain(p.description,12000),externalId=plain(p.externalId,180);
 if(title.length<3||!validUrl(link))return null;
 const sourceCountry=plain(p.country,2).toUpperCase();
 return {title,company,city,country:/^[A-Z]{2}$/.test(sourceCountry)?sourceCountry:country,canonical_url:link,description,external_ref:externalId,salary_text:plain(p.salary,200),posted_at:plain(p.postedAt,80)||null,work_mode:plain(p.remote,70),normalized:{settingId:plain(p.settingId,100)||null,occupationId:plain(p.occupationId,100)||null,workSchedule:plain(p.workSchedule,40)||null,contractType:plain(p.contractType,40)||null,sponsorship:plain(p.sponsorship,30)||'unknown',relocation:plain(p.relocation,30)||'unknown'},raw:p};
}
