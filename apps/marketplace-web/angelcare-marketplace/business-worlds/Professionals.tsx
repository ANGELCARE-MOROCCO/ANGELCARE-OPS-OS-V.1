"use client";
import Link from "next/link";
import { GraduationCap, ArrowUpRight } from "lucide-react";
import { B, WORLDS, tr, w } from "./content";
import { routeFor } from "./contract";
import {
  Brief,
  Closing,
  Dossiers,
  LinkButton,
  Picture,
  Priorities,
  Section,
  Steps,
  Tiles,
  WorldNav,
  useWorld,
} from "./Shared";
import { Explorer } from "./Tools";
import s from "./business.module.css";
export function Professionals() {
  const { locale, native } = useWorld(),
    p = WORLDS.professionals;
  return (
    <>
      <section
        className={s.proHero}
        data-business-module="professional-opening"
      >
        <div className={s.proPortraits}>
          <Picture name="professional" priority />
          <Picture name="preschool" />
          <span>
            {tr(
              w(
                "Pratiquer. Apprendre. Se préparer.",
                "Practise. Learn. Prepare.",
                "ممارسة وتعلم واستعداد.",
              ),
              locale,
            )}
          </span>
        </div>
        <div className={s.proCopy}>
          <span className={s.kicker}>
            <GraduationCap size={18} />
            {tr(p.eyebrow, locale)}
          </span>
          <h1>{native.copy.title || tr(p.title, locale)}</h1>
          <p>{native.copy.lead || tr(p.lead, locale)}</p>
          <div className={s.actions}>
            <LinkButton />
            <LinkButton soft href={routeFor(locale, "academy")}>
              {tr(B.training, locale)}
            </LinkButton>
          </div>
        </div>
      </section>
      <WorldNav
        entries={[
          {
            id: "professional-profile",
            label: w("Votre profil", "Your profile", "ملفكم"),
          },
          {
            id: "professional-practice",
            label: w("La pratique", "Practice", "الممارسة"),
          },
          {
            id: "professional-path",
            label: w("Votre parcours", "Your pathway", "مساركم"),
          },
        ]}
      />
      <Section
        id="professional-profile"
        title={w(
          "Votre point de départ compte.",
          "Your starting point matters.",
          "نقطة البداية مهمة.",
        )}
        lead={w(
          "Explorez une direction ; le parcours retenu précisera ses prérequis et ses modalités.",
          "Explore a direction; the selected pathway will specify its prerequisites and terms.",
          "استكشفوا اتجاهاً ويحدد المسار المختار متطلباته وشروطه.",
        )}
        tone="paper"
      >
        <Explorer
          dimension="professional-direction"
          variant="pathway"
          choices={[
            {
              label: w(
                "Pratiques éducatives",
                "Educational practice",
                "الممارسات التربوية",
              ),
              title: w(
                "Observer, préparer, coopérer.",
                "Observe, prepare, cooperate.",
                "ملاحظة وإعداد وتعاون.",
              ),
              body: w(
                "Comprendre les contextes de l’enfance et les compétences utiles à chaque rôle.",
                "Understand childhood contexts and skills useful for each role.",
                "فهم سياقات الطفولة والكفاءات المفيدة لكل دور.",
              ),
              photo: "preschool",
              facts: [
                w(
                  "Observation et préparation",
                  "Observation and preparation",
                  "الملاحظة والإعداد",
                ),
                w(
                  "Activités adaptées",
                  "Appropriate activities",
                  "أنشطة مناسبة",
                ),
                w(
                  "Coopération professionnelle",
                  "Professional cooperation",
                  "التعاون المهني",
                ),
              ],
            },
            {
              label: w(
                "Accompagnement familial",
                "Family support",
                "دعم الأسرة",
              ),
              title: w(
                "Travailler dans un cadre clair.",
                "Work within a clear framework.",
                "العمل ضمن إطار واضح.",
              ),
              body: w(
                "Organiser les temps, les transmissions et les limites du soutien non médical.",
                "Organise time, handovers and non-medical support boundaries.",
                "تنظيم الأوقات ونقل المعلومات وحدود الدعم غير الطبي.",
              ),
              photo: "care",
              facts: [
                w(
                  "Compréhension du contexte",
                  "Understanding context",
                  "فهم السياق",
                ),
                w("Organisation des temps", "Organising time", "تنظيم الوقت"),
                w(
                  "Transmissions et limites",
                  "Handovers and boundaries",
                  "نقل المعلومات والحدود",
                ),
              ],
            },
            {
              label: w(
                "Animation & activités",
                "Activities & facilitation",
                "الأنشطة والتنشيط",
              ),
              title: w(
                "Donner vie à des activités cohérentes.",
                "Bring coherent activities to life.",
                "إحياء أنشطة متكاملة.",
              ),
              body: w(
                "Préparer objectifs, publics, matériels et coopération dans le cadre concerné.",
                "Prepare objectives, audiences, materials and cooperation in the relevant context.",
                "إعداد الأهداف والفئات والأدوات والتعاون ضمن السياق.",
              ),
              photo: "games",
              facts: [
                w(
                  "Objectifs de l’activité",
                  "Activity objectives",
                  "أهداف النشاط",
                ),
                w("Âges et contexte", "Ages and context", "الأعمار والسياق"),
                w(
                  "Préparation du matériel",
                  "Preparing materials",
                  "إعداد الأدوات",
                ),
              ],
            },
            {
              label: w("Formation", "Learning", "التكوين"),
              title: w(
                "Choisir une prochaine compétence.",
                "Choose a next skill.",
                "اختيار كفاءة للتطوير.",
              ),
              body: w(
                "Les programmes publiés précisent leur contenu et les modalités renseignées.",
                "Published programmes specify their content and provided terms.",
                "توضح البرامج المنشورة المحتويات والشروط المتوفرة.",
              ),
              photo: "academy",
              facts: [
                w(
                  "Objectifs d’apprentissage",
                  "Learning objectives",
                  "الأهداف التعليمية",
                ),
                w(
                  "Prérequis du programme",
                  "Programme prerequisites",
                  "متطلبات البرنامج",
                ),
                w(
                  "Modalités et évaluation",
                  "Delivery and assessment",
                  "الصيغ والتقييم",
                ),
              ],
            },
          ]}
        />
      </Section>
      <Section
        id="professional-practice"
        title={w(
          "La compétence prend vie dans les situations.",
          "Skills come alive in real situations.",
          "تظهر الكفاءة في المواقف العملية.",
        )}
      >
        <div className={s.practiceMosaic}>
          <Picture name="professional" />
          <Tiles
            items={[
              {
                title: w("Préparer", "Prepare", "الإعداد"),
                body: w(
                  "Comprendre le contexte, l’objectif et le matériel avant l’activité.",
                  "Understand context, objective and materials before an activity.",
                  "فهم السياق والهدف والأدوات قبل النشاط.",
                ),
              },
              {
                title: w("Adapter", "Adapt", "التكييف"),
                body: w(
                  "Relier les propositions aux publics et au cadre du rôle.",
                  "Connect proposed activities to audiences and the role’s framework.",
                  "ربط الأنشطة المقترحة بالفئات وإطار الدور.",
                ),
              },
              {
                title: w("Transmettre", "Communicate", "التواصل"),
                body: w(
                  "Partager les informations utiles avec les personnes concernées.",
                  "Share useful information with relevant people.",
                  "مشاركة المعلومات المفيدة مع المعنيين.",
                ),
              },
            ]}
          />
        </div>
      </Section>
      <Section
        id="professional-worlds"
        title={w(
          "Plusieurs univers. Des exigences à comprendre.",
          "Several worlds. Requirements to understand.",
          "عوالم متعددة ومتطلبات للفهم.",
        )}
        tone="violet"
      >
        <Dossiers layout="portfolio" />
      </Section>
      <Section
        id="professional-learning"
        title={w(
          "Faire le lien entre une pratique et un apprentissage.",
          "Connect practice with learning.",
          "ربط الممارسة بالتعلم.",
        )}
        tone="ink"
      >
        <div className={s.split}>
          <Picture name="academy" />
          <div>
            <h3>
              {tr(
                w(
                  "Une progression préparée, pas une promesse automatique.",
                  "Prepared progression, not an automatic promise.",
                  "تطور مُعد دون وعود تلقائية.",
                ),
                locale,
              )}
            </h3>
            <p>
              {tr(
                w(
                  "Explorez les programmes Academy publiés. Les prérequis, évaluations et éventuelles attestations dépendent du programme concerné. Une demande professionnelle prépare votre orientation ; elle ne garantit ni mission ni recrutement.",
                  "Explore published Academy programmes. Prerequisites, assessments and any certificates depend on the programme. A professional enquiry prepares orientation; it guarantees neither assignments nor recruitment.",
                  "استكشفوا برامج الأكاديمية المنشورة. تعتمد المتطلبات والتقييمات وأي شهادات على البرنامج. يهيئ الطلب المهني التوجيه دون ضمان مهام أو توظيف.",
                ),
                locale,
              )}
            </p>
            <LinkButton href={routeFor(locale, "academy")}>
              {tr(B.training, locale)}
            </LinkButton>
          </div>
        </div>
      </Section>
      <Section
        id="professional-path"
        title={w(
          "Quel prochain chapitre voulez-vous préparer ?",
          "Which next chapter would you like to prepare?",
          "أي فصل قادم ترغبون في إعداده؟",
        )}
      >
        <Priorities />
        <Brief />
      </Section>
      <Section
        id="professional-steps"
        title={w(
          "Du premier intérêt à un parcours qualifié.",
          "From initial interest to a qualified pathway.",
          "من الاهتمام الأول إلى مسار محدد.",
        )}
        tone="paper"
      >
        <Steps
          steps={[
            {
              title: w(
                "Explorer les univers",
                "Explore the worlds",
                "استكشاف العوالم",
              ),
              body: w(
                "Identifier les contextes et compétences qui vous intéressent.",
                "Identify contexts and skills that interest you.",
                "تحديد السياقات والكفاءات التي تهمكم.",
              ),
            },
            {
              title: w(
                "Exprimer votre projet",
                "Express your project",
                "التعبير عن المشروع",
              ),
              body: w(
                "Parcours, expérience et besoin de progression.",
                "Pathway, experience and development needs.",
                "المسار والخبرة واحتياجات التطوير.",
              ),
            },
            {
              title: w(
                "Clarifier les exigences",
                "Clarify requirements",
                "توضيح المتطلبات",
              ),
              body: w(
                "Prérequis et modalités du parcours concerné.",
                "Prerequisites and terms for the relevant pathway.",
                "متطلبات وشروط المسار المعني.",
              ),
            },
            {
              title: w(
                "Préparer la suite",
                "Prepare next steps",
                "إعداد الخطوات التالية",
              ),
              body: w(
                "Formation ou orientation selon le périmètre retenu.",
                "Learning or orientation according to selected scope.",
                "التكوين أو التوجيه حسب النطاق المختار.",
              ),
            },
          ]}
        />
        <div className={s.memberEntry}>
          <span>
            {tr(
              w(
                "Vous avez déjà un accès professionnel ?",
                "Already have professional access?",
                "هل لديكم ولوج مهني؟",
              ),
              locale,
            )}
          </span>
          <Link href="/angelcare-marketplace/provider">
            {tr(B.member, locale)}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </Section>
      <Closing />
    </>
  );
}
