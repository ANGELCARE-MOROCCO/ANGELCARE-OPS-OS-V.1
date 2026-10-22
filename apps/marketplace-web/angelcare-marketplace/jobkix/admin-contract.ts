/** Native administration extensions; no additional identity or role system. */
export const ADMIN_AREAS=[
 {id:'D01',slug:'verification',workspace:'jobkix.verification',collection:'verification',name:{en:'Employer verification',fr:'Vérification employeurs',ar:'التحقق من جهات التوظيف'}},
 {id:'D02',slug:'vacancies',workspace:'jobkix.vacancies',collection:'vacancies',name:{en:'Vacancy moderation',fr:'Modération des offres',ar:'مراجعة الوظائف'}},
 {id:'D03',slug:'cases',workspace:'jobkix.cases',collection:'cases',name:{en:'Reports and appeals',fr:'Signalements et recours',ar:'البلاغات والاستئنافات'}},
 {id:'D04',slug:'reputation',workspace:'jobkix.reputation',collection:'reputation',name:{en:'Reviews and salaries',fr:'Avis et rémunérations',ar:'التقييمات والأجور'}},
 {id:'D05',slug:'taxonomy',workspace:'jobkix.taxonomy',collection:'taxonomy',name:{en:'Professional taxonomy',fr:'Taxonomie professionnelle',ar:'التصنيف المهني'}},
 {id:'D06',slug:'editorial',workspace:'jobkix.editorial',collection:'editorial',name:{en:'Content and editorial',fr:'Contenus et éditions',ar:'المحتوى والتحرير'}},
 {id:'D07',slug:'health',workspace:'jobkix.health',collection:'health',name:{en:'Health and incidents',fr:'Santé et incidents',ar:'الحالة التشغيلية والحوادث'}},
 {id:'D08',slug:'audit',workspace:'jobkix.audit',collection:'audit',name:{en:'Audit and governance',fr:'Audit et gouvernance',ar:'التدقيق والحوكمة'}},
] as const;
export const ADMIN_ACTION_AREA={
 'delivery.retry':'health','delivery.cancel':'health',
 'organization.media_review':'verification','organization.media_revoke':'verification','organization.review':'verification','organization.revoke':'verification','organization.suspend':'verification','organization.restore':'verification',
 'vacancy.approve':'vacancies','vacancy.return':'vacancies','vacancy.suspend':'vacancies','case.advance':'cases','reputation.review':'reputation','taxonomy.save':'taxonomy',
 'editorial.create':'editorial','editorial.save':'editorial','editorial.translate':'editorial','editorial.review':'editorial','editorial.publish':'editorial','editorial.unpublish':'editorial','editorial.rollback':'editorial',
} as const;
export type AdminAction=keyof typeof ADMIN_ACTION_AREA;
export function isAdminAction(value:string):value is AdminAction{return Object.hasOwn(ADMIN_ACTION_AREA,value);}
export function adminArea(slug:string){return ADMIN_AREAS.find(area=>area.slug===slug);}
