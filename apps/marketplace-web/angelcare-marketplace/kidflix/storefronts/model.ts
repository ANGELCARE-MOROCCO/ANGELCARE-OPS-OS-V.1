import type {ReferenceMetadata} from "../storefront-reference/model";
import {normalizeTestimonials,normalizeDocumentSocialLinks,type DocumentsData}from "../documents/model";
import {LEGACY_THEMES} from "./publisher-legacy";
import {publisherProfile,say} from "./publisher-content";
import {normalizePublisherImages,publisherBindingSlot,upgradeFactoryGallery} from "./publisher-assets";
import type {PublisherImages} from "./PublisherEditorial";
import { defaultGallery, legacyWorldImages, legacyGuidanceImages, worldTile } from "../editorial";
import { normalizeGallery, galleryBindings, type Scene } from "../gallery-contract";
import { WORLDS, tr, world, safeImage, type Locale, type Tri, type Resource, type Catalogue } from '../catalogue';
export const SECTIONS = ['collections','subjects','catalogue','guide','related'] as const;
export type Section = typeof SECTIONS[number];
export const REFERENCE_STOREFRONT_ORDER:Section[]=['catalogue','collections','subjects','guide','related'];
export interface Edition extends PublisherImages {
  documentsTestimonials?:Record<string,unknown>[];
  documentsSocialLinks?:Record<string,string>;
  gallery:Scene[];
  eyebrow:string; headline:string; description:string; hero:string; heroAlt:string;
  guidance:string; guidanceAlt:string; guidanceTitle:string; guidanceBody:string;
  sections:Section[]; density:'comfortable'|'compact'; preview:'cover'|'images';
  featured:string[]; collections:{id:string;title:string;description:string;keys:string[]}[];
  startsAt:string; endsAt:string; mediaBindings:Record<string,string>; adSlots:string[];
}
export type Facts = { counts:Record<string,number>; formats:string[]; narration:boolean; captions:boolean; transcript:boolean; editable:boolean; certificate:boolean };
export type Item = Resource & { facts:Facts; previewImages?:{url:string;alt:string}[]; discovery?:ReferenceMetadata };
export interface StorefrontData { catalogue:Omit<Catalogue,'rows'> & {rows:Item[]}; facets:Record<string,string[]>; edition:Edition; configured:boolean; curated:Item[]; setupRequired?:boolean; documents?:DocumentsData; documentsPortraits?:Record<string,string>; }
export const familyKey=(family:string)=>'kidflix-storefront-'+family;
export const keyOK=(s:string)=>/^[a-z0-9][a-z0-9._-]{1,119}$/.test(s);
export const titles:Record<Section,Tri>={collections:['Handpicked discoveries','Découvertes choisies','اكتشافات مختارة'],subjects:['Follow your curiosity','Suivez votre curiosité','اتبع فضولك'],catalogue:['Your next discovery starts here','Votre prochaine découverte commence ici','اكتشافك القادم يبدأ هنا'],guide:['Make it your kind of moment','À chacun sa belle découverte','لحظتك الجميلة بطريقتك'],related:['Keep the discovery going','Prolongez la découverte','واصل الاكتشاف']};
export const labels = {
  browse:['Explore this world','Explorer cet univers','استكشف هذا العالم'], guide:['Help me choose','Aidez-moi à choisir','ساعدني على الاختيار'],
  preview:['Quick look','Aperçu rapide','نظرة سريعة'], open:['Open resource','Ouvrir la ressource','افتح المورد'],
  empty:['A little space for new discoveries','Une place pour de nouvelles découvertes','مساحة لاكتشافات جديدة'],
  emptyBody:['There are no published resources for this selection yet. You can reset your filters or return to KidFlix.','Aucune ressource publiée pour cette sélection. Vous pouvez réinitialiser les filtres ou revenir à KidFlix.','لا توجد موارد منشورة لهذا الاختيار بعد. يمكنك مسح المرشحات أو العودة إلى كيدفليكس.'],
  reset:['Reset selection','Réinitialiser','إعادة الاختيار'], results:['resources','ressources','موارد'], loading:['Finding your discoveries…','Recherche de vos découvertes…','جارٍ البحث عن اكتشافاتك…'],
  error:['We could not refresh this selection. Your choices are preserved.','Impossible d’actualiser cette sélection. Vos choix sont conservés.','تعذر تحديث هذا الاختيار. اختياراتك محفوظة.'],retry:['Try again','Réessayer','حاول مجدداً'],
  search:['Search this world','Rechercher dans cet univers','ابحث في هذا العالم'], filters:['Refine your discovery','Affiner la découverte','خصص اكتشافك'], all:['Any','Tous','الكل'], sort:['Sort resources','Trier les ressources','رتب الموارد'],
  newest:['Newest discoveries','Dernières découvertes','أحدث الاكتشافات'], alphabetical:['A to Z','De A à Z','ترتيب أبجدي'],close:['Close','Fermer','إغلاق'],
  choose:['Use these choices','Utiliser ces choix','استخدم هذه الاختيارات'], private:['These choices stay in your browser. No form is sent to our team.','Ces choix restent dans votre navigateur. Aucun formulaire n’est envoyé à notre équipe.','تبقى هذه الاختيارات في متصفحك. لا يتم إرسال أي نموذج إلى فريقنا.'],
  subject:['Subject','Thème','الموضوع'],skill:['Skill','Compétence','المهارة'],age:['Age','Âge','العمر'],format:['Available file','Fichier disponible','الملف المتاح'],audience:['For whom','Pour qui','لمن'],difficulty:['Discovery level','Niveau','المستوى'],duration:['Minutes available','Temps disponible','الوقت المتاح'],
  previous:['Previous','Précédent','السابق'],next:['Next','Suivant','التالي'],minutes:['min','min','د'],years:['years','ans','سنوات'],
  narration:['Narration','Narration','سرد صوتي'],captions:['Captions','Sous-titres','ترجمة مكتوبة'],transcript:['Transcript','Transcription','نص مكتوب'],editable:['Personal planner','Planning personnel','مخطط شخصي'],certificate:['Optional certificate request','Demande de certificat en option','طلب شهادة اختياري'],
  lessons:['lessons','leçons','دروس'],episodes:['episodes','épisodes','حلقات'],segments:['segments','séquences','مقاطع'],
  save:['Save discovery','Garder cette découverte','احفظ الاكتشاف'],saved:['Saved','Enregistré','محفوظ'],pages:['pages','pages','صفحات'],cards:['cards','cartes','بطاقات'],units:['chapters','chapitres','فصول'],questions:['questions','questions','أسئلة'],frames:['slides','diapositives','شرائح'],steps:['steps','étapes','خطوات'],items:['parts','parties','أجزاء'],modules:['modules','modules','وحدات'],
} satisfies Record<string,Tri>;
export const L=(key:keyof typeof labels,l:Locale)=>tr(labels[key]||labels.items,l);
export function normalize(v:unknown,locale:Locale,family:string):Edition {
 const w=world(family); if(!w)throw Error('Unknown family');
 const x=v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
 const text=(k:string,max:number,d='')=>typeof x[k]==='string'?x[k].trim().slice(0,max):d;
 const list=(value:unknown,max=96)=>Array.isArray(value)?[...new Set(value.filter((s):s is string=>typeof s==='string'&&keyOK(s)))].slice(0,max):[];
 let gallery=normalizeGallery(x.gallery,family,{hero:text("hero",2048,legacyWorldImages[family]),alt:text("heroAlt",300),bound:Boolean(x.mediaBindings?.hero)});
 const edition:Edition={...normalizePublisherImages({}, {},family,locale,safeImage),gallery,eyebrow:text('eyebrow',100,'KidFlix · '+tr(w.short,locale)),headline:text('headline',180,tr(w.title,locale)),description:text('description',600,tr(w.invitation,locale)),hero:text('hero',2048,w.image),heroAlt:text('heroAlt',300),guidance:text('guidance',2048,w.image),guidanceAlt:text('guidanceAlt',300),guidanceTitle:text('guidanceTitle',180,tr(titles.guide,locale)),guidanceBody:text('guidanceBody',700,tr(w.description,locale)),sections:JSON.stringify(x.sections)===JSON.stringify(SECTIONS)?[...REFERENCE_STOREFRONT_ORDER]:Array.isArray(x.sections)?[...new Set(x.sections.filter((k:any)=>SECTIONS.includes(k))) ] as Section[]:[...REFERENCE_STOREFRONT_ORDER],density:x.density==='compact'?'compact':'comfortable',preview:x.preview==='images'?'images':'cover',featured:list(x.featured),collections:[],startsAt:text('startsAt',40),endsAt:text('endsAt',40),mediaBindings:{},adSlots:Array.isArray(x.adSlots)?[...new Set(x.adSlots.filter((s:any)=>['after-opening','after-catalogue','before-guidance'].includes(s))) ] as string[]:[]};
 for(const k of ['hero','guidance'] as const)if(!safeImage(edition[k]))throw Error('Choose a valid image URL');
 for(const k of ['startsAt','endsAt'] as const)if(edition[k]&&!Number.isFinite(Date.parse(edition[k])))throw Error('Use a valid publication time');
 if(edition.startsAt&&edition.endsAt&&Date.parse(edition.endsAt)<=Date.parse(edition.startsAt))throw Error('End must follow start');
 for(const [k,id]of Object.entries(x.mediaBindings||{}))if((k.startsWith('scene:')||(['hero','guidance'].includes(k)||publisherBindingSlot(k)))&&typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))edition.mediaBindings[k]=id;
 for(const c of Array.isArray(x.collections)?x.collections.slice(0,8):[])if(c&&typeof c.title==='string'&&c.title.trim()&&keyOK(String(c.id||'')))edition.collections.push({id:c.id,title:c.title.trim().slice(0,120),description:String(c.description||'').slice(0,350),keys:list(c.keys)});
 edition.mediaBindings=galleryBindings(edition.mediaBindings,gallery,x.gallery===undefined);
 for(const [slot,id] of Object.entries(x.mediaBindings||{}))if(publisherBindingSlot(slot)&&typeof id==="string"&&/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))edition.mediaBindings[slot]=id;
 gallery=upgradeFactoryGallery(gallery,edition.mediaBindings,family);edition.gallery=gallery;edition.hero=gallery[0].desktop;edition.heroAlt=gallery[0].descriptions[locale];
 if(!edition.mediaBindings.guidance && (edition.guidance===legacyWorldImages[family] || edition.guidance===legacyGuidanceImages[family]))edition.guidance=worldTile(family);
 if(!edition.headline)throw Error('Name this storefront');
 const used=new Set(edition.featured);for(const c of edition.collections)c.keys=c.keys.filter(k=>{if(used.has(k))return true;if(used.size>=96)return false;used.add(k);return true;});
 if(!edition.sections.includes('catalogue'))throw Error('The resource catalogue is required.');
 const allKeys=new Set([...(Array.isArray(x.featured)?x.featured:[]),...(Array.isArray(x.collections)?x.collections:[]).flatMap((c:any)=>Array.isArray(c.keys)?c.keys:[])]);if(allKeys.size>96)throw Error('Choose at most 96 unique resources for one edition.');
 const old=LEGACY_THEMES[family],profile=publisherProfile(family);
 if(old){if(edition.eyebrow===tr(old.tag,locale))edition.eyebrow='KidFlix · '+tr(w.short,locale);if(edition.headline===tr(old.title,locale))edition.headline=say(profile.title,locale);if(edition.description===tr(old.body,locale))edition.description=say(profile.intro,locale);if(edition.guidanceTitle===tr(old.tips[0],locale))edition.guidanceTitle=say(profile.steps[0],locale);if(edition.guidanceBody===tr(old.body,locale))edition.guidanceBody=say(profile.intro,locale);}
 if(family==='documents'){edition.documentsTestimonials=normalizeTestimonials(x.documentsTestimonials);edition.documentsSocialLinks=normalizeDocumentSocialLinks(x.documentsSocialLinks);}
 return {...edition,...normalizePublisherImages(x,edition.mediaBindings,family,locale,safeImage)} as Edition;
}
export const blankFacts=():Facts=>({counts:{},formats:[],narration:false,captions:false,transcript:false,editable:false,certificate:false});

export function optionText(key:string,value:string,locale:Locale){const map:Record<string,Tri>={child:['Children','Enfants','الأطفال'],parent:['Parents','Parents','الآباء'],educator:['Educators','Éducateurs','المربّون'],professional:['Professionals','Professionnels','المهنيون'],school:['Schools','Écoles','المدارس'],introductory:['First discoveries','Premières découvertes','الاكتشافات الأولى'],developing:['Growing confidence','En progression','ثقة متنامية'],confident:['Confident explorer','À l’aise','مستكشف واثق'],advanced:['Further discovery','Pour aller plus loin','اكتشاف متقدم']};return ['audience','difficulty'].includes(key)&&map[value]?tr(map[value],locale):value;}
