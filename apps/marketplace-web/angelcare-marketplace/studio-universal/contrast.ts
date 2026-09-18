'use client'

const named:Record<string,string>={white:'#ffffff',black:'#000000',transparent:'#00000000'}
function hexToRgb(value:string){let v=value.trim().toLowerCase();if(named[v])v=named[v];if(/^#[0-9a-f]{3}$/i.test(v))v='#'+v.slice(1).split('').map(x=>x+x).join('');if(!/^#[0-9a-f]{6}$/i.test(v))return null;return{r:parseInt(v.slice(1,3),16),g:parseInt(v.slice(3,5),16),b:parseInt(v.slice(5,7),16)}}
function channel(value:number){const n=value/255;return n<=.03928?n/12.92:Math.pow((n+.055)/1.055,2.4)}
function luminance(rgb:{r:number;g:number;b:number}){return .2126*channel(rgb.r)+.7152*channel(rgb.g)+.0722*channel(rgb.b)}
export function studioContrastRatio(foreground:string,background:string){const fg=hexToRgb(foreground),bg=hexToRgb(background);if(!fg||!bg)return null;const a=luminance(fg),b=luminance(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)}
export function studioContrastReview(foreground?:string,background?:string){if(!foreground||!background)return null;const ratio=studioContrastRatio(foreground,background);if(ratio==null)return null;return{ratio:Number(ratio.toFixed(2)),passesNormal:ratio>=4.5,passesLarge:ratio>=3}}
