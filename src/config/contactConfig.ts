export type ContactDeliveryMode = 'mailto' | 'formsubmit' | 'webhook';

export interface ContactConfig {
  recipientEmail: string;
  deliveryMode: ContactDeliveryMode;
  webhookUrl: string;
}

const STORAGE_KEY = 'agp_contact_config_v1';

export const ENV_DEFAULT_CONTACT_EMAIL =
  (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() || '';

export const ENV_DEFAULT_WEBHOOK_URL =
  (import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined)?.trim() || '';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isSafeHttpsUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getDefaultContactConfig(): ContactConfig {
  const hasWebhook = isSafeHttpsUrl(ENV_DEFAULT_WEBHOOK_URL);
  return {
    recipientEmail: ENV_DEFAULT_CONTACT_EMAIL,
    deliveryMode: hasWebhook ? 'webhook' : 'mailto',
    webhookUrl: hasWebhook ? ENV_DEFAULT_WEBHOOK_URL : '',
  };
}

export function loadContactConfig(): ContactConfig {
  const fallback = getDefaultContactConfig();
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ContactConfig>;

    const recipientEmail =
      typeof parsed.recipientEmail === 'string' && parsed.recipientEmail.trim()
        ? parsed.recipientEmail.trim()
        : fallback.recipientEmail;

    const deliveryMode: ContactDeliveryMode =
      parsed.deliveryMode === 'formsubmit' ||
      parsed.deliveryMode === 'webhook' ||
      parsed.deliveryMode === 'mailto'
        ? parsed.deliveryMode
        : fallback.deliveryMode;

    const webhookUrl =
      typeof parsed.webhookUrl === 'string' ? parsed.webhookUrl.trim() : fallback.webhookUrl;

    return {
      recipientEmail,
      deliveryMode,
      webhookUrl,
    };
  } catch {
    return fallback;
  }
}

export function saveContactConfig(config: ContactConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function clearStoredContactConfig(): ContactConfig {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
  return getDefaultContactConfig();
}
