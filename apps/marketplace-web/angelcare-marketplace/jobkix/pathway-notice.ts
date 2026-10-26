import type {Locale} from './contracts';
const notes:Record<Locale,string>={
 en:'This account belongs to your other JOBKIX pathway. Candidate and employer workspaces are separate.',
 fr:'Ce compte appartient à votre autre parcours JOBKIX. Les espaces candidat et recruteur sont séparés.',
 es:'Esta cuenta pertenece a otra vía de JOBKIX. Los espacios de candidatos y empleadores están separados.',
 hi:'यह खाता दूसरे JOBKIX मार्ग से जुड़ा है। उम्मीदवार और नियोक्ता पोर्टल अलग हैं।',
 tl:'Naka-link ang account na ito sa ibang JOBKIX pathway. Magkahiwalay ang candidate at employer portal.',
 id:'Akun ini terdaftar pada jalur JOBKIX yang lain. Portal kandidat dan pemberi kerja terpisah.',
 ar:'هذا الحساب تابع لمسار آخر في JOBKIX. بوابتا المرشحين وأصحاب العمل منفصلتان.'
};
export const pathwayNotice=(locale:Locale)=>notes[locale];
