'use client'
import {useEffect,useId,useRef} from 'react'
import type {CatalogLocale} from '../../catalog-discovery/types'
import s from '../customer-social/apple-update.module.css'

const COPY={
 fr:{eyebrow:'Votre espace AngelCare',title:'Apple fait une petite pause',message:'La connexion Apple est en cours de mise à jour technique. Veuillez réessayer plus tard. Nous vous recommandons de continuer avec Google ou Facebook.',google:'Continuer avec Google',facebook:'Continuer avec Facebook',close:'Fermer',footer:'Fermeture automatique après 10 secondes',update:'Mise à jour',email:'Vous pouvez aussi continuer avec votre adresse e-mail.'},
 en:{eyebrow:'Your AngelCare space',title:'Apple is taking a short break',message:'Apple sign-in is undergoing a technical update. Please try again later. We recommend continuing with Google or Facebook instead.',google:'Continue with Google',facebook:'Continue with Facebook',close:'Close',footer:'Closes automatically after 10 seconds',update:'Updating',email:'You can also continue with your email address.'},
 ar:{eyebrow:'مساحتك في AngelCare',title:'تسجيل الدخول عبر Apple في استراحة قصيرة',message:'نقوم بتحديث تقني لتسجيل الدخول عبر Apple. يرجى المحاولة لاحقًا. ننصحك بالمتابعة باستخدام Google أو Facebook بدلًا منه.',google:'المتابعة باستخدام Google',facebook:'المتابعة باستخدام Facebook',close:'إغلاق',footer:'تُغلق النافذة تلقائيًا بعد 10 ثوانٍ',update:'قيد التحديث',email:'يمكنك أيضًا المتابعة باستخدام بريدك الإلكتروني.'}
} as const
export const appleUpdateCopy=(locale:CatalogLocale)=>COPY[locale]
export function CustomerAppleUpdateNotice({locale,googleAvailable,facebookAvailable,onClose,onChoose}:{locale:CatalogLocale;googleAvailable:boolean;facebookAvailable:boolean;onClose:()=>void;onChoose:(provider:'google'|'facebook')=>void}){
 const t=appleUpdateCopy(locale),dialog=useRef<HTMLDialogElement>(null),id=useId()
 useEffect(()=>{
  const element=dialog.current
  if(!element)return
  if(!element.open)element.showModal()
  const timer=window.setTimeout(()=>{if(element.open)element.close()},10000)
  return()=>window.clearTimeout(timer)
 },[])
 function close(){dialog.current?.close()}
 function choose(provider:'google'|'facebook'){close();onChoose(provider)}
 return <dialog ref={dialog} className={s.dialog} dir={locale==='ar'?'rtl':'ltr'} aria-labelledby={id+'-title'} aria-describedby={id+'-message'} onClose={onClose} onCancel={event=>{event.preventDefault();close()}} onClick={event=>{if(event.target===event.currentTarget)close()}}>
  <div className={s.panel}>
   <button type="button" className={s.close} aria-label={t.close} onClick={close} autoFocus><span aria-hidden="true">×</span></button>
   <div className={s.brand}><img src="/brand/angelcare-pearl-rim-colour-r1.png" alt="AngelCare" width={122} height={46}/><span>{t.eyebrow}</span></div>
   <div className={s.orbit} aria-hidden="true"><span>Apple</span><i/></div>
   <h2 id={id+'-title'}>{t.title}</h2><p id={id+'-message'} className={s.message}>{t.message}</p>
   {googleAvailable||facebookAvailable?<div className={s.actions}>{googleAvailable?<button type="button" className={s.google} onClick={()=>choose('google')}>{t.google}<span aria-hidden="true">↗</span></button>:null}{facebookAvailable?<button type="button" className={s.facebook} onClick={()=>choose('facebook')}>{t.facebook}<span aria-hidden="true">↗</span></button>:null}</div>:null}
   <p className={s.email}>{t.email}</p><div className={s.footer}><span>{t.footer}</span><button type="button" onClick={close}>{t.close}</button></div><div className={s.track} aria-hidden="true"><span/></div>
  </div>
 </dialog>
}
