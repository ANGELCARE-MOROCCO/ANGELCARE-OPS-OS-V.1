import type { AdminLocale } from './admin-copy';
const row=(en:string,fr:string,ar:string)=>({en,fr,ar});
export const OPERATIONS_COPY={
 queue:row('Notification delivery queue','File de livraison des notifications','قائمة تسليم الإشعارات'),
 help:row('Provider acceptance does not confirm inbox delivery. Resolve the dependency before retrying a known failure. Uncertain acknowledgements cannot be resent here.','L’acceptation du fournisseur ne confirme pas la remise en boîte. Corrigez la dépendance avant de relancer un échec connu. Un accusé incertain ne peut pas être renvoyé ici.','قبول المزوّد لا يؤكد الوصول إلى صندوق البريد. عالج سبب الإخفاق المعروف قبل إعادة المحاولة. لا يمكن إعادة إرسال الرسائل ذات الإقرار غير المؤكد هنا.'),
 attempts:row('Recorded attempts','Tentatives enregistrées','المحاولات المسجلة'),
 pending:row('Pending','En attente','قيد الانتظار'),
 processing:row('Transport attempt in progress','Tentative en cours','محاولة الإرسال جارية'),
 provider_accepted:row('Provider accepted','Accepté par le fournisseur','قبله المزوّد'),
 failed:row('Known failure','Échec connu','إخفاق معروف'),
 delivery_unknown:row('Delivery acknowledgement unknown','Accusé de livraison inconnu','إقرار التسليم غير معروف'),
 cancelled:row('Cancelled','Annulé','ملغى'),
 all:row('All delivery states','Tous les états','جميع الحالات'),
 retry:row('Queue another guarded attempt','Programmer une nouvelle tentative contrôlée','جدولة محاولة أخرى محكومة'),
 cancel:row('Cancel further delivery','Annuler la livraison ultérieure','إلغاء التسليم اللاحق'),
 choose:row('Review this delivery','Examiner cette livraison','مراجعة هذا التسليم'),
 due:row('Available after','Disponible après','متاح بعد'),
 expired:row('Expired vacancies awaiting housekeeping','Offres expirées en attente de traitement','وظائف منتهية تنتظر المعالجة'),
 filters:row('Saved searches requiring filter correction','Recherches nécessitant une correction de filtres','عمليات بحث تحتاج إلى تصحيح المرشحات'),
 filtersHelp:row('The original search filters are retained. The account owner can correct an archived profession or setting in Career Studio.','Les filtres d’origine sont conservés. Le titulaire peut corriger un métier ou cadre archivé dans Career Studio.','تُحفظ المرشحات الأصلية. يستطيع صاحب الحساب تصحيح مهنة أو مجال مؤرشف في استوديو المسار المهني.'),
} as const;
export const op=(locale:AdminLocale,key:keyof typeof OPERATIONS_COPY)=>OPERATIONS_COPY[key][locale];
export function operationState(locale:AdminLocale,key:string){return Object.entries(OPERATIONS_COPY).find(([id])=>id===key)?.[1][locale]||key;}
