import type {Locale} from '../catalogue';
export type Tri=readonly [string,string,string];
export const l=(locale:Locale,en:string,fr:string,ar:string)=>locale==='fr'?fr:locale==='ar'?ar:en;
export const txt=(locale:Locale,value:Tri)=>l(locale,...value);
export const names={about:['About KidFlix','À propos de KidFlix','عن KidFlix'],accessibility:['Accessibility','Accessibilité','إمكانية الوصول'],privacy:['Privacy','Confidentialité','الخصوصية']} as const;
export const labels={
 explore:['Explore resources','Explorer les ressources','استكشف الموارد'],
 library:['Open my library','Ouvrir ma bibliothèque','افتح مكتبتي'],
 home:['Home','Accueil','الرئيسية'],
 learn:['Learn more','En savoir plus','اعرف المزيد'],
 reset:['Reset','Réinitialiser','إعادة ضبط'],
 saved:['Saved resources','Ressources enregistrées','الموارد المحفوظة'],
 progress:['Reading progress','Progression','التقدم في القراءة'],
 recent:['Recent history','Historique récent','السجل الحديث'],
 collections:['Collections & session plans','Collections et séances','المجموعات وخطط الجلسات'],
 preferences:['Display preferences','Préférences d’affichage','تفضيلات العرض'],
 profile:['Local profile','Profil local','الملف المحلي'],
 review:['Review','Consulter','مراجعة'],
 questions:['Common questions','Questions fréquentes','أسئلة شائعة'],
 email:['Your email (optional)','Votre email (facultatif)','بريدك الإلكتروني (اختياري)'],
 message:['Your message','Votre message','رسالتك'],
 page:['KidFlix page URL (optional)','URL de la page KidFlix (facultatif)','رابط صفحة KidFlix (اختياري)'],
 category:['Request type','Type de demande','نوع الطلب'],
 send:['Send feedback','Envoyer mon avis','إرسال الملاحظات'],
 cancel:['Cancel','Annuler','إلغاء'],
 sending:['Sending…','Envoi…','جارٍ الإرسال…'],
 close:['Close','Fermer','إغلاق'],
 error:['We could not complete this action. Your entries are still here; please try again.','Cette action n’a pas abouti. Vos saisies sont conservées ; réessayez.','تعذر إتمام العملية. بياناتك ما زالت هنا؛ حاول مجددًا.'],
} as const;
export const label=(key:keyof typeof labels,locale:Locale)=>txt(locale,labels[key]);
