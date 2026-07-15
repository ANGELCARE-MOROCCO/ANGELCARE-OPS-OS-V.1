import { escapeHtml } from '../http/responses';
import template from './dist-index';
import type { AppEnv } from '../types';

export function renderDashboard(env: AppEnv) {
  return template.replace('__SHOP_DOMAIN__', escapeHtml(env.SHOPIFY_SHOP_DOMAIN || ''));
}
