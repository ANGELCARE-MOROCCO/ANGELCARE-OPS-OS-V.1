import {FOCUS} from "../storefront-reference/taxonomy";
import {referenceFactoryGallery} from "../storefront-reference/factory";
import {defaultGallery,legacyWorldImages,legacyGuidanceImages,worldTile} from '../editorial';
import {art,publisherProfile,say,type PublisherLocale} from './publisher-content';
import type {PublisherScene} from './PublisherGallery';

export const PUBLISHER_IMAGE_SLOTS=['cover','guidance','reference','detail'] as const;
export type PublisherImageSlot=typeof PUBLISHER_IMAGE_SLOTS[number];
export function publisherGallery(family:string):PublisherScene[]{
 const p=publisherProfile(family);
 return Array.from({length:6},(_,i)=>({id:`publisher-${family}-${i+1}`,desktop:art(family,`hero-0${i+1}`),mobile:art(family,`hero-0${i+1}`,true),focal:{x:50,y:50},mobileFocal:{x:50,y:50},descriptions:{en:`Editorial materials exploring ${say(p.topics[i],'en').toLowerCase()}.`,fr:`Supports éditoriaux pour explorer : ${say(p.topics[i],'fr')}.`,ar:`مواد تحريرية لاستكشاف ${say(p.topics[i],'ar')}.`}}));
}
/** Only an exact, unbound factory deck can be replaced. Custom order, captions and focal points are significant. */
export function upgradeFactoryGallery(gallery:PublisherScene[],bindings:Record<string,string>,family:string):PublisherScene[]{
 if(Object.keys(bindings).some(k=>k==='hero'||k==='heroMobile'||k.startsWith('scene:')))return gallery;
 const factory=defaultGallery(family);
 const identity=(s:PublisherScene)=>[s.id,s.desktop,s.mobile,s.descriptions.en,s.descriptions.fr,s.descriptions.ar,s.focal.x,s.focal.y,s.mobileFocal.x,s.mobileFocal.y];
 const matches=[factory,publisherGallery(family)].some(deck=>JSON.stringify(gallery.map(identity))===JSON.stringify(deck.map(identity)));
 return matches?(FOCUS[family]?referenceFactoryGallery(family):publisherGallery(family)):gallery;
}
export function defaultImageDescription(_family:string,role:PublisherImageSlot,locale:PublisherLocale){
 const descriptions={cover:['Illustrated editorial resource cover and coordinated materials.','Couverture éditoriale illustrée et supports coordonnés.','غلاف تحريري مصور ومواد متناسقة.'],guidance:['Educational reference materials arranged to prepare a practical session.','Supports pédagogiques organisés pour préparer une séance pratique.','مواد مرجعية تعليمية مرتبة للتحضير لجلسة عملية.'],reference:['Editorial reference board organizing complementary educational materials.','Planche de référence éditoriale regroupant des supports pédagogiques complémentaires.','لوحة مرجعية تحريرية تنظم مواد تعليمية متكاملة.'],detail:['Close-up of practical resource materials and their structure.','Vue rapprochée des supports pratiques et de leur structure.','صورة قريبة للمواد العملية وبنيتها.']} as const;
 return say(descriptions[role],locale);
}
export function normalizePublisherImages(input:Record<string,unknown>,bindings:Record<string,string>,family:string,locale:PublisherLocale,safeImage:(url:string)=>boolean){
 const out:Record<string,string>={};
 for(const slot of PUBLISHER_IMAGE_SLOTS){
  const provided=typeof input[slot]==='string'?(input[slot] as string).trim().slice(0,2048):'';
  const legacy=slot==='guidance'&&!bindings.guidance&&[legacyWorldImages[family],legacyGuidanceImages[family],worldTile(family)].includes(provided);
  const chosen=provided&&!legacy?provided:art(family,slot);
  if(!safeImage(chosen))throw Error('Choose a valid editorial image URL');
  out[slot]=chosen;
  const key=slot+'Mobile',mobile=typeof input[key]==='string'?(input[key] as string).trim().slice(0,2048):'';
  if(mobile&&!safeImage(mobile))throw Error('Choose a valid mobile editorial image URL');
  // A custom desktop image must never silently acquire an unrelated factory mobile image.
  out[key]=mobile||(chosen===art(family,slot)?art(family,slot,true):'');
  const alt=typeof input[slot+'Alt']==='string'?(input[slot+'Alt'] as string).trim().slice(0,500):'';
  out[slot+'Alt']=alt||defaultImageDescription(family,slot,locale);
 }
 return {cover:out.cover,coverMobile:out.coverMobile,coverAlt:out.coverAlt,guidance:out.guidance,guidanceMobile:out.guidanceMobile,guidanceAlt:out.guidanceAlt,reference:out.reference,referenceMobile:out.referenceMobile,referenceAlt:out.referenceAlt,detail:out.detail,detailMobile:out.detailMobile,detailAlt:out.detailAlt};
}
export function publisherBindingSlot(slot:string){return PUBLISHER_IMAGE_SLOTS.some(s=>slot===s||slot===s+'Mobile');}
export function publisherRelatedCover(family:string,current:string){return [legacyWorldImages[family],legacyGuidanceImages[family],worldTile(family)].includes(current)?art(family,'cover'):current;}
