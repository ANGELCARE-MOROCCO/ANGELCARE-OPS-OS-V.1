import type { Metadata } from 'next';

/** Native route metadata owns icon changes and restores the other world's own
 * metadata on navigation. No global favicon, manifest or document-head mutation. */
export function jobkixIcons():Metadata['icons']{
 return {
  icon:[16,32,48].map(size=>({url:`/jobkix/brand/jobkix-favicon-${size}.png`,sizes:`${size}x${size}`,type:'image/png'})),
  shortcut:[{url:'/jobkix/brand/jobkix-favicon-32.png',type:'image/png'}],
  apple:[{url:'/jobkix/brand/jobkix-icon-180.png',sizes:'180x180',type:'image/png'}],
 };
}
