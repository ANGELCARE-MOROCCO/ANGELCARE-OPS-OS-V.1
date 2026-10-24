"use client";
import {publisherGallery} from "./storefronts/publisher-assets";
import { Button, Field, T, useUI } from "../digital-customer-experience/components/ui";
import s from "../digital-customer-experience/components/workspace.module.css";
import { NativeImagePicker } from "./StudioPickers";
import { defaultHomeGallery } from "./home-imagery";
import { galleryBindings, sceneSlot, type Scene } from "./gallery-contract";
import { tr } from "./catalogue";
export function GalleryEditor({world,scenes,bindings,onChange,disabled=false}:{world:string;scenes:Scene[];bindings:Record<string,string>;onChange:(scenes:Scene[],bindings:Record<string,string>)=>void;disabled?:boolean}) {
  const {locale}=useUI();
  const maxScenes = world === "home" ? 12 : 6;
  const defaults = world === "home" ? defaultHomeGallery() : publisherGallery(world);
  function update(next:Scene[],nextBindings=bindings){onChange(next,galleryBindings(nextBindings,next));}
  function patch(id:string,value:Partial<Scene>,source?:"desktop"|"mobile"){
    const clean={...bindings};if(source)delete clean[sceneSlot(id,source)];
    update(scenes.map(scene=>scene.id===id?{...scene,...value}:scene),clean);
  }
  return <fieldset disabled={disabled} className={s.advanced} style={{minWidth:0}}><legend>{tr([`Opening gallery · 3–${maxScenes} scenes`, `Galerie d’ouverture · 3 à ${maxScenes} images`, `معرض الافتتاح · من 3 إلى ${maxScenes} مشهدًا`],locale)}</legend>
    <p className={s.subtitle}><T v={["Scene identities stay attached to native media when you reorder. Describe each scene in all three languages. Mobile images are optional.","Les identités suivent les médias natifs lors du réordonnancement. Décrivez chaque image dans les trois langues. Les images mobiles sont optionnelles.","تتبع هوية المشهد وسائطه الأصلية عند تغيير الترتيب. صف كل مشهد باللغات الثلاث. صور الهاتف اختيارية."]}/></p>
    {scenes.map((scene,index)=><div key={scene.id} className={s.rowCard} data-scene-editor={scene.id}>
      <strong>{index+1} · {scene.id}</strong>
      <img src={scene.desktop} alt={scene.descriptions[locale]} width={320} height={180} style={{width:"100%",maxWidth:420,height:180,objectFit:"cover",objectPosition:`${scene.focal.x}% ${scene.focal.y}%`}}/>
      <div className={s.twoColumns}>{(["desktop","mobile"]as const).map(source=><div key={source}>
        <Field label={tr(source==="desktop"?["Desktop image URL","URL ordinateur","رابط صورة الحاسوب"]:["Optional mobile URL","URL mobile optionnelle","رابط الهاتف الاختياري"],locale)}><input value={scene[source]} onChange={e=>patch(scene.id,{[source]:e.target.value},source)}/></Field>
        <NativeImagePicker onSelect={asset=>update(scenes.map(v=>v.id===scene.id?{...v,[source]:asset.url}:v),{...bindings,[sceneSlot(scene.id,source)]:asset.id})}/>
        <div className={s.twoColumns}>{(["x","y"]as const).map(axis=>{const key=source==="desktop"?"focal":"mobileFocal";return <Field key={axis} label={tr(["Focal point ","Point focal ","نقطة التركيز "],locale)+axis+" · 0–100"}><input type="number" min={0} max={100} value={scene[key][axis]} onChange={e=>patch(scene.id,{[key]:{...scene[key],[axis]:e.target.value===""?NaN:Number(e.target.value)}})}/></Field>;})}</div>
      </div>)}</div>
      {(["en","fr","ar"]as const).map(language=><Field key={language} label={tr(["Image description","Description de l’image","وصف الصورة"],locale)+" · "+language.toUpperCase()}><textarea dir={language==="ar"?"rtl":"ltr"} maxLength={500} value={scene.descriptions[language]} onChange={e=>patch(scene.id,{descriptions:{...scene.descriptions,[language]:e.target.value}})}/></Field>)}
      <div className={s.actions}>{[-1,1].map(delta=><Button key={delta} icon={delta<0?"ArrowUp":"ArrowDown"} ariaLabel={tr(delta<0?["Move scene up","Monter l’image","نقل المشهد للأعلى"]:["Move scene down","Descendre l’image","نقل المشهد للأسفل"],locale)} disabled={disabled||index+delta<0||index+delta>=scenes.length} onClick={()=>{const next=[...scenes];[next[index],next[index+delta]]=[next[index+delta],next[index]];update(next);}}>{null}</Button>)}<Button icon="Trash2" disabled={disabled||scenes.length<=3} onClick={()=>update(scenes.filter(v=>v.id!==scene.id))}><T v={["Remove scene","Retirer l’image","أزل المشهد"]}/></Button></div>
    </div>)}
    <div className={s.actions}><Button icon="Plus" disabled={disabled||scenes.length>=maxScenes} onClick={()=>{const draft=defaults.find(s=>!scenes.some(v=>v.desktop===s.desktop));const base=draft||defaults[0];update([...scenes,{...base,id:"scene-"+crypto.randomUUID(),...(draft?{}:{desktop:"",mobile:""})}]);}}><T v={["Add scene","Ajouter une image","أضف مشهداً"]}/></Button><Button icon="RotateCcw" disabled={disabled} onClick={()=>update(defaults,Object.fromEntries(Object.entries(bindings).filter(([slot])=>!slot.startsWith("scene:")&&slot!=="hero"&&slot!=="heroMobile")))}><T v={["Adopt new default scenes","Adopter les nouvelles images par défaut","اعتمد المشاهد الافتراضية الجديدة"]}/></Button></div>
  </fieldset>;
}
