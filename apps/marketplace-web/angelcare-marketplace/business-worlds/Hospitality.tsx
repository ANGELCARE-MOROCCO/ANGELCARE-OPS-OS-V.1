"use client";
import { Sun, ArrowDown } from "lucide-react";
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
export function Hospitality() {
  const { locale, native } = useWorld(),
    p = WORLDS.hospitality;
  return (
    <>
      <section className={s.hotelHero} data-business-module="resort-opening">
        <Picture name="hospitality" priority />
        <div className={s.hotelCopy}>
          <span className={s.kicker}>
            <Sun size={20} />
            {tr(p.eyebrow, locale)}
          </span>
          <h1>{native.copy.title || tr(p.title, locale)}</h1>
          <p>{native.copy.lead || tr(p.lead, locale)}</p>
          <div className={s.actions}>
            <LinkButton />
            <LinkButton href="#stay-itinerary" soft>
              {tr(
                w("Imaginer le séjour", "Imagine the stay", "تصور الإقامة"),
                locale,
              )}
            </LinkButton>
          </div>
        </div>
        <div className={s.hotelStamp}>
          ANGELCARE
          <br />
          {tr(
            w("L’expérience famille", "The family experience", "تجربة الأسرة"),
            locale,
          )}
          <ArrowDown />
        </div>
      </section>
      <WorldNav
        entries={[
          {
            id: "stay-itinerary",
            label: w("Le séjour", "The stay", "الإقامة"),
          },
          {
            id: "stay-programmes",
            label: w("Programmes", "Programmes", "البرامج"),
          },
          {
            id: "stay-design",
            label: w("Votre établissement", "Your property", "مؤسستكم"),
          },
        ]}
      />
      <Section
        id="stay-itinerary"
        kicker={w(
          "DU PREMIER BONJOUR AUX DERNIERS SOUVENIRS",
          "FROM FIRST HELLO TO LASTING MEMORIES",
          "من أول ترحيب إلى الذكريات",
        )}
        title={w(
          "Dessiner un séjour à hauteur de famille.",
          "Design a stay through a family’s eyes.",
          "تصميم إقامة من منظور الأسرة.",
        )}
        tone="sand"
      >
        <Explorer
          dimension="stay-moment"
          variant="itinerary"
          choices={[
            {
              label: w("Arrivée", "Arrival", "الوصول"),
              title: w(
                "Les repères commencent dès l’accueil.",
                "Understanding begins at arrival.",
                "تبدأ المعالم عند الاستقبال.",
              ),
              body: w(
                "Présenter les possibilités, les publics concernés et les conditions du programme familial.",
                "Present options, relevant audiences and family programme terms.",
                "عرض الخيارات والفئات وشروط برنامج الأسرة.",
              ),
              photo: "hospitality",
              facts: [
                w(
                  "Informations de séjour",
                  "Stay information",
                  "معلومات الإقامة",
                ),
                w(
                  "Âges et conditions",
                  "Ages and conditions",
                  "الأعمار والشروط",
                ),
                w("Point de contact", "Contact point", "نقطة التواصل"),
              ],
            },
            {
              label: w("Exploration", "Exploration", "الاستكشاف"),
              title: w(
                "Un terrain d’activités à imaginer.",
                "Imagine a world of activities.",
                "تصور عالم من الأنشطة.",
              ),
              body: w(
                "Relier les activités aux âges, aux espaces et au contexte de votre propriété.",
                "Connect activities to ages, spaces and your property context.",
                "ربط الأنشطة بالأعمار والمساحات وسياق المؤسسة.",
              ),
              photo: "games",
              facts: [
                w(
                  "Intérêts et âges",
                  "Interests and ages",
                  "الاهتمامات والأعمار",
                ),
                w(
                  "Espaces disponibles",
                  "Available spaces",
                  "المساحات المتوفرة",
                ),
                w("Rythmes du séjour", "Stay rhythms", "إيقاع الإقامة"),
              ],
            },
            {
              label: w("Temps des parents", "Parents’ time", "وقت الوالدين"),
              title: w(
                "Préparer des modalités claires.",
                "Prepare clear terms.",
                "إعداد صيغ واضحة.",
              ),
              body: w(
                "Les besoins de garde et d’accompagnement doivent être qualifiés selon le contexte et l’offre.",
                "Childcare and support needs should be qualified according to context and offer.",
                "يُحدد نطاق احتياجات الرعاية والدعم وفق السياق والعرض.",
              ),
              photo: "care",
              facts: [
                w("Besoin et durée", "Need and duration", "الحاجة والمدة"),
                w("Conditions d’accès", "Access conditions", "شروط الوصول"),
                w(
                  "Disponibilité à confirmer",
                  "Availability to confirm",
                  "توفر يحتاج إلى تأكيد",
                ),
              ],
            },
            {
              label: w("Moments ensemble", "Time together", "وقت معاً"),
              title: w(
                "Faire place aux souvenirs partagés.",
                "Make room for shared memories.",
                "إفساح مجال للذكريات المشتركة.",
              ),
              body: w(
                "Imaginer des activités familiales cohérentes avec les espaces et le programme convenu.",
                "Imagine family activities consistent with spaces and the agreed programme.",
                "تصور أنشطة أسرية تناسب المساحات والبرنامج المتفق عليه.",
              ),
              photo: "family",
              facts: [
                w(
                  "Objectifs de l’expérience",
                  "Experience objectives",
                  "أهداف التجربة",
                ),
                w(
                  "Publics et participation",
                  "Audiences and participation",
                  "الفئات والمشاركة",
                ),
                w(
                  "Coordination du moment",
                  "Moment coordination",
                  "تنسيق اللحظة",
                ),
              ],
            },
            {
              label: w("Départ", "Departure", "المغادرة"),
              title: w(
                "Une expérience lisible jusqu’au bout.",
                "A clear experience through to the end.",
                "تجربة واضحة حتى النهاية.",
              ),
              body: w(
                "Préparer les transmissions et les informations utiles à la fin du parcours proposé.",
                "Prepare handovers and useful information at the end of the proposed journey.",
                "إعداد تسليم المعلومات المفيدة عند نهاية المسار.",
              ),
              photo: "holidays",
              facts: [
                w(
                  "Retour d’expérience",
                  "Experience feedback",
                  "ملاحظات التجربة",
                ),
                w("Informations utiles", "Useful information", "معلومات مفيدة"),
                w("Suivi convenu", "Agreed follow-up", "المتابعة المتفق عليها"),
              ],
            },
          ]}
        />
      </Section>
      <Section
        id="stay-programmes"
        title={w(
          "Une destination. Plusieurs expériences familiales.",
          "One destination. Several family experiences.",
          "وجهة واحدة وتجارب أسرية متعددة.",
        )}
        lead={w(
          "Chaque programme répond à un contexte différent. Les contenus et conditions se définissent dans le périmètre retenu.",
          "Each programme addresses a different context. Content and conditions are defined within the selected scope.",
          "يستجيب كل برنامج لسياق مختلف وتُحدد المحتويات والشروط ضمن النطاق المختار.",
        )}
      >
        <Dossiers layout="strips" />
      </Section>
      <Section
        id="stay-gallery"
        title={w(
          "Plus que des activités : des façons de vivre le séjour.",
          "More than activities: ways to experience the stay.",
          "أكثر من أنشطة: طرق لعيش الإقامة.",
        )}
        tone="ink"
      >
        <div className={s.hotelGallery}>
          {[
            {
              image: "games",
              title: w("Explorer & jouer", "Explore & play", "استكشاف ولعب"),
            },
            {
              image: "family",
              title: w(
                "Partager en famille",
                "Share as a family",
                "المشاركة كأسرة",
              ),
            },
            {
              image: "montessori",
              title: w(
                "Créer & découvrir",
                "Create & discover",
                "إبداع واكتشاف",
              ),
            },
          ].map((e) => (
            <figure key={e.image}>
              <Picture name={e.image} />
              <figcaption>{tr(e.title, locale)}</figcaption>
            </figure>
          ))}
        </div>
      </Section>
      <Section
        id="stay-design"
        title={w(
          "Votre propriété donne le ton.",
          "Your property sets the tone.",
          "مؤسستكم تحدد الطابع.",
        )}
      >
        <Explorer
          dimension="property-context"
          choices={[
            {
              label: w(
                "Hôtel & séjour urbain",
                "Hotel & city stay",
                "فندق وإقامة حضرية",
              ),
              title: w(
                "Composer avec les temps du séjour.",
                "Work with the rhythm of the stay.",
                "مراعاة إيقاع الإقامة.",
              ),
              body: w(
                "Durées, besoins des familles et espaces disponibles orientent la conception.",
                "Duration, family needs and available spaces guide design.",
                "توجه المدة واحتياجات الأسر والمساحات المتوفرة التصميم.",
              ),
              photo: "hospitality",
              facts: [
                w(
                  "Durées et arrivées",
                  "Lengths of stay and arrivals",
                  "مدة الإقامة والوصول",
                ),
                w(
                  "Espaces mobilisables",
                  "Usable spaces",
                  "مساحات قابلة للاستخدام",
                ),
                w(
                  "Coordination de l’accueil",
                  "Reception coordination",
                  "تنسيق الاستقبال",
                ),
              ],
            },
            {
              label: w("Resort & saison", "Resort & season", "منتجع وموسم"),
              title: w(
                "Préparer une expérience au rythme de la saison.",
                "Prepare an experience shaped by the season.",
                "إعداد تجربة تناسب الموسم.",
              ),
              body: w(
                "Publics, calendrier, activités et organisation du programme doivent être définis ensemble.",
                "Audiences, calendar, activities and programme organisation should be defined together.",
                "تُحدد الفئات والتقويم والأنشطة وتنظيم البرنامج معاً.",
              ),
              photo: "holidays",
              facts: [
                w(
                  "Calendrier et périodes",
                  "Calendar and periods",
                  "التقويم والفترات",
                ),
                w("Âges et groupes", "Ages and groups", "الأعمار والمجموعات"),
                w("Préparation des équipes", "Team preparation", "إعداد الفرق"),
              ],
            },
          ]}
        />
        <Priorities />
        <Brief />
      </Section>
      <Section
        id="stay-anatomy"
        title={w(
          "Les détails font l’expérience.",
          "Details shape the experience.",
          "التفاصيل تشكل التجربة.",
        )}
        tone="sand"
      >
        <Tiles
          items={[
            {
              title: w("Âges & publics", "Ages & audiences", "الأعمار والفئات"),
              body: w(
                "Identifier les enfants et familles concernés par le programme.",
                "Identify children and families covered by the programme.",
                "تحديد الأطفال والأسر المعنية بالبرنامج.",
              ),
            },
            {
              title: w(
                "Espaces & activités",
                "Spaces & activities",
                "المساحات والأنشطة",
              ),
              body: w(
                "Relier les usages aux lieux et aux contenus envisagés.",
                "Connect uses to places and proposed activities.",
                "ربط الاستخدام بالأماكن والأنشطة المقترحة.",
              ),
            },
            {
              title: w(
                "Langues & rythmes",
                "Languages & rhythms",
                "اللغات والإيقاع",
              ),
              body: w(
                "Préciser les besoins de communication et les temps du séjour.",
                "Specify communication needs and stay schedules.",
                "تحديد احتياجات التواصل ومواعيد الإقامة.",
              ),
            },
            {
              title: w(
                "Équipe & transmissions",
                "Team & handovers",
                "الفريق وتسليم المعلومات",
              ),
              body: w(
                "Définir les rôles, l’accueil et les informations utiles.",
                "Define roles, reception and useful information.",
                "تحديد الأدوار والاستقبال والمعلومات المفيدة.",
              ),
            },
          ]}
        />
      </Section>
      <Section
        id="stay-season"
        title={w(
          "Une saison se prépare avant le premier séjour.",
          "A season begins before the first stay.",
          "يُعد الموسم قبل أول إقامة.",
        )}
      >
        <Steps
          steps={[
            {
              title: w("Définir le contexte", "Define context", "تحديد السياق"),
              body: w(
                "Propriété, publics, périodes et objectifs.",
                "Property, audiences, periods and objectives.",
                "المؤسسة والفئات والفترات والأهداف.",
              ),
            },
            {
              title: w(
                "Composer le programme",
                "Shape the programme",
                "تشكيل البرنامج",
              ),
              body: w(
                "Choisir les parcours et préciser les conditions.",
                "Choose pathways and specify conditions.",
                "اختيار المسارات وتوضيح الشروط.",
              ),
            },
            {
              title: w(
                "Préparer l’organisation",
                "Prepare organisation",
                "إعداد التنظيم",
              ),
              body: w(
                "Espaces, équipes, accueil et coordination.",
                "Spaces, teams, reception and coordination.",
                "المساحات والفرق والاستقبال والتنسيق.",
              ),
            },
            {
              title: w(
                "Convenir du suivi",
                "Agree follow-up",
                "الاتفاق على المتابعة",
              ),
              body: w(
                "Définir les modalités du suivi prévu.",
                "Define terms for planned follow-up.",
                "تحديد صيغ المتابعة المقترحة.",
              ),
            },
          ]}
        />
      </Section>
      <Closing />
    </>
  );
}
