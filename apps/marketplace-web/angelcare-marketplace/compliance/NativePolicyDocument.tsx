import Link from "next/link";
import type { LegalKind, LegalLocale } from "./legal-policy";
import { legalPath } from "./legal-policy";
import { webPolicy, WEB_POLICY_VERSION } from "./web-policy";
import s from "./legal.module.css";
const COPY = {
  fr: {
    guide: "Informations et confiance",
    contents: "Sur cette page",
    contact: "Contacter notre équipe",
    home: "Retour au Marketplace",
    version: "Version",
    question: "Une question sur votre dossier ?",
    help: "Précisez votre référence et le sujet de votre demande. Ne joignez pas de document sensible à un message public.",
    related: "Informations associées",
    terms: "Conditions",
    privacy: "Confidentialité",
    cookies: "Cookies",
    rights: "Consulter les droits présentés par la CNDP",
    sourceIssue:
      "La version personnalisée ne peut pas être vérifiée pour le moment. Les informations générales ci-dessous restent consultables. Pour obtenir le document applicable à votre dossier, contactez notre équipe.",
    languages: "Langues disponibles",
  },
  en: {
    guide: "Information and trust",
    contents: "On this page",
    contact: "Contact our team",
    home: "Back to Marketplace",
    version: "Version",
    question: "A question about your record?",
    help: "Include your reference and the subject of your request. Do not attach sensitive documents to a public message.",
    related: "Related information",
    terms: "Terms",
    privacy: "Privacy",
    cookies: "Cookies",
    rights: "Read the rights explained by the CNDP",
    sourceIssue:
      "The customised version cannot be verified at the moment. The general information below remains available. Contact our team for the document applicable to your record.",
    languages: "Available languages",
  },
  ar: {
    guide: "المعلومات والثقة",
    contents: "في هذه الصفحة",
    contact: "تواصل مع فريقنا",
    home: "العودة إلى السوق",
    version: "النسخة",
    question: "هل لديك سؤال عن ملفك؟",
    help: "اذكر المرجع وموضوع الطلب. لا ترفق وثيقة حساسة برسالة عامة.",
    related: "معلومات مرتبطة",
    terms: "الشروط",
    privacy: "الخصوصية",
    cookies: "ملفات الارتباط",
    rights: "اطلع على الحقوق التي توضحها اللجنة الوطنية",
    sourceIssue:
      "يتعذر التحقق من النسخة المخصصة حالياً. تبقى المعلومات العامة أدناه متاحة. تواصل مع الفريق للحصول على الوثيقة المطبقة على ملفك.",
    languages: "اللغات المتاحة",
  },
} as const;
export function NativePolicyDocument({
  kind,
  locale,
  sourceIssue = false,
}: {
  kind: LegalKind;
  locale: LegalLocale;
  sourceIssue?: boolean;
}) {
  const doc = webPolicy(kind, locale),
    c = COPY[locale];
  return (
    <article
      className={s.document}
      lang={locale}
      data-ac-policy-source="native-web"
      data-ac-policy-version={WEB_POLICY_VERSION}
    >
      <header className={s.hero}>
        <span className={s.eyebrow}>ANGELCARE MARKETPLACE · {c.guide}</span>
        <h1>{doc.title}</h1>
        <p className={s.lead}>{doc.lead}</p>
        <div className={s.meta}>
          <span>
            {c.version} {WEB_POLICY_VERSION}
          </span>
          <nav aria-label={c.languages}>
            {(["fr", "en", "ar"] as const).map((code) => (
              <Link
                key={code}
                href={legalPath(code, kind)}
                hrefLang={code}
                lang={code}
                aria-current={code === locale ? "page" : undefined}
              >
                {code.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <nav className={s.related} aria-label={c.related}>
        {(["terms", "privacy", "cookies"] as const).map((k) => (
          <Link
            href={legalPath(locale, k)}
            key={k}
            aria-current={k === kind ? "page" : undefined}
          >
            {c[k]}
          </Link>
        ))}
      </nav>
      {sourceIssue && (
        <aside className={s.translation} role="status">
          {c.sourceIssue}{" "}
          <Link href={`/angelcare-marketplace/${locale}/contact`}>
            {c.contact}
          </Link>
        </aside>
      )}
      <nav className={s.contents} aria-label={c.contents}>
        <strong>{c.contents}</strong>
        <div>
          {doc.sections.map((section, i) => (
            <a key={section.id} href={"#" + section.id}>
              {String(i + 1).padStart(2, "0")} · {section.title}
            </a>
          ))}
        </div>
      </nav>
      <div className={s.sections}>
        {doc.sections.map((section, i) => (
          <section key={section.id} id={section.id} className={s.policySection}>
            <span className={s.number} aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2>{section.title}</h2>
              {section.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {kind === "privacy" && i === 9 && (
                <a
                  className={s.referenceLink}
                  href="https://www.cndp.ma/vos-droits-en-matiere-de-protection-des-donnees-a-caractere-personnel/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {c.rights} ↗
                </a>
              )}
            </div>
          </section>
        ))}
      </div>
      <section className={s.contactPanel}>
        <div>
          <h2>{c.question}</h2>
          <p>{c.help}</p>
        </div>
        <Link
          className={s.primary}
          href={`/angelcare-marketplace/${locale}/contact`}
        >
          {c.contact} ↗
        </Link>
      </section>
      <Link className={s.homeLink} href={`/angelcare-marketplace/${locale}`}>
        {c.home} →
      </Link>
    </article>
  );
}
