/** Hospitality Signature R2 commercial narrative.
 * Original hotel proposal informs structure; no unverified guaranteed outcomes,
 * reference logos, availability, commission rates or service times are asserted.
 */
export type HLocale="fr"|"en"|"ar";
export type HWord=Readonly<Record<HLocale,string>>;
export const h=(fr:string,en:string,ar:string):HWord=>({fr,en,ar});
export const ht=(v:HWord,l:HLocale)=>v[l];
export const H={
 eyebrow:h("PARTENARIATS HÔTELS & RESORTS","HOTELS & RESORTS PARTNERSHIPS","شراكات الفنادق والمنتجعات"),
 heroTitle:h("Transformez votre hôtel en une destination que les familles choisissent.","Become the destination families choose.","اجعلوا فندقكم الوجهة التي تختارها العائلات"),
 heroLead:h("Des expériences enfants mémorables. Plus de liberté pour les parents. Un dispositif pensé pour votre équipe et l'identité de votre établissement.","Memorable experiences for children. More freedom for parents. An operating model designed for your people and your property's signature.","تجارب لا تُنسى للأطفال، ووقت أوسع للآباء، ونموذج تشغيل يناسب فريقكم وهوية منشأتكم."),
 cta:h("Concevoir mon programme hôtelier","Design my hotel programme","صمّموا برنامج فندقكم"),
 explore:h("Explorer les solutions réelles","Explore live solutions","استكشاف الحلول المتاحة"),
 assurance:[h("Modèle défini pour chaque propriété","Property-specific operating scope","نطاق مخصص لكل منشأة"),h("Prestations selon conditions convenues","Delivery subject to agreed terms","الخدمات وفق الشروط المتفق عليها"),h("Catalogue natif et offres publiées","Native catalogue, published offers","كتالوج أصلي وعروض منشورة")],
 nav:[h("Votre avantage","Your advantage","قيمة الشراكة"),h("Les expériences","Experiences","التجارب"),h("Notre organisation","How it works","طريقة التشغيل"),h("Solutions publiées","Live solutions","الحلول المنشورة"),h("Parlons de votre hôtel","Discuss your property","لنتحدث عن فندقكم")],
 comparisonTitle:h("Un séjour classique ou une véritable expérience famille ?","A standard stay—or a family experience worth choosing?","إقامة عادية أم تجربة عائلية تستحق الاختيار؟"),
 comparisonLead:h("L'enjeu n'est pas d'ajouter une activité. C'est d'offrir aux familles une raison de préférer votre établissement.","The opportunity isn't to add another activity. It's to give families a reason to prefer your property.","الفرصة ليست إضافة نشاط، بل منح العائلات سبباً لاختيار منشأتكم."),
 ordinary:h("Un séjour ordinaire","A standard stay","إقامة عادية"),
 elevated:h("L'expérience signature","The signature experience","تجربة استثنائية"),
 ordinaryText:h("Un bel hébergement, mais les familles doivent organiser seules les moments des enfants.","Beautiful accommodation, while families must organise children's experiences themselves.","إقامة جميلة، لكن العائلات تدبّر أنشطة الأطفال بنفسها."),
 elevatedText:h("Un programme adapté au lieu, aux âges et aux attentes des familles, structuré avec votre équipe.","A programme shaped around the property, children's ages and family expectations, coordinated with your team.","برنامج يناسب المكان والأعمار وتوقعات العائلات، بتنسيق مع فريقكم."),
 benefitEyebrow:h("L'ARGUMENT QUI COMPTE POUR LA DIRECTION","THE EXECUTIVE BUSINESS CASE","القيمة الحقيقية للإدارة"),
 benefitTitle:h("Une expérience plus riche. Une gestion plus sereine.","A richer experience. A calmer operation.","تجربة أغنى وتشغيل أكثر سلاسة."),
 benefitLead:h("La valeur se joue à la fois côté clients, opérations et positionnement de marque.","Value must make sense for guests, operations and the brand.","القيمة الحقيقية تشمل الضيوف والتشغيل وهوية العلامة."),
 signatureEyebrow:h("QUATRE UNIVERS. UNE MÊME EXIGENCE.","FOUR WORLDS. ONE HIGH STANDARD.","أربعة عوالم بمعيار واحد"),
 signatureTitle:h("À chaque hôtel, son expérience famille.","A family experience with your property's own signature.","لكل فندق تجربته العائلية المميزة."),
 signatureLead:h("Choisissez un univers, découvrez son périmètre et construisez une solution adaptée.","Choose an experience, understand its scope and configure what works for your property.","اختاروا تجربةً وافهموا نطاقها وصمّموا ما يناسب منشأتكم."),
 liveEyebrow:h("LE CATALOGUE, PAS DES PROMESSES INVENTÉES","THE LIVE CATALOGUE, NOT INVENTED PACKAGES","الكتالوج الحقيقي وليس وعوداً مختلقة"),
 liveTitle:h("Explorez des offres réellement publiées.","Explore actual published hospitality solutions.","اكتشفوا حلول الضيافة المنشورة فعلياً."),
 liveLead:h("Les offres, disponibilités et modalités viennent du catalogue AngelCare, sans tarif fictif ni changement de catégorie.","Offers, availability and terms come directly from AngelCare's catalogue—no invented pricing or category changes.","العروض والتوفر والشروط من كتالوج أنجل كير مباشرةً دون أسعار أو تصنيفات مختلقة."),
 propertyEyebrow:h("STUDIO DE VOTRE PROPRIÉTÉ","PROPERTY EXPERIENCE DESIGNER","استوديو تصميم تجربة منشأتكم"),
 propertyTitle:h("Votre propriété change tout.","Your property changes the possibilities.","منشأتكم هي ما يصنع الاختلاف."),
 propertyLead:h("Explorez un contexte de départ. La sélection enrichit votre brief de partenariat sans présumer des services disponibles.","Start with a property context. Your choice shapes the partnership brief without assuming service availability.","ابدؤوا بنوع منشأتكم، واختياراتكم تُثري طلب الشراكة دون افتراض توفر الخدمات."),
 ageTitle:h("Du premier atelier aux aventures des ados.","From first creative moments to teen adventures.","من أول ورشة إبداعية إلى مغامرات المراهقين."),
 ageLead:h("Trois tranches d'âge issues de notre proposition hôtels. Le programme réel dépend de la qualification et des conditions d'encadrement.","Three age groups from our hotel proposal. Actual programme eligibility depends on qualification and safeguarding conditions.","ثلاث فئات عمرية من عرض الفنادق، والتنفيذ الفعلي يخضع لتقييم الاحتياجات وشروط الرعاية."),
 atlasTitle:h("Huit idées pour faire vivre votre destination.","Eight possibilities to bring your destination to life.","ثماني أفكار تمنح وجهتكم حياةً جديدة."),
 atlasLead:h("Des formats inspirés de notre proposition hôtels. Ces concepts ne constituent pas des prestations automatiquement disponibles.","Concepts informed by our hotel proposal—not automatically available bookable services.","أفكار مستوحاة من عرضنا للفنادق وليست خدمات قابلة للحجز تلقائياً."),
 dayTitle:h("Vivez l'expérience comme une famille.","See the stay through a family's eyes.","عيشوا الإقامة بعيون العائلة."),
 operationsTitle:h("Un partenaire opérationnel, pas une charge supplémentaire.","An operating partner—not another management burden.","شريك تشغيلي لا عبء إضافي على الإدارة."),
 operationsLead:h("Définir les rôles, former les équipes, préparer la sécurité et suivre l'expérience : une méthode claire, adaptée à votre contrat.","Define responsibilities, prepare teams and safeguarding, coordinate delivery and review the experience—within an agreed scope.","تحديد الأدوار وإعداد الفرق والسلامة وتنسيق التنفيذ والمتابعة ضمن نطاق متفق عليه."),
 economicsTitle:h("Construisez votre scénario, sans fausses promesses de revenus.","Build an informed scenario—not fictional revenue promises.","ابنوا تصوراً واقعياً دون وعود أرباح غير موثوقة."),
 economicsLead:h("Un cadre de discussion : volumes estimés, jours d'activité et modèle commercial à convenir. Ce calcul ne prédit pas la demande ni un retour financier.","A planning conversation around estimated volume, programme days and an agreed commercial model. These inputs are not demand or ROI forecasts.","تقديرات لعدد الأسر وأيام التشغيل والنموذج التجاري؛ ليست توقعات للطلب أو العائد."),
 trustTitle:h("Des standards visibles. Des engagements vérifiables.","Visible standards. Verifiable commitments.","معايير واضحة والتزامات قابلة للتحقق."),
 trustLead:h("Aucun logo partenaire ni résultat chiffré sans validation. Notre crédibilité repose sur un périmètre clair, des procédures et des responsabilités définies.","No partner logo or outcome claim without verification. Trust begins with documented scope, procedures and accountable people.","لا شعارات شركاء ولا نتائج رقمية دون تحقق؛ الثقة تبدأ بنطاق واضح وإجراءات ومسؤوليات محددة."),
 pathTitle:h("De la première rencontre au programme en exploitation.","From the first conversation to a running programme.","من أول لقاء إلى برنامج يُنفّذ على أرض الواقع."),
 pathLead:h("Une trajectoire en six étapes inspirée de notre proposition hôtels. Votre calendrier dépendra de la qualification du projet.","Six steps drawn from our hotel proposal. Your timeline depends on project qualification.","ست مراحل مستوحاة من عرض الفنادق، والجدول الزمني يتحدد بعد تقييم المشروع."),
 fullTitle:h("Comparez, sélectionnez, décidez.","Compare, shortlist, decide.","قارنوا واختاروا واتخذوا القرار."),
 fullLead:h("Le catalogue natif conserve ses vrais filtres, prix publiés, détails, disponibilité, favoris, comparaison et demandes de devis.","The original catalogue preserves its authentic filters, published prices, details, availability, saving, comparison and quotation actions.","يحتفظ الكتالوج الأصلي بفلاتره وأسعاره المنشورة وتفاصيله وتوفره ومفضلاته ومقارنته وطلب التسعير."),
 briefTitle:h("Votre établissement mérite une proposition sur mesure.","Your property deserves a tailored partnership proposal.","منشأتكم تستحق عرض شراكة مصمماً لها."),
 briefLead:h("Votre sélection d'expériences, votre contexte hôtelier et vos offres enregistrées restent dans votre projet.","Your experience selections, property context and saved offers stay with your project.","تظل اختياراتكم وسياق الفندق والعروض المحفوظة ضمن طلبكم."),
 briefAction:h("Demander une étude partenariat","Request a partnership study","طلب دراسة شراكة"),
 noClaim:h("Illustration commerciale, selon étude et conditions contractuelles.","Commercial illustration, subject to assessment and agreed terms.","تصور تجاري يخضع للدراسة والشروط المتفق عليها."),
 addBrief:h("Ajouter à mon projet","Add to my brief","أضف إلى مشروعي"),
 inBrief:h("Ajouté au projet","Added to brief","أُضيف إلى المشروع"),
 seeDetails:h("Découvrir le programme","Explore the programme","اكتشف البرنامج"),
 propertyCTA:h("Définir mes priorités","Define my priorities","تحديد أولوياتي"),
 dailyCTA:h("Imaginer cette expérience","Include this experience","إضافة هذه التجربة"),
 calculate:h("Scénario d'exploitation","Operating scenario","سيناريو التشغيل"),
 days:h("Jours d'animation par période","Programme days per period","أيام البرنامج خلال الفترة"),
 volume:h("Familles potentielles par jour (hypothèse)","Potential families per day (assumption)","عائلات محتملة يومياً (افتراض)"),
 exposure:h("Points de contact potentiels (non garantis)","Potential family touchpoints (not guaranteed)","نقاط تواصل محتملة (غير مضمونة)"),
 estimateWarning:h("Volume théorique = jours × familles/jour. Aucun tarif, revenu, taux d'occupation ou coût de personnel n'est déduit.","Illustrative volume = days × families/day. No pricing, revenue, occupancy uplift or staffing cost is inferred.","الحجم الافتراضي = الأيام × العائلات يومياً، دون استنتاج أسعار أو إيرادات أو نسب إشغال."),
 presentation:h("Imaginer le futur de l'accueil famille","Imagine the future of family hospitality","تخيّلوا مستقبل ضيافة العائلات"),
 creative:h("Créativité, détente et qualité de service dans une même expérience.","Creativity, relaxation and service quality in one experience.","إبداع وراحة وجودة خدمة في تجربة واحدة."),
 worldCollection:[
  {key:"kids",image:"games",tone:"sun",title:h("Kids Club & univers éducatifs","Kids Club & creative worlds","نادي الأطفال والعوالم الإبداعية"),body:h("Des moments pensés selon les âges, les espaces et l'identité de votre hôtel.","Age-appropriate creative experiences shaped around your spaces and property identity.","تجارب إبداعية تلائم الأعمار والمساحات وهوية الفندق."),href:"kids-club",priority:0},
  {key:"guest",image:"care",tone:"aqua",title:h("Guest Childcare","Guest childcare","رعاية أطفال الضيوف"),body:h("Un accompagnement à qualifier avec consentement, procédures et transmission claire.","Support qualified through consent, safeguarding protocols and careful handovers.","دعم يُحدد بعد الموافقة وإجراءات السلامة وتسليم الطفل."),href:"guest-childcare",priority:1},
  {key:"concierge",image:"family",tone:"coral",title:h("Family Concierge","Family concierge","كونسيرج العائلة"),body:h("Aider les familles à profiter du séjour avec une orientation attentive et coordonnée.","Help families make the most of their stay through thoughtful coordination.","مساعدة الأسر على الاستمتاع بإقامتهم بتنسيق واهتمام."),href:"family-concierge",priority:2},
  {key:"seasons",image:"holidays",tone:"violet",title:h("Événements & saisons","Events & seasonal programmes","الفعاليات والبرامج الموسمية"),body:h("Vacances, ateliers, événements et expériences ponctuelles adaptés à votre calendrier.","Holiday calendars, themed workshops and seasonal experiences tailored to your operation.","عطلات وورش وفعاليات تناسب موسمكم وجدول عملكم."),href:"seasonal-programs",priority:3},
 ] as const,
 benefitCollection:[
  {icon:"heart",title:h("L'expérience client","Guest experience","تجربة الضيوف"),body:h("Un séjour qui parle aux enfants autant qu'aux parents.","An experience that speaks to children and parents alike.","إقامة تحاكي الأطفال والآباء معاً.")},
  {icon:"shield",title:h("La sérénité opérationnelle","Operational ease","راحة التشغيل"),body:h("Un périmètre de prestation et de coordination défini à l'avance.","Defined delivery responsibilities and coordination points.","مسؤوليات وتنسيق محددان مسبقاً.")},
  {icon:"star",title:h("Votre différence","Property distinction","تميّز منشأتكم"),body:h("Un univers famille cohérent avec la promesse de votre marque.","A family experience aligned with your brand signature.","تجربة عائلية منسجمة مع هوية علامتكم.")},
  {icon:"chart",title:h("Une opportunité à qualifier","A commercial opportunity to assess","فرصة تجارية للتقييم"),body:h("Un modèle de partenariat transparent, à discuter selon le contexte.","A transparent partnership model based on your operating context.","نموذج شراكة شفاف يناسب ظروف التشغيل.")},
 ] as const,
 properties:[
  {id:"city",image:"hospitality",name:h("Hôtel urbain","City hotel","فندق حضري"),title:h("Le service famille à la carte.","Family support at the right moment.","دعم عائلي في الوقت المناسب."),body:h("Séjours courts, espaces flexibles, information concierge et garde sur demande sous réserve de disponibilité.","Short stays, flexible spaces, concierge guidance and request-based childcare, subject to availability.","إقامات قصيرة ومساحات مرنة وكونسيرج ورعاية عند الطلب حسب التوفر."),tags:[h("Accueil coordonné","Coordinated welcome","استقبال منظم"),h("Espaces flexibles","Flexible spaces","مساحات مرنة"),h("Garde sur demande","Request-based care","رعاية عند الطلب")]},
  {id:"resort",image:"games",name:h("Resort de destination","Destination resort","منتجع سياحي"),title:h("Une destination dans la destination.","A destination within your destination.","وجهة عائلية داخل وجهتكم."),body:h("Espace Kids Club, ateliers thématiques, parcours saisonniers et coordination des moments en famille.","Kids Club, themed workshops, seasonal calendars and coordinated family moments.","نادي أطفال وورش موسمية وتجارب عائلية منسقة."),tags:[h("Kids Club","Kids Club","نادي الأطفال"),h("Moments famille","Family moments","أوقات عائلية"),h("Programme saisonnier","Seasonal calendar","برنامج موسمي")]},
  {id:"season",image:"holidays",name:h("Destination saisonnière","Seasonal destination","وجهة موسمية"),title:h("Chaque saison, une nouvelle histoire.","A new story each season.","لكل موسم قصته الجديدة."),body:h("Dispositifs temporaires, calendrier d'animations, adaptations aux périodes d'affluence et événements thématiques.","Temporary formats, activity calendars, peak-period planning and themed events.","برامج مؤقتة وجداول نشاط وفترات ذروة وفعاليات ذات طابع خاص."),tags:[h("Calendrier","Calendar","الجدول"),h("Temps forts","Peak periods","فترات الذروة"),h("Ateliers","Workshops","ورش العمل")]}
 ] as const,
 ages:[
  {id:"3-6",image:"montessori",title:h("3–6 ans · Première découverte","Ages 3–6 · Early discovery","3–6 سنوات · الاستكشاف المبكر"),body:h("Explorations sensorielles, ateliers créatifs et jeux accompagnés adaptés au développement.","Sensory discovery, crafts and guided developmentally appropriate play.","استكشاف حسي وورش إبداعية ولعب موجه يناسب النمو.")},
  {id:"7-12",image:"games",title:h("7–12 ans · Explorer et créer","Ages 7–12 · Explore and create","7–12 سنة · الاستكشاف والإبداع"),body:h("Jeux collectifs, petits défis, spectacles, créations et expériences participatives.","Group games, creative challenges, performances and participatory activities.","ألعاب جماعية وتحديات إبداعية وعروض وأنشطة تفاعلية.")},
  {id:"13-16",image:"holidays",title:h("13–16 ans · Choisir son aventure","Ages 13–16 · Choose the adventure","13–16 سنة · اختيار المغامرة"),body:h("Compétitions, activités numériques encadrées et événements adaptés au programme convenu.","Friendly competitions, supervised digital activities and tailored events.","مسابقات وأنشطة رقمية بإشراف وفعاليات مناسبة للبرنامج.")}
 ] as const,
 concepts:[
  {id:"discovery",image:"holidays",title:h("Exploration & découverte","Exploration & discovery","استكشاف واكتشاف")},
  {id:"nature",image:"family",title:h("Nature & écologie","Nature & ecology","الطبيعة والبيئة")},
  {id:"animation",image:"games",title:h("Animation & spectacles","Animation & shows","التنشيط والعروض")},
  {id:"workshops",image:"montessori",title:h("Ateliers créatifs","Creative workshops","ورش إبداعية")},
  {id:"play",image:"games",title:h("Jeux indoor & outdoor","Indoor & outdoor play","اللعب الداخلي والخارجي")},
  {id:"environment",image:"holidays",title:h("Sensibilisation environnementale","Environmental discovery","التوعية البيئية")},
  {id:"celebration",image:"family",title:h("Fêtes & ambiances","Celebrations & themes","الاحتفالات والأجواء")},
  {id:"kidsclub",image:"care",title:h("Kids Club","Kids Club","نادي الأطفال")}
 ] as const,
 moments:[
  {id:"arrival",image:"hospitality",title:h("01 · Dès l'accueil","01 · At arrival","01 · عند الوصول"),body:h("Informer les familles des programmes, âges et conditions de réservation.","Explain available programmes, age groups and booking terms.","شرح البرامج المتاحة والأعمار وشروط الحجز.")},
  {id:"discover",image:"games",title:h("02 · Explorer","02 · Explore","02 · الاستكشاف"),body:h("Un premier moment d'activité selon le contexte et la disponibilité.","A first experience adapted to the setting and availability.","نشاط أولي وفق السياق والتوفر.")},
  {id:"create",image:"montessori",title:h("03 · Créer","03 · Create","03 · الإبداع"),body:h("Ateliers, activités partagées et animations adaptées.","Workshops, shared activities and age-appropriate programming.","ورش وأنشطة مشتركة تناسب الأعمار.")},
  {id:"parents",image:"care",title:h("04 · Le temps des parents","04 · Parents' time","04 · وقت الآباء"),body:h("Coordonner les demandes de garde conformément aux conditions convenues.","Coordinate childcare requests within agreed safeguarding terms.","تنسيق طلبات الرعاية وفق إجراءات الحماية المتفق عليها.")},
  {id:"departure",image:"family",title:h("05 · Derniers souvenirs","05 · Lasting memories","05 · ذكريات دائمة"),body:h("Transmissions, retour d'expérience et suivi opérationnel.","Handover, guest feedback and operational follow-up.","تسليم المعلومات وملاحظات الضيوف والمتابعة التشغيلية.")}
 ] as const,
 operations:[
  {title:h("Diagnostic de la propriété","Property assessment","تقييم المنشأة"),body:h("Publics, espaces, identité, saison, besoins et contraintes.","Guests, spaces, brand, seasons, needs and constraints.","الضيوف والمساحات والهوية والموسم والاحتياجات.")},
  {title:h("Conception des programmes","Programme design","تصميم البرامج"),body:h("Formats, âges, capacité, séances, langues et équipement.","Formats, ages, capacity, sessions, languages and equipment.","النماذج والأعمار والسعة واللغات والمعدات.")},
  {title:h("Équipes & préparation","People and preparation","الفرق والتحضير"),body:h("Rôles, qualifications, formation et coordination à convenir.","Agreed roles, qualifications, training and coordination.","الأدوار والمؤهلات والتدريب والتنسيق المتفق عليه.")},
  {title:h("Sécurité & transmission","Safeguarding and handovers","السلامة والتسليم"),body:h("Consentement, protocoles de garde, limites et contacts d'urgence.","Consent, care protocols, boundaries and emergency contacts.","الموافقة وإجراءات الرعاية وحدود الخدمة واتصالات الطوارئ.")},
  {title:h("Activation sur site","On-site launch","الانطلاق في المنشأة"),body:h("Information d'accueil, calendrier, interlocuteurs et mise en route.","Reception information, timetable, contacts and on-site introduction.","معلومات الاستقبال والجدول وجهات التواصل وبدء التشغيل.")},
  {title:h("Suivi & amélioration","Review and improvement","المتابعة والتحسين"),body:h("Retours qualitatifs, points de suivi et évolution du programme.","Qualitative feedback, operational reviews and programme refinement.","تقييم الجودة والمتابعة وتطوير البرنامج.")}
 ] as const,
 steps:[
  {title:h("01 · Choisir un modèle","01 · Choose a model","01 · اختيار النموذج"),body:h("Identifier les solutions et l'option de partenariat à étudier.","Identify services and a partnership format to evaluate.","تحديد الحلول ونموذج الشراكة.")},
  {title:h("02 · Étudier votre propriété","02 · Assess your property","02 · دراسة المنشأة"),body:h("Analyser le lieu, les besoins et la faisabilité.","Review property context, needs and feasibility.","تحليل المكان والاحتياجات والإمكانات.")},
  {title:h("03 · Concevoir ensemble","03 · Design together","03 · التصميم معاً"),body:h("Préciser les attentes, les rôles, le programme et le périmètre.","Clarify expectations, ownership, the programme and its scope.","تحديد التوقعات والأدوار والبرنامج ونطاقه.")},
  {title:h("04 · Préparer le lancement","04 · Prepare the launch","04 · التحضير للانطلاق"),body:h("Organiser l'accueil, les équipes et les points de contrôle.","Prepare guest information, teams and readiness checks.","تحضير الاستقبال والفرق وضوابط الجاهزية.")},
  {title:h("05 · Accompagner le séjour","05 · Support delivery","05 · مرافقة التنفيذ"),body:h("Coordonner l'expérience selon le plan d'exploitation validé.","Coordinate delivery against the agreed operating plan.","تنسيق التنفيذ وفق الخطة المتفق عليها.")},
  {title:h("06 · Développer le partenariat","06 · Grow the partnership","06 · تطوير الشراكة"),body:h("Analyser les retours et envisager des programmes complémentaires.","Review learnings and consider suitable additional programmes.","تحليل النتائج والنظر في برامج إضافية.")}
 ] as const
};
