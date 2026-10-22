import { isLocale,type Locale } from './contracts';
/** Ingress hints belong to JOBKIX. Never trust copies supplied by a caller. */
export function withoutJobkixPresentation(headers:Headers):Headers{
 const forwarded=new Headers(headers);
 forwarded.delete('x-jobkix-path');forwarded.delete('x-jobkix-locale');
 return forwarded;
}
/** Presentation hints only. Authentication and permissions never use these headers. */
export function jobkixPathLocale(path:string):Locale|null{
 if(!/^\/jobkix(?:\/|$)/.test(path))return null;const candidate=path.split('/')[2]||'';return isLocale(candidate)?candidate:'en';
}
export function jobkixPresentation(headers:Pick<Headers,'get'>):{locale:Locale;path:string}|null{
 const path=headers.get('x-jobkix-path'),locale=headers.get('x-jobkix-locale');
 if(!path||/[\u0000-\u0020\\]/.test(path)||!locale||!isLocale(locale)||jobkixPathLocale(path)!==locale)return null;
 return {locale,path};
}
