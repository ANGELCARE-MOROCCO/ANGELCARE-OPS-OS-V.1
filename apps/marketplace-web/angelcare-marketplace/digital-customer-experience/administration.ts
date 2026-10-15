import type { Data, Field, Issue } from './types'
import { number, text } from './types'
const f=(key:string,en:string,fr:string,ar:string,type:Field['type']='text',options?:string[],min?:number,max?:number):Field=>({key,label:[en,fr,ar],type,options,min,max,classification:'private'})
export const WORLD_FIELDS:Field[]=[
 f('defaultLocale','Default language','Langue par défaut','اللغة الافتراضية','select',['fr','en','ar']),
 f('timezone','Scheduling timezone','Fuseau de publication','المنطقة الزمنية'),
 f('monetizationEnabled','World monetization enabled','Monétisation du monde','تفعيل تحقيق الدخل','toggle'),
 f('reviewRequired','Review required before approval','Revue requise avant approbation','المراجعة مطلوبة قبل الاعتماد','toggle'),
 f('defaultVisibility','Default access classification','Accès par défaut','الوصول الافتراضي','select',['free','account','native_entitlement']),
 f('defaultCompletion','Default completion policy','Complétion par défaut','سياسة الإكمال الافتراضية','select',['explicit','required_units','assessment_pass']),
 f('allowDownloads','Permit download authoring','Autoriser la configuration du téléchargement','السماح بتأليف التنزيل','toggle'),
 f('allowPrint','Permit print authoring','Autoriser la configuration d’impression','السماح بتأليف الطباعة','toggle'),
 f('requireAltText','Require image alternatives','Exiger les alternatives d’image','اشتراط وصف بديل للصور','toggle'),
 f('requireCaptions','Require video captions','Exiger les sous-titres vidéo','اشتراط ترجمة الفيديو النصية','toggle'),
 f('retentionDays','Declared activity retention days','Rétention déclarée des activités','الاحتفاظ المعلن بالنشاط بالأيام','number',undefined,1,3650),
 f('supportRetentionDays','Declared private-case retention days','Rétention déclarée des dossiers privés','الاحتفاظ المعلن بالملفات الخاصة','number',undefined,1,3650),
 f('concurrency','Bounded processing concurrency','Concurrence bornée','عدد المعالجة المتوازية','number',undefined,1,4),
 f('supportTeam','Default responsible team','Équipe responsable par défaut','الفريق المسؤول الافتراضي'),
 f('notificationChannel','Notification authority','Autorité de notification','مرجع الإشعارات','select',['native']),
 f('brandAccent','Studio accent colour','Couleur d’accent Studio','لون الاستوديو'),
 f('brandSignature','Editorial signature','Signature éditoriale','التوقيع التحريري'),
 f('operatingNotes','Private operating instructions','Consignes privées d’exploitation','تعليمات التشغيل الخاصة','textarea')]
export const WORLD_DEFAULTS:Data={monetizationEnabled:false,publicRuntimeReady:false,timezone:'UTC',retentionDays:365,supportRetentionDays:365,concurrency:2,notificationChannel:'native',reviewRequired:true,defaultVisibility:'free',defaultCompletion:'explicit',allowDownloads:true,allowPrint:true,requireAltText:true,requireCaptions:false,enabledLocales:['fr','en','ar'],enabledFamilies:[],brandAccent:'#076bff',brandSignature:'AngelCare',supportTeam:'DCE',operatingNotes:''}
export function worldIssues(data:Data):Issue[]{const errors:Issue[]=[];const add=(path:string,en:string,fr:string,ar:string)=>errors.push({path,code:'WORLD_POLICY',message:[en,fr,ar],severity:'error'});for(const field of WORLD_FIELDS){const v=data[field.key];if(v===undefined)continue;if(field.type==='number'&&(!Number.isInteger(v)||number(v)<(field.min||0)||number(v)>(field.max||Infinity)))add(field.key,'Choose a whole value within the declared bounds.','Choisissez un entier dans les bornes.','اختر عدداً صحيحاً ضمن الحدود.');if(field.options&&!field.options.includes(text(v)))add(field.key,'Choose a supported option.','Choisissez une option supportée.','اختر خياراً مدعوماً.')}try{new Intl.DateTimeFormat('en',{timeZone:text(data.timezone)||'UTC'}).format()}catch{add('timezone','Choose a valid IANA timezone.','Choisissez un fuseau IANA valide.','اختر منطقة زمنية IANA صالحة.')}if(data.brandAccent&&!/^#[0-9a-f]{6}$/i.test(text(data.brandAccent)))add('brandAccent','Use a six-digit colour.','Utilisez une couleur à six chiffres.','استخدم لوناً من ست خانات.');if(data.reviewRequired===false)add('reviewRequired','Review remains mandatory for releases.','La revue reste obligatoire avant publication.','تبقى المراجعة إلزامية قبل النشر.');if(Array.isArray(data.enabledLocales)&&(!data.enabledLocales.includes(data.defaultLocale)||data.enabledLocales.some(l=>!['fr','en','ar'].includes(String(l)))))add('enabledLocales','Enabled languages must include the default.','Les langues actives doivent inclure la langue par défaut.','يجب أن تتضمن اللغات المفعلة اللغة الافتراضية.');return errors}
