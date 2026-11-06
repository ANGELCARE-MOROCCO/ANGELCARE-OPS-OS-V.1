"use client";
import { useContext, type ImgHTMLAttributes } from 'react';
import { Artwork, ImageryContext } from './Runtime';
import { resolveSlot } from './registry';
export type ManagedImageProps=ImgHTMLAttributes<HTMLImageElement>&{slot?:string};
/** Only explicitly instrumented editorial placements can consume an override. */
export function ManagedImage({slot,...props}:ManagedImageProps){
 const {page}=useContext(ImageryContext),key=slot?(slot.startsWith(page+'.')?slot:page+'.'+slot):'',descriptor=resolveSlot(page,key);
 if(!descriptor)return <img {...props}/>;
 return <Artwork {...props} slot={key} section={descriptor.section} label={descriptor.label} condition={descriptor.condition} sequence={descriptor.sequence}/>;
}
