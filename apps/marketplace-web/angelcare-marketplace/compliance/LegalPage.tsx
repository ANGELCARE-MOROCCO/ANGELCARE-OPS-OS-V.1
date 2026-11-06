import Link from 'next/link';
import type { Metadata } from 'next';
import { GlobalPublicShell } from '../public-universe/components/GlobalPublicShell';
import { PublicPageRenderer } from '../public-universe/components/PublicPageRenderer';
import { LEGAL_ROUTE_REVISION, legalPath, type LegalKind, type LegalLocale } from './legal-policy';
import { resolvePublishedLegal } from './legal-repository';
import s from './legal.module.css';

const COPY = {
  fr: { terms: 'Conditions d’utilisation', privacy: 'Politique de confidentialité', unavailable: 'Document temporairement indisponible', missing: 'Document officiel indisponible', error: 'Le document publié ne peut pas être chargé pour le moment. Contactez notre équipe pour obtenir la version applicable.', absent: 'Aucun document officiel publié n’est accessible à cette adresse pour le moment. Contactez notre équipe pour obtenir la version applicable.', contact: 'Contacter AngelCare', home: 'Retour au Marketplace', fallback: 'La version officielle publiée en français est affichée ci-dessous.' },
  en: { terms: 'Terms of use', privacy: 'Privacy policy', unavailable: 'Document temporarily unavailable', missing: 'Official document unavailable', error: 'The published document cannot be loaded at the moment. Contact our team to obtain the applicable version.', absent: 'No officially published document is accessible at this address at the moment. Contact our team to obtain the applicable version.', contact: 'Contact AngelCare', home: 'Back to Marketplace', fallback: 'The official published French version is displayed below.' },
  ar: { terms: 'شروط الاستخدام', privacy: 'سياسة الخصوصية', unavailable: 'الوثيقة غير متاحة مؤقتاً', missing: 'الوثيقة الرسمية غير متاحة', error: 'يتعذر تحميل الوثيقة المنشورة حالياً. يرجى التواصل مع فريقنا للحصول على النسخة المعمول بها.', absent: 'لا توجد وثيقة رسمية منشورة متاحة على هذا العنوان حالياً. يرجى التواصل مع فريقنا للحصول على النسخة المعمول بها.', contact: 'التواصل مع أنجل كير', home: 'العودة إلى السوق', fallback: 'تُعرض أدناه النسخة الرسمية المنشورة باللغة الفرنسية.' },
};
export async function legalMetadata(kind: LegalKind, locale: LegalLocale): Promise<Metadata> {
  const result = await resolvePublishedLegal(kind, locale), copy = COPY[locale];
  return { title: result.status === 'published' ? result.experience.page.seo_title || result.experience.page.title : `${copy[kind]} · ANGELCARE`, alternates: { canonical: legalPath(locale, kind) }, ...(result.status !== 'published' ? { robots: { index: false, follow: true } } : {}) };
}
export async function AngelCareLegalPage({ kind, locale }: { kind: LegalKind; locale: LegalLocale }) {
  const result = await resolvePublishedLegal(kind, locale), copy = COPY[locale];
  return <GlobalPublicShell locale={locale} navigation={result.status === 'published' ? result.experience.navigation : []} variant="marketplace" contentElement="div">
    <main data-ac-legal-revision={LEGAL_ROUTE_REVISION} data-ac-legal-kind={kind} data-ac-legal-state={result.status} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {result.status === 'published' ? <>
        {result.sourceLocale !== locale ? <aside className={s.translation} role="note">{copy.fallback}</aside> : null}
        <div lang={result.sourceLocale}><PublicPageRenderer experience={result.experience} locale={result.sourceLocale} /></div>
      </> : <article className={s.notice}>
        <span className={s.eyebrow}>ANGELCARE MARKETPLACE</span><h1>{copy[kind]}</h1>
        <section className={s.panel} role="status"><span className={s.mark} aria-hidden="true">i</span><h2>{result.status === 'missing' ? copy.missing : copy.unavailable}</h2><p>{result.status === 'missing' ? copy.absent : copy.error}</p></section>
        <nav aria-label={copy[kind]}><Link className={s.primary} href={`/angelcare-marketplace/${locale}/contact`}>{copy.contact}<span aria-hidden="true">↗</span></Link><Link href={`/angelcare-marketplace/${locale}`}>{copy.home}</Link></nav>
      </article>}
    </main>
  </GlobalPublicShell>;
}
