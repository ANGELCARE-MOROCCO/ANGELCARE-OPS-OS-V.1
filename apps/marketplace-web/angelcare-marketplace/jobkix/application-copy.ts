import type { Locale } from './contracts';
const row=(en:string,fr:string,es:string,hi:string,tl:string,id:string,ar:string):Record<Locale,string>=>({en,fr,es,hi,tl,id,ar});
export const APPLICATION_STATUS={
 submitted:row('Submitted','Envoyée','Enviada','जमा किया गया','Naisumite','Terkirim','مُرسل'),
 acknowledged:row('Acknowledged','Réception confirmée','Recepción confirmada','प्राप्ति की पुष्टि','Nakumpirma ang pagtanggap','Diterima','تم تأكيد الاستلام'),
 under_review:row('Under review','En cours d’examen','En revisión','समीक्षा जारी','Sinusuri','Sedang ditinjau','قيد المراجعة'),
 shortlisted:row('Shortlisted','Présélectionnée','Preseleccionada','चयनित सूची में','Nasa maikling listahan','Masuk daftar pendek','ضمن القائمة المختصرة'),
 interview:row('Interview','Entretien','Entrevista','साक्षात्कार','Panayam','Wawancara','مقابلة'),
 offer:row('Offer sent','Offre envoyée','Oferta enviada','प्रस्ताव भेजा गया','Naipadala ang alok','Penawaran terkirim','تم إرسال العرض'),
 hired:row('Offer accepted','Offre acceptée','Oferta aceptada','प्रस्ताव स्वीकार हुआ','Tinanggap ang alok','Penawaran diterima','تم قبول العرض'),
 declined:row('Not proceeding','Sans suite','No continúa','आगे नहीं बढ़ रहा','Hindi na magpapatuloy','Tidak dilanjutkan','لن يتم الاستمرار'),
 withdrawn:row('Withdrawn by candidate','Retirée par le candidat','Retirada por el candidato','उम्मीदवार द्वारा वापस लिया गया','Binawi ng kandidato','Ditarik kandidat','سحبه المرشح'),
 on_hold:row('On hold','En attente','En espera','स्थगित','Nakahinto muna','Ditunda','معلّق'),
 closed_due_to_vacancy:row('Vacancy closed','Offre clôturée','Vacante cerrada','रिक्ति बंद','Sarado ang bakante','Lowongan ditutup','أُغلقت الوظيفة'),
} as const;
export const applicationStatus=(locale:Locale,state:string)=>Object.entries(APPLICATION_STATUS).find(([key])=>key===state)?.[1][locale]||state;
