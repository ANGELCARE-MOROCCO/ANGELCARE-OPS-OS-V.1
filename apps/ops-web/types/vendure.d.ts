declare module '@vendure/core' {
  export const DefaultJobQueuePlugin: any
  export const DefaultSchedulerPlugin: any
  export const DefaultSearchPlugin: any
  export const dummyPaymentHandler: any
  export const LanguageCode: any
  export type VendureConfig = any
  export function bootstrap(config: any): Promise<any>
  export function runMigrations(config: any): Promise<any>
  export function bootstrapWorker(config: any): Promise<any>
}

declare module '@vendure/asset-server-plugin' {
  export const AssetServerPlugin: any
}

declare module '@vendure/dashboard/plugin' {
  export const DashboardPlugin: any
}

declare module '@vendure/email-plugin' {
  export const defaultEmailHandlers: any
  export const EmailPlugin: any
  export const FileBasedTemplateLoader: any
}

declare module '@vendure/graphiql-plugin' {
  export const GraphiqlPlugin: any
}

