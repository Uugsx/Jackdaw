import { siteRoot } from "../build";

/**
 * Публичная конфигурация биллинга.
 *
 * Платёжные реквизиты и ключи подписи лицензий должны храниться на сервере
 * биллинга. Десктопный клиент получает от него только подписанное право доступа.
 */
export const BILLING_PROVIDER = "YooKassa";
export const BILLING_PLANS_URL = `${siteRoot}#plans`;

/**
 * Намеренно не задано до развёртывания сервиса лицензий в продакшене.
 * Явное значение не позволяет интерфейсу считать сбой запроса биллинга
 * действующей подпиской Pro.
 */
export const BILLING_LICENSE_API_URL: string | null = null;

export const BILLING_SERVER_CONFIGURED = BILLING_LICENSE_API_URL != null;

export const PRO_FEATURE_KEYS = [
  "reports",
  "live-sla",
  "working-hours",
  "reminders",
  "html-export",
] as const;

export type ProFeatureKey = (typeof PRO_FEATURE_KEYS)[number];
