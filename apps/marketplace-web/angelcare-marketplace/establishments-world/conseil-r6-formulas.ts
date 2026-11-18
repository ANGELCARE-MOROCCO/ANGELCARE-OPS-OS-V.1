import type {Formula} from "./content";
import type {ConseilLocale} from "./conseil-r6-copy";
type Copy={frequency:string;volume:string;reporting:string;support:string;facts:string[]};
const en:Record<string,Copy>={
"eduplay-start":{frequency:"1 workshop per week",volume:"4 sessions per month",reporting:"Mini activity report",support:"Simple family communication material",facts:["Monthly theme","Mini activity report","Simple updates for families"]},
"eduplay-growth":{frequency:"2 workshops per week",volume:"8 sessions per month",reporting:"Monthly activity report",support:"School leadership coordination",facts:["Structured activity plan","Varied educational activities","Parent-facing content","Leadership coordination"]},
"eduplay-signature":{frequency:"3 workshops per week",volume:"12 sessions per month",reporting:"Enhanced reporting",support:"Monthly leadership review",facts:["Full themed calendar","Seasonal highlights and events","Enhanced educational reporting","Monthly review with management"]},
"academy-start":{frequency:"1 focused training session",volume:"One priority competency",reporting:"Practical recommendations",support:"Role-play and team Q&A",facts:["PDF support materials","Hands-on scenario practice","Team Q&A","Practical recommendations"]},
"academy-team":{frequency:"3 training sessions",volume:"On-site practical exercises",reporting:"Leadership summary",support:"Team management resources",facts:["Simple skills assessment","Team management tools","Certificate of participation","Leadership summary"]},
"academy-excellence":{frequency:"6 training sessions",volume:"Staff diagnostic and coaching",reporting:"Comprehensive report",support:"Pedagogical coaching",facts:["Team assessment","Educational coaching","Quality toolkit","Final evaluation","Continuous-improvement recommendations"]},
"parenttrust-visibility":{frequency:"1 parent workshop per month",volume:"Communication resources",reporting:"Short satisfaction report",support:"Parent–school communication advice",facts:["Communication materials","Visibility for school activities","Short satisfaction report","Family communication guidance"]},
"parenttrust-performance":{frequency:"2 family actions per month",volume:"Basic parent-experience audit",reporting:"Satisfaction monitoring panel",support:"Optimized parent onboarding",facts:["Basic parent-experience audit","Improved welcome journey","Educational resources for parents","Satisfaction follow-up"]},
"parenttrust-360":{frequency:"Comprehensive parent-experience programme",volume:"Annual programme of activities",reporting:"Full monthly reporting",support:"Strategic support for school leaders",facts:["Parent workshops and events","Strategic leadership advice","Co-design of premium school offers","Satisfaction and retention follow-up"]},
};
const ar:Record<string,Copy>={
"eduplay-start":{frequency:"ورشة واحدة أسبوعياً",volume:"أربع تدخلات شهرياً",reporting:"تقرير مختصر للأنشطة",support:"مواد تواصل بسيطة للأسر",facts:["موضوع شهري","تقرير مختصر","محتوى مبسط للتواصل مع الأسر"]},
"eduplay-growth":{frequency:"ورشتان أسبوعياً",volume:"ثماني تدخلات شهرياً",reporting:"تقرير شهري",support:"تنسيق مع إدارة المؤسسة",facts:["برنامج أنشطة منظم","أنشطة تربوية متنوعة","محتوى موجه للأسر","تنسيق مع الإدارة"]},
"eduplay-signature":{frequency:"ثلاث ورش أسبوعياً",volume:"اثنا عشر تدخلاً شهرياً",reporting:"تقارير معمقة",support:"لقاء شهري مع الإدارة",facts:["تقويم مواضيع شامل","أنشطة ومناسبات مميزة","تقارير تربوية معمقة","لقاء شهري مع الإدارة"]},
"academy-start":{frequency:"جلسة تدريبية مركزة",volume:"مهارة أساسية واحدة",reporting:"توصيات عملية",support:"محاكاة وأسئلة الفريق",facts:["وثائق تدريب PDF","محاكاة عملية","أسئلة وأجوبة مع الفريق","توصيات تطبيقية"]},
"academy-team":{frequency:"ثلاث جلسات تدريبية",volume:"تمارين ميدانية",reporting:"ملخص للإدارة",support:"أدوات تأطير الفريق",facts:["تقييم مبسط للكفاءات","أدوات التأطير","شهادة مشاركة","ملخص للإدارة"]},
"academy-excellence":{frequency:"ست جلسات تدريبية",volume:"تشخيص الفريق والتوجيه",reporting:"تقرير شامل",support:"توجيه تربوي",facts:["تشخيص الفريق","توجيه تربوي","حقيبة الجودة","تقييم نهائي","توصيات للتحسين المستمر"]},
"parenttrust-visibility":{frequency:"ورشة واحدة للأسر شهرياً",volume:"مواد للتواصل",reporting:"تقرير رضا مختصر",support:"إرشادات التواصل مع الأسر",facts:["مواد للتواصل","إبراز الأنشطة","تقرير رضا مختصر","إرشادات التواصل بين الروضة والأسرة"]},
"parenttrust-performance":{frequency:"نشاطان للأسر شهرياً",volume:"تدقيق مبسط لتجربة الآباء",reporting:"لوحة متابعة الرضا",support:"تحسين استقبال الأسر",facts:["تدقيق مبسط لتجربة الأسر","تحسين مسار الاستقبال","موارد تربوية للأسر","متابعة الرضا"]},
"parenttrust-360":{frequency:"برنامج متكامل لتجربة الأسر",volume:"تقويم سنوي للأنشطة",reporting:"تقرير شهري شامل",support:"مواكبة استراتيجية للإدارة",facts:["ورش وفعاليات للأسر","إرشاد استراتيجي للإدارة","تصميم عروض متميزة","متابعة الرضا والاستمرارية"]},
};
export function localConseilFormula(formula:Formula,locale:ConseilLocale):Formula{
 const translation=locale==="en"?en[formula.id]:locale==="ar"?ar[formula.id]:null;
 return translation?{...formula,...translation}:formula;
}
export const CONSEIL_R6_FORMULA_IDS=[...Object.keys(en)];
export const CONSEIL_R6_FORMULA_LOCALE_COVERAGE={fr:9,en:Object.keys(en).length,ar:Object.keys(ar).length};
