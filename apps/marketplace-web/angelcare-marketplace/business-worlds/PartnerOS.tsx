"use client";
import { Layers3, SlidersHorizontal, ArrowUpRight } from "lucide-react";
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
export function PartnerOS() {
  const { locale, native } = useWorld(),
    p = WORLDS["partner-os"];
  return (
    <>
      <section className={s.osHero} data-business-module="workspace-opening">
        <div className={s.heroCopy}>
          <span className={s.kicker}>
            <Layers3 size={18} />
            {tr(p.eyebrow, locale)}
          </span>
          <h1>{native.copy.title || tr(p.title, locale)}</h1>
          <p>{native.copy.lead || tr(p.lead, locale)}</p>
          <div className={s.actions}>
            <LinkButton />
            <LinkButton soft href="#os-workspace">
              {tr(B.explain, locale)}
            </LinkButton>
          </div>
        </div>
        <div className={s.osBlueprint}>
          <div className={s.blueprintBar}>
            <span>ANGELCARE / PARTNER OS</span>
            <SlidersHorizontal size={18} />
          </div>
          <span className={s.kicker}>{tr(B.labelExample, locale)}</span>
          <div className={s.blueprintCore}>
            <Layers3 size={42} />
            <strong>
              {tr(
                w("Votre organisation", "Your organisation", "مؤسستكم"),
                locale,
              )}
            </strong>
          </div>
          <div className={s.blueprintNodes}>
            {[
              w("Espace", "Workspace", "المساحة"),
              w("Membres", "Members", "الأعضاء"),
              w("Rôles", "Roles", "الأدوار"),
              w("Plan", "Plan", "الخطة"),
            ].map((v) => (
              <div key={v.en}>
                {tr(v, locale)}
                <ArrowUpRight size={15} />
              </div>
            ))}
          </div>
          <small>
            {tr(
              w(
                "Carte du fonctionnement — pas un tableau de bord connecté.",
                "Operating map — not a connected dashboard.",
                "خريطة العمل وليست لوحة متصلة.",
              ),
              locale,
            )}
          </small>
        </div>
      </section>
      <WorldNav
        entries={[
          {
            id: "os-workspace",
            label: w("Espace & rôles", "Workspace & roles", "المساحة والأدوار"),
          },
          { id: "os-workflows", label: w("Parcours", "Workflows", "المسارات") },
          {
            id: "os-activation",
            label: w("Activation", "Activation", "التفعيل"),
          },
        ]}
      />
      <Section
        id="os-workspace"
        title={w(
          "Comprendre chaque couche avant de l’activer.",
          "Understand each layer before activation.",
          "فهم كل طبقة قبل التفعيل.",
        )}
        tone="ink"
      >
        <Explorer
          dimension="workspace-layer"
          variant="workspace"
          choices={[
            {
              label: w("Espace", "Workspace", "المساحة"),
              title: w(
                "Une organisation dans un cadre identifié.",
                "An organisation in an identified framework.",
                "مؤسسة ضمن إطار محدد.",
              ),
              body: w(
                "L’espace relie l’organisation à ses membres et au périmètre retenu.",
                "The workspace connects the organisation with its members and selected scope.",
                "تربط المساحة المؤسسة بأعضائها ونطاقها المختار.",
              ),
              facts: [
                w(
                  "Organisation concernée",
                  "Relevant organisation",
                  "المؤسسة المعنية",
                ),
                w("Membres de l’espace", "Workspace members", "أعضاء المساحة"),
                w("Périmètre du plan", "Plan scope", "نطاق الخطة"),
              ],
            },
            {
              label: w("Rôles", "Roles", "الأدوار"),
              title: w(
                "L’accès découle du rôle autorisé.",
                "Access follows the authorised role.",
                "يتبع الوصول الدور المرخص.",
              ),
              body: w(
                "Le parcours distingue les rôles et applique les règles d’accès prévues dans le portail.",
                "The journey distinguishes roles and applies the portal’s access rules.",
                "يميز المسار الأدوار ويطبق قواعد الوصول للبوابة.",
              ),
              facts: [
                w("Rôle de chaque membre", "Each member’s role", "دور كل عضو"),
                w(
                  "Actions autorisées",
                  "Authorised actions",
                  "الإجراءات المرخصة",
                ),
                w(
                  "Accès à clarifier",
                  "Access to clarify",
                  "ولوج يحتاج إلى توضيح",
                ),
              ],
            },
            {
              label: w("Plan & modules", "Plan & modules", "الخطة والوحدات"),
              title: w(
                "Un périmètre défini par le plan.",
                "A scope defined by the plan.",
                "نطاق تحدده الخطة.",
              ),
              body: w(
                "Les plans publiés indiquent les informations renseignées ; les modules et limites sont précisés pendant la qualification.",
                "Published plans show their provided information; modules and limits are specified during qualification.",
                "تعرض الخطط المنشورة المعلومات المتوفرة وتُوضح الوحدات والحدود أثناء التأهيل.",
              ),
              facts: [
                w("Plan choisi", "Selected plan", "الخطة المختارة"),
                w("Période de facturation", "Billing period", "فترة الفوترة"),
                w(
                  "Modules et limites à confirmer",
                  "Modules and limits to confirm",
                  "الوحدات والحدود للتأكيد",
                ),
              ],
            },
            {
              label: w("Préparation", "Readiness", "الاستعداد"),
              title: w(
                "Préparer les éléments avant l’activation.",
                "Prepare the requirements before activation.",
                "إعداد المتطلبات قبل التفعيل.",
              ),
              body: w(
                "Contexte, membres, plan et contrôles de préparation composent une activation à qualifier.",
                "Context, members, plan and readiness checks shape activation to be qualified.",
                "يشكل السياق والأعضاء والخطة وفحوصات الاستعداد تفعيلًا يحتاج إلى تأهيل.",
              ),
              facts: [
                w(
                  "Contexte de l’organisation",
                  "Organisation context",
                  "سياق المؤسسة",
                ),
                w(
                  "Membres et responsabilités",
                  "Members and responsibilities",
                  "الأعضاء والمسؤوليات",
                ),
                w("Étapes d’activation", "Activation steps", "مراحل التفعيل"),
              ],
            },
          ]}
        />
      </Section>
      <Section
        id="os-workflows"
        kicker={w(
          "LE FONCTIONNEMENT, SANS OPACITÉ",
          "MAKE THE WORKFLOW CLEAR",
          "طريقة عمل واضحة",
        )}
        title={w(
          "Un parcours compréhensible pour votre organisation.",
          "A clear journey for your organisation.",
          "مسار مفهوم لمؤسستكم.",
        )}
      >
        <Dossiers layout="tiles" />
      </Section>
      <Section
        id="os-responsibilities"
        title={w(
          "Qui entre ? Avec quel rôle ? Pour quel périmètre ?",
          "Who joins? In which role? For which scope?",
          "من ينضم وبأي دور وضمن أي نطاق؟",
        )}
        tone="paper"
      >
        <div className={s.roleMap}>
          <div className={s.roleCentre}>
            <Layers3 size={30} />
            <h3>
              {tr(
                w(
                  "Organisation & espace",
                  "Organisation & workspace",
                  "المؤسسة والمساحة",
                ),
                locale,
              )}
            </h3>
          </div>
          <Tiles
            items={[
              {
                title: w(
                  "Responsable de l’organisation",
                  "Organisation representative",
                  "ممثل المؤسسة",
                ),
                body: w(
                  "Préparer le contexte, le choix du plan et les personnes concernées.",
                  "Prepare context, plan choice and relevant people.",
                  "إعداد السياق واختيار الخطة والأشخاص المعنيين.",
                ),
              },
              {
                title: w(
                  "Membre de l’espace",
                  "Workspace member",
                  "عضو المساحة",
                ),
                body: w(
                  "Comprendre son rôle et les accès qui lui sont attribués.",
                  "Understand their role and assigned access.",
                  "فهم الدور والصلاحيات المخصصة.",
                ),
              },
              {
                title: w(
                  "Interlocuteur du projet",
                  "Project contact",
                  "جهة التواصل للمشروع",
                ),
                body: w(
                  "Clarifier les besoins et les modalités d’activation avec l’équipe.",
                  "Clarify needs and activation terms with the team.",
                  "توضيح الاحتياجات وصيغ التفعيل مع الفريق.",
                ),
              },
            ]}
          />
        </div>
      </Section>
      <Section
        id="os-activation"
        title={w(
          "Avant l’activation, une préparation utile.",
          "Before activation, useful preparation.",
          "تحضير مفيد قبل التفعيل.",
        )}
        tone="violet"
      >
        <Steps
          steps={[
            {
              title: w(
                "Décrire l’organisation",
                "Describe the organisation",
                "وصف المؤسسة",
              ),
              body: w(
                "Contexte, objectifs et personnes concernées.",
                "Context, objectives and relevant people.",
                "السياق والأهداف والأشخاص المعنيون.",
              ),
            },
            {
              title: w(
                "Explorer les plans publiés",
                "Explore published plans",
                "استكشاف الخطط المنشورة",
              ),
              body: w(
                "Vérifier les tarifs et périodes renseignés.",
                "Review provided prices and billing periods.",
                "مراجعة الأسعار وفترات الفوترة المتوفرة.",
              ),
            },
            {
              title: w(
                "Clarifier le périmètre",
                "Clarify scope",
                "توضيح النطاق",
              ),
              body: w(
                "Modules, rôles et conditions à préciser.",
                "Modules, roles and conditions to specify.",
                "الوحدات والأدوار والشروط للتوضيح.",
              ),
            },
            {
              title: w(
                "Préparer l’activation",
                "Prepare activation",
                "إعداد التفعيل",
              ),
              body: w(
                "Convenir des éléments et contrôles nécessaires.",
                "Agree required information and checks.",
                "الاتفاق على العناصر والفحوصات اللازمة.",
              ),
            },
          ]}
        />
      </Section>
      <Section
        id="os-fit"
        title={w(
          "Quel fonctionnement souhaitez-vous structurer ?",
          "Which way of working would you like to structure?",
          "أي طريقة عمل ترغبون في تنظيمها؟",
        )}
      >
        <Priorities />
        <Brief />
      </Section>
      <Section
        id="os-clarity"
        title={w(
          "Voir le produit. Comprendre son périmètre.",
          "See the product. Understand its scope.",
          "رؤية المنتج وفهم نطاقه.",
        )}
        tone="ink"
      >
        <div className={s.split}>
          <Picture name="desk" />
          <div>
            <h3>
              {tr(
                w(
                  "Une démonstration commence par vos questions.",
                  "A demonstration starts with your questions.",
                  "يبدأ العرض التوضيحي بأسئلتكم.",
                ),
                locale,
              )}
            </h3>
            <p>
              {tr(
                w(
                  "Préparez votre contexte, les rôles envisagés et les sujets que vous voulez approfondir. Le formulaire ci-dessous enregistre votre demande auprès du parcours public existant.",
                  "Prepare your context, proposed roles and topics you want to explore. The form below records your request through the existing public journey.",
                  "أعدوا السياق والأدوار المقترحة والمواضيع التي ترغبون في تعميقها. يسجل النموذج أدناه الطلب عبر المسار العام.",
                ),
                locale,
              )}
            </p>
            <LinkButton />
          </div>
        </div>
      </Section>
      <Closing
        extraFaq={[
          {
            title: w(
              "Les modules sont-ils tous inclus dans chaque plan ?",
              "Does every plan include every module?",
              "هل تشمل كل خطة جميع الوحدات؟",
            ),
            body: w(
              "Le périmètre dépend du plan choisi. Les informations publiées et la qualification précisent les modules, limites et conditions applicables.",
              "Scope depends on the selected plan. Published information and qualification clarify applicable modules, limits and conditions.",
              "يعتمد النطاق على الخطة المختارة وتوضح المعلومات المنشورة والتأهيل الوحدات والحدود والشروط.",
            ),
          },
        ]}
      />
    </>
  );
}
