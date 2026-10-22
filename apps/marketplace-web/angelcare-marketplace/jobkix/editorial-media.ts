import { JobkixFault } from './contracts';
import { object,text,uuid,safeUrl } from './validation';
import { isEditorialScene } from './editorial-assets';
export interface FocalPoint{x:number;y:number}
export interface EditorialMedia{source:'native'|'editorial';id:string;alt:string;desktopFocal:FocalPoint;mobileFocal:FocalPoint}
export interface ResolvedEditorialMedia extends EditorialMedia{url:string;mobileUrl:string;width:number;height:number}
function focal(value:unknown):FocalPoint{const point=object(value);if(Object.keys(point).some(key=>!['x','y'].includes(key))||typeof point.x!=='number'||typeof point.y!=='number'||!Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<0||point.x>100||point.y<0||point.y>100)throw new JobkixFault('INVALID_INPUT',{focal:'range'});return {x:point.x,y:point.y};}
export function editorialMedia(value:unknown):EditorialMedia|null{
 if(value===null||value===undefined)return null;const media=object(value);if(Object.keys(media).some(key=>!['source','id','alt','desktopFocal','mobileFocal'].includes(key))||media.source!=='native'&&media.source!=='editorial')throw new JobkixFault('INVALID_INPUT');
 const id=media.source==='native'?uuid(media.id):text(media.id,'media.id',1,120);if(media.source==='editorial'&&!isEditorialScene(id))throw new JobkixFault('INVALID_INPUT');
 const desktopFocal=focal(media.desktopFocal??{x:50,y:45});return {source:media.source,id,alt:text(media.alt,'media.alt',1,500),desktopFocal,mobileFocal:focal(media.mobileFocal??desktopFocal)};
}
export function editorialPublicUrl(input:unknown):string{const url=safeUrl(input,'image'),parsed=new URL(url,'https://jobkix.invalid');if(/^[0-9.]+$/.test(parsed.hostname)||parsed.hostname.includes(':')||!parsed.hostname.includes('.')||/\.(?:local|internal)$/i.test(parsed.hostname)||Array.from(parsed.searchParams.keys()).some(key=>/token|signature|credential|authorization/i.test(key)))throw new JobkixFault('INVALID_INPUT');return url;}
export function resolvedEditorialMedia(value:unknown):ResolvedEditorialMedia|null{if(!value||typeof value!=='object'||Array.isArray(value))return null;const row=object(value);try{const media=editorialMedia({source:row.source,id:row.id,alt:row.alt,desktopFocal:row.desktopFocal,mobileFocal:row.mobileFocal});if(!media||typeof row.width!=='number'||typeof row.height!=='number'||!Number.isFinite(row.width)||!Number.isFinite(row.height)||row.width<=0||row.height<=0)return null;return {...media,url:editorialPublicUrl(row.url),mobileUrl:editorialPublicUrl(row.mobileUrl),width:row.width,height:row.height};}catch{return null;}}
