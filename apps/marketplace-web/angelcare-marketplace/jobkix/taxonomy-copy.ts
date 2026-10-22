import type { Locale } from './contracts';
import type { SettingId } from './taxonomy';
const row=(en:string,fr:string,es:string,hi:string,tl:string,id:string,ar:string):Record<Locale,string>=>({en,fr,es,hi,tl,id,ar});
export const SETTING_NAMES:Readonly<Record<SettingId,Record<Locale,string>>>= {
 households:row('Private households & domestic care','Ménages privés et aide à domicile','Hogares privados y cuidado doméstico','निजी परिवार और घरेलू देखभाल','Mga pribadong tahanan at pangangalaga sa bahay','Rumah tangga pribadi dan perawatan domestik','الأسر الخاصة والرعاية المنزلية'),
 nurseries:row('Nurseries & daycare','Crèches et garderies','Guarderías y centros infantiles','शिशुगृह और डेकेयर','Mga nursery at daycare','Penitipan dan pengasuhan anak','الحضانات والرعاية النهارية'),
 preschool:row('Kindergarten & preschool','Maternelles et préscolaire','Jardín de infancia y preescolar','किंडरगार्टन और पूर्व-प्राथमिक शिक्षा','Kindergarten at preschool','Taman kanak-kanak dan prasekolah','رياض الأطفال والتعليم الأولي'),
 'primary-schools':row('Primary schools','Écoles primaires','Escuelas primarias','प्राथमिक विद्यालय','Mga paaralang elementarya','Sekolah dasar','المدارس الابتدائية'),
 'secondary-colleges':row('Secondary schools & colleges','Collèges et lycées','Escuelas secundarias y centros educativos','माध्यमिक विद्यालय और कॉलेज','Mga paaralang sekundarya at kolehiyo','Sekolah menengah dan perguruan tinggi','المدارس الثانوية والكليات'),
 'international-schools':row('International & private schools','Écoles internationales et privées','Escuelas internacionales y privadas','अंतरराष्ट्रीय और निजी विद्यालय','Mga pandaigdigan at pribadong paaralan','Sekolah internasional dan swasta','المدارس الدولية والخاصة'),
 'public-education':row('Public education','Enseignement public','Educación pública','सार्वजनिक शिक्षा','Pampublikong edukasyon','Pendidikan negeri','التعليم العمومي'),
 pediatrics:row('Pediatric clinics & hospitals','Cliniques et hôpitaux pédiatriques','Clínicas y hospitales pediátricos','बाल चिकित्सा क्लिनिक और अस्पताल','Mga klinika at ospital para sa bata','Klinik dan rumah sakit anak','عيادات ومستشفيات الأطفال'),
 'maternity-neonatal':row('Maternity & neonatal settings','Maternités et néonatologie','Maternidad y atención neonatal','प्रसूति और नवजात देखभाल','Mga pasilidad para sa ina at bagong silang','Layanan bersalin dan neonatal','الأمومة ورعاية حديثي الولادة'),
 'therapy-development':row('Therapy & developmental centers','Centres thérapeutiques et de développement','Centros de terapia y desarrollo','चिकित्सा और विकास केंद्र','Mga sentro ng terapiya at pag-unlad','Pusat terapi dan perkembangan','مراكز العلاج والنمو'),
 hospitality:row('Hotels, resorts & kids clubs','Hôtels, resorts et clubs enfants','Hoteles, complejos y clubes infantiles','होटल, रिसॉर्ट और बाल क्लब','Mga hotel, resort at club para sa bata','Hotel, resor, dan klub anak','الفنادق والمنتجعات وأندية الأطفال'),
 'camps-sports':row('Camps, sports & recreation','Camps, sports et loisirs','Campamentos, deporte y recreación','शिविर, खेल और मनोरंजन','Mga kampo, palakasan at libangan','Perkemahan, olahraga, dan rekreasi','المخيمات والرياضة والترفيه'),
 'ngo-child-welfare':row('NGOs, charities & child welfare','ONG, associations et protection de l’enfance','ONG, entidades benéficas y bienestar infantil','गैर-सरकारी संगठन और बाल कल्याण','Mga NGO, kawanggawa at kapakanan ng bata','LSM, amal, dan kesejahteraan anak','المنظمات والجمعيات ورعاية الطفل'),
 'school-operations':row('School transport, food & operations','Transport, restauration et services scolaires','Transporte, alimentación y servicios escolares','स्कूल परिवहन, भोजन और संचालन','Transportasyon, pagkain at operasyon sa paaralan','Transportasi, makanan, dan operasional sekolah','النقل والتغذية والخدمات المدرسية'),
 'digital-learning':row('Digital learning & child content','Apprentissage numérique et contenus jeunesse','Aprendizaje digital y contenidos infantiles','डिजिटल शिक्षा और बाल सामग्री','Digital na pagkatuto at nilalaman para sa bata','Pembelajaran digital dan konten anak','التعلم الرقمي ومحتوى الأطفال'),
 'public-specialist':row('Public agencies & specialist institutions','Organismes publics et institutions spécialisées','Organismos públicos e instituciones especializadas','सार्वजनिक एजेंसियाँ और विशिष्ट संस्थान','Mga ahensiyang pampubliko at dalubhasang institusyon','Lembaga publik dan institusi khusus','الهيئات العمومية والمؤسسات المتخصصة'),
};
export const OCCUPATION_NAMES:Readonly<Record<string,Record<Locale,string>>>= {
 nanny:row('Nanny','Garde d’enfants','Cuidador infantil','बाल देखभाल पेशेवर','Tagapag-alaga ng bata','Pengasuh anak','مربّي أطفال'),
 'family-assistant':row('Family assistant','Assistant familial','Asistente familiar','परिवार सहायक','Katulong sa pamilya','Asisten keluarga','مساعد أسرة'),
 'early-childhood-educator':row('Early childhood educator','Éducateur de jeunes enfants','Educador infantil','प्रारंभिक बाल शिक्षक','Tagapagturo sa maagang pagkabata','Pendidik anak usia dini','مربّي الطفولة المبكرة'),
 'montessori-guide':row('Montessori guide','Éducateur Montessori','Guía Montessori','मोंटेसरी मार्गदर्शक','Gabay sa Montessori','Pemandu Montessori','موجّه مونتيسوري'),
 teacher:row('Teacher','Enseignant','Docente','शिक्षक','Guro','Guru','معلّم'),
 'teaching-assistant':row('Teaching assistant','Assistant pédagogique','Asistente docente','शिक्षण सहायक','Katulong sa pagtuturo','Asisten pengajar','مساعد تربوي'),
 nurse:row('Nurse','Infirmier','Profesional de enfermería','नर्स','Nars','Perawat','ممرّض'),
 pediatrician:row('Pediatrician','Pédiatre','Pediatra','बाल रोग विशेषज्ञ','Doktor ng mga bata','Dokter anak','طبيب أطفال'),
 'therapy-specialist':row('Therapy specialist','Spécialiste en thérapie','Especialista en terapia','चिकित्सा विशेषज्ञ','Dalubhasa sa terapiya','Spesialis terapi','اختصاصي علاج'),
 'school-administrator':row('School administrator','Administrateur scolaire','Administrador escolar','विद्यालय प्रशासक','Tagapangasiwa ng paaralan','Administrator sekolah','إداري مدرسي'),
 counselor:row('Counselor','Conseiller','Orientador','परामर्शदाता','Tagapayo','Konselor','مستشار'),
 driver:row('Driver','Chauffeur','Conductor','चालक','Drayber','Pengemudi','سائق'),
 cook:row('Cook','Cuisinier','Cocinero','रसोइया','Tagapagluto','Juru masak','طاهٍ'),
 'activity-leader':row('Activity leader','Animateur','Coordinador de actividades','गतिविधि समन्वयक','Tagapamuno ng mga gawain','Koordinator kegiatan','منشّط أنشطة'),
 'learning-designer':row('Learning designer','Concepteur pédagogique','Diseñador de aprendizaje','शिक्षण डिज़ाइनर','Tagadisenyo ng pagkatuto','Perancang pembelajaran','مصمّم تعلّم'),
 'safeguarding-officer':row('Safeguarding officer','Responsable de la protection','Responsable de protección','सुरक्षा एवं संरक्षण अधिकारी','Opisyal sa pangangalaga at proteksyon','Petugas perlindungan','مسؤول حماية'),
};
