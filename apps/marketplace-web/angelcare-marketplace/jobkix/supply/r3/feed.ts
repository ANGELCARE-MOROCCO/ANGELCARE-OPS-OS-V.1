/** Secure RSS/Atom reader. No DTD, external entities, redirects or internal-network access. */
import {lookup} from 'node:dns/promises';
import {request} from 'node:https';
import {BlockList,isIP} from 'node:net';

type Dict=Record<string,unknown>;
export type FeedItem={title:string;company:string;city:string;country:string;description:string;url:string;externalId:string;remote:string;salary:string;postedAt:string;settingId:string;occupationId:string;workSchedule:string;contractType:string;sponsorship:string;relocation:string};
export type FeedInspection={format:'rss'|'atom';title:string;items:number;sample:FeedItem[];etag:string|null;lastModified:string|null;notModified:boolean};
const blocked=new BlockList();
for(const [ip,n] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.168.0.0',16],['192.0.2.0',24],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]] as const)blocked.addSubnet(ip,n,'ipv4');
for(const [ip,n] of [['::',128],['::1',128],['fc00::',7],['fe80::',10],['ff00::',8],['2001:db8::',32]] as const)blocked.addSubnet(ip,n,'ipv6');
// Reject IPv4-mapped IPv6 addresses explicitly, without shadowing ordinary IPv4.
const mappedIPv4=new BlockList();
mappedIPv4.addSubnet('::ffff:0:0',96,'ipv6');
function assertURL(url:string){const u=new URL(url);if(u.protocol!=='https:'||u.port&&u.port!=='443'||u.username||u.password||u.hash||isIP(u.hostname)||!u.hostname.includes('.')||/(^localhost$|\.local$|\.internal$)/i.test(u.hostname))throw Error('Source must use a public HTTPS host on port 443');return u;}
export async function secureFeedGet(url:string,conditional:Record<string,string>={}):Promise<{status:number;body:string;etag:string|null;lastModified:string|null}>{
 const u=assertURL(url),addresses=await lookup(u.hostname,{all:true});
 if(!addresses.length||addresses.some(a=>blocked.check(a.address,a.family===6?'ipv6':'ipv4')||(a.family===6&&mappedIPv4.check(a.address,'ipv6'))))throw Error('Source resolves to an internal, reserved or unsafe address');
 const selected=addresses.find(a=>a.family===4)||addresses[0];
 const headers:Record<string,string>={'User-Agent':'JOBKIX-RSS-Intelligence/3.0','Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml'};
 if(conditional.etag&&conditional.etag.length<256)headers['If-None-Match']=conditional.etag;
 if(conditional.lastModified&&conditional.lastModified.length<256)headers['If-Modified-Since']=conditional.lastModified;
 return new Promise((resolve,reject)=>{
  const req=request(u,{method:'GET',headers,timeout:15000,lookup:(_hostname,options,cb)=>options.all?cb(null,[{address:selected.address,family:selected.family}]):cb(null,selected.address,selected.family)},res=>{
   const status=res.statusCode||0;
   if(status===304){res.resume();resolve({status,body:'',etag:String(res.headers.etag||'').slice(0,255)||null,lastModified:String(res.headers['last-modified']||'').slice(0,255)||null});return;}
   if(status<200||status>=300){res.resume();reject(Error('Feed provider returned HTTP '+status+(status===429?' (rate limited)':'')));return;}
   const bytes:Buffer[]=[];let used=0;res.on('data',(b:Buffer)=>{used+=b.length;if(used>2_500_000){res.destroy(Error('Feed exceeds 2.5 MB'));return;}bytes.push(b)});
   res.on('error',reject);res.on('end',()=>resolve({status,body:Buffer.concat(bytes).toString('utf8').replace(/^\uFEFF/,''),etag:String(res.headers.etag||'').slice(0,255)||null,lastModified:String(res.headers['last-modified']||'').slice(0,255)||null}));
  });req.on('error',reject);req.on('timeout',()=>req.destroy(Error('Feed request timed out')));req.end();
 });
}

type XNode={name:string;attrs:Record<string,string>;text:string;children:XNode[]};
const decode=(v:string)=>v.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g,(raw,k:string)=>{
 if(k==='amp')return '&';if(k==='lt')return '<';if(k==='gt')return '>';if(k==='quot')return '"';if(k==='apos')return "'";
 const n=k.startsWith('#x')?parseInt(k.slice(2),16):parseInt(k.slice(1),10);return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):raw;
});
/** Narrow XML tokenizer: attributes, namespaces, CDATA and text. Rejects DTD/ENTITY and malformed nesting. */
function parseXML(xml:string):XNode{
 if(/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml))throw Error('Feed DTD and XML entity declarations are forbidden');
 const root:XNode={name:'#root',attrs:{},text:'',children:[]},stack=[root];
 const tokens=xml.match(/<\!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<[^>]*>|[^<]+/g)||[];
 if(tokens.join('')!==xml)throw Error('Malformed XML input');
 if(tokens.length>40000)throw Error('Feed XML exceeds parsing complexity limit');
 for(const t of tokens){if(t.startsWith('<?')||t.startsWith('<!--'))continue;
  if(t.startsWith('<![CDATA[')){stack[stack.length-1].text+=t.slice(9,-3);continue;}
  if(t.startsWith('</')){const name=t.slice(2,-1).trim();if(stack.length===1||stack[stack.length-1].name!==name)throw Error('Malformed XML closing tag '+name);stack.pop();continue;}
  if(t.startsWith('<')){
   if(t.startsWith('<!'))throw Error('Unsupported XML declaration');
   const selfClosing=/\/\s*>$/.test(t),body=t.slice(1,t.length-(selfClosing?2:1)).trim(),match=/^([a-zA-Z_][\w:.-]*)([\s\S]*)$/.exec(body);
   if(!match)throw Error('Malformed XML tag');const attrs:Record<string,string>={};
   const attrText=match[2]||'';let cursor=0;const re=/\s+([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gy;
   while(cursor<attrText.length){re.lastIndex=cursor;const a=re.exec(attrText);if(!a){if(attrText.slice(cursor).trim())throw Error('Malformed XML attributes');break;}attrs[a[1]]=decode(a[2]??a[3]??'');cursor=re.lastIndex;}
   const node:XNode={name:match[1],attrs,text:'',children:[]};stack[stack.length-1].children.push(node);
   if(stack.length>32)throw Error('Feed XML nesting limit exceeded');if(!selfClosing)stack.push(node);
  }else stack[stack.length-1].text+=decode(t);
 }
 if(stack.length!==1||root.children.length!==1)throw Error('Malformed or multiple XML root nodes');return root.children[0];
}
const local=(x:string)=>x.split(':').at(-1)?.toLowerCase()||x.toLowerCase();
const children=(n:XNode,key:string)=>n.children.filter(x=>local(x.name)===key.toLowerCase());
const child=(n:XNode,key:string)=>children(n,key)[0];
const content=(n:XNode|undefined):string=>n?((n.text||'')+n.children.map(c=>content(c)).join('')).trim():'';
const field=(n:XNode,keys:string[])=>{for(const k of keys){const x=child(n,k);if(x){const v=content(x);if(v)return v;}}return '';};
function atomLink(item:XNode){const links=children(item,'link');return (links.find(l=>!l.attrs.rel||l.attrs.rel==='alternate')||links[0])?.attrs.href||field(item,['link']);}
function cleaned(value:string,limit=12000){return value.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,limit);}
export function parseFeed(xml:string,config:Record<string,unknown>={},country=''): {format:'rss'|'atom';title:string;items:FeedItem[]}{
 const root=parseXML(xml),isAtom=local(root.name)==='feed',isRSS=['rss','rdf'].includes(local(root.name));if(!isAtom&&!isRSS)throw Error('Document is not RSS 2.0 or Atom');
 const channel=isAtom?root:child(root,'channel')||root;
 const entries=isAtom?children(root,'entry'):children(channel,'item');
 const map=(config.mapping&&typeof config.mapping==='object'&&!Array.isArray(config.mapping)?config.mapping:{}) as Record<string,string>;
 const records:FeedItem[]=entries.slice(0,30).map(item=>{
  const author=child(item,'author');const defaults:FeedItem={title:field(item,['title']),company:field(item,['company','creator'])||field(author||item,['name','author']),city:field(item,['city','location']),country:field(item,['country']),description:field(item,['encoded','description','summary','content']),url:isAtom?atomLink(item):field(item,['link','guid']),externalId:field(item,['guid','id']),remote:field(item,['remote']),salary:field(item,['salary']),postedAt:field(item,['pubDate','published','updated','date']),settingId:'',occupationId:'',workSchedule:field(item,['jobType']),contractType:'',sponsorship:'',relocation:''};
  for(const key of Object.keys(defaults) as (keyof FeedItem)[]){const mapped=map[key];if(mapped&&mapped!==key){const value=field(item,[mapped]);if(value)defaults[key]=value;}}
  defaults.title=cleaned(defaults.title,240);defaults.company=cleaned(defaults.company,240);defaults.description=cleaned(defaults.description);defaults.url=defaults.url.trim().slice(0,1400);defaults.externalId=cleaned(defaults.externalId,180);defaults.city=cleaned(defaults.city,160);
  // Country is never inferred from the source's target-country selector.
  defaults.country=/^[A-Za-z]{2}$/.test(defaults.country)?defaults.country.toUpperCase():'';
  if(country&&defaults.country!==country)defaults.country=defaults.country; // intentional: no fabricated country.
  return defaults;
 });
 return {format:isAtom?'atom':'rss',title:field(channel,['title']).slice(0,200),items:records};
}
export async function inspectFeed(url:string,config:Record<string,unknown>={},country=''):Promise<FeedInspection>{
 const r=await secureFeedGet(url);const parsed=parseFeed(r.body,config,country);
 return {format:parsed.format,title:parsed.title,items:parsed.items.length,sample:parsed.items.slice(0,5),etag:r.etag,lastModified:r.lastModified,notModified:false};
}
export async function collectFeed(source:{endpoint:string;config:unknown;country:string}):Promise<{items:FeedItem[];etag:string|null;lastModified:string|null;unchanged:boolean}>{
 const cfg=source.config&&typeof source.config==='object'&&!Array.isArray(source.config)?source.config as Dict:{};
 const r=await secureFeedGet(source.endpoint,{etag:String(cfg.feedEtag||''),lastModified:String(cfg.feedLastModified||'')});
 if(r.status===304)return {items:[],etag:r.etag,lastModified:r.lastModified,unchanged:true};
 const parsed=parseFeed(r.body,cfg,source.country);return {items:parsed.items,etag:r.etag,lastModified:r.lastModified,unchanged:false};
}
