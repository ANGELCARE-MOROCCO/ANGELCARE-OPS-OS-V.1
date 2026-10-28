/**
 * PM7 R2: bounded JSON API collector inside the existing Marketplace Node runtime.
 * No scheduler, background worker, new service, server secret or automatic publication.
 * DNS-resolved target IP is pinned to HTTPS request to limit SSRF/DNS rebinding.
 */
import {lookup} from 'node:dns/promises';
import {request} from 'node:https';
import {BlockList,isIP} from 'node:net';
import type {ApiConfig} from './contracts';

type Dict=Record<string,unknown>;
type ApiSource={endpoint:string;country:string;config:unknown;credential?:string;credentialHeader?:string};
const MAX_BYTES=2_500_000;
const MAX_ROWS=30;
const MAX_PAGES=2;
const MAX_MS=18_000;
const BLOCKED=new BlockList();
for(const [ip,prefix] of [
 ['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],
 ['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],
 ['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],
 ['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]
] as const)BLOCKED.addSubnet(ip,prefix,'ipv4');
for(const [ip,prefix] of [
 ['::',128],['::1',128],['fc00::',7],['fe80::',10],['ff00::',8],
 ['2001:db8::',32]
] as const)BLOCKED.addSubnet(ip,prefix,'ipv6');
// Keep mapped-IPv4 rejection isolated: applying /96 to the primary BlockList
// also blocks every ordinary public IPv4 address in Node's BlockList.
const MAPPED_IPV4=new BlockList();
MAPPED_IPV4.addSubnet('::ffff:0:0',96,'ipv6');

const dict=(value:unknown):Dict=>value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Dict:{};
const bound=(x:unknown,min:number,max:number,fallback:number)=>Number.isInteger(Number(x))?Math.max(min,Math.min(max,Number(x))):fallback;
const clean=(value:unknown):string=>{
 if(value===null||value===undefined)return '';
 if(typeof value==='boolean')return value?'yes':'no';
 if(Array.isArray(value))return value.map(x=>String(x??'')).join(', ').slice(0,2000);
 if(typeof value==='object')return JSON.stringify(value).slice(0,2000);
 return String(value).trim().slice(0,12000);
};
const path=(record:unknown,dotted:string):unknown=>{
 if(!dotted)return record;
 let value:unknown=record;
 for(const part of dotted.split('.')){
  if(Array.isArray(value)&&/^\d+$/.test(part))value=value[Number(part)];
  else if(value!==null&&typeof value==='object'&&!Array.isArray(value))value=(value as Dict)[part];
  else return undefined;
 }
 return value;
};
const urlFor=(endpoint:string,params:ApiConfig,sourceCountry:string,page:number):URL=>{
 const u=new URL(endpoint);
 if(u.protocol!=='https:'||u.port&&u.port!=='443'||u.username||u.password||u.hash||
    isIP(u.hostname)!==0||!u.hostname.includes('.')||
    /(^localhost$|\.local$|\.internal$)/i.test(u.hostname))throw Error('API endpoint must be a public HTTPS host on port 443');
 const filters:[[string,string],[string,string],[string,string]]=[
  [params.keywordParam,params.query],[params.countryParam,sourceCountry],[params.pageParam,String(page)]
 ];
 for(const [key,val] of filters)if(key&&/^[A-Za-z0-9_-]{1,60}$/.test(key)&&val)u.searchParams.set(key,val);
 return u;
};

async function getJSON(u:URL,headers:Record<string,string>):Promise<unknown>{
 // Choose and PIN a resolved, publicly routable address for this HTTPS socket.
 // This avoids a second unvalidated DNS lookup during the connection.
 const addresses=await lookup(u.hostname,{all:true});
 const publicAddresses=addresses.filter(a=>
  !BLOCKED.check(a.address,a.family===6?'ipv6':'ipv4') &&
  !(a.family===6&&MAPPED_IPV4.check(a.address,'ipv6'))
);
 if(!addresses.length||publicAddresses.length!==addresses.length)throw Error('API host resolves to a private, reserved or unavailable address');
 const resolved=publicAddresses.find(a=>a.family===4)||publicAddresses[0];
 return new Promise<unknown>((resolve,reject)=>{
  const req=request(u,{
   method:'GET',headers,timeout:MAX_MS,
   lookup:(_hostname,options,callback)=>options.all?callback(null,[{address:resolved.address,family:resolved.family}]):callback(null,resolved.address,resolved.family)
  },res=>{
   const status=res.statusCode||0;
   if(status<200||status>=300){res.resume();reject(Error(`API returned HTTP ${status}; redirects are not followed`));return;}
   let total=0;const chunks:Buffer[]=[];
   res.on('data',(chunk:Buffer)=>{
    total+=chunk.byteLength;
    if(total>MAX_BYTES){res.destroy(Error('API response exceeds 2.5 MB'));return;}
    chunks.push(chunk);
   });
   res.on('error',reject);
   res.on('end',()=>{
    try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown)}
    catch{reject(Error('API response is not valid JSON'));}
   });
  });
  req.on('error',reject);
  req.on('timeout',()=>req.destroy(Error('API request timed out')));
  req.end();
 });
}

export async function collectInlineApi(source:ApiSource):Promise<Dict[]>{
 const cfg=dict(source.config) as Partial<ApiConfig>;
 if(cfg.format!=='json')throw Error('Only JSON API is supported in the existing Marketplace runtime; RSS requires an adapter');
 const responsePath=typeof cfg.responsePath==='string'?cfg.responsePath:'';
 const params={...cfg,keywordParam:cfg.keywordParam||'',query:cfg.query||'',countryParam:cfg.countryParam||'',pageParam:cfg.pageParam||''} as ApiConfig;
 const mapping=dict(cfg.mapping);
 const limit=bound(cfg.limit,1,MAX_ROWS,20),maxPages=bound(cfg.maxPages,1,MAX_PAGES,1);
 const headers:Record<string,string>={Accept:'application/json','User-Agent':'JOBKIX-StrategicSupply/1.1 (private ingestion)'};
 for(const [key,val] of Object.entries(dict(cfg.headers))){
  if(/^[A-Za-z0-9-]{1,50}$/.test(key)&&! /^(authorization|cookie|host|connection|proxy-|x-forwarded|content-length|transfer-encoding)/i.test(key))headers[key]=clean(val).slice(0,500);
 }
 if(source.credential){
  const header=source.credentialHeader||'';
  if(!/^[A-Za-z0-9-]{1,80}$/.test(header)||/^(host|cookie|connection|content-length|transfer-encoding|proxy-)/i.test(header))throw Error('Unsafe API credential header');
  headers[header]=source.credential;
 }
 const rows:Dict[]=[];
 for(let pageNumber=1;pageNumber<=maxPages;pageNumber++){
  const u=urlFor(source.endpoint,params,source.country,pageNumber);
  const document=await getJSON(u,headers);
  const list=path(document,responsePath);
  if(!Array.isArray(list))throw Error(`Result array path "${responsePath}" did not resolve to a JSON array`);
  for(const item of list){
   const row:Dict={};
   for(const [field,dotted] of Object.entries(mapping)){
    if(typeof dotted==='string'&&/^[A-Za-z][A-Za-z0-9]*$/.test(field))row[field]=clean(path(item,dotted));
   }
   rows.push(row);
   if(rows.length>=limit)break;
  }
  if(list.length===0||rows.length>=limit||!params.pageParam)break;
 }
 return rows;
}
