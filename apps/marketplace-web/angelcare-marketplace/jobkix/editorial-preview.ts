export type EditorialPreviewTarget={kind:'legal'|'guide'|'help';slug:string}|{kind:'setting'|'occupation';slug:string}|{kind:'home'|'abroad'|'methodology'}|{kind:'journey';screen:'P17'|'P18'|'P19'}|{kind:'support';screen:'P20'|'P23'|'P24'}|{kind:'country';country:string}|{kind:'city';country:string;cityKey:string}|{kind:'employer';id:string}|null;
/** A private draft must use its actual public screen, never an unrelated document layout. */
export function editorialPreviewTarget(kind:string,slug:string):EditorialPreviewTarget{
 if(kind==='legal'&&/^[a-z0-9][a-z0-9-]{1,100}$/.test(slug))return {kind:'legal',slug};
 if(kind==='guide'&&/^[a-z0-9][a-z0-9-]{1,179}$/.test(slug))return {kind:'guide',slug};
 if(kind==='help'&&slug!=='contact'&&/^[a-z0-9][a-z0-9-]{1,179}$/.test(slug))return {kind:'help',slug};
 if(kind==='trust'&&slug==='reputation-methodology')return {kind:'methodology'};
 if(kind==='trust'&&slug==='trust-safety')return {kind:'support',screen:'P20'};
 if((kind==='front'||kind==='help')&&slug==='contact')return {kind:'support',screen:'P23'};
 if(kind==='front'){
  if(slug==='home')return {kind:'home'};
  if(slug==='careers-abroad')return {kind:'abroad'};
  if(slug==='about')return {kind:'support',screen:'P24'};
  if(slug==='for-jobseekers')return {kind:'journey',screen:'P17'};
  if(slug==='for-employers')return {kind:'journey',screen:'P18'};
  if(slug==='how-it-works')return {kind:'journey',screen:'P19'};
  if(/^employer\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug))return {kind:'employer',id:slug.slice(9)};
 }
 const country=slug.match(/^country\/([a-z]{2})$/);if(kind==='country'&&country)return {kind:'country',country:country[1]};
 const city=slug.match(/^city\/([a-z]{2})\/([a-f0-9]{16})$/);if(kind==='city'&&city)return {kind:'city',country:city[1],cityKey:city[2]};
 const pieces=slug.split('/');if(pieces.length!==2||!/^[a-z0-9][a-z0-9-]{1,100}$/.test(pieces[1]))return null;
 if(kind==='sector'&&pieces[0]==='sectors')return {kind:'setting',slug:pieces[1]};
 if(kind==='profession'&&pieces[0]==='professions')return {kind:'occupation',slug:pieces[1]};
 return null;
}
