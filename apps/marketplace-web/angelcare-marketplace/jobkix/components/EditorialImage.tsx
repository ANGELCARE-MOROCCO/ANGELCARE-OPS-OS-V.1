import type { CSSProperties } from 'react';
import { resolvedEditorialMedia,type ResolvedEditorialMedia } from '../editorial-media';
import s from '../jobkix.module.css';
export function EditorialImage({image,priority=false}:{image:ResolvedEditorialMedia;priority?:boolean}){
 const style:CSSProperties&{'--image-desktop-focal':string;'--image-mobile-focal':string}={'--image-desktop-focal':`${image.desktopFocal.x}% ${image.desktopFocal.y}%`,'--image-mobile-focal':`${image.mobileFocal.x}% ${image.mobileFocal.y}%`};
 return <picture className={s.editorialImage} style={style}><source media="(max-width:767px)" srcSet={image.mobileUrl||image.url}/><img src={image.url} alt={image.alt} width={image.width} height={image.height} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':undefined}/></picture>;
}
export function EditorialFigure({value}:{value:unknown}){const image=resolvedEditorialMedia(value);return image?<EditorialImage image={image}/>:null;}
