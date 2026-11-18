import rules from './slot-rules.json';
import seeds from './slot-seeds.json';
import establishmentR12 from './establishments-r12-slots.json';
import type { Descriptor } from './model';
export type Slot = Descriptor;
/** Exact, source-audited registered placements, never guessed by a wildcard. */
const modernById = new Map((establishmentR12 as Slot[]).map(slot => [slot.id,slot]));
/** Both the historical approved rules and exact R12 placements remain under the
 * same establishments publication key, permissions, draft and live snapshots. */
export function resolveSlot(page:string,id:string):Slot|undefined {
 if(typeof id!=='string'||!id.startsWith(page+'.'))return;
 if(page==='establishments'){
  const modern=modernById.get(id);
  if(modern)return modern;
 }
 const key=id.slice(page.length+1);
 const rule=rules.find(r=>r.pages.includes(page)&&(key===r.key&&!r.dynamic||r.dynamic&&key.startsWith(r.key+'.')&&/^[a-z0-9-]{1,80}$/.test(key.slice(r.key.length+1))));
 if(!rule)return;
 const seed=(seeds as Slot[]).find(s=>s.id===id);
 return {id,section:rule.section,label:rule.label,sequence:rule.sequence,owner:'editable',...rule.source?{source:rule.source}:{},...seed};
}
export function pageSlots(page:string):Slot[]{
 const seeded=(seeds as Slot[]).filter(s=>s.id.startsWith(page+'.'));
 const statics=rules.filter(r=>r.pages.includes(page)&&!r.dynamic).map(r=>resolveSlot(page,page+'.'+r.key)!);
 const modern=page==='establishments'?establishmentR12 as Slot[]:[];
 return [...new Map([...seeded,...statics,...modern].map(s=>[s.id,s])).values()];
}
