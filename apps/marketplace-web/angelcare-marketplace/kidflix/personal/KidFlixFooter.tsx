"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Bookmark,
  BookOpen,
  Heart,
  Globe,
  Mail,
  ShieldCheck,
  FolderHeart,
  Sparkles,
} from "lucide-react";
import { WORLDS, path, tr, type Locale, type Tri } from "../catalogue";
import { normalizeDocumentSocialLinks } from "../documents/model";
import { usePersonal } from "../journey/store";
import s from "./footer.module.css";
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
    title: ["More to discover", "Encore à découvrir", "المزيد لاكتشافه"],
    keys: ["forms", "community", "commerce", "bundles"],
  },
];
export function KidFlixFooter({
  locale,
  family,
  socialLinks,
}: {
  locale: Locale;
  family?: string;
  socialLinks?: unknown;
}) {
  const p = usePersonal(),
    pathname = usePathname();
  let social: Record<string, string> = {};
  try {
    social = normalizeDocumentSocialLinks(socialLinks);
  } catch {}
  const t = (v: Tri) => tr(v, locale);
  return (
    <footer
      className={s.footer}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-kidflix-personal-footer
    >
      <div className={s.personalBand}>
        <div className={s.bandIcon}>
          <FolderHeart size={32} />
        </div>
        <div>
          <span className={s.kicker}>
            KIDFLIX ·{" "}
            {t([
              "MADE FOR YOUR EVERYDAY",
              "À VOS CÔTÉS, CHAQUE JOUR",
              "معك كل يوم",
            ])}
          </span>
          <h2>
            {t([
              "Your KidFlix, your way",
              "KidFlix, à votre façon",
              "كيدفليكس على طريقتك",
            ])}
          </h2>
          <p>
            {t([
              "Keep your discoveries close. Pick up your learning, shape a collection and prepare what comes next.",
              "Gardez vos découvertes à portée de main. Reprenez, créez une collection et préparez la suite.",
              "احتفظ باكتشافاتك قريبة. تابع تعلّمك ونظّم مجموعاتك واستعد لخطوتك القادمة.",
            ])}
          </p>
        </div>
        <div className={s.bandActions}>
          <Link href={path(locale, "/my")} className={s.primary}>
            <BookOpen size={17} />
            {t(["Open my library", "Ouvrir ma bibliothèque", "افتح مكتبتي"])}
            <ArrowRight size={16} />
          </Link>
          <Link href={path(locale, "/saved")}>
            <Heart size={15} />
            {p.ready ? p.data.saved.length : "—"}{" "}
            {t(["saved", "favoris", "محفوظ"])}{" "}
            <span>
              · {t(["On this browser", "Sur ce navigateur", "على هذا المتصفح"])}
            </span>
          </Link>
        </div>
      </div>
      <div className={s.main}>
        <div className={s.brand}>
          <Link
            className={s.logoPlate}
            href={path(locale)}
            aria-label="KidFlix"
          >
            <img
              src="/kidflix/kidflix-official-optimized.webp"
              alt="KidFlix"
              width={174}
              height={70}
              loading="lazy"
            />
          </Link>
          <h3>
            {t([
              "Small discoveries. Endless possibilities.",
              "Petites découvertes. Infinies possibilités.",
              "اكتشافات صغيرة. آفاق لا تنتهي.",
            ])}
          </h3>
          <p>
            {t([
              "Thoughtful resources for families, educators and curious minds. Explore, make, listen and learn at your own pace.",
              "Des ressources pour les familles, les éducateurs et les esprits curieux. Explorez, créez, écoutez et apprenez à votre rythme.",
              "موارد للأسر والمربين والعقول الفضولية. استكشف واصنع واستمع وتعلّم على وتيرتك.",
            ])}
          </p>
          <Link
            className={s.marketplace}
            href={"/angelcare-marketplace/" + locale}
          >
            AngelCare Marketplace <ArrowUpRight size={15} />
          </Link>
        </div>
        {groups.map((g) => (
          <nav className={s.links} aria-label={t(g.title)} key={g.keys[0]}>
            <h3>{t(g.title)}</h3>
            {g.keys.map((k) => (
              <Link
                key={k}
                href={path(locale, "/explore/" + k)}
                aria-current={family === k ? "page" : undefined}
              >
                {t(WORLDS.find((w) => w.key === k)!.title)}
                <ArrowUpRight size={12} />
              </Link>
            ))}
          </nav>
        ))}
        <nav
          className={s.links}
          aria-label={t([
            "Your space & support",
            "Votre espace et aide",
            "مساحتك والمساعدة",
          ])}
        >
          <h3>
            {t([
              "Your space & support",
              "Votre espace et aide",
              "مساحتك والمساعدة",
            ])}
          </h3>
          {(
            [
              ["/my", ["My library", "Ma bibliothèque", "مكتبتي"]],
              [
                "/saved",
                ["Saved discoveries", "Mes favoris", "اكتشافاتي المحفوظة"],
              ],
              [
                "/my?tab=collections",
                ["My collections", "Mes collections", "مجموعاتي"],
              ],
              [
                "/my?tab=session",
                ["Plan a session", "Préparer une séance", "خطط لجلسة"],
              ],
              [
                "/about",
                ["About KidFlix", "À propos de KidFlix", "عن كيدفليكس"],
              ],
              [
                "/accessibility",
                ["Accessibility", "Accessibilité", "إمكانية الوصول"],
              ],
            ] as const
          ).map(([href, label]) => (
            <Link key={String(href)} href={path(locale, String(href))}>
              {t(label)}
              <ArrowUpRight size={12} />
            </Link>
          ))}
        </nav>
      </div>
      <div className={s.communityRow}>
        <section className={s.socialPanel}>
          <span className={s.kicker}>
            <Sparkles size={14} />
            {t(["LET’S STAY CONNECTED", "RESTONS EN LIEN", "لنبقَ على تواصل"])}
          </span>
          <h3>
            {t([
              "More inspiration, together",
              "Plus d’inspiration, ensemble",
              "إلهام أكثر، معاً",
            ])}
          </h3>
          <p>
            {t([
              "Explore our community and find ideas for your next discovery.",
              "Retrouvez notre communauté et de nouvelles idées à explorer.",
              "اكتشف مجتمعنا وأفكاراً لاكتشافاتك القادمة.",
            ])}
          </p>
          <div className={s.socials}>
            {["youtube", "instagram", "pinterest", "facebook"].map(
              (platform) => {
                const label =
                  platform === "youtube"
                    ? "YouTube"
                    : platform[0].toUpperCase() + platform.slice(1);
                const contents = (
                  <>
                    <img
                      src={"/kidflix/brand-social-r1/" + platform + ".svg"}
                      width={27}
                      height={27}
                      alt=""
                    />
                    <span>{label}</span>
                  </>
                );
                return social[platform] ? (
                  <a
                    key={platform}
                    href={social[platform]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                  >
                    {contents}
                    <ArrowUpRight size={12} />
                  </a>
                ) : (
                  <span
                    key={platform}
                    title={t([
                      "Channel link not published",
                      "Lien du canal non publié",
                      "رابط القناة غير منشور",
                    ])}
                  >
                    {contents}
                  </span>
                );
              },
            )}
          </div>
          <Link
            className={s.communityLink}
            href={path(locale, "/explore/community")}
          >
            {t([
              "Explore questions & shared insights",
              "Explorer les questions et regards partagés",
              "استكشف الأسئلة والرؤى المشتركة",
            ])}
            <ArrowRight size={15} />
          </Link>
        </section>
        <Newsletter locale={locale} />
      </div>
      <div className={s.bottom}>
        <span>© {new Date().getFullYear()} KidFlix · AngelCare</span>
        <div>
          <Link href={path(locale, "/privacy")}>
            <ShieldCheck size={14} />
            {t(["Privacy", "Confidentialité", "الخصوصية"])}
          </Link>
          <Link href={path(locale, "/my?tab=preferences")}>
            {t(["My preferences", "Mes préférences", "تفضيلاتي"])}
          </Link>
          <label>
            <Globe size={15} />
            <span className={s.srOnly}>
              {t([
                "Interface language",
                "Langue de l’interface",
                "لغة الواجهة",
              ])}
            </span>
            <select
              value={locale}
              onChange={(e) => {
                const target = (pathname || path(locale)).replace(
                  /^\/kidflix\/(en|fr|ar)(?=\/|$)/,
                  "/kidflix/" + e.target.value,
                );
                location.assign(target + location.search + location.hash);
              }}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </label>
        </div>
      </div>
    </footer>
  );
}
function Newsletter({ locale }: { locale: Locale }) {
  const t = (v: Tri) => tr(v, locale),
    id = useId(),
    [email, setEmail] = useState(""),
    [consent, setConsent] = useState(false),
    [status, setStatus] = useState<"idle" | "busy" | "success">("idle"),
    [error, setError] = useState(false),
    [token, setToken] = useState(""),
    [cancelled, setCancelled] = useState(false),
    [cancelBusy, setCancelBusy] = useState(false),
    controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function request(method: "POST" | "DELETE", body: unknown) {
    controller.current?.abort();
    const c = new AbortController();
    controller.current = c;
    const timer = setTimeout(() => c.abort(), 30000);
    try {
      const r = await fetch("/api/kidflix/documents/newsletter", {
        method,
        signal: c.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw Error();
      return await r.json();
    } finally {
      clearTimeout(timer);
    }
  }
  async function subscribe(e: FormEvent) {
    e.preventDefault();
    if (!consent || status === "busy") return;
    setStatus("busy");
    setError(false);
    try {
      const v = await request("POST", { locale, email, consent, website: "" });
      setToken(
        typeof v.unsubscribeToken === "string" ? v.unsubscribeToken : "",
      );
      setStatus("success");
    } catch {
      setStatus("idle");
      setError(true);
    }
  }
  async function cancel() {
    if (!token || cancelBusy) return;
    setCancelBusy(true);
    setError(false);
    try {
      await request("DELETE", { token });
      setCancelled(true);
    } catch {
      setError(true);
    } finally {
      setCancelBusy(false);
    }
  }
  return (
    <section className={s.newsletter}>
      <span className={s.kicker}>
        <Mail size={14} />
        {t([
          "A LITTLE INSPIRATION IN YOUR INBOX",
          "UN PEU D’INSPIRATION DANS VOTRE BOÎTE MAIL",
          "إلهام صغير في بريدك",
        ])}
      </span>
      <h3>
        {t([
          "Fresh ideas for brighter days",
          "De nouvelles idées pour apprendre",
          "أفكار جديدة لأيام أكثر إشراقاً",
        ])}
      </h3>
      <p>
        {t([
          "Resource updates, seasonal collections and useful discoveries from KidFlix.",
          "Nouveautés, collections saisonnières et découvertes utiles de KidFlix.",
          "تحديثات الموارد والمجموعات الموسمية واكتشافات مفيدة من كيدفليكس.",
        ])}
      </p>
      {status === "success" ? (
        <div className={s.success} role="status">
          <ShieldCheck size={20} />
          <p>
            {t(
              cancelled
                ? [
                    "Cancellation processed for this subscription.",
                    "Annulation traitée pour cette inscription.",
                    "تمت معالجة إلغاء هذا الاشتراك.",
                  ]
                : [
                    "Your request is recorded. If this address is eligible, it is subscribed to resource updates.",
                    "Votre demande est enregistrée. Si cette adresse est éligible, elle est inscrite aux nouveautés.",
                    "تم تسجيل طلبك. إذا كان هذا العنوان مؤهلاً فسيشترك في تحديثات الموارد.",
                  ],
            )}
          </p>
          {token && !cancelled ? (
            <button disabled={cancelBusy} onClick={() => void cancel()}>
              {t(
                cancelBusy
                  ? ["Processing…", "Traitement…", "جارٍ التنفيذ…"]
                  : [
                      "Cancel this subscription",
                      "Annuler cette inscription",
                      "إلغاء هذا الاشتراك",
                    ],
              )}
            </button>
          ) : null}
        </div>
      ) : (
        <form onSubmit={subscribe}>
          <label className={s.srOnly} htmlFor={id}>
            {t(["Email address", "Adresse e-mail", "البريد الإلكتروني"])}
          </label>
          <div className={s.emailRow}>
            <input
              id={id}
              type="email"
              required
              autoComplete="email"
              maxLength={254}
              placeholder={t([
                "Your email address",
                "Votre adresse e-mail",
                "عنوان بريدك الإلكتروني",
              ])}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button disabled={!consent || status === "busy"}>
              {t(
                status === "busy"
                  ? ["Saving…", "Enregistrement…", "جارٍ الحفظ…"]
                  : ["Subscribe", "S’inscrire", "اشترك"],
              )}
              <ArrowRight size={16} />
            </button>
          </div>
          <label className={s.consent}>
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              {t([
                "I agree to receive KidFlix resource emails.",
                "J’accepte de recevoir les nouveautés KidFlix par e-mail.",
                "أوافق على تلقي رسائل موارد كيدفليكس.",
              ])}{" "}
              <Link href={path(locale, "/privacy")}>
                {t(["Privacy", "Confidentialité", "الخصوصية"])}
              </Link>
            </span>
          </label>
        </form>
      )}
      {error ? (
        <p role="alert" className={s.error}>
          {t([
            "This request could not be completed. Your entry is kept; please retry.",
            "La demande n’a pas abouti. Votre saisie est conservée, réessayez.",
            "تعذر إتمام الطلب. احتفظنا بإدخالك، حاول مجدداً.",
          ])}
        </p>
      ) : null}
    </section>
  );
}
