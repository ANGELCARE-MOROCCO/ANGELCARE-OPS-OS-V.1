-- Controlled taxonomy definitions from blueprint p17; no employers, jobs, reviews or activity fixtures.
-- Authoring only. The source installer never executes this migration.
begin;
do $$ begin if not exists(select 1 from public.jobkix_schema_versions where version=3) then raise exception 'JOBKIX_MIGRATION_ORDER'; end if; end $$;
insert into public.jobkix_taxonomy(kind,key,source_name_en,status,sort_order) values
 ('setting','households','Private households & domestic care','published',1),
 ('setting','nurseries','Nurseries & daycare','published',2),
 ('setting','preschool','Kindergarten & preschool','published',3),
 ('setting','primary-schools','Primary schools','published',4),
 ('setting','secondary-colleges','Secondary schools & colleges','published',5),
 ('setting','international-schools','International & private schools','published',6),
 ('setting','public-education','Public education','published',7),
 ('setting','pediatrics','Pediatric clinics & hospitals','published',8),
 ('setting','maternity-neonatal','Maternity & neonatal settings','published',9),
 ('setting','therapy-development','Therapy & developmental centers','published',10),
 ('setting','hospitality','Hotels, resorts & kids clubs','published',11),
 ('setting','camps-sports','Camps, sports & recreation','published',12),
 ('setting','ngo-child-welfare','NGOs, charities & child welfare','published',13),
 ('setting','school-operations','School transport, food & operations','published',14),
 ('setting','digital-learning','Digital learning & child content','published',15),
 ('setting','public-specialist','Public agencies & specialist institutions','published',16),
 ('occupation','nanny','Nanny','published',1),
 ('occupation','family-assistant','Family assistant','published',2),
 ('occupation','early-childhood-educator','Early childhood educator','published',3),
 ('occupation','montessori-guide','Montessori guide','published',4),
 ('occupation','teacher','Teacher','published',5),
 ('occupation','teaching-assistant','Teaching assistant','published',6),
 ('occupation','nurse','Nurse','published',7),
 ('occupation','pediatrician','Pediatrician','published',8),
 ('occupation','therapy-specialist','Therapy specialist','published',9),
 ('occupation','school-administrator','School administrator','published',10),
 ('occupation','counselor','Counselor','published',11),
 ('occupation','driver','Driver','published',12),
 ('occupation','cook','Cook','published',13),
 ('occupation','activity-leader','Activity leader','published',14),
 ('occupation','learning-designer','Learning designer','published',15),
 ('occupation','safeguarding-officer','Safeguarding officer','published',16);

-- Controlled source labels and search synonyms. Authored translations; no native review claim.
update public.jobkix_taxonomy set localized_names='{"en":"Private households & domestic care","fr":"Ménages privés et aide à domicile","es":"Hogares privados y cuidado doméstico","hi":"निजी परिवार और घरेलू देखभाल","tl":"Mga pribadong tahanan at pangangalaga sa bahay","id":"Rumah tangga pribadi dan perawatan domestik","ar":"الأسر الخاصة والرعاية المنزلية"}'::jsonb where kind='setting' and key='households';
update public.jobkix_taxonomy set localized_names='{"en":"Nurseries & daycare","fr":"Crèches et garderies","es":"Guarderías y centros infantiles","hi":"शिशुगृह और डेकेयर","tl":"Mga nursery at daycare","id":"Penitipan dan pengasuhan anak","ar":"الحضانات والرعاية النهارية"}'::jsonb where kind='setting' and key='nurseries';
update public.jobkix_taxonomy set localized_names='{"en":"Kindergarten & preschool","fr":"Maternelles et préscolaire","es":"Jardín de infancia y preescolar","hi":"किंडरगार्टन और पूर्व-प्राथमिक शिक्षा","tl":"Kindergarten at preschool","id":"Taman kanak-kanak dan prasekolah","ar":"رياض الأطفال والتعليم الأولي"}'::jsonb where kind='setting' and key='preschool';
update public.jobkix_taxonomy set localized_names='{"en":"Primary schools","fr":"Écoles primaires","es":"Escuelas primarias","hi":"प्राथमिक विद्यालय","tl":"Mga paaralang elementarya","id":"Sekolah dasar","ar":"المدارس الابتدائية"}'::jsonb where kind='setting' and key='primary-schools';
update public.jobkix_taxonomy set localized_names='{"en":"Secondary schools & colleges","fr":"Collèges et lycées","es":"Escuelas secundarias y centros educativos","hi":"माध्यमिक विद्यालय और कॉलेज","tl":"Mga paaralang sekundarya at kolehiyo","id":"Sekolah menengah dan perguruan tinggi","ar":"المدارس الثانوية والكليات"}'::jsonb where kind='setting' and key='secondary-colleges';
update public.jobkix_taxonomy set localized_names='{"en":"International & private schools","fr":"Écoles internationales et privées","es":"Escuelas internacionales y privadas","hi":"अंतरराष्ट्रीय और निजी विद्यालय","tl":"Mga pandaigdigan at pribadong paaralan","id":"Sekolah internasional dan swasta","ar":"المدارس الدولية والخاصة"}'::jsonb where kind='setting' and key='international-schools';
update public.jobkix_taxonomy set localized_names='{"en":"Public education","fr":"Enseignement public","es":"Educación pública","hi":"सार्वजनिक शिक्षा","tl":"Pampublikong edukasyon","id":"Pendidikan negeri","ar":"التعليم العمومي"}'::jsonb where kind='setting' and key='public-education';
update public.jobkix_taxonomy set localized_names='{"en":"Pediatric clinics & hospitals","fr":"Cliniques et hôpitaux pédiatriques","es":"Clínicas y hospitales pediátricos","hi":"बाल चिकित्सा क्लिनिक और अस्पताल","tl":"Mga klinika at ospital para sa bata","id":"Klinik dan rumah sakit anak","ar":"عيادات ومستشفيات الأطفال"}'::jsonb where kind='setting' and key='pediatrics';
update public.jobkix_taxonomy set localized_names='{"en":"Maternity & neonatal settings","fr":"Maternités et néonatologie","es":"Maternidad y atención neonatal","hi":"प्रसूति और नवजात देखभाल","tl":"Mga pasilidad para sa ina at bagong silang","id":"Layanan bersalin dan neonatal","ar":"الأمومة ورعاية حديثي الولادة"}'::jsonb where kind='setting' and key='maternity-neonatal';
update public.jobkix_taxonomy set localized_names='{"en":"Therapy & developmental centers","fr":"Centres thérapeutiques et de développement","es":"Centros de terapia y desarrollo","hi":"चिकित्सा और विकास केंद्र","tl":"Mga sentro ng terapiya at pag-unlad","id":"Pusat terapi dan perkembangan","ar":"مراكز العلاج والنمو"}'::jsonb where kind='setting' and key='therapy-development';
update public.jobkix_taxonomy set localized_names='{"en":"Hotels, resorts & kids clubs","fr":"Hôtels, resorts et clubs enfants","es":"Hoteles, complejos y clubes infantiles","hi":"होटल, रिसॉर्ट और बाल क्लब","tl":"Mga hotel, resort at club para sa bata","id":"Hotel, resor, dan klub anak","ar":"الفنادق والمنتجعات وأندية الأطفال"}'::jsonb where kind='setting' and key='hospitality';
update public.jobkix_taxonomy set localized_names='{"en":"Camps, sports & recreation","fr":"Camps, sports et loisirs","es":"Campamentos, deporte y recreación","hi":"शिविर, खेल और मनोरंजन","tl":"Mga kampo, palakasan at libangan","id":"Perkemahan, olahraga, dan rekreasi","ar":"المخيمات والرياضة والترفيه"}'::jsonb where kind='setting' and key='camps-sports';
update public.jobkix_taxonomy set localized_names='{"en":"NGOs, charities & child welfare","fr":"ONG, associations et protection de l’enfance","es":"ONG, entidades benéficas y bienestar infantil","hi":"गैर-सरकारी संगठन और बाल कल्याण","tl":"Mga NGO, kawanggawa at kapakanan ng bata","id":"LSM, amal, dan kesejahteraan anak","ar":"المنظمات والجمعيات ورعاية الطفل"}'::jsonb where kind='setting' and key='ngo-child-welfare';
update public.jobkix_taxonomy set localized_names='{"en":"School transport, food & operations","fr":"Transport, restauration et services scolaires","es":"Transporte, alimentación y servicios escolares","hi":"स्कूल परिवहन, भोजन और संचालन","tl":"Transportasyon, pagkain at operasyon sa paaralan","id":"Transportasi, makanan, dan operasional sekolah","ar":"النقل والتغذية والخدمات المدرسية"}'::jsonb where kind='setting' and key='school-operations';
update public.jobkix_taxonomy set localized_names='{"en":"Digital learning & child content","fr":"Apprentissage numérique et contenus jeunesse","es":"Aprendizaje digital y contenidos infantiles","hi":"डिजिटल शिक्षा और बाल सामग्री","tl":"Digital na pagkatuto at nilalaman para sa bata","id":"Pembelajaran digital dan konten anak","ar":"التعلم الرقمي ومحتوى الأطفال"}'::jsonb where kind='setting' and key='digital-learning';
update public.jobkix_taxonomy set localized_names='{"en":"Public agencies & specialist institutions","fr":"Organismes publics et institutions spécialisées","es":"Organismos públicos e instituciones especializadas","hi":"सार्वजनिक एजेंसियाँ और विशिष्ट संस्थान","tl":"Mga ahensiyang pampubliko at dalubhasang institusyon","id":"Lembaga publik dan institusi khusus","ar":"الهيئات العمومية والمؤسسات المتخصصة"}'::jsonb where kind='setting' and key='public-specialist';
update public.jobkix_taxonomy set localized_names='{"en":"Nanny","fr":"Garde d’enfants","es":"Cuidador infantil","hi":"बाल देखभाल पेशेवर","tl":"Tagapag-alaga ng bata","id":"Pengasuh anak","ar":"مربّي أطفال"}'::jsonb,synonyms=array['childminder','nounou','niñera']::text[] where kind='occupation' and key='nanny';
update public.jobkix_taxonomy set localized_names='{"en":"Family assistant","fr":"Assistant familial","es":"Asistente familiar","hi":"परिवार सहायक","tl":"Katulong sa pamilya","id":"Asisten keluarga","ar":"مساعد أسرة"}'::jsonb,synonyms=array['family support','assistant familial']::text[] where kind='occupation' and key='family-assistant';
update public.jobkix_taxonomy set localized_names='{"en":"Early childhood educator","fr":"Éducateur de jeunes enfants","es":"Educador infantil","hi":"प्रारंभिक बाल शिक्षक","tl":"Tagapagturo sa maagang pagkabata","id":"Pendidik anak usia dini","ar":"مربّي الطفولة المبكرة"}'::jsonb,synonyms=array['nursery practitioner','éducateur','educadora']::text[] where kind='occupation' and key='early-childhood-educator';
update public.jobkix_taxonomy set localized_names='{"en":"Montessori guide","fr":"Éducateur Montessori","es":"Guía Montessori","hi":"मोंटेसरी मार्गदर्शक","tl":"Gabay sa Montessori","id":"Pemandu Montessori","ar":"موجّه مونتيسوري"}'::jsonb,synonyms=array['montessori teacher']::text[] where kind='occupation' and key='montessori-guide';
update public.jobkix_taxonomy set localized_names='{"en":"Teacher","fr":"Enseignant","es":"Docente","hi":"शिक्षक","tl":"Guro","id":"Guru","ar":"معلّم"}'::jsonb,synonyms=array['enseignant','professeur','maestro']::text[] where kind='occupation' and key='teacher';
update public.jobkix_taxonomy set localized_names='{"en":"Teaching assistant","fr":"Assistant pédagogique","es":"Asistente docente","hi":"शिक्षण सहायक","tl":"Katulong sa pagtuturo","id":"Asisten pengajar","ar":"مساعد تربوي"}'::jsonb,synonyms=array['classroom assistant','assistant pédagogique']::text[] where kind='occupation' and key='teaching-assistant';
update public.jobkix_taxonomy set localized_names='{"en":"Nurse","fr":"Infirmier","es":"Profesional de enfermería","hi":"नर्स","tl":"Nars","id":"Perawat","ar":"ممرّض"}'::jsonb,synonyms=array['registered nurse','infirmier','infirmière','enfermero']::text[] where kind='occupation' and key='nurse';
update public.jobkix_taxonomy set localized_names='{"en":"Pediatrician","fr":"Pédiatre","es":"Pediatra","hi":"बाल रोग विशेषज्ञ","tl":"Doktor ng mga bata","id":"Dokter anak","ar":"طبيب أطفال"}'::jsonb,synonyms=array['paediatrician','pédiatre','pediatra']::text[] where kind='occupation' and key='pediatrician';
update public.jobkix_taxonomy set localized_names='{"en":"Therapy specialist","fr":"Spécialiste en thérapie","es":"Especialista en terapia","hi":"चिकित्सा विशेषज्ञ","tl":"Dalubhasa sa terapiya","id":"Spesialis terapi","ar":"اختصاصي علاج"}'::jsonb,synonyms=array['therapist','speech therapist','occupational therapist']::text[] where kind='occupation' and key='therapy-specialist';
update public.jobkix_taxonomy set localized_names='{"en":"School administrator","fr":"Administrateur scolaire","es":"Administrador escolar","hi":"विद्यालय प्रशासक","tl":"Tagapangasiwa ng paaralan","id":"Administrator sekolah","ar":"إداري مدرسي"}'::jsonb,synonyms=array['school office','administrateur scolaire']::text[] where kind='occupation' and key='school-administrator';
update public.jobkix_taxonomy set localized_names='{"en":"Counselor","fr":"Conseiller","es":"Orientador","hi":"परामर्शदाता","tl":"Tagapayo","id":"Konselor","ar":"مستشار"}'::jsonb,synonyms=array['counsellor','conseiller']::text[] where kind='occupation' and key='counselor';
update public.jobkix_taxonomy set localized_names='{"en":"Driver","fr":"Chauffeur","es":"Conductor","hi":"चालक","tl":"Drayber","id":"Pengemudi","ar":"سائق"}'::jsonb,synonyms=array['school bus driver','chauffeur']::text[] where kind='occupation' and key='driver';
update public.jobkix_taxonomy set localized_names='{"en":"Cook","fr":"Cuisinier","es":"Cocinero","hi":"रसोइया","tl":"Tagapagluto","id":"Juru masak","ar":"طاهٍ"}'::jsonb,synonyms=array['school catering','cuisinier']::text[] where kind='occupation' and key='cook';
update public.jobkix_taxonomy set localized_names='{"en":"Activity leader","fr":"Animateur","es":"Coordinador de actividades","hi":"गतिविधि समन्वयक","tl":"Tagapamuno ng mga gawain","id":"Koordinator kegiatan","ar":"منشّط أنشطة"}'::jsonb,synonyms=array['camp counselor','animateur','sports coach']::text[] where kind='occupation' and key='activity-leader';
update public.jobkix_taxonomy set localized_names='{"en":"Learning designer","fr":"Concepteur pédagogique","es":"Diseñador de aprendizaje","hi":"शिक्षण डिज़ाइनर","tl":"Tagadisenyo ng pagkatuto","id":"Perancang pembelajaran","ar":"مصمّم تعلّم"}'::jsonb,synonyms=array['educational content','edtech']::text[] where kind='occupation' and key='learning-designer';
update public.jobkix_taxonomy set localized_names='{"en":"Safeguarding officer","fr":"Responsable de la protection","es":"Responsable de protección","hi":"सुरक्षा एवं संरक्षण अधिकारी","tl":"Opisyal sa pangangalaga at proteksyon","id":"Petugas perlindungan","ar":"مسؤول حماية"}'::jsonb,synonyms=array['child protection','protection de l’enfance']::text[] where kind='occupation' and key='safeguarding-officer';
insert into public.jobkix_schema_versions(version) values(4);
commit;
