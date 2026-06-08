import type { IncomingMessage, ServerResponse } from 'node:http';

export interface KvListResult {
  keys?: Array<{ name: string }>;
  list_complete?: boolean;
  cursor?: string;
}

export interface KvNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete?(key: string): Promise<void>;
  list?(options?: { prefix?: string; cursor?: string }): Promise<KvListResult>;
}

export interface AppEnv {
  [key: string]: string | KvNamespaceLike | undefined;
  PORT: string;
  HOST: string;
  NODE_ENV: string;
  SHOPIFY_APP_NAME: string;
  SHOPIFY_APP_HANDLE: string;
  SHOPIFY_API_VERSION: string;
  SHOPIFY_SCOPES: string;
  SHOPIFY_TOKEN_GRANT: string;
  SHOPIFY_OMIT_AUTH_SCOPES: string;
  SHOPIFY_EMBEDDED: string;
  SHOPIFY_APP_CONFIG: string;
  SHOPIFY_AUTOMATICALLY_UPDATE_URLS_ON_DEV: string;
  SHOPIFY_WEBHOOK_PATH: string;
  SHOPIFY_WEBHOOK_TOPICS: string;
  SHOPIFY_WEBHOOK_COMPLIANCE_TOPICS: string;
  DASHBOARD_USERNAME: string;
  DASHBOARD_PASSWORD: string;
  DASHBOARD_API_KEY: string;
  APP_URL: string;
  CORS_ORIGIN: string;
  DATA_DIR: string;
  ALLOW_UNSIGNED_WEBHOOKS: string;
  SHOPIFY_CLIENT_ID: string;
  SHOPIFY_CLIENT_SECRET: string;
  SHOPIFY_SHOP_DOMAIN: string;
  SHOPIFY_ACCESS_TOKEN: string;
  SHOPIFY_WEBHOOK_URI?: string;
  TRAFFIC_EVENT_LIMIT?: string;
  WEBHOOK_EVENT_LIMIT?: string;
  CLOUDFLARE_WORKER?: string;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_API_KEY?: string;
  ANGELCARE_KV?: KvNamespaceLike;
  SHOPIFY_APP_KV?: KvNamespaceLike;
  SHOPIFY_TOKENS?: KvNamespaceLike;
}

export type EnvOverrides = Partial<AppEnv> | ((req: IncomingMessage) => Partial<AppEnv>);

export interface RequestHandlerOptions {
  envPath?: string;
  envOverrides?: EnvOverrides;
}

export type NodeRequest = IncomingMessage;
export type NodeResponse = ServerResponse;
export type JsonObject = Record<string, unknown>;
export type AnyRecord = Record<string, any>;
