import type {CatalogLocale} from '../../catalog-discovery/types'
import type {SocialProvider} from './contracts'
export type SocialReadiness={providers:Record<SocialProvider,boolean>;profileReady:boolean;settingsAvailable:boolean}
export function parseSocialReadiness(payload:unknown):SocialReadiness|null{
 if(!payload||typeof payload!=='object')return null;
 const data=(payload as {data?:unknown}).data;
 if(!data||typeof data!=='object')return null;
 const row=data as Partial<SocialReadiness>;
 if(typeof row.profileReady!=='boolean'||typeof row.settingsAvailable!=='boolean'||!row.providers)return null;
 if(['google','facebook','apple'].some(p=>typeof row.providers?.[p as SocialProvider]!=='boolean'))return null;
 return row as SocialReadiness;
}
const feedback={
 fr:{retry:'Actualiser les connexions',checking:'Vérification des connexions…',unavailable:'Temporairement indisponible',load:'Nous n’avons pas pu vérifier les moyens de connexion. Actualisez pour réessayer ou utilisez votre email.',google:'La connexion Google n’est pas disponible pour le moment. Réessayez plus tard ou utilisez votre email.',facebook:'La connexion Facebook n’est pas disponible pour le moment. Vous pouvez utiliser Google lorsqu’il est disponible, ou votre email.',profile:'La connexion sociale est momentanément indisponible. Réessayez plus tard ou utilisez votre email.',hint:'Choisissez une connexion disponible, puis complétez votre dossier AngelCare si nécessaire.',close:'Fermer',opening:'Ouverture de la connexion…'},
 en:{retry:'Refresh sign-in methods',checking:'Checking sign-in methods…',unavailable:'Temporarily unavailable',load:'We could not check the sign-in methods. Refresh to try again or use your email.',google:'Google sign-in is currently unavailable. Try again later or use your email.',facebook:'Facebook sign-in is currently unavailable. Use Google when available, or your email.',profile:'Social sign-in is temporarily unavailable. Try again later or use your email.',hint:'Choose an available sign-in method, then complete your AngelCare profile if needed.',close:'Close',opening:'Opening sign-in…'},
 ar:{retry:'تحديث وسائل الدخول',checking:'جارٍ التحقق من وسائل الدخول…',unavailable:'غير متاح مؤقتاً',load:'تعذّر التحقق من وسائل الدخول. حدّث لإعادة المحاولة أو استخدم بريدك الإلكتروني.',google:'الدخول باستخدام Google غير متاح حالياً. أعد المحاولة لاحقاً أو استخدم بريدك الإلكتروني.',facebook:'الدخول باستخدام Facebook غير متاح حالياً. استخدم Google عندما يكون متاحاً أو بريدك الإلكتروني.',profile:'الدخول الاجتماعي غير متاح مؤقتاً. أعد المحاولة لاحقاً أو استخدم بريدك الإلكتروني.',hint:'اختر وسيلة دخول متاحة ثم أكمل ملفك لدى AngelCare عند الحاجة.',close:'إغلاق',opening:'جارٍ فتح الدخول…'}
}
export const socialFeedback=(locale:CatalogLocale)=>feedback[locale]
export const providerAvailable=(data:SocialReadiness|null,p:SocialProvider)=>Boolean(data?.settingsAvailable&&data.profileReady&&data.providers[p])
