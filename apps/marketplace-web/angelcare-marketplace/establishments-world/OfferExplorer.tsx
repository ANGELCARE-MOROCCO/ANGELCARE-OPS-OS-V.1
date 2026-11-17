"use client";
import { usePartner, countText } from "./partner/Locale";
import { belongsToEstablishmentView } from "../storefront-placement/model";
import { JourneyLink } from "./JourneyLink";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  GitCompareArrows,
  Heart,
  ImageOff,
  Search,
  X,
  Grid2X2,
  List,
  SlidersHorizontal,
  Sparkles,
  Package,
  ArrowDown,
  BookOpen,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";
import type {
  DiscoveryItem,
  StorefrontExperience,
} from "../catalog-discovery/types";
import {
  businessItemHref,
  nativeAction,
  projection,
} from "../business-worlds/merchandising";
import { availabilityLabel } from "../storefront-immersive/contract";
import type { useSelections } from "../storefront-immersive/useSelections";
import {
  blocked,
  channel,
  decodeFilters,
  DEFAULT_FILTERS,
  filterOffers,
  offerSelection,
  price,
  publicFacets,
  type Selection,
} from "./model";
import type { View } from "./content";
import { useSessionValue } from "./useJourneyState";
import { Pagination } from "./ExplorerControls";
import s from "./journey.module.css";
import p from "./premium.module.css";
import c from "./commercial.module.css";
import r11 from "./EquipmentExplorerR11.module.css";
import { catalogueWindow } from "./catalogue-window";
export function OfferImage({ item }: { item: DiscoveryItem }) {
  const { t: tr, locale } = usePartner();

  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [item.media_url]);
  return item.media_url && !failed ? (
    <img
      src={item.media_url}
      alt={item.name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className={s.noImage}
      role="img"
      aria-label={tr("Visuel indisponible pour {0}").replace("{0}", item.name)}
    >
      <ImageOff size={25} />
      <span>{tr("Visuel à compléter")}</span>
    </div>
  );
}
const PRICE_LABELS: Record<string, string> = {
  all: "Tous les tarifs",
  quote_only: "Sur devis",
  fixed: "Prix fixe",
  starting_from: "À partir de",
  subscription: "Abonnement",
};
export function NativeExplorer({
  experience,
  view,
  selected,
  add,
  selections,
  onDetail,
}: {
  experience: StorefrontExperience;
  view: View;
  selected: string[];
  add: (selection: Selection) => void;
  selections: ReturnType<typeof useSelections>;
  onDetail: (item: DiscoveryItem) => void;
}) {
  const { t: tr, locale } = usePartner();
  const equipmentR11 = view === "produits";
  const [filtersOpen,setFiltersOpen] = useState(false);
  const [displayMode,setDisplayMode] = useState<"grid"|"list">("grid");
  const [compareExpanded,setCompareExpanded] = useState(false);

  const [filters, setFilters] = useSessionValue(
    `ac.establishments.filters.v3:${experience.territoryCode || "default"}:${view}`,
    DEFAULT_FILTERS,
    decodeFilters,
  );
  const q = useDeferredValue(filters.query);
  const channelItems = useMemo(
    () =>
      filters.scope === "all"
        ? experience.items
        : experience.items.filter((item) =>
            belongsToEstablishmentView(item, view),
          ),
    [experience.items, view, filters.scope],
  );
  const categories = [
    ...new Map(
      channelItems
        .filter((item) => item.category_key)
        .map((item) => [
          item.category_key!,
          item.category_title || item.category_key!,
        ]),
    ).entries(),
  ];
  const facets = useMemo(() => publicFacets(channelItems), [channelItems]);
  const activeFacet = facets.find((fact) => fact.key === filters.factKey);
  const category = categories.some(([key]) => key === filters.category)
    ? filters.category
    : "all";
  const availability = channelItems.some(
    (item) => item.availability_status === filters.availability,
  )
    ? filters.availability
    : "all";
  const factValue = activeFacet?.values.includes(filters.factValue)
    ? filters.factValue
    : "";
  const visible = useMemo(
    () =>
      filterOffers(experience.items, {
        ...filters,
        category,
        availability,
        factKey: activeFacet?.key || "",
        factValue,
        view: filters.scope === "all" ? "all" : view,
        query: q,
        savedIds: selections.saved,
      }),
    [
      experience.items,
      filters,
      category,
      availability,
      activeFacet?.key,
      factValue,
      view,
      q,
      selections.saved,
    ],
  );
  const [perPage, setPerPage] = useSessionValue(
    `ac.establishments.results.v3:${view}`,
    10,
    (value) => ([10, 20, 40].includes(Number(value)) ? Number(value) : 10),
  );
  const [expansion, setExpansion] = useState({ key: "", pages: 0 });
  const windowKey = JSON.stringify([
    view,
    experience.territoryCode,
    filters,
    category,
    availability,
    factValue,
    q,
    perPage,
    filters.savedOnly ? selections.saved : [],
    visible.map((item) => item.id),
  ]);
  const cataloguePage = catalogueWindow(
    visible.length,
    perPage,
    filters.page,
    expansion.key === windowKey ? expansion.pages : 0,
  );
  const { pages, page } = cataloguePage;
  const compared = channelItems.filter((item) =>
    selections.compared.includes(item.id),
  );
  const allCompared = experience.items.filter((item) =>
    selections.compared.includes(item.id),
  );
  const change = (next: Partial<typeof filters>) =>
    setFilters((previous) => ({ ...previous, ...next, page: 1 }));
  const chips = [
    ...(filters.query
      ? [
          {
            key: "query",
            label: `Recherche : ${filters.query}`,
            clear: () => change({ query: "" }),
          },
        ]
      : []),
    ...(category !== "all"
      ? [
          {
            key: "category",
            label:
              categories.find(([key]) => key === category)?.[1] || category,
            clear: () => change({ category: "all" }),
          },
        ]
      : []),
    ...(availability !== "all"
      ? [
          {
            key: "availability",
            label: availabilityLabel(
              { availability_status: availability } as DiscoveryItem,
              locale,
            ),
            clear: () => change({ availability: "all" }),
          },
        ]
      : []),
    ...(filters.priceMode !== "all"
      ? [
          {
            key: "price",
            label: PRICE_LABELS[filters.priceMode],
            clear: () => change({ priceMode: "all" }),
          },
        ]
      : []),
    ...(filters.savedOnly
      ? [
          {
            key: "saved",
            label: "Mes favoris",
            clear: () => change({ savedOnly: false }),
          },
        ]
      : []),
    ...(factValue
      ? [
          {
            key: "fact",
            label: `${activeFacet?.label} : ${factValue}`,
            clear: () => change({ factKey: "", factValue: "" }),
          },
        ]
      : []),
  ];
  return (
    <section
      id="ew-native-explorer"
      className={`${s.nativeExplorer} ${c.catalogue} ${equipmentR11?r11.r11Explorer:""}`}
      data-equipment-r11={equipmentR11?"true":"false"}
      data-r11-mode={displayMode}
      data-r11-filters={filtersOpen?"open":"closed"}
      aria-label={tr("Offres publiées du catalogue")}
    >
      {equipmentR11&&<div className={r11.commerceMasthead}>
        <div className={r11.commerceLead}><span><Sparkles size={17}/>{tr("ANGELCARE · CATALOGUE PROFESSIONNEL")}</span>
          <h2>{tr("Des produits qui donnent vie à vos projets.")}</h2>
          <p>{tr("Découvrez les offres réellement publiées pour les établissements. Comparez les caractéristiques, gardez vos favoris et préparez votre projet à votre rythme.")}</p>
          <div className={r11.commerceFacts}><span><Check size={16}/>{tr("Références publiées")}</span><span><BookOpen size={16}/>{tr("Des usages à découvrir")}</span><span><Heart size={16}/>{tr("Une sélection à votre rythme")}</span></div>
        </div>
        <div className={r11.commerceArt} aria-hidden="true"><div><Package size={35}/><span>{tr("ÉQUIPEMENTS")}</span></div><div><BookOpen size={30}/><span>{tr("PÉDAGOGIE")}</span></div><div><Sparkles size={30}/><span>{tr("IDENTITÉ")}</span></div></div>
      </div>}
      {equipmentR11&&<div className={r11.searchCommand}>
        <div className={r11.searchIntro}><span>{tr("RECHERCHE PROFESSIONNELLE")}</span><strong>{tr("Que recherchez-vous pour votre établissement ?")}</strong></div>
        <div className={r11.searchCommandRow}><label className={r11.searchMain}><Search size={22}/><input type="search" value={filters.query} onChange={e=>change({query:e.target.value})} placeholder={tr("Rechercher un produit, une référence ou un usage…")} aria-label={tr("Rechercher une offre publiée")}/>{filters.query&&<button type="button" aria-label={tr("Effacer la recherche")} onClick={()=>change({query:""})}><X size={17}/></button>}</label>
          <button type="button" className={r11.filterTrigger} aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(v=>!v)}><SlidersHorizontal size={18}/>{tr(filtersOpen?"Masquer les filtres":"Filtres avancés")}{chips.length>0?<span>{chips.length}</span>:null}</button>
        </div>
        <div className={r11.resultSummary}><span><strong>{countText(locale,visible.length)}</strong> {tr("offres correspondant à vos critères")}</span><div><button aria-label={tr("Affichage en grille")} aria-pressed={displayMode==="grid"} onClick={()=>setDisplayMode("grid")}><Grid2X2 size={18}/></button><button aria-label={tr("Affichage en liste")} aria-pressed={displayMode==="list"} onClick={()=>setDisplayMode("list")}><List size={19}/></button></div></div>
      </div>}
      <div className={s.nativeHeading} data-native-title>
        <div>
          <span className={s.eyebrow}>
            {tr("Vos critères. Des solutions à étudier.")}
          </span>
          <h3>
            {tr(
              view === "produits"
                ? "Les produits pour votre établissement"
                : "Nos offres pour votre établissement",
            )}
          </h3>
        </div>
        <span>
          {countText(locale, channelItems.length)}
          {tr(experience.territoryCode ? ` · ${experience.territoryCode}` : "")}
        </span>
      </div>
      <div className={`${s.catalogueScope} ${equipmentR11?r11.advancedPanel:""}`} data-catalogue-scope>
        <label className={s.selectLabel}>
          {tr("Affichage")}
          <select
            aria-label={tr("Affichage")}
            value={filters.scope}
            onChange={(event) =>
              change({
                scope: event.target.value as "speciality" | "all",
                category: "all",
                availability: "all",
                factKey: "",
                factValue: "",
              })
            }
          >
            <option value="speciality">{tr("Cette spécialité")}</option>
            <option value="all">
              {tr("Toutes les offres Établissements")}
            </option>
          </select>
        </label>
        <p>
          {tr(
            filters.scope === "all"
              ? "Retrouvez les différentes solutions Établissements et affinez votre sélection selon vos besoins."
              : "Vous pouvez élargir la sélection aux autres solutions Établissements, puis affiner vos critères.",
          )}
        </p>
      </div>
      <div className={`${s.toolbar} ${equipmentR11?r11.advancedPanel:""}`} data-native-toolbar>
        <label>
          <Search size={17} />
          <span className={s.sr}>{tr("Rechercher une offre publiée")}</span>
          <input
            value={filters.query}
            onChange={(event) => change({ query: event.target.value })}
            placeholder={tr("Produit, référence, usage…")}
          />
        </label>
        <label className={s.selectLabel}>
          {tr("Catégorie")}
          <select
            aria-label={tr("Catégorie")}
            value={category}
            onChange={(event) => change({ category: event.target.value })}
          >
            <option value="all">{tr("Toutes les catégories")}</option>
            {categories.map(([key, label]) => (
              <option key={key} value={key}>
                {tr(label)}
              </option>
            ))}
          </select>
        </label>
        <label className={s.selectLabel}>
          {tr("Disponibilité")}
          <select
            aria-label={tr("Disponibilité")}
            value={availability}
            onChange={(event) => change({ availability: event.target.value })}
          >
            <option value="all">{tr("Tous les statuts")}</option>
            {[
              ...new Set(channelItems.map((item) => item.availability_status)),
            ].map((status) => (
              <option key={status} value={status}>
                {tr(
                  availabilityLabel(
                    { availability_status: status } as DiscoveryItem,
                    locale,
                  ),
                )}
              </option>
            ))}
          </select>
        </label>
        <label className={s.selectLabel}>
          {tr("Tarification")}
          <select
            aria-label={tr("Tarification")}
            value={filters.priceMode}
            onChange={(event) => change({ priceMode: event.target.value })}
          >
            {Object.entries(PRICE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {tr(label)}
              </option>
            ))}
          </select>
        </label>
        <label className={s.selectLabel}>
          {tr("Trier")}
          <select
            aria-label={tr("Trier")}
            value={filters.sort}
            onChange={(event) => change({ sort: event.target.value })}
          >
            <option value="featured">{tr("Sélection éditoriale")}</option>
            <option value="name">{tr("Nom")}</option>
            <option value="price">{tr("Prix croissant")}</option>
          </select>
        </label>
      </div>
      {equipmentR11&&categories.length>0&&<section className={r11.categoryDiscovery}><div><span>{tr("DÉCOUVERTE PAR RAYON")}</span><h3>{tr("Trouvez les solutions qui vous ressemblent.")}</h3></div><div className={r11.categoryVisuals}>{categories.slice(0,8).map(([key,label],i)=><button key={key} type="button" aria-pressed={category===key} onClick={()=>change({category:category===key?"all":key})} data-tone={i%6}><span><Package size={21}/></span><strong>{tr(label)}</strong><small>{countText(locale,channelItems.filter(item=>item.category_key===key).length)} {tr("références")}</small><ChevronRight size={18}/></button>)}</div></section>}
      {categories.length > 1 && (
        <div
          className={s.categoryRail}
          data-native-categories
          role="group"
          aria-label={tr("Rayons du catalogue")}
        >
          <button
            aria-pressed={category === "all"}
            onClick={() => change({ category: "all" })}
          >
            {tr("Toutes les offres ")}
            <small>{channelItems.length}</small>
          </button>
          {categories.map(([key, label]) => (
            <button
              key={key}
              aria-pressed={category === key}
              onClick={() =>
                change({ category: category === key ? "all" : key })
              }
            >
              {tr(label)}
              <small>
                {
                  channelItems.filter((item) => item.category_key === key)
                    .length
                }
              </small>
            </button>
          ))}
        </div>
      )}
      <div className={`${s.explorerUtilities} ${equipmentR11?r11.advancedPanel:""}`} data-native-utilities>
        <button
          className={s.savedFilter}
          aria-pressed={filters.savedOnly}
          onClick={() => change({ savedOnly: !filters.savedOnly })}
        >
          <Heart size={15} />
          {tr("Mes favoris (")}
          {
            channelItems.filter((item) => selections.saved.includes(item.id))
              .length
          }
          {tr(")")}
        </button>
        {facets.length > 0 && (
          <>
            <label className={s.selectLabel}>
              {tr("Caractéristique publiée")}
              <select
                value={activeFacet?.key || ""}
                onChange={(event) =>
                  change({ factKey: event.target.value, factValue: "" })
                }
              >
                <option value="">{tr("Toutes les caractéristiques")}</option>
                {facets.map((fact) => (
                  <option key={fact.key} value={fact.key}>
                    {fact.label}
                  </option>
                ))}
              </select>
            </label>
            {activeFacet && (
              <label className={s.selectLabel}>
                {tr("Valeur recherchée")}
                <select
                  value={factValue}
                  onChange={(event) =>
                    change({ factValue: event.target.value })
                  }
                >
                  <option value="">{tr("Toutes les valeurs")}</option>
                  {activeFacet.values.map((value) => (
                    <option key={value}>{tr(value)}</option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}
        <label className={s.selectLabel}>
          {tr("Résultats par page")}
          <select
            aria-label={tr("Résultats par page")}
            value={perPage}
            onChange={(event) => {
              setPerPage(Number(event.target.value));
              change({});
            }}
          >
            {[10, 20, 40].map((value) => (
              <option key={value}>{tr(value)}</option>
            ))}
          </select>
        </label>
        <button
          className={s.textButton}
          onClick={() => setFilters({ ...DEFAULT_FILTERS })}
        >
          {tr("Réinitialiser")}
        </button>
      </div>
      {chips.length > 0 && (
        <div className={s.filterChips} aria-label={tr("Filtres appliqués")}>
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.clear}
              aria-label={tr(`Retirer le filtre ${chip.label}`)}
            >
              {tr(chip.label)}
              <X size={12} />
            </button>
          ))}
        </div>
      )}
      <p className={s.resultsStatus} role="status">
        {countText(locale, visible.length)}{" "}
        {tr(
          locale === "fr"
            ? visible.length > 1
              ? "correspondent à vos critères"
              : "correspond à vos critères"
            : "match your criteria",
        )}
      </p>
      {equipmentR11&&allCompared.length>0&&<div className={r11.compareEntry}><GitCompareArrows size={20}/><div><strong>{tr("Votre sélection comparative")}</strong><small>{countText(locale,allCompared.length)} {tr("références · maximum 4")}</small></div><button onClick={()=>setCompareExpanded(v=>!v)} aria-expanded={compareExpanded}>{tr(compareExpanded?"Masquer le comparatif":"Comparer les produits")}<ArrowRight size={17}/></button></div>}
      {allCompared.length > 0 && (!equipmentR11||compareExpanded) && (
        <div className={s.compareTray}>
          <GitCompareArrows size={19} />
          <strong>
            {tr("Comparaison ")}
            {allCompared.length}
            {tr("/4")}
          </strong>
          <div>
            {allCompared.map((item) => (
              <button
                key={item.id}
                disabled={selections.pending.includes(`compare:${item.id}`)}
                onClick={() => void selections.select(item.id, "compare")}
                aria-label={tr("Retirer {0} de la comparaison").replace(
                  "{0}",
                  item.name,
                )}
              >
                {item.name}
                <X size={12} />
              </button>
            ))}
          </div>
          <small>
            {compared.length}
            {tr(" dans cette spécialité")}
          </small>
        </div>
      )}
      <div className={`${s.nativeGrid} ${p.nativeGrid} ${equipmentR11?r11.productGrid:""}`} data-native-grid>
        {visible.slice(cataloguePage.start, cataloguePage.end).map((item) => {
          const info = projection(item),
            action = nativeAction(item, locale, experience.territoryCode),
            inProject = selected.includes(`offer:${item.id}`);
          return (
            <article
              key={item.id}
              className={`${s.nativeCard} ${p.nativeCard} ${equipmentR11?r11.productCard:""}`}
              data-offer-id={item.id}
              data-selected={inProject}
            >
              <button
                className={`${s.offerPicture} ${p.offerPicture}`}
                aria-label={tr("Aperçu de {0}").replace("{0}", item.name)}
                onClick={() => onDetail(item)}
              >
                <OfferImage item={item} />
                <span>
                  {tr("Aperçu rapide")}
                  <ArrowRight size={13} />
                </span>
              </button>
              <div>
                <span className={p.publishedTag}>
                  <Check size={11} />
                  {tr("Catalogue ·")}{" "}
                  {tr(
                    PRICE_LABELS[item.price_mode] || "Conditions à consulter",
                  )}
                </span>
                <br />
                <span className={s.cardEyebrow}>
                  {item.category_title || tr("Offre Établissements")}
                </span>
                <h3>
                  <Link
                    href={businessItemHref(
                      item,
                      locale,
                      experience.territoryCode,
                    )}
                    onClick={() => selections.remember(item.id)}
                  >
                    {item.name}
                  </Link>
                </h3>
                <small>{item.public_reference}</small>
                {item.short_description && <p>{item.short_description}</p>}
                <strong className={s.offerPrice}>
                  {tr(price(item, locale))}
                </strong>
                <span className={s.availability} data-blocked={blocked(item)}>
                  {tr(availabilityLabel(item, locale))}
                </span>
                <dl>
                  {info?.fields.slice(0, 3).map((fact) => (
                    <div key={fact.key}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className={s.cardActions}>
                  <button
                    aria-label={tr("Enregistrer {0}").replace("{0}", item.name)}
                    aria-pressed={selections.saved.includes(item.id)}
                    disabled={selections.pending.includes(`saved:${item.id}`)}
                    onClick={() => void selections.select(item.id, "saved")}
                  >
                    <Heart size={15} />
                  </button>
                  <button
                    aria-label={tr("Comparer {0}").replace("{0}", item.name)}
                    aria-pressed={selections.compared.includes(item.id)}
                    disabled={selections.pending.includes(`compare:${item.id}`)}
                    onClick={() => void selections.select(item.id, "compare")}
                  >
                    <GitCompareArrows size={15} />
                  </button>
                  <button
                    disabled={blocked(item) && !inProject}
                    aria-pressed={inProject}
                    onClick={() => add(offerSelection(item, locale))}
                  >
                    {inProject && <Check size={14} />}{" "}
                    {tr(inProject ? "Dans mon projet" : "Ajouter au projet")}
                  </button>
                </div>
                <button className={s.textButton} onClick={() => onDetail(item)}>
                  {tr("Voir les caractéristiques")}
                  <ArrowRight size={13} />
                </button>
                {action && !blocked(item) && (
                  <Link className={s.nativeLink} href={action.href}>
                    {tr(action.label)}
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <div className={s.empty}>
          <Search size={28} />
          <h3>
            {tr(
              channelItems.length
                ? "Aucune offre avec ces critères."
                : "Votre projet mérite une réponse adaptée.",
            )}
          </h3>
          <p>
            {tr(
              channelItems.length
                ? "Ajustez les filtres ; votre projet et vos comparaisons restent conservés."
                : "Aucune offre n’est actuellement publiée dans cette spécialité pour le territoire choisi. Décrivez votre besoin pour préparer un échange.",
            )}
          </p>
          {!channelItems.length &&
            filters.scope === "speciality" &&
            experience.items.length > 0 && (
              <button
                className={s.secondary}
                onClick={() => change({ scope: "all" })}
              >
                {tr("Explorer toutes les offres Établissements (")}
                {experience.items.length}
                {tr(")")}
              </button>
            )}
          {channelItems.length ? (
            <button
              className={s.secondary}
              onClick={() => setFilters({ ...DEFAULT_FILTERS })}
            >
              {tr("Voir toutes les offres")}
            </button>
          ) : (
            <JourneyLink className={s.primary} href="#world-enquiry">
              {tr("Présenter mon besoin")}
              <ArrowRight size={15} />
            </JourneyLink>
          )}
        </div>
      )}
      {cataloguePage.remaining > 0 && (
        <div className={c.loadMore}>
          <button
            onClick={() =>
              setExpansion((previous) => ({
                key: windowKey,
                pages: (previous.key === windowKey ? previous.pages : 0) + 1,
              }))
            }
          >
            {tr("Afficher ")}
            {countText(locale, cataloguePage.nextCount)}
            {tr(" de plus")} <ArrowRight size={16} />
          </button>
        </div>
      )}
      {visible.length > 0 && (
        <p className={c.displayed} role="status">
          {tr("Offres ")}
          {cataloguePage.start + 1}
          {tr(" à ")}
          {cataloguePage.end}
          {tr(" sur")} {visible.length}
          {tr(" · ")}
          {new Intl.NumberFormat(locale).format(cataloguePage.shown)}{" "}
          {tr(
            locale === "fr"
              ? cataloguePage.shown > 1
                ? "affichées"
                : "affichée"
              : "displayed",
          )}
        </p>
      )}
      <Pagination
        page={page}
        pages={pages}
        count={visible.length}
        onPage={(page) => setFilters((previous) => ({ ...previous, page }))}
        target="ew-native-explorer"
      />
      {selections.error && (
        <p role="alert" className={s.error}>
          {tr(
            selections.error === "limit"
              ? "La comparaison est limitée à quatre offres, toutes spécialités confondues. Retirez un élément de la sélection ci-dessus."
              : "La sélection native n’a pas pu être confirmée. Vous pouvez réessayer.",
          )}
          <button onClick={selections.dismiss}>{tr("Fermer")}</button>
        </p>
      )}
      {compared.length > 0 && (!equipmentR11||compareExpanded) && (
        <div className={`${s.comparison} ${equipmentR11?r11.comparisonStudio:""}`}>
          <h3>{tr("Comparer les offres publiées")}</h3>
          <div className={s.tableWrap}>
            <table>
              <caption>
                {tr(
                  "Caractéristiques renseignées dans les offres de cette spécialité",
                )}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{tr("Critère")}</th>
                  {compared.map((item) => (
                    <th scope="col" key={item.id}>
                      {item.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">{tr("Prix publié")}</th>
                  {compared.map((item) => (
                    <td key={item.id}>{tr(price(item, locale))}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">{tr("Disponibilité")}</th>
                  {compared.map((item) => (
                    <td key={item.id}>{tr(availabilityLabel(item, locale))}</td>
                  ))}
                </tr>
                {[
                  ...new Set(
                    compared.flatMap(
                      (item) =>
                        projection(item)?.fields.map((fact) => fact.key) || [],
                    ),
                  ),
                ].map((key) => (
                  <tr key={key}>
                    <th scope="row">
                      {tr(
                        compared
                          .flatMap((item) => projection(item)?.fields || [])
                          .find((fact) => fact.key === key)?.label,
                      )}
                    </th>
                    {compared.map((item) => (
                      <td key={item.id}>
                        {tr(
                          projection(item)?.fields.find(
                            (fact) => fact.key === key,
                          )?.value || "Non renseigné",
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
