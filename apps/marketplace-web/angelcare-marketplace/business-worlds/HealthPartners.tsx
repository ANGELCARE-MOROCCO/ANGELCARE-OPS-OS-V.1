"use client";
import { HeartHandshake, ArrowDown } from "lucide-react";
import { B, WORLDS, tr, w } from "./content";
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
export function HealthPartners() {
  const { locale, native } = useWorld(),
    p = WORLDS["health-partners"];
  return (
    <>
      <section className={s.healthHero} data-business-module="care-opening">
        <Picture name="health" priority />
        <div className={s.healthCopy}>
          <span className={s.kicker}>
            <HeartHandshake size={18} />
            {tr(p.eyebrow, locale)}
          </span>
          <h1>{native.copy.title || tr(p.title, locale)}</h1>
          <p>{native.copy.lead || tr(p.lead, locale)}</p>
          <div className={s.actions}>
            <LinkButton />
            <LinkButton href="#care-continuum" soft>
              {tr(
                w(
                  "Explorer le continuum",
                  "Explore the continuum",
                  "استكشاف الاستمرارية",
                ),
                locale,
              )}
            </LinkButton>
          </div>
        </div>
        <div className={s.careRibbon}>
          {tr(w("Maternité", "Maternity", "الأمومة"), locale)}
          <ArrowDown />
          {tr(w("Retour à domicile", "Return home", "العودة للمنزل"), locale)}
          <ArrowDown />
          {tr(w("Vie familiale", "Family life", "الحياة الأسرية"), locale)}
        </div>
      </section>
      <WorldNav
        entries={[
          {
            id: "care-continuum",
            label: w("Continuum", "Continuum", "الاستمرارية"),
          },
          {
            id: "care-perspectives",
            label: w("Coordination", "Coordination", "التنسيق"),
          },
          {
            id: "care-programmes",
            label: w("Programmes", "Programmes", "البرامج"),
          },
        ]}
      />
      <Section
        id="care-continuum"
        kicker={w("AUTOUR DE LA FAMILLE", "AROUND THE FAMILY", "حول الأسرة")}
        title={w(
          "Le parcours change. Les repères se construisent.",
          "The journey changes. Understanding grows.",
          "يتغير المسار وتُبنى المعالم.",
        )}
        lead={w(
          "Explorez les contextes d’accompagnement non médical et les questions à préparer pour chaque étape.",
          "Explore non-medical support contexts and the questions to prepare at each stage.",
          "استكشفوا سياقات الدعم غير الطبي وأسئلة الاستعداد لكل مرحلة.",
        )}
        tone="paper"
      >
        <Explorer
          dimension="care-stage"
          variant="continuum"
          choices={[
            {
              label: w("Maternité", "Maternity", "الأمومة"),
              title: w(
                "Préparer l’accompagnement autour de la naissance.",
                "Prepare support around birth.",
                "إعداد الدعم حول الولادة.",
              ),
              body: w(
                "Identifier les publics, le contexte et les modalités de coopération avec votre structure.",
                "Identify audiences, context and cooperation terms with your organisation.",
                "تحديد الفئات والسياق وصيغ التعاون مع المؤسسة.",
              ),
              photo: "newborn",
              facts: [
                w(
                  "Publics et besoins non médicaux",
                  "Audiences and non-medical needs",
                  "الفئات والاحتياجات غير الطبية",
                ),
                w(
                  "Articulation avec la structure",
                  "Coordination with the organisation",
                  "التنسيق مع المؤسسة",
                ),
                w("Périmètre à définir", "Scope to define", "نطاق للتحديد"),
              ],
            },
            {
              label: w("Retour à domicile", "Returning home", "العودة للمنزل"),
              title: w(
                "Accompagner une nouvelle organisation.",
                "Support a new arrangement.",
                "مرافقة تنظيم جديد.",
              ),
              body: w(
                "La vie à domicile invite à préciser les besoins d’organisation, de présence et de soutien familial.",
                "Home life invites clarity about organisation, presence and family support needs.",
                "تتطلب الحياة في المنزل توضيح احتياجات التنظيم والحضور ودعم الأسرة.",
              ),
              photo: "support",
              facts: [
                w("Contexte familial", "Family context", "السياق الأسري"),
                w(
                  "Rythme et besoins",
                  "Rhythm and needs",
                  "الإيقاع والاحتياجات",
                ),
                w(
                  "Transmission utile",
                  "Useful handover",
                  "نقل المعلومات المفيدة",
                ),
              ],
            },
            {
              label: w(
                "Parents & quotidien",
                "Parents & everyday life",
                "الوالدان والحياة اليومية",
              ),
              title: w(
                "Mettre des mots sur les besoins.",
                "Put needs into words.",
                "التعبير عن الاحتياجات.",
              ),
              body: w(
                "Comprendre les questions des parents et les repères utiles dans le périmètre non médical.",
                "Understand parents’ questions and useful guidance within a non-medical scope.",
                "فهم أسئلة الوالدين والمعالم المفيدة ضمن نطاق غير طبي.",
              ),
              photo: "family",
              facts: [
                w(
                  "Questions des parents",
                  "Parents’ questions",
                  "أسئلة الوالدين",
                ),
                w(
                  "Soutien et organisation",
                  "Support and organisation",
                  "الدعم والتنظيم",
                ),
                w(
                  "Orientation adaptée",
                  "Appropriate orientation",
                  "توجيه مناسب",
                ),
              ],
            },
            {
              label: w("Ateliers", "Workshops", "ورشات"),
              title: w(
                "Des temps collectifs à préparer.",
                "Prepare shared learning moments.",
                "إعداد لحظات تعلم جماعية.",
              ),
              body: w(
                "Définir les thèmes, les publics et les modalités de l’atelier envisagé.",
                "Define topics, audiences and terms for the proposed workshop.",
                "تحديد المواضيع والفئات وصيغ الورشة المقترحة.",
              ),
              photo: "academy",
              facts: [
                w(
                  "Thème et objectifs",
                  "Topic and objectives",
                  "الموضوع والأهداف",
                ),
                w("Public et format", "Audience and format", "الفئات والصيغة"),
                w("Cadre d’intervention", "Delivery framework", "إطار التدخل"),
              ],
            },
          ]}
        />
        <div className={s.boundary}>
          <HeartHandshake size={20} />
          <p>{tr(B.nonMedical, locale)}</p>
        </div>
      </Section>
      <Section
        id="care-programmes"
        title={w(
          "Trois contextes pour préciser votre projet.",
          "Three contexts to clarify your project.",
          "ثلاثة سياقات لتوضيح المشروع.",
        )}
        tone="rose"
      >
        <Dossiers layout="overlap" />
      </Section>
      <Section
        id="care-perspectives"
        title={w(
          "La famille au centre. Des rôles clairement définis.",
          "Family at the centre. Clearly defined roles.",
          "الأسرة في المركز وأدوار واضحة.",
        )}
      >
        <Explorer
          dimension="care-perspective"
          choices={[
            {
              label: w("Famille", "Family", "الأسرة"),
              title: w(
                "Un accompagnement compréhensible.",
                "Support that makes sense.",
                "دعم واضح ومفهوم.",
              ),
              body: w(
                "La famille doit comprendre le périmètre, les intervenants et les modalités envisagées.",
                "The family should understand scope, participants and proposed terms.",
                "ينبغي أن تفهم الأسرة النطاق والمتدخلين والصيغ المقترحة.",
              ),
              photo: "family",
              facts: [
                w(
                  "Besoins exprimés",
                  "Expressed needs",
                  "الاحتياجات المعبر عنها",
                ),
                w(
                  "Accord et informations utiles",
                  "Consent and useful information",
                  "الموافقة والمعلومات المفيدة",
                ),
                w(
                  "Interlocuteurs identifiés",
                  "Identified contacts",
                  "أشخاص تواصل محددون",
                ),
              ],
            },
            {
              label: w(
                "Structure partenaire",
                "Partner organisation",
                "المؤسسة الشريكة",
              ),
              title: w(
                "Préparer une coopération lisible.",
                "Prepare clear cooperation.",
                "إعداد تعاون واضح.",
              ),
              body: w(
                "Clarifier l’orientation, les responsabilités et la transmission dans le cadre convenu.",
                "Clarify orientation, responsibilities and handovers within the agreed framework.",
                "توضيح التوجيه والمسؤوليات ونقل المعلومات ضمن الإطار المتفق عليه.",
              ),
              photo: "health",
              facts: [
                w("Rôles respectifs", "Respective roles", "الأدوار الخاصة"),
                w(
                  "Coordination à convenir",
                  "Coordination to agree",
                  "التنسيق المتفق عليه",
                ),
                w(
                  "Limites non médicales",
                  "Non-medical boundaries",
                  "الحدود غير الطبية",
                ),
              ],
            },
          ]}
        />
      </Section>
      <Section
        id="care-coordination"
        title={w(
          "Une continuité préparée, étape par étape.",
          "Prepare continuity, step by step.",
          "إعداد الاستمرارية خطوة بخطوة.",
        )}
        tone="sage"
      >
        <Steps
          steps={[
            {
              title: w(
                "Exprimer la demande",
                "Express the need",
                "التعبير عن الطلب",
              ),
              body: w(
                "Contexte, publics et besoin d’accompagnement.",
                "Context, audiences and support needs.",
                "السياق والفئات واحتياجات الدعم.",
              ),
            },
            {
              title: w(
                "Clarifier l’accord",
                "Clarify consent",
                "توضيح الموافقة",
              ),
              body: w(
                "Informations nécessaires et modalités de contact.",
                "Necessary information and contact terms.",
                "المعلومات اللازمة وصيغ التواصل.",
              ),
            },
            {
              title: w("Définir les rôles", "Define roles", "تحديد الأدوار"),
              body: w(
                "Périmètre de chaque intervenant et modalités convenues.",
                "Each participant’s scope and agreed terms.",
                "نطاق كل متدخل والصيغ المتفق عليها.",
              ),
            },
            {
              title: w(
                "Organiser la transmission",
                "Organise handovers",
                "تنظيم تسليم المعلومات",
              ),
              body: w(
                "Partager les repères utiles dans le cadre prévu.",
                "Share useful guidance within the agreed framework.",
                "مشاركة المعالم المفيدة ضمن الإطار المحدد.",
              ),
            },
          ]}
        />
      </Section>
      <Section
        id="care-fit"
        title={w(
          "Où votre projet doit-il faire la différence ?",
          "Where should your project make a difference?",
          "أين ينبغي أن يترك مشروعكم أثراً؟",
        )}
        lead={w(
          "Choisissez les besoins que vous souhaitez explorer avec nous.",
          "Choose the needs you would like to explore with us.",
          "اختاروا الاحتياجات التي ترغبون في استكشافها معنا.",
        )}
      >
        <Priorities />
        <Brief />
      </Section>
      <Section
        id="care-workshops"
        title={w(
          "Un atelier commence par une bonne question.",
          "A workshop starts with a good question.",
          "تبدأ الورشة بسؤال جيد.",
        )}
        tone="paper"
      >
        <div className={s.split}>
          <Picture name="academy" />
          <Tiles
            items={[
              {
                title: w("Pour qui ?", "For whom?", "لمن؟"),
                body: w(
                  "Parents, familles ou professionnels : préciser le public avant le format.",
                  "Parents, families or professionals: identify the audience before the format.",
                  "والدان أو أسر أو مهنيون: تحديد الفئات قبل الصيغة.",
                ),
              },
              {
                title: w(
                  "Pour comprendre quoi ?",
                  "To understand what?",
                  "لفهم ماذا؟",
                ),
                body: w(
                  "Un thème clair, des objectifs utiles et un cadre non médical.",
                  "A clear topic, useful objectives and a non-medical framework.",
                  "موضوع واضح وأهداف مفيدة وإطار غير طبي.",
                ),
              },
              {
                title: w(
                  "Dans quel contexte ?",
                  "In which context?",
                  "في أي سياق؟",
                ),
                body: w(
                  "Lieu, groupe, rythme et modalités à définir ensemble.",
                  "Venue, group, rhythm and terms to define together.",
                  "المكان والمجموعة والإيقاع والصيغ نحددها معاً.",
                ),
              },
            ]}
          />
        </div>
      </Section>
      <Closing
        extraFaq={[
          {
            title: w(
              "Cet accompagnement est-il médical ?",
              "Is this support medical?",
              "هل هذا الدعم طبي؟",
            ),
            body: B.nonMedical,
          },
        ]}
      />
    </>
  );
}
