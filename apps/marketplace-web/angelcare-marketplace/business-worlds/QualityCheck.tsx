"use client";
import { ClipboardCheck, ScanSearch, ArrowDown } from "lucide-react";
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
import { Explorer, PreparedEvidence } from "./Tools";
import s from "./business.module.css";
export function QualityCheck() {
  const { locale, native } = useWorld(),
    p = WORLDS["quality-check"];
  return (
    <>
      <section className={s.qualityHero} data-business-module="quality-opening">
        <div className={s.qualityDocument}>
          <span className={s.kicker}>
            <ClipboardCheck size={18} />
            {tr(p.eyebrow, locale)}
          </span>
          <h1>{native.copy.title || tr(p.title, locale)}</h1>
          <p>{native.copy.lead || tr(p.lead, locale)}</p>
          <div className={s.actions}>
            <LinkButton />
            <LinkButton soft href="#quality-method">
              {tr(B.explain, locale)}
            </LinkButton>
          </div>
          <div className={s.documentLine}>
            <ScanSearch size={25} />
            <span>
              {tr(
                w(
                  "Périmètre → Éléments → Constats → Actions",
                  "Scope → Evidence → Findings → Actions",
                  "النطاق ← العناصر ← الملاحظات ← الإجراءات",
                ),
                locale,
              )}
            </span>
          </div>
        </div>
        <div className={s.qualityVisual}>
          <Picture name="school" priority />
          <div className={s.qualityCaption}>
            <span>QUALITY CHECK</span>
            <strong>
              {tr(
                w(
                  "Une direction pour progresser.",
                  "A direction for improvement.",
                  "اتجاه للتحسين.",
                ),
                locale,
              )}
            </strong>
            <ArrowDown size={22} />
          </div>
        </div>
      </section>
      <WorldNav
        entries={[
          {
            id: "quality-dimensions",
            label: w("Périmètre", "Scope", "النطاق"),
          },
          { id: "quality-method", label: w("Méthode", "Method", "المنهج") },
          {
            id: "quality-evidence",
            label: w("Préparation", "Preparation", "التحضير"),
          },
        ]}
      />
      <Section
        id="quality-dimensions"
        title={w(
          "Définir ce que l’on souhaite examiner.",
          "Define what you want to examine.",
          "تحديد ما ترغبون في فحصه.",
        )}
        lead={w(
          "Ces dimensions préparent votre demande. Le périmètre exact et la méthode dépendront du service retenu et du cadre convenu.",
          "These dimensions prepare your enquiry. Exact scope and method depend on the selected service and agreed framework.",
          "تعد هذه الأبعاد الطلب ويعتمد النطاق والمنهج على الخدمة والإطار المتفق عليه.",
        )}
        tone="paper"
      >
        <Explorer
          dimension="quality-dimension"
          variant="evidence"
          choices={[
            {
              label: w("Pratiques", "Practice", "الممارسات"),
              title: w(
                "Comprendre les pratiques et leur organisation.",
                "Understand practice and organisation.",
                "فهم الممارسات وتنظيمها.",
              ),
              body: w(
                "Identifier les activités, procédures et questions pertinentes pour le périmètre envisagé.",
                "Identify relevant activities, procedures and questions for the proposed scope.",
                "تحديد الأنشطة والإجراءات والأسئلة المناسبة للنطاق.",
              ),
              facts: [
                w(
                  "Pratiques concernées",
                  "Relevant practices",
                  "الممارسات المعنية",
                ),
                w(
                  "Organisation quotidienne",
                  "Daily organisation",
                  "التنظيم اليومي",
                ),
                w("Points à examiner", "Points to examine", "نقاط للفحص"),
              ],
            },
            {
              label: w("Équipe", "Team", "الفريق"),
              title: w(
                "Clarifier les rôles et les besoins de progression.",
                "Clarify roles and development needs.",
                "توضيح الأدوار واحتياجات التطوير.",
              ),
              body: w(
                "Relier responsabilités, compétences et contexte de l’établissement.",
                "Connect responsibilities, competencies and institution context.",
                "ربط المسؤوليات والكفاءات بسياق المؤسسة.",
              ),
              facts: [
                w("Responsabilités", "Responsibilities", "المسؤوليات"),
                w("Compétences", "Competencies", "الكفاءات"),
                w("Besoins de formation", "Learning needs", "احتياجات التكوين"),
              ],
            },
            {
              label: w("Cadre", "Environment", "الإطار"),
              title: w(
                "Situer l’expérience dans son contexte.",
                "Place the experience in context.",
                "وضع التجربة ضمن السياق.",
              ),
              body: w(
                "Préciser les lieux, publics et usages qui feront partie du périmètre convenu.",
                "Specify places, audiences and uses included in the agreed scope.",
                "تحديد الأماكن والفئات والاستخدام ضمن النطاق.",
              ),
              facts: [
                w("Lieux concernés", "Relevant places", "الأماكن المعنية"),
                w(
                  "Publics et usages",
                  "Audiences and uses",
                  "الفئات والاستخدام",
                ),
                w(
                  "Conditions à préciser",
                  "Conditions to specify",
                  "شروط للتوضيح",
                ),
              ],
            },
            {
              label: w("Progression", "Improvement", "التحسين"),
              title: w(
                "Relier les constats aux étapes suivantes.",
                "Connect findings to next steps.",
                "ربط الملاحظات بالمراحل التالية.",
              ),
              body: w(
                "Organiser les priorités et les actions selon les résultats et le suivi convenu.",
                "Organise priorities and actions according to findings and agreed follow-up.",
                "تنظيم الأولويات والإجراءات حسب النتائج والمتابعة.",
              ),
              facts: [
                w("Priorités", "Priorities", "الأولويات"),
                w(
                  "Actions et responsables",
                  "Actions and owners",
                  "الإجراءات والمسؤولون",
                ),
                w("Modalités du suivi", "Follow-up terms", "صيغ المتابعة"),
              ],
            },
          ]}
        />
      </Section>
      <Section
        id="quality-method"
        kicker={w(
          "UNE MÉTHODE À CLARIFIER ENSEMBLE",
          "A METHOD TO CLARIFY TOGETHER",
          "منهج نوضحه معاً",
        )}
        title={w(
          "Une évaluation utile commence par le périmètre.",
          "A useful evaluation starts with scope.",
          "يبدأ التقييم المفيد بالنطاق.",
        )}
        tone="ink"
      >
        <Steps
          vertical
          steps={[
            {
              title: w("Cadrer la demande", "Frame the enquiry", "تأطير الطلب"),
              body: w(
                "Objectifs, lieux, publics et dimensions concernés.",
                "Relevant objectives, places, audiences and dimensions.",
                "الأهداف والأماكن والفئات والأبعاد المعنية.",
              ),
            },
            {
              title: w(
                "Convenir des modalités",
                "Agree terms",
                "الاتفاق على الصيغ",
              ),
              body: w(
                "Méthode, éléments attendus et conditions applicables.",
                "Method, expected evidence and applicable conditions.",
                "المنهج والعناصر المطلوبة والشروط.",
              ),
            },
            {
              title: w(
                "Examiner les éléments",
                "Examine evidence",
                "فحص العناصر",
              ),
              body: w(
                "Documents et observations selon le périmètre défini.",
                "Documents and observations according to defined scope.",
                "الوثائق والملاحظات وفق النطاق.",
              ),
            },
            {
              title: w(
                "Structurer la suite",
                "Structure next steps",
                "تنظيم الخطوات التالية",
              ),
              body: w(
                "Constats, priorités, actions et suivi convenus.",
                "Agreed findings, priorities, actions and follow-up.",
                "الملاحظات والأولويات والإجراءات والمتابعة.",
              ),
            },
          ]}
        />
      </Section>
      <Section
        id="quality-evidence"
        title={w(
          "Ce que vous pouvez déjà préparer.",
          "What you can already prepare.",
          "ما يمكنكم إعداده الآن.",
        )}
      >
        <PreparedEvidence />
      </Section>
      <Section
        id="quality-deliverables"
        title={w(
          "Comprendre la logique des livrables.",
          "Understand the logic of deliverables.",
          "فهم منطق المخرجات.",
        )}
        lead={w(
          "Les structures ci-dessous sont explicatives. Le contenu et les livrables de votre évaluation sont définis dans le service retenu.",
          "The structures below are explanatory. Your evaluation’s content and deliverables are defined in the selected service.",
          "البنيات أدناه توضيحية وتُحدد محتويات ومخرجات التقييم ضمن الخدمة المختارة.",
        )}
        tone="sage"
      >
        <div className={s.deliverableGrid}>
          {[
            {
              title: w("Constats", "Findings", "الملاحظات"),
              body: w(
                "Éléments examinés, observations et contexte utile à leur compréhension.",
                "Evidence examined, observations and context needed to understand them.",
                "العناصر المفحوصة والملاحظات والسياق لفهمها.",
              ),
            },
            {
              title: w("Priorités", "Priorities", "الأولويات"),
              body: w(
                "Sujets à approfondir et ordre de progression à convenir.",
                "Topics to explore and an agreed order for improvement.",
                "مواضيع للتعمق وترتيب للتحسين.",
              ),
            },
            {
              title: w("Actions", "Actions", "الإجراءات"),
              body: w(
                "Étapes, responsabilités et modalités du suivi envisagé.",
                "Steps, responsibilities and proposed follow-up terms.",
                "خطوات ومسؤوليات وصيغ المتابعة المقترحة.",
              ),
            },
          ].map((d, i) => (
            <article key={d.title.en}>
              <span className={s.kicker}>
                {tr(B.labelExample, locale)} / 0{i + 1}
              </span>
              <div className={s.reportLines}>
                <i />
                <i />
                <i />
              </div>
              <h3>{tr(d.title, locale)}</h3>
              <p>{tr(d.body, locale)}</p>
            </article>
          ))}
        </div>
      </Section>
      <Section
        id="quality-scope"
        title={w(
          "Où souhaitez-vous commencer ?",
          "Where would you like to begin?",
          "من أين ترغبون في البدء؟",
        )}
      >
        <Priorities />
        <Brief />
      </Section>
      <Section
        id="quality-dossiers"
        title={w(
          "Le projet, de sa préparation à sa progression.",
          "The project, from preparation to improvement.",
          "المشروع من التحضير إلى التحسين.",
        )}
        tone="paper"
      >
        <Dossiers layout="strips" />
      </Section>
      <Section
        id="quality-action"
        title={w(
          "Une direction claire pour le prochain pas.",
          "A clear direction for the next step.",
          "اتجاه واضح للخطوة التالية.",
        )}
        tone="ink"
      >
        <div className={s.split}>
          <Picture name="professional" />
          <Tiles
            items={[
              {
                title: w("Relier", "Connect", "الربط"),
                body: w(
                  "Associer chaque action au constat et au périmètre concerné.",
                  "Connect each action to the relevant finding and scope.",
                  "ربط كل إجراء بالملاحظة والنطاق.",
                ),
              },
              {
                title: w("Organiser", "Organise", "التنظيم"),
                body: w(
                  "Clarifier les personnes concernées et les étapes à convenir.",
                  "Clarify relevant people and steps to agree.",
                  "توضيح الأشخاص والخطوات للاتفاق.",
                ),
              },
              {
                title: w("Suivre", "Follow up", "المتابعة"),
                body: w(
                  "Définir les échanges et les repères du suivi prévu.",
                  "Define discussions and guidance for planned follow-up.",
                  "تحديد التبادل والمعالم للمتابعة.",
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
              "Cette page délivre-t-elle une note ou une certification ?",
              "Does this page issue a score or certification?",
              "هل تمنح الصفحة درجة أو شهادة؟",
            ),
            body: w(
              "Les explorateurs préparent votre demande. Ils ne constituent ni une évaluation officielle ni une certification. Les modalités et livrables dépendent du service retenu.",
              "The explorers prepare your enquiry. They are neither an official evaluation nor certification. Terms and deliverables depend on the selected service.",
              "تعد الأدوات طلبكم ولا تمثل تقييماً رسمياً أو شهادة، وتعتمد الصيغ والمخرجات على الخدمة المختارة.",
            ),
          },
        ]}
      />
    </>
  );
}
