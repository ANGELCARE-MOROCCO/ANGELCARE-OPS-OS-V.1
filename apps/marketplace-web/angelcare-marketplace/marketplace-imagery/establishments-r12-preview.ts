import { pagePath } from "./pages";
import { resolveSlot } from "./registry";
/** Target the actual live storefront route and conditional state within the existing Studio iframe.
 * This is preview-only: no admin UI or published page navigation is modified.
 */
export function imageryPlacementPreviewUrl(page:string,locale:"fr"|"en"|"ar",selected:string):string {
 const pathname=pagePath(page,locale);
 const params=new URLSearchParams({imageryPreview:"1"});
 if(page!=="establishments"||!resolveSlot(page,selected))return pathname+"?"+params.toString();
 params.set("imageryPlacement",selected);
 const slot=selected.slice("establishments.".length);
 if(slot.startsWith("conseil-r6."))return pathname+"?"+params.toString()+"#conseil";
 if(slot.startsWith("journey-partner.")||slot.startsWith("journey-r4.partner-"))return pathname+"?"+params.toString()+"#partner-os";
 if(slot.startsWith("equipment-")||slot.startsWith("journey-r4.products-")){
  const descriptor=resolveSlot(page,selected);
  const condition=descriptor?.condition||"";
  const fromCondition=condition.match(/(?:Opened within domain|Domain) ([a-z0-9-]+)(?: opened)?/);
  let domain=fromCondition?.[1]||"";
  if(!domain){
   const m=slot.match(/^equipment-r10\.(?:feature|related)\.([a-z0-9-]+)/);
   if(m)domain=m[1];
   else {const q=slot.match(/^equipment-r9\.([a-z0-9-]+)\./);if(q)domain=q[1];}
  }
  if(domain&&/^[a-z0-9-]{1,80}$/.test(domain))params.set("equipmentDomain",domain);
  return pathname+"?"+params.toString()+"#produits";
 }
 return pathname+"?"+params.toString();
}
