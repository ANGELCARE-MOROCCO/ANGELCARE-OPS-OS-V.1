import type { CatalogLocale } from '../catalog-discovery/types'
import type { JourneyStatus, JourneyType } from './types'

export const journeyTypeLabels: Record<CatalogLocale, Record<JourneyType, string>> = {
  fr: {
    product_order: 'Commande produit', kit_order: 'Commande kit', family_booking: 'Réservation famille',
    recurring_service: 'Service récurrent', academy_enrollment: 'Inscription Academy', b2b_quotation: 'Parcours devis B2B',
    hospitality_programme: 'Programme hospitality', corporate_benefit: 'Programme entreprise',
    partner_activation: 'Activation Partner OS', quality_assessment: 'Évaluation Quality Check 360',
  },
  en: {
    product_order: 'Product order', kit_order: 'Kit order', family_booking: 'Family booking',
    recurring_service: 'Recurring service', academy_enrollment: 'Academy enrollment', b2b_quotation: 'B2B quotation journey',
    hospitality_programme: 'Hospitality programme', corporate_benefit: 'Corporate benefit programme',
    partner_activation: 'Partner OS activation', quality_assessment: 'Quality Check 360 assessment',
  },
  ar: {
    product_order: 'طلب منتج', kit_order: 'طلب حقيبة', family_booking: 'حجز عائلي',
    recurring_service: 'خدمة متكررة', academy_enrollment: 'تسجيل الأكاديمية', b2b_quotation: 'مسار عرض أسعار للشركات',
    hospitality_programme: 'برنامج الضيافة', corporate_benefit: 'برنامج مزايا الشركات',
    partner_activation: 'تفعيل Partner OS', quality_assessment: 'تقييم Quality Check 360',
  },
}

export const statusLabels: Record<CatalogLocale, Record<JourneyStatus, string>> = {
  fr: {
    registered: 'Enregistré', awaiting_customer: 'Action client requise', awaiting_angelcare: 'Traitement ANGELCARE',
    qualified: 'Qualifié', scheduled: 'Planifié', in_preparation: 'En préparation', in_progress: 'En cours',
    completed: 'Terminé', blocked: 'Bloqué', recovery: 'Récupération en cours', cancelled: 'Annulé',
  },
  en: {
    registered: 'Registered', awaiting_customer: 'Customer action required', awaiting_angelcare: 'ANGELCARE processing',
    qualified: 'Qualified', scheduled: 'Scheduled', in_preparation: 'In preparation', in_progress: 'In progress',
    completed: 'Completed', blocked: 'Blocked', recovery: 'Recovery in progress', cancelled: 'Cancelled',
  },
  ar: {
    registered: 'مسجل', awaiting_customer: 'إجراء العميل مطلوب', awaiting_angelcare: 'قيد معالجة ANGELCARE',
    qualified: 'مؤهل', scheduled: 'مجدول', in_preparation: 'قيد التحضير', in_progress: 'قيد التنفيذ',
    completed: 'مكتمل', blocked: 'متوقف', recovery: 'قيد الاستعادة', cancelled: 'ملغى',
  },
}

export const accountCopy: Record<CatalogLocale, {
  eyebrow: string; title: string; description: string; actions: string; active: string;
  upcoming: string; documents: string; support: string; empty: string; allJourneys: string;
}> = {
  fr: {
    eyebrow: 'MON ANGELCARE · COMMAND CENTER', title: 'Vos parcours, clairement orchestrés.',
    description: 'Suivez chaque commande, réservation, inscription, devis, activation et évaluation depuis un seul univers de confiance.',
    actions: 'À faire maintenant', active: 'Parcours actifs', upcoming: 'Prochaines échéances', documents: 'Documents',
    support: 'Besoin d’aide', empty: 'Aucun parcours actif ne requiert votre attention.', allJourneys: 'Voir tous les parcours',
  },
  en: {
    eyebrow: 'MY ANGELCARE · COMMAND CENTER', title: 'Every journey, clearly orchestrated.',
    description: 'Track every order, booking, enrollment, quotation, activation and assessment from one trusted universe.',
    actions: 'Do now', active: 'Active journeys', upcoming: 'Upcoming', documents: 'Documents',
    support: 'Get support', empty: 'No active journey requires your attention.', allJourneys: 'View all journeys',
  },
  ar: {
    eyebrow: 'ANGELCARE الخاص بي · مركز القيادة', title: 'كل مساراتك تحت إدارة واضحة.',
    description: 'تابع الطلبات والحجوزات والتسجيلات وعروض الأسعار والتفعيلات والتقييمات من مساحة موثوقة واحدة.',
    actions: 'الإجراءات الحالية', active: 'المسارات النشطة', upcoming: 'المواعيد القادمة', documents: 'الوثائق',
    support: 'طلب الدعم', empty: 'لا يوجد مسار نشط يتطلب انتباهك.', allJourneys: 'عرض كل المسارات',
  },
}

export const journeyAccent: Record<JourneyType, string> = {
  product_order: 'commerce', kit_order: 'kit', family_booking: 'family', recurring_service: 'family',
  academy_enrollment: 'academy', b2b_quotation: 'b2b', hospitality_programme: 'hospitality',
  corporate_benefit: 'corporate', partner_activation: 'partner', quality_assessment: 'quality',
}
