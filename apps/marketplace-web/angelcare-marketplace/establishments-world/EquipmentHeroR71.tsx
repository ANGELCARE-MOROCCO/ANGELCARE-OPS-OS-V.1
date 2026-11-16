"use client";

import { ArrowDown, ArrowRight, Award, Layers3, Leaf } from "lucide-react";
import { CampaignImage } from "./CommercialJourney";
import styles from "./EquipmentHeroR71.module.css";

type Locale = "fr" | "en" | "ar";

type HeroCopy = {
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  lead: string;
  project: string;
  explore: string;
  benefits: readonly [string, string, string];
  imageAlt: string;
};

const COPY: Record<Locale, HeroCopy> = {
  fr: {
    eyebrow: "ACCÈS, LA GAMME ANGELCARE ÉCOLE",
    headline: "Votre établissement parle avant même que vous preniez la",
    headlineAccent: "parole.",
    lead: "Reliez vos espaces, vos supports et vos pratiques dans un même projet.",
    project: "Construire mon projet",
    explore: "Explorer les solutions",
    benefits: [
      "Qualité professionnelle",
      "Solutions complètes",
      "Pensé pour la petite enfance",
    ],
    imageAlt: "Équipements pédagogiques, jeux d'apprentissage et supports de classe AngelCare, mis en scène dans un environnement préscolaire lumineux",
  },
  en: {
    eyebrow: "DISCOVER THE ANGELCARE SCHOOL COLLECTION",
    headline: "Your establishment speaks before you even say a",
    headlineAccent: "word.",
    lead: "Bring your learning spaces, resources and everyday practices together in one project.",
    project: "Build my project",
    explore: "Explore solutions",
    benefits: [
      "Professional quality",
      "Complete solutions",
      "Designed for early learning",
    ],
    imageAlt: "AngelCare preschool learning equipment, classroom resources and colorful educational materials",
  },
  ar: {
    eyebrow: "اكتشف مجموعة أنجل كير للمؤسسات التعليمية",
    headline: "مؤسستكم تتحدث عنكم قبل أن تنطقوا",
    headlineAccent: "بكلمة.",
    lead: "اجمعوا فضاءات التعلم والوسائل والممارسات اليومية في مشروع متكامل.",
    project: "أنشئ مشروعي",
    explore: "استكشف الحلول",
    benefits: [
      "جودة مهنية",
      "حلول متكاملة",
      "مصممة للطفولة المبكرة",
    ],
    imageAlt: "وسائل تعليمية وتجهيزات لرياض الأطفال ضمن بيئة صفية مشرقة وملونة من أنجل كير",
  },
};

/**
 * R7.1 approved equipment hero only.
 * This component intentionally has no catalogue, project state, or submission logic.
 * Both CTAs delegate to the established native Établissements journey.
 */
export function EquipmentHeroR71({
  locale,
  onBuildProject,
  onExplore,
}: {
  locale: Locale;
  onBuildProject: () => void;
  onExplore: () => void;
}) {
  const copy = COPY[locale];
  return (
    <section
      className={styles.hero}
      data-establishments-hero
      data-equipment-hero-version="r7.1"
      aria-label={copy.headline + " " + copy.headlineAccent}
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.visual}>
        <CampaignImage
          name="products-hero-r71"
          alt={copy.imageAlt}
          className={styles.photo}
          hero
        />
      </div>
      <div className={styles.copy}>
        <div className={styles.copyInner}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowSparkle} aria-hidden="true">✦</span>
            {copy.eyebrow}
          </span>
          <h1 tabIndex={-1} className={styles.headline}>
            {copy.headline}{" "}
            <span className={styles.headlineAccent}>{copy.headlineAccent}</span>
          </h1>
          <p className={styles.lead}>{copy.lead}</p>
          <div className={styles.actions}>
            <button type="button" className={styles.projectButton} onClick={onBuildProject}>
              {copy.project}<ArrowRight size={17} aria-hidden="true" />
            </button>
            <button type="button" className={styles.exploreButton} onClick={onExplore}>
              {copy.explore}<ArrowDown size={16} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.benefits} aria-label={locale === "fr" ? "Nos engagements" : undefined}>
            <span><Award size={23} strokeWidth={1.9} aria-hidden="true" /><strong>{copy.benefits[0]}</strong></span>
            <span><Layers3 size={23} strokeWidth={1.9} aria-hidden="true" /><strong>{copy.benefits[1]}</strong></span>
            <span><Leaf size={23} strokeWidth={1.9} aria-hidden="true" /><strong>{copy.benefits[2]}</strong></span>
          </div>
        </div>
      </div>
    </section>
  );
}
