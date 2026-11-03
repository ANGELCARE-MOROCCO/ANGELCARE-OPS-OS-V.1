'use client';
import {useEffect,useState} from 'react';
import st from './studio-ultimate.module.css';
export type Selection={selector:string;tag:string;label:string;width:number;height:number;styles:{color:string;backgroundColor:string;fontSize:string;borderRadius:string;padding:string}};
const KEYS=['color','backgroundColor','fontSize','borderRadius','padding'] as const;
export type VisualProperty=typeof KEYS[number];
export function StudioVisualInspector({locale,enabled,selection,onToggle,onApply,onSave,disabled}:{locale:string;enabled:boolean;selection:Selection|null;onToggle:(v:boolean)=>void;onApply:(key:VisualProperty,value:string)=>void;onSave:(items:Partial<Record<VisualProperty,string>>,selector:string)=>Promise<void>;disabled:boolean}){
 const [pending,setPending]=useState<Partial<Record<VisualProperty,string>>>({}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const T=(en:string,fr:string,ar:string)=>locale==='fr'?fr:locale==='ar'?ar:en;
 useEffect(()=>{setPending({})},[selection?.selector]);
 async function save(){if(!selection?.selector||!Object.keys(pending).length)return;setBusy(true);setError('');try{await onSave(pending,selection.selector);setPending({})}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <aside className={st.panel}>
  <div className={st.heading}><div><span className={st.eyebrow}>PREVIEW · PROPERTY INSPECTOR</span><h4>{T('Inspect visual elements','Inspecter les éléments visuels','فحص العناصر المرئية')}</h4><p>{T('Select stable elements in the real running preview.','Sélectionnez les éléments stables dans l’aperçu réel.','حدد العناصر الثابتة في المعاينة الفعلية.')}</p></div><button type="button" className={st.primaryButton} aria-pressed={enabled} onClick={()=>{setPending({});onToggle(!enabled)}}>{enabled?T('Stop selecting','Arrêter la sélection','إيقاف التحديد'):T('Select in preview','Sélectionner dans l’aperçu','تحديد في المعاينة')}</button></div>
  {selection?<>
   <div className={st.selectionSummary}><strong>{selection.label||selection.tag}</strong><code>{selection.selector||T('No stable selector','Sélecteur non stable','محدد غير ثابت')}</code><small>{selection.tag} · {selection.width}×{selection.height}px</small></div>
   {KEYS.map(key=><label key={key} className={st.property}><span>{key.replace(/([A-Z])/g,' $1')}</span><input aria-label={key} value={pending[key]??selection.styles[key]??''} onChange={e=>{const value=e.target.value.slice(0,80);setPending(old=>({...old,[key]:value}));onApply(key,value)}} disabled={!enabled||disabled||busy}/></label>)}
   {!selection.selector&&<p className={st.note}>{T('Preview-only selection: add an id or data-kf-edit="name" to this HTML element to make changes permanent.','Sélection limitée à l’aperçu : ajoutez id ou data-kf-edit="nom" à cet élément pour enregistrer les propriétés.','للحفظ أضف معرفًا ثابتًا للعنصر.')}</p>}
   <button type="button" className={st.primaryButton} onClick={()=>void save()} disabled={disabled||busy||!selection.selector||!Object.keys(pending).length}>{busy?T('Creating revision…','Création de la révision…','جارٍ الحفظ…'):T('Save visual changes as new revision','Enregistrer les styles en nouvelle révision','حفظ التغييرات في إصدار جديد')}</button>
  </>:<p className={st.note}>{T('Turn on selection, then click an identifiable element inside the real preview.','Activez la sélection, puis cliquez sur un élément identifiable dans l’aperçu.','فعّل التحديد ثم انقر على عنصر في المعاينة.')}</p>}
  {error&&<p role="alert" className={st.error}>{error}</p>}
  <p className={st.note}>{T('No visual edit overwrites the current published experience. Saving creates an independently validated package.','Les modifications restent des révisions indépendantes et vérifiées. Rien n’écrase la publication actuelle.','الحفظ ينشئ إصدارًا مستقلاً؛ لا يتغير المنشور.')}</p>
 </aside>;
}
