"use client";
import { ArrowDown, BriefcaseBusiness, HeartHandshake } from "lucide-react";
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
export function Corporates() {
  const { locale, native } = useWorld(),
    p = WORLDS.corporates;
  return (
    <>
      <section
        className={s.corporateHero}
        data-business-module="employer-opening"
      >
        <div className={s.heroCopy}>
          <span className={s.kicker}>
            <BriefcaseBusiness size={17} />
            {tr(p.eyebrow, locale)}
          </span>
          <h1>{native.copy.title || tr(p.title, locale)}</h1>
          <p>{native.copy.lead || tr(p.lead, locale)}</p>
          <div className={s.actions}>
            <LinkButton />
            <LinkButton href="#employer-programmes" soft>
              {tr(B.discover, locale)}
            </LinkButton>
          </div>
          <div className={s.heroNote}>
            <HeartHandshake />
            <span>
              {tr(
                w(
                  "Du quotidien des parents à votre culture d’entreprise.",
                  "From parents’ everyday lives to your company culture.",
                  "من حياة الوالدين اليومية إلى ثقافة مؤسستكم.",
                ),
                locale,
              )}
            </span>
          </div>
        </div>
        <div className={s.corporateCollage}>
          <Picture name="corporate" priority />
          <Picture name="family" />
          <div className={s.floatingLabel}>
            {tr(
              w(
                "La vie professionnelle rencontre la vie familiale.",
                "Work life meets family life.",
                "تلتقي الحياة المهنية بالحياة الأسرية.",
              ),
              locale,
            )}
            <ArrowDown />
          </div>
        </div>
      </section>
      <WorldNav
        entries={[
          {
            id: "employer-reality",
            label: w("Vie réelle", "Real life", "الحياة اليومية"),
          },
          {
            id: "employer-programmes",
            label: w("Programmes", "Programmes", "البرامج"),
          },
          {
            id: "employer-design",
            label: w("Conception", "Programme design", "التصميم"),
          },
        ]}
      />
      <Section
        id="employer-reality"
        kicker={w("LE POINT DE DÉPART", "THE STARTING POINT", "نقطة البداية")}
        title={w(
          "Le travail continue. La vie aussi.",
          "Work goes on. So does life.",
          "العمل مستمر، والحياة أيضاً.",
        )}
        lead={w(
          "Comprendre les situations avant de choisir un programme : les besoins des parents ne se ressemblent pas tous.",
          "Understand the situation before choosing a programme: parents’ needs are not all alike.",
          "افهموا الوضع قبل اختيار البرنامج؛ احتياجات الوالدين ليست متشابهة.",
        )}
        tone="paper"
      >
        <Tiles
          items={[
            {
              title: w(
                "Un rythme à organiser",
                "A rhythm to organise",
                "إيقاع يحتاج إلى تنظيم",
              ),
              body: w(
                "École, horaires, trajets et organisation familiale composent le quotidien.",
                "School, schedules, journeys and family arrangements shape daily life.",
                "تشكل المدرسة والمواعيد والتنقل والتنظيم الأسري الحياة اليومية.",
              ),
              photo: "homework",
            },
            {
              title: w(
                "Une transition à accompagner",
                "A transition to support",
                "تحول يحتاج إلى مرافقة",
              ),
              body: w(
                "La parentalité et le retour au travail invitent à préparer de nouveaux repères.",
                "Parenthood and returning to work invite new arrangements.",
                "تدعو الوالدية والعودة إلى العمل إلى إعداد تنظيم جديد.",
              ),
              photo: "newborn",
            },
            {
              title: w(
                "Un imprévu à anticiper",
                "An unexpected moment to prepare for",
                "ظرف غير متوقع",
              ),
              body: w(
                "Le programme doit clarifier les conditions d’accès et les solutions mobilisables.",
                "The programme should clarify access conditions and available options.",
                "يوضح البرنامج شروط الوصول والحلول الممكنة.",
              ),
              photo: "urgent",
            },
          ]}
        />
      </Section>
      <Section
        id="employer-programmes"
        kicker={w(
          "LE PORTEFEUILLE EMPLOYEUR",
          "THE EMPLOYER PORTFOLIO",
          "محفظة برامج المؤسسة",
        )}
        title={w(
          "Trois portes d’entrée. Un projet cohérent.",
          "Three entry points. One coherent project.",
          "ثلاثة مداخل ومشروع متكامل.",
        )}
        lead={w(
          "Un socle, une réponse aux imprévus, des moments de lien : explorez les programmes et leur périmètre.",
          "A foundation, a response to disruption, moments of connection: explore the programmes and their scope.",
          "أساس للدعم واستجابة للظروف ولحظات للتواصل: استكشفوا البرامج ونطاقها.",
        )}
        tone="rose"
      >
        <Dossiers layout="portfolio" />
      </Section>
      <Section
        id="employer-perspectives"
        title={w(
          "Un programme, deux regards essentiels.",
          "One programme, two essential perspectives.",
          "برنامج واحد ومنظوران أساسيان.",
        )}
      >
        <Explorer
          dimension="employer-perspective"
          choices={[
            {
              label: w(
                "Côté collaborateur",
                "Employee perspective",
                "منظور الموظف",
              ),
              title: w(
                "Comprendre comment en bénéficier.",
                "Understand how to benefit.",
                "فهم طريقة الاستفادة.",
              ),
              body: w(
                "Le parcours doit rendre lisibles l’éligibilité, les conditions et les démarches pour la famille.",
                "The journey should make eligibility, conditions and family steps clear.",
                "يوضح المسار الأهلية والشروط وخطوات الأسرة.",
              ),
              photo: "family",
              facts: [
                w("Publics concernés", "Eligible audiences", "الفئات المعنية"),
                w("Conditions d’accès", "Access conditions", "شروط الوصول"),
                w(
                  "Utilisation du programme",
                  "Using the programme",
                  "استخدام البرنامج",
                ),
              ],
            },
            {
              label: w(
                "Côté organisation",
                "Organisation perspective",
                "منظور المؤسسة",
              ),
              title: w(
                "Définir un cadre utilisable.",
                "Define a usable framework.",
                "تحديد إطار قابل للاستخدام.",
              ),
              body: w(
                "Les objectifs, la population, la contribution et la coordination structurent le projet employeur.",
                "Objectives, population, contribution and coordination structure the employer project.",
                "تشكل الأهداف والفئات والمساهمة والتنسيق مشروع المؤسسة.",
              ),
              photo: "corporate",
              facts: [
                w(
                  "Périmètre de la population",
                  "Population scope",
                  "نطاق الفئات",
                ),
                w(
                  "Allocation et contribution",
                  "Allocation and contribution",
                  "المخصصات والمساهمة",
                ),
                w(
                  "Organisation et suivi convenus",
                  "Agreed organisation and follow-up",
                  "التنظيم والمتابعة المتفق عليهما",
                ),
              ],
            },
          ]}
        />
      </Section>
      <Section
        id="employer-design"
        kicker={w(
          "VOTRE BRIEF EMPLOYEUR",
          "YOUR EMPLOYER BRIEF",
          "تحضير برنامج المؤسسة",
        )}
        title={w(
          "Qu’aimeriez-vous rendre plus simple ?",
          "What would you like to make easier?",
          "ما الذي ترغبون في تسهيله؟",
        )}
        lead={w(
          "Combinez vos priorités. Elles alimentent votre préparation et peuvent être ajoutées à votre demande.",
          "Combine your priorities. They feed your preparation and can be added to your enquiry.",
          "اجمعوا أولوياتكم لتغذية التحضير وإضافتها إلى الطلب.",
        )}
        tone="ink"
      >
        <Priorities />
        <Brief />
      </Section>
      <Section
        id="employer-framework"
        title={w(
          "Le bénéfice devient clair quand le cadre l’est.",
          "Benefits become clear when the framework is clear.",
          "تتضح المزايا حين يتضح الإطار.",
        )}
      >
        <Steps
          steps={[
            {
              title: w("Éligibilité", "Eligibility", "الأهلية"),
              body: w(
                "Qui est concerné et dans quelles conditions ?",
                "Who is included and under which conditions?",
                "من المعني وما الشروط؟",
              ),
            },
            {
              title: w("Allocation", "Allocation", "المخصصات"),
              body: w(
                "Quel cadre d’accès et quel niveau de soutien envisager ?",
                "What access framework and level of support should be considered?",
                "ما إطار الوصول ومستوى الدعم المقترح؟",
              ),
            },
            {
              title: w("Contribution", "Contribution", "المساهمة"),
              body: w(
                "Quelle répartition définir entre employeur et bénéficiaire ?",
                "How should contributions be shared between employer and beneficiary?",
                "كيف تُحدد المساهمة بين المؤسسة والمستفيد؟",
              ),
            },
            {
              title: w("Utilisation", "Use", "الاستفادة"),
              body: w(
                "Quelles offres, étapes et modalités pour en bénéficier ?",
                "Which offers, steps and terms govern access?",
                "ما العروض والخطوات والشروط للاستفادة؟",
              ),
            },
          ]}
        />
      </Section>
      <Section
        id="employer-deployment"
        title={w(
          "Du projet à un programme préparé.",
          "From a project to a prepared programme.",
          "من الفكرة إلى برنامج مُعد.",
        )}
        tone="paper"
      >
        <div className={s.split}>
          <Picture name="desk" />
          <Steps
            vertical
            steps={[
              {
                title: w(
                  "Clarifier les objectifs",
                  "Clarify objectives",
                  "توضيح الأهداف",
                ),
                body: w(
                  "Population, situations prioritaires et horizon du projet.",
                  "Population, priority situations and project timeframe.",
                  "الفئات والأوضاع ذات الأولوية والأفق الزمني.",
                ),
              },
              {
                title: w(
                  "Préciser le périmètre",
                  "Specify scope",
                  "تحديد النطاق",
                ),
                body: w(
                  "Programme, conditions et modalités applicables.",
                  "Programme, conditions and applicable terms.",
                  "البرنامج والشروط والصيغ المطبقة.",
                ),
              },
              {
                title: w(
                  "Préparer la communication",
                  "Prepare communication",
                  "إعداد التواصل",
                ),
                body: w(
                  "Présenter aux bénéficiaires un fonctionnement compréhensible.",
                  "Explain the programme clearly to beneficiaries.",
                  "عرض طريقة عمل واضحة للمستفيدين.",
                ),
              },
              {
                title: w(
                  "Convenir du suivi",
                  "Agree follow-up",
                  "الاتفاق على المتابعة",
                ),
                body: w(
                  "Définir les échanges et informations du suivi prévu.",
                  "Define the discussions and information for agreed follow-up.",
                  "تحديد التبادل والمعلومات للمتابعة المتفق عليها.",
                ),
              },
            ]}
          />
        </div>
      </Section>
      <Closing />
    </>
  );
}
