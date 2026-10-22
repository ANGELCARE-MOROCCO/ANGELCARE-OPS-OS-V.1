import type { Scene } from "./gallery-contract";
export const legacyWorldImages: Record<string,string> = {"documents": "/kidflix/documents.jpg", "printables": "/kidflix/printables.jpg", "stories": "/kidflix/stories.jpg", "learning": "/kidflix/learning.webp", "video": "/kidflix/video.jpg", "audio": "/kidflix/audio.webp", "visual-cards": "/kidflix/visual-cards.webp", "presentations": "/kidflix/presentations.webp", "assessments": "/kidflix/assessments.webp", "activities": "/kidflix/activities.webp", "tools": "/kidflix/tools.webp", "planners": "/kidflix/planners.jpg", "forms": "/kidflix/forms.jpg", "community": "/kidflix/community.jpg", "commerce": "/kidflix/commerce.webp", "bundles": "/kidflix/bundles.webp"};
export const worldTile = (key: string) => `/kidflix/international-20261020/${key}-tile.webp`;
const scenes: Record<string,Scene[]> = {
  "home": [
    {
      "id": "home-1",
      "desktop": "/kidflix/international-20261020/home-1.webp",
      "mobile": "/kidflix/international-20261020/home-1-mobile.webp",
      "descriptions": {
        "en": "International children and a caregiver explore a magical garden library",
        "fr": "Des enfants et une éducatrice explorent une bibliothèque enchantée",
        "ar": "أطفال من ثقافات متنوعة ومربية يستكشفون مكتبة ساحرة"
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "home-2",
      "desktop": "/kidflix/international-20261020/home-2.webp",
      "mobile": "/kidflix/international-20261020/home-2-mobile.webp",
      "descriptions": {
        "en": "Families create a colorful paper city together",
        "fr": "Des familles créent ensemble une ville en papier coloré",
        "ar": "عائلات تبدع معاً مدينة ورقية ملونة"
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "home-3",
      "desktop": "/kidflix/international-20261020/home-3.webp",
      "mobile": "/kidflix/international-20261020/home-3-mobile.webp",
      "descriptions": {
        "en": "Children explore a glowing ocean of discovery islands",
        "fr": "Des enfants explorent un océan d’îles lumineuses",
        "ar": "أطفال يستكشفون محيطاً من جزر الاكتشاف المضيئة"
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "documents": [
    {
      "id": "documents-1",
      "desktop": "/kidflix/international-20261020/documents-1.webp",
      "mobile": "/kidflix/international-20261020/documents-1-mobile.webp",
      "descriptions": {
        "en": "A Moroccan father and daughter discovering an illustrated nature guide in a sunlit courtyard. Illustrated editorial scene.",
        "fr": "Un père et sa fille explorent un guide de nature dans une cour ensoleillée.",
        "ar": "أب وابنته يستكشفان دليلاً للطبيعة في فناء مشمس."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "documents-2",
      "desktop": "/kidflix/international-20261020/documents-2.webp",
      "mobile": "/kidflix/international-20261020/documents-2-mobile.webp",
      "descriptions": {
        "en": "A tiny paper research library among giant leaves and woodland creatures. Illustrated editorial scene.",
        "fr": "Une bibliothèque miniature et un enfant entourés de feuilles et d’animaux.",
        "ar": "مكتبة مصغرة وطفل تحيط بهما أوراق الشجر والحيوانات."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "documents-3",
      "desktop": "/kidflix/international-20261020/documents-3.webp",
      "mobile": "/kidflix/international-20261020/documents-3-mobile.webp",
      "descriptions": {
        "en": "An open field notebook with pressed flowers shells and a brass magnifying glass. Illustrated editorial scene.",
        "fr": "Un carnet de nature ouvert, des fleurs, des coquillages et une loupe.",
        "ar": "دفتر طبيعة مفتوح وزهور وأصداف وعدسة مكبرة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "printables": [
    {
      "id": "printables-1",
      "desktop": "/kidflix/international-20261020/printables-1.webp",
      "mobile": "/kidflix/international-20261020/printables-1-mobile.webp",
      "descriptions": {
        "en": "A Black British mother and child cutting colorful paper animals at a craft table. Illustrated editorial scene.",
        "fr": "Une mère et son enfant découpent des animaux en papier à la table créative.",
        "ar": "أم وطفلها يقصان حيوانات ورقية على طاولة الإبداع."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "printables-2",
      "desktop": "/kidflix/international-20261020/printables-2.webp",
      "mobile": "/kidflix/international-20261020/printables-2-mobile.webp",
      "descriptions": {
        "en": "A whimsical origami town with paper bridges and paper gardens. Illustrated editorial scene.",
        "fr": "Une ville en origami avec ses ponts et ses jardins de papier.",
        "ar": "مدينة أوريغامي بجسور وحدائق ورقية."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "printables-3",
      "desktop": "/kidflix/international-20261020/printables-3.webp",
      "mobile": "/kidflix/international-20261020/printables-3-mobile.webp",
      "descriptions": {
        "en": "A creative tabletop with carefully cut animal shapes colored pencils and folded paper. Illustrated editorial scene.",
        "fr": "Des formes d’animaux, des crayons et du papier plié sur une table.",
        "ar": "أشكال حيوانات وأقلام ملونة وورق مطوي على طاولة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "stories": [
    {
      "id": "stories-1",
      "desktop": "/kidflix/international-20261020/stories-1.webp",
      "mobile": "/kidflix/international-20261020/stories-1-mobile.webp",
      "descriptions": {
        "en": "A Japanese grandfather reading with two children under a glowing garden tree. Illustrated editorial scene.",
        "fr": "Un grand-père lit avec deux enfants sous un arbre lumineux.",
        "ar": "جد يقرأ مع طفلين تحت شجرة مضيئة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "stories-2",
      "desktop": "/kidflix/international-20261020/stories-2.webp",
      "mobile": "/kidflix/international-20261020/stories-2-mobile.webp",
      "descriptions": {
        "en": "A small fox sailing a storybook boat through a moonlit forest. Illustrated editorial scene.",
        "fr": "Un renard navigue dans un bateau-livre à travers une forêt au clair de lune.",
        "ar": "ثعلب يبحر في قارب من كتاب عبر غابة مضاءة بالقمر."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "stories-3",
      "desktop": "/kidflix/international-20261020/stories-3.webp",
      "mobile": "/kidflix/international-20261020/stories-3-mobile.webp",
      "descriptions": {
        "en": "An open illustrated fairy tale with a miniature castle rising from its pages. Illustrated editorial scene.",
        "fr": "Un château miniature surgit des pages d’un livre de contes.",
        "ar": "قلعة مصغرة تنبثق من صفحات كتاب حكايات."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "learning": [
    {
      "id": "learning-1",
      "desktop": "/kidflix/international-20261020/learning-1.webp",
      "mobile": "/kidflix/international-20261020/learning-1-mobile.webp",
      "descriptions": {
        "en": "An Indian girl and Kenyan boy exploring seedlings with their teacher in a garden classroom. Illustrated editorial scene.",
        "fr": "Deux enfants et leur éducatrice découvrent des semis dans une classe-jardin.",
        "ar": "طفلان ومعلمتهما يكتشفون شتلات في فصل داخل حديقة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "learning-2",
      "desktop": "/kidflix/international-20261020/learning-2.webp",
      "mobile": "/kidflix/international-20261020/learning-2-mobile.webp",
      "descriptions": {
        "en": "A winding learning path through a miniature mountain world with stepping stones. Illustrated editorial scene.",
        "fr": "Un sentier de découverte traverse des montagnes miniatures et des pierres colorées.",
        "ar": "مسار اكتشاف يعبر جبالاً مصغرة وأحجاراً ملونة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "learning-3",
      "desktop": "/kidflix/international-20261020/learning-3.webp",
      "mobile": "/kidflix/international-20261020/learning-3-mobile.webp",
      "descriptions": {
        "en": "A tactile solar system model and counting beads on a warm wooden table. Illustrated editorial scene.",
        "fr": "Une maquette du système solaire et des perles à compter sur une table.",
        "ar": "مجسم للمجموعة الشمسية وخرز للعد على طاولة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "video": [
    {
      "id": "video-1",
      "desktop": "/kidflix/international-20261020/video-1.webp",
      "mobile": "/kidflix/international-20261020/video-1-mobile.webp",
      "descriptions": {
        "en": "A Brazilian father and daughter watching an educational nature film on a small home screen. Illustrated editorial scene.",
        "fr": "Un père et sa fille regardent un film sur la nature à la maison.",
        "ar": "أب وابنته يشاهدان فيلماً عن الطبيعة في المنزل."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "video-2",
      "desktop": "/kidflix/international-20261020/video-2.webp",
      "mobile": "/kidflix/international-20261020/video-2-mobile.webp",
      "descriptions": {
        "en": "A magical miniature cinema showing a coral reef without any text. Illustrated editorial scene.",
        "fr": "Un cinéma miniature ouvre une fenêtre sur un récif de corail.",
        "ar": "سينما مصغرة تفتح نافذة على شعاب مرجانية."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "video-3",
      "desktop": "/kidflix/international-20261020/video-3.webp",
      "mobile": "/kidflix/international-20261020/video-3-mobile.webp",
      "descriptions": {
        "en": "A small projector casting paper butterflies onto a deep blue wall. Illustrated editorial scene.",
        "fr": "Un projecteur illumine un mur de papillons de papier.",
        "ar": "جهاز عرض يضيء جداراً بفراشات ورقية."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "audio": [
    {
      "id": "audio-1",
      "desktop": "/kidflix/international-20261020/audio-1.webp",
      "mobile": "/kidflix/international-20261020/audio-1-mobile.webp",
      "descriptions": {
        "en": "A child of Turkish heritage listening to headphones beside a rain-streaked window. Illustrated editorial scene.",
        "fr": "Un enfant écoute au casque près d’une fenêtre couverte de gouttes de pluie.",
        "ar": "طفل يستمع بسماعات بجوار نافذة تتساقط عليها قطرات المطر."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "audio-2",
      "desktop": "/kidflix/international-20261020/audio-2.webp",
      "mobile": "/kidflix/international-20261020/audio-2-mobile.webp",
      "descriptions": {
        "en": "Musical notes imagined as birds flying through a peaceful moonlit meadow. Illustrated editorial scene.",
        "fr": "Des oiseaux musicaux traversent une prairie paisible au clair de lune.",
        "ar": "طيور موسيقية تعبر مرجاً هادئاً تحت ضوء القمر."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "audio-3",
      "desktop": "/kidflix/international-20261020/audio-3.webp",
      "mobile": "/kidflix/international-20261020/audio-3-mobile.webp",
      "descriptions": {
        "en": "A record player headphones and cozy cushions beside a warm reading lamp. Illustrated editorial scene.",
        "fr": "Un tourne-disque, un casque et des coussins près d’une lampe chaleureuse.",
        "ar": "مشغل أسطوانات وسماعات ووسائد بجوار مصباح دافئ."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "visual-cards": [
    {
      "id": "visual-cards-1",
      "desktop": "/kidflix/international-20261020/visual-cards-1.webp",
      "mobile": "/kidflix/international-20261020/visual-cards-1-mobile.webp",
      "descriptions": {
        "en": "Two Senegalese siblings matching illustrated animal cards on a classroom rug. Illustrated editorial scene.",
        "fr": "Deux enfants associent des cartes d’animaux sur un tapis de classe.",
        "ar": "طفلان يطابقان بطاقات حيوانات على سجادة الفصل."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "visual-cards-2",
      "desktop": "/kidflix/international-20261020/visual-cards-2.webp",
      "mobile": "/kidflix/international-20261020/visual-cards-2-mobile.webp",
      "descriptions": {
        "en": "A flock of colorful paper birds emerging from picture cards. Illustrated editorial scene.",
        "fr": "Des oiseaux de papier colorés s’envolent depuis des cartes illustrées.",
        "ar": "طيور ورقية ملونة تطير من بطاقات مصورة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "visual-cards-3",
      "desktop": "/kidflix/international-20261020/visual-cards-3.webp",
      "mobile": "/kidflix/international-20261020/visual-cards-3-mobile.webp",
      "descriptions": {
        "en": "Beautiful illustrated botanical cards arranged with leaves and seed pods. Illustrated editorial scene.",
        "fr": "Des cartes botaniques illustrées, des feuilles et des graines.",
        "ar": "بطاقات نباتية مصورة وأوراق وبذور."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "presentations": [
    {
      "id": "presentations-1",
      "desktop": "/kidflix/international-20261020/presentations-1.webp",
      "mobile": "/kidflix/international-20261020/presentations-1-mobile.webp",
      "descriptions": {
        "en": "A French Algerian educator sharing a planet model with a small diverse class. Illustrated editorial scene.",
        "fr": "Une éducatrice partage une maquette de planète avec sa classe.",
        "ar": "معلمة تشارك فصلاً صغيراً مجسماً لكوكب."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "presentations-2",
      "desktop": "/kidflix/international-20261020/presentations-2.webp",
      "mobile": "/kidflix/international-20261020/presentations-2-mobile.webp",
      "descriptions": {
        "en": "A miniature theatre of planets stars and painted scenery. Illustrated editorial scene.",
        "fr": "Un théâtre miniature avec des planètes et un décor étoilé.",
        "ar": "مسرح مصغر بكواكب وديكور مرصع بالنجوم."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "presentations-3",
      "desktop": "/kidflix/international-20261020/presentations-3.webp",
      "mobile": "/kidflix/international-20261020/presentations-3-mobile.webp",
      "descriptions": {
        "en": "A set of illustrated landscape lesson boards on a wooden easel. Illustrated editorial scene.",
        "fr": "Des planches de paysages illustrés sur un chevalet en bois.",
        "ar": "لوحات مناظر طبيعية مصورة على حامل خشبي."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "assessments": [
    {
      "id": "assessments-1",
      "desktop": "/kidflix/international-20261020/assessments-1.webp",
      "mobile": "/kidflix/international-20261020/assessments-1-mobile.webp",
      "descriptions": {
        "en": "A girl with a hearing aid and her friend solving a colorful pattern puzzle. Illustrated editorial scene.",
        "fr": "Une fille portant une aide auditive et son ami résolvent un puzzle de motifs.",
        "ar": "فتاة ترتدي سماعة سمع وصديقها يحلان لغز أنماط."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "assessments-2",
      "desktop": "/kidflix/international-20261020/assessments-2.webp",
      "mobile": "/kidflix/international-20261020/assessments-2-mobile.webp",
      "descriptions": {
        "en": "A playful woodland obstacle trail of shapes and matching stones. Illustrated editorial scene.",
        "fr": "Un parcours de forêt composé de formes et de pierres à associer.",
        "ar": "مسار غابي من أشكال وأحجار للمطابقة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "assessments-3",
      "desktop": "/kidflix/international-20261020/assessments-3.webp",
      "mobile": "/kidflix/international-20261020/assessments-3-mobile.webp",
      "descriptions": {
        "en": "A tabletop of counting tokens geometric puzzles and a small wooden star. Illustrated editorial scene.",
        "fr": "Des jetons à compter, des puzzles géométriques et une étoile en bois.",
        "ar": "قطع للعد وألغاز هندسية ونجمة خشبية."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "activities": [
    {
      "id": "activities-1",
      "desktop": "/kidflix/international-20261020/activities-1.webp",
      "mobile": "/kidflix/international-20261020/activities-1-mobile.webp",
      "descriptions": {
        "en": "Mexican siblings making clay animals with a grandparent at a patio table. Illustrated editorial scene.",
        "fr": "Des enfants façonnent des animaux en argile avec un grand-parent sur une terrasse.",
        "ar": "أطفال يشكلون حيوانات طينية مع أحد الأجداد في فناء."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "activities-2",
      "desktop": "/kidflix/international-20261020/activities-2.webp",
      "mobile": "/kidflix/international-20261020/activities-2-mobile.webp",
      "descriptions": {
        "en": "A fantastical garden playground made of imaginative natural materials. Illustrated editorial scene.",
        "fr": "Un terrain de jeu imaginaire dans un jardin de matériaux naturels.",
        "ar": "ساحة لعب خيالية في حديقة من مواد طبيعية."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "activities-3",
      "desktop": "/kidflix/international-20261020/activities-3.webp",
      "mobile": "/kidflix/international-20261020/activities-3-mobile.webp",
      "descriptions": {
        "en": "A craft table with clay animals paint brushes and handmade flowers. Illustrated editorial scene.",
        "fr": "Une table avec des animaux en argile, des pinceaux et des fleurs faites main.",
        "ar": "طاولة عليها حيوانات طينية وفرش وزهور مصنوعة يدوياً."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "tools": [
    {
      "id": "tools-1",
      "desktop": "/kidflix/international-20261020/tools-1.webp",
      "mobile": "/kidflix/international-20261020/tools-1-mobile.webp",
      "descriptions": {
        "en": "A Korean child and an Arab child exploring a simple balance scale with an adult. Illustrated editorial scene.",
        "fr": "Deux enfants et un adulte explorent une balance simple.",
        "ar": "طفلان وبالغ يستكشفون ميزاناً بسيطاً."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "tools-2",
      "desktop": "/kidflix/international-20261020/tools-2.webp",
      "mobile": "/kidflix/international-20261020/tools-2-mobile.webp",
      "descriptions": {
        "en": "A miniature discovery laboratory with a water wheel prism and colored light. Illustrated editorial scene.",
        "fr": "Un laboratoire miniature avec une roue à eau et un prisme lumineux.",
        "ar": "مختبر مصغر بعجلة مائية ومنشور مضيء."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "tools-3",
      "desktop": "/kidflix/international-20261020/tools-3.webp",
      "mobile": "/kidflix/international-20261020/tools-3-mobile.webp",
      "descriptions": {
        "en": "A beautiful brass compass balance scale geometric solids and prism experiment. Illustrated editorial scene.",
        "fr": "Une boussole, une balance, des solides géométriques et un prisme.",
        "ar": "بوصلة وميزان ومجسمات هندسية ومنشور."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "planners": [
    {
      "id": "planners-1",
      "desktop": "/kidflix/international-20261020/planners-1.webp",
      "mobile": "/kidflix/international-20261020/planners-1-mobile.webp",
      "descriptions": {
        "en": "An Afro-Caribbean family planning a garden picnic together with illustrated picture tiles. Illustrated editorial scene.",
        "fr": "Une famille prépare un pique-nique avec des images autour d’une table de jardin.",
        "ar": "عائلة تخطط لنزهة باستخدام صور حول طاولة حديقة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "planners-2",
      "desktop": "/kidflix/international-20261020/planners-2.webp",
      "mobile": "/kidflix/international-20261020/planners-2-mobile.webp",
      "descriptions": {
        "en": "A peaceful miniature day unfolding from sunrise to evening in a paper garden. Illustrated editorial scene.",
        "fr": "Une journée miniature se déploie du lever du soleil au soir dans un jardin de papier.",
        "ar": "يوم مصغر يتفتح من الشروق إلى المساء في حديقة ورقية."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "planners-3",
      "desktop": "/kidflix/international-20261020/planners-3.webp",
      "mobile": "/kidflix/international-20261020/planners-3-mobile.webp",
      "descriptions": {
        "en": "A personal planner with blank colored blocks picture stickers and a cup of tea. Illustrated editorial scene.",
        "fr": "Un carnet à cases colorées, des autocollants illustrés et une tasse de thé.",
        "ar": "دفتر بمربعات ملونة وملصقات مصورة وكوب شاي."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "forms": [
    {
      "id": "forms-1",
      "desktop": "/kidflix/international-20261020/forms-1.webp",
      "mobile": "/kidflix/international-20261020/forms-1-mobile.webp",
      "descriptions": {
        "en": "A North African parent reflecting quietly with an illustrated journal in a cozy room. Illustrated editorial scene.",
        "fr": "Un parent réfléchit avec un journal illustré dans une pièce chaleureuse.",
        "ar": "أحد الوالدين يتأمل مع دفتر مصور في غرفة دافئة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "forms-2",
      "desktop": "/kidflix/international-20261020/forms-2.webp",
      "mobile": "/kidflix/international-20261020/forms-2-mobile.webp",
      "descriptions": {
        "en": "A serene landscape of stepping stones and reflection pools symbolizing thoughtful choices. Illustrated editorial scene.",
        "fr": "Des pierres de passage et des bassins calmes évoquent des choix réfléchis.",
        "ar": "أحجار عبور وبرك هادئة تعبر عن اختيارات متأنية."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "forms-3",
      "desktop": "/kidflix/international-20261020/forms-3.webp",
      "mobile": "/kidflix/international-20261020/forms-3-mobile.webp",
      "descriptions": {
        "en": "A blank illustrated reflection journal with colored tokens and a small plant. Illustrated editorial scene.",
        "fr": "Un journal de réflexion illustré avec des jetons colorés et une petite plante.",
        "ar": "دفتر تأمل مصور مع قطع ملونة ونبتة صغيرة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "community": [
    {
      "id": "community-1",
      "desktop": "/kidflix/international-20261020/community-1.webp",
      "mobile": "/kidflix/international-20261020/community-1-mobile.webp",
      "descriptions": {
        "en": "Parents and educators of varied international backgrounds sharing ideas in a garden circle. Illustrated editorial scene.",
        "fr": "Des parents et des éducateurs partagent leurs idées en cercle dans un jardin.",
        "ar": "آباء ومربون يتشاركون الأفكار في حلقة داخل حديقة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "community-2",
      "desktop": "/kidflix/international-20261020/community-2.webp",
      "mobile": "/kidflix/international-20261020/community-2-mobile.webp",
      "descriptions": {
        "en": "A miniature village of warm homes linked by glowing paths and speech shaped clouds. Illustrated editorial scene.",
        "fr": "Un village miniature aux maisons reliées par des chemins lumineux.",
        "ar": "قرية مصغرة تربط بيوتها مسارات مضيئة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "community-3",
      "desktop": "/kidflix/international-20261020/community-3.webp",
      "mobile": "/kidflix/international-20261020/community-3-mobile.webp",
      "descriptions": {
        "en": "A round table with notebooks cups and symbolic illustrated conversation cards. Illustrated editorial scene.",
        "fr": "Des carnets, des tasses et des cartes de conversation sur une table ronde.",
        "ar": "دفاتر وأكواب وبطاقات حوار على طاولة مستديرة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "commerce": [
    {
      "id": "commerce-1",
      "desktop": "/kidflix/international-20261020/commerce-1.webp",
      "mobile": "/kidflix/international-20261020/commerce-1-mobile.webp",
      "descriptions": {
        "en": "A South Asian parent and child examining a learning toolkit in a warm workshop. Illustrated editorial scene.",
        "fr": "Un parent et son enfant explorent une mallette pédagogique dans un atelier.",
        "ar": "أحد الوالدين وطفله يستكشفان حقيبة تعليمية في ورشة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "commerce-2",
      "desktop": "/kidflix/international-20261020/commerce-2.webp",
      "mobile": "/kidflix/international-20261020/commerce-2-mobile.webp",
      "descriptions": {
        "en": "A tiny imaginative resource shop with wooden learning toys paper books and nature kits. Illustrated editorial scene.",
        "fr": "Une petite boutique imaginaire de jeux en bois, livres et kits de nature.",
        "ar": "متجر خيالي صغير لألعاب خشبية وكتب وحقائب طبيعة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "commerce-3",
      "desktop": "/kidflix/international-20261020/commerce-3.webp",
      "mobile": "/kidflix/international-20261020/commerce-3-mobile.webp",
      "descriptions": {
        "en": "A carefully arranged educational toolkit of blocks cards craft materials and books. Illustrated editorial scene.",
        "fr": "Des blocs, des cartes, des livres et du matériel créatif réunis dans un kit.",
        "ar": "مكعبات وبطاقات وكتب ومواد إبداعية مجمعة في حقيبة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ],
  "bundles": [
    {
      "id": "bundles-1",
      "desktop": "/kidflix/international-20261020/bundles-1.webp",
      "mobile": "/kidflix/international-20261020/bundles-1-mobile.webp",
      "descriptions": {
        "en": "A multigenerational diverse family preparing a discovery backpack beside a garden path. Illustrated editorial scene.",
        "fr": "Une famille prépare un sac de découvertes près d’un sentier de jardin.",
        "ar": "عائلة تجهز حقيبة اكتشافات بجوار مسار حديقة."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "bundles-2",
      "desktop": "/kidflix/international-20261020/bundles-2.webp",
      "mobile": "/kidflix/international-20261020/bundles-2-mobile.webp",
      "descriptions": {
        "en": "A winding trail connecting storybook islands of art science nature and music. Illustrated editorial scene.",
        "fr": "Un chemin relie des îles de contes, d’art, de science, de nature et de musique.",
        "ar": "طريق يربط جزر الحكايات والفن والعلوم والطبيعة والموسيقى."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    },
    {
      "id": "bundles-3",
      "desktop": "/kidflix/international-20261020/bundles-3.webp",
      "mobile": "/kidflix/international-20261020/bundles-3-mobile.webp",
      "descriptions": {
        "en": "A beautiful backpack with coordinated learning books activity cards and a nature journal. Illustrated editorial scene.",
        "fr": "Un sac à dos avec livres, cartes d’activités et carnet de nature assortis.",
        "ar": "حقيبة ظهر مع كتب وبطاقات أنشطة ودفتر طبيعة متناسق."
      },
      "focal": {
        "x": 50,
        "y": 50
      },
      "mobileFocal": {
        "x": 50,
        "y": 50
      }
    }
  ]
};
export const defaultGallery = (world: string): Scene[] => (scenes[world] || scenes.home).map(s => ({...s, descriptions:{...s.descriptions},focal:{...s.focal},mobileFocal:{...s.mobileFocal}}));

export const legacyGuidanceImages:Record<string,string>={"documents": "/kidflix/storefronts-r2/documents.webp", "printables": "/kidflix/storefronts-r2/printables.jpg", "stories": "/kidflix/storefronts-r2/stories.webp", "learning": "/kidflix/storefronts-r2/learning.webp", "video": "/kidflix/storefronts-r2/video.jpg", "audio": "/kidflix/storefronts-r2/audio.webp", "visual-cards": "/kidflix/storefronts-r2/visual-cards.jpg", "presentations": "/kidflix/storefronts-r2/presentations.webp", "assessments": "/kidflix/storefronts-r2/assessments.webp", "activities": "/kidflix/storefronts-r2/activities.webp", "tools": "/kidflix/storefronts-r2/tools.webp", "planners": "/kidflix/storefronts-r2/planners.webp", "forms": "/kidflix/storefronts-r2/forms.webp", "community": "/kidflix/storefronts-r2/community.webp", "commerce": "/kidflix/storefronts-r2/commerce.webp", "bundles": "/kidflix/storefronts-r2/bundles.webp"};
