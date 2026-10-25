import type { Tri } from "../catalogue";
export type Choice = { key: string; title: Tri };
export const FOCUS: Record<string, Choice[]> = {
  printables: [
    {
      key: "phonics",
      title: ["Alphabet & Phonics", "Alphabet & phonologie", "الحروف والأصوات"],
    },
    {
      key: "handwriting",
      title: [
        "Pre-Writing & Handwriting",
        "Graphisme & écriture",
        "التهيئة والكتابة",
      ],
    },
    {
      key: "reading",
      title: ["Reading & Language", "Lecture & langage", "القراءة واللغة"],
    },
    {
      key: "numeracy",
      title: [
        "Maths & Number Sense",
        "Maths & nombres",
        "الرياضيات والحس العددي",
      ],
    },
    {
      key: "science",
      title: [
        "Science & Inquiry",
        "Sciences & exploration",
        "العلوم والاستقصاء",
      ],
    },
    {
      key: "reasoning",
      title: [
        "Logic & Reasoning",
        "Logique & raisonnement",
        "المنطق والاستدلال",
      ],
    },
    {
      key: "fine-motor",
      title: [
        "Fine Motor & Scissors",
        "Motricité fine & découpage",
        "المهارات الدقيقة والقص",
      ],
    },
    {
      key: "creativity",
      title: ["Arts & Creativity", "Arts & créativité", "الفنون والإبداع"],
    },
    {
      key: "emotions",
      title: [
        "Social & Emotional",
        "Vie sociale & émotions",
        "التعلم الاجتماعي والعاطفي",
      ],
    },
    {
      key: "life-skills",
      title: [
        "Everyday Skills",
        "Compétences du quotidien",
        "المهارات اليومية",
      ],
    },
    {
      key: "inclusion",
      title: ["Inclusive Learning", "Apprentissage inclusif", "التعلم الدامج"],
    },
    {
      key: "classroom",
      title: ["Classroom Practice", "Pratique en classe", "الممارسة الصفية"],
    },
  ],
  stories: [
    {
      key: "narrative",
      title: [
        "Narrative & Sequencing",
        "Récit & chronologie",
        "السرد والتسلسل",
      ],
    },
    {
      key: "vocabulary",
      title: [
        "Vocabulary & Expression",
        "Vocabulaire & expression",
        "المفردات والتعبير",
      ],
    },
    {
      key: "reading",
      title: ["Reading Confidence", "Confiance en lecture", "الثقة في القراءة"],
    },
    {
      key: "imagination",
      title: [
        "Imagination & Wonder",
        "Imagination & découverte",
        "الخيال والدهشة",
      ],
    },
    {
      key: "inquiry",
      title: [
        "Questions & Curiosity",
        "Questions & curiosité",
        "الأسئلة والفضول",
      ],
    },
    {
      key: "perspective",
      title: [
        "Perspective & Reasoning",
        "Points de vue & raisonnement",
        "وجهات النظر والاستدلال",
      ],
    },
    {
      key: "participation",
      title: [
        "Participatory Reading",
        "Lecture participative",
        "القراءة التشاركية",
      ],
    },
    {
      key: "creativity",
      title: [
        "Illustration & Storymaking",
        "Illustration & création de récits",
        "الرسم وصناعة القصص",
      ],
    },
    {
      key: "emotions",
      title: ["Empathy & Emotions", "Empathie & émotions", "التعاطف والمشاعر"],
    },
    {
      key: "life-skills",
      title: [
        "Everyday Adventures",
        "Aventures du quotidien",
        "مغامرات الحياة اليومية",
      ],
    },
    {
      key: "inclusion",
      title: [
        "Culture & Belonging",
        "Culture & appartenance",
        "الثقافة والانتماء",
      ],
    },
    {
      key: "facilitation",
      title: ["Reading Facilitation", "Animation de lecture", "تيسير القراءة"],
    },
  ],
  learning: [
    {
      key: "pedagogy",
      title: [
        "Child Development & Pedagogy",
        "Développement & pédagogie",
        "نمو الطفل والتربية",
      ],
    },
    {
      key: "language",
      title: [
        "Language & Communication",
        "Langage & communication",
        "اللغة والتواصل",
      ],
    },
    {
      key: "literacy",
      title: [
        "Literacy & Learning Design",
        "Littératie & conception pédagogique",
        "القرائية وتصميم التعلم",
      ],
    },
    {
      key: "numeracy",
      title: [
        "Numeracy Progressions",
        "Progressions mathématiques",
        "تدرج تعلم الرياضيات",
      ],
    },
    {
      key: "science",
      title: [
        "Science & Inquiry Practice",
        "Sciences & démarche d’investigation",
        "العلوم وممارسة الاستقصاء",
      ],
    },
    {
      key: "reflection",
      title: [
        "Observation & Reflection",
        "Observation & réflexion",
        "الملاحظة والتأمل",
      ],
    },
    {
      key: "practice",
      title: [
        "Practical Skill Building",
        "Pratique & compétences",
        "بناء المهارات العملية",
      ],
    },
    {
      key: "creativity",
      title: ["Creative Teaching", "Pédagogie créative", "التدريس الإبداعي"],
    },
    {
      key: "wellbeing",
      title: [
        "Relationships & Wellbeing",
        "Relations & bien-être",
        "العلاقات والرفاه",
      ],
    },
    {
      key: "routines",
      title: [
        "Care & Family Routines",
        "Soin & routines familiales",
        "الرعاية وروتين الأسرة",
      ],
    },
    {
      key: "inclusion",
      title: [
        "Inclusion & Differentiation",
        "Inclusion & différenciation",
        "الدمج والتمايز",
      ],
    },
    {
      key: "professional",
      title: [
        "Professional Practice",
        "Pratique professionnelle",
        "الممارسة المهنية",
      ],
    },
  ],
  video: [
    {
      key: "demonstration",
      title: [
        "Practical Demonstrations",
        "Démonstrations pratiques",
        "عروض عملية",
      ],
    },
    {
      key: "language",
      title: ["Language in Action", "Langage en action", "اللغة في الممارسة"],
    },
    {
      key: "literacy",
      title: [
        "Stories & Literacy",
        "Histoires & littératie",
        "القصص والقرائية",
      ],
    },
    {
      key: "numeracy",
      title: [
        "Visual Mathematics",
        "Mathématiques visuelles",
        "الرياضيات البصرية",
      ],
    },
    {
      key: "science",
      title: [
        "Experiment & Observe",
        "Expérimenter & observer",
        "التجريب والملاحظة",
      ],
    },
    {
      key: "digital",
      title: [
        "Digital & Media Literacy",
        "Culture numérique & médias",
        "الثقافة الرقمية والإعلامية",
      ],
    },
    {
      key: "movement",
      title: [
        "Movement & Coordination",
        "Mouvement & coordination",
        "الحركة والتناسق",
      ],
    },
    {
      key: "creative",
      title: ["Art & Making", "Arts & fabrication", "الفن والصنع"],
    },
    {
      key: "wellbeing",
      title: [
        "Wellbeing & Expression",
        "Bien-être & expression",
        "الرفاه والتعبير",
      ],
    },
    {
      key: "life-skills",
      title: [
        "Everyday Processes",
        "Gestes du quotidien",
        "عمليات الحياة اليومية",
      ],
    },
    {
      key: "inclusion",
      title: ["Accessible Viewing", "Visionnage accessible", "مشاهدة ميسرة"],
    },
    {
      key: "facilitation",
      title: ["Pause & Discuss", "Pause & discussion", "التوقف والمناقشة"],
    },
  ],
  audio: [
    {
      key: "listening",
      title: [
        "Listening & Attention",
        "Écoute & attention",
        "الاستماع والانتباه",
      ],
    },
    {
      key: "language",
      title: [
        "Language & Pronunciation",
        "Langues & prononciation",
        "اللغات والنطق",
      ],
    },
    {
      key: "narration",
      title: ["Narrative Listening", "Écoute narrative", "الاستماع السردي"],
    },
    {
      key: "rhythm",
      title: [
        "Rhythm & Musical Patterns",
        "Rythme & motifs musicaux",
        "الإيقاع والأنماط الموسيقية",
      ],
    },
    {
      key: "inquiry",
      title: ["Sound & Discovery", "Sons & découverte", "الصوت والاكتشاف"],
    },
    {
      key: "reflection",
      title: ["Professional Insights", "Regards professionnels", "رؤى مهنية"],
    },
    {
      key: "memory",
      title: ["Auditory Memory", "Mémoire auditive", "الذاكرة السمعية"],
    },
    {
      key: "creativity",
      title: [
        "Music & Soundmaking",
        "Musique & création sonore",
        "الموسيقى وصناعة الصوت",
      ],
    },
    {
      key: "calm",
      title: [
        "Calm & Emotional Awareness",
        "Calme & conscience émotionnelle",
        "الهدوء والوعي العاطفي",
      ],
    },
    {
      key: "routines",
      title: [
        "Rest & Daily Routines",
        "Repos & routines",
        "الراحة والروتين اليومي",
      ],
    },
    {
      key: "inclusion",
      title: ["Accessible Listening", "Écoute accessible", "استماع ميسر"],
    },
    {
      key: "facilitation",
      title: ["Listen & Respond", "Écouter & répondre", "الاستماع والاستجابة"],
    },
  ],
  "visual-cards": [
    {
      key: "observation",
      title: [
        "Observation & Description",
        "Observation & description",
        "الملاحظة والوصف",
      ],
    },
    {
      key: "language",
      title: [
        "Vocabulary & Conversation",
        "Vocabulaire & conversation",
        "المفردات والمحادثة",
      ],
    },
    {
      key: "reading",
      title: [
        "Symbol & Image Reading",
        "Lecture des signes & images",
        "قراءة الرموز والصور",
      ],
    },
    {
      key: "numeracy",
      title: [
        "Patterns & Quantities",
        "Motifs & quantités",
        "الأنماط والكميات",
      ],
    },
    {
      key: "science",
      title: [
        "Scientific Visual Inquiry",
        "Exploration scientifique visuelle",
        "الاستقصاء العلمي البصري",
      ],
    },
    {
      key: "reasoning",
      title: ["Compare & Classify", "Comparer & classer", "المقارنة والتصنيف"],
    },
    {
      key: "memory",
      title: ["Retrieval & Memory", "Rappel & mémoire", "الاسترجاع والذاكرة"],
    },
    {
      key: "art",
      title: [
        "Art & Visual Culture",
        "Art & culture visuelle",
        "الفن والثقافة البصرية",
      ],
    },
    {
      key: "emotions",
      title: [
        "Emotions & Social Cues",
        "Émotions & indices sociaux",
        "المشاعر والإشارات الاجتماعية",
      ],
    },
    {
      key: "life-skills",
      title: [
        "Visual Daily Routines",
        "Routines visuelles",
        "الروتين البصري اليومي",
      ],
    },
    {
      key: "inclusion",
      title: [
        "Visual Communication",
        "Communication visuelle",
        "التواصل البصري",
      ],
    },
    {
      key: "facilitation",
      title: [
        "Image-Led Discussion",
        "Discussion par l’image",
        "النقاش الموجه بالصور",
      ],
    },
  ],
  presentations: [
    {
      key: "structure",
      title: ["Presentation Structure", "Structure du discours", "بنية العرض"],
    },
    {
      key: "language",
      title: [
        "Speaking & Communication",
        "Expression orale & communication",
        "التعبير الشفهي والتواصل",
      ],
    },
    {
      key: "narrative",
      title: ["Visual Storytelling", "Récit visuel", "السرد البصري"],
    },
    {
      key: "numeracy",
      title: [
        "Data & Number Stories",
        "Récits de données & nombres",
        "قصص البيانات والأعداد",
      ],
    },
    {
      key: "science",
      title: [
        "Scientific Explanation",
        "Explication scientifique",
        "التفسير العلمي",
      ],
    },
    {
      key: "reasoning",
      title: ["Evidence & Arguments", "Preuves & arguments", "الأدلة والحجج"],
    },
    {
      key: "participation",
      title: [
        "Audience Participation",
        "Participation du public",
        "مشاركة الجمهور",
      ],
    },
    {
      key: "creativity",
      title: ["Visual Composition", "Composition visuelle", "التكوين البصري"],
    },
    {
      key: "wellbeing",
      title: [
        "Relationships & Dialogue",
        "Relations & dialogue",
        "العلاقات والحوار",
      ],
    },
    {
      key: "projects",
      title: [
        "School & Family Projects",
        "Projets scolaires & familiaux",
        "مشاريع المدرسة والأسرة",
      ],
    },
    {
      key: "inclusion",
      title: ["Accessible Facilitation", "Animation accessible", "تيسير ميسر"],
    },
    {
      key: "professional",
      title: ["Workshops & Training", "Ateliers & formation", "الورش والتدريب"],
    },
  ],
  assessments: [
    {
      key: "literacy",
      title: ["Literacy Checks", "Repères en littératie", "فحوص القرائية"],
    },
    {
      key: "language",
      title: [
        "Language Understanding",
        "Compréhension du langage",
        "فهم اللغة",
      ],
    },
    {
      key: "comprehension",
      title: ["Reading Comprehension", "Compréhension écrite", "الفهم القرائي"],
    },
    {
      key: "numeracy",
      title: [
        "Mathematical Thinking",
        "Pensée mathématique",
        "التفكير الرياضي",
      ],
    },
    {
      key: "science",
      title: [
        "Scientific Understanding",
        "Compréhension scientifique",
        "الفهم العلمي",
      ],
    },
    {
      key: "reasoning",
      title: [
        "Reasoning & Problem Solving",
        "Raisonnement & résolution",
        "الاستدلال وحل المشكلات",
      ],
    },
    {
      key: "memory",
      title: [
        "Recall & Retrieval",
        "Rappel & restitution",
        "التذكر والاسترجاع",
      ],
    },
    {
      key: "interests",
      title: [
        "Interests & Strengths",
        "Intérêts & points forts",
        "الاهتمامات ونقاط القوة",
      ],
    },
    {
      key: "reflection",
      title: [
        "Reflection & Confidence",
        "Réflexion & confiance",
        "التأمل والثقة",
      ],
    },
    {
      key: "life-skills",
      title: ["Applied Skills", "Compétences appliquées", "المهارات التطبيقية"],
    },
    {
      key: "inclusion",
      title: ["Accessible Assessment", "Évaluation accessible", "تقييم ميسر"],
    },
    {
      key: "professional",
      title: [
        "Professional Preparation",
        "Préparation professionnelle",
        "الإعداد المهني",
      ],
    },
  ],
  activities: [
    {
      key: "literacy",
      title: ["Playful Literacy", "Littératie par le jeu", "القرائية باللعب"],
    },
    {
      key: "language",
      title: [
        "Talk & Role Play",
        "Langage & jeu de rôle",
        "الحديث ولعب الأدوار",
      ],
    },
    {
      key: "narrative",
      title: [
        "Sequence & Retell",
        "Ordonner & raconter",
        "التسلسل وإعادة السرد",
      ],
    },
    {
      key: "numeracy",
      title: ["Mathematical Play", "Jeux mathématiques", "اللعب الرياضي"],
    },
    {
      key: "stem",
      title: [
        "STEM & Discovery",
        "STEM & découverte",
        "العلوم والتقنية والاكتشاف",
      ],
    },
    {
      key: "reasoning",
      title: [
        "Logic & Strategy",
        "Logique & stratégie",
        "المنطق والاستراتيجية",
      ],
    },
    {
      key: "motor",
      title: [
        "Movement & Fine Motor",
        "Mouvement & motricité fine",
        "الحركة والمهارات الدقيقة",
      ],
    },
    {
      key: "creativity",
      title: ["Create & Construct", "Créer & construire", "الإبداع والبناء"],
    },
    {
      key: "social",
      title: [
        "Cooperation & Emotions",
        "Coopération & émotions",
        "التعاون والمشاعر",
      ],
    },
    {
      key: "outdoor",
      title: [
        "Outdoor Exploration",
        "Exploration en plein air",
        "الاستكشاف الخارجي",
      ],
    },
    {
      key: "inclusion",
      title: [
        "Adaptable Participation",
        "Participation adaptable",
        "مشاركة قابلة للتكييف",
      ],
    },
    {
      key: "facilitation",
      title: [
        "Facilitator Practice",
        "Pratique de l’animateur",
        "ممارسة الميسر",
      ],
    },
  ],
  tools: [
    {
      key: "quantity",
      title: [
        "Quantity & Resources",
        "Quantités & ressources",
        "الكميات والموارد",
      ],
    },
    {
      key: "routines",
      title: [
        "Routine Scenarios",
        "Scénarios de routines",
        "سيناريوهات الروتين",
      ],
    },
    {
      key: "measurement",
      title: ["Measurement & Units", "Mesures & unités", "القياس والوحدات"],
    },
    {
      key: "numeracy",
      title: [
        "Maths Modelling",
        "Modélisation mathématique",
        "النمذجة الرياضية",
      ],
    },
    {
      key: "science",
      title: [
        "Scientific Exploration",
        "Exploration scientifique",
        "الاستكشاف العلمي",
      ],
    },
    {
      key: "reasoning",
      title: ["Compare & Predict", "Comparer & prédire", "المقارنة والتنبؤ"],
    },
    {
      key: "engineering",
      title: ["Build & Test", "Construire & tester", "البناء والاختبار"],
    },
    {
      key: "creativity",
      title: [
        "Design & Experiment",
        "Concevoir & expérimenter",
        "التصميم والتجريب",
      ],
    },
    {
      key: "reflection",
      title: [
        "Observe & Interpret",
        "Observer & interpréter",
        "الملاحظة والتفسير",
      ],
    },
    {
      key: "planning",
      title: ["Plan & Estimate", "Planifier & estimer", "التخطيط والتقدير"],
    },
    {
      key: "sustainability",
      title: ["Sustainability Choices", "Choix durables", "خيارات الاستدامة"],
    },
    {
      key: "facilitation",
      title: [
        "Guided Investigation",
        "Investigation accompagnée",
        "الاستقصاء الموجه",
      ],
    },
  ],
  planners: [
    {
      key: "daily",
      title: [
        "Daily Organisation",
        "Organisation quotidienne",
        "التنظيم اليومي",
      ],
    },
    {
      key: "language",
      title: [
        "Communication Routines",
        "Routines de communication",
        "روتين التواصل",
      ],
    },
    {
      key: "learning",
      title: ["Learning Plans", "Plans d’apprentissage", "خطط التعلم"],
    },
    {
      key: "goals",
      title: ["Goals & Progress", "Objectifs & progrès", "الأهداف والتقدم"],
    },
    {
      key: "projects",
      title: [
        "Project Preparation",
        "Préparation de projets",
        "إعداد المشاريع",
      ],
    },
    {
      key: "reflection",
      title: ["Review & Reflect", "Bilan & réflexion", "المراجعة والتأمل"],
    },
    {
      key: "responsibility",
      title: [
        "Shared Responsibilities",
        "Responsabilités partagées",
        "المسؤوليات المشتركة",
      ],
    },
    {
      key: "creativity",
      title: ["Creative Projects", "Projets créatifs", "المشاريع الإبداعية"],
    },
    {
      key: "wellbeing",
      title: ["Rest & Wellbeing", "Repos & bien-être", "الراحة والرفاه"],
    },
    {
      key: "meals",
      title: [
        "Meals & Home Life",
        "Repas & vie familiale",
        "الوجبات والحياة المنزلية",
      ],
    },
    {
      key: "inclusion",
      title: ["Accessible Routines", "Routines accessibles", "روتين ميسر"],
    },
    {
      key: "trips",
      title: [
        "Trips & Transitions",
        "Voyages & transitions",
        "الرحلات والانتقالات",
      ],
    },
  ],
  forms: [
    {
      key: "contact",
      title: [
        "Contact & Assistance",
        "Contact & assistance",
        "التواصل والمساعدة",
      ],
    },
    {
      key: "communication",
      title: [
        "Family Communication",
        "Communication familiale",
        "تواصل الأسرة",
      ],
    },
    {
      key: "applications",
      title: [
        "Applications & Enrolment",
        "Candidatures & inscriptions",
        "الطلبات والتسجيل",
      ],
    },
    {
      key: "feedback",
      title: [
        "Feedback & Evaluation",
        "Retours & évaluation",
        "الملاحظات والتقييم",
      ],
    },
    {
      key: "observation",
      title: [
        "Observation Collection",
        "Recueil d’observations",
        "جمع الملاحظات",
      ],
    },
    {
      key: "requests",
      title: ["Service Requests", "Demandes de services", "طلبات الخدمات"],
    },
    {
      key: "attachments",
      title: [
        "Protected Attachments",
        "Pièces jointes protégées",
        "المرفقات المحمية",
      ],
    },
    {
      key: "contributions",
      title: [
        "Creative Contributions",
        "Contributions créatives",
        "المساهمات الإبداعية",
      ],
    },
    {
      key: "wellbeing",
      title: [
        "Care & Support Needs",
        "Besoins de soin & soutien",
        "احتياجات الرعاية والدعم",
      ],
    },
    {
      key: "events",
      title: [
        "Events & Participation",
        "Événements & participation",
        "الفعاليات والمشاركة",
      ],
    },
    {
      key: "accessibility",
      title: [
        "Accessible Submissions",
        "Soumissions accessibles",
        "تقديم ميسر",
      ],
    },
    {
      key: "followup",
      title: [
        "Preparation & Follow-Up",
        "Préparation & suivi",
        "الإعداد والمتابعة",
      ],
    },
  ],
  community: [
    {
      key: "experience",
      title: [
        "Shared Experiences",
        "Expériences partagées",
        "التجارب المشتركة",
      ],
    },
    {
      key: "language",
      title: [
        "Language & Conversation",
        "Langage & conversation",
        "اللغة والمحادثة",
      ],
    },
    {
      key: "reading",
      title: [
        "Reading Communities",
        "Communautés de lecture",
        "مجتمعات القراءة",
      ],
    },
    {
      key: "learning",
      title: [
        "Learning Questions",
        "Questions d’apprentissage",
        "أسئلة التعلم",
      ],
    },
    {
      key: "inquiry",
      title: [
        "Inquiry & Discovery",
        "Exploration & découverte",
        "الاستقصاء والاكتشاف",
      ],
    },
    {
      key: "practice",
      title: [
        "Professional Exchange",
        "Échange professionnel",
        "التبادل المهني",
      ],
    },
    {
      key: "cooperation",
      title: ["Peer Collaboration", "Coopération entre pairs", "تعاون الأقران"],
    },
    {
      key: "creativity",
      title: [
        "Creative Contributions",
        "Contributions créatives",
        "المساهمات الإبداعية",
      ],
    },
    {
      key: "wellbeing",
      title: ["Care & Wellbeing", "Soin & bien-être", "الرعاية والرفاه"],
    },
    {
      key: "routines",
      title: [
        "Family & School Life",
        "Vie familiale & scolaire",
        "الحياة الأسرية والمدرسية",
      ],
    },
    {
      key: "inclusion",
      title: [
        "Belonging & Inclusion",
        "Appartenance & inclusion",
        "الانتماء والدمج",
      ],
    },
    {
      key: "resources",
      title: [
        "Resource Discussions",
        "Discussions de ressources",
        "نقاشات الموارد",
      ],
    },
  ],
  commerce: [
    {
      key: "preparation",
      title: [
        "Resource Preparation",
        "Préparation des ressources",
        "إعداد الموارد",
      ],
    },
    {
      key: "language",
      title: ["Language Resources", "Ressources de langage", "موارد اللغة"],
    },
    {
      key: "literacy",
      title: [
        "Reading & Literacy Kits",
        "Kits de lecture & littératie",
        "حزم القراءة والقرائية",
      ],
    },
    {
      key: "numeracy",
      title: [
        "Mathematical Resources",
        "Ressources mathématiques",
        "موارد الرياضيات",
      ],
    },
    {
      key: "science",
      title: [
        "STEM Resource Kits",
        "Kits de ressources STEM",
        "حزم موارد العلوم والتقنية",
      ],
    },
    {
      key: "reasoning",
      title: [
        "Logic & Strategy Kits",
        "Kits de logique & stratégie",
        "حزم المنطق والاستراتيجية",
      ],
    },
    {
      key: "motor",
      title: [
        "Making & Motor Skills",
        "Fabrication & motricité",
        "الصنع والمهارات الحركية",
      ],
    },
    {
      key: "creativity",
      title: [
        "Creative Resource Kits",
        "Kits créatifs",
        "حزم الموارد الإبداعية",
      ],
    },
    {
      key: "wellbeing",
      title: [
        "Social & Emotional Kits",
        "Kits sociaux & émotionnels",
        "حزم التعلم الاجتماعي والعاطفي",
      ],
    },
    {
      key: "routines",
      title: [
        "Family Routine Resources",
        "Ressources de routines familiales",
        "موارد روتين الأسرة",
      ],
    },
    {
      key: "inclusion",
      title: [
        "Inclusive Resource Choices",
        "Choix de ressources inclusives",
        "خيارات موارد دامجة",
      ],
    },
    {
      key: "professional",
      title: [
        "Professional Toolkits",
        "Kits professionnels",
        "حزم الأدوات المهنية",
      ],
    },
  ],
  bundles: [
    {
      key: "welcome",
      title: [
        "Welcome & Orientation",
        "Accueil & orientation",
        "الترحيب والتوجيه",
      ],
    },
    {
      key: "language",
      title: ["Language Journeys", "Parcours de langage", "مسارات اللغة"],
    },
    {
      key: "literacy",
      title: ["Reading Journeys", "Parcours de lecture", "مسارات القراءة"],
    },
    {
      key: "numeracy",
      title: [
        "Mathematical Journeys",
        "Parcours mathématiques",
        "مسارات الرياضيات",
      ],
    },
    {
      key: "science",
      title: ["Discovery Projects", "Projets de découverte", "مشاريع الاكتشاف"],
    },
    {
      key: "reasoning",
      title: [
        "Thinking & Problem Solving",
        "Réflexion & résolution",
        "التفكير وحل المشكلات",
      ],
    },
    {
      key: "practice",
      title: [
        "Practice & Consolidation",
        "Pratique & consolidation",
        "الممارسة والترسيخ",
      ],
    },
    {
      key: "creativity",
      title: ["Creative Journeys", "Parcours créatifs", "المسارات الإبداعية"],
    },
    {
      key: "wellbeing",
      title: [
        "Relationships & Wellbeing",
        "Relations & bien-être",
        "العلاقات والرفاه",
      ],
    },
    {
      key: "routines",
      title: [
        "Routines & Transitions",
        "Routines & transitions",
        "الروتين والانتقالات",
      ],
    },
    {
      key: "inclusion",
      title: ["Inclusive Pathways", "Parcours inclusifs", "مسارات دامجة"],
    },
    {
      key: "professional",
      title: [
        "Classroom & Professional Use",
        "Usage en classe & professionnel",
        "الاستخدام الصفي والمهني",
      ],
    },
  ],
};
export const NEEDS: Choice[] = [
  {
    key: "literacy",
    title: ["Start Literacy", "Commencer la lecture", "بدء القرائية"],
  },
  {
    key: "confidence",
    title: ["Build Confidence", "Renforcer la confiance", "بناء الثقة"],
  },
  {
    key: "independent",
    title: [
      "Practise Independently",
      "Pratiquer en autonomie",
      "الممارسة المستقلة",
    ],
  },
  {
    key: "support",
    title: [
      "Support Diverse Learners",
      "Accompagner tous les apprenants",
      "دعم تنوع المتعلمين",
    ],
  },
  {
    key: "making",
    title: ["Make & Create", "Fabriquer & créer", "الصنع والإبداع"],
  },
  {
    key: "together",
    title: [
      "Learn Together at Home",
      "Apprendre ensemble à la maison",
      "التعلم معاً في المنزل",
    ],
  },
];
const NEED_SETS: Record<string, Choice[]> = {
  forms: [
    {
      key: "support",
      title: ["Get Assistance", "Obtenir de l’aide", "الحصول على المساعدة"],
    },
    {
      key: "application",
      title: [
        "Prepare an Application",
        "Préparer une candidature",
        "إعداد طلب",
      ],
    },
    {
      key: "event",
      title: [
        "Join an Event",
        "Participer à un événement",
        "المشاركة في فعالية",
      ],
    },
    {
      key: "feedback",
      title: ["Share Feedback", "Donner un retour", "مشاركة الملاحظات"],
    },
    {
      key: "attachments",
      title: ["Submit Attachments", "Envoyer des pièces", "إرسال مرفقات"],
    },
    {
      key: "request",
      title: ["Request a Service", "Demander un service", "طلب خدمة"],
    },
  ],
  community: [
    {
      key: "ask",
      title: ["Ask a Question", "Poser une question", "طرح سؤال"],
    },
    {
      key: "experience",
      title: ["Share an Experience", "Partager une expérience", "مشاركة تجربة"],
    },
    {
      key: "professional",
      title: [
        "Exchange Practices",
        "Échanger des pratiques",
        "تبادل الممارسات",
      ],
    },
    {
      key: "support",
      title: ["Find Peer Support", "Trouver du soutien", "العثور على دعم"],
    },
    {
      key: "contribute",
      title: [
        "Contribute Resources",
        "Contribuer des ressources",
        "المساهمة بموارد",
      ],
    },
    {
      key: "discuss",
      title: ["Discuss Together", "Discuter ensemble", "النقاش معاً"],
    },
  ],
  planners: [
    {
      key: "daily",
      title: ["Organise the Day", "Organiser la journée", "تنظيم اليوم"],
    },
    {
      key: "goals",
      title: ["Follow a Goal", "Suivre un objectif", "متابعة هدف"],
    },
    {
      key: "meals",
      title: [
        "Prepare Family Meals",
        "Préparer les repas",
        "إعداد وجبات الأسرة",
      ],
    },
    {
      key: "project",
      title: ["Plan a Project", "Planifier un projet", "تخطيط مشروع"],
    },
    {
      key: "trip",
      title: ["Prepare a Trip", "Préparer un voyage", "إعداد رحلة"],
    },
    {
      key: "routine",
      title: [
        "Coordinate Routines",
        "Coordonner les routines",
        "تنسيق الروتين",
      ],
    },
  ],
  tools: [
    {
      key: "estimate",
      title: ["Estimate Resources", "Estimer les ressources", "تقدير الموارد"],
    },
    {
      key: "compare",
      title: ["Compare Options", "Comparer les options", "مقارنة الخيارات"],
    },
    {
      key: "predict",
      title: ["Predict an Outcome", "Prédire un résultat", "توقع نتيجة"],
    },
    {
      key: "test",
      title: ["Build & Test", "Construire & tester", "البناء والاختبار"],
    },
    {
      key: "interpret",
      title: [
        "Interpret Results",
        "Interpréter les résultats",
        "تفسير النتائج",
      ],
    },
    {
      key: "facilitate",
      title: [
        "Lead an Investigation",
        "Animer une investigation",
        "تيسير استقصاء",
      ],
    },
  ],
  presentations: [
    {
      key: "explain",
      title: ["Explain a Concept", "Expliquer un concept", "شرح مفهوم"],
    },
    {
      key: "story",
      title: ["Tell a Story", "Raconter une histoire", "سرد قصة"],
    },
    {
      key: "project",
      title: ["Present a Project", "Présenter un projet", "عرض مشروع"],
    },
    {
      key: "participate",
      title: ["Invite Participation", "Inviter à participer", "تشجيع المشاركة"],
    },
    {
      key: "train",
      title: ["Lead a Workshop", "Animer un atelier", "تيسير ورشة"],
    },
    {
      key: "reflect",
      title: ["Discuss Evidence", "Discuter des preuves", "مناقشة الأدلة"],
    },
  ],
  audio: [
    {
      key: "listen",
      title: [
        "Build Listening Skills",
        "Développer l’écoute",
        "تطوير الاستماع",
      ],
    },
    {
      key: "language",
      title: ["Practise Language", "Pratiquer une langue", "ممارسة اللغة"],
    },
    {
      key: "story",
      title: ["Enjoy a Story", "Écouter une histoire", "الاستمتاع بقصة"],
    },
    {
      key: "calm",
      title: [
        "Take a Calm Moment",
        "Prendre un temps calme",
        "قضاء لحظة هادئة",
      ],
    },
    {
      key: "music",
      title: ["Explore Music", "Explorer la musique", "استكشاف الموسيقى"],
    },
    {
      key: "professional",
      title: [
        "Hear Professional Insights",
        "Écouter des professionnels",
        "الاستماع إلى رؤى مهنية",
      ],
    },
  ],
};
export const THEMES: Choice[] = [
  {
    key: "back-to-school",
    title: ["Back to School", "Rentrée scolaire", "العودة للمدرسة"],
  },
  {
    key: "autumn",
    title: ["Autumn", "Automne", "الخريف"],
  },
  {
    key: "halloween",
    title: ["Halloween", "Halloween", "هالوين"],
  },
  {
    key: "winter",
    title: ["Winter", "Hiver", "الشتاء"],
  },
  {
    key: "christmas",
    title: ["Christmas", "Noël", "عيد الميلاد"],
  },
  {
    key: "spring",
    title: ["Spring", "Printemps", "الربيع"],
  },
  {
    key: "summer",
    title: ["Summer", "Été", "الصيف"],
  },
  {
    key: "end-of-year",
    title: ["End of Year", "Fin d’année", "نهاية السنة"],
  },
];
export const QUICK: Choice[] = [
  {
    key: "no-prep",
    title: ["No prep", "Sans préparation", "دون إعداد"],
  },
  {
    key: "independent",
    title: ["Independent practice", "Pratique autonome", "ممارسة مستقلة"],
  },
  {
    key: "small-group",
    title: ["Small groups", "Petits groupes", "مجموعات صغيرة"],
  },
  {
    key: "home-learning",
    title: ["Home learning", "Apprentissage à la maison", "تعلم منزلي"],
  },
  {
    key: "accessible",
    title: ["Accessible support", "Supports accessibles", "دعم ميسر"],
  },
];
const QUICK_SETS: Record<string, Choice[]> = {
  printables: [
    ...QUICK.slice(0, 1),
    {
      key: "trace-write",
      title: ["Trace & write", "Tracer & écrire", "التتبع والكتابة"],
    },
    {
      key: "cut-paste",
      title: ["Cut & paste", "Découper & coller", "القص واللصق"],
    },
    ...QUICK.slice(1),
  ],
  forms: [
    {
      key: "short",
      title: ["Short forms", "Formulaires courts", "نماذج قصيرة"],
    },
    {
      key: "attachments",
      title: ["With attachments", "Avec pièces jointes", "مع مرفقات"],
    },
    {
      key: "family",
      title: ["For families", "Pour les familles", "للأسر"],
    },
    {
      key: "professional",
      title: ["Professional use", "Usage professionnel", "استخدام مهني"],
    },
    {
      key: "accessible",
      title: ["Accessible support", "Supports accessibles", "دعم ميسر"],
    },
  ],
  community: [
    {
      key: "questions",
      title: ["Questions & help", "Questions & aide", "أسئلة ومساعدة"],
    },
    {
      key: "peer",
      title: ["Peer exchange", "Échange entre pairs", "تبادل الأقران"],
    },
    {
      key: "family",
      title: ["For families", "Pour les familles", "للأسر"],
    },
    {
      key: "professional",
      title: ["Professional use", "Usage professionnel", "استخدام مهني"],
    },
    {
      key: "accessible",
      title: ["Accessible support", "Supports accessibles", "دعم ميسر"],
    },
  ],
};
export const focusChoices = (family: string) => FOCUS[family] || [];
export const needChoices = (family: string) => NEED_SETS[family] || NEEDS;
export const quickChoices = (family: string) => QUICK_SETS[family] || QUICK;
export function classificationChoices(family: string, key: string): Choice[] {
  return key === "storefrontFocus"
    ? focusChoices(family)
    : key === "storefrontNeeds"
      ? needChoices(family)
      : key === "storefrontThemes"
        ? THEMES
        : key === "storefrontQuick"
          ? quickChoices(family)
          : [];
}
