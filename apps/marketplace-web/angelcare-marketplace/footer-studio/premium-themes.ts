import type { FooterTheme } from './types'

/** Ten independent footer compositions. Existing themes and profile references are preserved. */
export const PREMIUM_FOOTER_THEMES: FooterTheme[] = [
  {
    "id": "theme:editorial-atrium",
    "theme_key": "editorial-atrium",
    "name": {
      "fr": "Atrium éditorial",
      "en": "Editorial Atrium",
      "ar": "الردهة التحريرية"
    },
    "description": {
      "fr": "Une signature éditoriale lumineuse, typographie monumentale et répertoire sans cartes.",
      "en": "A light editorial system with oversized typography and a seamless rule-based directory.",
      "ar": "تصميم تحريري مضيء بعناوين كبيرة ودليل بخطوط واضحة."
    },
    "layout_key": "editorial-atrium",
    "tokens": {
      "background": "#FBF8F5",
      "background_alt": "#F0E7E3",
      "surface": "#FFFFFF",
      "text": "#2E2734",
      "muted": "#665D69",
      "accent": "#A13263",
      "accent_alt": "#7D304D",
      "line": "#D9CCD2",
      "glow": "#F3D8D7",
      "authority": "#221828",
      "surface_alt": "#F0E7E3",
      "success": "#208B72",
      "warning": "#B57E31",
      "radius": 5,
      "density": "generous",
      "shadow": "none"
    },
    "preview_metadata": {
      "sequence": 9,
      "edition": "2026",
      "composition": "editorial-atrium",
      "supports_rtl": true,
      "supports_mobile_accordion": true,
      "supports_all_blocks": true
    },
    "status": "active",
    "is_system": true
  },
  {
    "id": "theme:architect-monolith",
    "theme_key": "architect-monolith",
    "name": {
      "fr": "Monolithe architectural",
      "en": "Architect Monolith",
      "ar": "الكتلة المعمارية"
    },
    "description": {
      "fr": "Un manifeste architectural sombre, colonne monumentale et répertoire à lignes nettes.",
      "en": "Dark architectural split with a monolithic identity column and strict linear indexing.",
      "ar": "تكوين معماري داكن مع عمود هوية ضخم وفهرس خطي واضح."
    },
    "layout_key": "architect-monolith",
    "tokens": {
      "background": "#10161B",
      "background_alt": "#252D34",
      "surface": "#1D242A",
      "text": "#FAF8F5",
      "muted": "#C9D0D4",
      "accent": "#F5C977",
      "accent_alt": "#BEE0DF",
      "line": "#47535A",
      "glow": "#F5C977",
      "authority": "#070B0F",
      "surface_alt": "#252D34",
      "success": "#208B72",
      "warning": "#B57E31",
      "radius": 2,
      "density": "compact",
      "shadow": "none"
    },
    "preview_metadata": {
      "sequence": 10,
      "edition": "2026",
      "composition": "architect-monolith",
      "supports_rtl": true,
      "supports_mobile_accordion": true,
      "supports_all_blocks": true
    },
    "status": "active",
    "is_system": true
  },
  {
    "id": "theme:atelier-bento",
    "theme_key": "atelier-bento",
    "name": {
      "fr": "Atelier Bento",
      "en": "Atelier Bento",
      "ar": "أتيليه بينتو"
    },
    "description": {
      "fr": "Un tableau mosaïque pastel où les sections ont des volumes et tailles distincts.",
      "en": "A warm pastel mosaic with asymmetric, generously rounded content tiles.",
      "ar": "فسيفساء دافئة بأحجام مختلفة وبطاقات مستديرة."
    },
    "layout_key": "atelier-bento",
    "tokens": {
      "background": "#FFF7F6",
      "background_alt": "#F2E4F3",
      "surface": "#FFFFFF",
      "text": "#37283E",
      "muted": "#78687E",
      "accent": "#B7357A",
      "accent_alt": "#147E76",
      "line": "#E8D2E2",
      "glow": "#E5B3D4",
      "authority": "#322044",
      "surface_alt": "#F2E4F3",
      "success": "#208B72",
      "warning": "#B57E31",
      "radius": 30,
      "density": "generous",
      "shadow": "0 16px 40px rgba(71,36,74,.12)"
    },
    "preview_metadata": {
      "sequence": 11,
      "edition": "2026",
      "composition": "atelier-bento",
      "supports_rtl": true,
      "supports_mobile_accordion": true,
      "supports_all_blocks": true
    },
    "status": "active",
    "is_system": true
  },
  {
    "id": "theme:signal-spectrum",
    "theme_key": "signal-spectrum",
    "name": {
      "fr": "Signal Spectrum",
      "en": "Signal Spectrum",
      "ar": "طيف الإشارة"
    },
    "description": {
      "fr": "Une interface digitale à fort contraste, grilles de signal et repères numérotés.",
      "en": "High-contrast digital signal architecture with a kinetic numeric grid.",
      "ar": "هوية رقمية عالية التباين بشبكة هندسية وأرقام واضحة."
    },
    "layout_key": "signal-spectrum",
    "tokens": {
      "background": "#18112F",
      "background_alt": "#2D1B53",
      "surface": "#271B48",
      "text": "#FFF8FF",
      "muted": "#D6C7E4",
      "accent": "#F5A1D3",
      "accent_alt": "#6FE4C7",
      "line": "#533E72",
      "glow": "#874AC5",
      "authority": "#0A0818",
      "surface_alt": "#2D1B53",
      "success": "#208B72",
      "warning": "#B57E31",
      "radius": 10,
      "density": "compact",
      "shadow": "0 20px 70px rgba(13,8,32,.4)"
    },
    "preview_metadata": {
      "sequence": 12,
      "edition": "2026",
      "composition": "signal-spectrum",
      "supports_rtl": true,
      "supports_mobile_accordion": true,
      "supports_all_blocks": true
    },
    "status": "active",
    "is_system": true
  },
  {
    "id": "theme:terrace-mediterranean",
    "theme_key": "terrace-mediterranean",
    "name": {
      "fr": "Terrasse méditerranéenne",
      "en": "Terrace Mediterranean",
      "ar": "الشرفة المتوسطية"
    },
    "description": {
      "fr": "Architecture chaleureuse en colonnes, terre cuite et lignes naturelles.",
      "en": "Warm Mediterranean terrace with terracotta structure and columnar navigation.",
      "ar": "شرفة متوسطية بألوان التراب وأعمدة منظمة."
    },
    "layout_key": "terrace-mediterranean",
    "tokens": {
      "background": "#FCF1E1",
      "background_alt": "#F1DCC6",
      "surface": "#FFFBF5",
      "text": "#3F302E",
      "muted": "#74605C",
      "accent": "#9C5137",
      "accent_alt": "#2B7469",
      "line": "#DAC1A7",
      "glow": "#EDC3A4",
      "authority": "#3A2723",
      "surface_alt": "#F1DCC6",
      "success": "#208B72",
      "warning": "#B57E31",
      "radius": 14,
      "density": "balanced",
      "shadow": "0 20px 55px rgba(91,61,36,.14)"
    },
    "preview_metadata": {
      "sequence": 13,
      "edition": "2026",
      "composition": "terrace-mediterranean",
      "supports_rtl": true,
      "supports_mobile_accordion": true,
      "supports_all_blocks": true
    },
    "status": "active",
    "is_system": true
  },
  {
    "id": "theme:institutional-ledger",
    "theme_key": "institutional-ledger",
    "name": {
      "fr": "Registre institutionnel",
      "en": "Institutional Ledger",
      "ar": "السجل المؤسسي"
    },
    "description": {
      "fr": "Une grille institutionnelle rigoureuse, numéros d'index et structure de registre.",
      "en": "An institutional ledger with indexed rows, dense structure and typographic authority.",
      "ar": "سجل مؤسسي بفهرسة دقيقة وصفوف منظمة."
    },
    "layout_key": "institutional-ledger",
    "tokens": {
      "background": "#0C1830",
      "background_alt": "#152A4B",
      "surface": "#172944",
      "text": "#F6FAFF",
      "muted": "#BCCBD9",
      "accent": "#E1C183",
      "accent_alt": "#9DB6CA",
      "line": "#364F6B",
      "glow": "#E0BD77",
      "authority": "#070F20",
      "surface_alt": "#152A4B",
      "success": "#208B72",
      "warning": "#B57E31",
      "radius": 4,
      "density": "compact",
      "shadow": "none"
    },
    "preview_metadata": {
      "sequence": 14,
      "edition": "2026",
      "composition": "institutional-ledger",
      "supports_rtl": true,
      "supports_mobile_accordion": true,
      "supports_all_blocks": true
    },
    "status": "active",
    "is_system": true
  },
  {
    "id": "theme:calm-canopy",
    "theme_key": "calm-canopy",
    "name": {
      "fr": "Canopée apaisante",
      "en": "Calm Canopy",
      "ar": "المظلة الهادئة"
    },
    "description": {
      "fr": "Une expérience organique végétale, espaces généreux et modules doux.",
      "en": "An airy botanical environment with organic spacing and soft content groupings.",
      "ar": "مساحات هادئة وطبيعية مع وحدات مرنة ومستديرة."
    },
    "layout_key": "calm-canopy",
    "tokens": {
      "background": "#F5FAF5",
      "background_alt": "#E1F0E5",
      "surface": "#FFFFFF",
      "text": "#1F3934",
      "muted": "#617B70",
      "accent": "#217C63",
      "accent_alt": "#A16A56",
      "line": "#C9DED0",
      "glow": "#C1E5D4",
      "authority": "#173C35",
      "surface_alt": "#E1F0E5",
      "success": "#208B72",
      "warning": "#B57E31",
      "radius": 28,
      "density": "generous",
      "shadow": "0 18px 48px rgba(35,76,55,.09)"
    },
    "preview_metadata": {
      "sequence": 15,
      "edition": "2026",
      "composition": "calm-canopy",
      "supports_rtl": true,
      "supports_mobile_accordion": true,
      "supports_all_blocks": true
    },
    "status": "active",
    "is_system": true
  },
  {
    "id": "theme:orbit-capsule",
    "theme_key": "orbit-capsule",
    "name": {
      "fr": "Capsule Orbit",
      "en": "Orbit Capsule",
      "ar": "كبسولة المدار"
    },
    "description": {
      "fr": "Un paysage immersif de capsules flottantes et surfaces nocturnes.",
      "en": "An immersive midnight capsule system with floating, overlapping surfaces.",
      "ar": "مساحات ليلية عائمة بكبسولات متداخلة."
    },
    "layout_key": "orbit-capsule",
    "tokens": {
      "background": "#180F32",
      "background_alt": "#3A225E",
      "surface": "#30204D",
      "text": "#FFF9FF",
      "muted": "#DACDEC",
      "accent": "#F9B3D7",
      "accent_alt": "#9EE9DB",
      "line": "#594474",
      "glow": "#9F65C6",
      "authority": "#0B061A",
      "surface_alt": "#3A225E",
      "success": "#208B72",
      "warning": "#B57E31",
      "radius": 34,
      "density": "generous",
      "shadow": "0 28px 86px rgba(14,7,35,.47)"
    },
    "preview_metadata": {
      "sequence": 16,
      "edition": "2026",
      "composition": "orbit-capsule",
      "supports_rtl": true,
      "supports_mobile_accordion": true,
      "supports_all_blocks": true
    },
    "status": "active",
    "is_system": true
  },
  {
    "id": "theme:civic-index",
    "theme_key": "civic-index",
    "name": {
      "fr": "Index civique",
      "en": "Civic Index",
      "ar": "الفهرس المدني"
    },
    "description": {
      "fr": "Un index public de précision, hiérarchie typographique et repères structurés.",
      "en": "Minimal civic index with disciplined rules, numbered sections and compact typographic hierarchy.",
      "ar": "فهرس مدني دقيق بخطوط تنظيمية وعناوين واضحة."
    },
    "layout_key": "civic-index",
    "tokens": {
      "background": "#F5F5F2",
      "background_alt": "#E8EBE9",
      "surface": "#FFFFFF",
      "text": "#21343A",
      "muted": "#5B6C70",
      "accent": "#215E67",
      "accent_alt": "#A85B47",
      "line": "#CED8D6",
      "glow": "#B9D0CD",
      "authority": "#172B34",
      "surface_alt": "#E8EBE9",
      "success": "#208B72",
      "warning": "#B57E31",
      "radius": 3,
      "density": "compact",
      "shadow": "none"
    },
    "preview_metadata": {
      "sequence": 17,
      "edition": "2026",
      "composition": "civic-index",
      "supports_rtl": true,
      "supports_mobile_accordion": true,
      "supports_all_blocks": true
    },
    "status": "active",
    "is_system": true
  },
  {
    "id": "theme:chromatic-ribbon",
    "theme_key": "chromatic-ribbon",
    "name": {
      "fr": "Ruban chromatique",
      "en": "Chromatic Ribbon",
      "ar": "الشريط اللوني"
    },
    "description": {
      "fr": "Un ruban de marque expressif, architecture horizontale et blocs chromatiques.",
      "en": "A vibrant horizontal brand ribbon with alternating section accents.",
      "ar": "شريط علامة تجارية أفقي بألوان متناغمة ووحدات متباينة."
    },
    "layout_key": "chromatic-ribbon",
    "tokens": {
      "background": "#FEF9FC",
      "background_alt": "#F4E8F5",
      "surface": "#FFFFFF",
      "text": "#362441",
      "muted": "#765E80",
      "accent": "#B7307D",
      "accent_alt": "#1B8F83",
      "line": "#E5D4E5",
      "glow": "#F4B8D5",
      "authority": "#261734",
      "surface_alt": "#F4E8F5",
      "success": "#208B72",
      "warning": "#B57E31",
      "radius": 17,
      "density": "balanced",
      "shadow": "0 17px 45px rgba(75,30,86,.11)"
    },
    "preview_metadata": {
      "sequence": 18,
      "edition": "2026",
      "composition": "chromatic-ribbon",
      "supports_rtl": true,
      "supports_mobile_accordion": true,
      "supports_all_blocks": true
    },
    "status": "active",
    "is_system": true
  }
] as FooterTheme[]
