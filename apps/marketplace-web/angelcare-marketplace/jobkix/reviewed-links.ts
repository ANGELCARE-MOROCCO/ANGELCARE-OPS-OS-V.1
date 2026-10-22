export function reviewedLink(value:string){
 if(/^mailto:[^\s@?]+@[^\s@?]+\.[^\s@?]+$/.test(value))return value;
 if(/^tel:\+[1-9][0-9]{5,14}$/.test(value))return value;
 try{const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password)return url.href;}catch{}
 return null;
}
export function reviewedSegments(value:string){
 const segments:{text:string;href:string|null}[]=[],pattern=/\b(?:https:\/\/|mailto:|tel:)[^\s<>]+/g;let from=0;
 for(const match of value.matchAll(pattern)){const offset=match.index;if(offset>from)segments.push({text:value.slice(from,offset),href:null});const candidate=match[0].replace(/[),.;]+$/,''),href=reviewedLink(candidate);segments.push({text:candidate,href});const suffix=match[0].slice(candidate.length);if(suffix)segments.push({text:suffix,href:null});from=offset+match[0].length;}
 if(from<value.length)segments.push({text:value.slice(from),href:null});return segments;
}
