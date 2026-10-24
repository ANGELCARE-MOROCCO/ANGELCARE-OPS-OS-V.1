import Link from "next/link";
import { WORLDS, path, tr, type Locale, type Tri } from "./catalogue";
import { I } from "./Icons";
import s from "./reference-shell.module.css";
export function ReferenceFooter({ locale }: { locale: Locale }) {
  const groups: { title: Tri; keys: string[] }[] = [
    {
      title: [
        "Read, watch & learn",
        "Lire, regarder et apprendre",
        "اقرأ وشاهد وتعلّم",
      ],
      keys: [
        "documents",
        "stories",
        "learning",
        "video",
        "audio",
        "presentations",
      ],
    },
    {
      title: [
        "Practise, create & prepare",
        "Pratiquer, créer et préparer",
        "تدرّب واصنع واستعد",
      ],
      keys: [
        "printables",
        "visual-cards",
        "assessments",
        "activities",
        "tools",
        "planners",
      ],
    },
    {
      title: ["Discover more", "Pour aller plus loin", "اكتشف المزيد"],
      keys: ["forms", "community", "commerce", "bundles"],
    },
  ];
  return (
    <footer className={s.footer} data-reference-footer>
      <div className={s.footerTop}>
        <div className={s.brandPanel}>
          <Link href={path(locale)}>
            <img
              src="/kidflix/kidflix-official-optimized.webp"
              alt="KidFlix"
              width={174}
              height={70}
              loading="lazy"
            />
          </Link>
          <p>
            {tr(
              [
                "Useful resources. Thoughtful learning. A little discovery, every day.",
                "Des ressources utiles, des apprentissages réfléchis et une découverte chaque jour.",
                "موارد مفيدة وتعلّم واعٍ واكتشاف صغير كل يوم.",
              ],
              locale,
            )}
          </p>
          <Link href={"/angelcare-marketplace/" + locale}>
            AngelCare Marketplace
            <I name="ArrowUpRight" size={13} />
          </Link>
        </div>
        {groups.map((group) => (
          <div className={s.footerGroup} key={group.title[0]}>
            <h2>{tr(group.title, locale)}</h2>
            {group.keys.map((key) => (
              <Link key={key} href={path(locale, "/explore/" + key)}>
                {tr(WORLDS.find((w) => w.key === key)!.title, locale)}
              </Link>
            ))}
          </div>
        ))}
        <div className={s.footerHelp}>
          <h2>
            {tr(
              [
                "Your next discovery",
                "Votre prochaine découverte",
                "اكتشافك القادم",
              ],
              locale,
            )}
          </h2>
          <p>
            {tr(
              [
                "Keep useful resources in your personal workspace and return when you are ready.",
                "Gardez vos ressources utiles dans votre espace personnel et retrouvez-les à votre rythme.",
                "احتفظ بالموارد المفيدة في مساحتك الشخصية وعُد إليها حين تشاء.",
              ],
              locale,
            )}
          </p>
          <Link className={s.footerCTA} href={path(locale, "/my")}>
            <I name="Bookmark" size={15} />
            {tr(
              ["Open my workspace", "Ouvrir mon espace", "افتح مساحتي"],
              locale,
            )}
          </Link>
          <Link href={path(locale, "/about")}>
            {tr(
              ["About KidFlix", "À propos de KidFlix", "عن كيدفليكس"],
              locale,
            )}
          </Link>
        </div>
      </div>
      <div className={s.footerBottom}>
        <span>© {new Date().getFullYear()} KidFlix · AngelCare</span>
        <div>
          <Link href={path(locale, "/privacy")}>
            {tr(["Privacy", "Confidentialité", "الخصوصية"], locale)}
          </Link>
          <Link href={path(locale, "/accessibility")}>
            {tr(["Accessibility", "Accessibilité", "إمكانية الوصول"], locale)}
          </Link>
          <span>
            <I name="Globe" size={13} />
            EN · FR · العربية
          </span>
        </div>
      </div>
    </footer>
  );
}
