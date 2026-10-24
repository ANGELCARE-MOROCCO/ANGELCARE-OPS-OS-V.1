'use client';
import {NativeImagePicker} from '../StudioPickers';
import {Button,Field,T,useUI} from '../../digital-customer-experience/components/ui';
import {art,say,type Copy,type PublisherLocale} from './publisher-content';
import {PUBLISHER_IMAGE_SLOTS,defaultImageDescription} from './publisher-assets';
import type {Edition} from './model';
import s from '../../digital-customer-experience/components/workspace.module.css';
const names:Record<string,Copy>={cover:['Category cover','Couverture de catégorie','غلاف الفئة'],guidance:['Guidance artwork','Image d’accompagnement','صورة الإرشاد'],reference:['Reference board','Planche de référence','لوحة المرجع'],detail:['Practical detail','Détail pratique','تفصيل عملي']};
export function PublisherMediaEditor({family,language,value,onChange,disabled}:{family:string;language:PublisherLocale;value:Edition;onChange:(edition:Edition)=>void;disabled:boolean}){
 const {locale}=useUI();
 function change(slot:string,url:string,mediaId?:string){
  const bindings={...value.mediaBindings};delete bindings[slot];if(mediaId)bindings[slot]=mediaId;
  const patch:Record<string,string>={[slot]:url};
  if(PUBLISHER_IMAGE_SLOTS.some(role=>role===slot)&&value[slot+'Mobile' as keyof Edition]===art(family,slot,true)){patch[slot+'Mobile']='';delete bindings[slot+'Mobile'];}
  onChange({...value,...patch,mediaBindings:bindings});
 }
 return <details className={s.advanced} open><summary>{say(['Editorial artwork · four connected roles','Images éditoriales · quatre rôles connectés','الصور التحريرية · أربعة أدوار مترابطة'],locale)}</summary><p className={s.subtitle}><T v={['Each role has a real page placement and retains native media validation. A custom mobile image is optional.','Chaque rôle a un emplacement réel et conserve la validation des médias natifs. L’image mobile personnalisée est optionnelle.','لكل دور موضع فعلي مع الحفاظ على التحقق من الوسائط الأصلية. صورة الهاتف المخصصة اختيارية.']}/></p><fieldset disabled={disabled} style={{border:0,padding:0,minWidth:0}}><div className={s.twoColumns}>{PUBLISHER_IMAGE_SLOTS.map(role=><div className={s.rowCard} key={role}><h3>{say(names[role],locale)}</h3><img src={value[role]} alt={value[role+'Alt' as keyof Edition] as string} width={480} height={320} style={{width:'100%',height:180,objectFit:'contain'}}/>{([role,role+'Mobile'] as const).map(slot=><div key={slot}><Field label={say(slot===role?['Desktop image URL','URL ordinateur','رابط صورة الحاسوب']:['Optional mobile image URL','URL mobile optionnelle','رابط صورة الهاتف الاختياري'],locale)}><input value={value[slot as keyof Edition] as string||''} onChange={event=>change(slot,event.target.value)} maxLength={2048}/></Field><NativeImagePicker onSelect={asset=>change(slot,asset.url,asset.id)}/></div>)}<Field label={say(['Image description','Description de l’image','وصف الصورة'],locale)+' · '+language.toUpperCase()}><textarea dir={language==='ar'?'rtl':'ltr'} value={value[role+'Alt' as keyof Edition] as string} maxLength={500} rows={2} onChange={event=>onChange({...value,[role+'Alt']:event.target.value})}/></Field><Button disabled={disabled} onClick={()=>{const bindings={...value.mediaBindings};delete bindings[role];delete bindings[role+'Mobile'];onChange({...value,[role]:art(family,role),[role+'Mobile']:art(family,role,true),[role+'Alt']:defaultImageDescription(family,role,language),mediaBindings:bindings});}}><T v={['Restore editorial default','Restaurer l’image éditoriale','استعد الصورة التحريرية']}/></Button></div>)}</div></fieldset></details>;
}
