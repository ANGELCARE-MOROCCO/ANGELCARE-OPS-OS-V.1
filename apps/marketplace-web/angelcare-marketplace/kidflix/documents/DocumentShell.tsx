"use client";
import Link from "next/link";
import { interpretSearch } from "../journey/contract";
import { navigateKidFlix } from "../navigation-events";
import { UserRound, UsersRound } from "lucide-react";
import {
  useState,
  useCallback,
  useContext,
  createContext,
  type ReactNode,
  type CSSProperties,
} from "react";
import { WORLDS, tr, path, type Locale } from "../catalogue";
import { useGuest } from "../continuity";
import { I } from "../Icons";
import {
  ART,
  documentHref,
  normalizeDocumentSocialLinks,
  type DocumentFilters,
} from "./model";
import s from "./documents.module.css";
const Settings = createContext<{
  edition: Record<string, any>;
  publish: (v: Record<string, any>) => void;
}>({ edition: {}, publish: () => {} });
export function DocumentsSettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [edition, setEdition] = useState<Record<string, any>>({}),
    publish = useCallback((v: Record<string, any>) => setEdition(v), []);
  return (
    <Settings.Provider value={{ edition, publish }}>
      {children}
    </Settings.Provider>
  );
}
export const useDocumentsSettings = () => useContext(Settings);
function SocialMark({ platform }: { platform: string }) {
  const glyph: Record<string, string> = {
    youtube: "▶",
    pinterest: "P",
    instagram: "◎",
    facebook: "f",
  };
  return (
    <span className={s.socialMark} data-platform={platform} aria-hidden="true">
      {glyph[platform]}
    </span>
  );
}
export function ArtIcon({
  index,
  nav = false,
  className = "",
  size,
}: {
  index: number;
  nav?: boolean;
  className?: string;
  size?: number;
}) {
  if (index === 30 && !nav)
    return (
      <span className={s.targetIcon} aria-hidden="true">
        <I name="ArrowUpRight" size={22} />
      </span>
    );
  const columns = nav ? 4 : 6,
    rows = nav ? 4 : 5;
  return (
    <span
      aria-hidden="true"
      className={`${s.artIcon} ${className}`}
      style={
        {
          backgroundImage: `url(${ART}${nav ? "navigation" : "icons"}.png)`,
          backgroundSize: `${columns * 100}% ${rows * 100}%`,
          backgroundPosition: `${((index % columns) * 100) / (columns - 1)}% ${(Math.floor(index / columns) * 100) / (rows - 1)}%`,
          ...(size ? { width: size, height: size } : {}),
        } as CSSProperties
      }
    />
  );
}
export function DocumentsHeader({ locale }: { locale: Locale }) {
  const guest = useGuest(),
    [more, setMore] = useState(false),
    returnTo = documentHref(locale),
    auth = (mode: string) =>
      `/angelcare-marketplace/${locale}/auth/${mode}?returnTo=${encodeURIComponent(returnTo)}`;
  const audiences = [
    ["educator", ["Teachers", "Enseignants", "المعلمون"]],
    ["parent", ["Parents", "Parents", "الآباء"]],
    ["homeschool", ["Homeschoolers", "École à la maison", "التعلم المنزلي"]],
    ["child", ["Kindergarten", "Maternelle", "الروضة"]],
  ] as const;
  return (
    <header className={s.header} data-documents-header>
      <div className={s.utility}>
        <span>
          <I name="Heart" size={13} />
          {tr(
            [
              "Free educational resources for brighter learners!",
              "Des ressources gratuites pour apprendre avec plaisir !",
              "موارد تعليمية مجانية لتعلم أكثر إشراقاً!",
            ],
            locale,
          )}
        </span>
        <span>
          <I name="ShieldCheck" size={13} />
          {tr(
            [
              "Documents, guides and templates — explore freely",
              "Documents, guides et modèles à découvrir librement",
              "وثائق وأدلة ونماذج للاستكشاف بحرية",
            ],
            locale,
          )}
        </span>
        <nav
          aria-label={tr(
            ["Browse by audience", "Explorer par public", "التصفح حسب الجمهور"],
            locale,
          )}
        >
          {audiences.map(([key, label]) => (
            <Link
              key={key}
              href={documentHref(
                locale,
                key === "homeschool"
                  ? { need: "homeschool" }
                  : key === "child"
                    ? { grade: "kindergarten" }
                    : { audience: key },
              )}
            >
              {tr(label, locale)}
            </Link>
          ))}
        </nav>
      </div>
      <div className={s.headerMain}>
        <Link
          href={path(locale)}
          aria-label={tr(
            [
              "KidFlix homepage",
              "Accueil KidFlix",
              "الصفحة الرئيسية لكيدفليكس",
            ],
            locale,
          )}
        >
          <img
            className={s.logo}
            src="/kidflix/kidflix-official-optimized.webp"
            alt="KidFlix"
            width={175}
            height={70}
          />
        </Link>
        <form
          action={path(locale, "/explore")}
          onSubmit={(e) => {
            e.preventDefault();
            const query = String(new FormData(e.currentTarget).get("q") || "");
            navigateKidFlix(
              path(locale, "/explore") +
                "?" +
                new URLSearchParams(interpretSearch(query)),
            );
          }}
          className={s.headerSearch}
          role="search"
        >
          <label className={s.srOnly} htmlFor="documents-global-search">
            {tr(
              [
                "Search KidFlix",
                "Rechercher dans KidFlix",
                "البحث في كيدفليكس",
              ],
              locale,
            )}
          </label>
          <I name="Search" size={18} />
          <input
            id="documents-global-search"
            name="q"
            type="search"
            maxLength={100}
            placeholder={tr(
              [
                "Search for free documents, worksheets, activities and more…",
                "Rechercher documents, fiches, activités et plus…",
                "ابحث عن وثائق وأوراق عمل وأنشطة والمزيد…",
              ],
              locale,
            )}
          />
          <button
            aria-label={tr(
              ["Search KidFlix", "Rechercher dans KidFlix", "ابحث في كيدفليكس"],
              locale,
            )}
          >
            <I name="Search" size={22} />
          </button>
        </form>
        <nav
          className={s.accountNav}
          aria-label={tr(
            [
              "Personal library and account",
              "Bibliothèque et compte",
              "المكتبة والحساب",
            ],
            locale,
          )}
        >
          <Link href={path(locale, "/saved")}>
            <span>
              <I name="Heart" size={25} />
              {guest.ready && guest.saved.length > 0 ? (
                <b>{guest.saved.length}</b>
              ) : null}
            </span>
            {tr(["Favorites", "Favoris", "المفضلة"], locale)}
          </Link>
          <Link href={path(locale, "/my")}>
            <I name="BookOpen" size={25} />
            {tr(["My Library", "Ma bibliothèque", "مكتبتي"], locale)}
          </Link>
          <Link href={auth("login")}>
            <UserRound size={25} aria-hidden="true" />
            {tr(["Sign In", "Connexion", "الدخول"], locale)}
          </Link>
          <Link className={s.join} href={auth("register")}>
            <UsersRound size={20} aria-hidden="true" />
            {tr(["Join Free", "Créer un compte", "انضم مجاناً"], locale)}
          </Link>
        </nav>
      </div>
      <nav
        className={s.categoryNav}
        aria-label={tr(
          [
            "KidFlix resource categories",
            "Catégories de ressources KidFlix",
            "فئات موارد كيدفليكس",
          ],
          locale,
        )}
      >
        {WORLDS.map((w, i) => (
          <Link
            key={w.key}
            href={path(locale, "/explore/" + w.key)}
            aria-current={w.key === "documents" ? "page" : undefined}
          >
            <ArtIcon nav index={i} />
            <span>{tr(w.title, locale)}</span>
          </Link>
        ))}
        <button
          className={s.more}
          aria-expanded={more}
          aria-controls="documents-category-directory"
          onClick={() => setMore((v) => !v)}
        >
          •••<small>{tr(["More", "Plus", "المزيد"], locale)}</small>
        </button>
      </nav>
      {more ? (
        <div id="documents-category-directory" className={s.morePanel}>
          {WORLDS.map((w) => (
            <Link key={w.key} href={path(locale, "/explore/" + w.key)}>
              {tr(w.title, locale)}
            </Link>
          ))}
          <button onClick={() => setMore(false)}>
            {tr(["Close", "Fermer", "إغلاق"], locale)}
          </button>
        </div>
      ) : null}
    </header>
  );
}
export function DocumentsFooter({ locale }: { locale: Locale }) {
  const { edition } = useDocumentsSettings();
  let socialLinks: Record<string, string> = {};
  try {
    socialLinks = normalizeDocumentSocialLinks(edition.documentsSocialLinks);
  } catch {}
  const [email, setEmail] = useState(""),
    [consent, setConsent] = useState(false),
    [state, setState] = useState<"idle" | "busy" | "success" | "error">("idle"),
    [cancelToken, setCancelToken] = useState(""),
    [cancelled, setCancelled] = useState(false);
  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    try {
      const r = await fetch("/api/kidflix/documents/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, email, consent, website: "" }),
      });
      if (!r.ok) throw Error();
      const v = await r.json();
      setCancelToken(
        typeof v.unsubscribeToken === "string" ? v.unsubscribeToken : "",
      );
      setState("success");
    } catch {
      setState("error");
    }
  }
  async function unsubscribe() {
    try {
      const r = await fetch("/api/kidflix/documents/newsletter", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cancelToken }),
      });
      if (!r.ok) throw Error();
      setCancelled(true);
    } catch {
      setState("error");
    }
  }
  const groups = [
    {
      title: ["Explore", "Explorer", "استكشف"] as const,
      links: [
        [
          "All Documents",
          "Tous les documents",
          "كل الوثائق",
          documentHref(locale),
        ],
        [
          "Printables",
          "Fiches à imprimer",
          "أوراق للطباعة",
          path(locale, "/explore/printables"),
        ],
        [
          "Activities",
          "Activités",
          "الأنشطة",
          path(locale, "/explore/activities"),
        ],
        [
          "Learning Paths",
          "Parcours",
          "مسارات التعلم",
          path(locale, "/explore/learning"),
        ],
        [
          "Visual Cards",
          "Cartes visuelles",
          "بطاقات بصرية",
          path(locale, "/explore/visual-cards"),
        ],
      ],
    },
    {
      title: ["Helpful Links", "Liens utiles", "روابط مفيدة"] as const,
      links: [
        [
          "About KidFlix",
          "À propos de KidFlix",
          "عن كيدفليكس",
          path(locale, "/about"),
        ],
        [
          "Resource Library",
          "Bibliothèque",
          "مكتبة الموارد",
          path(locale, "/explore"),
        ],
        [
          "Privacy Policy",
          "Confidentialité",
          "الخصوصية",
          path(locale, "/privacy"),
        ],
        [
          "Accessibility",
          "Accessibilité",
          "إمكانية الوصول",
          path(locale, "/accessibility"),
        ],
      ],
    },
  ];
  return (
    <footer className={s.footer} data-documents-footer>
      <div className={s.footerColumns}>
        <div className={s.footerBrand}>
          <Link href={path(locale)}>
            <img
              src="/kidflix/kidflix-official-optimized.webp"
              alt="KidFlix"
              width={140}
              height={65}
            />
          </Link>
          <p>
            <I name="Heart" size={17} />
            {tr(
              [
                "Free educational resources for brighter learners!",
                "Des ressources gratuites pour apprendre avec plaisir !",
                "موارد تعليمية مجانية لتعلم أكثر إشراقاً!",
              ],
              locale,
            )}
          </p>
        </div>
        {groups.map((g) => (
          <div key={g.title[0]}>
            <h2>{tr(g.title, locale)}</h2>
            {g.links.map(([en, fr, ar, href]) => (
              <Link key={href} href={href}>
                {tr([en, fr, ar], locale)}
              </Link>
            ))}
          </div>
        ))}
        <div>
          <h2>
            {tr(["Join Our Community", "Notre communauté", "مجتمعنا"], locale)}
          </h2>
          <div className={s.socialLinks}>
            {["youtube", "pinterest", "instagram", "facebook"].map(
              (platform) =>
                socialLinks[platform] ? (
                  <a
                    key={platform}
                    href={socialLinks[platform]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platform}
                  >
                    <SocialMark platform={platform} />
                  </a>
                ) : (
                  <span
                    key={platform}
                    role="img"
                    aria-label={
                      platform +
                      " · " +
                      tr(
                        [
                          "channel not configured",
                          "canal non configuré",
                          "القناة غير مهيأة",
                        ],
                        locale,
                      )
                    }
                    title={tr(
                      [
                        "Channel not published",
                        "Canal non publié",
                        "القناة غير منشورة",
                      ],
                      locale,
                    )}
                  >
                    <SocialMark platform={platform} />
                  </span>
                ),
            )}
          </div>
          <div className={s.communityLinks}>
            <Link href={path(locale, "/explore/community")}>
              <I name="MessagesSquare" />
              {tr(
                [
                  "Questions & shared insights",
                  "Questions et regards partagés",
                  "أسئلة ورؤى مشتركة",
                ],
                locale,
              )}
            </Link>
            <Link href={path(locale, "/my")}>
              <I name="BookOpen" />
              {tr(
                [
                  "Your learning library",
                  "Votre bibliothèque",
                  "مكتبتك التعليمية",
                ],
                locale,
              )}
            </Link>
          </div>
          <label className={s.languageLabel}>
            {tr(["Language", "Langue", "اللغة"], locale)}
            <select
              aria-label={tr(
                ["Interface language", "Langue de l’interface", "لغة الواجهة"],
                locale,
              )}
              value={locale}
              onChange={(e) => {
                location.href = documentHref(e.target.value as Locale);
              }}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </label>
        </div>
        <div className={s.newsletter}>
          <h2>
            <I name="MessagesSquare" size={17} />
            {tr(
              [
                "Get Free Resources",
                "Recevoir les ressources",
                "احصل على الموارد",
              ],
              locale,
            )}
          </h2>
          {state === "success" ? (
            <div role="status">
              <p>
                {tr(
                  [
                    "Your request has been recorded. If this address is eligible, it is subscribed to KidFlix resource updates.",
                    "Votre demande est enregistrée. Si cette adresse est éligible, elle est inscrite aux nouveautés KidFlix.",
                    "تم تسجيل طلبك. إذا كان هذا العنوان مؤهلاً فسيشترك في تحديثات موارد كيدفليكس.",
                  ],
                  locale,
                )}
              </p>
              {cancelToken && !cancelled ? (
                <button onClick={unsubscribe}>
                  {tr(
                    [
                      "Cancel this subscription",
                      "Annuler cette inscription",
                      "إلغاء هذا الاشتراك",
                    ],
                    locale,
                  )}
                </button>
              ) : cancelled ? (
                <p>
                  {tr(
                    [
                      "Cancellation processed for this subscription token.",
                      "Annulation traitée pour ce jeton d’inscription.",
                      "تمت معالجة الإلغاء لرمز الاشتراك هذا.",
                    ],
                    locale,
                  )}
                </p>
              ) : null}
            </div>
          ) : (
            <form onSubmit={subscribe}>
              <label className={s.srOnly} htmlFor="documents-newsletter-email">
                {tr(["Email", "Adresse e-mail", "البريد الإلكتروني"], locale)}
              </label>
              <div className={s.newsletterField}>
                <input
                  id="documents-newsletter-email"
                  type="email"
                  maxLength={254}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={tr(
                    [
                      "Enter your email address…",
                      "Votre adresse e-mail…",
                      "عنوان بريدك الإلكتروني…",
                    ],
                    locale,
                  )}
                  autoComplete="email"
                />
                <button disabled={!consent || state === "busy"}>
                  {tr(
                    state === "busy"
                      ? ["Saving…", "Enregistrement…", "جار الحفظ…"]
                      : ["Subscribe", "S’inscrire", "اشترك"],
                    locale,
                  )}
                </button>
              </div>
              <label className={s.consent}>
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                {tr(
                  [
                    "I agree to receive KidFlix resource emails.",
                    "J’accepte de recevoir les nouveautés KidFlix par e-mail.",
                    "أوافق على تلقي رسائل موارد كيدفليكس.",
                  ],
                  locale,
                )}{" "}
                <Link href={path(locale, "/privacy")}>
                  {tr(["Privacy", "Confidentialité", "الخصوصية"], locale)}
                </Link>
              </label>
              {state === "error" ? (
                <p role="alert">
                  {tr(
                    [
                      "Subscription unavailable. Your email has been retained here; please retry.",
                      "Inscription indisponible. Votre saisie est conservée, réessayez.",
                      "الاشتراك غير متاح. احتفظنا بإدخالك هنا، حاول مجدداً.",
                    ],
                    locale,
                  )}
                </p>
              ) : null}
            </form>
          )}
          <small>
            {tr(
              [
                "New resources, seasonal collections and more!",
                "Nouveautés, collections saisonnières et plus !",
                "موارد جديدة ومجموعات موسمية والمزيد!",
              ],
              locale,
            )}
          </small>
        </div>
      </div>
      <div className={s.footerBottom}>
        <small>© {new Date().getFullYear()} KidFlix · AngelCare</small>
        <div>
          {[
            [
              "ShieldCheck",
              ["Respectful resource access", "Accès respectueux", "وصول مسؤول"],
            ],
            [
              "CheckCircle2",
              ["Published & governed", "Publié et gouverné", "منشور ومحكوم"],
            ],
            [
              "BookOpen",
              [
                "For families & educators",
                "Familles et éducateurs",
                "للأسر والمربين",
              ],
            ],
            [
              "Heart",
              [
                "A brighter tomorrow",
                "Un avenir plus lumineux",
                "غد أكثر إشراقاً",
              ],
            ],
          ].map(([icon, label]) => (
            <span key={String(icon)}>
              <I name={String(icon)} size={17} />
              {tr(label as unknown as [string, string, string], locale)}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
