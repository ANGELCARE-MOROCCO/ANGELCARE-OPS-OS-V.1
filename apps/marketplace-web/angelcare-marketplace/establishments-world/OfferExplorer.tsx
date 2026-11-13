"use client";
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
export function OfferImage({ item }: { item: DiscoveryItem }) {
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
      aria-label={`Visuel indisponible pour ${item.name}`}
    >
      <ImageOff size={25} />
      <span>Visuel à compléter</span>
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
        : experience.items.filter((item) => channel(item) === view),
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
  const pages = Math.max(1, Math.ceil(visible.length / perPage)),
    page = Math.min(filters.page, pages);
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
              "fr",
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
      className={s.nativeExplorer}
      aria-label="Offres publiées du catalogue"
    >
      <div className={s.nativeHeading}>
        <div>
          <span className={s.eyebrow}>
            Des offres réelles. Vos critères. Votre sélection.
          </span>
          <h3>
            {view === "produits"
              ? "Le catalogue publié"
              : "Offres actuellement publiées"}
          </h3>
        </div>
        <span>
          {channelItems.length} offre{channelItems.length > 1 ? "s" : ""}
          {experience.territoryCode ? ` · ${experience.territoryCode}` : ""}
        </span>
      </div>
      <div className={s.catalogueScope}>
        <label className={s.selectLabel}>
          Affichage
          <select
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
            <option value="speciality">Cette spécialité</option>
            <option value="all">Toutes les offres Établissements</option>
          </select>
        </label>
        <p>
          {filters.scope === "all"
            ? "Toutes les offres éligibles de ce storefront sont visibles, y compris les solutions B2B classées comme services."
            : "Besoin d’une solution classée autrement ? Élargissez aux offres Établissements, puis filtrez le catalogue."}
        </p>
      </div>
      <div className={s.toolbar}>
        <label>
          <Search size={17} />
          <span className={s.sr}>Rechercher une offre publiée</span>
          <input
            value={filters.query}
            onChange={(event) => change({ query: event.target.value })}
            placeholder="Produit, référence, usage…"
          />
        </label>
        <label className={s.selectLabel}>
          Catégorie
          <select
            value={category}
            onChange={(event) => change({ category: event.target.value })}
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={s.selectLabel}>
          Disponibilité
          <select
            value={availability}
            onChange={(event) => change({ availability: event.target.value })}
          >
            <option value="all">Tous les statuts</option>
            {[
              ...new Set(channelItems.map((item) => item.availability_status)),
            ].map((status) => (
              <option key={status} value={status}>
                {availabilityLabel(
                  { availability_status: status } as DiscoveryItem,
                  "fr",
                )}
              </option>
            ))}
          </select>
        </label>
        <label className={s.selectLabel}>
          Tarification
          <select
            value={filters.priceMode}
            onChange={(event) => change({ priceMode: event.target.value })}
          >
            {Object.entries(PRICE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={s.selectLabel}>
          Trier
          <select
            value={filters.sort}
            onChange={(event) => change({ sort: event.target.value })}
          >
            <option value="featured">Sélection éditoriale</option>
            <option value="name">Nom</option>
            <option value="price">Prix croissant</option>
          </select>
        </label>
      </div>
      {categories.length > 1 && (
        <div
          className={s.categoryRail}
          role="group"
          aria-label="Rayons du catalogue"
        >
          <button
            aria-pressed={category === "all"}
            onClick={() => change({ category: "all" })}
          >
            Toutes les offres <small>{channelItems.length}</small>
          </button>
          {categories.map(([key, label]) => (
            <button
              key={key}
              aria-pressed={category === key}
              onClick={() =>
                change({ category: category === key ? "all" : key })
              }
            >
              {label}
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
      <div className={s.explorerUtilities}>
        <button
          className={s.savedFilter}
          aria-pressed={filters.savedOnly}
          onClick={() => change({ savedOnly: !filters.savedOnly })}
        >
          <Heart size={15} />
          Mes favoris (
          {
            channelItems.filter((item) => selections.saved.includes(item.id))
              .length
          }
          )
        </button>
        {facets.length > 0 && (
          <>
            <label className={s.selectLabel}>
              Caractéristique publiée
              <select
                value={activeFacet?.key || ""}
                onChange={(event) =>
                  change({ factKey: event.target.value, factValue: "" })
                }
              >
                <option value="">Toutes les caractéristiques</option>
                {facets.map((fact) => (
                  <option key={fact.key} value={fact.key}>
                    {fact.label}
                  </option>
                ))}
              </select>
            </label>
            {activeFacet && (
              <label className={s.selectLabel}>
                Valeur recherchée
                <select
                  value={factValue}
                  onChange={(event) =>
                    change({ factValue: event.target.value })
                  }
                >
                  <option value="">Toutes les valeurs</option>
                  {activeFacet.values.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}
        <label className={s.selectLabel}>
          Résultats par page
          <select
            value={perPage}
            onChange={(event) => {
              setPerPage(Number(event.target.value));
              change({});
            }}
          >
            {[10, 20, 40].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button
          className={s.textButton}
          onClick={() => setFilters({ ...DEFAULT_FILTERS })}
        >
          Réinitialiser
        </button>
      </div>
      {chips.length > 0 && (
        <div className={s.filterChips} aria-label="Filtres appliqués">
          {chips.map((chip) => (
            <button
              key={chip.key}
              onClick={chip.clear}
              aria-label={`Retirer le filtre ${chip.label}`}
            >
              {chip.label}
              <X size={12} />
            </button>
          ))}
        </div>
      )}
      <p className={s.resultsStatus} role="status">
        {visible.length} offre{visible.length > 1 ? "s" : ""} correspond
        {visible.length > 1 ? "ent" : ""} à vos critères
      </p>
      {allCompared.length > 0 && (
        <div className={s.compareTray}>
          <GitCompareArrows size={19} />
          <strong>Comparaison {allCompared.length}/4</strong>
          <div>
            {allCompared.map((item) => (
              <button
                key={item.id}
                disabled={selections.pending.includes(`compare:${item.id}`)}
                onClick={() => void selections.select(item.id, "compare")}
                aria-label={`Retirer ${item.name} de la comparaison`}
              >
                {item.name}
                <X size={12} />
              </button>
            ))}
          </div>
          <small>{compared.length} dans cette spécialité</small>
        </div>
      )}
      <div className={`${s.nativeGrid} ${p.nativeGrid}`}>
        {visible.slice((page - 1) * perPage, page * perPage).map((item) => {
          const info = projection(item),
            action = nativeAction(item, "fr", experience.territoryCode),
            inProject = selected.includes(`offer:${item.id}`);
          return (
            <article
              key={item.id}
              className={`${s.nativeCard} ${p.nativeCard}`}
              data-offer-id={item.id}
              data-selected={inProject}
            >
              <button
                className={`${s.offerPicture} ${p.offerPicture}`}
                aria-label={`Aperçu de ${item.name}`}
                onClick={() => onDetail(item)}
              >
                <OfferImage item={item} />
                <span>
                  Aperçu rapide
                  <ArrowRight size={13} />
                </span>
              </button>
              <div>
                <span className={p.publishedTag}>
                  <Check size={11} />
                  Offre publiée ·{" "}
                  {PRICE_LABELS[item.price_mode] || "Conditions à consulter"}
                </span>
                <br />
                <span className={s.cardEyebrow}>
                  {item.category_title || "Offre Établissements"}
                </span>
                <h3>
                  <Link
                    href={businessItemHref(
                      item,
                      "fr",
                      experience.territoryCode,
                    )}
                    onClick={() => selections.remember(item.id)}
                  >
                    {item.name}
                  </Link>
                </h3>
                <small>{item.public_reference}</small>
                {item.short_description && <p>{item.short_description}</p>}
                <strong className={s.offerPrice}>{price(item)}</strong>
                <span className={s.availability} data-blocked={blocked(item)}>
                  {availabilityLabel(item, "fr")}
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
                    aria-label={`Enregistrer ${item.name}`}
                    aria-pressed={selections.saved.includes(item.id)}
                    disabled={selections.pending.includes(`saved:${item.id}`)}
                    onClick={() => void selections.select(item.id, "saved")}
                  >
                    <Heart size={15} />
                  </button>
                  <button
                    aria-label={`Comparer ${item.name}`}
                    aria-pressed={selections.compared.includes(item.id)}
                    disabled={selections.pending.includes(`compare:${item.id}`)}
                    onClick={() => void selections.select(item.id, "compare")}
                  >
                    <GitCompareArrows size={15} />
                  </button>
                  <button
                    disabled={blocked(item) && !inProject}
                    aria-pressed={inProject}
                    onClick={() => add(offerSelection(item))}
                  >
                    {inProject && <Check size={14} />}{" "}
                    {inProject ? "Dans mon projet" : "Ajouter au projet"}
                  </button>
                </div>
                <button className={s.textButton} onClick={() => onDetail(item)}>
                  Voir les caractéristiques
                  <ArrowRight size={13} />
                </button>
                {action && !blocked(item) && (
                  <Link className={s.nativeLink} href={action.href}>
                    {action.label}
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
            {channelItems.length
              ? "Aucune offre avec ces critères."
              : "Votre projet mérite une réponse adaptée."}
          </h3>
          <p>
            {channelItems.length
              ? "Ajustez les filtres ; votre projet et vos comparaisons restent conservés."
              : "Aucune offre n’est actuellement publiée dans cette spécialité pour le territoire choisi. Décrivez votre besoin pour préparer un échange."}
          </p>
          {!channelItems.length &&
            filters.scope === "speciality" &&
            experience.items.length > 0 && (
              <button
                className={s.secondary}
                onClick={() => change({ scope: "all" })}
              >
                Explorer toutes les offres Établissements (
                {experience.items.length})
              </button>
            )}
          {channelItems.length ? (
            <button
              className={s.secondary}
              onClick={() => setFilters({ ...DEFAULT_FILTERS })}
            >
              Voir toutes les offres
            </button>
          ) : (
            <JourneyLink className={s.primary} href="#world-enquiry">
              Présenter mon besoin
              <ArrowRight size={15} />
            </JourneyLink>
          )}
        </div>
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
          {selections.error === "limit"
            ? "La comparaison est limitée à quatre offres, toutes spécialités confondues. Retirez un élément de la sélection ci-dessus."
            : "La sélection native n’a pas pu être confirmée. Vous pouvez réessayer."}
          <button onClick={selections.dismiss}>Fermer</button>
        </p>
      )}
      {compared.length > 0 && (
        <div className={s.comparison}>
          <h3>Comparer les offres publiées</h3>
          <div className={s.tableWrap}>
            <table>
              <caption>
                Caractéristiques renseignées dans les offres de cette spécialité
              </caption>
              <thead>
                <tr>
                  <th scope="col">Critère</th>
                  {compared.map((item) => (
                    <th scope="col" key={item.id}>
                      {item.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Prix publié</th>
                  {compared.map((item) => (
                    <td key={item.id}>{price(item)}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Disponibilité</th>
                  {compared.map((item) => (
                    <td key={item.id}>{availabilityLabel(item, "fr")}</td>
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
                      {
                        compared
                          .flatMap((item) => projection(item)?.fields || [])
                          .find((fact) => fact.key === key)?.label
                      }
                    </th>
                    {compared.map((item) => (
                      <td key={item.id}>
                        {projection(item)?.fields.find(
                          (fact) => fact.key === key,
                        )?.value || "Non renseigné"}
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
