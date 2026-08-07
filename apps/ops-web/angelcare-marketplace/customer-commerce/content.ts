import type { CatalogLocale } from '../catalog-discovery/types'
import type { PaymentMethodKind, WalletBucketKind } from './types'

export const AC_WALLET_FEATURES = [
  'Free customer top-up','Configurable minimum top-up','Configurable maximum top-up','Preset top-up amounts',
  'Custom top-up amount','Promotional top-up bonuses','Progressive top-up bonus tiers','First-top-up reward',
  'Seasonal top-up reward','Auto-top-up','Low-balance auto-top-up','Scheduled monthly top-up',
  'Top-up payment history','Top-up failure recovery','Purchased-credit separation','Promotional-credit separation',
  'Credit expiration management','Expiration reminders','Wallet payment at checkout','Wallet plus another method',
  'Wallet reservation during checkout','Automatic reservation release','Wallet-specific discounts','Wallet-specific fixed prices',
  'Wallet-exclusive offers','Wallet-exclusive products or services','Wallet priority booking','Wallet priority waitlist',
  'Wallet priority customer support','Wallet free-delivery rules','Wallet waived booking fee','Wallet waived cancellation fee under policy',
  'Wallet bonus-service add-ons','Wallet early-access campaigns','Wallet-only bundles','Customer-specific wallet policies',
  'Group or segment policies','B2C/B2B wallet segmentation','Territory-based policies','Category and subcategory policies',
  'Product/service-specific policies','Time- and date-based policies','Seasonal campaign scheduling','Multiple simultaneous policy evaluation',
  'Policy priority and conflict resolution','Live normal-versus-wallet comparison','Lifetime wallet savings','Wallet activity and statement export',
  'Administrative balance adjustment with audit','Wallet risk, freeze and recovery controls','Premium membership tiers',
  'Wallet contribution allocation','Original-source refund routing','Policy simulation parity','Campaign budget guardrails',
  'Margin floor protection','Customer-group CSV assignment','Expiration reversal','Chargeback freeze and recovery',
] as const

export const PAYMENT_METHOD_COPY: Record<PaymentMethodKind, Record<CatalogLocale, { label: string; description: string }>> = {
  ac_wallet: { fr: { label: 'AC Privilege Wallet', description: 'Utilisez vos crédits AC et profitez des avantages éligibles.' }, en: { label: 'AC Privilege Wallet', description: 'Use AC credits and eligible privileges.' }, ar: { label: 'محفظة AC المميزة', description: 'استخدم أرصدة AC والمزايا المؤهلة.' } },
  card: { fr: { label: 'Carte de paiement', description: 'Paiement sécurisé via le prestataire activé.' }, en: { label: 'Payment card', description: 'Secure payment through the activated provider.' }, ar: { label: 'بطاقة الدفع', description: 'دفع آمن عبر المزود المفعل.' } },
  bank_transfer: { fr: { label: 'Virement bancaire', description: 'Référence et preuve de virement avec validation Finance.' }, en: { label: 'Bank transfer', description: 'Transfer reference and evidence with Finance validation.' }, ar: { label: 'تحويل بنكي', description: 'مرجع وإثبات التحويل مع تحقق المالية.' } },
  cash_on_delivery: { fr: { label: 'Paiement à la livraison', description: 'Disponible uniquement pour les offres et territoires autorisés.' }, en: { label: 'Cash on delivery', description: 'Available only for authorized offers and territories.' }, ar: { label: 'الدفع عند الاستلام', description: 'متاح فقط للعروض والمناطق المصرح بها.' } },
  pay_at_location: { fr: { label: 'Paiement sur site', description: 'Paiement au lieu de service lorsque la politique le permet.' }, en: { label: 'Pay at location', description: 'Pay at the service location when policy allows.' }, ar: { label: 'الدفع في الموقع', description: 'الدفع في موقع الخدمة عندما تسمح السياسة.' } },
  invoice: { fr: { label: 'Paiement sur facture', description: 'Réservé aux comptes organisationnels éligibles.' }, en: { label: 'Invoice payment', description: 'Reserved for eligible organization accounts.' }, ar: { label: 'الدفع بالفاتورة', description: 'مخصص لحسابات المؤسسات المؤهلة.' } },
  deposit: { fr: { label: 'Acompte', description: 'Payez la part exigible maintenant, le solde selon l’échéancier.' }, en: { label: 'Deposit', description: 'Pay the required part now and the balance later.' }, ar: { label: 'دفعة مقدمة', description: 'ادفع الجزء المستحق الآن والرصيد لاحقاً.' } },
  installment: { fr: { label: 'Échéancier', description: 'Plan de paiement configuré pour cette offre.' }, en: { label: 'Installments', description: 'Payment plan configured for this offer.' }, ar: { label: 'أقساط', description: 'خطة دفع مهيأة لهذا العرض.' } },
  corporate_allowance: { fr: { label: 'Allocation entreprise', description: 'Utilisez le bénéfice employeur disponible.' }, en: { label: 'Corporate allowance', description: 'Use the available employer benefit.' }, ar: { label: 'مخصصات الشركة', description: 'استخدم منفعة صاحب العمل المتاحة.' } },
  voucher: { fr: { label: 'Bon ou crédit promotionnel', description: 'Appliquez un bon gouverné et encore valide.' }, en: { label: 'Voucher or promotional credit', description: 'Apply a governed, valid voucher.' }, ar: { label: 'قسيمة أو رصيد ترويجي', description: 'استخدم قسيمة صالحة وخاضعة للحوكمة.' } },
  manual_verified: { fr: { label: 'Paiement vérifié manuellement', description: 'Enregistrement réservé à Finance avec preuve.' }, en: { label: 'Manually verified payment', description: 'Finance-only record with evidence.' }, ar: { label: 'دفع متحقق منه يدوياً', description: 'تسجيل خاص بالمالية مع إثبات.' } },
}

export const WALLET_BUCKET_COPY: Record<WalletBucketKind, Record<CatalogLocale, string>> = {
  purchased: { fr: 'Crédits achetés', en: 'Purchased credits', ar: 'أرصدة مشتراة' },
  promotional: { fr: 'Crédits bonus', en: 'Bonus credits', ar: 'أرصدة إضافية' },
  goodwill: { fr: 'Crédits de récupération', en: 'Recovery credits', ar: 'أرصدة تعويضية' },
  refund: { fr: 'Crédits remboursés', en: 'Refund credits', ar: 'أرصدة مستردة' },
  employer: { fr: 'Crédits employeur', en: 'Employer credits', ar: 'أرصدة صاحب العمل' },
  gift: { fr: 'Crédits cadeau', en: 'Gift credits', ar: 'أرصدة هدية' },
  reserved: { fr: 'Crédits réservés', en: 'Reserved credits', ar: 'أرصدة محجوزة' },
  pending: { fr: 'Crédits en attente', en: 'Pending credits', ar: 'أرصدة معلقة' },
  expiring: { fr: 'Crédits bientôt expirés', en: 'Expiring credits', ar: 'أرصدة ستنتهي قريباً' },
  expired: { fr: 'Crédits expirés', en: 'Expired credits', ar: 'أرصدة منتهية' },
  frozen: { fr: 'Crédits gelés', en: 'Frozen credits', ar: 'أرصدة مجمدة' },
  disputed: { fr: 'Crédits contestés', en: 'Disputed credits', ar: 'أرصدة متنازع عليها' },
}

export function customerCopy(locale: CatalogLocale) {
  const all = {
    fr: { wallet: 'AC Privilege Wallet', topUp: 'Recharger', transactions: 'Transactions', privileges: 'Privilèges', security: 'Sécurité', standard: 'Paiement standard', walletPrice: 'Avec AC Wallet', save: 'Vous économisez', orders: 'Commandes', bookings: 'Réservations', enrollments: 'Inscriptions', quotations: 'Devis', subscriptions: 'Abonnements', assessments: 'Évaluations' },
    en: { wallet: 'AC Privilege Wallet', topUp: 'Top up', transactions: 'Transactions', privileges: 'Privileges', security: 'Security', standard: 'Standard payment', walletPrice: 'With AC Wallet', save: 'You save', orders: 'Orders', bookings: 'Bookings', enrollments: 'Enrollments', quotations: 'Quotes', subscriptions: 'Subscriptions', assessments: 'Assessments' },
    ar: { wallet: 'محفظة AC المميزة', topUp: 'شحن الرصيد', transactions: 'المعاملات', privileges: 'الامتيازات', security: 'الأمان', standard: 'الدفع العادي', walletPrice: 'باستخدام محفظة AC', save: 'توفّر', orders: 'الطلبات', bookings: 'الحجوزات', enrollments: 'التسجيلات', quotations: 'عروض الأسعار', subscriptions: 'الاشتراكات', assessments: 'التقييمات' },
  }
  return all[locale]
}
