import { enrichFamily } from './capabilities'
import type { Family, Module, Format, Tri } from './types'

const BASE_FAMILIES: Family[] = [
  {
    "key": "documents",
    "number": 1,
    "name": [
      "Documents & Guides",
      "Documents & guides",
      "الوثائق والأدلة"
    ],
    "description": [
      "Structured chapters, accessible reading, source documents and governed print or download.",
      "Chapitres structurés, lecture accessible, documents sources et sorties contrôlées.",
      "فصول منظمة وقراءة ميسّرة ووثائق أصلية وطباعة أو تنزيل محكوم."
    ],
    "icon": "FileText",
    "color": "#0084ff",
    "modes": [
      "Article Reader",
      "PDF Reader",
      "Chaptered Guide",
      "Rich Article"
    ],
    "actions": [
      "read",
      "chapters",
      "save",
      "share",
      "download",
      "print"
    ],
    "fields": [
      {
        "key": "searchEnabled",
        "label": [
          "Search text when available",
          "Recherche si texte disponible",
          "البحث عند توفر النص"
        ],
        "type": "toggle"
      }
    ],
    "collections": [
      {
        "key": "units",
        "label": [
          "Chapters and document units",
          "Chapitres et documents",
          "الفصول والوثائق"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Stable unit ID",
              "Identifiant stable",
              "معرّف ثابت"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "title",
            "label": [
              "Title",
              "Titre",
              "العنوان"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "kind",
            "label": [
              "Content type",
              "Type de contenu",
              "نوع المحتوى"
            ],
            "type": "select",
            "options": [
              "article",
              "pdf"
            ]
          },
          {
            "key": "assetId",
            "label": [
              "Native media ID",
              "ID média natif",
              "معرّف الوسائط"
            ],
            "type": "reference"
          },
          {
            "key": "contentId",
            "label": [
              "Content record ID",
              "ID du contenu",
              "معرّف المحتوى"
            ],
            "type": "reference"
          },
          {
            "key": "text",
            "label": [
              "Accessible text / body",
              "Texte accessible / contenu",
              "النص المتاح"
            ],
            "type": "textarea"
          },
          {
            "key": "duration",
            "label": [
              "Duration · seconds",
              "Durée · secondes",
              "المدة بالثواني"
            ],
            "type": "number",
            "min": 0
          },
          {
            "key": "required",
            "label": [
              "Required step",
              "Étape obligatoire",
              "خطوة مطلوبة"
            ],
            "type": "toggle"
          },
          {
            "key": "prerequisites",
            "label": [
              "Prerequisite unit IDs · comma separated",
              "IDs prérequis · séparés par virgules",
              "معرّفات المتطلبات · مفصولة بفواصل"
            ],
            "type": "text"
          },
          {
            "key": "completion",
            "label": [
              "Completion condition",
              "Condition de complétion",
              "شرط الإكمال"
            ],
            "type": "select",
            "options": [
              "manual",
              "coverage",
              "assessment",
              "submitted",
              "goal",
              "checklist"
            ]
          },
          {
            "key": "condition",
            "label": [
              "Entry condition",
              "Condition d’entrée",
              "شرط الدخول"
            ],
            "type": "select",
            "options": [
              "always",
              "completed",
              "answer_equals",
              "value_at_least"
            ]
          },
          {
            "key": "conditionTarget",
            "label": [
              "Condition unit / field ID",
              "ID unité / champ condition",
              "معرّف الوحدة / حقل الشرط"
            ],
            "type": "text"
          },
          {
            "key": "conditionValue",
            "label": [
              "Expected value",
              "Valeur attendue",
              "القيمة المتوقعة"
            ],
            "type": "text"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "printables",
    "number": 2,
    "name": [
      "Printables & Worksheets",
      "Imprimables & fiches",
      "المطبوعات وأوراق العمل"
    ],
    "description": [
      "Ordered print-ready worksheets with preview pages, paper settings and delivery rights.",
      "Fiches prêtes à imprimer, pages ordonnées, formats papier et droits de livraison.",
      "أوراق عمل مرتبة وجاهزة للطباعة مع معاينة وإعدادات ورق وحقوق تسليم."
    ],
    "icon": "Printer",
    "color": "#ff8b00",
    "modes": [
      "Printable Preview",
      "Page Carousel",
      "Flipbook Preview",
      "Download Gate"
    ],
    "actions": [
      "preview",
      "zoom",
      "download",
      "print",
      "save"
    ],
    "fields": [
      {
        "key": "paper",
        "label": [
          "Paper format",
          "Format papier",
          "حجم الورق"
        ],
        "type": "select",
        "options": [
          "A4",
          "A5",
          "Letter"
        ]
      },
      {
        "key": "downloadAllowed",
        "label": [
          "Permit genuine download",
          "Autoriser le téléchargement réel",
          "السماح بالتنزيل"
        ],
        "type": "toggle"
      }
    ],
    "collections": [
      {
        "key": "units",
        "label": [
          "Printable pages",
          "Pages imprimables",
          "صفحات قابلة للطباعة"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Stable unit ID",
              "Identifiant stable",
              "معرّف ثابت"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "title",
            "label": [
              "Title",
              "Titre",
              "العنوان"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "kind",
            "label": [
              "Content type",
              "Type de contenu",
              "نوع المحتوى"
            ],
            "type": "select",
            "options": [
              "pdf",
              "image"
            ]
          },
          {
            "key": "assetId",
            "label": [
              "Native media ID",
              "ID média natif",
              "معرّف الوسائط"
            ],
            "type": "reference"
          },
          {
            "key": "contentId",
            "label": [
              "Content record ID",
              "ID du contenu",
              "معرّف المحتوى"
            ],
            "type": "reference"
          },
          {
            "key": "text",
            "label": [
              "Accessible text / body",
              "Texte accessible / contenu",
              "النص المتاح"
            ],
            "type": "textarea"
          },
          {
            "key": "duration",
            "label": [
              "Duration · seconds",
              "Durée · secondes",
              "المدة بالثواني"
            ],
            "type": "number",
            "min": 0
          },
          {
            "key": "required",
            "label": [
              "Required step",
              "Étape obligatoire",
              "خطوة مطلوبة"
            ],
            "type": "toggle"
          },
          {
            "key": "prerequisites",
            "label": [
              "Prerequisite unit IDs · comma separated",
              "IDs prérequis · séparés par virgules",
              "معرّفات المتطلبات · مفصولة بفواصل"
            ],
            "type": "text"
          },
          {
            "key": "completion",
            "label": [
              "Completion condition",
              "Condition de complétion",
              "شرط الإكمال"
            ],
            "type": "select",
            "options": [
              "manual",
              "coverage",
              "assessment",
              "submitted",
              "goal",
              "checklist"
            ]
          },
          {
            "key": "condition",
            "label": [
              "Entry condition",
              "Condition d’entrée",
              "شرط الدخول"
            ],
            "type": "select",
            "options": [
              "always",
              "completed",
              "answer_equals",
              "value_at_least"
            ]
          },
          {
            "key": "conditionTarget",
            "label": [
              "Condition unit / field ID",
              "ID unité / champ condition",
              "معرّف الوحدة / حقل الشرط"
            ],
            "type": "text"
          },
          {
            "key": "conditionValue",
            "label": [
              "Expected value",
              "Valeur attendue",
              "القيمة المتوقعة"
            ],
            "type": "text"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "stories",
    "number": 3,
    "name": [
      "Storybooks & Reading",
      "Histoires & lecture",
      "القصص والقراءة"
    ],
    "description": [
      "A real page-by-page story with text, illustrations and optional mapped narration.",
      "Histoire page par page avec texte, illustrations et narration liée en option.",
      "قصة صفحة بصفحة مع نصوص وصور وسرد صوتي مرتبط اختياري."
    ],
    "icon": "BookOpen",
    "color": "#9b4de5",
    "modes": [
      "Flipbook",
      "Read-aloud story mode",
      "Immersive reading mode",
      "Slideshow story mode"
    ],
    "actions": [
      "read",
      "next",
      "narration",
      "bookmark"
    ],
    "fields": [
      {
        "key": "narrationAssetId",
        "label": [
          "Narration audio ID",
          "ID audio narration",
          "معرّف السرد الصوتي"
        ],
        "type": "reference"
      }
    ],
    "collections": [
      {
        "key": "units",
        "label": [
          "Story pages",
          "Pages de l’histoire",
          "صفحات القصة"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Stable unit ID",
              "Identifiant stable",
              "معرّف ثابت"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "title",
            "label": [
              "Title",
              "Titre",
              "العنوان"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "kind",
            "label": [
              "Content type",
              "Type de contenu",
              "نوع المحتوى"
            ],
            "type": "select",
            "options": [
              "article",
              "image"
            ]
          },
          {
            "key": "assetId",
            "label": [
              "Native media ID",
              "ID média natif",
              "معرّف الوسائط"
            ],
            "type": "reference"
          },
          {
            "key": "contentId",
            "label": [
              "Content record ID",
              "ID du contenu",
              "معرّف المحتوى"
            ],
            "type": "reference"
          },
          {
            "key": "text",
            "label": [
              "Accessible text / body",
              "Texte accessible / contenu",
              "النص المتاح"
            ],
            "type": "textarea"
          },
          {
            "key": "duration",
            "label": [
              "Duration · seconds",
              "Durée · secondes",
              "المدة بالثواني"
            ],
            "type": "number",
            "min": 0
          },
          {
            "key": "required",
            "label": [
              "Required step",
              "Étape obligatoire",
              "خطوة مطلوبة"
            ],
            "type": "toggle"
          },
          {
            "key": "prerequisites",
            "label": [
              "Prerequisite unit IDs · comma separated",
              "IDs prérequis · séparés par virgules",
              "معرّفات المتطلبات · مفصولة بفواصل"
            ],
            "type": "text"
          },
          {
            "key": "completion",
            "label": [
              "Completion condition",
              "Condition de complétion",
              "شرط الإكمال"
            ],
            "type": "select",
            "options": [
              "manual",
              "coverage",
              "assessment",
              "submitted",
              "goal",
              "checklist"
            ]
          },
          {
            "key": "condition",
            "label": [
              "Entry condition",
              "Condition d’entrée",
              "شرط الدخول"
            ],
            "type": "select",
            "options": [
              "always",
              "completed",
              "answer_equals",
              "value_at_least"
            ]
          },
          {
            "key": "conditionTarget",
            "label": [
              "Condition unit / field ID",
              "ID unité / champ condition",
              "معرّف الوحدة / حقل الشرط"
            ],
            "type": "text"
          },
          {
            "key": "conditionValue",
            "label": [
              "Expected value",
              "Valeur attendue",
              "القيمة المتوقعة"
            ],
            "type": "text"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "learning",
    "number": 4,
    "name": [
      "Courses & Learning Paths",
      "Cours & parcours",
      "الدورات ومسارات التعلّم"
    ],
    "description": [
      "Lessons, prerequisites, resources, practice and explicit learning checkpoints.",
      "Leçons, prérequis, ressources, exercices et étapes pédagogiques explicites.",
      "دروس ومتطلبات وموارد وتمارين ونقاط تقدم تعليمية واضحة."
    ],
    "icon": "GraduationCap",
    "color": "#7251f5",
    "modes": [
      "Course player",
      "Mixed media lesson path",
      "Chaptered video course",
      "Assessment-linked learning path"
    ],
    "actions": [
      "start",
      "resume",
      "complete",
      "practice",
      "resources"
    ],
    "fields": [
      {
        "key": "passingScore",
        "label": [
          "Practice passing score · %",
          "Seuil pratique · %",
          "نسبة نجاح التدريب"
        ],
        "type": "number",
        "min": 0,
        "max": 100
      }
    ],
    "collections": [
      {
        "key": "units",
        "label": [
          "Curriculum and lessons",
          "Programme et leçons",
          "المنهج والدروس"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Stable unit ID",
              "Identifiant stable",
              "معرّف ثابت"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "title",
            "label": [
              "Title",
              "Titre",
              "العنوان"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "kind",
            "label": [
              "Content type",
              "Type de contenu",
              "نوع المحتوى"
            ],
            "type": "select",
            "options": [
              "article",
              "pdf",
              "image",
              "video",
              "audio",
              "experience"
            ]
          },
          {
            "key": "assetId",
            "label": [
              "Native media ID",
              "ID média natif",
              "معرّف الوسائط"
            ],
            "type": "reference"
          },
          {
            "key": "contentId",
            "label": [
              "Content record ID",
              "ID du contenu",
              "معرّف المحتوى"
            ],
            "type": "reference"
          },
          {
            "key": "text",
            "label": [
              "Accessible text / body",
              "Texte accessible / contenu",
              "النص المتاح"
            ],
            "type": "textarea"
          },
          {
            "key": "duration",
            "label": [
              "Duration · seconds",
              "Durée · secondes",
              "المدة بالثواني"
            ],
            "type": "number",
            "min": 0
          },
          {
            "key": "required",
            "label": [
              "Required step",
              "Étape obligatoire",
              "خطوة مطلوبة"
            ],
            "type": "toggle"
          },
          {
            "key": "prerequisites",
            "label": [
              "Prerequisite unit IDs · comma separated",
              "IDs prérequis · séparés par virgules",
              "معرّفات المتطلبات · مفصولة بفواصل"
            ],
            "type": "text"
          },
          {
            "key": "completion",
            "label": [
              "Completion condition",
              "Condition de complétion",
              "شرط الإكمال"
            ],
            "type": "select",
            "options": [
              "manual",
              "coverage",
              "assessment",
              "submitted",
              "goal",
              "checklist"
            ]
          },
          {
            "key": "condition",
            "label": [
              "Entry condition",
              "Condition d’entrée",
              "شرط الدخول"
            ],
            "type": "select",
            "options": [
              "always",
              "completed",
              "answer_equals",
              "value_at_least"
            ]
          },
          {
            "key": "conditionTarget",
            "label": [
              "Condition unit / field ID",
              "ID unité / champ condition",
              "معرّف الوحدة / حقل الشرط"
            ],
            "type": "text"
          },
          {
            "key": "conditionValue",
            "label": [
              "Expected value",
              "Valeur attendue",
              "القيمة المتوقعة"
            ],
            "type": "text"
          }
        ],
        "min": 1
      },
      {
        "key": "questions",
        "label": [
          "Practice / assessment",
          "Pratique / évaluation",
          "التدريب والتقييم"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Question ID",
              "ID question",
              "معرّف السؤال"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "prompt",
            "label": [
              "Question",
              "Question",
              "السؤال"
            ],
            "type": "textarea",
            "required": true
          },
          {
            "key": "type",
            "label": [
              "Question type",
              "Type de question",
              "نوع السؤال"
            ],
            "type": "select",
            "options": [
              "choice",
              "multi",
              "true_false",
              "short_answer"
            ]
          },
          {
            "key": "choices",
            "label": [
              "Choices · one per line",
              "Choix · un par ligne",
              "الخيارات · خيار في كل سطر"
            ],
            "type": "textarea"
          },
          {
            "key": "answer",
            "label": [
              "Correct answer / indexes · e.g. 0 or 0,2",
              "Réponse / indices · ex. 0 ou 0,2",
              "الإجابة / الفهارس · مثل 0 أو 0,2"
            ],
            "type": "text"
          },
          {
            "key": "points",
            "label": [
              "Points",
              "Points",
              "النقاط"
            ],
            "type": "number",
            "min": 1,
            "max": 100
          },
          {
            "key": "explanation",
            "label": [
              "Explanation",
              "Explication",
              "التفسير"
            ],
            "type": "textarea"
          }
        ]
      }
    ]
  },
  {
    "key": "video",
    "number": 5,
    "name": [
      "Video Learning & Tutorials",
      "Vidéos & tutoriels",
      "الفيديوهات التعليمية"
    ],
    "description": [
      "Native video sources, chapters, captions, transcripts and truthful durations.",
      "Sources vidéo natives, chapitres, sous-titres, transcriptions et durées réelles.",
      "فيديو أصلي وفصول وترجمة ونصوص ومدد حقيقية."
    ],
    "icon": "Video",
    "color": "#007bff",
    "modes": [
      "Cinematic Player",
      "Tutorial Player with Chapters",
      "Course-Linked Video",
      "Vertical / Mobile Video Viewer"
    ],
    "actions": [
      "play",
      "seek",
      "speed",
      "chapters",
      "captions"
    ],
    "fields": [
      {
        "key": "captionAssetId",
        "label": [
          "Caption asset ID",
          "ID sous-titres",
          "معرّف الترجمة"
        ],
        "type": "reference"
      },
      {
        "key": "transcript",
        "label": [
          "Transcript",
          "Transcription",
          "النص المكتوب"
        ],
        "type": "textarea"
      }
    ],
    "collections": [
      {
        "key": "units",
        "label": [
          "Videos and chapters",
          "Vidéos et chapitres",
          "الفيديو والفصول"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Stable unit ID",
              "Identifiant stable",
              "معرّف ثابت"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "title",
            "label": [
              "Title",
              "Titre",
              "العنوان"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "kind",
            "label": [
              "Content type",
              "Type de contenu",
              "نوع المحتوى"
            ],
            "type": "select",
            "options": [
              "video"
            ]
          },
          {
            "key": "assetId",
            "label": [
              "Native media ID",
              "ID média natif",
              "معرّف الوسائط"
            ],
            "type": "reference"
          },
          {
            "key": "contentId",
            "label": [
              "Content record ID",
              "ID du contenu",
              "معرّف المحتوى"
            ],
            "type": "reference"
          },
          {
            "key": "text",
            "label": [
              "Accessible text / body",
              "Texte accessible / contenu",
              "النص المتاح"
            ],
            "type": "textarea"
          },
          {
            "key": "duration",
            "label": [
              "Duration · seconds",
              "Durée · secondes",
              "المدة بالثواني"
            ],
            "type": "number",
            "min": 0
          },
          {
            "key": "required",
            "label": [
              "Required step",
              "Étape obligatoire",
              "خطوة مطلوبة"
            ],
            "type": "toggle"
          },
          {
            "key": "prerequisites",
            "label": [
              "Prerequisite unit IDs · comma separated",
              "IDs prérequis · séparés par virgules",
              "معرّفات المتطلبات · مفصولة بفواصل"
            ],
            "type": "text"
          },
          {
            "key": "completion",
            "label": [
              "Completion condition",
              "Condition de complétion",
              "شرط الإكمال"
            ],
            "type": "select",
            "options": [
              "manual",
              "coverage",
              "assessment",
              "submitted",
              "goal",
              "checklist"
            ]
          },
          {
            "key": "condition",
            "label": [
              "Entry condition",
              "Condition d’entrée",
              "شرط الدخول"
            ],
            "type": "select",
            "options": [
              "always",
              "completed",
              "answer_equals",
              "value_at_least"
            ]
          },
          {
            "key": "conditionTarget",
            "label": [
              "Condition unit / field ID",
              "ID unité / champ condition",
              "معرّف الوحدة / حقل الشرط"
            ],
            "type": "text"
          },
          {
            "key": "conditionValue",
            "label": [
              "Expected value",
              "Valeur attendue",
              "القيمة المتوقعة"
            ],
            "type": "text"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "audio",
    "number": 6,
    "name": [
      "Audio, Podcasts & Narration",
      "Audio, podcasts & narration",
      "الصوت والسرد"
    ],
    "description": [
      "A mapped episode or narration playlist with transcript, sequence and listening actions.",
      "Playlist d’épisodes ou narration, transcription, séquence et actions d’écoute.",
      "قائمة حلقات أو سرد مع نص وتسلسل وإجراءات استماع."
    ],
    "icon": "Headphones",
    "color": "#06a5a5",
    "modes": [
      "Audio Player",
      "Playlist Mode",
      "Chaptered Podcast",
      "Narrated Story Mode"
    ],
    "actions": [
      "play",
      "seek",
      "speed",
      "queue",
      "save"
    ],
    "fields": [
      {
        "key": "transcript",
        "label": [
          "Transcript",
          "Transcription",
          "النص المكتوب"
        ],
        "type": "textarea"
      },
      {
        "key": "downloadAllowed",
        "label": [
          "Allow offline download",
          "Autoriser le téléchargement",
          "السماح بالتنزيل"
        ],
        "type": "toggle"
      }
    ],
    "collections": [
      {
        "key": "units",
        "label": [
          "Episodes and narration",
          "Épisodes et narration",
          "الحلقات والسرد"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Stable unit ID",
              "Identifiant stable",
              "معرّف ثابت"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "title",
            "label": [
              "Title",
              "Titre",
              "العنوان"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "kind",
            "label": [
              "Content type",
              "Type de contenu",
              "نوع المحتوى"
            ],
            "type": "select",
            "options": [
              "audio"
            ]
          },
          {
            "key": "assetId",
            "label": [
              "Native media ID",
              "ID média natif",
              "معرّف الوسائط"
            ],
            "type": "reference"
          },
          {
            "key": "contentId",
            "label": [
              "Content record ID",
              "ID du contenu",
              "معرّف المحتوى"
            ],
            "type": "reference"
          },
          {
            "key": "text",
            "label": [
              "Accessible text / body",
              "Texte accessible / contenu",
              "النص المتاح"
            ],
            "type": "textarea"
          },
          {
            "key": "duration",
            "label": [
              "Duration · seconds",
              "Durée · secondes",
              "المدة بالثواني"
            ],
            "type": "number",
            "min": 0
          },
          {
            "key": "required",
            "label": [
              "Required step",
              "Étape obligatoire",
              "خطوة مطلوبة"
            ],
            "type": "toggle"
          },
          {
            "key": "prerequisites",
            "label": [
              "Prerequisite unit IDs · comma separated",
              "IDs prérequis · séparés par virgules",
              "معرّفات المتطلبات · مفصولة بفواصل"
            ],
            "type": "text"
          },
          {
            "key": "completion",
            "label": [
              "Completion condition",
              "Condition de complétion",
              "شرط الإكمال"
            ],
            "type": "select",
            "options": [
              "manual",
              "coverage",
              "assessment",
              "submitted",
              "goal",
              "checklist"
            ]
          },
          {
            "key": "condition",
            "label": [
              "Entry condition",
              "Condition d’entrée",
              "شرط الدخول"
            ],
            "type": "select",
            "options": [
              "always",
              "completed",
              "answer_equals",
              "value_at_least"
            ]
          },
          {
            "key": "conditionTarget",
            "label": [
              "Condition unit / field ID",
              "ID unité / champ condition",
              "معرّف الوحدة / حقل الشرط"
            ],
            "type": "text"
          },
          {
            "key": "conditionValue",
            "label": [
              "Expected value",
              "Valeur attendue",
              "القيمة المتوقعة"
            ],
            "type": "text"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "visual-cards",
    "number": 7,
    "name": [
      "Image Galleries & Visual Cards",
      "Galeries & cartes visuelles",
      "الصور والبطاقات"
    ],
    "description": [
      "Image galleries and front/back study cards with accessible captions and real sources.",
      "Galeries et cartes recto verso avec légendes accessibles et sources réelles.",
      "معارض صور وبطاقات تعليمية بوجهين مع وصف ميسّر ومصادر حقيقية."
    ],
    "icon": "Images",
    "color": "#e94da0",
    "modes": [
      "Image Gallery",
      "Card Swiper",
      "Lightbox Mode",
      "Flashcard Study Mode"
    ],
    "actions": [
      "zoom",
      "swipe",
      "study",
      "save"
    ],
    "fields": [],
    "collections": [
      {
        "key": "cards",
        "label": [
          "Visual / study cards",
          "Cartes visuelles / étude",
          "بطاقات بصرية / دراسة"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Card ID",
              "ID carte",
              "معرّف البطاقة"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "title",
            "label": [
              "Title",
              "Titre",
              "العنوان"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "assetId",
            "label": [
              "Front image ID",
              "ID image recto",
              "معرّف صورة الوجه"
            ],
            "type": "reference"
          },
          {
            "key": "backAssetId",
            "label": [
              "Back image ID",
              "ID image verso",
              "معرّف صورة الخلف"
            ],
            "type": "reference"
          },
          {
            "key": "front",
            "label": [
              "Prompt / front text",
              "Question / recto",
              "النص الأمامي"
            ],
            "type": "textarea"
          },
          {
            "key": "back",
            "label": [
              "Answer / back text",
              "Réponse / verso",
              "النص الخلفي"
            ],
            "type": "textarea"
          },
          {
            "key": "alt",
            "label": [
              "Alternative text",
              "Texte alternatif",
              "النص البديل"
            ],
            "type": "text"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "presentations",
    "number": 8,
    "name": [
      "Presentations & FramePlay",
      "Présentations & FramePlay",
      "العروض والإطارات"
    ],
    "description": [
      "Frames and slides with order, timings, notes visibility and presentation navigation.",
      "Frames et slides avec ordre, durées, visibilité des notes et navigation.",
      "إطارات وشرائح مرتبة مع توقيت ووضوح الملاحظات وتنقل العرض."
    ],
    "icon": "Presentation",
    "color": "#e6a400",
    "modes": [
      "Slide Player",
      "Frame-by-Frame Mode",
      "Presenter Mode",
      "Autoplay Storytelling"
    ],
    "actions": [
      "next",
      "previous",
      "jump",
      "notes",
      "autoplay"
    ],
    "fields": [],
    "collections": [
      {
        "key": "frames",
        "label": [
          "Slides and frames",
          "Diapositives et frames",
          "الشرائح والإطارات"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Frame ID",
              "ID frame",
              "معرّف الإطار"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "title",
            "label": [
              "Title",
              "Titre",
              "العنوان"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "assetId",
            "label": [
              "Image ID",
              "ID image",
              "معرّف الصورة"
            ],
            "type": "reference"
          },
          {
            "key": "text",
            "label": [
              "Accessible content",
              "Contenu accessible",
              "المحتوى المتاح"
            ],
            "type": "textarea"
          },
          {
            "key": "seconds",
            "label": [
              "Autoplay timing · seconds",
              "Lecture auto · secondes",
              "مدة التشغيل بالثواني"
            ],
            "type": "number",
            "min": 1,
            "max": 300
          },
          {
            "key": "notes",
            "label": [
              "Presenter notes",
              "Notes présentateur",
              "ملاحظات المقدّم"
            ],
            "type": "textarea"
          },
          {
            "key": "publicNotes",
            "label": [
              "Notes permitted in public",
              "Notes publiques autorisées",
              "السماح بالملاحظات العامة"
            ],
            "type": "toggle"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "assessments",
    "number": 9,
    "name": [
      "Quizzes, Assessments & Exams",
      "Quiz & évaluations",
      "الاختبارات والتقييم"
    ],
    "description": [
      "Typed questions, private answers, scoring, feedback, timing and attempt policy.",
      "Questions typées, réponses privées, notation, feedback, temps et tentatives.",
      "أسئلة محددة وإجابات خاصة وتقييم وملاحظات وتوقيت وسياسة محاولات."
    ],
    "icon": "ListChecks",
    "color": "#7b4de9",
    "modes": [
      "Quiz Player",
      "Timed Assessment Mode",
      "Practice Test Mode",
      "Result Dashboard"
    ],
    "actions": [
      "start",
      "answer",
      "submit",
      "retry",
      "results"
    ],
    "fields": [
      {
        "key": "minutes",
        "label": [
          "Time limit · minutes, 0 untimed",
          "Limite · minutes, 0 sans limite",
          "الدقائق · 0 دون حد"
        ],
        "type": "number",
        "min": 0,
        "max": 240
      },
      {
        "key": "attemptLimit",
        "label": [
          "Attempts allowed",
          "Tentatives autorisées",
          "المحاولات المسموحة"
        ],
        "type": "number",
        "min": 1,
        "max": 100
      },
      {
        "key": "passingScore",
        "label": [
          "Passing score · %",
          "Seuil de réussite · %",
          "نسبة النجاح"
        ],
        "type": "number",
        "min": 0,
        "max": 100
      }
    ],
    "collections": [
      {
        "key": "questions",
        "label": [
          "Question bank",
          "Banque de questions",
          "بنك الأسئلة"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Question ID",
              "ID question",
              "معرّف السؤال"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "prompt",
            "label": [
              "Question",
              "Question",
              "السؤال"
            ],
            "type": "textarea",
            "required": true
          },
          {
            "key": "type",
            "label": [
              "Question type",
              "Type de question",
              "نوع السؤال"
            ],
            "type": "select",
            "options": [
              "choice",
              "multi",
              "true_false",
              "short_answer"
            ]
          },
          {
            "key": "choices",
            "label": [
              "Choices · one per line",
              "Choix · un par ligne",
              "الخيارات · خيار في كل سطر"
            ],
            "type": "textarea"
          },
          {
            "key": "answer",
            "label": [
              "Correct answer / indexes · e.g. 0 or 0,2",
              "Réponse / indices · ex. 0 ou 0,2",
              "الإجابة / الفهارس · مثل 0 أو 0,2"
            ],
            "type": "text"
          },
          {
            "key": "points",
            "label": [
              "Points",
              "Points",
              "النقاط"
            ],
            "type": "number",
            "min": 1,
            "max": 100
          },
          {
            "key": "explanation",
            "label": [
              "Explanation",
              "Explication",
              "التفسير"
            ],
            "type": "textarea"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "activities",
    "number": 10,
    "name": [
      "Interactive Activities & Games",
      "Activités & jeux",
      "الأنشطة والألعاب"
    ],
    "description": [
      "Approved matching, memory, sequencing and choice engines with goals and retry rules.",
      "Moteurs approuvés : association, mémoire, séquence et choix, objectifs et reprise.",
      "محركات مطابقة وذاكرة وتسلسل واختيار معتمدة مع أهداف وإعادة محاولة."
    ],
    "icon": "Puzzle",
    "color": "#14b66e",
    "modes": [
      "Game Canvas",
      "Activity Stepper",
      "Simulation Mode",
      "Challenge Mode"
    ],
    "actions": [
      "start",
      "interact",
      "validate",
      "retry",
      "checkpoint"
    ],
    "fields": [
      {
        "key": "engine",
        "label": [
          "Approved activity engine",
          "Moteur activité approuvé",
          "محرك النشاط المعتمد"
        ],
        "type": "select",
        "options": [
          "matching",
          "memory",
          "sequence",
          "sorting",
          "choice"
        ]
      }
    ],
    "collections": [
      {
        "key": "tasks",
        "label": [
          "Tasks and objectives",
          "Tâches et objectifs",
          "المهام والأهداف"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Task ID",
              "ID tâche",
              "معرّف المهمة"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "prompt",
            "label": [
              "Prompt",
              "Consigne",
              "التعليمات"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "answer",
            "label": [
              "Expected answer / pair",
              "Réponse / paire attendue",
              "الإجابة المتوقعة"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "choices",
            "label": [
              "Choices · one per line",
              "Choix · un par ligne",
              "الخيارات · سطر لكل خيار"
            ],
            "type": "textarea"
          },
          {
            "key": "hint",
            "label": [
              "Hint",
              "Indice",
              "تلميح"
            ],
            "type": "text"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "tools",
    "number": 11,
    "name": [
      "Tools, Calculators & Simulators",
      "Outils & simulateurs",
      "الأدوات والمحاكاة"
    ],
    "description": [
      "Bounded educational calculations with declared inputs, units, formula and explanation.",
      "Calculs éducatifs bornés avec entrées, unités, formule et explication déclarées.",
      "حسابات تعليمية محددة مع مدخلات ووحدات ونموذج وتفسير."
    ],
    "icon": "Calculator",
    "color": "#09a9c0",
    "modes": [
      "Interactive Tool Runtime",
      "Calculator Panel",
      "Simulation Dashboard",
      "Form-Result Interface"
    ],
    "actions": [
      "calculate",
      "compare",
      "reset",
      "export"
    ],
    "fields": [
      {
        "key": "operation",
        "label": [
          "Approved calculation",
          "Calcul approuvé",
          "الحساب المعتمد"
        ],
        "type": "select",
        "options": [
          "sum",
          "average",
          "ratio",
          "groups",
          "duration"
        ]
      },
      {
        "key": "outputUnit",
        "label": [
          "Output unit",
          "Unité du résultat",
          "وحدة النتيجة"
        ],
        "type": "text"
      },
      {
        "key": "methodology",
        "label": [
          "Methodology and interpretation",
          "Méthode et interprétation",
          "المنهجية والتفسير"
        ],
        "type": "textarea"
      }
    ],
    "collections": [
      {
        "key": "inputs",
        "label": [
          "Inputs and units",
          "Entrées et unités",
          "المدخلات والوحدات"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Input ID",
              "ID entrée",
              "معرّف المدخل"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "label",
            "label": [
              "Label",
              "Libellé",
              "التسمية"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "unit",
            "label": [
              "Unit",
              "Unité",
              "الوحدة"
            ],
            "type": "text"
          },
          {
            "key": "min",
            "label": [
              "Minimum",
              "Minimum",
              "الحد الأدنى"
            ],
            "type": "number"
          },
          {
            "key": "max",
            "label": [
              "Maximum",
              "Maximum",
              "الحد الأقصى"
            ],
            "type": "number"
          },
          {
            "key": "value",
            "label": [
              "Initial value",
              "Valeur initiale",
              "القيمة الأولية"
            ],
            "type": "number"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "planners",
    "number": 12,
    "name": [
      "Planners, Checklists & Templates",
      "Plannings, listes & modèles",
      "المخططات والقوائم"
    ],
    "description": [
      "Editable customer-copy definitions, checklist items, due dates and useful export.",
      "Définitions de copies personnelles, checklists, échéances et exports utiles.",
      "تعريفات نسخ شخصية قابلة للتعديل وقوائم وتواريخ وتصدير مفيد."
    ],
    "icon": "CalendarDays",
    "color": "#f17742",
    "modes": [
      "Printable Preview",
      "Editable Planner View",
      "Template Gallery",
      "Checklist Mode"
    ],
    "actions": [
      "duplicate",
      "edit",
      "check",
      "save",
      "print"
    ],
    "fields": [],
    "collections": [
      {
        "key": "items",
        "label": [
          "Planner / checklist items",
          "Éléments planning / checklist",
          "عناصر المخطط والقائمة"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Item ID",
              "ID élément",
              "معرّف العنصر"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "label",
            "label": [
              "Label",
              "Libellé",
              "التسمية"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "type",
            "label": [
              "Personal input type",
              "Type de saisie personnelle",
              "نوع المدخل الشخصي"
            ],
            "type": "select",
            "options": [
              "checkbox",
              "text",
              "date",
              "number"
            ]
          },
          {
            "key": "required",
            "label": [
              "Required",
              "Obligatoire",
              "مطلوب"
            ],
            "type": "toggle"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "forms",
    "number": 13,
    "name": [
      "Forms, Applications & Submissions",
      "Formulaires & demandes",
      "النماذج والطلبات"
    ],
    "description": [
      "Validated multilingual forms, consent, privacy and an accountable receiving destination.",
      "Formulaires traduits et validés, consentement, confidentialité et réception responsable.",
      "نماذج متعددة اللغات ومتحقق منها وموافقة وخصوصية واستقبال مسؤول."
    ],
    "icon": "ClipboardList",
    "color": "#4975e9",
    "modes": [
      "Form Flow",
      "Multistep Application",
      "Upload-Enabled Submission Page",
      "Booking Request Flow"
    ],
    "actions": [
      "draft",
      "upload",
      "submit",
      "receipt",
      "status"
    ],
    "fields": [
      {
        "key": "destination",
        "label": [
          "Receiving team",
          "Équipe de réception",
          "فريق الاستقبال"
        ],
        "type": "select",
        "options": [
          "dce",
          "hotline",
          "academy",
          "b2b"
        ]
      },
      {
        "key": "consentLabel",
        "label": [
          "Required consent statement",
          "Consentement obligatoire",
          "نص الموافقة المطلوبة"
        ],
        "type": "textarea",
        "required": true
      }
    ],
    "collections": [
      {
        "key": "fields",
        "label": [
          "Form fields",
          "Champs du formulaire",
          "حقول النموذج"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Field ID",
              "ID du champ",
              "معرّف الحقل"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "label",
            "label": [
              "Label",
              "Libellé",
              "التسمية"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "type",
            "label": [
              "Field type",
              "Type de champ",
              "نوع الحقل"
            ],
            "type": "select",
            "options": [
              "text",
              "email",
              "number",
              "textarea",
              "select",
              "checkbox",
              "file"
            ]
          },
          {
            "key": "options",
            "label": [
              "Options · one per line",
              "Options · une par ligne",
              "الخيارات · خيار في كل سطر"
            ],
            "type": "textarea"
          },
          {
            "key": "required",
            "label": [
              "Required",
              "Obligatoire",
              "مطلوب"
            ],
            "type": "toggle"
          },
          {
            "key": "help",
            "label": [
              "Help text",
              "Texte d’aide",
              "نص المساعدة"
            ],
            "type": "textarea"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "community",
    "number": 14,
    "name": [
      "Community, Reviews & Social Proof",
      "Communauté & avis",
      "المجتمع والآراء"
    ],
    "description": [
      "Moderated contributions, review context, reporting reasons and visibility decisions.",
      "Contributions modérées, contexte d’avis, signalements et décisions de visibilité.",
      "مساهمات خاضعة للإشراف وسياق مراجعات وأسباب تقارير وقرارات ظهور."
    ],
    "icon": "MessagesSquare",
    "color": "#ed4b83",
    "modes": [
      "Review Feed",
      "Social Proof Wall",
      "Q&A Thread",
      "Community Hub"
    ],
    "actions": [
      "review",
      "rate",
      "comment",
      "report"
    ],
    "fields": [
      {
        "key": "moderation",
        "label": [
          "Moderation",
          "Modération",
          "الإشراف"
        ],
        "type": "select",
        "options": [
          "pre_moderated",
          "eligible_reviews"
        ]
      },
      {
        "key": "contributionPolicy",
        "label": [
          "Contribution eligibility",
          "Conditions de contribution",
          "شروط المشاركة"
        ],
        "type": "textarea",
        "required": true
      }
    ],
    "collections": [
      {
        "key": "rules",
        "label": [
          "Community rules",
          "Règles communauté",
          "قواعد المجتمع"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Rule ID",
              "ID règle",
              "معرّف القاعدة"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "title",
            "label": [
              "Title",
              "Titre",
              "العنوان"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "text",
            "label": [
              "Rule",
              "Règle",
              "القاعدة"
            ],
            "type": "textarea"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "commerce",
    "number": 15,
    "name": [
      "Commerce-Linked Resource Experiences",
      "Ressources liées aux offres",
      "الموارد المرتبطة بالعروض"
    ],
    "description": [
      "Recognized resources linked to canonical native offers and their existing customer journeys.",
      "Ressources reconnues liées aux offres canoniques et parcours clients natifs.",
      "موارد معترف بها مرتبطة بالعروض الأصلية ومسارات العملاء الحالية."
    ],
    "icon": "ShoppingBag",
    "color": "#12b788",
    "modes": [
      "Shoppable Article",
      "Buyable Resource Page",
      "Course + Product Page",
      "Download Delivery Experience"
    ],
    "actions": [
      "details",
      "configure",
      "native_handoff"
    ],
    "fields": [],
    "collections": [
      {
        "key": "offers",
        "label": [
          "Canonical offers",
          "Offres canoniques",
          "العروض الأصلية"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Binding ID",
              "ID lien",
              "معرّف الرابط"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "nativeId",
            "label": [
              "Native offer ID",
              "ID offre native",
              "معرّف العرض الأصلي"
            ],
            "type": "reference",
            "required": true
          },
          {
            "key": "role",
            "label": [
              "Relationship",
              "Relation",
              "العلاقة"
            ],
            "type": "select",
            "options": [
              "related",
              "complementary",
              "next_step"
            ]
          },
          {
            "key": "label",
            "label": [
              "Context",
              "Contexte",
              "السياق"
            ],
            "type": "text"
          }
        ],
        "min": 1
      }
    ]
  },
  {
    "key": "bundles",
    "number": 16,
    "name": [
      "Multi-Asset Journeys & Bundles",
      "Parcours & collections",
      "المسارات والمجموعات"
    ],
    "description": [
      "Real child experiences, prerequisites, optional steps and aggregate continuation rules.",
      "Expériences enfants réelles, prérequis, étapes facultatives et continuité agrégée.",
      "تجارب فرعية حقيقية ومتطلبات وخطوات اختيارية وقواعد استمرارية إجمالية."
    ],
    "icon": "Layers",
    "color": "#7958df",
    "modes": [
      "Guided Bundle Path",
      "Bundle Dashboard",
      "Sequential Playlist",
      "Starter Kit Experience"
    ],
    "actions": [
      "start",
      "continue",
      "open",
      "complete",
      "restart"
    ],
    "fields": [],
    "collections": [
      {
        "key": "steps",
        "label": [
          "Journey members",
          "Membres du parcours",
          "عناصر المسار"
        ],
        "fields": [
          {
            "key": "id",
            "label": [
              "Step ID",
              "ID étape",
              "معرّف الخطوة"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "title",
            "label": [
              "Title",
              "Titre",
              "العنوان"
            ],
            "type": "text",
            "required": true
          },
          {
            "key": "experienceId",
            "label": [
              "Experience ID",
              "ID expérience",
              "معرّف التجربة"
            ],
            "type": "reference",
            "required": true
          },
          {
            "key": "required",
            "label": [
              "Required",
              "Obligatoire",
              "مطلوب"
            ],
            "type": "toggle"
          },
          {
            "key": "prerequisites",
            "label": [
              "Prerequisite step IDs",
              "IDs étapes prérequises",
              "معرّفات المتطلبات"
            ],
            "type": "text"
          },
          {
            "key": "weight",
            "label": [
              "Progress weight",
              "Poids de progression",
              "وزن التقدم"
            ],
            "type": "number",
            "min": 1,
            "max": 100
          },
          {
            "key": "condition",
            "label": [
              "Entry condition",
              "Condition d’entrée",
              "شرط الدخول"
            ],
            "type": "select",
            "options": [
              "always",
              "completed",
              "answer_equals",
              "value_at_least"
            ]
          },
          {
            "key": "conditionTarget",
            "label": [
              "Condition unit / field ID",
              "ID unité / champ condition",
              "معرّف الوحدة / حقل الشرط"
            ],
            "type": "text"
          },
          {
            "key": "conditionValue",
            "label": [
              "Expected value",
              "Valeur attendue",
              "القيمة المتوقعة"
            ],
            "type": "text"
          }
        ],
        "min": 1
      }
    ]
  }
]

export const FAMILIES: Family[] = BASE_FAMILIES.map(enrichFamily)

export const MODULES: Module[] = [
  {
    "key": "dashboard",
    "label": [
      "Studio Dashboard",
      "Tableau de bord",
      "لوحة الاستوديو"
    ],
    "group": "primary",
    "icon": "Gauge",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "experiences",
    "label": [
      "Experiences",
      "Expériences",
      "التجارب"
    ],
    "group": "experience",
    "icon": "Layers",
    "kind": "experience",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "categories",
    "label": [
      "Categories",
      "Catégories",
      "الفئات"
    ],
    "group": "experience",
    "icon": "FolderTree",
    "kind": "topic",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "content",
    "label": [
      "Content Library",
      "Bibliothèque de contenu",
      "مكتبة المحتوى"
    ],
    "group": "experience",
    "icon": "FileText",
    "kind": "content",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "media",
    "label": [
      "Media Library",
      "Bibliothèque médias",
      "مكتبة الوسائط"
    ],
    "group": "experience",
    "icon": "Images",
    "kind": "asset",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "templates",
    "label": [
      "Templates",
      "Templates",
      "القوالب"
    ],
    "group": "experience",
    "icon": "LayoutTemplate",
    "kind": "template",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "journeys",
    "label": [
      "Journey Builder",
      "Parcours",
      "بناء المسارات"
    ],
    "group": "experience",
    "icon": "GitBranch",
    "kind": "bundle",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "publication",
    "label": [
      "Preview & Publish",
      "Aperçu & publication",
      "المعاينة والنشر"
    ],
    "group": "experience",
    "icon": "Rocket",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "community",
    "label": [
      "Reviews & Community",
      "Avis & communauté",
      "الآراء والمجتمع"
    ],
    "group": "customer",
    "icon": "MessageSquare",
    "kind": "contribution",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "users",
    "label": [
      "Users & Engagement",
      "Utilisateurs & engagement",
      "المستخدمون والتفاعل"
    ],
    "group": "customer",
    "icon": "Users",
    "kind": "run",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "messages",
    "label": [
      "Messages & Support",
      "Messages & assistance",
      "الرسائل والدعم"
    ],
    "group": "customer",
    "icon": "MessagesSquare",
    "kind": "case",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "adsense",
    "label": [
      "AdSense Authority",
      "Autorité AdSense",
      "إدارة AdSense"
    ],
    "group": "monetization",
    "icon": "MonitorPlay",
    "kind": "ad_policy",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "bundles",
    "label": [
      "Bundle Offers",
      "Collections & offres",
      "المجموعات والعروض"
    ],
    "group": "monetization",
    "icon": "Package",
    "kind": "bundle",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "access",
    "label": [
      "Access Control",
      "Contrôle d’accès",
      "إدارة الوصول"
    ],
    "group": "monetization",
    "icon": "LockKeyhole",
    "kind": "access_policy",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "pricing",
    "label": [
      "Pricing & Subscriptions",
      "Tarifs & abonnements",
      "الأسعار والاشتراكات"
    ],
    "group": "monetization",
    "icon": "CreditCard",
    "kind": "offer_link",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "performance",
    "label": [
      "Performance",
      "Performance",
      "الأداء"
    ],
    "group": "analytics",
    "icon": "ChartNoAxesCombined",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "audience",
    "label": [
      "Audience Insights",
      "Audience",
      "تحليل الجمهور"
    ],
    "group": "analytics",
    "icon": "ChartPie",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "reports",
    "label": [
      "Content Reports",
      "Rapports contenu",
      "تقارير المحتوى"
    ],
    "group": "analytics",
    "icon": "FileChartColumn",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "revenue",
    "label": [
      "Revenue Reports",
      "Rapports revenus",
      "تقارير الإيرادات"
    ],
    "group": "analytics",
    "icon": "ChartColumn",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "imports",
    "label": [
      "Import & Export",
      "Import & export",
      "الاستيراد والتصدير"
    ],
    "group": "system",
    "icon": "ArrowLeftRight",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "utilities",
    "label": [
      "Tools & Utilities",
      "Outils & diagnostics",
      "الأدوات والتشخيص"
    ],
    "group": "system",
    "icon": "Wrench",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "settings",
    "label": [
      "Settings",
      "Paramètres",
      "الإعدادات"
    ],
    "group": "system",
    "icon": "Settings",
    "kind": "setting",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  },
  {
    "key": "logs",
    "label": [
      "Logs & Maintenance",
      "Logs & maintenance",
      "السجلات والصيانة"
    ],
    "group": "system",
    "icon": "ClipboardList",
    "description": [
      "Manage real records, revisions and outcomes within the AngelCare experience world.",
      "Gérer les dossiers, versions et résultats réels de l’univers AngelCare.",
      "إدارة السجلات والإصدارات والنتائج الحقيقية في عالم AngelCare."
    ]
  }
]

export const AD_FORMATS: Format[] = [
  {
    "id": "01",
    "name": "Responsive display",
    "family": "manual",
    "owner": "angelcare",
    "zones": [
      "after_intro",
      "after_section",
      "sidebar"
    ],
    "requires": "adsense",
    "description": [
      "A responsive unit at a natural reading break; register its real provider ID and local spacing.",
      "Unité responsive à une pause naturelle de lecture ; ID réel et espacement local.",
      "وحدة متجاوبة في وقفة قراءة طبيعية مع معرّف حقيقي ومسافة محلية."
    ]
  },
  {
    "id": "02",
    "name": "Native in-feed",
    "family": "manual",
    "owner": "angelcare",
    "zones": [
      "feed"
    ],
    "requires": "adsense",
    "description": [
      "An identified sponsored card within an eligible resource feed, separate from editorial recommendations.",
      "Carte sponsorisée identifiée dans un flux éligible, distincte des recommandations éditoriales.",
      "بطاقة إعلانية واضحة في قائمة مؤهلة، مستقلة عن التوصيات التحريرية."
    ]
  },
  {
    "id": "03",
    "name": "Native in-article",
    "family": "manual",
    "owner": "angelcare",
    "zones": [
      "after_section"
    ],
    "requires": "adsense",
    "description": [
      "An article placement between completed sections, never inside a form or primary learning control.",
      "Placement entre sections d’article, hors formulaire et contrôle pédagogique principal.",
      "موضع بين أقسام المقال، خارج النماذج وأدوات التعلم الرئيسية."
    ]
  },
  {
    "id": "04",
    "name": "Multiplex",
    "family": "manual",
    "owner": "angelcare",
    "zones": [
      "after_completion",
      "sidebar"
    ],
    "requires": "adsense",
    "description": [
      "A provider-managed recommendation grid in an eligible content end-zone.",
      "Grille de recommandations fournisseur dans une zone de fin de contenu éligible.",
      "شبكة توصيات يديرها المزوّد في نهاية محتوى مؤهلة."
    ]
  },
  {
    "id": "05",
    "name": "Auto banners",
    "family": "auto",
    "owner": "google-console",
    "zones": [
      "auto_in_page"
    ],
    "requires": "adsense",
    "description": [
      "Google-managed banner delivery with local page eligibility and declared exclusion zones.",
      "Bannières gérées par Google avec éligibilité locale et zones d’exclusion déclarées.",
      "لافتات يديرها Google مع أهلية محلية ومناطق استبعاد محددة."
    ]
  },
  {
    "id": "06",
    "name": "Anchors",
    "family": "auto",
    "owner": "google-console",
    "zones": [
      "edge"
    ],
    "requires": "adsense",
    "description": [
      "Provider anchor inventory, respecting fixed navigation, primary controls and safe viewport space.",
      "Inventaire ancré fournisseur, respectant navigation fixe, contrôles et espace sûr.",
      "مواضع مثبتة تحترم التنقل الثابت والأدوات ومساحة العرض الآمنة."
    ]
  },
  {
    "id": "07",
    "name": "Side rails",
    "family": "auto",
    "owner": "google-console",
    "zones": [
      "rail"
    ],
    "requires": "adsense",
    "description": [
      "Desktop-only outer-rail preparation with clear ownership of Google placement decisions.",
      "Préparation des rails desktop ; décisions de placement appartenant à Google.",
      "إعداد مواضع جانبية لسطح المكتب مع قرارات عرض تخص Google."
    ]
  },
  {
    "id": "08",
    "name": "Vignettes",
    "family": "auto",
    "owner": "google-console",
    "zones": [
      "transition"
    ],
    "requires": "adsense",
    "description": [
      "Provider interstitial eligibility at permitted navigation transitions, with exclusions and frequency limits.",
      "Éligibilité interstitielle aux transitions permises, exclusions et limites de fréquence.",
      "أهلية إعلانات بينية في انتقالات مسموحة مع استبعادات وحدود تكرار."
    ]
  },
  {
    "id": "09",
    "name": "Ad intents",
    "family": "auto",
    "owner": "google-console",
    "zones": [
      "editorial_text"
    ],
    "requires": "adsense",
    "description": [
      "Provider-controlled ad intents; editorial links and native purchase actions retain their original purpose.",
      "Intentions publicitaires contrôlées par le fournisseur ; liens et achats natifs préservés.",
      "نوايا إعلانية يديرها المزوّد مع الحفاظ على الروابط والشراء الأصلي."
    ]
  },
  {
    "id": "10",
    "name": "Offerwall / rewarded",
    "family": "rewarded",
    "owner": "google-console",
    "zones": [
      "access_choice"
    ],
    "requires": "offerwall",
    "description": [
      "Explicit opt-in reward policy, recognized completion issuer and non-transferable resource benefit.",
      "Opt-in explicite, émetteur de complétion reconnu et bénéfice non transférable.",
      "اختيار صريح ومصدر إكمال معتمد ومكافأة مورد غير قابلة للتحويل."
    ]
  },
  {
    "id": "11",
    "name": "AdSense for Search",
    "family": "search",
    "owner": "specialist",
    "zones": [
      "search"
    ],
    "requires": "afs",
    "description": [
      "Approved search inventory in a declared search experience, separate from ordinary catalogue search.",
      "Inventaire de recherche approuvé, distinct de la recherche catalogue ordinaire.",
      "مواضع بحث معتمدة ومستقلة عن البحث العادي في الكتالوج."
    ]
  },
  {
    "id": "12",
    "name": "Related Search for Content",
    "family": "search",
    "owner": "specialist",
    "zones": [
      "related_search"
    ],
    "requires": "afs",
    "description": [
      "Related search requires the approved AFS program and a relevant, permitted content context.",
      "Recherche associée : programme AFS approuvé et contexte de contenu pertinent.",
      "يتطلب البحث المرتبط برنامج AFS معتمداً وسياق محتوى مناسباً."
    ]
  },
  {
    "id": "13",
    "name": "H5 Games",
    "family": "game",
    "owner": "specialist",
    "zones": [
      "game_break"
    ],
    "requires": "h5",
    "description": [
      "Eligible H5 activity runtime with event-level breaks, exclusions and dedicated program evidence.",
      "Runtime H5 éligible avec pauses événementielles, exclusions et preuve de programme.",
      "تشغيل H5 مؤهل مع فواصل أحداث واستبعادات ودليل برنامج متخصص."
    ]
  },
  {
    "id": "14",
    "name": "Video creative in display",
    "family": "creative",
    "owner": "angelcare",
    "zones": [
      "after_intro",
      "after_section",
      "sidebar"
    ],
    "requires": "adsense",
    "description": [
      "Video supplied within a Display unit; it inherits that unit’s ownership and eligibility.",
      "Création vidéo au sein d’une unité Display ; mêmes autorité et éligibilité.",
      "فيديو داخل وحدة Display يرث مرجعيتها وأهليتها."
    ]
  },
  {
    "id": "15",
    "name": "In-stream video",
    "family": "video",
    "owner": "specialist",
    "zones": [
      "pre_roll",
      "natural_break",
      "post_roll"
    ],
    "requires": "video_stack",
    "description": [
      "A separate video advertising stack with declared player breaks and independently verified eligibility.",
      "Stack publicitaire vidéo distinct, pauses du lecteur et éligibilité vérifiée séparément.",
      "منظومة إعلانات فيديو مستقلة مع فواصل المشغل وأهلية متحقق منها."
    ]
  }
]

export const TOPIC_SEEDS = [
  {
    "key": "development",
    "label": [
      "Child Development",
      "Développement enfant",
      "نمو الطفل"
    ],
    "icon": "Heart",
    "color": "#ec4c91"
  },
  {
    "key": "learning",
    "label": [
      "Learning & Skills",
      "Apprentissages",
      "التعلّم والمهارات"
    ],
    "icon": "GraduationCap",
    "color": "#9657e8"
  },
  {
    "key": "parenting",
    "label": [
      "Parenting & Family",
      "Parents & famille",
      "الوالدية والأسرة"
    ],
    "icon": "Users",
    "color": "#e83b8f"
  },
  {
    "key": "health",
    "label": [
      "Care & Wellbeing",
      "Soin & bien-être",
      "الرعاية والعافية"
    ],
    "icon": "HeartPulse",
    "color": "#0bbb8a"
  },
  {
    "key": "creativity",
    "label": [
      "Play & Creativity",
      "Jeu & créativité",
      "اللعب والإبداع"
    ],
    "icon": "Puzzle",
    "color": "#f09223"
  },
  {
    "key": "reading",
    "label": [
      "Language & Reading",
      "Langage & lecture",
      "اللغة والقراءة"
    ],
    "icon": "BookOpen",
    "color": "#347ff1"
  },
  {
    "key": "school",
    "label": [
      "Classroom & School",
      "Classe & école",
      "الصف والمدرسة"
    ],
    "icon": "School",
    "color": "#12a69b"
  },
  {
    "key": "professional",
    "label": [
      "Educator Resources",
      "Ressources éducateurs",
      "موارد المربّين"
    ],
    "icon": "BriefcaseBusiness",
    "color": "#8d58ec"
  }
] as const
export const GROUPS: Record<string, Tri> = {"experience": ["EXPERIENCE MANAGEMENT", "GESTION DES EXPÉRIENCES", "إدارة التجارب"], "customer": ["CUSTOMER FEATURES", "RELATION UTILISATEURS", "ميزات المستخدمين"], "monetization": ["MONETIZATION", "MONÉTISATION", "تحقيق الدخل"], "analytics": ["ANALYTICS", "ANALYTIQUE", "التحليلات"], "system": ["SYSTEM", "SYSTÈME", "النظام"]}
export const familyByKey = (key: string) => FAMILIES.find(f => f.key === key)
export const moduleByKey = (key: string) => MODULES.find(m => m.key === key)
export const formatById = (id: string) => AD_FORMATS.find(f => f.id === id)
