import type {LiveCampaign,LivePreset,ResolvedLiveExperience} from './types'
import {object} from './experience-contract'
import {LIVE_THEMES} from './registry'
import {COMMERCIAL_COPY} from './commercial-copy'
export const EXPERIENCE_RECIPES = {
  "welcome_orientation": {
    "key": "welcome_orientation",
    "family": "atlas",
    "blocks": [
      "destinations",
      "editorial",
      "action"
    ],
    "title": {
      "fr": "Bienvenue & orientation",
      "en": "Welcome & orientation",
      "ar": "الترحيب والتوجيه"
    },
    "domain": "onboarding",
    "placement": "after_header",
    "trigger": "delay",
    "parameters": {
      "delay_seconds": 3,
      "customer_selector": true,
      "territory_selector": true
    },
    "editorialIndex": 0,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "customer_registration": {
    "key": "customer_registration",
    "family": "passport",
    "blocks": [
      "benefits",
      "continuity",
      "action"
    ],
    "title": {
      "fr": "Création de compte client",
      "en": "Customer registration",
      "ar": "إنشاء حساب العميل"
    },
    "domain": "identity",
    "placement": "modal",
    "trigger": "exit_intent",
    "parameters": {
      "preserve_basket": true,
      "show_wallet_benefits": true
    },
    "editorialIndex": 1,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "login_continuation": {
    "key": "login_continuation",
    "family": "continuity",
    "blocks": [
      "continuity",
      "editorial",
      "action"
    ],
    "title": {
      "fr": "Continuer après connexion",
      "en": "Login continuation",
      "ar": "المتابعة بعد تسجيل الدخول"
    },
    "domain": "identity",
    "placement": "modal",
    "trigger": "click",
    "parameters": {
      "restore_configuration": true,
      "return_to": true
    },
    "editorialIndex": 2,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "wallet_activation": {
    "key": "wallet_activation",
    "family": "privilege",
    "blocks": [
      "benefits",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Activation AC Wallet",
      "en": "AC Wallet activation",
      "ar": "تفعيل محفظة AC"
    },
    "domain": "wallet",
    "placement": "modal",
    "trigger": "wallet_eligible",
    "parameters": {
      "comparison": true,
      "premium_status": true
    },
    "editorialIndex": 3,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "wallet_topup": {
    "key": "wallet_topup",
    "family": "balance",
    "blocks": [
      "editorial",
      "terms",
      "action"
    ],
    "title": {
      "fr": "Recharge AC Wallet",
      "en": "AC Wallet top-up",
      "ar": "شحن محفظة AC"
    },
    "domain": "wallet",
    "placement": "bottom_sheet",
    "trigger": "wallet_insufficient",
    "parameters": {
      "balance": true,
      "required_amount": true,
      "bonus_preview": true
    },
    "editorialIndex": 4,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "wallet_exclusive_offer": {
    "key": "wallet_exclusive_offer",
    "family": "privilege",
    "blocks": [
      "offer",
      "evidence",
      "terms",
      "action"
    ],
    "title": {
      "fr": "Offre exclusive AC Wallet",
      "en": "AC Wallet exclusive offer",
      "ar": "عرض حصري لمحفظة AC"
    },
    "domain": "wallet",
    "placement": "floating_card",
    "trigger": "wallet_member",
    "parameters": {
      "wallet_price": true,
      "saving": true,
      "expires_at": true
    },
    "editorialIndex": 5,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "basket_recovery": {
    "key": "basket_recovery",
    "family": "recovery",
    "blocks": [
      "continuity",
      "offer",
      "action"
    ],
    "title": {
      "fr": "Récupération du panier",
      "en": "Basket recovery",
      "ar": "استعادة السلة"
    },
    "domain": "conversion",
    "placement": "side_drawer",
    "trigger": "basket_abandonment",
    "parameters": {
      "revalidate": true,
      "wallet_comparison": true
    },
    "editorialIndex": 6,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "checkout_recovery": {
    "key": "checkout_recovery",
    "family": "concierge",
    "blocks": [
      "continuity",
      "terms",
      "action"
    ],
    "title": {
      "fr": "Reprise du checkout",
      "en": "Checkout recovery",
      "ar": "استئناف الدفع"
    },
    "domain": "conversion",
    "placement": "side_drawer",
    "trigger": "checkout_interrupted",
    "parameters": {
      "safe_retry": true,
      "payment_state": true
    },
    "editorialIndex": 7,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "product_cross_sell": {
    "key": "product_cross_sell",
    "family": "showcase",
    "blocks": [
      "offer",
      "features",
      "action"
    ],
    "title": {
      "fr": "Produit complémentaire",
      "en": "Product cross-sell",
      "ar": "منتج مكمل"
    },
    "domain": "merchandising",
    "placement": "inline",
    "trigger": "basket_update",
    "parameters": {
      "one_click_add": true,
      "compatibility": true
    },
    "editorialIndex": 8,
    "requiresOffer": true,
    "requiresPromotion": false
  },
  "service_addon": {
    "key": "service_addon",
    "family": "planner",
    "blocks": [
      "features",
      "offer",
      "action"
    ],
    "title": {
      "fr": "Option de service",
      "en": "Service add-on",
      "ar": "إضافة خدمة"
    },
    "domain": "merchandising",
    "placement": "inline",
    "trigger": "service_configured",
    "parameters": {
      "price_impact": true,
      "compatible_addons": true
    },
    "editorialIndex": 9,
    "requiresOffer": true,
    "requiresPromotion": false
  },
  "flashcards_recommendation": {
    "key": "flashcards_recommendation",
    "family": "explorer",
    "blocks": [
      "offer",
      "learning",
      "features",
      "action"
    ],
    "title": {
      "fr": "Conseil Flashcards",
      "en": "Flashcards recommendation",
      "ar": "توصية البطاقات التعليمية"
    },
    "domain": "category_native",
    "placement": "floating_card",
    "trigger": "category_interest",
    "parameters": {
      "age": true,
      "language": true,
      "level": true
    },
    "editorialIndex": 10,
    "requiresOffer": true,
    "requiresPromotion": false
  },
  "montessori_recommendation": {
    "key": "montessori_recommendation",
    "family": "discovery",
    "blocks": [
      "learning",
      "offer",
      "features",
      "action"
    ],
    "title": {
      "fr": "Conseil Montessori",
      "en": "Montessori recommendation",
      "ar": "توصية مونتيسوري"
    },
    "domain": "category_native",
    "placement": "floating_card",
    "trigger": "category_interest",
    "parameters": {
      "development_domain": true,
      "age": true
    },
    "editorialIndex": 11,
    "requiresOffer": true,
    "requiresPromotion": false
  },
  "home_childcare_acceleration": {
    "key": "home_childcare_acceleration",
    "family": "planner",
    "blocks": [
      "offer",
      "care",
      "terms",
      "action"
    ],
    "title": {
      "fr": "Accélérer la garde à domicile",
      "en": "Home childcare acceleration",
      "ar": "تسريع رعاية الأطفال المنزلية"
    },
    "domain": "service",
    "placement": "bottom_sheet",
    "trigger": "service_interest",
    "parameters": {
      "territory": true,
      "date": true,
      "duration": true
    },
    "editorialIndex": 12,
    "requiresOffer": true,
    "requiresPromotion": false
  },
  "recurring_care_conversion": {
    "key": "recurring_care_conversion",
    "family": "rhythm",
    "blocks": [
      "rhythm",
      "offer",
      "care",
      "action"
    ],
    "title": {
      "fr": "Passer au service récurrent",
      "en": "Recurring care conversion",
      "ar": "الانتقال إلى الرعاية المتكررة"
    },
    "domain": "service",
    "placement": "side_drawer",
    "trigger": "repeat_visit",
    "parameters": {
      "schedule": true,
      "monthly_estimate": true
    },
    "editorialIndex": 13,
    "requiresOffer": true,
    "requiresPromotion": false
  },
  "academy_enrollment_urgency": {
    "key": "academy_enrollment_urgency",
    "family": "academy",
    "blocks": [
      "learning",
      "offer",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Inscription Academy",
      "en": "Academy enrollment",
      "ar": "التسجيل في الأكاديمية"
    },
    "domain": "academy",
    "placement": "modal",
    "trigger": "cohort_interest",
    "parameters": {
      "real_seats": true,
      "deadline": true
    },
    "editorialIndex": 14,
    "requiresOffer": true,
    "requiresPromotion": false
  },
  "preschool_admissions": {
    "key": "preschool_admissions",
    "family": "admission",
    "blocks": [
      "learning",
      "features",
      "action"
    ],
    "title": {
      "fr": "Admissions préscolaires",
      "en": "Preschool admissions",
      "ar": "القبول في مرحلة ما قبل المدرسة"
    },
    "domain": "preschool",
    "placement": "modal",
    "trigger": "admission_interest",
    "parameters": {
      "age_eligibility": true,
      "campus": true
    },
    "editorialIndex": 15,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "b2b_consultation": {
    "key": "b2b_consultation",
    "family": "executive",
    "blocks": [
      "scope",
      "offer",
      "brief",
      "action"
    ],
    "title": {
      "fr": "Consultation B2B",
      "en": "B2B consultation",
      "ar": "استشارة الأعمال"
    },
    "domain": "b2b",
    "placement": "side_drawer",
    "trigger": "b2b_interest",
    "parameters": {
      "organization_type": true,
      "site_count": true
    },
    "editorialIndex": 16,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "partner_os_conversion": {
    "key": "partner_os_conversion",
    "family": "workspace",
    "blocks": [
      "features",
      "scope",
      "action"
    ],
    "title": {
      "fr": "Découvrir Partner OS",
      "en": "Partner OS conversion",
      "ar": "اكتشاف نظام الشركاء"
    },
    "domain": "partner_os",
    "placement": "modal",
    "trigger": "plan_interest",
    "parameters": {
      "plan_comparison": true,
      "modules": true
    },
    "editorialIndex": 17,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "quality_check_diagnostic": {
    "key": "quality_check_diagnostic",
    "family": "diagnostic",
    "blocks": [
      "scope",
      "evidence",
      "brief",
      "action"
    ],
    "title": {
      "fr": "Diagnostic Quality Check 360",
      "en": "Quality Check 360 diagnostic",
      "ar": "تشخيص فحص الجودة 360"
    },
    "domain": "quality",
    "placement": "modal",
    "trigger": "assessment_interest",
    "parameters": {
      "scope": true,
      "evidence_readiness": true
    },
    "editorialIndex": 18,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "event_excursion_promotion": {
    "key": "event_excursion_promotion",
    "family": "itinerary",
    "blocks": [
      "offer",
      "features",
      "terms",
      "action"
    ],
    "title": {
      "fr": "Événement & excursion",
      "en": "Event & excursion",
      "ar": "فعالية ورحلة"
    },
    "domain": "events",
    "placement": "floating_card",
    "trigger": "event_interest",
    "parameters": {
      "date": true,
      "capacity": true
    },
    "editorialIndex": 19,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "back_in_stock": {
    "key": "back_in_stock",
    "family": "availability",
    "blocks": [
      "offer",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Retour en stock",
      "en": "Back in stock",
      "ar": "العودة إلى المخزون"
    },
    "domain": "availability",
    "placement": "corner",
    "trigger": "out_of_stock",
    "parameters": {
      "variant": true,
      "notification_consent": true
    },
    "editorialIndex": 20,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "waitlist_registration": {
    "key": "waitlist_registration",
    "family": "waiting",
    "blocks": [
      "editorial",
      "terms",
      "action"
    ],
    "title": {
      "fr": "Rejoindre la liste d’attente",
      "en": "Join waitlist",
      "ar": "الانضمام إلى قائمة الانتظار"
    },
    "domain": "availability",
    "placement": "bottom_sheet",
    "trigger": "capacity_full",
    "parameters": {
      "real_capacity": true,
      "alternatives": true
    },
    "editorialIndex": 21,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "support_recovery": {
    "key": "support_recovery",
    "family": "assistance",
    "blocks": [
      "continuity",
      "editorial",
      "action"
    ],
    "title": {
      "fr": "Support & rétablissement",
      "en": "Support & recovery",
      "ar": "الدعم والاستعادة"
    },
    "domain": "support",
    "placement": "side_drawer",
    "trigger": "journey_problem",
    "parameters": {
      "contextual_reference": true,
      "preferred_channel": true
    },
    "editorialIndex": 22,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "feedback_nps": {
    "key": "feedback_nps",
    "family": "feedback",
    "blocks": [
      "editorial",
      "action"
    ],
    "title": {
      "fr": "Votre expérience",
      "en": "Your experience",
      "ar": "تجربتك"
    },
    "domain": "feedback",
    "placement": "floating_card",
    "trigger": "journey_completed",
    "parameters": {
      "rating": true,
      "support_escalation": true
    },
    "editorialIndex": 23,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "global_announcement": {
    "key": "global_announcement",
    "family": "signal",
    "blocks": [
      "editorial",
      "action"
    ],
    "title": {
      "fr": "Annonce Marketplace",
      "en": "Marketplace announcement",
      "ar": "إعلان السوق"
    },
    "domain": "announcement",
    "placement": "top_bar",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 24,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "wallet_benefit_campaign": {
    "key": "wallet_benefit_campaign",
    "family": "benefit-rail",
    "blocks": [
      "benefits",
      "terms",
      "action"
    ],
    "title": {
      "fr": "Avantage AC Wallet",
      "en": "AC Wallet benefit",
      "ar": "ميزة محفظة AC"
    },
    "domain": "wallet",
    "placement": "sticky_top",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 25,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "wallet_topup_bonus": {
    "key": "wallet_topup_bonus",
    "family": "benefit-panel",
    "blocks": [
      "editorial",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Bonus de recharge Wallet",
      "en": "Wallet top-up bonus",
      "ar": "مكافأة شحن المحفظة"
    },
    "domain": "wallet",
    "placement": "expandable_panel",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 26,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "flash_sale_countdown": {
    "key": "flash_sale_countdown",
    "family": "deal",
    "blocks": [
      "offer",
      "promotion",
      "countdown",
      "terms",
      "action"
    ],
    "title": {
      "fr": "Flash sale",
      "en": "Flash sale",
      "ar": "تخفيض سريع"
    },
    "domain": "commerce",
    "placement": "campaign_ribbon",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 27,
    "requiresOffer": true,
    "requiresPromotion": true
  },
  "academy_deadline": {
    "key": "academy_deadline",
    "family": "deadline",
    "blocks": [
      "learning",
      "countdown",
      "action"
    ],
    "title": {
      "fr": "Clôture des inscriptions",
      "en": "Enrollment deadline",
      "ar": "موعد إغلاق التسجيل"
    },
    "domain": "academy",
    "placement": "top_bar",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 28,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "event_opening": {
    "key": "event_opening",
    "family": "event-rail",
    "blocks": [
      "offer",
      "features",
      "action"
    ],
    "title": {
      "fr": "Ouverture événement/excursion",
      "en": "Event/excursion opening",
      "ar": "افتتاح فعالية أو رحلة"
    },
    "domain": "events",
    "placement": "campaign_ribbon",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 29,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "territory_launch": {
    "key": "territory_launch",
    "family": "territory",
    "blocks": [
      "editorial",
      "destinations",
      "action"
    ],
    "title": {
      "fr": "Nouveau territoire",
      "en": "New territory",
      "ar": "منطقة جديدة"
    },
    "domain": "territory",
    "placement": "expandable_panel",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 30,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "offer_launch": {
    "key": "offer_launch",
    "family": "launch",
    "blocks": [
      "offer",
      "features",
      "action"
    ],
    "title": {
      "fr": "Nouvelle offre",
      "en": "New offer",
      "ar": "عرض جديد"
    },
    "domain": "launch",
    "placement": "campaign_ribbon",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 31,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "service_interruption": {
    "key": "service_interruption",
    "family": "advisory",
    "blocks": [
      "editorial",
      "continuity",
      "action"
    ],
    "title": {
      "fr": "Interruption de service",
      "en": "Service interruption",
      "ar": "انقطاع الخدمة"
    },
    "domain": "operations",
    "placement": "critical_panel",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 32,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "scheduled_maintenance": {
    "key": "scheduled_maintenance",
    "family": "maintenance",
    "blocks": [
      "editorial",
      "countdown",
      "action"
    ],
    "title": {
      "fr": "Maintenance programmée",
      "en": "Scheduled maintenance",
      "ar": "صيانة مجدولة"
    },
    "domain": "operations",
    "placement": "critical_panel",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 33,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "support_advisory": {
    "key": "support_advisory",
    "family": "help-rail",
    "blocks": [
      "editorial",
      "action"
    ],
    "title": {
      "fr": "Information support",
      "en": "Support advisory",
      "ar": "إرشادات الدعم"
    },
    "domain": "support",
    "placement": "bottom_bar",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 34,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "b2b_campaign": {
    "key": "b2b_campaign",
    "family": "boardroom",
    "blocks": [
      "scope",
      "brief",
      "action"
    ],
    "title": {
      "fr": "Campagne B2B",
      "en": "B2B campaign",
      "ar": "حملة أعمال"
    },
    "domain": "b2b",
    "placement": "expandable_panel",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 35,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "partner_os_campaign": {
    "key": "partner_os_campaign",
    "family": "workspace-rail",
    "blocks": [
      "features",
      "action"
    ],
    "title": {
      "fr": "Campagne Partner OS",
      "en": "Partner OS campaign",
      "ar": "حملة نظام الشركاء"
    },
    "domain": "partner_os",
    "placement": "campaign_ribbon",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 36,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "quality_check_campaign": {
    "key": "quality_check_campaign",
    "family": "assurance",
    "blocks": [
      "scope",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Campagne Quality Check",
      "en": "Quality Check campaign",
      "ar": "حملة فحص الجودة"
    },
    "domain": "quality",
    "placement": "campaign_ribbon",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 37,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "trust_legal_update": {
    "key": "trust_legal_update",
    "family": "legal",
    "blocks": [
      "terms",
      "editorial",
      "action"
    ],
    "title": {
      "fr": "Mise à jour confiance & politique",
      "en": "Trust & policy update",
      "ar": "تحديث الثقة والسياسات"
    },
    "domain": "trust",
    "placement": "top_bar",
    "trigger": "schedule",
    "parameters": {
      "rotatable": true,
      "dismissible": true
    },
    "editorialIndex": 38,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "flash_sale_proof": {
    "key": "flash_sale_proof",
    "family": "price",
    "blocks": [
      "promotion",
      "countdown",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Prix flash & compte à rebours",
      "en": "Flash price & countdown",
      "ar": "سعر سريع وعد تنازلي"
    },
    "domain": "price",
    "placement": "product_hero",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 39,
    "requiresOffer": true,
    "requiresPromotion": true
  },
  "low_stock_product": {
    "key": "low_stock_product",
    "family": "stock",
    "blocks": [
      "offer",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Stock produit faible",
      "en": "Low product stock",
      "ar": "مخزون منخفض"
    },
    "domain": "inventory",
    "placement": "product_card",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 40,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "variant_scarcity": {
    "key": "variant_scarcity",
    "family": "variant",
    "blocks": [
      "offer",
      "features",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Rareté de variante",
      "en": "Variant scarcity",
      "ar": "ندرة المتغير"
    },
    "domain": "inventory",
    "placement": "product_hero",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 41,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "academy_remaining_seats": {
    "key": "academy_remaining_seats",
    "family": "seats",
    "blocks": [
      "learning",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Places Academy restantes",
      "en": "Academy seats remaining",
      "ar": "المقاعد المتبقية"
    },
    "domain": "academy",
    "placement": "product_hero",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 42,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "event_remaining_capacity": {
    "key": "event_remaining_capacity",
    "family": "capacity",
    "blocks": [
      "offer",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Capacité événement restante",
      "en": "Event capacity remaining",
      "ar": "السعة المتبقية للفعالية"
    },
    "domain": "events",
    "placement": "product_hero",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 43,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "booking_availability": {
    "key": "booking_availability",
    "family": "availability-panel",
    "blocks": [
      "care",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Disponibilité de réservation",
      "en": "Booking availability",
      "ar": "توفر الحجز"
    },
    "domain": "service",
    "placement": "configurator",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 44,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "wallet_saving_proof": {
    "key": "wallet_saving_proof",
    "family": "comparison",
    "blocks": [
      "evidence",
      "terms",
      "action"
    ],
    "title": {
      "fr": "Économie AC Wallet",
      "en": "AC Wallet saving",
      "ar": "توفير محفظة AC"
    },
    "domain": "wallet",
    "placement": "price_panel",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 45,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "wallet_topup_bonus_proof": {
    "key": "wallet_topup_bonus_proof",
    "family": "wallet-evidence",
    "blocks": [
      "evidence",
      "terms",
      "action"
    ],
    "title": {
      "fr": "Bonus recharge Wallet",
      "en": "Wallet top-up bonus",
      "ar": "مكافأة شحن المحفظة"
    },
    "domain": "wallet",
    "placement": "wallet_dashboard",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 46,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "recent_purchase_activity": {
    "key": "recent_purchase_activity",
    "family": "purchase-evidence",
    "blocks": [
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Achats récents vérifiés",
      "en": "Verified recent purchases",
      "ar": "مشتريات حديثة موثقة"
    },
    "domain": "activity",
    "placement": "floating_side",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 47,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "recent_booking_activity": {
    "key": "recent_booking_activity",
    "family": "booking-evidence",
    "blocks": [
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Réservations récentes vérifiées",
      "en": "Verified recent bookings",
      "ar": "حجوزات حديثة موثقة"
    },
    "domain": "activity",
    "placement": "floating_side",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 48,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "popular_product_proof": {
    "key": "popular_product_proof",
    "family": "popularity",
    "blocks": [
      "offer",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Produit populaire",
      "en": "Popular product",
      "ar": "منتج شائع"
    },
    "domain": "popularity",
    "placement": "product_card",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 49,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "trending_service_proof": {
    "key": "trending_service_proof",
    "family": "trending",
    "blocks": [
      "offer",
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Service tendance",
      "en": "Trending service",
      "ar": "خدمة رائجة"
    },
    "domain": "popularity",
    "placement": "service_card",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 50,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "trust_quality_evidence": {
    "key": "trust_quality_evidence",
    "family": "certificate",
    "blocks": [
      "evidence",
      "scope",
      "action"
    ],
    "title": {
      "fr": "Preuve Trust & Quality",
      "en": "Trust & Quality evidence",
      "ar": "دليل الثقة والجودة"
    },
    "domain": "trust",
    "placement": "trust_panel",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 51,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "campaign_redemption_progress": {
    "key": "campaign_redemption_progress",
    "family": "redemption",
    "blocks": [
      "evidence",
      "action"
    ],
    "title": {
      "fr": "Progression de campagne",
      "en": "Campaign redemption progress",
      "ar": "تقدم الحملة"
    },
    "domain": "campaign",
    "placement": "inline",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 52,
    "requiresOffer": false,
    "requiresPromotion": false
  },
  "customer_specific_privilege": {
    "key": "customer_specific_privilege",
    "family": "personal-privilege",
    "blocks": [
      "evidence",
      "terms",
      "action"
    ],
    "title": {
      "fr": "Privilège personnel",
      "en": "Personal privilege",
      "ar": "امتياز شخصي"
    },
    "domain": "personalization",
    "placement": "price_panel",
    "trigger": "truth_available",
    "parameters": {
      "requires_verified_source": true,
      "stale_suppression": true
    },
    "editorialIndex": 53,
    "requiresOffer": false,
    "requiresPromotion": false
  }
} as const
export type RecipeKey=keyof typeof EXPERIENCE_RECIPES
export function recipeFor(key:string){return EXPERIENCE_RECIPES[key as RecipeKey]||EXPERIENCE_RECIPES.global_announcement}
export const VISUAL_VARIANTS=['split','poster','gallery','editorial','orbit'] as const
export function visualVariant(theme:string){const kind=theme.split('_')[0],index=LIVE_THEMES.filter(t=>t.kind===kind).findIndex(t=>t.key===theme);return VISUAL_VARIANTS[Math.max(0,index)%5]}
const PURPOSE_ROUTES:Record<string,string>={"customer_registration": "auth/register", "login_continuation": "auth/login", "wallet_activation": "account/wallet", "wallet_topup": "account/wallet", "wallet_exclusive_offer": "account/wallet", "basket_recovery": "basket", "checkout_recovery": "basket", "preschool_admissions": "academy", "b2b_consultation": "corporates/request", "partner_os_conversion": "partner-os", "quality_check_diagnostic": "quality-check", "support_recovery": "account/support", "feedback_nps": "account/support", "wallet_benefit_campaign": "account/wallet", "wallet_topup_bonus": "account/wallet", "b2b_campaign": "corporates", "partner_os_campaign": "partner-os", "quality_check_campaign": "quality-check", "support_advisory": "account/support"}
export function seedPreset(preset:LivePreset):Partial<LiveCampaign>{const r=recipeFor(preset.purposeKey);return{campaign_key:`live-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name:preset.name.fr,kind:preset.kind,purpose_key:preset.purposeKey,theme_key:preset.themeKey,status:'draft',priority:100,localized_content:Object.fromEntries(['fr','en','ar'].map(locale=>[locale,{...COMMERCIAL_COPY[preset.purposeKey as keyof typeof COMMERCIAL_COPY][locale as 'fr'|'en'|'ar'],cta_label:locale==='fr'?'Explorer les possibilités':locale==='ar'?'اكتشف الخيارات':'Explore your options',cta_href:`/angelcare-marketplace/${locale}${PURPOSE_ROUTES[preset.purposeKey]?'/'+PURPOSE_ROUTES[preset.purposeKey]:''}`}])) as LiveCampaign['localized_content'],media:{fit:'contain'},placement:{slot:({centered_modal:'modal',top_bar:'above_navigation',sticky_top:'below_navigation',expandable_panel:'before_content',campaign_ribbon:'after_header',critical_panel:'before_content',bottom_bar:'mobile_bottom',inline:'before_content',corner:'floating_side',trust_panel:'before_content'} as Record<string,string>)[r.placement]||r.placement},trigger:{type:r.trigger,...r.parameters},targeting:{...(['wallet_saving_proof','customer_specific_privilege'].includes(preset.purposeKey)?{authenticated:true,wallet_member:true}:{}),locales:['fr','en','ar'],routes:[],audiences:[],devices:[]},frequency:{per_session:1,per_day:2,per_week:4,cooldown_hours:12,dismissal_hours:168,suppress_after_conversion:true},schedule:{timezone:'Africa/Casablanca'},truth_source:{},conversion:{objective:'journey_start',action:r.requiresOffer?'detail':'link',preset_key:preset.key},starts_at:null,ends_at:null,experiment_id:null}}
export function draftExperience(c:LiveCampaign,locale:'fr'|'en'|'ar',tokens:Record<string,string>,extra:Partial<ResolvedLiveExperience>={}):ResolvedLiveExperience{return{id:c.id,campaignKey:c.campaign_key,kind:c.kind,purposeKey:c.purpose_key,themeKey:c.theme_key,content:c.localized_content[locale]||{},media:c.media,tokens,placement:c.placement,trigger:c.trigger,frequency:c.frequency,conversion:c.conversion,truth:null,startsAt:c.starts_at,endsAt:c.ends_at,priority:c.priority,revision:c.version,...extra}}
