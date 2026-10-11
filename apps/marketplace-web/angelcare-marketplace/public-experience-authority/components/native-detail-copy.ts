import type {PublicExperience360} from '../types'
const words:Record<string,[string,string]>={
  "ANGELCARE · DÉTAILS": [
    "ANGELCARE · DETAILS",
    "أنجل كير · التفاصيل"
  ],
  "DÉCOUVERTE LIÉE": [
    "KEEP EXPLORING",
    "اكتشف المزيد"
  ],
  "EXPLOREZ LES POSSIBILITÉS": [
    "EXPLORE THE POSSIBILITIES",
    "استكشف الإمكانات"
  ],
  "VOTRE PROCHAINE ÉTAPE": [
    "YOUR NEXT STEP",
    "خطوتك القادمة"
  ],
  "Modalités à découvrir": [
    "Explore the arrangements",
    "استكشف الترتيبات"
  ],
  "Prix et modalités vérifiés avant confirmation": [
    "Price and arrangements checked before confirmation",
    "التحقق من السعر والترتيبات قبل التأكيد"
  ],
  "POUR DÉCIDER": [
    "MAKE AN INFORMED CHOICE",
    "اختر على أساس واضح"
  ],
  "Tout ce qui est inclus dans ce dossier": [
    "All the details in one place",
    "كل التفاصيل في مكان واحد"
  ],
  "Découvrez les retours partagés sur cette offre.": [
    "Explore the feedback shared about this offer.",
    "استكشف الآراء المشتركة حول هذا العرض."
  ],
  "ANGELCARE · À VOUS DE CHOISIR": [
    "ANGELCARE · MAKE IT YOURS",
    "أنجل كير · اختر ما يناسبك"
  ],
  "Et si votre prochaine expérience commençait ici ?": [
    "What if your next experience started here?",
    "ماذا لو بدأت تجربتك القادمة هنا؟"
  ],
  "Ajouter au panier": [
    "Add to basket",
    "أضف إلى السلة"
  ],
  "Réserver maintenant": [
    "Prepare your booking",
    "حضّر حجزك"
  ],
  "S’inscrire": [
    "Enrol",
    "التسجيل"
  ],
  "Demander un devis": [
    "Request a proposal",
    "اطلب عرضاً"
  ],
  "Choisir ce plan": [
    "Choose this plan",
    "اختر هذه الخطة"
  ],
  "Continuer": [
    "Continue",
    "متابعة"
  ],
  "Disponible / éligible": [
    "Available / eligible",
    "متاح / مؤهل"
  ],
  "Disponibilité à confirmer": [
    "Availability to confirm",
    "التوفر يحتاج إلى تأكيد"
  ],
  "Autre option": [
    "Another option",
    "خيار آخر"
  ],
  "Disponible": [
    "Available",
    "متاح"
  ],
  "À confirmer": [
    "To be confirmed",
    "يُؤكد لاحقاً"
  ],
  "variantes": [
    "variants",
    "نسخ"
  ],
  "début": [
    "starts",
    "البداية"
  ],
  "capacité disponible": [
    "available capacity",
    "السعة المتاحة"
  ],
  "médias officiels": [
    "offer media",
    "صور العرض"
  ],
  "preuves": [
    "documented evidence",
    "أدلة موثقة"
  ],
  "avis vérifiables": [
    "documented reviews",
    "تقييمات موثقة"
  ],
  "Spécifications et usages": [
    "Specifications and uses",
    "المواصفات والاستخدامات"
  ],
  "Livraison & accès": [
    "Delivery and access",
    "التسليم والوصول"
  ],
  "À associer à cette offre": [
    "Pair with this offer",
    "أضف إلى هذا العرض"
  ],
  "Alternatives & recommandations": [
    "Alternatives and recommendations",
    "بدائل وتوصيات"
  ],
  "Formules et options": [
    "Plans and options",
    "الصيغ والخيارات"
  ],
  "Disponibilités & calendrier": [
    "Availability and schedule",
    "التوفر والجدول"
  ],
  "Conditions de réservation": [
    "Booking requirements",
    "شروط الحجز"
  ],
  "Services complémentaires": [
    "Complementary services",
    "خدمات مكملة"
  ],
  "Programme & résultats d’apprentissage": [
    "Programme and learning outcomes",
    "البرنامج ونتائج التعلم"
  ],
  "Modules": [
    "Modules",
    "الوحدات"
  ],
  "Cohorte & prochaine session": [
    "Cohort and next session",
    "المجموعة والدورة القادمة"
  ],
  "Équipe pédagogique": [
    "Teaching team",
    "فريق التدريس"
  ],
  "Continuer votre parcours": [
    "Continue your pathway",
    "واصل مسارك"
  ],
  "Fit organisationnel": [
    "Organisational fit",
    "الملاءمة المؤسسية"
  ],
  "Diagnostic": [
    "Discovery and assessment",
    "التشخيص والتقييم"
  ],
  "Modèle de déploiement": [
    "Deployment model",
    "نموذج التنفيذ"
  ],
  "Solutions associées": [
    "Related solutions",
    "حلول مرتبطة"
  ],
  "Comprendre, choisir, vérifier puis réserver sans rupture.": [
    "Understand the care. Shape your request. Take the next step.",
    "افهم الرعاية وحدّد طلبك واتخذ الخطوة التالية."
  ],
  "Découvrir, comparer, configurer et acheter depuis une seule décision.": [
    "Discover, compare and make the product your own.",
    "اكتشف وقارن واختر المنتج المناسب لك."
  ],
  "Apprendre, prouver, s’inscrire et suivre la bonne trajectoire.": [
    "Explore the learning journey and choose your next chapter.",
    "استكشف مسارك التعليمي واختر فصلك القادم."
  ],
  "Qualifier le besoin, prouver le fit, cadrer le déploiement et convertir proprement.": [
    "Explore the solution, define the scope and prepare your project.",
    "استكشف الحل وحدّد النطاق وحضّر مشروعك."
  ]
}
export function nativeDetailText(data:PublicExperience360,text:string){const locale=data.classification.locale;return locale==='en'?words[text]?.[0]||text:locale==='ar'?words[text]?.[1]||text:text}
