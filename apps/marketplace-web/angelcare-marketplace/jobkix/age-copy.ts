import type { Locale } from './contracts';
import { AGE_COHORTS } from './taxonomy';
const row=(en:string,fr:string,es:string,hi:string,tl:string,id:string,ar:string):Record<Locale,string>=>({en,fr,es,hi,tl,id,ar});
export const AGE_NAMES:Readonly<Record<typeof AGE_COHORTS[number],Record<Locale,string>>>={
 newborn:row('Newborns','Nouveau-nés','Recién nacidos','नवजात','Mga bagong silang','Bayi baru lahir','حديثو الولادة'),
 infant:row('Infants','Nourrissons','Bebés','शिशु','Mga sanggol','Bayi','الرضّع'),
 toddler:row('Toddlers','Tout-petits','Niños pequeños','छोटे बच्चे','Mga batang nagsisimulang lumakad','Balita','الأطفال الصغار'),
 preschool:row('Preschool children','Enfants d’âge préscolaire','Niños en edad preescolar','पूर्व-प्राथमिक बच्चे','Mga batang nasa preschool','Anak prasekolah','أطفال ما قبل المدرسة'),
 primary:row('Primary-age children','Enfants d’âge primaire','Niños de primaria','प्राथमिक आयु के बच्चे','Mga batang nasa elementarya','Anak usia sekolah dasar','أطفال المرحلة الابتدائية'),
 adolescent:row('Adolescents','Adolescents','Adolescentes','किशोर','Mga kabataan','Remaja','المراهقون'),
 multi_age:row('Multiple age groups','Plusieurs tranches d’âge','Varias edades','कई आयु समूह','Iba’t ibang pangkat ng edad','Beberapa kelompok usia','فئات عمرية متعددة'),
 non_contact:row('Role without direct child contact','Poste sans contact direct avec les enfants','Puesto sin contacto directo con menores','बच्चों से सीधे संपर्क के बिना भूमिका','Tungkuling walang direktang pakikipag-ugnayan sa bata','Posisi tanpa kontak langsung dengan anak','وظيفة دون اتصال مباشر بالأطفال'),
};
