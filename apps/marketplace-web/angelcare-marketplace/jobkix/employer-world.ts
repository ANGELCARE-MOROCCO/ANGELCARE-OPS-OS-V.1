import { object } from './validation';
import { resolvedEditorialMedia } from './editorial-media';

/** Real workplace representation requires the existing current native approval. */
export function approvedEmployerEdition(edition:Record<string,unknown>|null,employer:Record<string,unknown>):Record<string,unknown>|null{
 if(!edition||edition.kind!=='front')return null;
 const approved=Array.isArray(employer.approvedMediaIds)?employer.approvedMediaIds:[];
 return {...edition,sections:Array.isArray(edition.sections)?edition.sections.map(value=>{const section=object(value),image=resolvedEditorialMedia(section._image);return {...section,_image:image?.source==='native'&&approved.includes(image.id)?image:null};}):[]};
}
