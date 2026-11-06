import rules from './slot-rules.json';
import seeds from './slot-seeds.json';
import type { Descriptor } from './model';
export type Slot = Descriptor;
/** A compiled source-placement registry, never arbitrary caller-defined page IDs. */
export function resolveSlot(page:string,id:string):Slot|undefined {
 if(typeof id!=='string'||!id.startsWith(page+'.'))return;
 const key=id.slice(page.length+1);
 const rule=rules.find(r=>r.pages.includes(page)&&(key===r.key&&!r.dynamic||r.dynamic&&key.startsWith(r.key+'.')&&/^[a-z0-9-]{1,80}$/.test(key.slice(r.key.length+1))));
 if(!rule)return;
 const seed=(seeds as Slot[]).find(s=>s.id===id);
 return {id,section:rule.section,label:rule.label,sequence:rule.sequence,owner:'editable',...rule.source?{source:rule.source}:{},...seed};
}
export function pageSlots(page:string):Slot[]{
 const seeded=(seeds as Slot[]).filter(s=>s.id.startsWith(page+'.'));
 const statics=rules.filter(r=>r.pages.includes(page)&&!r.dynamic).map(r=>resolveSlot(page,page+'.'+r.key)!);
 return [...new Map([...seeded,...statics].map(s=>[s.id,s])).values()];
}
