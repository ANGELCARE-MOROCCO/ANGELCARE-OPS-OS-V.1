import type {PartnerLocale} from "./Locale";

/** Language switching preserves establishment, territory, chapter, selected domain,
 * and the special dedicated Partner OS route. It must never send equipment
 * visitors to the marketplace homepage simply because a hash changed. */
export function partnerLocaleHref(
 locale:PartnerLocale,pathname:string,search="",hash=""
){
 const dedicated=/^\/angelcare-marketplace\/(fr|en|ar)\/establishments\/partner-os\/?$/.test(pathname);
 const established=/^\/angelcare-marketplace\/(fr|en|ar)\/establishments\/?$/.test(pathname);
 const query=search.startsWith("?")?search:"";
 const chapter=hash.startsWith("#")?hash:"";
 if(dedicated)return `/angelcare-marketplace/${locale}/establishments/partner-os${query}${chapter}`;
 if(established){
  if(/^#partner-os(?:\/|$)/.test(chapter))
   return `/angelcare-marketplace/${locale}/establishments/partner-os${query}${chapter}`;
  return `/angelcare-marketplace/${locale}/establishments${query}${chapter||"#produits"}`;
 }
 return `/angelcare-marketplace/${locale}`;
}
