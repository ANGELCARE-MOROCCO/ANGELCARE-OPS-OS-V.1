"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  authoringFamilies,
  authoringLocales,
  uploadConcurrency,
} from "../management";
import { familyByKey } from "../registry";
import { SUBTYPES } from "../reference-model";
import { modeContract } from "../capabilities";
import {
  CREATION_CONTRACT,
  CREATION_PLANS,
  creationModeLabel,
  appendSource,
  completeCreation,
  creationId,
  creationIssues,
  fieldIsLocalized,
  localizedWrite,
  mimeFor,
  moveUnit,
  newCreation,
  newCreationUnit,
  primaryCollection,
  primaryFields,
  updateUnit,
  visibleCreationField,
  writeTitle,
} from "../creation-model";
import {
  importCreationUnits,
  parseCreationSheet,
  suggestCreationMapping,
  type Sheet,
} from "../creation-import";
import {
  queueFile,
  nativeMediaPost,
  uploadCreationFile,
  type UploadCheckpoint,
} from "../creation-upload";
import {
  array,
  object,
  text,
  tr,
  type Collection,
  type Command,
  type Data,
  type DceRecord,
  type Field as Definition,
  type Locale,
  type Tri,
} from "../types";
import {
  ActivityAnswer,
  CreationField,
  CreationReferencePicker,
  QuestionEditor,
  referenceFor,
  type ReferenceRequest,
} from "./CreationControls";
import { Button, Dialog, Icon, mutate, query, useQuery, useUI } from "./ui";
import s from "./creation.module.css";
const words = (en: string, fr: string, ar: string): Tri => [en, fr, ar];
type Entry = {
  clientId: string;
  record: Partial<DceRecord>;
  version: number;
  savedVersion: number;
  pending?: { command: Partial<Command>; version: number };
  error?: string;
  result?: {
    publicPath?: string;
    release?: any;
    review?: boolean;
    signature?: string;
  };
  status?: string;
  selected: boolean;
};
type Asset = { name: string; url?: string; mime?: string };
const signature = (r: Partial<DceRecord>) =>
  JSON.stringify([
    r.kind,
    r.key,
    r.title,
    r.family,
    r.topic,
    r.audience,
    r.data,
  ]);
const isLocale = (v: unknown): v is Locale =>
  ["fr", "en", "ar"].includes(String(v));
const uploadText: Record<string, Tri> = {
  queued: words("Queued", "En attente", "في الانتظار"),
  hashing: words("Inspecting file", "Inspection du fichier", "فحص الملف"),
  uploading: words("Uploading", "Téléversement", "جارٍ الرفع"),
  verifying: words(
    "Verifying the uploaded file",
    "Vérification du fichier",
    "التحقق من الملف",
  ),
  ready: words("File ready", "Fichier prêt", "الملف جاهز"),
  failed: words("Retry available", "Reprise disponible", "يمكن إعادة المحاولة"),
  "needs-file": words(
    "Reselect the original file",
    "Resélectionner le fichier original",
    "أعد اختيار الملف الأصلي",
  ),
};

export function CreationStudio({
  family,
  prepared,
  onClose,
  onAdvanced,
}: {
  family?: string;
  prepared?: Partial<DceRecord>;
  onClose: () => void;
  onAdvanced: (record: Partial<DceRecord>) => void;
}) {
  const { locale, boot, refresh, preview } = useUI(),
    scope = text(boot.health.scopeKey) || "global";
  const storageKey = "angelcare.dce.creation.r1." + boot.actor.id + "." + scope;
  const preferencesKey = storageKey + ".preferences";
  const [contentLanguage, setContentLanguage] = useState<Locale>(() =>
    isLocale(prepared?.data?.defaultLocale)
      ? (prepared!.data!.defaultLocale as Locale)
      : authoringLocales(boot.settings).includes("fr")
        ? "fr"
        : authoringLocales(boot.settings)[0],
  );
  const [entries, setEntries] = useState<Entry[]>(() =>
    family
      ? [
          {
            clientId: creationId(),
            record: newCreation(
              family,
              isLocale(prepared?.data?.defaultLocale)
                ? (prepared!.data!.defaultLocale as Locale)
                : authoringLocales(boot.settings).includes("fr")
                  ? "fr"
                  : authoringLocales(boot.settings)[0],
              boot.settings,
              prepared,
            ),
            version: 0,
            savedVersion: prepared?.id ? 0 : -1,
            selected: true,
          },
        ]
      : [],
  );
  const entriesRef = useRef(entries),
    [active, setActive] = useState(entries[0]?.clientId || ""),
    [queue, setQueue] = useState<UploadCheckpoint[]>([]),
    queueRef = useRef(queue);
  const [assets, setAssets] = useState<Record<string, Asset>>({}),
    [restore, setRestore] = useState<{
      entries: Entry[];
      queue: UploadCheckpoint[];
      language: Locale;
    } | null>(null),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [drawer, setDrawer] = useState(false),
    [drawerSearch, setDrawerSearch] = useState(""),
    [reference, setReference] = useState<ReferenceRequest | null>(null),
    [showSheet, setShowSheet] = useState(false),
    [sheetText, setSheetText] = useState(""),
    [sheet, setSheet] = useState<Sheet | null>(null),
    [mapping, setMapping] = useState<string[]>([]),
    [answerFormat, setAnswerFormat] = useState<"text" | "letter" | "position">(
      "text",
    ),
    [sheetError, setSheetError] = useState(""),
    [groupFiles, setGroupFiles] = useState(
      !["documents", "video"].includes(family || "documents"),
    ),
    [dragged, setDragged] = useState<{
      collection: string;
      index: number;
    } | null>(null),
    [focusedUnit, setFocusedUnit] = useState(""),
    [categorySearch, setCategorySearch] = useState(""),
    [attach, setAttach] = useState<{
      resource: string;
      collection: string;
      unit: string;
      field: string;
      accept: string;
      retry?: string;
    } | null>(null);
  const input = useRef<HTMLInputElement>(null),
    attachmentInput = useRef<HTMLInputElement>(null),
    sheetInput = useRef<HTMLInputElement>(null),
    files = useRef(new Map<string, File>()),
    controllers = useRef(new Map<string, AbortController>()),
    saving = useRef(new Map<string, Promise<Entry>>()),
    urls = useRef(new Set<string>()),
    latestAssets = useRef(assets),
    persistRef = useRef<() => void>(() => {}),
    alive = useRef(true);
  const current = entries.find((e) => e.clientId === active) || entries[0],
    record = current?.record,
    data = object(record?.data),
    f = familyByKey(record?.family || ""),
    plan = CREATION_PLANS[f?.key || ""],
    language = isLocale(data.defaultLocale)
      ? data.defaultLocale
      : contentLanguage;
  const collection = record ? primaryCollection(record) : undefined,
    rows = array(data[collection?.key || ""]);
  const policy = useQuery<any>(
    { op: "creation_status" },
    { atomicPublish: false, independentReview: false },
  );
  const t = (en: string, fr: string, ar: string) =>
    tr(words(en, fr, ar), locale);
  const committing = useCallback((next: Entry[]) => {
    entriesRef.current = next;
    setEntries(next);
    queueMicrotask(() => persistRef.current());
  }, []);
  const putQueue = useCallback((next: UploadCheckpoint[]) => {
    queueRef.current = next;
    setQueue(next);
    queueMicrotask(() => persistRef.current());
  }, []);
  const change = (
    id: string,
    fn: (r: Partial<DceRecord>) => Partial<DceRecord>,
  ) =>
    committing(
      entriesRef.current.map((e) =>
        e.clientId === id
          ? {
              ...e,
              record: fn(e.record),
              version: e.version + 1,
              error: undefined,
              status: undefined,
            }
          : e,
      ),
    );
  const patch = (values: Data) =>
    current &&
    change(current.clientId, (r) => ({
      ...r,
      data: { ...object(r.data), ...values },
    }));
  const changeRow = (key: string, id: string, values: Data) =>
    current && change(current.clientId, (r) => updateUnit(r, key, id, values));
  persistRef.current = () => {
    if (!ready || restore) return;
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          contract: CREATION_CONTRACT,
          savedAt: Date.now(),
          language: contentLanguage,
          entries: entriesRef.current,
          queue: queueRef.current,
        }),
      );
    } catch {
      setNotice(
        t(
          "Browser recovery is full. Save this resource before leaving.",
          "La reprise du navigateur est saturée. Enregistrez avant de quitter.",
          "مساحة الاستعادة ممتلئة. احفظ المورد قبل المغادرة.",
        ),
      );
    }
  };
  useEffect(() => {
    alive.current = true;
    try {
      const pref = JSON.parse(localStorage.getItem(preferencesKey) || "null");
      if (
        !prepared &&
        isLocale(pref?.language) &&
        authoringLocales(boot.settings).includes(pref.language)
      ) {
        setContentLanguage(pref.language);
        if (
          entriesRef.current.length === 1 &&
          !text(entriesRef.current[0].record.title)
        ) {
          const one = entriesRef.current[0];
          committing([
            {
              ...one,
              record: newCreation(
                one.record.family || family || "documents",
                pref.language,
                boot.settings,
                prepared,
              ),
            },
          ]);
        }
      }
      const stored = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      if (
        stored?.contract === CREATION_CONTRACT &&
        Array.isArray(stored.entries) &&
        stored.entries.length &&
        stored.entries.every(
          (e: Entry) =>
            e.clientId &&
            familyByKey(e.record?.family || "") &&
            typeof e.version === "number",
        )
      ) {
        const remaining = stored.entries.filter(
          (e: Entry) =>
            (text(e.record.title) ||
              e.pending ||
              (stored.queue || []).some(
                (q: UploadCheckpoint) => q.resource === e.clientId,
              )) &&
            (!e.result?.publicPath ||
              e.result.signature !== signature(e.record)),
        );
        if (remaining.length)
          setRestore({
            ...stored,
            entries: remaining,
            queue: (stored.queue || []).filter((q: UploadCheckpoint) =>
              remaining.some((e: Entry) => e.clientId === q.resource),
            ),
          });
      }
    } catch {}
    setReady(true);
    return () => {
      alive.current = false;
      for (const c of controllers.current.values()) c.abort();
      for (const url of urls.current) URL.revokeObjectURL(url);
    };
  }, []);
  useEffect(() => {
    persistRef.current();
  }, [entries, queue, contentLanguage, ready]);
  useEffect(() => {
    latestAssets.current = assets;
  }, [assets]);
  useEffect(() => {
    if (!drawer && !reference) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = document.querySelector<HTMLElement>("[data-creation-drawer]");
    const controls = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]',
        ) || [],
      ).filter((el) => el.getClientRects().length > 0);
    controls()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const list = controls();
      if (!list.length) return;
      const current = document.activeElement;
      if (!panel?.contains(current)) {
        event.preventDefault();
        list[0].focus();
      } else if (event.shiftKey && current === list[0]) {
        event.preventDefault();
        list.at(-1)?.focus();
      } else if (!event.shiftKey && current === list.at(-1)) {
        event.preventDefault();
        list[0].focus();
      }
    };
    document.addEventListener("keydown", trap, true);
    return () => {
      document.removeEventListener("keydown", trap, true);
      previous?.focus();
    };
  }, [drawer, reference]);
  useEffect(() => {
    if (!attach) return;
    attachmentInput.current?.click();
  }, [attach]);
  const saveOne = async (id: string): Promise<Entry> => {
    if (saving.current.has(id)) return saving.current.get(id)!;
    const operation = (async () => {
      for (let turn = 0; turn < 3; turn++) {
        let entry = entriesRef.current.find((e) => e.clientId === id);
        if (!entry) throw Error("Resource unavailable.");
        if (
          !entry.pending &&
          entry.record.id &&
          entry.savedVersion === entry.version
        )
          return entry;
        if (!entry.pending) {
          if (!text(entry.record.title))
            throw Error(
              t(
                "Add the resource title.",
                "Ajoutez le titre de la ressource.",
                "أضف عنوان المورد.",
              ),
            );
          const command: Partial<Command> = {
            action: "creation_save",
            requestId: creationId(),
            id: entry.record.id,
            revision: entry.record.revision || 0,
            record: completeCreation(entry.record),
          };
          entry = {
            ...entry,
            pending: { command, version: entry.version },
            status: "saving",
          };
          committing(
            entriesRef.current.map((e) => (e.clientId === id ? entry! : e)),
          );
        }
        const pending = entry.pending!;
        try {
          const reply = await mutate<any>(pending.command),
            saved = reply.record as DceRecord;
          if (!saved?.id)
            throw Error("The native save did not return a resource.");
          committing(
            entriesRef.current.map((e) => {
              if (e.clientId !== id) return e;
              const changed = e.version !== pending.version;
              return {
                ...e,
                record: changed
                  ? {
                      ...saved,
                      ...e.record,
                      id: saved.id,
                      revision: saved.revision,
                      data: { ...saved.data, ...object(e.record.data) },
                    }
                  : saved,
                pending: undefined,
                savedVersion: pending.version,
                error: undefined,
                status: "saved",
              };
            }),
          );
        } catch (error) {
          committing(
            entriesRef.current.map((e) =>
              e.clientId === id
                ? { ...e, status: "failed", error: (error as Error).message }
                : e,
            ),
          );
          throw error;
        }
      }
      return entriesRef.current.find((e) => e.clientId === id)!;
    })();
    saving.current.set(id, operation);
    try {
      return await operation;
    } finally {
      saving.current.delete(id);
    }
  };
  useEffect(() => {
    if (!ready || busy || restore || !boot.actor.rights.manage) return;
    const timer = setTimeout(() => {
      for (const e of entriesRef.current) {
        if (e.version !== e.savedVersion && text(e.record.title) && !e.error)
          void saveOne(e.clientId).catch(() => {});
      }
    }, 1100);
    return () => clearTimeout(timer);
  }, [entries, ready, busy, restore]);
  useEffect(() => {
    if (!ready) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (
        queueRef.current.some((q) =>
          ["uploading", "hashing", "verifying", "queued"].includes(q.state),
        ) ||
        entriesRef.current.some(
          (e) => e.pending || e.version !== e.savedVersion,
        )
      ) {
        persistRef.current();
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [ready]);
  const rememberLanguage = (l: Locale) => {
    setContentLanguage(l);
    try {
      localStorage.setItem(preferencesKey, JSON.stringify({ language: l }));
    } catch {}
  };
  function start(nextFamily: string) {
    const entry: Entry = {
      clientId: creationId(),
      record: newCreation(nextFamily, contentLanguage, boot.settings, prepared),
      version: 0,
      savedVersion: -1,
      selected: true,
    };
    committing([...entriesRef.current, entry]);
    setActive(entry.clientId);
    setGroupFiles(!["documents", "video"].includes(nextFamily));
    setFocusedUnit("");
  }
  function setAsset(id: string, value: Asset) {
    setAssets((old) => ({ ...old, [id]: value }));
  }
  useEffect(() => {
    if (!record) return;
    const ids = new Set<string>();
    for (const c of f?.collections || [])
      for (const row of array(data[c.key]))
        for (const def of c.fields)
          if (
            (def.reference === "media" || /assetId$/i.test(def.key)) &&
            text(row[def.key])
          )
            ids.add(text(row[def.key]));
    let cancelled = false;
    for (const id of ids) {
      if (latestAssets.current[id]) continue;
      void query<any>({ op: "native", type: "media", id, page: 1, pageSize: 1 })
        .then((reply) => {
          if (cancelled) return;
          const r = reply.rows?.find((v: any) => v.id === id);
          if (r)
            setAsset(id, {
              name: r.title || r.file_name || r.key || "",
              url: r.url,
              mime: r.mime,
            });
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [record?.id, signature(record || {}), f?.key]);
  async function runUpload(id: string) {
    const checkpoint = queueRef.current.find((q) => q.id === id),
      file = files.current.get(id);
    if (!checkpoint) return;
    if (
      !file &&
      !(checkpoint.uploaded && checkpoint.assetId && checkpoint.checksum)
    ) {
      putQueue(
        queueRef.current.map((q) =>
          q.id === id ? { ...q, state: "needs-file" } : q,
        ),
      );
      return;
    }
    if (controllers.current.has(id)) return;
    const controller = new AbortController();
    controllers.current.set(id, controller);
    try {
      const done = file
        ? await uploadCreationFile(
            file,
            checkpoint,
            (values) => {
              putQueue(
                queueRef.current.map((q) =>
                  q.id === id ? { ...q, ...values } : q,
                ),
              );
            },
            controller.signal,
          )
        : await (async () => {
            putQueue(
              queueRef.current.map((q) =>
                q.id === id ? { ...q, state: "verifying", progress: 80 } : q,
              ),
            );
            await nativeMediaPost(
              "/" + checkpoint.assetId + "/complete",
              {
                checksumSha256: checkpoint.checksum,
                sizeBytes: checkpoint.size,
                mimeType: checkpoint.mime,
              },
              controller.signal,
            );
            const completed: UploadCheckpoint = {
              ...checkpoint,
              state: "ready",
              progress: 100,
              error: undefined,
            };
            putQueue(
              queueRef.current.map((q) => (q.id === id ? completed : q)),
            );
            return completed;
          })();
      if (
        !entriesRef.current.some((e) => e.clientId === checkpoint.resource) ||
        !alive.current
      )
        return;
      change(checkpoint.resource, (r) => {
        const d = object(r.data);
        if (checkpoint.collection === "@root")
          return {
            ...r,
            data: localizedWrite(
              d,
              checkpoint.field,
              done.assetId!,
              isLocale(d.defaultLocale) ? d.defaultLocale : "fr",
              false,
            ),
          };
        const updates: Data = { [checkpoint.field]: done.assetId! };
        if (checkpoint.field === "assetId") {
          if (done.duration) updates.duration = done.duration;
          if (done.pageCount) updates.pageCount = done.pageCount;
        }
        return updateUnit(r, checkpoint.collection, checkpoint.unit, updates);
      });
      const local = latestAssets.current[id];
      if (done.assetId)
        setAsset(done.assetId, {
          name: done.name,
          mime: done.mime,
          url: local?.url,
        });
    } catch (error) {
      putQueue(
        queueRef.current.map((q) =>
          q.id === id
            ? { ...q, state: "failed", error: (error as Error).message }
            : q,
        ),
      );
    } finally {
      controllers.current.delete(id);
    }
  }
  async function intake(list: File[], target?: typeof attach) {
    if (!list.length || !current || !f) return;
    if (list.length > 100) {
      setNotice(
        t(
          "Choose up to 100 files per batch.",
          "Choisissez 100 fichiers maximum par lot.",
          "اختر 100 ملف كحد أقصى.",
        ),
      );
      return;
    }
    const newQueue: UploadCheckpoint[] = [];
    if (target?.retry) {
      const q = queueRef.current.find((q) => q.id === target.retry);
      if (q) {
        files.current.set(q.id, list[0]);
        await runUpload(q.id);
      }
      setAttach(null);
      return;
    }
    for (const file of list) {
      const mime = mimeFor(file.name, file.type);
      const accept = (target?.accept || plan.accept).split(",").filter(Boolean);
      if (
        !mime ||
        !accept.some(
          (a) =>
            a === mime ||
            (a.endsWith("/*") && mime.startsWith(a.slice(0, -1))) ||
            (a.endsWith("/") && mime.startsWith(a)),
        )
      ) {
        setNotice(
          t(
            "This file type does not fit the selected placement: ",
            "Ce type de fichier ne correspond pas à cet emplacement : ",
            "نوع الملف غير مناسب لهذا الموضع: ",
          ) + file.name,
        );
        continue;
      }
      let targetResource = target?.resource || current.clientId,
        collectionKey = target?.collection || "",
        unitId = target?.unit || "",
        field = target?.field || "assetId";
      if (!target) {
        let entry = entriesRef.current.find(
          (e) => e.clientId === targetResource,
        )!;
        if (!groupFiles && array(entry.record.data?.[plan.collection]).length) {
          entry = {
            clientId: creationId(),
            record: newCreation(f.key, language, boot.settings, {
              audience: entry.record.audience,
              topic: entry.record.topic,
              data: {
                subtype: entry.record.data?.subtype || "",
                ageMin: entry.record.data?.ageMin ?? 0,
                ageMax: entry.record.data?.ageMax ?? 18,
              },
            }),
            version: 0,
            savedVersion: -1,
            selected: true,
          };
          committing([...entriesRef.current, entry]);
          targetResource = entry.clientId;
        }
        const appended = appendSource(
          entry.record,
          { name: file.name, mime },
          language,
        );
        change(targetResource, () => appended.record);
        collectionKey = appended.collection;
        unitId = text(appended.unit.id);
        if (newQueue.length === 0) {
          setActive(targetResource);
          setFocusedUnit(unitId);
        }
      }
      const q = queueFile(file, {
        resource: targetResource,
        collection: collectionKey,
        unit: unitId,
        field,
      });
      files.current.set(q.id, file);
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      setAsset(q.id, { name: file.name, mime, url });
      newQueue.push(q);
    }
    putQueue([
      ...queueRef.current.filter(
        (old) =>
          !newQueue.some(
            (fresh) =>
              fresh.resource === old.resource &&
              fresh.collection === old.collection &&
              fresh.unit === old.unit &&
              fresh.field === old.field,
          ),
      ),
      ...newQueue,
    ]);
    setAttach(null);
    let next = 0;
    await Promise.all(
      Array.from(
        { length: Math.min(uploadConcurrency(boot.settings), newQueue.length) },
        async () => {
          while (next < newQueue.length) await runUpload(newQueue[next++].id);
        },
      ),
    );
  }
  function browse(request: ReferenceRequest) {
    setReference({
      ...request,
      choose: (r) => {
        if (request.type === "media")
          setAsset(r.id, {
            name: r.title || r.file_name || r.key,
            url: r.url,
            mime: r.mime,
          });
        request.choose(r);
      },
    });
  }
  function attachFile(def: Definition, collectionKey: string, unitId: string) {
    if (!current) return;
    setAttach({
      resource: current.clientId,
      collection: collectionKey,
      unit: unitId,
      field: def.key,
      accept:
        def.mime?.map((m) => (m.endsWith("/") ? m + "*" : m)).join(",") ||
        "image/*,application/pdf,video/mp4,video/webm,audio/mpeg",
    });
  }
  function addRow(c: Collection = collection!) {
    if (!c || !current) return;
    let additions = [newCreationUnit(c, language)];
    if (
      f?.key === "activities" &&
      ["matching", "memory"].includes(text(data.engine)) &&
      c.key === "tasks"
    ) {
      const pair = "pair-" + creationId();
      additions = [
        { ...newCreationUnit(c, language), answer: pair },
        { ...newCreationUnit(c, language), answer: pair },
      ];
    }
    if (f?.key === "activities" && data.engine === "sorting")
      additions = additions.map((r) => ({
        ...r,
        choices: text(array(data.tasks)[0]?.choices),
      }));
    if (f?.key === "activities" && data.engine === "sequence")
      additions = additions.map((r, i) => ({
        ...r,
        answer: String(array(data[c.key]).length + i + 1),
      }));
    patch({ [c.key]: [...array(data[c.key]), ...additions] });
    setFocusedUnit(text(additions[0].id));
  }
  function removeRow(c: Collection, id: string) {
    if (!current) return;
    const row = array(data[c.key]).find((r) => r.id === id),
      ids =
        f?.key === "activities" &&
        c.key === "tasks" &&
        ["matching", "memory"].includes(text(data.engine))
          ? array(data[c.key])
              .filter((r) => r.answer === row?.answer)
              .map((r) => text(r.id))
          : [id];
    let next = array(data[c.key]).filter((r) => !ids.includes(text(r.id)));
    if (f?.key === "activities" && data.engine === "sequence")
      next = next.map((r, i) => ({ ...r, answer: String(i + 1) }));
    patch({ [c.key]: next });
    putQueue(
      queueRef.current.filter((q) => {
        if (
          q.resource === current.clientId &&
          q.collection === c.key &&
          ids.includes(q.unit)
        ) {
          controllers.current.get(q.id)?.abort();
          return false;
        }
        return true;
      }),
    );
  }
  function reorder(c: Collection, from: number, to: number) {
    if (!current) return;
    change(current.clientId, (r) => {
      const moved = moveUnit(r, c.key, from, to);
      if (r.family === "activities" && r.data?.engine === "sequence")
        moved.data = {
          ...object(moved.data),
          tasks: array(moved.data?.tasks).map((u, i) => ({
            ...u,
            answer: String(i + 1),
          })),
        };
      return moved;
    });
  }
  const activeQueue = queue.filter((q) => q.resource === current?.clientId),
    issues = useMemo(() => (record ? creationIssues(record) : []), [record]);
  const readyCount = entries.filter(
    (e) =>
      !creationIssues(e.record).length &&
      !queue.some((q) => q.resource === e.clientId && q.state !== "ready"),
  ).length;
  const [publicReceipts, setPublicReceipts] = useState<Record<string, string>>(
    {},
  );
  async function publishOne(id: string) {
    let entry = entriesRef.current.find((e) => e.clientId === id)!;
    if (queueRef.current.some((q) => q.resource === id && q.state !== "ready"))
      throw Error(
        t(
          "Finish or retry this resource’s file uploads.",
          "Terminez ou reprenez les fichiers de cette ressource.",
          "أكمل رفع ملفات هذا المورد أو أعد المحاولة.",
        ),
      );
    if (creationIssues(entry.record).length)
      throw Error(
        t(
          "Complete the highlighted essential content.",
          "Complétez le contenu essentiel signalé.",
          "أكمل المحتوى الأساسي المحدد.",
        ),
      );
    if (entry.record.data?.publicEnabled !== true) {
      change(id, (r) => ({
        ...r,
        data: { ...object(r.data), publicEnabled: true },
      }));
    }
    entry = await saveOne(id);
    if (entry.savedVersion !== entry.version) entry = await saveOne(id);
    const l = entry.record.data?.defaultLocale as Locale;
    const inspection = await mutate<any>({
      action: "creation_inspect",
      id: entry.record.id,
      revision: entry.record.revision,
      locale: l,
      requestId: creationId(),
    });
    if (!inspection.validation?.valid) {
      const details = inspection.validation?.errors || [];
      throw Error(
        details.map((v: any) => tr(v.message, locale)).join(" · ") ||
          t(
            "This edition is incomplete.",
            "Cette édition est incomplète.",
            "هذه النسخة غير مكتملة.",
          ),
      );
    }
    if (policy.value.independentReview) {
      await mutate({
        action: "master_edition_review",
        id: entry.record.id,
        revision: entry.record.revision,
        locale: l,
      });
      committing(
        entriesRef.current.map((e) =>
          e.clientId === id
            ? {
                ...e,
                result: { review: true, signature: signature(e.record) },
                status: "review",
              }
            : e,
        ),
      );
      return;
    }
    if (!policy.value.atomicPublish)
      throw Error(
        t(
          "Apply the Creation Studio SQL migration before publishing.",
          "Appliquez la migration SQL Creation Studio avant de publier.",
          "طبّق ترحيل Creation Studio قبل النشر.",
        ),
      );
    const key = [id, entry.record.revision, l].join(":"),
      receipt = publicReceipts[key] || creationId();
    setPublicReceipts((old) => ({ ...old, [key]: receipt }));
    // Keep failed publication receipts across refreshes as well as repeated clicks.
    const receiptKey = storageKey + ".publish." + key;
    let requestId = receipt;
    try {
      requestId = sessionStorage.getItem(receiptKey) || receipt;
      sessionStorage.setItem(receiptKey, requestId);
    } catch {}
    const result = await mutate<any>({
      action: "creation_publish",
      id: entry.record.id,
      revision: entry.record.revision,
      locale: l,
      requestId,
    });
    committing(
      entriesRef.current.map((e) =>
        e.clientId === id
          ? {
              ...e,
              result: { ...result, signature: signature(e.record) },
              status: "published",
              error: undefined,
            }
          : e,
      ),
    );
  }
  async function publishSelected() {
    setBusy(true);
    setNotice("");
    const selected = entriesRef.current.filter((e) => e.selected);
    let successes = 0;
    for (const entry of selected) {
      try {
        await publishOne(entry.clientId);
        successes++;
      } catch (error) {
        committing(
          entriesRef.current.map((e) =>
            e.clientId === entry.clientId
              ? { ...e, error: (error as Error).message, status: "failed" }
              : e,
          ),
        );
      }
    }
    setBusy(false);
    try {
      await refresh();
    } catch {}
    if (successes)
      setNotice(
        t(
          `${successes} resource(s) completed. Each result is shown beside its title.`,
          `${successes} ressource(s) traitée(s). Le résultat figure à côté de chaque titre.`,
          `${successes} مورد اكتمل. تظهر النتيجة بجانب كل عنوان.`,
        ),
      );
  }
  async function openExpert() {
    if (!current) return;
    setBusy(true);
    try {
      const saved = text(current.record.title)
        ? await saveOne(current.clientId)
        : current;
      onAdvanced(saved.record);
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function changeContentLanguage(l: Locale) {
    rememberLanguage(l);
    if (current)
      change(current.clientId, (r) => ({
        ...r,
        data: {
          ...object(r.data),
          defaultLocale: l,
          requiredLocales: r.id
            ? Array.from(new Set([...arrayLocales(r.data?.requiredLocales), l]))
            : [l],
          locales: {
            ...object(r.data?.locales),
            [l]: {
              ...object(object(r.data?.locales)[l]),
              title: text(r.title),
            },
          },
        },
      }));
  }
  const fieldControl = (def: Definition, row?: Data, c?: Collection) => {
    const key = c?.key || "@root",
      unit = text(row?.id),
      target = row || data;
    const changeValue = (value: Data[string]) => {
      if (def.reference === "media" || /assetId$/i.test(def.key))
        putQueue(
          queueRef.current.filter(
            (q) =>
              !(
                q.resource === current!.clientId &&
                q.collection === key &&
                q.unit === unit &&
                q.field === def.key
              ),
          ),
        );
      const next = localizedWrite(
        target,
        def.key,
        value,
        language,
        fieldIsLocalized(def),
      );
      if (row && c) changeRow(c.key, unit, next);
      else patch(next);
    };
    const browseControl = (request: ReferenceRequest) =>
      browse({
        ...request,
        choose: (r) => {
          request.choose(r);
          if (
            row &&
            c &&
            (def.key === "experienceId" || def.key === "nativeId") &&
            !text(row.title || row.label)
          ) {
            const property = def.key === "nativeId" ? "label" : "title";
            changeRow(
              c.key,
              unit,
              localizedWrite(
                { ...row, [def.key]: r.id },
                property,
                r.title || r.key || "",
                language,
              ),
            );
          }
        },
      });
    return (
      <CreationField
        key={def.key}
        def={def}
        value={target[def.key]}
        disabled={busy || !boot.actor.rights.manage}
        onChange={changeValue}
        onBrowse={browseControl}
        onUpload={
          boot.actor.rights.media ? (d) => attachFile(d, key, unit) : undefined
        }
        referenceName={assets[text(target[def.key])]?.name}
        path={(c ? c.key + "." + unit + "." : "") + def.key}
      />
    );
  };
  function showIssue(path: string) {
    const match = path.match(/^([^.]+)\.([^.]+)\./);
    if (match) {
      const schema = f?.collections.find((c) => c.key === match[1]),
        unit = /^\d+$/.test(match[2])
          ? text(array(data[match[1]])[Number(match[2])]?.id)
          : match[2];
      if (schema) setFocusedUnit(unit);
    }
    requestAnimationFrame(() => {
      const candidates = [
        ...document.querySelectorAll<HTMLElement>("[data-creation-path]"),
      ];
      const target = candidates.find((el) => el.dataset.creationPath === path);
      if (target) {
        for (
          let parent = target.parentElement;
          parent;
          parent = parent.parentElement
        )
          if (parent instanceof HTMLDetailsElement) parent.open = true;
        target.scrollIntoView({ block: "center", behavior: "smooth" });
        target
          .querySelector<HTMLElement>("input,textarea,select,button")
          ?.focus();
      } else setDrawer(true);
    });
  }
  const [pages, setPages] = useState<Record<string, number>>({});
  const selectedRow = rows.find((r) => r.id === focusedUnit) || rows[0],
    selectedUpload = activeQueue.find(
      (q) => q.unit === selectedRow?.id && q.field === "assetId",
    ),
    selectedAsset =
      assets[text(selectedRow?.assetId)] || assets[selectedUpload?.id || ""],
    selectedMime = selectedAsset?.mime || selectedUpload?.mime;
  const nativeCollectionRows = (c: Collection, advanced = false) => {
    const allRows = array(data[c.key]),
      pageKey = current!.clientId + ":" + c.key + ":" + advanced,
      page = Math.min(
        pages[pageKey] || 0,
        Math.max(0, Math.ceil(allRows.length / 20) - 1),
      ),
      offset = page * 20;
    return (
      <>
        <div className={s.rowStack}>
          {allRows.slice(offset, offset + 20).map((row, localIndex) => {
            const index = offset + localIndex;
            return (
              <article
                key={text(row.id)}
                className={`${s.contentCard} ${row.id === focusedUnit ? s.focusCard : ""}`}
                data-unit={row.id}
                onClick={() => setFocusedUnit(text(row.id))}
                draggable={!busy}
                onDragStart={(e) => {
                  if (
                    (e.target as HTMLElement).closest(
                      "input,textarea,select,button",
                    )
                  ) {
                    e.preventDefault();
                    return;
                  }
                  setDragged({ collection: c.key, index });
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (dragged?.collection === c.key)
                    reorder(c, dragged.index, index);
                  setDragged(null);
                }}
              >
                <header>
                  <span className={s.ordinal}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <strong>
                    {text(row.title || row.prompt || row.label) ||
                      tr(c.label, locale)}
                  </strong>
                  <div className={s.rowTools}>
                    <button
                      disabled={busy || index === 0}
                      className={s.iconButton}
                      title={t("Move up", "Monter", "نقل للأعلى")}
                      onClick={() => reorder(c, index, index - 1)}
                    >
                      <Icon name="ArrowUp" size={14} />
                    </button>
                    <button
                      disabled={busy || index === array(data[c.key]).length - 1}
                      className={s.iconButton}
                      title={t("Move down", "Descendre", "نقل للأسفل")}
                      onClick={() => reorder(c, index, index + 1)}
                    >
                      <Icon name="ArrowDown" size={14} />
                    </button>
                    <button
                      disabled={busy}
                      className={s.iconButton}
                      title={t(
                        "Remove item",
                        "Retirer l’élément",
                        "حذف العنصر",
                      )}
                      onClick={() => removeRow(c, text(row.id))}
                    >
                      <Icon name="Trash" size={14} />
                    </button>
                  </div>
                </header>
                <details
                  className={s.sourceDetails}
                  open={advanced || c.key !== "units" || !row.assetId}
                >
                  <summary>
                    {t(
                      "Edit content and file settings",
                      "Modifier le contenu et le fichier",
                      "تعديل المحتوى والملف",
                    )}
                  </summary>
                  {c.key === "questions" && !advanced ? (
                    <QuestionEditor
                      row={row}
                      language={language}
                      disabled={busy || !boot.actor.rights.manage}
                      onChange={(values) =>
                        changeRow(c.key, text(row.id), values)
                      }
                    />
                  ) : (
                    <div className={s.contentFields}>
                      {(advanced
                        ? c.fields.filter((def) =>
                            visibleCreationField(def, record!),
                          )
                        : primaryFields(c, record!)
                      )
                        .filter((def) => {
                          if (
                            !advanced &&
                            c.key === "tasks" &&
                            (def.key === "answer" ||
                              (data.engine === "sorting" &&
                                def.key === "choices"))
                          )
                            return false;
                          if (!advanced && c.key === "units") {
                            if (def.key === "assetId" && row.kind === "article")
                              return false;
                            if (
                              def.key === "duration" &&
                              !["video", "audio"].includes(text(row.kind))
                            )
                              return false;
                            if (
                              def.key === "module" &&
                              modeContract(f, data)?.engine !== "video_course"
                            )
                              return false;
                            if (
                              def.key === "assessmentId" &&
                              modeContract(f, data)?.engine !==
                                "assessment_path"
                            )
                              return false;
                          }
                          if (record?.family === "forms" && def.key === "type")
                            return true;
                          return true;
                        })
                        .map((def) =>
                          fieldControl(
                            record?.family === "forms" && def.key === "type"
                              ? {
                                  ...def,
                                  options: def.options?.filter(
                                    (v) =>
                                      !["file", "email", "tel"].includes(v),
                                  ),
                                }
                              : def,
                            row,
                            c,
                          ),
                        )}
                      {c.key === "tasks" && !advanced && (
                        <ActivityAnswer
                          row={row}
                          engine={text(data.engine)}
                          disabled={busy}
                          partners={array(data.tasks)}
                          onPair={(partner) => {
                            if (!partner) return;
                            const pair = "pair-" + creationId();
                            patch({
                              tasks: array(data.tasks).map((task) =>
                                task.id === row.id || task.id === partner
                                  ? { ...task, answer: pair }
                                  : task,
                              ),
                            });
                          }}
                          onChange={(values) =>
                            changeRow(c.key, text(row.id), values)
                          }
                        />
                      )}
                    </div>
                  )}
                  {c.key === "questions" && !advanced && (
                    <details className={s.optional}>
                      <summary>
                        {t(
                          "More question settings",
                          "Autres réglages de la question",
                          "إعدادات إضافية للسؤال",
                        )}
                      </summary>
                      <div className={s.contentFields}>
                        {c.fields
                          .filter(
                            (def) =>
                              ![
                                "id",
                                "prompt",
                                "type",
                                "choices",
                                "answer",
                                "acceptedAnswers",
                                "correctKeys",
                                "choiceKeys",
                                "points",
                                "explanation",
                              ].includes(def.key) &&
                              visibleCreationField(def, record!),
                          )
                          .map((def) => fieldControl(def, row, c))}
                      </div>
                    </details>
                  )}
                </details>
              </article>
            );
          })}
        </div>
        {allRows.length > 20 && (
          <div className={s.pager}>
            <Button
              disabled={page === 0}
              onClick={() =>
                setPages((old) => ({ ...old, [pageKey]: page - 1 }))
              }
            >
              {t("Previous", "Précédent", "السابق")}
            </Button>
            <span>
              {page + 1} / {Math.ceil(allRows.length / 20)}
            </span>
            <Button
              disabled={(page + 1) * 20 >= allRows.length}
              onClick={() =>
                setPages((old) => ({ ...old, [pageKey]: page + 1 }))
              }
            >
              {t("Next", "Suivant", "التالي")}
            </Button>
          </div>
        )}
      </>
    );
  };
  function prepareSheet(value = sheetText) {
    try {
      const parsed = parseCreationSheet(value);
      setSheet(parsed);
      setMapping(suggestCreationMapping(parsed, collection!));
      setSheetError("");
    } catch (error) {
      setSheetError((error as Error).message);
    }
  }
  const close = () => {
    if (drawer || reference) {
      setDrawer(false);
      setReference(null);
      return;
    }
    persistRef.current();
    onClose();
  };
  return (
    <Dialog
      workspace
      title={t("Create & publish", "Créer et publier", "إنشاء ونشر")}
      onClose={close}
    >
      <div
        className={s.studio}
        dir={locale === "ar" ? "rtl" : "ltr"}
        style={{ "--creation-accent": f?.color || "#1262e8" } as CSSProperties}
      >
        <input
          ref={input}
          type="file"
          className={s.hidden}
          multiple
          accept={plan?.accept}
          onChange={(e) => {
            void intake(Array.from(e.target.files || []));
            e.target.value = "";
          }}
        />
        <input
          ref={attachmentInput}
          type="file"
          className={s.hidden}
          accept={attach?.accept}
          onChange={(e) => {
            const list = Array.from(e.target.files || []);
            void intake(list, attach);
            e.target.value = "";
            setAttach(null);
          }}
        />
        <input
          ref={sheetInput}
          type="file"
          className={s.hidden}
          accept=".csv,.tsv,text/csv,text/tab-separated-values"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const source = await file.text();
              setSheetText(source);
              prepareSheet(source);
            }
            e.target.value = "";
          }}
        />
        <div className={s.topbar}>
          <div className={s.topIdentity}>
            <span className={s.topMark}>
              <Icon name={f?.icon || "Layers"} size={22} />
            </span>
            <div>
              <span className={s.eyebrow}>KIDFLIX · CONTENT 360</span>
              <strong>
                {f
                  ? tr(f.name, locale)
                  : t(
                      "What are you creating?",
                      "Que souhaitez-vous créer ?",
                      "ماذا تريد أن تنشئ؟",
                    )}
              </strong>
            </div>
          </div>
          <div className={s.topActions}>
            <span className={s.autosave}>
              <i />
              {current?.status === "saving"
                ? t("Saving…", "Enregistrement…", "جارٍ الحفظ…")
                : current?.record.id && current.version === current.savedVersion
                  ? t("Saved", "Enregistré", "محفوظ")
                  : t(
                      "Draft recovery active",
                      "Reprise du brouillon active",
                      "استعادة المسودة مفعلة",
                    )}
            </span>
            <label className={s.languageLabel}>
              <Icon name="Globe" size={15} />
              <select
                aria-label={t(
                  "Content language",
                  "Langue du contenu",
                  "لغة المحتوى",
                )}
                value={language}
                disabled={busy}
                onChange={(e) =>
                  changeContentLanguage(e.target.value as Locale)
                }
              >
                {authoringLocales(boot.settings).map((l) => (
                  <option key={l} value={l}>
                    {l === "fr"
                      ? "Français"
                      : l === "ar"
                        ? "العربية"
                        : "English"}
                  </option>
                ))}
              </select>
            </label>
            {current && (
              <Button
                disabled={busy}
                icon="Settings"
                onClick={() => setDrawer(true)}
              >
                {t("Advanced", "Avancé", "متقدم")}
              </Button>
            )}
          </div>
        </div>
        {restore && (
          <div className={s.recovery}>
            <Icon name="RotateCcw" />
            <div>
              <strong>
                {t(
                  "Your previous work is available",
                  "Votre travail précédent est disponible",
                  "عملك السابق متاح",
                )}
              </strong>
              <span>
                {restore.entries.length}{" "}
                {t(
                  "resource(s), with saved file receipts. Unfinished local files may need reselection.",
                  "ressource(s), avec leurs références de fichiers. Les fichiers non terminés peuvent nécessiter une nouvelle sélection.",
                  "مورد مع مراجع الملفات. قد تحتاج الملفات غير المكتملة إلى إعادة الاختيار.",
                )}
              </span>
            </div>
            <Button
              onClick={() => {
                const retained = restore.queue || [];
                committing(
                  restore.entries.map((e) => {
                    let recovered = e.record;
                    for (const q of retained.filter(
                      (q) =>
                        q.resource === e.clientId &&
                        q.state === "ready" &&
                        q.assetId,
                    )) {
                      recovered =
                        q.collection === "@root"
                          ? {
                              ...recovered,
                              data: {
                                ...object(recovered.data),
                                [q.field]: q.assetId!,
                              },
                            }
                          : updateUnit(recovered, q.collection, q.unit, {
                              [q.field]: q.assetId!,
                            });
                    }
                    return signature(recovered) === signature(e.record)
                      ? e
                      : { ...e, record: recovered, version: e.version + 1 };
                  }),
                );
                putQueue(
                  retained.map((q) =>
                    q.state === "ready"
                      ? q
                      : {
                          ...q,
                          state:
                            q.uploaded && q.assetId && q.checksum
                              ? "queued"
                              : "needs-file",
                        },
                  ),
                );
                for (const q of retained)
                  if (
                    q.state !== "ready" &&
                    q.uploaded &&
                    q.assetId &&
                    q.checksum
                  )
                    void runUpload(q.id);
                setContentLanguage(restore.language);
                setActive(restore.entries[0].clientId);
                setRestore(null);
              }}
            >
              {t("Resume", "Reprendre", "متابعة")}
            </Button>
            <Button onClick={() => setRestore(null)}>
              {t(
                "Keep this session",
                "Garder cette session",
                "متابعة الجلسة الحالية",
              )}
            </Button>
          </div>
        )}
        {notice && (
          <div className={s.notice} role="status">
            <span>{notice}</span>
            <button
              className={s.iconButton}
              onClick={() => setNotice("")}
              aria-label={t("Dismiss", "Fermer", "إغلاق")}
            >
              <Icon name="X" size={15} />
            </button>
          </div>
        )}
        {!record ? (
          <main className={s.directory}>
            <div className={s.directoryIntro}>
              <span className={s.eyebrow}>
                {t(
                  "ONE RESOURCE. ITS OWN WORKSPACE.",
                  "UNE RESSOURCE. SON PROPRE ATELIER.",
                  "لكل مورد ورشته الخاصة.",
                )}
              </span>
              <h2>
                {t(
                  "Choose your content. We prepare its workspace.",
                  "Choisissez le contenu. Son atelier est prêt.",
                  "اختر محتواك لنجهز ورشته.",
                )}
              </h2>
              <p>
                {t(
                  "Upload, compose and publish here. Your complete editor stays available whenever needed.",
                  "Ajoutez, composez et publiez ici. L’éditeur complet reste disponible à tout moment.",
                  "ارفع وألف وانشر هنا. يبقى المحرر الكامل متاحاً عند الحاجة.",
                )}
              </p>
              <label className={s.search}>
                <Icon name="Search" />
                <input
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder={t(
                    "Find a category",
                    "Trouver une catégorie",
                    "البحث عن فئة",
                  )}
                />
              </label>
            </div>
            <div className={s.categoryGrid}>
              {authoringFamilies(boot.settings)
                .filter((category) =>
                  tr(category.name, locale)
                    .toLowerCase()
                    .includes(categorySearch.toLowerCase()),
                )
                .map((category) => (
                  <button
                    key={category.key}
                    className={s.categoryCard}
                    style={{ "--tile-accent": category.color } as CSSProperties}
                    onClick={() => start(category.key)}
                  >
                    <span className={s.categoryIcon}>
                      <Icon name={category.icon} size={25} />
                    </span>
                    <small>{String(category.number).padStart(2, "0")}</small>
                    <strong>{tr(category.name, locale)}</strong>
                    <p>{tr(CREATION_PLANS[category.key].hint, locale)}</p>
                    <span className={s.categoryGo}>
                      {t("Open workshop", "Ouvrir l’atelier", "فتح الورشة")}{" "}
                      <Icon name="ArrowUpRight" size={16} />
                    </span>
                  </button>
                ))}
            </div>
          </main>
        ) : (
          <>
            <div className={s.layout}>
              <aside className={s.resourceRail}>
                <div className={s.railHeading}>
                  <span>{t("RESOURCES", "RESSOURCES", "الموارد")}</span>
                  <strong>{entries.length}</strong>
                </div>
                <div className={s.railList}>
                  {entries.map((entry, index) => (
                    <div
                      key={entry.clientId}
                      className={`${s.railItem} ${entry.clientId === current.clientId ? s.activeResource : ""}`}
                    >
                      <input
                        type="checkbox"
                        aria-label={t(
                          "Include in publication",
                          "Inclure dans la publication",
                          "تضمين في النشر",
                        )}
                        checked={entry.selected}
                        onChange={(e) =>
                          committing(
                            entriesRef.current.map((r) =>
                              r.clientId === entry.clientId
                                ? { ...r, selected: e.target.checked }
                                : r,
                            ),
                          )
                        }
                      />
                      <button
                        onClick={() => {
                          setActive(entry.clientId);
                          setFocusedUnit("");
                          setShowSheet(false);
                          setSheet(null);
                        }}
                      >
                        <span className={s.railOrdinal}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <strong>
                          {entry.record.title ||
                            t(
                              "Untitled resource",
                              "Ressource sans titre",
                              "مورد بلا عنوان",
                            )}
                        </strong>
                        <small
                          className={
                            entry.result?.publicPath
                              ? s.successText
                              : entry.error
                                ? s.errorText
                                : ""
                          }
                        >
                          {entry.result?.publicPath &&
                          entry.result.signature === signature(entry.record)
                            ? t("Published", "Publié", "منشور")
                            : entry.result?.review &&
                                entry.result.signature ===
                                  signature(entry.record)
                              ? t(
                                  "Awaiting approval",
                                  "En attente d’approbation",
                                  "بانتظار الاعتماد",
                                )
                              : entry.error
                                ? t(
                                    "Needs attention",
                                    "À corriger",
                                    "يحتاج تصحيحاً",
                                  )
                                : entry.record.id &&
                                    entry.version !== entry.savedVersion
                                  ? t(
                                      "Modified draft",
                                      "Brouillon modifié",
                                      "مسودة معدلة",
                                    )
                                  : entry.record.id
                                    ? t(
                                        "Saved draft",
                                        "Brouillon enregistré",
                                        "مسودة محفوظة",
                                      )
                                    : t(
                                        "In preparation",
                                        "En préparation",
                                        "قيد التحضير",
                                      )}
                        </small>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className={s.addResource}
                  onClick={() => {
                    setActive("");
                    committing(entriesRef.current);
                    setDrawer(false);
                    setReference(null);
                    const e: Entry = {
                      clientId: creationId(),
                      record: newCreation(f!.key, language, boot.settings),
                      version: 0,
                      savedVersion: -1,
                      selected: true,
                    };
                    committing([...entriesRef.current, e]);
                    setActive(e.clientId);
                  }}
                >
                  <Icon name="Plus" size={16} />
                  {t("Another resource", "Autre ressource", "مورد آخر")}
                </button>
                <button
                  className={s.textButton}
                  onClick={() => {
                    setNotice(
                      t(
                        "Use the category selector below to add another content type.",
                        "Utilisez le sélecteur ci-dessous pour ajouter un autre type de contenu.",
                        "استخدم محدد الفئات لإضافة نوع محتوى آخر.",
                      ),
                    );
                    setDrawer(true);
                  }}
                >
                  {t("Other categories", "Autres catégories", "فئات أخرى")}
                </button>
                <div className={s.railNote}>
                  <Icon name="ShieldCheck" size={18} />
                  <span>
                    {t(
                      "Your files and drafts use the existing native libraries.",
                      "Vos fichiers et brouillons utilisent les bibliothèques natives existantes.",
                      "تستخدم ملفاتك ومسوداتك المكتبات الأصلية الحالية.",
                    )}
                  </span>
                </div>
              </aside>
              <main className={s.canvas}>
                <div className={s.canvasHeading}>
                  <div>
                    <span className={s.eyebrow}>{tr(plan.title, locale)}</span>
                    <h2>
                      {t(
                        "Make it ready. Make it yours.",
                        "Préparez votre prochaine ressource.",
                        "جهّز موردك القادم.",
                      )}
                    </h2>
                    <p>{tr(plan.hint, locale)}</p>
                  </div>
                  <span className={s.categoryNumber}>
                    {String(f!.number).padStart(2, "0")}
                  </span>
                </div>
                <div className={s.templateAction}>
                  <button
                    className={s.textButton}
                    disabled={busy}
                    onClick={() =>
                      browse({
                        type: "record",
                        kind: "template",
                        family: f!.key,
                        label: t(
                          "Published templates",
                          "Modèles publiés",
                          "القوالب المنشورة",
                        ),
                        choose: async (source) => {
                          try {
                            const response = await query<any>({
                              op: "operator_template",
                              id: source.id,
                              family: f!.key,
                              locale: language,
                            });
                            if (
                              (text(record.title) || rows.length) &&
                              !confirm(
                                t(
                                  "Create another resource from this template and retain this draft?",
                                  "Créer une autre ressource depuis ce modèle et conserver ce brouillon ?",
                                  "إنشاء مورد آخر من القالب والاحتفاظ بهذه المسودة؟",
                                ),
                              )
                            )
                              return;
                            const fresh = newCreation(
                              f!.key,
                              language,
                              boot.settings,
                              response.prepared,
                            );
                            fresh.topic = record.topic || fresh.topic;
                            if (data.subtype)
                              fresh.data = {
                                ...object(fresh.data),
                                subtype: data.subtype,
                              };
                            if (
                              !text(record.title) &&
                              !rows.length &&
                              !record.id
                            ) {
                              change(current.clientId, () => fresh);
                            } else {
                              const entry: Entry = {
                                clientId: creationId(),
                                record: fresh,
                                version: 0,
                                savedVersion: -1,
                                selected: true,
                              };
                              committing([...entriesRef.current, entry]);
                              setActive(entry.clientId);
                            }
                          } catch (error) {
                            setNotice((error as Error).message);
                          }
                        },
                      })
                    }
                  >
                    {t(
                      "Start from a published template",
                      "Partir d’un modèle publié",
                      "البدء بقالب منشور",
                    )}
                  </button>
                </div>
                <label className={s.titleField} data-creation-path="title">
                  {t("Resource title", "Titre de la ressource", "عنوان المورد")}
                  <input
                    dir="auto"
                    value={text(record.title)}
                    disabled={busy}
                    onChange={(e) =>
                      change(current.clientId, (r) =>
                        writeTitle(r, e.target.value, language),
                      )
                    }
                    placeholder={t(
                      "Suggested from your file, always editable",
                      "Proposé depuis votre fichier, toujours modifiable",
                      "مقترح من اسم الملف ويمكن تعديله",
                    )}
                  />
                </label>
                {plan.accept && (
                  <section
                    className={s.sourceSection}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      void intake(Array.from(e.dataTransfer.files));
                    }}
                  >
                    <button
                      className={s.dropzone}
                      disabled={busy || !boot.actor.rights.media}
                      onClick={() => input.current?.click()}
                    >
                      <span className={s.uploadIcon}>
                        <Icon name="CloudUpload" size={26} />
                      </span>
                      <span>
                        <strong>
                          {t(
                            "Drop files here, or choose files",
                            "Déposez vos fichiers ici ou choisissez-les",
                            "أسقط الملفات هنا أو اخترها",
                          )}
                        </strong>
                        <small>
                          {t(
                            "Native upload · immediate preview · automatic connections",
                            "Ajout natif · aperçu immédiat · liaisons automatiques",
                            "رفع أصلي · معاينة فورية · ربط تلقائي",
                          )}
                        </small>
                      </span>
                      <Icon name="Plus" size={20} />
                    </button>
                    <div className={s.sourceOptions}>
                      <label>
                        <input
                          type="checkbox"
                          checked={groupFiles}
                          disabled={busy}
                          onChange={(e) => setGroupFiles(e.target.checked)}
                        />
                        {t(
                          "Keep all added files in this resource",
                          "Regrouper les fichiers dans cette ressource",
                          "جمع الملفات في هذا المورد",
                        )}
                      </label>
                      <button
                        className={s.textButton}
                        onClick={() =>
                          browse({
                            type: "media",
                            mime: plan.accept.split(","),
                            label: t(
                              "Existing files",
                              "Fichiers existants",
                              "الملفات الموجودة",
                            ),
                            choose: (r) => {
                              setAsset(r.id, {
                                name: r.title || r.file_name || r.key,
                                mime: r.mime,
                                url: r.url,
                              });
                              const next = appendSource(
                                record,
                                {
                                  id: r.id,
                                  name: r.title || r.file_name || r.key,
                                  mime: r.mime,
                                  duration:
                                    Number(
                                      r.duration || r.metadata?.duration,
                                    ) || undefined,
                                },
                                language,
                              );
                              change(current.clientId, () => next.record);
                              setFocusedUnit(text(next.unit.id));
                            },
                          })
                        }
                      >
                        {t(
                          "Use an existing file",
                          "Utiliser un fichier existant",
                          "استخدام ملف موجود",
                        )}
                      </button>
                    </div>
                  </section>
                )}
                {activeQueue.length > 0 && (
                  <div className={s.uploadQueue}>
                    {activeQueue.map((q) => (
                      <div key={q.id} className={s.uploadRow}>
                        <Icon
                          name={
                            q.state === "ready" ? "CircleCheck" : "FileText"
                          }
                          size={17}
                        />
                        <div>
                          <strong>{q.name}</strong>
                          <small
                            className={q.state === "failed" ? s.errorText : ""}
                          >
                            {q.error || tr(uploadText[q.state], locale)}
                            {q.pageCount
                              ? ` · ${q.pageCount} ` +
                                t("pages", "pages", "صفحات")
                              : ""}
                          </small>
                          <progress
                            max={100}
                            value={q.progress}
                            aria-label={q.name}
                          />
                        </div>
                        {["failed", "needs-file"].includes(q.state) && (
                          <Button
                            disabled={busy}
                            onClick={() => {
                              if (files.current.has(q.id)) void runUpload(q.id);
                              else
                                setAttach({
                                  resource: q.resource,
                                  collection: q.collection,
                                  unit: q.unit,
                                  field: q.field,
                                  accept: q.mime,
                                  retry: q.id,
                                });
                            }}
                            icon="RefreshCw"
                          >
                            {t("Retry", "Reprendre", "إعادة المحاولة")}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {selectedAsset?.url &&
                  selectedMime &&
                  [
                    "reader",
                    "sheets",
                    "story",
                    "video",
                    "audio",
                    "slides",
                    "planner",
                  ].includes(plan.style) && (
                    <section className={s.filePreview}>
                      <header>
                        <span>
                          <Icon name="Eye" size={16} />
                          {t(
                            "Actual file preview",
                            "Aperçu du fichier réel",
                            "معاينة الملف الحقيقي",
                          )}
                        </span>
                        <small>{selectedAsset.name}</small>
                      </header>
                      {selectedMime === "application/pdf" ? (
                        <iframe
                          title={selectedAsset.name}
                          src={selectedAsset.url + "#toolbar=1"}
                        />
                      ) : selectedMime.startsWith("image/") ? (
                        <img
                          src={selectedAsset.url}
                          alt={text(selectedRow?.alt) || selectedAsset.name}
                        />
                      ) : selectedMime.startsWith("video/") ? (
                        <video controls src={selectedAsset.url} />
                      ) : (
                        <div className={s.audioPreview}>
                          <Icon name="AudioLines" size={38} />
                          <audio controls src={selectedAsset.url} />
                        </div>
                      )}
                    </section>
                  )}
                {f!.key === "activities" && (
                  <section className={s.activityTypes}>
                    <span className={s.fieldLabel}>
                      {t(
                        "Choose the activity",
                        "Choisir l’activité",
                        "اختيار النشاط",
                      )}
                    </span>
                    <div className={s.activityGrid}>
                      {[
                        [
                          "matching",
                          "Link",
                          words("Match pairs", "Associer", "مطابقة"),
                        ],
                        [
                          "memory",
                          "Images",
                          words("Memory", "Mémoire", "ذاكرة"),
                        ],
                        [
                          "sequence",
                          "ListChecks",
                          words("Sequence", "Ordonner", "تسلسل"),
                        ],
                        [
                          "sorting",
                          "FolderTree",
                          words("Sort", "Classer", "تصنيف"),
                        ],
                        [
                          "choice",
                          "ClipboardCheck",
                          words("Choose", "Choisir", "اختيار"),
                        ],
                        [
                          "bridge",
                          "Workflow",
                          words(
                            "Bridge lab",
                            "Laboratoire de ponts",
                            "مختبر الجسور",
                          ),
                        ],
                      ].map(([key, icon, l]) => (
                        <button
                          key={key as string}
                          disabled={busy}
                          aria-pressed={data.engine === key}
                          onClick={() =>
                            patch({
                              engine: key as string,
                              ...(key === "sequence"
                                ? {
                                    tasks: array(data.tasks).map(
                                      (task, index) => ({
                                        ...task,
                                        answer: String(index + 1),
                                      }),
                                    ),
                                  }
                                : {}),
                            })
                          }
                        >
                          <Icon name={icon as string} size={21} />
                          <span>{tr(l as Tri, locale)}</span>
                        </button>
                      ))}
                    </div>
                    {f!.fields
                      .filter((def) =>
                        ["goal", "accessibleText"].includes(def.key),
                      )
                      .map((def) => fieldControl(def))}
                    {data.engine === "sorting" && (
                      <label className={s.field}>
                        {t(
                          "Sorting groups · one per line",
                          "Groupes de classement · un par ligne",
                          "مجموعات التصنيف · واحدة في كل سطر",
                        )}
                        <textarea
                          value={text(array(data.tasks)[0]?.choices)}
                          onChange={(e) => {
                            const existing = array(data.tasks);
                            const list = existing.length
                              ? existing
                              : [
                                  newCreationUnit(
                                    f!.collections.find(
                                      (c) => c.key === "tasks",
                                    )!,
                                    language,
                                  ),
                                ];
                            patch({
                              tasks: list.map((task) => ({
                                ...task,
                                choices: e.target.value,
                              })),
                            });
                          }}
                        />
                      </label>
                    )}
                  </section>
                )}
                {f!.key === "tools" && (
                  <div className={s.contextSettings}>
                    {f!.fields
                      .filter((def) =>
                        ["model", "operation", "assumptions"].includes(def.key),
                      )
                      .map((def) => fieldControl(def))}
                  </div>
                )}
                {f!.key === "community" && (
                  <div className={s.notice}>
                    <Icon name="BookOpen" size={17} />
                    {t(
                      "Read-only public archive. Visitor posting stays disabled.",
                      "Archives publiques en lecture seule. Les contributions des visiteurs restent désactivées.",
                      "أرشيف عام للقراءة فقط. تبقى مساهمات الزوار معطلة.",
                    )}
                  </div>
                )}
                {collection && (
                  <section className={s.builder}>
                    <div className={s.sectionHeading}>
                      <div>
                        <h3>{tr(collection.label, locale)}</h3>
                        <small className={s.muted}>
                          {rows.length}{" "}
                          {t(
                            "item(s) · reorder with arrows or drag",
                            "élément(s) · flèches ou glisser-déposer",
                            "عنصر · رتّب بالأسهم أو السحب",
                          )}
                        </small>
                      </div>
                      <div className={s.inlineActions}>
                        <Button
                          disabled={busy}
                          icon="Import"
                          onClick={() => {
                            setShowSheet((v) => !v);
                            setSheet(null);
                            setSheetError("");
                          }}
                        >
                          {t("Paste / CSV", "Coller / CSV", "لصق / CSV")}
                        </Button>
                        <Button
                          disabled={busy || !boot.actor.rights.manage}
                          icon="Plus"
                          onClick={() => addRow()}
                        >
                          {f!.key === "activities" &&
                          ["matching", "memory"].includes(text(data.engine))
                            ? t("Add a pair", "Ajouter une paire", "إضافة زوج")
                            : tr(plan.add, locale)}
                        </Button>
                      </div>
                    </div>
                    {showSheet && (
                      <section className={s.sheetStudio}>
                        <div className={s.sectionHeading}>
                          <h4>
                            {t(
                              "Bring your existing rows",
                              "Ajoutez vos lignes existantes",
                              "أضف صفوفك الحالية",
                            )}
                          </h4>
                          <button
                            className={s.iconButton}
                            onClick={() => setShowSheet(false)}
                            aria-label={t(
                              "Close import",
                              "Fermer l’import",
                              "إغلاق الاستيراد",
                            )}
                          >
                            <Icon name="X" />
                          </button>
                        </div>
                        <p>
                          {t(
                            "Paste a table with its header row, or choose CSV/TSV. Item identifiers are created automatically.",
                            "Collez un tableau avec ses en-têtes ou choisissez un CSV/TSV. Les identifiants sont créés automatiquement.",
                            "ألصق جدولاً بعناوين أعمدته أو اختر CSV/TSV. تُنشأ المعرفات تلقائياً.",
                          )}
                        </p>
                        <textarea
                          rows={5}
                          value={sheetText}
                          onChange={(e) => setSheetText(e.target.value)}
                          placeholder={
                            collection.key === "questions"
                              ? "Question\tChoix A\tChoix B\tBonne réponse"
                              : "Titre\tTexte"
                          }
                        />
                        <div className={s.inlineActions}>
                          <Button
                            onClick={() => sheetInput.current?.click()}
                            icon="CloudUpload"
                          >
                            {t(
                              "Choose CSV / TSV",
                              "Choisir CSV / TSV",
                              "اختيار CSV / TSV",
                            )}
                          </Button>
                          <Button onClick={() => prepareSheet()}>
                            {t(
                              "Read columns",
                              "Lire les colonnes",
                              "قراءة الأعمدة",
                            )}
                          </Button>
                        </div>
                        {sheet && (
                          <>
                            <div className={s.mappingRows}>
                              {sheet.headers.map((header, index) => (
                                <label key={index}>
                                  <span>{header}</span>
                                  <select
                                    value={mapping[index] || ""}
                                    onChange={(e) =>
                                      setMapping((old) =>
                                        old.map((v, i) =>
                                          i === index ? e.target.value : v,
                                        ),
                                      )
                                    }
                                  >
                                    <option value="">
                                      {t(
                                        "Ignore this column",
                                        "Ignorer cette colonne",
                                        "تجاهل العمود",
                                      )}
                                    </option>
                                    {collection.key === "questions" && (
                                      <option value="@choice">
                                        {t(
                                          "One answer choice",
                                          "Un choix de réponse",
                                          "خيار إجابة",
                                        )}
                                      </option>
                                    )}
                                    {collection.fields
                                      .filter((def) => def.key !== "id")
                                      .map((def) => (
                                        <option key={def.key} value={def.key}>
                                          {tr(def.label, locale)}
                                        </option>
                                      ))}
                                  </select>
                                  <small>
                                    {sheet.rows[0]?.[index]?.slice(0, 80)}
                                  </small>
                                </label>
                              ))}
                            </div>
                            {collection.key === "questions" && (
                              <label className={s.field}>
                                {t(
                                  "Correct-answer notation in your source",
                                  "Notation des bonnes réponses dans votre source",
                                  "ترميز الإجابات الصحيحة في المصدر",
                                )}
                                <select
                                  value={answerFormat}
                                  onChange={(e) =>
                                    setAnswerFormat(
                                      e.target.value as typeof answerFormat,
                                    )
                                  }
                                >
                                  <option value="text">
                                    {t(
                                      "Exact answer text",
                                      "Texte exact de la réponse",
                                      "نص الإجابة بالضبط",
                                    )}
                                  </option>
                                  <option value="letter">A / B / C</option>
                                  <option value="position">1 / 2 / 3</option>
                                </select>
                              </label>
                            )}
                            <Button
                              kind="primary"
                              onClick={() => {
                                try {
                                  const imported = importCreationUnits(
                                    sheet,
                                    mapping,
                                    collection,
                                    language,
                                    answerFormat,
                                  );
                                  const combined = [...rows, ...imported];
                                  if (
                                    combined.length >
                                    Math.min(collection.max || 2000, 2000)
                                  )
                                    throw Error(
                                      t(
                                        "Split this content into multiple resources to respect its native item limit.",
                                        "Répartissez ce contenu entre plusieurs ressources pour respecter la limite native.",
                                        "قسّم المحتوى إلى عدة موارد للالتزام بالحد الأصلي.",
                                      ),
                                    );
                                  if (
                                    new TextEncoder().encode(
                                      JSON.stringify({
                                        ...data,
                                        [collection.key]: combined,
                                      }),
                                    ).length >
                                    512 * 1024
                                  )
                                    throw Error(
                                      t(
                                        "This resource exceeds the native 512 KiB document limit. Import a smaller group of rows.",
                                        "La ressource dépasse la limite native de 512 Kio. Importez un groupe de lignes plus petit.",
                                        "يتجاوز المورد الحد الأصلي البالغ 512 كيلوبايت. استورد مجموعة أصغر من الصفوف.",
                                      ),
                                    );
                                  patch({ [collection.key]: combined });
                                  setShowSheet(false);
                                  setSheet(null);
                                  setSheetText("");
                                  setSheetError("");
                                } catch (error) {
                                  setSheetError((error as Error).message);
                                }
                              }}
                            >
                              {t(
                                `Add ${sheet.rows.length} items`,
                                `Ajouter ${sheet.rows.length} éléments`,
                                `إضافة ${sheet.rows.length} عنصر`,
                              )}
                            </Button>
                          </>
                        )}
                        {sheetError && (
                          <p role="alert" className={s.errorText}>
                            {sheetError}
                          </p>
                        )}
                      </section>
                    )}
                    {rows.length ? (
                      nativeCollectionRows(collection)
                    ) : (
                      <div className={s.contentEmpty}>
                        <Icon name={f!.icon} size={32} />
                        <h4>
                          {t(
                            "Ready for your content",
                            "Prêt pour votre contenu",
                            "جاهز لمحتواك",
                          )}
                        </h4>
                        <p>{tr(plan.hint, locale)}</p>
                        <Button icon="Plus" onClick={() => addRow()}>
                          {tr(plan.add, locale)}
                        </Button>
                      </div>
                    )}
                  </section>
                )}
              </main>
              <aside className={s.inspector}>
                <section className={s.essentialCard}>
                  <div className={s.sectionHeading}>
                    <h3>
                      {t(
                        "Essential settings",
                        "L’essentiel",
                        "الإعدادات الأساسية",
                      )}
                    </h3>
                    <Icon name="Settings" size={17} />
                  </div>
                  <label className={s.field}>
                    {t("Subcategory", "Sous-catégorie", "الفئة الفرعية")}
                    <select
                      disabled={busy}
                      value={text(data.subtype)}
                      onChange={(e) => patch({ subtype: e.target.value })}
                    >
                      <option value="">
                        {t(
                          "Choose if relevant",
                          "Choisir si pertinent",
                          "اختر عند الحاجة",
                        )}
                      </option>
                      {SUBTYPES[f!.key]?.authored.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {tr(sub.label, locale)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={s.field}>
                    {t("Audience", "Public", "الجمهور")}
                    <select
                      value={record.audience || "parent"}
                      disabled={busy}
                      onChange={(e) =>
                        change(current.clientId, (r) => ({
                          ...r,
                          audience: e.target.value,
                        }))
                      }
                    >
                      {[
                        ["parent", words("Parents", "Parents", "الآباء")],
                        ["child", words("Children", "Enfants", "الأطفال")],
                        [
                          "educator",
                          words("Educators", "Éducateurs", "المربون"),
                        ],
                        [
                          "professional",
                          words("Professionals", "Professionnels", "المهنيون"),
                        ],
                        [
                          "school",
                          words("Schools", "Établissements", "المؤسسات"),
                        ],
                      ].map(([key, l]) => (
                        <option key={key as string} value={key as string}>
                          {tr(l as Tri, locale)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={s.ageRow}>
                    <label className={s.field}>
                      {t("Minimum age", "Âge minimum", "السن الأدنى")}
                      <input
                        type="number"
                        min={0}
                        max={25}
                        disabled={busy}
                        value={Number(data.ageMin ?? 0)}
                        onChange={(e) =>
                          patch({ ageMin: Number(e.target.value) })
                        }
                      />
                    </label>
                    <label className={s.field}>
                      {t("Maximum age", "Âge maximum", "السن الأقصى")}
                      <input
                        type="number"
                        min={0}
                        max={25}
                        disabled={busy}
                        value={Number(data.ageMax ?? 18)}
                        onChange={(e) =>
                          patch({ ageMax: Number(e.target.value) })
                        }
                      />
                    </label>
                  </div>
                  <label className={s.field}>
                    {t(
                      "Public experience",
                      "Expérience publique",
                      "التجربة العامة",
                    )}
                    <select
                      disabled={busy}
                      value={text(data.mode)}
                      onChange={(e) => patch({ mode: e.target.value })}
                    >
                      {(f!.key === "forms"
                        ? f!.modes.slice(0, 2)
                        : f!.modes
                      ).map((mode) => (
                        <option key={mode} value={mode}>
                          {creationModeLabel(f!.key, mode, locale)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {f!.key === "assessments" &&
                    f!.fields
                      .filter(
                        (def) =>
                          [
                            "minutes",
                            "passingScore",
                            "feedback",
                            "retryPolicy",
                          ].includes(def.key) &&
                          visibleCreationField(def, record),
                      )
                      .map((def) => fieldControl(def))}
                  {entries.length > 1 && (
                    <Button
                      disabled={busy}
                      onClick={() => {
                        committing(
                          entriesRef.current.map((e) =>
                            e.clientId === current.clientId
                              ? e
                              : {
                                  ...e,
                                  record: {
                                    ...e.record,
                                    audience: record.audience,
                                    data: {
                                      ...object(e.record.data),
                                      subtype:
                                        e.record.family === f!.key
                                          ? data.subtype || ""
                                          : e.record.data?.subtype || "",
                                      ageMin: data.ageMin ?? 0,
                                      ageMax: data.ageMax ?? 18,
                                    },
                                  },
                                  version: e.version + 1,
                                },
                          ),
                        );
                        setNotice(
                          t(
                            "Audience and ages applied to this batch. Subcategory copied only within the same category.",
                            "Public et âges appliqués au lot. La sous-catégorie est copiée uniquement dans la même catégorie.",
                            "طُبق الجمهور والعمر على الدفعة. نُسخت الفئة الفرعية ضمن الفئة نفسها فقط.",
                          ),
                        );
                      }}
                    >
                      {t(
                        "Apply to this batch",
                        "Appliquer au lot",
                        "تطبيق على الدفعة",
                      )}
                    </Button>
                  )}
                </section>
                <section className={s.readinessCard}>
                  <div className={s.sectionHeading}>
                    <h3>{t("Publication", "Publication", "النشر")}</h3>
                    <span
                      className={issues.length ? s.attentionDot : s.readyDot}
                    />
                  </div>
                  <p>
                    {policy.loading
                      ? t(
                          "Checking publishing access…",
                          "Vérification de l’accès à la publication…",
                          "فحص صلاحية النشر…",
                        )
                      : policy.value.independentReview
                        ? t(
                            "Your organization requires an independent approver. This resource can be prepared and sent from here.",
                            "Votre organisation impose une approbation indépendante. Préparez et envoyez la ressource depuis cet atelier.",
                            "تتطلب المؤسسة اعتماداً مستقلاً. يمكنك التحضير والإرسال من هنا.",
                          )
                        : t(
                            "One action publishes this language through the native service.",
                            "Une action publie cette langue via le service natif.",
                            "ينشر إجراء واحد هذه اللغة عبر الخدمة الأصلية.",
                          )}
                  </p>
                  {policy.error ? (
                    <button className={s.textButton} onClick={policy.reload}>
                      {t(
                        "Retry the publishing check",
                        "Reprendre la vérification",
                        "إعادة فحص النشر",
                      )}
                    </button>
                  ) : (
                    !policy.loading &&
                    !policy.value.atomicPublish && (
                      <p className={s.errorText}>
                        {t(
                          "The Creation Studio SQL activation is required for direct publication.",
                          "L’activation SQL Creation Studio est requise pour publier directement.",
                          "يلزم تفعيل SQL Creation Studio للنشر المباشر.",
                        )}
                      </p>
                    )
                  )}
                  {issues.length ? (
                    <div className={s.issueList}>
                      {issues.slice(0, 6).map((issue, index) => (
                        <button
                          key={index}
                          onClick={() => showIssue(issue.path)}
                        >
                          <Icon name="CircleDashed" size={14} />
                          <span>{tr(issue.message, locale)}</span>
                          <Icon name="ChevronRight" size={13} />
                        </button>
                      ))}
                      {issues.length > 6 && (
                        <small>
                          {issues.length - 6}{" "}
                          {t(
                            "more items in advanced settings",
                            "autres points dans les réglages avancés",
                            "نقاط أخرى في الإعدادات المتقدمة",
                          )}
                        </small>
                      )}
                    </div>
                  ) : (
                    <div className={s.readyMessage}>
                      <Icon name="CircleCheck" size={18} />
                      {t(
                        "Essential content completed",
                        "Contenu essentiel complété",
                        "المحتوى الأساسي مكتمل",
                      )}
                    </div>
                  )}
                  {current.error && (
                    <p role="alert" className={s.errorBox}>
                      {current.error}
                    </p>
                  )}
                  {current.result?.publicPath && (
                    <a
                      className={s.publicLink}
                      href={current.result.publicPath}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon name="ArrowUpRight" />
                      {t(
                        "Open the published resource",
                        "Ouvrir la ressource publiée",
                        "فتح المورد المنشور",
                      )}
                    </a>
                  )}
                  {record.id && (
                    <Button
                      disabled={
                        busy || current.version !== current.savedVersion
                      }
                      icon="Eye"
                      onClick={() => preview(record.id!, undefined, language)}
                    >
                      {t(
                        "Test the native player",
                        "Tester le lecteur natif",
                        "اختبار المشغل الأصلي",
                      )}
                    </Button>
                  )}
                </section>
                <button
                  className={s.expertLink}
                  disabled={busy}
                  onClick={() => void openExpert()}
                >
                  <span>
                    <Icon name="PanelRightOpen" size={18} />
                    <strong>
                      {t(
                        "Complete expert editor",
                        "Éditeur expert complet",
                        "المحرر المتخصص الكامل",
                      )}
                    </strong>
                  </span>
                  <small>
                    {t(
                      "All capabilities, connected to this same resource.",
                      "Toutes les capacités, sur cette même ressource.",
                      "جميع الإمكانات مرتبطة بالمورد نفسه.",
                    )}
                  </small>
                </button>
              </aside>
            </div>
            <footer className={s.footer}>
              <div>
                <span className={s.footerCount}>
                  {String(readyCount).padStart(2, "0")}
                </span>
                <span>
                  <strong>
                    {t("ready to publish", "prête(s) à publier", "جاهز للنشر")}
                  </strong>
                  <small>
                    {language.toUpperCase()} ·{" "}
                    {policy.value.independentReview
                      ? t(
                          "Approval policy active",
                          "Approbation indépendante active",
                          "سياسة الاعتماد مفعلة",
                        )
                      : t(
                          "Native direct publication",
                          "Publication directe native",
                          "نشر أصلي مباشر",
                        )}
                  </small>
                </span>
              </div>
              <div className={s.footerActions}>
                <Button disabled={busy} onClick={close}>
                  {t("Close", "Fermer", "إغلاق")}
                </Button>
                <Button
                  disabled={busy || !boot.actor.rights.manage}
                  icon="Save"
                  onClick={() => {
                    setBusy(true);
                    void saveOne(current.clientId)
                      .then(() => refresh())
                      .catch((error) => setNotice(error.message))
                      .finally(() => setBusy(false));
                  }}
                >
                  {t("Save draft", "Enregistrer", "حفظ المسودة")}
                </Button>
                <Button
                  kind="primary"
                  disabled={
                    busy ||
                    policy.loading ||
                    !!policy.error ||
                    !boot.actor.rights.manage ||
                    (!policy.value.independentReview &&
                      (!boot.actor.rights.publish ||
                        !policy.value.atomicPublish)) ||
                    !entries.some((e) => e.selected)
                  }
                  icon={busy ? "LoaderCircle" : "Rocket"}
                  onClick={() => void publishSelected()}
                >
                  {busy
                    ? t("Processing…", "Traitement…", "جارٍ التنفيذ…")
                    : policy.value.independentReview
                      ? t(
                          "Send for approval",
                          "Envoyer pour approbation",
                          "إرسال للاعتماد",
                        )
                      : entries.filter((e) => e.selected).length > 1
                        ? t(
                            "Publish selected resources",
                            "Publier la sélection",
                            "نشر الموارد المحددة",
                          )
                        : t("Publish now", "Publier maintenant", "انشر الآن")}
                </Button>
              </div>
            </footer>
          </>
        )}
        {(drawer || reference) && (
          <div
            className={s.drawerBackdrop}
            onClick={() => {
              setDrawer(false);
              setReference(null);
            }}
          />
        )}
        {(drawer || reference) && (
          <aside
            className={s.drawer}
            data-creation-drawer
            aria-label={
              reference?.label ||
              t("Advanced settings", "Réglages avancés", "الإعدادات المتقدمة")
            }
          >
            {reference ? (
              <CreationReferencePicker
                key={reference.label + reference.type}
                request={reference}
                onClose={() => setReference(null)}
              />
            ) : (
              <>
                <div className={s.sectionHeading}>
                  <div>
                    <span className={s.eyebrow}>CONTENT 360</span>
                    <h3>
                      {t(
                        "Every capability, available",
                        "Toutes les capacités disponibles",
                        "جميع الإمكانات متاحة",
                      )}
                    </h3>
                  </div>
                  <button
                    className={s.iconButton}
                    onClick={() => setDrawer(false)}
                    aria-label={t("Close", "Fermer", "إغلاق")}
                  >
                    <Icon name="X" />
                  </button>
                </div>
                <label className={s.search}>
                  <Icon name="Search" />
                  <input
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder={t(
                      "Find a setting or collection",
                      "Trouver un réglage ou une collection",
                      "البحث عن إعداد أو مجموعة",
                    )}
                  />
                </label>
                <div className={s.otherCategories}>
                  {authoringFamilies(boot.settings).map((category) => (
                    <button
                      key={category.key}
                      onClick={() => {
                        start(category.key);
                        setDrawer(false);
                      }}
                      title={tr(category.name, locale)}
                    >
                      <Icon name={category.icon} size={17} />
                      <span>{tr(category.name, locale)}</span>
                    </button>
                  ))}
                </div>
                {f && (
                  <>
                    <details className={s.advancedSection} open>
                      <summary>
                        {t(
                          "Category settings",
                          "Réglages de la catégorie",
                          "إعدادات الفئة",
                        )}
                      </summary>
                      <div>
                        {f.fields
                          .filter(
                            (def) =>
                              visibleCreationField(def, record!) &&
                              (!drawerSearch ||
                                [def.key, ...def.label]
                                  .join(" ")
                                  .toLowerCase()
                                  .includes(drawerSearch.toLowerCase())),
                          )
                          .map((def) => fieldControl(def))}
                      </div>
                    </details>
                    {f.collections
                      .filter(
                        (c) =>
                          !drawerSearch ||
                          [
                            c.key,
                            ...c.label,
                            ...c.fields.flatMap((def) => [
                              def.key,
                              ...def.label,
                            ]),
                          ]
                            .join(" ")
                            .toLowerCase()
                            .includes(drawerSearch.toLowerCase()),
                      )
                      .map((c) => (
                        <details key={c.key} className={s.advancedSection}>
                          <summary>
                            {tr(c.label, locale)}{" "}
                            <span>{array(data[c.key]).length}</span>
                          </summary>
                          <div>
                            {nativeCollectionRows(c, true)}
                            <Button
                              icon="Plus"
                              disabled={busy}
                              onClick={() => addRow(c)}
                            >
                              {t(
                                "Add an item",
                                "Ajouter un élément",
                                "إضافة عنصر",
                              )}
                            </Button>
                          </div>
                        </details>
                      ))}
                  </>
                )}
                <Button
                  icon="PanelRightOpen"
                  disabled={busy}
                  onClick={() => void openExpert()}
                >
                  {t(
                    "Open the complete expert editor",
                    "Ouvrir l’éditeur expert complet",
                    "فتح المحرر المتخصص الكامل",
                  )}
                </Button>
              </>
            )}
          </aside>
        )}
      </div>
    </Dialog>
  );
}
function arrayLocales(value: unknown): Locale[] {
  return Array.isArray(value) ? value.filter(isLocale) : [];
}
