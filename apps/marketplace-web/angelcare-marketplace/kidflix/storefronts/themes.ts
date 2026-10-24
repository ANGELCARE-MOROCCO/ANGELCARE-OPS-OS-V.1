import {tr,world,type Locale} from '../catalogue';
import {normalize,type Edition} from './model';
import {publisherProfile,art} from './publisher-content';
import {publisherGallery} from './publisher-assets';
import {LEGACY_THEMES} from './publisher-legacy';
export function theme(family:string){const old=LEGACY_THEMES[family]||LEGACY_THEMES.documents,p=publisherProfile(family);return {...old,tag:p.topics[0],title:p.title,body:p.intro,tips:p.steps};}
export function defaults(family:string,locale:Locale):Edition{const w=world(family)!,p=publisherProfile(family);return normalize({eyebrow:'KidFlix · '+tr(w.short,locale),headline:tr(p.title,locale),description:tr(p.intro,locale),gallery:publisherGallery(family),guidance:art(family,'guidance'),guidanceTitle:tr(p.steps[0],locale),guidanceBody:tr(p.intro,locale)},locale,family);}
