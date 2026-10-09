"use client";
import Link from "next/link";
import { Building2, ArrowUpRight } from "lucide-react";
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
export function Establishments() {
  const { locale, native } = useWorld(),
    p = WORLDS.establishments;
  return (
    <>
      <section className={s.campusHero} data-business-module="campus-opening">
        <div className={s.campusTitle}>
          <span className={s.kicker}>
            <Building2 size={17} />
            {tr(p.eyebrow, locale)}
          </span>
          <h1>{native.copy.title || tr(p.title, locale)}</h1>
          <p>{native.copy.lead || tr(p.lead, locale)}</p>
          <div className={s.actions}>
            <LinkButton />
            <LinkButton soft href="#campus-dimensions">
              {tr(B.explain, locale)}
            </LinkButton>
          </div>
        </div>
        <div className={s.campusPanorama}>
          <Picture name="school" priority />
          <div className={s.campusBadge}>
            {tr(
              w(
                "Espaces · Équipes · Parents · Organisation",
                "Spaces · Teams · Parents · Organisation",
                "المساحات · الفرق · الأسر · التنظيم",
              ),
              locale,
            )}
          </div>
        </div>
      </section>
      <WorldNav
        entries={[
          {
            id: "campus-context",
            label: w("Votre contexte", "Your context", "السياق"),
          },
          {
            id: "campus-dimensions",
            label: w("Dimensions", "Dimensions", "الأبعاد"),
          },
          {
            id: "campus-ecosystem",
            label: w("Écosystème", "Ecosystem", "المنظومة"),
          },
        ]}
      />
      <Section
        id="campus-context"
        title={w(
          "Un établissement a plusieurs réalités.",
          "An establishment has several realities.",
          "للمؤسسة عدة واقعيات.",
        )}
        tone="paper"
      >
        <Explorer
          dimension="institution-context"
          choices={[
            {
              label: w(
                "Crèche & petite enfance",
                "Nursery & early years",
                "الحضانة والطفولة المبكرة",
              ),
              title: w(
                "Les premiers repères comptent.",
                "Early foundations matter.",
                "الأسس الأولى مهمة.",
              ),
              body: w(
                "Les espaces, les interactions et la relation aux parents dessinent l’expérience des jeunes enfants.",
                "Spaces, interactions and relationships with parents shape young children’s experience.",
                "تشكل المساحات والتفاعلات والعلاقة مع الوالدين تجربة الأطفال.",
              ),
              photo: "preschool",
              facts: [
                w(
                  "Rythmes et environnement",
                  "Rhythms and environment",
                  "الإيقاع والبيئة",
                ),
                w(
                  "Pratiques et équipe",
                  "Practice and team",
                  "الممارسات والفريق",
                ),
                w(
                  "Transmission aux familles",
                  "Communication with families",
                  "التواصل مع الأسر",
                ),
              ],
            },
            {
              label: w(
                "École & parcours éducatif",
                "School & educational journey",
                "المدرسة والمسار التربوي",
              ),
              title: w(
                "Relier les expériences autour de l’enfant.",
                "Connect experiences around the child.",
                "ربط التجارب حول الطفل.",
              ),
              body: w(
                "Activités, coopération et organisation contribuent à un cadre éducatif lisible.",
                "Activities, cooperation and organisation contribute to a clear educational framework.",
                "تساهم الأنشطة والتعاون والتنظيم في إطار تربوي واضح.",
              ),
              photo: "school",
              facts: [
                w(
                  "Cadre pédagogique",
                  "Educational framework",
                  "الإطار التربوي",
                ),
                w(
                  "Échanges avec les parents",
                  "Parent communication",
                  "التواصل مع الوالدين",
                ),
                w(
                  "Progression des pratiques",
                  "Developing practice",
                  "تطوير الممارسات",
                ),
              ],
            },
          ]}
        />
      </Section>
      <Section
        id="campus-dimensions"
        kicker={w(
          "EXPLORER LE CAMPUS",
          "EXPLORE THE CAMPUS",
          "استكشاف المؤسسة",
        )}
        title={w(
          "Regarder l’ensemble. Choisir où commencer.",
          "See the whole. Choose where to begin.",
          "رؤية الكل واختيار البداية.",
        )}
        lead={w(
          "Chaque dimension apporte des questions utiles au diagnostic. Cet explorateur prépare une discussion et ne délivre aucun score.",
          "Each dimension brings useful questions to the diagnostic. This explorer prepares a discussion and provides no score.",
          "يقدم كل بُعد أسئلة مفيدة للتشخيص التنظيمي دون منح أي درجة.",
        )}
      >
        <Explorer
          dimension="campus-dimension"
          variant="workspace"
          choices={[
            {
              label: w("Espaces", "Spaces", "المساحات"),
              title: w(
                "Un environnement au service des usages.",
                "An environment that supports use.",
                "بيئة تخدم الاستخدام.",
              ),
              body: w(
                "Relier les lieux aux publics, aux activités et à l’organisation quotidienne.",
                "Connect places to audiences, activities and daily organisation.",
                "ربط الأماكن بالفئات والأنشطة والتنظيم اليومي.",
              ),
              photo: "school",
              facts: [
                w("Usages des espaces", "Use of spaces", "استخدام المساحات"),
                w(
                  "Matériels et activités",
                  "Materials and activities",
                  "الأدوات والأنشطة",
                ),
                w("Points à examiner", "Points to examine", "نقاط للفحص"),
              ],
            },
            {
              label: w("Équipe", "Team", "الفريق"),
              title: w(
                "Faire progresser les pratiques ensemble.",
                "Develop practice together.",
                "تطوير الممارسات معاً.",
              ),
              body: w(
                "Clarifier les rôles, les besoins de formation et les échanges professionnels.",
                "Clarify roles, learning needs and professional communication.",
                "توضيح الأدوار والحاجات التكوينية والتواصل المهني.",
              ),
              photo: "professional",
              facts: [
                w(
                  "Rôles et responsabilités",
                  "Roles and responsibilities",
                  "الأدوار والمسؤوليات",
                ),
                w(
                  "Compétences à développer",
                  "Skills to develop",
                  "كفاءات للتطوير",
                ),
                w("Coopération", "Cooperation", "التعاون"),
              ],
            },
            {
              label: w("Parents", "Parents", "الوالدان"),
              title: w(
                "Rendre le lien plus compréhensible.",
                "Make the relationship clearer.",
                "جعل العلاقة أوضح.",
              ),
              body: w(
                "Examiner l’accueil, les transmissions et les repères partagés avec les familles.",
                "Consider reception, communication and shared understanding with families.",
                "فحص الاستقبال والتواصل والمعالم المشتركة مع الأسر.",
              ),
              photo: "family",
              facts: [
                w("Informations utiles", "Useful information", "معلومات مفيدة"),
                w(
                  "Moments d’échange",
                  "Communication moments",
                  "لحظات التواصل",
                ),
                w(
                  "Attentes à clarifier",
                  "Expectations to clarify",
                  "توقعات تحتاج إلى توضيح",
                ),
              ],
            },
            {
              label: w("Organisation", "Organisation", "التنظيم"),
              title: w(
                "Donner une direction à la progression.",
                "Give improvement a direction.",
                "منح التحسين اتجاهاً.",
              ),
              body: w(
                "Préparer le périmètre, les documents et les priorités de l’évaluation envisagée.",
                "Prepare scope, documents and priorities for the proposed evaluation.",
                "إعداد النطاق والوثائق وأولويات التقييم المقترح.",
              ),
              photo: "desk",
              facts: [
                w("Fonctionnement", "Operating framework", "طريقة العمل"),
                w(
                  "Éléments disponibles",
                  "Available evidence",
                  "العناصر المتوفرة",
                ),
                w("Plan d’action", "Action plan", "خطة العمل"),
              ],
            },
          ]}
        />
      </Section>
      <Section
        id="campus-ecosystem"
        title={w(
          "Trois leviers qui peuvent se répondre.",
          "Three levers that can work together.",
          "ثلاثة محاور متكاملة.",
        )}
        tone="ink"
      >
        <div className={s.ecosystem}>
          {[
            {
              key: "academy",
              title: w("Academy", "Academy", "الأكاديمية"),
              body: w(
                "Explorer les programmes publiés pour les besoins de progression de l’équipe.",
                "Explore published programmes for the team’s development needs.",
                "استكشاف البرامج المنشورة لتطوير الفريق.",
              ),
            },
            {
              key: "quality-check",
              title: w("Quality Check", "Quality Check", "فحص الجودة"),
              body: w(
                "Clarifier le périmètre de l’évaluation et les priorités à examiner.",
                "Clarify evaluation scope and priorities to examine.",
                "توضيح نطاق التقييم والأولويات.",
              ),
            },
            {
              key: "partner-os",
              title: w("Partner OS", "Partner OS", "نظام الشركاء"),
              body: w(
                "Comprendre l’espace, les rôles et les plans avant de préparer l’activation.",
                "Understand the workspace, roles and plans before preparing activation.",
                "فهم المساحة والأدوار والخطط قبل التفعيل.",
              ),
            },
          ].map((e, i) => (
            <Link key={e.key} href={routeFor(locale, e.key)}>
              <span>0{i + 1}</span>
              <h3>{tr(e.title, locale)}</h3>
              <p>{tr(e.body, locale)}</p>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
      </Section>
      <Section
        id="campus-people"
        title={w(
          "Quatre regards sur la même expérience.",
          "Four perspectives on one experience.",
          "أربعة منظورات لتجربة واحدة.",
        )}
      >
        <Tiles
          items={[
            {
              title: w("Enfants", "Children", "الأطفال"),
              body: w(
                "Des activités et un environnement pensés autour de leurs besoins.",
                "Activities and an environment considered around their needs.",
                "أنشطة وبيئة تراعي احتياجاتهم.",
              ),
            },
            {
              title: w("Professionnels", "Practitioners", "المهنيون"),
              body: w(
                "Des rôles, pratiques et besoins de progression à clarifier.",
                "Roles, practices and development needs to clarify.",
                "أدوار وممارسات واحتياجات تطوير واضحة.",
              ),
            },
            {
              title: w("Parents", "Parents", "الوالدان"),
              body: w(
                "Une relation et des informations compréhensibles.",
                "A relationship and information that are easy to understand.",
                "علاقة ومعلومات سهلة الفهم.",
              ),
            },
            {
              title: w("Direction", "Leadership", "الإدارة"),
              body: w(
                "Une vue sur le périmètre, les priorités et les étapes du projet.",
                "A view of scope, priorities and project steps.",
                "رؤية للنطاق والأولويات ومراحل المشروع.",
              ),
            },
          ]}
        />
      </Section>
      <Section
        id="campus-diagnostic"
        title={w(
          "Préparez une lecture utile de votre établissement.",
          "Prepare a useful view of your establishment.",
          "أعدوا قراءة مفيدة لمؤسستكم.",
        )}
        tone="sage"
      >
        <Priorities />
        <Brief />
      </Section>
      <Section
        id="campus-roadmap"
        title={w(
          "Observer. Clarifier. Structurer. Progresser.",
          "Observe. Clarify. Structure. Improve.",
          "الملاحظة والتوضيح والتنظيم والتحسين.",
        )}
      >
        <Steps
          steps={[
            {
              title: w("Décrire le contexte", "Describe context", "وصف السياق"),
              body: w(
                "Type d’établissement, publics, capacité et objectifs.",
                "Institution type, audiences, capacity and objectives.",
                "نوع المؤسسة والفئات والسعة والأهداف.",
              ),
            },
            {
              title: w(
                "Convenir du diagnostic",
                "Agree the diagnostic",
                "الاتفاق على التشخيص",
              ),
              body: w(
                "Préciser les dimensions et modalités retenues.",
                "Specify the selected dimensions and terms.",
                "تحديد الأبعاد والصيغ المعتمدة.",
              ),
            },
            {
              title: w(
                "Relier les besoins aux leviers",
                "Connect needs to levers",
                "ربط الاحتياجات بالمحاور",
              ),
              body: w(
                "Formation, évaluation ou organisation selon le périmètre.",
                "Learning, evaluation or organisation according to scope.",
                "التكوين أو التقييم أو التنظيم وفق النطاق.",
              ),
            },
            {
              title: w(
                "Définir la suite",
                "Define next steps",
                "تحديد الخطوات التالية",
              ),
              body: w(
                "Actions, responsabilités et suivi à convenir.",
                "Actions, responsibilities and follow-up to agree.",
                "الاتفاق على الإجراءات والمسؤوليات والمتابعة.",
              ),
            },
          ]}
        />
      </Section>
      <Section
        id="campus-services"
        title={w(
          "Approfondissez le parcours qui vous concerne.",
          "Explore the pathway that concerns you.",
          "تعمقوا في المسار المعني.",
        )}
        tone="paper"
      >
        <Dossiers layout="strips" />
      </Section>
      <Closing />
    </>
  );
}
