import type { BootstrapModule } from '../types.js'
export type ModuleRuntime = { mount(container: HTMLElement, module: BootstrapModule): void; unmount?(): void }
