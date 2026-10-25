"use client";
import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderHeart,
  FolderPlus,
  Heart,
  LayoutGrid,
  List,
  LoaderCircle,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Settings2,
  Share2,
  Sparkles,
  Trash2,
  Undo2,
  UserRound,
  X,
  SlidersHorizontal,
  CalendarDays,
  Compass,
  ShieldCheck,
} from "lucide-react";
import {
  WORLDS,
  path,
  tr,
  world,
  type Locale,
  type Resource,
  type Tri,
} from "../catalogue";
import { usePersonal } from "../journey/store";
import {
  LIMITS,
  cleanKeys,
  type Collection,
  type LibraryProfile,
  type Personal,
} from "../journey/contract";
import { Workspace } from "../journey/Workspace";
import { useLibraryResources } from "./useLibraryResources";
import {
  TABS,
  collectionId,
  latestActivity,
  tabKeys,
  filterLibrary,
  relatedFamilies,
  type LibraryTab,
} from "./library-model";
import s from "./library.module.css";
const COPY: Record<string, Tri> = {
  overview: ["My library", "Ma bibliothèque", "مكتبتي"],
  saved: ["Saved discoveries", "Mes favoris", "اكتشافاتي المحفوظة"],
  progress: ["Continue learning", "Reprendre mes découvertes", "تابع تعلّمك"],
  collections: ["My collections", "Mes collections", "مجموعاتي"],
  session: ["Session planner", "Préparer une séance", "مخطط الجلسات"],
  recent: ["Recently explored", "Explorés récemment", "استكشفت مؤخراً"],
  complete: ["Completed", "Terminés", "مكتملة"],
  prepared: ["Prepared resources", "Ressources préparées", "موارد جاهزة"],
  profile: ["Make it yours", "À votre image", "اجعلها لك"],
  preferences: [
    "Preferences & privacy",
    "Préférences et confidentialité",
    "التفضيلات والخصوصية",
  ],
  device: ["On this browser", "Sur ce navigateur", "على هذا المتصفح"],
  local: [
    "Your library is stored on this browser. It is not synced between devices. Saved items and activity are retained for up to 90 days.",
    "Votre bibliothèque est conservée sur ce navigateur, sans synchronisation entre appareils. Favoris et activité sont conservés jusqu’à 90 jours.",
    "تُحفظ مكتبتك على هذا المتصفح دون مزامنة بين الأجهزة. تبقى المحفوظات والنشاط لمدة تصل إلى 90 يوماً.",
  ],
  explore: [
    "Explore all resources",
    "Explorer les ressources",
    "استكشف الموارد",
  ],
  search: [
    "Search this view",
    "Rechercher dans cette vue",
    "ابحث في هذا القسم",
  ],
  all: ["All categories", "Toutes les catégories", "كل الفئات"],
  status: ["All statuses", "Tous les états", "كل الحالات"],
  order: ["Library order", "Ordre de la bibliothèque", "ترتيب المكتبة"],
  title: ["Title A–Z", "Titre A–Z", "حسب العنوان"],
  duration: ["Shortest first", "Durée croissante", "الأقصر أولاً"],
  new: ["Not started", "Pas encore commencé", "لم تبدأ بعد"],
  unavailable: [
    "Currently unavailable",
    "Actuellement indisponible",
    "غير متاح حالياً",
  ],
  missing: [
    "This resource is not currently published in this language. Its saved reference is kept.",
    "Cette ressource n’est pas publiée actuellement dans cette langue. Sa référence reste conservée.",
    "هذا المورد غير منشور حالياً بهذه اللغة. احتفظنا بمرجعه المحفوظ.",
  ],
  empty: [
    "Your next discovery belongs here",
    "Votre prochaine découverte a sa place ici",
    "اكتشافك القادم يبدأ هنا",
  ],
  emptySub: [
    "Save a resource as you explore. Your useful discoveries, collections and learning activity will gather here.",
    "Enregistrez une ressource pendant votre exploration. Retrouvez ici vos favoris, collections et activités.",
    "احفظ مورداً أثناء الاستكشاف. ستجتمع هنا اكتشافاتك المفيدة ومجموعاتك ونشاطك التعليمي.",
  ],
  emptyFilter: [
    "No matches in this view",
    "Aucun résultat dans cette vue",
    "لا نتائج في هذا القسم",
  ],
  clearFilters: [
    "Reset filters",
    "Réinitialiser les filtres",
    "إعادة ضبط المرشحات",
  ],
  open: ["Open resource", "Ouvrir la ressource", "افتح المورد"],
  resume: ["Continue", "Reprendre", "تابع"],
  save: ["Save resource", "Enregistrer la ressource", "احفظ المورد"],
  unsave: ["Remove from saved", "Retirer des favoris", "إزالة من المحفوظات"],
  select: ["Select resource", "Sélectionner la ressource", "حدد المورد"],
  selected: ["selected", "sélectionnés", "محدد"],
  selectPage: ["Select this page", "Sélectionner cette page", "حدد هذه الصفحة"],
  clearSelection: ["Clear selection", "Effacer la sélection", "إلغاء التحديد"],
  grid: ["Grid view", "Vue grille", "عرض شبكي"],
  list: ["List view", "Vue liste", "عرض قائمة"],
  create: ["New collection", "Nouvelle collection", "مجموعة جديدة"],
  addCollection: [
    "Add to collection",
    "Ajouter à une collection",
    "أضف إلى مجموعة",
  ],
  collectionName: ["Collection name", "Nom de la collection", "اسم المجموعة"],
  chooseCollection: [
    "Choose a collection",
    "Choisir une collection",
    "اختر مجموعة",
  ],
  rename: ["Rename", "Renommer", "تغيير الاسم"],
  delete: ["Delete collection", "Supprimer la collection", "حذف المجموعة"],
  cancel: ["Cancel", "Annuler", "إلغاء"],
  saveChanges: ["Save changes", "Enregistrer", "احفظ التغييرات"],
  add: ["Add", "Ajouter", "أضف"],
  undo: ["Undo", "Annuler l’action", "تراجع"],
  removed: [
    "Removed from saved. Your collections and session plan are kept.",
    "Retiré des favoris. Vos collections et votre séance sont conservées.",
    "تمت الإزالة من المحفوظات. احتفظنا بمجموعاتك وخطة جلستك.",
  ],
  deleted: [
    "Collection deleted. Saved resources are kept.",
    "Collection supprimée. Les favoris sont conservés.",
    "حُذفت المجموعة. احتفظنا بالموارد المحفوظة.",
  ],
  restored: ["Restored", "Rétabli", "تمت الاستعادة"],
  collectionSaved: [
    "Collection updated",
    "Collection enregistrée",
    "تم تحديث المجموعة",
  ],
  limit: [
    "This action exceeds the library capacity. Make some space and retry.",
    "Cette action dépasse la capacité de la bibliothèque. Libérez de la place puis réessayez.",
    "يتجاوز هذا الإجراء سعة المكتبة. أفرغ بعض المساحة ثم أعد المحاولة.",
  ],
  addSession: ["Add to session", "Ajouter à la séance", "أضف إلى الجلسة"],
  sessionAdded: [
    "Eligible resources added to your session. Unavailable or restricted resources were skipped.",
    "Les ressources autorisées sont ajoutées à votre séance. Les ressources indisponibles ou restreintes ont été ignorées.",
    "أُضيفت الموارد المسموح بها إلى جلستك. تم تجاوز الموارد غير المتاحة أو المقيّدة.",
  ],
  error: [
    "We could not refresh your library. Your saved references are safe. Please retry.",
    "Impossible d’actualiser la bibliothèque. Vos références sont conservées. Réessayez.",
    "تعذر تحديث مكتبتك. مراجعك المحفوظة آمنة. حاول مجدداً.",
  ],
  retry: ["Try again", "Réessayer", "حاول مجدداً"],
  loading: [
    "Bringing your library together…",
    "Votre bibliothèque se prépare…",
    "نجمع محتويات مكتبتك…",
  ],
  busy: ["Working…", "Traitement…", "جارٍ التنفيذ…"],
  share: ["Share resource", "Partager la ressource", "شارك المورد"],
  copy: ["Copy link", "Copier le lien", "انسخ الرابط"],
  copied: ["Link copied", "Lien copié", "تم نسخ الرابط"],
  shareFallback: [
    "Copy this resource link",
    "Copiez ce lien vers la ressource",
    "انسخ رابط هذا المورد",
  ],
  resources: ["resources", "ressources", "موارد"],
  noCollection: [
    "Give your discoveries a home",
    "Organisez vos découvertes",
    "امنح اكتشافاتك مكاناً",
  ],
  collectionSub: [
    "Group ideas for a lesson, a family moment or a project. One resource can belong to several collections.",
    "Rassemblez les idées pour une séance, un moment en famille ou un projet. Une ressource peut appartenir à plusieurs collections.",
    "اجمع الأفكار لدرس أو لحظة عائلية أو مشروع. يمكن أن ينتمي المورد إلى أكثر من مجموعة.",
  ],
  discover: [
    "Picked around your interests",
    "Autour de vos centres d’intérêt",
    "حول اهتماماتك",
  ],
  discoverSub: [
    "Explore the interests you chose and the categories you have saved.",
    "Explorez vos centres d’intérêt et les catégories de vos favoris.",
    "استكشف اهتماماتك المختارة وفئات مواردك المحفوظة.",
  ],
  profileSaved: [
    "Your library profile is saved on this browser.",
    "Votre profil est enregistré sur ce navigateur.",
    "حُفظ ملف مكتبتك على هذا المتصفح.",
  ],
  storage: [
    "Your browser could not save changes. Keep this page open and check your browser storage settings.",
    "Le navigateur n’a pas pu enregistrer les modifications. Gardez cette page ouverte et vérifiez son stockage.",
    "تعذر حفظ التغييرات في المتصفح. أبقِ هذه الصفحة مفتوحة وتحقق من إعدادات التخزين.",
  ],
  back: ["Back to all collections", "Toutes les collections", "كل المجموعات"],
  next: ["Next page", "Page suivante", "الصفحة التالية"],
  previous: ["Previous page", "Page précédente", "الصفحة السابقة"],
  viewAll: ["View all", "Tout voir", "عرض الكل"],
};
const icons = {
  overview: BookOpen,
  saved: Heart,
  progress: Play,
  collections: FolderHeart,
  session: CalendarDays,
  recent: Clock,
  complete: CheckCircle2,
  prepared: Bookmark,
  profile: UserRound,
  preferences: Settings2,
};
const tx = (key: string, locale: Locale) =>
  tr(COPY[key] || [key, key, key], locale);
function Dialog({
  locale,
  title,
  children,
  onClose,
}: {
  locale: Locale;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => {
      d?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <button
          className={s.iconButton}
          onClick={onClose}
          aria-label={tr(["Close", "Fermer", "إغلاق"], locale)}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
function Empty({
  locale,
  filtered = false,
  reset,
}: {
  locale: Locale;
  filtered?: boolean;
  reset?: () => void;
}) {
  return (
    <div className={s.empty}>
      <span>
        <FolderHeart size={38} />
      </span>
      <h3>{tx(filtered ? "emptyFilter" : "empty", locale)}</h3>
      <p>{tx("emptySub", locale)}</p>
      {filtered ? (
        <button className={s.primary} onClick={reset}>
          {tx("clearFilters", locale)}
        </button>
      ) : (
        <Link href={path(locale, "/explore")} className={s.primary}>
          {tx("explore", locale)}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
function LibraryCard({
  resource,
  resourceKey,
  locale,
  activity,
  selected,
  onSelect,
  onCollection,
  onSession,
  onShare,
  onRemove,
}: {
  resource?: Resource;
  resourceKey: string;
  locale: Locale;
  activity?: ReturnType<typeof latestActivity> extends Map<string, infer A>
    ? A
    : never;
  selected?: boolean;
  onSelect?: () => void;
  onCollection?: (keys: string[]) => void;
  onSession?: (keys: string[]) => void;
  onShare?: (r: Resource) => void;
  onRemove?: () => void;
}) {
  const p = usePersonal(),
    saved = p.data.saved.some((x) => x.key === resourceKey),
    [broken, setBroken] = useState(false),
    r = resource;
  const label = activity?.complete
    ? "complete"
    : activity?.started
      ? "progress"
      : activity?.prepared
        ? "prepared"
        : "new";
  return (
    <article
      className={`${s.card} ${selected ? s.cardSelected : ""} ${!r ? s.missingCard : ""}`}
      data-library-resource={resourceKey}
    >
      <div className={s.cardTop}>
        {onSelect ? (
          <label className={s.cardSelect}>
            <input
              type="checkbox"
              checked={Boolean(selected)}
              onChange={onSelect}
              aria-label={tx("select", locale) + (r ? " · " + r.title : "")}
            />
          </label>
        ) : null}
        {r ? (
          <button
            className={`${s.saveButton} ${saved ? s.isSaved : ""}`}
            onClick={() => p.toggle(resourceKey)}
            aria-label={tx(saved ? "unsave" : "save", locale)}
            aria-pressed={saved}
          >
            <Heart size={17} fill={saved ? "currentColor" : "none"} />
          </button>
        ) : null}
      </div>
      {r ? (
        <Link
          href={path(locale, "/experience/" + encodeURIComponent(resourceKey))}
          className={s.cover}
          tabIndex={-1}
          aria-hidden="true"
        >
          {r.image && !broken ? (
            <img
              src={r.image}
              alt=""
              loading="lazy"
              onError={() => setBroken(true)}
            />
          ) : (
            <span className={s.coverFallback}>
              <BookOpen size={38} />
              <span>
                {tr(
                  world(r.family)?.title || ["KidFlix", "KidFlix", "كيدفليكس"],
                  locale,
                )}
              </span>
            </span>
          )}
          <span className={s.familyPill}>
            {tr(
              world(r.family)?.title || ["KidFlix", "KidFlix", "كيدفليكس"],
              locale,
            )}
          </span>
        </Link>
      ) : (
        <div className={s.coverFallback}>
          <Bookmark size={33} />
          <span>{tx("unavailable", locale)}</span>
        </div>
      )}
      <div className={s.cardBody}>
        <span
          className={`${s.statusPill} ${activity?.complete ? s.statusDone : ""}`}
        >
          {activity?.complete ? (
            <Check size={12} />
          ) : (
            <span className={s.statusDot} />
          )}{" "}
          {tx(r ? label : "unavailable", locale)}
        </span>
        <h3>
          {r ? (
            <Link
              href={path(
                locale,
                "/experience/" + encodeURIComponent(resourceKey),
              )}
            >
              {r.title}
            </Link>
          ) : (
            resourceKey
          )}
        </h3>
        <p className={s.summary}>{r ? r.summary : tx("missing", locale)}</p>
        {r ? (
          <>
            <div className={s.meta}>
              {r.duration !== null && r.duration > 0 ? (
                <span>
                  <Clock size={12} />
                  {r.duration} min
                </span>
              ) : null}
              {r.ageMin !== null || r.ageMax !== null ? (
                <span>
                  {tr(["Ages", "Âges", "العمر"], locale)} {r.ageMin ?? 0}
                  {r.ageMax !== null ? "–" + r.ageMax : "+"}
                </span>
              ) : null}
              {r.formats?.length ? (
                <span>{r.formats.slice(0, 2).join(" · ")}</span>
              ) : null}
            </div>
            <div className={s.cardActions}>
              <Link
                href={path(
                  locale,
                  "/experience/" + encodeURIComponent(resourceKey),
                )}
              >
                {activity?.started && !activity.complete ? (
                  <Play size={13} />
                ) : (
                  <ArrowUpRight size={14} />
                )}{" "}
                {tx(
                  activity?.started && !activity.complete ? "resume" : "open",
                  locale,
                )}
              </Link>
              <div>
                {onCollection ? (
                  <button
                    className={s.iconButton}
                    onClick={() => onCollection([resourceKey])}
                    aria-label={tx("addCollection", locale)}
                  >
                    <FolderPlus size={16} />
                  </button>
                ) : null}
                {onSession ? (
                  <button
                    className={s.iconButton}
                    onClick={() => onSession([resourceKey])}
                    aria-label={tx("addSession", locale)}
                  >
                    <Plus size={16} />
                  </button>
                ) : null}
                {onShare ? (
                  <button
                    className={s.iconButton}
                    onClick={() => onShare(r)}
                    aria-label={tx("share", locale)}
                  >
                    <Share2 size={15} />
                  </button>
                ) : null}
              </div>
            </div>
          </>
        ) : onRemove ? (
          <button className={s.textButton} onClick={onRemove}>
            <Trash2 size={14} />
            {tx("unsave", locale)}
          </button>
        ) : null}
      </div>
    </article>
  );
}
function ProfilePanel({ locale }: { locale: Locale }) {
  const p = usePersonal(),
    [profile, set] = useState<LibraryProfile>(p.data.profile),
    [saved, setSaved] = useState(false),
    t = (v: Tri) => tr(v, locale);
  useEffect(() => set(p.data.profile), [p.ready, p.data.profile]);
  return (
    <form
      className={s.profileForm}
      onSubmit={(e) => {
        e.preventDefault();
        p.change((d) => ({ ...d, profile }));
        setSaved(true);
      }}
    >
      <div className={s.sectionIntro}>
        <UserRound size={27} />
        <div>
          <h2>{tx("profile", locale)}</h2>
          <p>
            {t([
              "Choose what feels relevant. Your choices shape the discovery shortcuts in your library.",
              "Choisissez ce qui vous intéresse. Vos choix organisent les raccourcis de découverte de votre bibliothèque.",
              "اختر ما يهمك. تشكّل اختياراتك اختصارات الاستكشاف في مكتبتك.",
            ])}
          </p>
        </div>
      </div>
      <div className={s.formGrid}>
        <label>
          {t([
            "Name or nickname (optional)",
            "Prénom ou surnom (facultatif)",
            "الاسم أو اللقب (اختياري)",
          ])}
          <input
            maxLength={60}
            value={profile.name}
            onChange={(e) => {
              set({ ...profile, name: e.target.value });
              setSaved(false);
            }}
            autoComplete="off"
          />
        </label>
        <label>
          {t(["I explore as…", "J’explore en tant que…", "أستكشف بصفتي…"])}
          <select
            value={profile.role}
            onChange={(e) => {
              set({
                ...profile,
                role: e.target.value as LibraryProfile["role"],
              });
              setSaved(false);
            }}
          >
            {(["family", "educator", "learner", "professional"] as const).map(
              (k, i) => (
                <option key={k} value={k}>
                  {t([
                    [
                      "Family or caregiver",
                      "Educator",
                      "Independent learner",
                      "Professional",
                    ][i],
                    [
                      "Famille ou accompagnant",
                      "Éducateur",
                      "Apprenant autonome",
                      "Professionnel",
                    ][i],
                    ["أسرة أو مقدم رعاية", "مربٍّ", "متعلم مستقل", "متخصص"][i],
                  ])}
                </option>
              ),
            )}
          </select>
        </label>
        <label className={s.goalField}>
          {t([
            "My current learning intention (optional)",
            "Mon intention du moment (facultatif)",
            "نيّتي التعليمية الحالية (اختياري)",
          ])}
          <input
            maxLength={120}
            value={profile.goal}
            placeholder={t([
              "What would you like to explore or prepare?",
              "Que souhaitez-vous explorer ou préparer ?",
              "ما الذي ترغب في استكشافه أو إعداده؟",
            ])}
            onChange={(e) => {
              set({ ...profile, goal: e.target.value });
              setSaved(false);
            }}
          />
        </label>
      </div>
      <fieldset>
        <legend>
          {t(["My interests", "Mes centres d’intérêt", "اهتماماتي"])}
        </legend>
        <div className={s.interestChoices}>
          {WORLDS.map((w) => (
            <label key={w.key}>
              <input
                type="checkbox"
                checked={profile.interests.includes(w.key)}
                onChange={(e) => {
                  set({
                    ...profile,
                    interests: e.target.checked
                      ? [...profile.interests, w.key]
                      : profile.interests.filter((k) => k !== w.key),
                  });
                  setSaved(false);
                }}
              />
              <span>{tr(w.title, locale)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className={s.profileSave}>
        <button className={s.primary} type="submit">
          <Check size={16} />
          {tx("saveChanges", locale)}
        </button>
        {saved ? <span role="status">{tx("profileSaved", locale)}</span> : null}
      </div>
      <p className={s.localNote}>
        <ShieldCheck size={15} />
        {tx("local", locale)}
      </p>
    </form>
  );
}
export function PersonalLibrary({
  locale,
  initialTab = "overview",
}: {
  locale: Locale;
  initialTab?: LibraryTab;
}) {
  const p = usePersonal(),
    [tab, setTab] = useState<LibraryTab>(initialTab),
    [collectionID, setCollectionID] = useState(""),
    [query, setQuery] = useState(""),
    [family, setFamily] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("native"),
    [view, setView] = useState("grid"),
    [page, setPage] = useState(1),
    [selection, setSelection] = useState<string[]>([]),
    [message, setMessage] = useState(""),
    [undo, setUndo] = useState<{
      saved?: Personal["saved"];
      collection?: Collection;
    } | null>(null),
    [editor, setEditor] = useState<{ id?: string; keys: string[] } | null>(
      null,
    ),
    [name, setName] = useState(""),
    [target, setTarget] = useState("new"),
    [shareURL, setShareURL] = useState(""),
    [sessionBusy, setSessionBusy] = useState(false),
    generation = useRef(0);
  const allKeys = useMemo(() => {
    if (tab === "session" || tab === "preferences" || tab === "profile")
      return [];
    const covers = p.data.collections.flatMap((c) => c.keys.slice(0, 3));
    const wanted =
      tab === "overview"
        ? [
            ...p.data.saved.map((x) => x.key),
            ...tabKeys(p.data, "progress", locale).slice(0, 4),
            ...covers,
          ]
        : tab === "collections" && !collectionID
          ? covers
          : tabKeys(p.data, tab, locale, collectionID);
    return cleanKeys(wanted, 2000);
  }, [p.data, locale, tab, collectionID]);
  const resources = useLibraryResources(p.ready ? allKeys : [], locale),
    by = useMemo(
      () => new Map(resources.data.map((r) => [r.key, r])),
      [resources.data],
    ),
    activity = latestActivity(p.data, locale),
    keys = tabKeys(p.data, tab, locale, collectionID),
    filtered = filterLibrary(keys, by, activity, {
      q: query,
      family,
      status,
      sort,
    }),
    pages = Math.max(1, Math.ceil(filtered.length / 24)),
    currentPage = Math.min(page, pages),
    visible = filtered.slice((currentPage - 1) * 24, currentPage * 24),
    t = (v: Tri) => tr(v, locale),
    collection = p.data.collections.find((c) => c.id === collectionID);
  useEffect(() => {
    const sync = () => {
      const q = new URLSearchParams(location.search),
        next = q.get("plan") ? "session" : q.get("tab");
      if (next && TABS.includes(next as LibraryTab)) setTab(next as LibraryTab);
      else setTab(initialTab);
    };
    sync();
    window.addEventListener("popstate", sync);
    const clear = () => {
      generation.current++;
      setUndo(null);
      setSelection([]);
      setEditor(null);
      setCollectionID("");
      setMessage("");
    };
    window.addEventListener("kidflix:cleared", clear);
    return () => {
      generation.current++;
      window.removeEventListener("popstate", sync);
      window.removeEventListener("kidflix:cleared", clear);
    };
  }, [initialTab]);
  useEffect(() => {
    setPage(1);
    setSelection([]);
  }, [tab, query, family, status, sort, collectionID]);
  function navigate(next: LibraryTab) {
    setTab(next);
    setCollectionID("");
    setQuery("");
    setFamily("");
    setStatus("");
    const u = new URL(location.href);
    u.searchParams.set("tab", next);
    if (next !== "session") u.searchParams.delete("plan");
    history.pushState(null, "", u);
  }
  function reset() {
    setQuery("");
    setFamily("");
    setStatus("");
    setSort("native");
  }
  function removeSaved(ids: string[]) {
    const removed = p.data.saved.filter((x) => ids.includes(x.key));
    if (!removed.length) return;
    p.change((d) => ({
      ...d,
      saved: d.saved.filter((x) => !ids.includes(x.key)),
    }));
    setUndo({ saved: removed });
    setSelection([]);
    setMessage(tx("removed", locale));
  }
  function restore() {
    if (!undo) return;
    if (undo.collection && p.data.collections.length >= LIMITS.collections) {
      setMessage(tx("limit", locale));
      return;
    }
    if (
      undo.saved &&
      new Set([
        ...p.data.saved.map((x) => x.key),
        ...undo.saved.map((x) => x.key),
      ]).size > LIMITS.saved
    ) {
      setMessage(tx("limit", locale));
      return;
    }
    p.change((d) => ({
      ...d,
      saved: undo.saved
        ? [...d.saved, ...undo.saved].sort((a, b) => b.at - a.at)
        : d.saved,
      collections:
        undo.collection &&
        !d.collections.some((c) => c.id === undo.collection!.id)
          ? [...d.collections, undo.collection]
          : d.collections,
    }));
    setUndo(null);
    setMessage(tx("restored", locale));
  }
  function openCollection(ids: string[], id?: string) {
    setEditor({ keys: ids, id });
    setName(id ? p.data.collections.find((c) => c.id === id)?.name || "" : "");
    setTarget("new");
  }
  const destination =
      target === "new"
        ? undefined
        : p.data.collections.find((c) => c.id === target),
    editorKeys = editor
      ? cleanKeys([...(destination?.keys || []), ...editor.keys], 2000)
      : [],
    editorOverflow =
      editorKeys.length > LIMITS.collectionItems ||
      (target === "new" &&
        !editor?.id &&
        p.data.collections.length >= LIMITS.collections);
  function saveCollection() {
    if (!editor || editorOverflow) return;
    const old = editor.id
      ? p.data.collections.find((c) => c.id === editor.id)
      : destination;
    if ((target === "new" || editor.id) && !name.trim()) return;
    const next: Collection = {
      id: old?.id || collectionId(),
      name:
        editor.id || target === "new" ? name.trim().slice(0, 80) : old!.name,
      keys: editor.id ? old!.keys : editorKeys,
    };
    p.change((d) => ({
      ...d,
      collections: old
        ? d.collections.map((c) => (c.id === old.id ? next : c))
        : [...d.collections, next],
    }));
    setEditor(null);
    setSelection([]);
    setMessage(tx("collectionSaved", locale));
  }
  function deleteCollection(c: Collection) {
    p.change((d) => ({
      ...d,
      collections: d.collections.filter((x) => x.id !== c.id),
    }));
    setUndo({ collection: c });
    setCollectionID("");
    setMessage(tx("deleted", locale));
  }
  async function addSession(ids: string[]) {
    if (sessionBusy) return;
    const epoch = generation.current;
    setSessionBusy(true);
    try {
      const candidates = cleanKeys(ids, 500),
        accepted: string[] = [];
      for (let i = 0; i < candidates.length; i += 4) {
        const batch = await Promise.all(
          candidates.slice(i, i + 4).map(async (key) => {
            const c = new AbortController(),
              timer = setTimeout(() => c.abort(), 20000);
            try {
              const r = await fetch(
                "/api/kidflix/experience/" +
                  encodeURIComponent(key) +
                  "/journey?locale=" +
                  locale +
                  "&summary=1",
                { signal: c.signal, cache: "no-store" },
              );
              if (r.status === 404) return null;
              if (!r.ok) throw Error();
              return (await r.json()).session === true ? key : null;
            } finally {
              clearTimeout(timer);
            }
          }),
        );
        accepted.push(...batch.filter((x): x is string => x !== null));
      }
      if (epoch !== generation.current) return;
      let overflow = false;
      p.change((d) => {
        const combined = cleanKeys([...d.queue, ...accepted], 2000);
        if (combined.length > LIMITS.queue) {
          overflow = true;
          return d;
        }
        return { ...d, queue: combined };
      });
      setMessage(tx(overflow ? "limit" : "sessionAdded", locale));
    } catch {
      if (epoch === generation.current) setMessage(tx("error", locale));
    } finally {
      setSessionBusy(false);
    }
  }
  async function share(r: Resource) {
    const url = new URL(
      path(locale, "/experience/" + encodeURIComponent(r.key)),
      location.origin,
    ).href;
    try {
      if (navigator.share) await navigator.share({ title: r.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage(tx("copied", locale));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setShareURL(url);
    }
  }
  function card(key: string, selectable = true) {
    return (
      <LibraryCard
        key={key}
        resourceKey={key}
        resource={by.get(key)}
        locale={locale}
        activity={activity.get(key)}
        selected={selection.includes(key)}
        onSelect={
          selectable
            ? () =>
                setSelection((v) =>
                  v.includes(key) ? v.filter((k) => k !== key) : [...v, key],
                )
            : undefined
        }
        onCollection={openCollection}
        onSession={(ids) => void addSession(ids)}
        onShare={(r) => void share(r)}
        onRemove={
          p.data.saved.some((x) => x.key === key)
            ? () => removeSaved([key])
            : undefined
        }
      />
    );
  }
  const progress = tabKeys(p.data, "progress", locale),
    nameValue = p.data.profile.name,
    continueResource =
      progress.map((k) => by.get(k)).find(Boolean) ||
      p.data.saved.map((x) => by.get(x.key)).find(Boolean),
    related = relatedFamilies(resources.data, p.data.profile.interests);
  return (
    <article
      className={s.library}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-personal-library
    >
      <header className={s.hero}>
        <div className={s.heroCopy}>
          <span className={s.eyebrow}>
            <Sparkles size={14} /> KIDFLIX · {tx("device", locale)}
          </span>
          <h1>
            {nameValue
              ? t([
                  "Welcome back, " + nameValue,
                  "Heureux de vous retrouver, " + nameValue,
                  "مرحباً بعودتك، " + nameValue,
                ])
              : t([
                  "A little space for your next big discovery",
                  "Votre espace pour de grandes découvertes",
                  "مساحتك الصغيرة لاكتشافات كبيرة",
                ])}
          </h1>
          <p>
            {t([
              "Everything you save. Every learning moment you return to. A library that grows with your curiosity.",
              "Vos favoris, vos idées et vos apprentissages à reprendre. Une bibliothèque qui grandit avec votre curiosité.",
              "كل ما تحفظه وكل لحظة تعلّم تعود إليها. مكتبة تنمو مع فضولك.",
            ])}
          </p>
          <div className={s.heroActions}>
            {continueResource ? (
              <Link
                className={s.primary}
                href={path(
                  locale,
                  "/experience/" + encodeURIComponent(continueResource.key),
                )}
              >
                <Play size={16} />
                {tx("resume", locale)}
              </Link>
            ) : (
              <Link className={s.primary} href={path(locale, "/explore")}>
                <Compass size={17} />
                {tx("explore", locale)}
              </Link>
            )}
            <button className={s.secondary} onClick={() => navigate("profile")}>
              <UserRound size={16} />
              {tx("profile", locale)}
            </button>
          </div>
        </div>
        <div className={s.heroArt} aria-hidden="true">
          <div className={s.orbitOne} />
          <div className={s.orbitTwo} />
          <span className={s.floatingHeart}>
            <Heart size={27} fill="currentColor" />
          </span>
          <span className={s.floatingBook}>
            <BookOpen size={31} />
          </span>
          <div className={s.folderArt}>
            <div>
              <FolderHeart size={52} />
              <strong>My KidFlix</strong>
              <span>EXPLORE · SAVE · GROW</span>
            </div>
          </div>
          <span className={s.floatingStar}>
            <Sparkles size={24} />
          </span>
        </div>
      </header>
      <div className={s.metrics}>
        {[
          [Heart, p.data.saved.length, "saved"],
          [Play, progress.length, "progress"],
          [FolderHeart, p.data.collections.length, "collections"],
          [CalendarDays, p.data.queue.length, "session"],
        ].map(([Icon, n, k]) => {
          const C = Icon as typeof Heart;
          return (
            <button key={String(k)} onClick={() => navigate(k as LibraryTab)}>
              <span>
                <C size={21} />
              </span>
              <b>{p.ready ? String(n) : "—"}</b>
              <small>{tx(String(k), locale)}</small>
              <ArrowUpRight size={15} />
            </button>
          );
        })}
      </div>
      <div className={s.layout}>
        <aside className={s.sidebar}>
          <div className={s.sideHeading}>
            {t([
              "YOUR PERSONAL SPACE",
              "VOTRE ESPACE PERSONNEL",
              "مساحتك الشخصية",
            ])}
          </div>
          <nav aria-label={tx("overview", locale)}>
            {TABS.map((k) => {
              const Icon = icons[k];
              return (
                <button
                  key={k}
                  aria-current={tab === k ? "page" : undefined}
                  onClick={() => navigate(k)}
                >
                  <Icon size={17} />
                  <span>{tx(k, locale)}</span>
                  {k === "saved" ? <b>{p.data.saved.length}</b> : null}
                  {k === "session" ? <b>{p.data.queue.length}</b> : null}
                </button>
              );
            })}
          </nav>
          <div className={s.intention}>
            <Sparkles size={20} />
            <strong>{t(["My intention", "Mon intention", "نيّتي"])}</strong>
            <p>
              {p.data.profile.goal ||
                t([
                  "What would you like to make room for?",
                  "À quoi voulez-vous faire une place ?",
                  "ما الذي تود تخصيص مساحة له؟",
                ])}
            </p>
            <button onClick={() => navigate("profile")}>
              {p.data.profile.goal
                ? t(["Edit", "Modifier", "تعديل"])
                : tx("profile", locale)}
              <ArrowRight size={13} />
            </button>
          </div>
          <p className={s.localNote}>
            <ShieldCheck size={15} />
            {tx("local", locale)}
          </p>
        </aside>
        <div className={s.content}>
          <div className={s.viewHeading}>
            <div>
              <span className={s.eyebrow}>
                {t([
                  "YOUR DISCOVERIES, CONNECTED",
                  "VOS DÉCOUVERTES, RÉUNIES",
                  "اكتشافاتك مجتمعة",
                ])}
              </span>
              <h2>
                {collection?.name && tab === "collections"
                  ? collection.name
                  : tx(tab, locale)}
              </h2>
            </div>
            {tab === "collections" ? (
              <button
                className={s.secondary}
                onClick={() => openCollection([])}
              >
                <Plus size={16} />
                {tx("create", locale)}
              </button>
            ) : null}
          </div>
          {p.error ? (
            <p role="alert" className={s.alert}>
              {tx("storage", locale)}
            </p>
          ) : null}
          {message ? (
            <div className={s.message} role="status">
              <CheckCircle2 size={17} />
              <span>{message}</span>
              {undo ? (
                <button onClick={restore}>
                  <Undo2 size={14} />
                  {tx("undo", locale)}
                </button>
              ) : null}
              <button
                className={s.iconButton}
                aria-label={t([
                  "Dismiss message",
                  "Fermer le message",
                  "إغلاق الرسالة",
                ])}
                onClick={() => setMessage("")}
              >
                <X size={16} />
              </button>
            </div>
          ) : null}
          {tab === "profile" ? (
            <ProfilePanel locale={locale} />
          ) : tab === "session" || tab === "preferences" ? (
            <div className={s.nativeTools}>
              <Workspace key={tab} locale={locale} initialTab={tab} embedded />
            </div>
          ) : !p.ready || resources.busy ? (
            <div role="status" className={s.loading}>
              <LoaderCircle size={26} />
              {tx("loading", locale)}
            </div>
          ) : resources.error ? (
            <div role="alert" className={s.alert}>
              <p>{tx("error", locale)}</p>
              <button className={s.secondary} onClick={resources.retry}>
                {tx("retry", locale)}
              </button>
            </div>
          ) : tab === "overview" ? (
            <>
              {progress.length ? (
                <section className={s.shelfSection}>
                  <div className={s.sectionHeading}>
                    <h3>
                      <Play size={18} />
                      {tx("progress", locale)}
                    </h3>
                    <button onClick={() => navigate("progress")}>
                      {tx("viewAll", locale)}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className={s.cardGrid}>
                    {progress.slice(0, 4).map((k) => card(k, false))}
                  </div>
                </section>
              ) : null}
              <section className={s.shelfSection}>
                <div className={s.sectionHeading}>
                  <h3>
                    <Heart size={19} />
                    {tx("saved", locale)}
                  </h3>
                  {p.data.saved.length ? (
                    <button onClick={() => navigate("saved")}>
                      {tx("viewAll", locale)}
                      <ArrowRight size={14} />
                    </button>
                  ) : null}
                </div>
                {p.data.saved.length ? (
                  <div className={s.cardGrid}>
                    {p.data.saved.slice(0, 4).map((x) => card(x.key, false))}
                  </div>
                ) : (
                  <Empty locale={locale} />
                )}
              </section>
              <section className={s.shelfSection}>
                <div className={s.sectionHeading}>
                  <h3>
                    <FolderHeart size={19} />
                    {tx("collections", locale)}
                  </h3>
                  <button onClick={() => navigate("collections")}>
                    {tx("viewAll", locale)}
                    <ArrowRight size={14} />
                  </button>
                </div>
                <CollectionBoard
                  locale={locale}
                  collections={p.data.collections.slice(0, 3)}
                  by={by}
                  onOpen={(c) => {
                    navigate("collections");
                    setCollectionID(c.id);
                  }}
                  onCreate={() => openCollection([])}
                  onRename={(c) => openCollection([], c.id)}
                  onDelete={deleteCollection}
                />
              </section>
              <section className={s.exploreSection}>
                <div>
                  <span className={s.eyebrow}>
                    KIDFLIX · {tx("profile", locale)}
                  </span>
                  <h3>
                    {p.data.profile.interests.length || resources.data.length
                      ? tx("discover", locale)
                      : t([
                          "Make room for your interests",
                          "Faites une place à vos envies",
                          "امنح اهتماماتك مساحة",
                        ])}
                  </h3>
                  <p>
                    {p.data.profile.interests.length || resources.data.length
                      ? tx("discoverSub", locale)
                      : t([
                          "Choose interests or explore a category to start shaping your library.",
                          "Choisissez vos centres d’intérêt ou explorez une catégorie pour personnaliser votre bibliothèque.",
                          "اختر اهتماماتك أو استكشف فئة لتبدأ تشكيل مكتبتك.",
                        ])}
                  </p>
                </div>
                <div className={s.interestGrid}>
                  {related.map((w, i) => (
                    <Link key={w.key} href={path(locale, "/explore/" + w.key)}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <b>{tr(w.title, locale)}</b>
                      <ArrowUpRight size={17} />
                    </Link>
                  ))}
                </div>
              </section>
            </>
          ) : tab === "collections" && !collection ? (
            <CollectionBoard
              locale={locale}
              collections={p.data.collections}
              by={by}
              onOpen={(c) => setCollectionID(c.id)}
              onCreate={() => openCollection([])}
              onRename={(c) => openCollection([], c.id)}
              onDelete={deleteCollection}
            />
          ) : (
            <>
              {tab === "collections" ? (
                <button
                  className={s.textButton}
                  onClick={() => setCollectionID("")}
                >
                  <ChevronLeft size={15} />
                  {tx("back", locale)}
                </button>
              ) : null}
              {keys.length ? (
                <>
                  <div className={s.filters}>
                    <label className={s.search}>
                      <Search size={17} />
                      <input
                        type="search"
                        value={query}
                        maxLength={100}
                        placeholder={tx("search", locale)}
                        aria-label={tx("search", locale)}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <label>
                      <span className={s.srOnly}>{tx("all", locale)}</span>
                      <select
                        value={family}
                        onChange={(e) => setFamily(e.target.value)}
                      >
                        <option value="">{tx("all", locale)}</option>
                        {WORLDS.map((w) => (
                          <option key={w.key} value={w.key}>
                            {tr(w.title, locale)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className={s.srOnly}>{tx("status", locale)}</span>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="">{tx("status", locale)}</option>
                        {[
                          "new",
                          "progress",
                          "complete",
                          "prepared",
                          "unavailable",
                        ].map((k) => (
                          <option key={k} value={k}>
                            {tx(k, locale)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className={s.srOnly}>{tx("order", locale)}</span>
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="native">{tx("order", locale)}</option>
                        <option value="title">{tx("title", locale)}</option>
                        <option value="duration">
                          {tx("duration", locale)}
                        </option>
                      </select>
                    </label>
                  </div>
                  <div className={s.resultsBar}>
                    <label>
                      <input
                        type="checkbox"
                        checked={
                          visible.length > 0 &&
                          visible.every((k) => selection.includes(k))
                        }
                        onChange={(e) =>
                          setSelection(
                            e.target.checked
                              ? [...new Set([...selection, ...visible])]
                              : selection.filter((k) => !visible.includes(k)),
                          )
                        }
                      />
                      {tx("selectPage", locale)}
                    </label>
                    <span>
                      {filtered.length} {tx("resources", locale)}
                    </span>
                    <div>
                      {["grid", "list"].map((k) => (
                        <button
                          key={k}
                          className={s.iconButton}
                          aria-label={tx(k, locale)}
                          aria-pressed={view === k}
                          onClick={() => setView(k)}
                        >
                          {k === "grid" ? (
                            <LayoutGrid size={17} />
                          ) : (
                            <List size={17} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  {selection.length ? (
                    <div className={s.bulk}>
                      <b>
                        {selection.length} {tx("selected", locale)}
                      </b>
                      <button onClick={() => openCollection(selection)}>
                        <FolderPlus size={15} />
                        {tx("addCollection", locale)}
                      </button>
                      <button
                        disabled={sessionBusy}
                        onClick={() => void addSession(selection)}
                      >
                        <Plus size={15} />
                        {tx(sessionBusy ? "busy" : "addSession", locale)}
                      </button>
                      {tab === "saved" ? (
                        <button onClick={() => removeSaved(selection)}>
                          <Trash2 size={15} />
                          {tx("unsave", locale)}
                        </button>
                      ) : null}
                      {tab === "collections" && collection ? (
                        <button
                          onClick={() => {
                            p.change((d) => ({
                              ...d,
                              collections: d.collections.map((c) =>
                                c.id === collection.id
                                  ? {
                                      ...c,
                                      keys: c.keys.filter(
                                        (k) => !selection.includes(k),
                                      ),
                                    }
                                  : c,
                              ),
                            }));
                            setSelection([]);
                          }}
                        >
                          <Trash2 size={15} />
                          {t([
                            "Remove from collection",
                            "Retirer de la collection",
                            "إزالة من المجموعة",
                          ])}
                        </button>
                      ) : null}
                      <button
                        className={s.iconButton}
                        aria-label={tx("clearSelection", locale)}
                        onClick={() => setSelection([])}
                      >
                        <X size={17} />
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
              {visible.length ? (
                <div
                  className={`${s.cardGrid} ${view === "list" ? s.listView : ""}`}
                >
                  {visible.map((k) => card(k))}
                </div>
              ) : (
                <Empty
                  locale={locale}
                  filtered={keys.length > 0}
                  reset={reset}
                />
              )}
              {pages > 1 ? (
                <nav
                  className={s.pagination}
                  aria-label={t([
                    "Library pages",
                    "Pages de la bibliothèque",
                    "صفحات المكتبة",
                  ])}
                >
                  <button
                    aria-label={tx("previous", locale)}
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span>
                    {currentPage} / {pages}
                  </span>
                  <button
                    aria-label={tx("next", locale)}
                    disabled={currentPage === pages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </div>
      {editor ? (
        <Dialog
          locale={locale}
          title={tx(editor.id ? "rename" : "addCollection", locale)}
          onClose={() => setEditor(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveCollection();
            }}
          >
            {!editor.id ? (
              <label>
                {tx("chooseCollection", locale)}
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="new">{tx("create", locale)}</option>
                  {p.data.collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {target === "new" || editor.id ? (
              <label>
                {tx("collectionName", locale)}
                <input
                  autoFocus
                  maxLength={80}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            ) : null}
            <p>
              {editor.id
                ? collection?.keys.length ||
                  p.data.collections.find((c) => c.id === editor.id)?.keys
                    .length
                : editorKeys.length}{" "}
              / {LIMITS.collectionItems} {tx("resources", locale)}
            </p>
            {editorOverflow ? (
              <p role="alert" className={s.alert}>
                {tx("limit", locale)}
              </p>
            ) : null}
            <div className={s.dialogActions}>
              <button
                className={s.secondary}
                type="button"
                onClick={() => setEditor(null)}
              >
                {tx("cancel", locale)}
              </button>
              <button
                className={s.primary}
                disabled={editorOverflow}
                type="submit"
              >
                {tx("saveChanges", locale)}
              </button>
            </div>
          </form>
        </Dialog>
      ) : null}
      {shareURL ? (
        <Dialog
          locale={locale}
          title={tx("shareFallback", locale)}
          onClose={() => setShareURL("")}
        >
          <label>
            {tx("copy", locale)}
            <input
              readOnly
              value={shareURL}
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          </label>
        </Dialog>
      ) : null}
    </article>
  );
}
function CollectionBoard({
  locale,
  collections,
  by,
  onOpen,
  onCreate,
  onRename,
  onDelete,
}: {
  locale: Locale;
  collections: Collection[];
  by: Map<string, Resource>;
  onOpen: (c: Collection) => void;
  onCreate: () => void;
  onRename: (c: Collection) => void;
  onDelete: (c: Collection) => void;
}) {
  return (
    <div className={s.collectionGrid}>
      {collections.map((c, i) => (
        <article
          className={s.collection}
          key={c.id}
          style={
            {
              "--collection-tone": ["#def5fc", "#f2e9fc", "#fff0dc", "#e6f5ed"][
                i % 4
              ],
            } as React.CSSProperties
          }
        >
          <button className={s.collectionOpen} onClick={() => onOpen(c)}>
            <div className={s.collectionCovers}>
              {c.keys.slice(0, 3).map((k) => {
                const r = by.get(k);
                return r?.image ? (
                  <img key={k} src={r.image} alt="" loading="lazy" />
                ) : (
                  <span key={k}>
                    <BookOpen size={21} />
                  </span>
                );
              })}
              {!c.keys.length ? <FolderHeart size={42} /> : null}
            </div>
            <div>
              <h3>{c.name}</h3>
              <p>
                {c.keys.length} {tx("resources", locale)}
                <ArrowUpRight size={16} />
              </p>
            </div>
          </button>
          <div className={s.collectionTools}>
            <button onClick={() => onRename(c)}>{tx("rename", locale)}</button>
            <button onClick={() => onDelete(c)}>
              <Trash2 size={13} />
              {tx("delete", locale)}
            </button>
          </div>
        </article>
      ))}
      <button className={s.createCollection} onClick={onCreate}>
        <span>
          <FolderPlus size={30} />
        </span>
        <strong>
          {tx(collections.length ? "create" : "noCollection", locale)}
        </strong>
        <p>{tx("collectionSub", locale)}</p>
        <span className={s.textButton}>
          <Plus size={15} />
          {tx("create", locale)}
        </span>
      </button>
    </div>
  );
}
export function PersonalShelf({
  locale,
  recent = false,
  dense = false,
}: {
  locale: Locale;
  recent?: boolean;
  dense?: boolean;
}) {
  const p = usePersonal(),
    refs = recent ? p.data.recent : p.data.saved,
    keys = refs.slice(0, dense ? 6 : 4).map((x) => x.key),
    resources = useLibraryResources(p.ready ? keys : [], locale),
    by = new Map(resources.data.map((r) => [r.key, r])),
    activity = latestActivity(p.data, locale);
  return (
    <section
      className={s.homeShelf}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-personal-shelf
    >
      <div className={s.sectionHeading}>
        <div>
          <span className={s.eyebrow}>
            <Sparkles size={13} /> {tx("device", locale)}
          </span>
          <h2>{tx(recent ? "recent" : "saved", locale)}</h2>
        </div>
        <Link href={path(locale, recent ? "/my?tab=recent" : "/saved")}>
          {tx("viewAll", locale)}
          <ArrowRight size={15} />
        </Link>
      </div>
      {!p.ready || resources.busy ? (
        <p role="status" className={s.loading}>
          {tx("loading", locale)}
        </p>
      ) : resources.error ? (
        <div role="alert" className={s.alert}>
          {tx("error", locale)}
          <button onClick={resources.retry}>{tx("retry", locale)}</button>
        </div>
      ) : keys.length ? (
        <div className={`${s.cardGrid} ${dense ? s.sixGrid : ""}`}>
          {keys.map((key) => (
            <LibraryCard
              key={key}
              resourceKey={key}
              locale={locale}
              resource={by.get(key)}
              activity={activity.get(key)}
              onRemove={
                p.data.saved.some((x) => x.key === key)
                  ? () => p.toggle(key)
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className={s.shelfEmpty}>
          <span>
            <Heart size={28} />
          </span>
          <div>
            <h3>
              {tr(
                recent
                  ? [
                      "Your discoveries will find their way here",
                      "Retrouvez ici vos découvertes",
                      "ستجد اكتشافاتك هنا",
                    ]
                  : [
                      "Keep the ideas you love close",
                      "Gardez vos idées préférées à portée de main",
                      "احتفظ بالأفكار التي تحبها قريبة",
                    ],
                locale,
              )}
            </h3>
            <p>{tx("emptySub", locale)}</p>
          </div>
          <Link className={s.primary} href={path(locale, "/explore")}>
            {tx("explore", locale)}
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}
