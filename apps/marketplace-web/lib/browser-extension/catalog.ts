import b2bContract from './generated/b2b-capabilities.v1.json'
import moduleCatalog from './generated/module-catalog.v1.json'
export const B2B_EXTENSION_CONTRACT = b2bContract
export const BROWSER_EXTENSION_MODULES = moduleCatalog.modules
export const B2B_CAPABILITY_KEYS = new Set(b2bContract.capabilities.map((item) => item.permission))
export type BrowserExtensionModuleKey = (typeof moduleCatalog.modules)[number]['key']
