import type {Scene} from "../gallery-contract";
/** Category artwork is an editorial opening, never a published resource cover. */
export function referenceFactoryGallery(family:string):Scene[]{return [{id:`reference-${family}-01`,desktop:`/kidflix/categories-reference-r1/${family}-hero.png`,mobile:`/kidflix/categories-reference-r1/${family}-hero.png`,focal:{x:50,y:50},mobileFocal:{x:85,y:50},descriptions:{en:"An editorial scene introducing this learning category.",fr:"Une scène éditoriale présentant cet univers d’apprentissage.",ar:"مشهد تحريري يقدم فئة التعلم هذه."}}];}
