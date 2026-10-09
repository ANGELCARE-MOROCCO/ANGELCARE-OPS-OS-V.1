// families-gateway-r2/verification/installer-fixture/apps/marketplace-web/angelcare-marketplace/homepage-living-marketplace/world.ts
var LIVING_MARKETPLACE_WORLD_ID = "ac.homepage.living-marketplace.hyper-commerce.02";
var LIVING_MARKETPLACE_WORLD_REVISION = 2;
var LIVING_MARKETPLACE_COMPONENT_TYPE = "ac_home_pro_max_living_world_02";
var LIVING_MARKETPLACE_REFERENCE_IMAGE = "/angelcare-marketplace/studio/homepage-pro-max/world-01-reference.png";
var LIVING_MARKETPLACE_REFERENCE_SHA256 = "37a379977685225be5313d10b73ca12c4c0621daccce7ea5cb03ea992f4c7f6d";
function isLivingMarketplaceComponent(component) {
  const props = component.props && typeof component.props === "object" ? component.props : {};
  if (props.hidden === true) return false;
  return component.type === LIVING_MARKETPLACE_COMPONENT_TYPE || component.type === "homepage_world" && props.worldId === LIVING_MARKETPLACE_WORLD_ID;
}
function livingMarketplaceComponentInData(data) {
  return data.content?.find(isLivingMarketplaceComponent) || null;
}
var clone = (value) => JSON.parse(JSON.stringify(value));
function buildLivingMarketplaceWorld02Data(current, mode = "replace") {
  const root = current?.root ? clone(current.root) : { props: {} };
  const rootProps = root?.props || {};
  const preservedRootProps = {};
  for (const key of ["title", "locale", "pageId"]) {
    const value = rootProps[key];
    if (typeof value === "string" && value) preservedRootProps[key] = value;
  }
  const marker = {
    worldId: LIVING_MARKETPLACE_WORLD_ID,
    revision: LIVING_MARKETPLACE_WORLD_REVISION,
    visualAuthority: "source-owned",
    dataAuthority: "canonical-marketplace-runtime",
    shellBoundary: "global-header-nav-footer-untouched",
    referenceSha256: LIVING_MARKETPLACE_REFERENCE_SHA256
  };
  const component = {
    type: LIVING_MARKETPLACE_COMPONENT_TYPE,
    props: {
      id: "home-living-marketplace-world-02",
      worldId: LIVING_MARKETPLACE_WORLD_ID,
      worldRevision: LIVING_MARKETPLACE_WORLD_REVISION,
      referenceImage: LIVING_MARKETPLACE_REFERENCE_IMAGE,
      density: "maximum",
      compositionMode: "hardcoded-source-owned",
      dataMode: "canonical-live",
      shellMode: "body-only",
      hidden: false,
      locked: true,
      responsive: { mobileVisible: true, tabletVisible: true, desktopVisible: true }
    }
  };
  const existing = Array.isArray(current?.content) ? clone(current.content) : [];
  const content = mode === "append" ? [...existing, component] : [component];
  const nextRoot = mode === "replace" ? { props: { ...preservedRootProps, __homepageLivingMarketplaceWorld: marker } } : { ...root, props: { ...rootProps, __homepageLivingMarketplaceWorld: marker } };
  return { content, root: nextRoot };
}
var LIVING_MARKETPLACE_WORLD_02 = {
  id: LIVING_MARKETPLACE_WORLD_ID,
  label: "AngelCare Living Marketplace \u2014 Hyper-Commerce 02",
  description: "Homepage World 02 \xB7 24 exp\xE9riences commerciales distinctes \xB7 d\xE9couverte interactive \xB7 m\xE9dias complets \xB7 FR/EN/AR \xB7 catalogue canonique \xB7 parcours existants.",
  experienceVersion: "r4-complete",
  revision: LIVING_MARKETPLACE_WORLD_REVISION,
  componentType: LIVING_MARKETPLACE_COMPONENT_TYPE,
  referenceImage: LIVING_MARKETPLACE_REFERENCE_IMAGE,
  referenceSha256: LIVING_MARKETPLACE_REFERENCE_SHA256,
  build: buildLivingMarketplaceWorld02Data
};
export {
  LIVING_MARKETPLACE_COMPONENT_TYPE,
  LIVING_MARKETPLACE_REFERENCE_IMAGE,
  LIVING_MARKETPLACE_REFERENCE_SHA256,
  LIVING_MARKETPLACE_WORLD_02,
  LIVING_MARKETPLACE_WORLD_ID,
  LIVING_MARKETPLACE_WORLD_REVISION,
  buildLivingMarketplaceWorld02Data,
  isLivingMarketplaceComponent,
  livingMarketplaceComponentInData
};
