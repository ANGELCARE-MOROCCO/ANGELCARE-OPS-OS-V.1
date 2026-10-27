/** Canonical import schema, quote-aware parser, safe exports, and row compilation. */
import {createHash} from 'node:crypto';
import {sourceInput,DEFAULT_MAPPING,type SourceInput} from '../contracts';
import {scheduleSpec,nextDue} from './schedule';
export const SOURCE_HEADERS=['operation','source_code','source_name','source_kind','source_format','target_country','endpoint','description','source_owner','provider_name','source_tags','collection_authorized','collection_enabled','publication_mode','rights_basis','rights_reference','terms_review_status','expected_version','response_path','search_parameter','search_terms','country_parameter','page_parameter','max_pages','max_items','request_headers_json','credential_reference',...Object.keys(DEFAULT_MAPPING).map(k=>'map_'+k.replace(/[A-Z]/g,m=>'_'+m.toLowerCase())),'schedule_enabled','execution_mode','schedule_type','schedule_interval','schedule_cron','schedule_timezone','schedule_local_time','schedule_weekdays','schedule_month_day','missed_run_policy','retry_limit','failure_pause_threshold','import_group','import_action','operator_notes'] as const;
export const VACANCY_HEADERS=['source_code','title','company','city','country','description','url','external_id','remote','salary','posted_at','setting_id','occupation_id','work_schedule','contract_type','sponsorship','relocation'] as const;
const COLUMN_ALIASES:Record<string,string>={
 'source':'source_name','source name':'source_name','name':'source_name','feed_name':'source_name',
 'feed url':'endpoint','feed_url':'endpoint','api url':'endpoint','api_url':'endpoint','url':'endpoint',
 'country':'target_country','iso country':'target_country','country_code':'target_country',
 'format':'source_format','type':'source_format','engine':'source_kind',
 'approved':'collection_authorized','active':'collection_enabled',
 'frequency':'schedule_type','timezone':'schedule_timezone','cron':'schedule_cron',
 'max results':'max_items','limit':'max_items','record_path':'response_path'
};
type InputRow=Record<string,string>;
const fail=(message:string):never=>{throw Error(message)};
const bool=(v:string)=>['yes','true','1','enabled'].includes(v.trim().toLowerCase());
export const checksum=(data:string)=>createHash('sha256').update(data,'utf8').digest('hex');
export function parseCSV(data:string,limit=500):InputRow[]{
 if(Buffer.byteLength(data,'utf8')>2_000_000)fail('CSV exceeds 2 MB');
 const raw=data.replace(/^\uFEFF/,'');const first=raw.split(/\r?\n/,1)[0];const delimiter=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';let rows:string[][]=[],line:string[]=[],cell='',quotes=false;
 for(let i=0;i<raw.length;i++){
  const c=raw[i];if(c==='"'){if(quotes&&raw[i+1]==='"'){cell+='"';i++;}else if(!quotes&&!cell)quotes=true;else if(quotes)quotes=false;else fail('Invalid CSV quote at character '+i);}
  else if(c===delimiter&&!quotes){line.push(cell);cell='';}
  else if((c==='\n'||c==='\r')&&!quotes){if(c==='\r'&&raw[i+1]==='\n')i++;line.push(cell);if(line.some(x=>x.trim()))rows.push(line);line=[];cell='';if(rows.length>limit+1)fail('CSV row limit '+limit+' exceeded');}
  else cell+=c;
 }
 if(quotes)fail('Unterminated CSV quoted cell');line.push(cell);if(line.some(x=>x.trim()))rows.push(line);
 if(rows.length<2)fail('CSV has no data rows');
 const headers=rows.shift()!.map(x=>{const key=x.trim().toLowerCase();return COLUMN_ALIASES[key]||key.replace(/[ -]+/g,'_')});if(new Set(headers).size!==headers.length)fail('CSV has duplicate column headings');
 if(!headers.length||headers.some(x=>!x||x.length>80))fail('CSV header contains invalid names');
 return rows.map((r,i)=>{if(r.length!==headers.length)fail(`Row ${i+2}: expected ${headers.length} columns, received ${r.length}`);return Object.fromEntries(headers.map((key,j)=>[key,r[j]]));});
}
const safeCell=(v:unknown)=>{let s=String(v??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return /[,"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
export function toCSV(headers:readonly string[],rows:InputRow[]):string{return [headers.join(','),...rows.map(r=>headers.map(h=>safeCell(r[h])).join(','))].join('\r\n')+'\r\n'};
export function sourceTemplate(full=true):string{
 const headers=full?[...SOURCE_HEADERS]:['source_name','source_kind','source_format','target_country','endpoint','collection_authorized','collection_enabled','publication_mode','response_path','max_pages','max_items','schedule_enabled','schedule_type','schedule_interval','schedule_timezone','schedule_local_time','operation'];
 const sample=(name:string,format:string,endpoint:string,enabled:boolean,scheduled:boolean):InputRow=>({source_name:name,source_kind:'api',source_format:format,target_country:'CA',endpoint,collection_authorized:enabled?'yes':'no',collection_enabled:enabled?'yes':'no',publication_mode:'none',response_path:format==='json'?'jobs':'',max_pages:'1',max_items:'20',schedule_enabled:'no',execution_mode:scheduled?'both':'manual',schedule_type:'daily',schedule_interval:'60',schedule_timezone:'America/Toronto',schedule_local_time:'09:00',schedule_weekdays:'1',schedule_month_day:'1',missed_run_policy:'once',retry_limit:'2',operation:'create',rights_basis:'review_required',terms_review_status:'pending',map_title:format==='json'?'jobTitle':'title',map_company:format==='json'?'companyName':'author',map_description:format==='json'?'jobDescription':'description',map_url:'url',map_external_id:'id',map_posted_at:'pubDate'});
 const samples=[sample('EXAMPLE JSON Education - EDIT BEFORE ACTIVATING','json','https://example.org/jobs.json',false,false),sample('EXAMPLE RSS Schools - EDIT BEFORE ACTIVATING','rss','https://example.org/careers.rss',false,true),sample('EXAMPLE Atom Childcare - EDIT BEFORE ACTIVATING','rss','https://example.org/positions.atom',false,false)];
 return toCSV(headers,samples);
}
export function vacancyTemplate():string{return toCSV(VACANCY_HEADERS,[{source_code:'EXISTING_SOURCE_UUID',title:'EXAMPLE Nursery Educator',company:'Example Employer',city:'',country:'',description:'Replace this example before importing',url:'https://example.org/jobs/123',external_id:'example-123'}]);}
export type SourceCompiled={source:SourceInput;schedule:{enabled:boolean;spec:ReturnType<typeof scheduleSpec>;nextRunAt:string|null}|null;operation:'create'|'update'|'upsert';sourceCode:string;line:number};
export function compileSource(row:InputRow,line:number):SourceCompiled{
 const name=row.source_name?.trim()||'';const kind=(row.source_kind||'api').toLowerCase();if(kind!=='api')fail(`Row ${line}: only integrated API/RSS engine can be CSV registered`);
 const operation=['create','update','upsert'].includes(row.operation)?row.operation as 'create'|'update'|'upsert':'create';
 const headers=row.request_headers_json?.trim()?JSON.parse(row.request_headers_json):{};if(!headers||typeof headers!=='object'||Array.isArray(headers))fail(`Row ${line}: request headers must be a JSON object`);
 const mapping={...DEFAULT_MAPPING};for(const key of Object.keys(mapping) as (keyof typeof mapping)[]){const column='map_'+key.replace(/[A-Z]/g,m=>'_'+m.toLowerCase());if(row[column]?.trim())mapping[key]=row[column].trim();}
 const input={name,kind:'api',country:(row.target_country||'').trim(),endpoint:(row.endpoint||'').trim(),approved:bool(row.collection_authorized||''),enabled:bool(row.collection_enabled||''),publicationMode:['none','metadata','full'].includes(row.publication_mode)?row.publication_mode:'none',expectedVersion:Number(row.expected_version||0),id:/^[0-9a-f-]{36}$/i.test(row.source_code||'')?row.source_code:undefined,config:{format:row.source_format==='rss'?'rss':'json',method:'GET',responsePath:row.response_path||'jobs',keywordParam:row.search_parameter||'',countryParam:row.country_parameter||'',pageParam:row.page_parameter||'',maxPages:Number(row.max_pages||1),limit:Number(row.max_items||20),query:row.search_terms||'',headers,mapping}};
 const source=sourceInput(input);
 if(source.enabled&&!source.approved)fail(`Row ${line}: enabling requires explicit collection authorization`);
 if(source.approved&&(!row.rights_basis||row.terms_review_status!=='approved'))fail(`Row ${line}: collection authorization requires rights_basis and approved terms review`);
 if(source.publicationMode!=='none'&&!row.rights_reference)fail(`Row ${line}: publication rights reference required`);
 const scheduleEnabled=bool(row.schedule_enabled||'');const schedule=scheduleEnabled||row.schedule_type?(()=>{
  const spec=scheduleSpec({enabled:scheduleEnabled,cadence:row.schedule_type||'daily',timezone:row.schedule_timezone||'UTC',intervalMinutes:Number(row.schedule_interval||60),localTime:row.schedule_local_time||'09:00',weekdays:(row.schedule_weekdays||'1').split('|').map(Number),monthDay:Number(row.schedule_month_day||1),cron:row.schedule_cron||'',missedPolicy:row.missed_run_policy||'once',retryLimit:Number(row.retry_limit||2)});
  return {enabled:spec.enabled,spec,nextRunAt:spec.enabled?nextDue(spec,new Date()).toISOString():null};
 })():null;
 if(scheduleEnabled&&!source.enabled)fail(`Row ${line}: scheduled source must be enabled`);
 return {source,schedule,operation,sourceCode:row.source_code||'',line};
}
export function validateSourceCSV(data:string){const rows=parseCSV(data);const seen=new Set<string>();const compiled:SourceCompiled[]=[],errors:{line:number;message:string}[]=[];
 for(const [index,row] of rows.entries())try{const item=compileSource(row,index+2),key=[item.source.kind,item.source.endpoint,item.source.country].join('|');if(seen.has(key))fail('Duplicate source endpoint/country inside CSV');seen.add(key);compiled.push(item);}catch(e){errors.push({line:index+2,message:e instanceof Error?e.message:String(e)})}
 return {total:rows.length,valid:compiled.length,invalid:errors.length,errors,compiled,checksum:checksum(data)};
}
