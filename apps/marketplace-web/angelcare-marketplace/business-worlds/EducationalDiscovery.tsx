"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Lightbulb, BookOpen } from "lucide-react";
import type { CatalogLocale } from "../catalog-discovery/types";
import { tr, w } from "./content";
import { storefrontPhoto } from "../storefront-immersive/editorial-media";
import { routeFor } from "./contract";
import s from "./education.module.css";
export function EducationalDiscovery({
  world,
  locale,
}: {
  world: "development" | "kits" | "academy";
  locale: CatalogLocale;
}) {
  const [active, setActive] = useState(0),
    [checked, setChecked] = useState<number[]>([]);
  const title =
    world === "development"
      ? w(
          "Avant le choix, comprendre l’expérience.",
          "Understand the experience before choosing.",
          "فهم التجربة قبل الاختيار.",
        )
      : world === "kits"
        ? w(
            "Un kit n’est que le début de l’expérience.",
            "A kit is only the beginning of the experience.",
            "المجموعة بداية التجربة فقط.",
          )
        : w(
            "Une formation commence par votre objectif.",
            "Learning starts with your objective.",
            "يبدأ التكوين بهدفكم.",
          );
  const topics =
    world === "development"
      ? [
          {
            label: w("Explorer", "Explore", "استكشاف"),
            title: w(
              "Observer les intérêts. Ouvrir des possibilités.",
              "Observe interests. Open possibilities.",
              "ملاحظة الاهتمامات وفتح الإمكانيات.",
            ),
            body: w(
              "Partez du contexte et des centres d’intérêt pour comprendre l’activité proposée. Les âges, objectifs et modalités renseignés se consultent sur la fiche correspondante.",
              "Start with context and interests to understand the proposed activity. Provided ages, objectives and terms are available on its detail page.",
              "انطلقوا من السياق والاهتمامات لفهم النشاط. تجدون الأعمار والأهداف والشروط المتوفرة في صفحته.",
            ),
            image: "montessori",
          },
          {
            label: w("Accompagner", "Support", "المرافقة"),
            title: w(
              "La présence de l’adulte fait partie du contexte.",
              "Adult presence is part of the context.",
              "حضور البالغ جزء من السياق.",
            ),
            body: w(
              "Préparez le temps, l’espace et les supports. Adaptez l’expérience au cadre décrit plutôt que de promettre un résultat identique pour chaque enfant.",
              "Prepare time, space and materials. Adapt the experience to its described framework rather than expecting the same result for every child.",
              "أعدوا الوقت والمساحة والأدوات وكيفوا التجربة وفق إطارها دون توقع نتيجة واحدة لكل طفل.",
            ),
            image: "family",
          },
          {
            label: w("Varier", "Vary", "التنويع"),
            title: w(
              "Changer le support, garder un objectif clair.",
              "Change the medium, keep the objective clear.",
              "تنويع الأداة مع هدف واضح.",
            ),
            body: w(
              "Activité, matériel ou kit : comparez le format et les informations réelles de chaque proposition avant de choisir.",
              "Activity, material or kit: compare each option’s format and actual information before choosing.",
              "نشاط أو أدوات أو مجموعة: قارنوا الصيغة والمعلومات الفعلية قبل الاختيار.",
            ),
            image: "flashcards",
          },
        ]
      : world === "kits"
        ? [
            {
              label: w("Choisir", "Choose", "اختيار"),
              title: w(
                "Le bon point de départ : l’usage.",
                "The right starting point: how it will be used.",
                "البداية الصحيحة هي الاستخدام.",
              ),
              body: w(
                "Identifiez le contexte, l’âge renseigné et les contenus indiqués sur la fiche. Un nom de kit ne suffit pas à définir son adéquation.",
                "Identify context, provided age guidance and contents on the detail page. A kit name alone does not establish suitability.",
                "حددوا السياق والأعمار والمحتويات في صفحة العرض؛ الاسم وحده لا يحدد الملاءمة.",
              ),
              image: "kits",
            },
            {
              label: w("Préparer", "Prepare", "الإعداد"),
              title: w(
                "Créer les conditions d’une belle séance.",
                "Create the conditions for a good session.",
                "تهيئة شروط جلسة جميلة.",
              ),
              body: w(
                "Consultez les éléments inclus, les consignes disponibles et les conditions d’utilisation. Préparez l’espace et la présence d’un adulte lorsque le cadre le prévoit.",
                "Review included elements, available instructions and use conditions. Prepare space and adult presence where required by the framework.",
                "راجعوا العناصر المشمولة والتعليمات وشروط الاستخدام وأعدوا المساحة وحضور البالغ حيث يلزم.",
              ),
              image: "montessori",
            },
            {
              label: w("Rejouer", "Use again", "إعادة الاستخدام"),
              title: w(
                "Approfondir à partir du contenu réel.",
                "Go deeper using the actual contents.",
                "التعمق انطلاقاً من المحتويات الفعلية.",
              ),
              body: w(
                "Les variations possibles dépendent du matériel et du guide fourni. Explorez les activités liées lorsqu’elles sont publiées.",
                "Possible variations depend on materials and the provided guide. Explore related activities when published.",
                "تعتمد التنويعات على الأدوات والدليل؛ استكشفوا الأنشطة المرتبطة حين تُنشر.",
              ),
              image: "games",
            },
          ]
        : [
            {
              label: w("Objectif", "Objective", "الهدف"),
              title: w(
                "Quelle compétence souhaitez-vous développer ?",
                "Which skill would you like to develop?",
                "أي كفاءة ترغبون في تطويرها؟",
              ),
              body: w(
                "Reliez votre objectif aux contenus et aux publics du programme publié. Les prérequis doivent être consultés avant l’inscription.",
                "Connect your objective to the published programme’s content and audiences. Review prerequisites before enrolment.",
                "اربطوا الهدف بمحتويات وفئات البرنامج وراجعوا المتطلبات قبل التسجيل.",
              ),
              image: "academy",
            },
            {
              label: w("Modalités", "Delivery", "الصيغ"),
              title: w(
                "Un format compatible avec votre contexte.",
                "A format that fits your context.",
                "صيغة تناسب السياق.",
              ),
              body: w(
                "Vérifiez les modalités, la durée et les informations disponibles sur le programme. Une information absente doit être clarifiée dans le parcours de demande.",
                "Check delivery, duration and available programme information. Missing information should be clarified through the enquiry journey.",
                "تحققوا من الصيغة والمدة والمعلومات؛ يُوضح ما ينقص عبر الطلب.",
              ),
              image: "desk",
            },
            {
              label: w("Progression", "Progression", "التطور"),
              title: w(
                "Comprendre ce qui est évalué.",
                "Understand what is assessed.",
                "فهم ما يتم تقييمه.",
              ),
              body: w(
                "Les évaluations, attestations et conditions de réussite dépendent du programme. Aucun badge général ne remplace ces modalités.",
                "Assessments, certificates and completion conditions depend on the programme. A general badge cannot replace these terms.",
                "تعتمد التقييمات والشهادات وشروط النجاح على البرنامج ولا تعوضها شارة عامة.",
              ),
              image: "professional",
            },
          ];
  const checklist = [
    w("Objectif identifié", "Objective identified", "الهدف محدد"),
    w(
      "Public et contexte précisés",
      "Audience and context specified",
      "الفئات والسياق محددان",
    ),
    w("Modalités à consulter", "Terms to review", "شروط للمراجعة"),
  ];
  return (
    <section
      className={`${s.education} ${s[world]}`}
      data-consumer-education={world}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <header>
        <span>
          <Lightbulb size={17} />
          {tr(
            w(
              "COMPRENDRE · CHOISIR · SE PRÉPARER",
              "UNDERSTAND · CHOOSE · PREPARE",
              "فهم واختيار واستعداد",
            ),
            locale,
          )}
        </span>
        <h2>{tr(title, locale)}</h2>
      </header>
      <div className={s.learningBody}>
        <div
          className={s.learningTabs}
          role="group"
          aria-label={tr(title, locale)}
        >
          {topics.map((t, i) => (
            <button
              type="button"
              key={t.label.en}
              aria-pressed={active === i}
              onClick={() => setActive(i)}
            >
              <span>0{i + 1}</span>
              {tr(t.label, locale)}
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
        <div className={s.learningPanel}>
          <img src={storefrontPhoto(world, topics[active].image)} alt="" loading="lazy" />
          <div>
            <BookOpen size={25} />
            <h3>{tr(topics[active].title, locale)}</h3>
            <p>{tr(topics[active].body, locale)}</p>
            <Link href="#sf-catalogue">
              {tr(
                w(
                  "Explorer les propositions publiées",
                  "Explore published options",
                  "استكشاف الخيارات المنشورة",
                ),
                locale,
              )}
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </div>
      {world === "academy" ? (
        <div className={s.learningChecklist}>
          {checklist.map((label, i) => (
            <label key={label.en}>
              <input
                type="checkbox"
                checked={checked.includes(i)}
                onChange={() =>
                  setChecked((previous) =>
                    previous.includes(i)
                      ? previous.filter((n) => n !== i)
                      : [...previous, i],
                  )
                }
              />
              <span>{tr(label, locale)}</span>
              {checked.includes(i) ? <Check size={16} /> : null}
            </label>
          ))}
          <Link href={routeFor(locale, "academy/request")}>
            {tr(
              w("Clarifier mon parcours", "Clarify my pathway", "توضيح مساري"),
              locale,
            )}
            <ArrowUpRight size={17} />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
