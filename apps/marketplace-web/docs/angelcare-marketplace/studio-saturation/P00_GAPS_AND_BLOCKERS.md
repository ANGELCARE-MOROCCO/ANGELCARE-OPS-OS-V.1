# P00 — GAPS AND BLOCKERS

## G01 — Source registry (P0)

**Current:** Studio picker data exposes media/categories/collections only

**Required:** Universal canonical source registry over all public-safe Marketplace authorities

**Owner patch:** P01

## G02 — Picker UX (P0)

**Current:** Basic HTML selects + raw text fields

**Required:** Searchable visual/hierarchical universal pickers with hidden IDs

**Owner patch:** P02

## G03 — Actions (P0)

**Current:** primaryCtaHref/secondaryCtaHref and item hrefs are raw text URLs

**Required:** Typed action descriptors resolved by canonical action registry

**Owner patch:** P03

## G04 — Template assignment (P0)

**Current:** Category-Native schema contains template fields but public item routes render AdaptiveExperience directly

**Required:** Deterministic item/context/schema/category/family/default Studio template resolver

**Owner patch:** P04

## G05 — Live bindings (P0)

**Current:** Studio blocks mostly own authored props; commerce blocks query discovery ad hoc

**Required:** Typed live binding engine to canonical fields/read models

**Owner patch:** P05

## G06 — Dynamic sources (P0)

**Current:** product_grid/category and collection_rail are special cases

**Required:** Unified dynamic content source descriptor for homepage/landing sections

**Owner patch:** P06

## G07 — Forms/conversion (P0)

**Current:** Canonical PublicInquiryForm and Conversion Universe exist outside universal Studio action/form semantics

**Required:** Workflow-backed Studio forms/actions routed to existing engines

**Owner patch:** P07

## G08 — Runtime (P0)

**Current:** CMS Studio runtime and Category-Native runtime are both native but not unified by a template/action resolver

**Required:** One orchestration resolver across preview/public/item/action contexts

**Owner patch:** P08

## G09 — Attribution (P1)

**Current:** Source route/session exists in several engines; Studio page/template/block/CTA provenance is not universal

**Required:** Origin metadata propagated to conversions/admin/analytics

**Owner patch:** P09

## G10 — Admin trust (P1)

**Current:** Admin sees fields/URLs but not standardized action consequence chain

**Required:** Trust Inspector showing source, validation, creates, admin destination, permissions

**Owner patch:** P10

## G11 — Governance (P0)

**Current:** Strong per-core governance exists

**Required:** Unified fail-closed policies for source/action/template/binding resolution

**Owner patch:** P11

## G12 — Dependency invalidation (P1)

**Current:** Experience Core dependencies exist mainly for CMS revisions/templates/symbols

**Required:** Extend dependency graph to live source bindings/template assignments/action targets and cache invalidation

**Owner patch:** P12

## G13 — Developer contract (P1)

**Current:** Studio developer contract exists but does not enumerate total Marketplace source/action/template universe

**Required:** Machine-readable source/action/template/binding/workflow registries + anti-shadow invariants

**Owner patch:** P13

## Blocking conclusion

No backend authority blocker prevents P01 from beginning. The blockers are integration contracts, not missing core commerce systems.
